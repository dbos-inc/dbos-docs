---
sidebar_position: 20
title: Workflows & Steps
---

### @Workflow

```java
public @interface Workflow {
  String name();

  int maxRecoveryAttempts();
}
```

An annotation that can be applied to a class method to mark it as a durable workflow.

**Parameters:**
- **name**: The workflow name. Must be unique.
- **maxRecoveryAttempts**: Optionally configure the maximum number of times execution of a workflow may be attempted.
This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue) so that a buggy workflow that crashes its application (for example, by running it out of memory) does not do so infinitely.
If a workflow exceeds this limit, its status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED` and it may no longer be executed.

### Workflow

```java
<T> WorkflowBuilder<T> Workflow()
```

```java
public static class WorkflowBuilder<T> {
    public WorkflowBuilder<T> interfaceClass(Class<T> iface)

    public WorkflowBuilder<T> implementation(Object impl)

    public T build()
}
```

Proxy a class whose methods contain `@Workflow` annotations.
Methods can then be invoked as durable workflows using the proxy.
All proxies must be created before DBOS is launched.

### startWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> startWorkflow(
    ThrowingSupplier<T, E> workflow, 
    StartWorkflowOptions options
)
```

Start a workflow in the background and return a handle to it.
Optionally enqueue it on a DBOS queue.
The `startWorkflow` method resolves after the workflow is durably started; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

This method takes in the following options:

```java
public record StartWorkflowOptions(
    String workflowId,
    Duration timeout,
    String queueName,
    String deduplicationId,
    OptionalInt priority
)
```

**Constructors:**

```java
new StartWorkflowOptions()
```

**Methods:**

```java
StartWorkflowOptions withWorkflowId(String workflowId)
```

Set the workflow ID of this workflow.

```java
StartWorkflowOptions withTimeout(Duration timeout)
```

```java
StartWorkflowOptions withTimeout(long value, TimeUnit unit)
```

Set a timeout for this workflow.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Timeout deadlines are propagated to child workflows by default, so when a workflow's deadline expires all of its child workflows (and their children, and so on) are also cancelled.
If you want to detach a child workflow from its parent's timeout, you can start it with `SetWorkflowTimeout(custom_timeout)` to override the propagated timeout.
You can use `SetWorkflowTimeout(None)` to start a child workflow with no timeout.

```java
StartWorkflowOptions withQueue(Queue queue)
```

```java
StartWorkflowOptions withQueue(Queue queue, String deduplicationId)
```

```java
StartWorkflowOptions withQueue(Queue queue, int priority)
```

```java
StartWorkflowOptions withQueue(Queue queue, String deduplicationId, int priority)
```

TODO: Document these once they're broken up appropriately.


### runStep

```java
public <T, E extends Exception> T runStep(
    ThrowingSupplier<T, E> stepfunc, 
    StepOptions opts
) throws E
```

Run a function as a step in a workflow.
Can only be called from a durable workflow.
Returns the output of the step.

This method takes in the following options:

```java
public record StepOptions(
    String name,
    boolean retriesAllowed,
    int maxAttempts,
    double intervalSeconds,
    double backOffRate
)
```

**Constructors:**

```java
new StepOptions(String name)
```

Provide a name for this step.

**Methods:**

```java
StepOptions withRetriesAllowed(boolean b)
```

Whether to retry the step if it throws an exception. Defaults to false.

```java
StepOptions withMaxAttempts(int n)
```

How many times to retry a step that is throwing exceptions.

```java
StepOptions withIntervalSeconds(double t)
```

How long to wait before the initial retry.

```java
StepOptions withBackoffRate(double t) 
```

How much to multiplicatively increase `intervalSeconds` between retries.