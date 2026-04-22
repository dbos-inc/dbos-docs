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
    boolean partitioningEnabled,
    RateLimit rateLimit
) {
    public Queue withName(String name);
    public Queue withConcurrency(Integer concurrency);
    public Queue withWorkerConcurrency(Integer workerConcurrency);
    public Queue withRateLimit(RateLimit rateLimit);
    public Queue withRateLimit(int limit, Duration period);
    public Queue withRateLimit(int limit, double periodSeconds);
    public Queue withPriorityEnabled(boolean priorityEnabled);
    public Queue withPartitioningEnabled(boolean partitioningEnabled);
}
```

```java
public static record RateLimit(int limit, Duration period) {}
```

Create a new workflow queue with the specified name and optional configuration parameters.
Queues must be created and registered with [`dbos.registerQueue`](#dbosregisterqueue) before calling `dbos.launch()`.
You can enqueue a workflow using the `withQueue` parameter of [`startWorkflow`](./workflows-steps.md#startworkflow).

**Parameters:**
- **name**: The name of the queue. Must be unique among all queues in the application.
- **workerConcurrency**: The maximum number of workflows from this queue that may run concurrently within a single DBOS process.
- **concurrency**: The maximum number of workflows from this queue that may run concurrently. This concurrency limit is global across all DBOS processes using this queue.
- **rateLimit**: A `RateLimit` limiting the maximum number of workflows (`limit`) that may be started in a given `period`.
- **priorityEnabled**: Enable setting priority for workflows on this queue.
- **partitioningEnabled**: Enable partitioning on this queue.

**Example Syntax:**

```java
Queue queue = new Queue("example-queue")
  .withWorkerConcurrency(1);
```

### dbos.registerQueue
Queues must be registered before calling `dbos.launch()`:

```java
void registerQueue(Queue queue)
void registerQueues(Queue... queues)
```
