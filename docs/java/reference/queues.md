---
sidebar_position: 40
title: Queues
---

Workflow queues allow you to ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

All queues should be created before DBOS is launched.

### Queue

```java
QueueBuilder Queue(String name)
```

```java
public class QueueBuilder {
    public QueueBuilder concurrency(Integer concurrency)
    public QueueBuilder workerConcurrency(Integer workerConcurrency)
    public QueueBuilder limit(int limit, double period)
    public QueueBuilder priorityEnabled(boolean priorityEnabled)
    public Queue build();
}
```

Create a new workflow queue with the specified name and optional configuration parameters.
Queues must be created before DBOS is launched.
You can enqueue a workflow using the `withQueue` parameter of [`startWorkflow`](./workflows-steps.md#startworkflow).

**Parameters:**
- **name**: The name of the queue. Must be unique among all queues in the application.
- **workerConcurrency**: The maximum number of workflows from this queue that may run concurrently within a single DBOS process.
- **concurrency**: The maximum number of workflows from this queue that may run concurrently. This concurrency limit is global across all DBOS processes using this queue.
- **limit**: A limit on the maximum number of functions (`limit`) that may be started in a given period (`period`).
- **priorityEnabled**: Enable setting priority for workflows on this queue.

**Example Syntax:**

```java
Queue queue = DBOS.Queue("example-queue")
  .workerConcurrency(1)
  .build();
```