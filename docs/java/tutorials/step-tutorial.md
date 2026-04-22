---
sidebar_position: 20
title: Steps
---

When using DBOS workflows, you should call any method that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

There are two ways to define steps: inline with `dbos.runStep()`, or by annotating a method with `@Step`.

## Inline Steps with `runStep`

Use `dbos.runStep(lambda, name)` for one-off steps defined inline in the workflow body:

```java
class ExampleImpl implements Example {
    private final DBOS dbos;

    public ExampleImpl(DBOS dbos) { this.dbos = dbos; }

    private int generateRandomNumber(int n) {
        return new Random().nextInt(n);
    }

    @Workflow
    public int workflowFunction(int n) {
        int result = dbos.runStep(
            () -> generateRandomNumber(n),  // step body
            "generateRandomNumber"          // step name — must be unique within the workflow
        );
        return result;
    }
}
```

The step name must be unique within the workflow so DBOS can checkpoint and replay it correctly.

## Reusable Steps with `@Step`

For steps called from multiple workflows, annotate the method with `@Step` instead of wrapping it in a lambda each time.
The annotation is placed on the **implementation class**, not the interface.

```java
interface Example {
    String fetchWorkflow(String url);
}

class ExampleImpl implements Example {
    private final DBOS dbos;

    public ExampleImpl(DBOS dbos) { this.dbos = dbos; }

    @Step(name = "fetchPage")
    public String fetchPage(String url) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).build();
        return client.send(request, HttpResponse.BodyHandlers.ofString()).body();
    }

    @Workflow
    public String fetchWorkflow(String url) throws Exception {
        return proxy.fetchPage(url);  // called via proxy, not this.fetchPage()
    }
}
```

:::warning Call steps through the proxy
`@Step` methods are only intercepted when called through the proxy object returned by `dbos.registerProxy(...)`.
A direct `this.fetchPage(url)` call inside the workflow body runs outside DBOS and is not checkpointed.
Store a reference to the proxy and call through it.
:::

```java
DBOS dbos = new DBOS(config);
ExampleImpl impl = new ExampleImpl(dbos);
Example proxy = dbos.registerProxy(Example.class, impl);
impl.setProxy(proxy);  // store proxy on impl so @Workflow methods can call @Step methods through it
dbos.launch();
```

The step name defaults to the method name if `@Step(name=...)` is not specified.

## When to Use Each Approach

| | `runStep` | `@Step` |
|---|---|---|
| Defined inline in the workflow | Yes | No |
| Reusable across multiple workflows | No | Yes |
| Can capture local variables | Yes | No |
| Visible in class interface | No | Optional |

## What to Make a Step

Make a method a step if it performs a [**nondeterministic**](./workflow-tutorial.md#determinism) operation:

- Accessing an external API or service (Stripe, S3, Elasticsearch, etc.)
- Reading or writing files on disk
- Generating a random number
- Getting the current time

You **cannot** call, start, or enqueue workflows from within steps.
You can call one step from another, but the inner call becomes part of the outer step's execution rather than a separate checkpoint.

## Configurable Retries

Both `runStep` and `@Step` support automatic retries with exponential backoff, useful for handling transient failures like flaky API calls.

### Retries with `StepOptions`

Pass a `StepOptions` to `runStep` with `withMaxAttempts(n)` — any value greater than 1 enables retries:

```java
@Workflow
public String fetchWorkflow(String url) throws Exception {
    return dbos.runStep(
        () -> fetchPage(url),
        new StepOptions("fetchPage")
            .withMaxAttempts(10)
            .withRetryInterval(Duration.ofMillis(500))
            .withBackoffRate(2.0)
    );
}
```

### Retries with `@Step`

Configure retries directly on the annotation:

```java
@Step(
    name = "fetchPage",
    retriesAllowed = true,
    maxAttempts = 10,
    intervalSeconds = 0.5,
    backOffRate = 2.0
)
public String fetchPage(String url) throws Exception { ... }
```

### Retry options

| Option | `StepOptions` method | `@Step` parameter | Default |
|--------|---------------------|-------------------|---------|
| Enable retries | `withMaxAttempts(n > 1)` | `retriesAllowed = true` | No retries |
| Max attempts | `withMaxAttempts(int)` | `maxAttempts` | 3 (when enabled) |
| Initial delay | `withRetryInterval(Duration)` | `intervalSeconds` | 1 second |
| Backoff multiplier | `withBackoffRate(double)` | `backOffRate` | 2.0 |

If a step exhausts all retry attempts, it throws an exception to the calling workflow.

See the [`StepOptions`](../reference/workflows-steps.md#stepoptions) and [`@Step`](../reference/workflows-steps.md#step) reference for full details.
