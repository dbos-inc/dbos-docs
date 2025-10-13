---
sidebar_position: 20
title: Steps
---

When using DBOS workflows, you should call any method that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

You can use [`runStep`](../reference/workflows-steps.md#runstep) to call a method as a step.
A step can return any serializable value and may throw checked or unchecked exceptions.

Here's a simple example:

```java
class ExampleImpl implements Example {

    private int generateRandomNumber(int n) {
        return new Random().nextInt(n);
    }

    @Workflow(name = "workflowFunction")
    public int workflowFunction(int n) {
        int randomNumber = DBOS.runStep(
            () -> generateRandomNumber(n),
            new StepOptions("generateRandomNumber")
        );
        return randomNumber;
    }
}
```

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
Retries are configurable through step options that can be passed to `runStep`.

Available retry configuration options include:
- [`withRetriesAllowed`](../reference/workflows-steps.md#runstep) - Whether to retry the step if it throws an exception (default: false).
- [`withMaxAttempts`](../reference/workflows-steps.md#runstep) - Maximum number of times this step is automatically retried on failure.
- [`withIntervalSeconds`](../reference/workflows-steps.md#runstep) - Initial delay between retries in seconds.
- [`withBackoffRate`](../reference/workflows-steps.md#runstep) - Exponential backoff multiplier between retries.

For example, let's configure this step to retry failures (such as if the site to be fetched is temporarily down) up to 10 times:

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

    @Workflow(name = "fetchWorkflow")
    public String fetchWorkflow(String inputURL) throws Exception {
        return DBOS.runStep(
            () -> fetchStep(inputURL),
            new StepOptions("fetchFunction")
                .withRetriesAllowed(true)
                .withMaxAttempts(10)
                .withIntervalSeconds(0.5)
                .withBackoffRate(2.0)
        );
    }
}
```

If a step exhausts all retry attempts, it throws an exception to the calling workflow.
