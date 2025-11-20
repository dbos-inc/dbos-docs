---
sidebar_position: 40
title: Queues
---

Workflow queues allow you to ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

All queues should be created before DBOS is launched.

### NewWorkflowQueue

```go
func NewWorkflowQueue(dbosCtx DBOSContext, name string, options ...queueOption) WorkflowQueue
```

NewWorkflowQueue creates a new workflow queue with the specified name and configuration options.
Queues must be created before DBOS is launched.
You can enqueue a workflow using the [`WithQueue`](./workflows-steps.md#withqueue) parameter of [`RunWorkflow`](./workflows-steps.md#runworkflow).

**Parameters:**
- **dbosCtx**: The DBOSContext.
- **name**: The name of the queue.  Must be unique among all queues in the application.
- **options**: Functional options for the queue, documented below.

**Example Syntax:**

```go
queue := dbos.NewWorkflowQueue(ctx, "email-queue",
    dbos.WithWorkerConcurrency(5),
    dbos.WithRateLimiter(&dbos.RateLimiter{
        Limit:  100,
        Period: 60 * time.Second, // 100 workflows per minute
    }),
    dbos.WithPriorityEnabled(),
)

// Enqueue workflows to this queue:
handle, err := dbos.RunWorkflow(ctx, SendEmailWorkflow, emailData, dbos.WithQueue("email-queue"))
```

#### WithWorkerConcurrency

```go
func WithWorkerConcurrency(concurrency int) queueOption
```

Set the maximum number of workflows from this queue that may run concurrently within a single DBOS process.

#### WithGlobalConcurrency

```go
func WithGlobalConcurrency(concurrency int) queueOption
```

Set the maximum number of workflows from this queue that may run concurrently. Defaults to 0 (no limit).
This concurrency limit is global across all DBOS processes using this queue.

####  WithMaxTasksPerIteration

```go
func WithMaxTasksPerIteration(maxTasks int) queueOption
```

Sets the maximum number of workflows that can be dequeued in a single iteration.
This controls batch sizes for queue processing.

####  WithPriorityEnabled

```go
func WithPriorityEnabled() queueOption
```

Enable setting priority for workflows on this queue.

####  WithRateLimiter

```go
func WithRateLimiter(limiter *RateLimiter) queueOption
```

```go
type RateLimiter struct {
    Limit  int     // Maximum number of workflows to start within the period
    Period time.Duration // Time period for the rate limit
}
```

A limit on the maximum number of functions which may be started in a given period.

####  WithPartitionQueue

```go
func WithPartitionQueue() queueOption
```

Enable partitioning for this queue.
When enabled, workflows can be enqueued with a partition key using [`WithQueuePartitionKey`](./workflows-steps.md#withqueuepartitionkey), and each partition has its own concurrency limits.
This allows distributing work across dynamically created queue partitions.

In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.
For example, if you create a partitioned queue with a global concurrency of 1, then at most one workflow from each partition can run concurrently (but workflows from different partitions can run in parallel).

**Example Syntax:**

```go
// Create a partitioned queue with a global concurrency limit of 1
partitionedQueue := dbos.NewWorkflowQueue(ctx, "user-tasks",
    dbos.WithPartitionQueue(),
    dbos.WithGlobalConcurrency(1),
)

// Enqueue workflows with different partition keys
// At most one workflow per user can run at once, but workflows from different users can run concurrently
handle1, _ := dbos.RunWorkflow(ctx, ProcessTask, task1,
    dbos.WithQueue("user-tasks"),
    dbos.WithQueuePartitionKey("user-123"),
)

handle2, _ := dbos.RunWorkflow(ctx, ProcessTask, task2,
    dbos.WithQueue("user-tasks"),
    dbos.WithQueuePartitionKey("user-456"),
)
```


