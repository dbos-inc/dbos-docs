---
sidebar_position: 20
title: Steps
---

When using DBOS workflows, you should call any method that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

A step can return any serializable value and may throw checked or unchecked exceptions.
DBOS provides two ways to declare steps: [`runStep`](../reference/workflows-steps.md#runstep) for inline lambdas, and the [`@Step`](../reference/workflows-steps.md#step) annotation for named methods.

## runStep

Use [`runStep`](../reference/workflows-steps.md#runstep) to run an inline lambda as a checkpointed step directly inside a workflow method.

Here's a simple example:

```java
class ExampleImpl implements Example {
    @Workflow
    public int workflowFunction(int n) {
        int randomNumber = DBOS.runStep(
            () -> ThreadLocalRandom.current().nextInt(n), // generate a random number as a checkpointed step
            "generateRandomNumber" // A name for the step
        );
        return randomNumber;
    }
}
```

## `@Step` Annotation

Use the [`@Step`](../reference/workflows-steps.md#step) annotation to declare a method as a step.
Annotated steps must be called through a DBOS proxy — calling them directly on the implementation bypasses DBOS and the call will not be checkpointed.

You can define steps and workflows on the same interface.
In that case, the workflow must call step methods through a proxy reference (often called `self`) rather than `this`:

```java
interface Example {
    int workflowFunction(int n);
    int generateRandomNumber(int n);
}

class ExampleImpl implements Example {
    private Example self; // proxy reference for calling @Step methods

    public void setSelf(Example self) { this.self = self; }

    @Workflow
    public int workflowFunction(int n) {
        return self.generateRandomNumber(n); // must call through proxy, not this
    }

    @Step
    public int generateRandomNumber(int n) {
        return ThreadLocalRandom.current().nextInt(n);
    }
}

// Setup:
ExampleImpl impl = new ExampleImpl();
Example proxy = dbos.registerProxy(Example.class, impl);
impl.setSelf(proxy);
```

You can also put steps on a separate interface, which is useful when multiple workflows share the same set of steps:

```java
interface StepService {
    int generateRandomNumber(int n);
}

class StepServiceImpl implements StepService {
    @Step
    public int generateRandomNumber(int n) {
        return ThreadLocalRandom.current().nextInt(n);
    }
}

class ExampleImpl implements Example {
    private final StepService steps;

    public ExampleImpl(StepService steps) {
        this.steps = steps;
    }

    @Workflow
    public int workflowFunction(int n) {
        return steps.generateRandomNumber(n);
    }
}

// Setup:
StepService stepsProxy = dbos.registerProxy(StepService.class, new StepServiceImpl());
Example proxy = dbos.registerProxy(Example.class, new ExampleImpl(stepsProxy));
```

## When to Make Something a Step

You should make a method a step if you're using it in a DBOS workflow and it performs a [**nondeterministic**](./workflow-tutorial.md#determinism) operation.
A nondeterministic operation is one that may return different outputs given the same inputs.
Common nondeterministic operations include:

- Accessing an external API or service, like serving a file from [AWS S3](https://aws.amazon.com/s3/), calling an external API like [Stripe](https://stripe.com/), or accessing an external data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).
- Accessing files on disk.
- Generating a random number.
- Getting the current time.

You **cannot** call, start, or enqueue workflows from within steps.
These operations should be performed from workflow methods.
You can call one step from another step, but the called step becomes part of the calling step's execution rather than functioning as a separate step.

## Configurable Retries

You can optionally configure a step to automatically retry any error a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.

### With `runStep`

Retries are configurable through `StepOptions` passed to `runStep`.
Available options include:
- [`withMaxAttempts`](../reference/workflows-steps.md#runstep) - Maximum number of times this step is automatically retried on failure.
- [`withRetryInterval`](../reference/workflows-steps.md#runstep) - Initial delay between retries in seconds.
- [`withBackoffRate`](../reference/workflows-steps.md#runstep) - Exponential backoff multiplier between retries.

For example, let's write a step that fetches a website, and configure it to retry failures (such as if the site to be fetched is temporarily down) up to 10 times:

```java
class ExampleImpl implements Example {

    private String fetchStep(String url) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .build();

        HttpResponse<String> response = client.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        return response.body();
    }

    @Workflow
    public String fetchWorkflow(String inputURL) throws Exception {
        return DBOS.runStep(
            () -> fetchStep(inputURL),
            new StepOptions("fetchStep")
                .withMaxAttempts(10)
                .withRetryInterval(Duration.ofMillis(500))
                .withBackoffRate(2.0)
        );
    }
}
```

### With `@Step`

The same retry options are available as annotation parameters:

```java
interface Example {
    String fetchWorkflow(String inputURL) throws Exception;
    String fetchStep(String url) throws Exception;
}

class ExampleImpl implements Example {
    private Example self;

    public void setSelf(Example self) { this.self = self; }

    @Workflow
    public String fetchWorkflow(String inputURL) throws Exception {
        return self.fetchStep(inputURL);
    }

    @Step(
        maxAttempts = 10,
        intervalSeconds = 0.5,
        backOffRate = 2.0
    )
    public String fetchStep(String url) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .build();

        HttpResponse<String> response = client.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        return response.body();
    }
}
```

If a step exhausts all retry attempts, it throws an exception to the calling workflow.
