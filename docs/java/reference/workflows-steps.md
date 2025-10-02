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

