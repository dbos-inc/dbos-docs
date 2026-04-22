---
sidebar_position: 65
title: Kotlin Extensions
toc_max_heading_level: 3
---

DBOS ships Kotlin extension functions on the `DBOS` class in the `dev.dbos.transact` package.
They place the lambda argument last so Kotlin's trailing lambda syntax works naturally.
All extensions are `@JvmSynthetic` and invisible to Java callers.

## Extensions

### runStep

```kotlin
fun <T> DBOS.runStep(options: StepOptions, block: () -> T): T
fun <T> DBOS.runStep(name: String, block: () -> T): T
```

Kotlin-friendly alternatives to [`dbos.runStep`](./methods.md#runstep) that place the lambda last.

**Parameters:**
- **options**: A [`StepOptions`](./workflows-steps.md#stepoptions) object controlling the step name and retry policy.
- **name**: The step name as a plain string (shorthand for `StepOptions(name)`).
- **block**: The step body. Must be deterministic across retries; side effects and external calls belong here rather than in the workflow body.

**Example:**

```kotlin
// with a name
val result = dbos.runStep("fetchData") {
    httpClient.get(url)
}

// with options (e.g. retries)
val result = dbos.runStep(StepOptions("fetchData").withMaxAttempts(3)) {
    httpClient.get(url)
}
```

### startWorkflow

```kotlin
fun <T> DBOS.startWorkflow(options: StartWorkflowOptions?, block: () -> T): WorkflowHandle<T, Exception>
```

Kotlin-friendly alternative to [`dbos.startWorkflow`](./methods.md#startworkflow) that places the lambda last.
Pass `null` for `options` to use defaults.

:::note
A zero-argument `startWorkflow { }` extension is not provided because Kotlin's SAM conversion causes the Java member to win before any extension is considered for that signature.
Always supply `StartWorkflowOptions()` (or `null`) as the first argument.
:::

**Parameters:**
- **options**: [`StartWorkflowOptions`](./workflows-steps.md#startworkflowoptions) controlling workflow ID, queue, timeout, etc. Pass `null` to use defaults.
- **block**: A call to a registered workflow proxy method.

**Returns:** A [`WorkflowHandle`](./methods.md#workflowhandle) for retrieving the workflow result.

**Example:**

```kotlin
val handle = dbos.startWorkflow(StartWorkflowOptions()) {
    orderProxy.processOrder("order-123")
}
val result = handle.result
```
