---
sidebar_position: 40
title: Queues
---

Workflow queues ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

All queues must be created before DBOS is launched, as this allows recovery to proceed correctly.

### Queue

```java
new Queue(String name)
```

```java
public record Queue(
    String name,
    Integer concurrency,
    Integer workerConcurrency,
    boolean priorityEnabled,
    RateLimit rateLimit
) { 
    public Queue withName(String name);
    public Queue withConcurrency(Integer concurrency);
    public Queue withWorkerConcurrency(Integer workerConcurrency);
    public Queue withRateLimit(RateLimit rateLimit) {
    public Queue withRateLimit(int limit, double period);
    public Queue withPriorityEnabled(boolean priorityEnabled);
}
```

Create a new workflow queue with the specified name and optional configuration parameters.
Queues must be created and registered with [`DBOS.registerQueue`](#dbosregisterqueue) before DBOS is launched.
You can enqueue a workflow using the `withQueue` parameter of [`startWorkflow`](./workflows-steps.md#startworkflow).

**Parameters:**
- **name**: The name of the queue. Must be unique among all queues in the application.
- **workerConcurrency**: The maximum number of workflows from this queue that may run concurrently within a single DBOS process.
- **concurrency**: The maximum number of workflows from this queue that may run concurrently. This concurrency limit is global across all DBOS processes using this queue.
- **rateLimit**: A limit on the maximum number of functions (`limit`) that may be started in a given period (`period`).
- **priorityEnabled**: Enable setting priority for workflows on this queue.

**Example Syntax:**

```java
Queue queue = new Queue("example-queue")
  .withWorkerConcurrency(1);
```

### DBOS.registerQueue
Queues must be registered before DBOS is launched:

```java
static Queue registerQueue(Queue queue);
```
