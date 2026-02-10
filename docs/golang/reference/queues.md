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

See [ListRegisteredQueues](./dbos-context.md#listregisteredqueues) for obtaining a list of all registered queues.

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

####  WithQueueBasePollingInterval

```go
func WithQueueBasePollingInterval(interval time.Duration) QueueOption
```

Set the base polling interval for this queue. This also acts as the minimum (fastest) interval. Polling intervals are subject to base 2 exponential backoff.

**Example Syntax:**

```go
queue := dbos.NewWorkflowQueue(ctx, "email-queue", dbos.WithQueueBasePollingInterval(100*time.Millisecond))
```

#### WithQueueMaxPollingInterval

```go
func WithQueueMaxPollingInterval(interval time.Duration) QueueOption
```

Set the maximum (slowest) polling interval for this queue. Polling intervals are subject to base 2 exponential backoff.

**Example Syntax:**

```go
queue := dbos.NewWorkflowQueue(ctx, "email-queue", dbos.WithQueueMaxPollingInterval(10*time.Second))
```

### ListenQueues

```go
func ListenQueues(ctx DBOSContext, queues ...WorkflowQueue)
```

Configure which queues the current DBOS process should listen to for workflow execution.
By default, all registered queues are listened to.
When `ListenQueues` is called, only the specified queues (and the internal DBOS queue) will be processed by the queue runner.

This allows multiple DBOS processes to share the same queue registry but listen to different subsets of queues.

:::warning
`ListenQueues` can only be called before `Launch()`. Calling it after launch will panic.
:::

---

### Debouncer

A debouncer delays workflow execution until a configurable delay has elapsed since the last invocation.
Each subsequent call pushes back the start time by the delay amount.
This is useful when you want to coalesce rapid successive triggers (e.g., text field edits, sensor data) into a single workflow execution.

See the [debouncing tutorial](../tutorials/queue-tutorial.md#debouncing) for usage examples.

#### NewDebouncer

```go
func NewDebouncer[P any, R any](ctx DBOSContext, workflow Workflow[P, R], opts ...DebouncerOption) *Debouncer[P, R]
```

Create a new debouncer for the specified workflow.
The workflow must be registered before creating the debouncer.
Debouncers must be created before `Launch()`.
Multiple debouncers can be created for the same workflow.

**Parameters:**
- **ctx**: The DBOSContext.
- **workflow**: The workflow function to debounce (must be registered).
- **opts**: Optional configuration, documented below.

#### WithDebouncerTimeout

```go
func WithDebouncerTimeout(timeout time.Duration) DebouncerOption
```

Set the maximum time before starting the workflow, measured from the first debounce call for a given key.
If the timeout is zero (the default), there is no maximum time limit and calling the workflow can be pushed back indefinitely.

#### Debouncer.Debounce

```go
func (d *Debouncer[P, R]) Debounce(ctx DBOSContext, key string, delay time.Duration, input P, opts ...WorkflowOption) (WorkflowHandle[R], error)
```

Debounce a workflow invocation.
If no debouncer is active for the given key, one is started with the specified delay.
If a debouncer is already active for the key, the delay is pushed back and the input is updated.
When the delay expires _or_ the debouncer preconfigured timeout is reached, the target workflow is executed with the most recent input.

**Parameters:**
- **ctx**: The DBOSContext.
- **key**: A unique key to group debounce calls. Calls with the same key are debounced together.
- **delay**: Time by which to delay workflow execution from this call.
- **input**: Input parameters to pass to the workflow.
- **opts**: Optional workflow options (e.g., `WithWorkflowID`).

**Returns:**
- A [WorkflowHandle](./workflows-steps.md#workflowhandle) for the target workflow.

You can also create a debouncer from outside a DBOS application using the [DBOS Client](./client.md#newdebouncerclient).