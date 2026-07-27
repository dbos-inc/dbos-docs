---
sidebar_position: 40
title: Queues
---

Workflow queues allow you to ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

Queue configuration is persisted to the system database, so any DBOS process connected to the same system database can register, retrieve, and reconfigure queues.

## Queue Management

### RegisterQueue

```go
func RegisterQueue(ctx Context, name string, options ...QueueOption) (Queue, error)
```

Register a queue and persist its configuration to the system database, returning a [`Queue`](#queue-interface).
If a queue with the same name already exists in the database, the [`WithQueueOnConflict`](#withqueueonconflict) option controls whether its configuration is overwritten.
Queues may be registered at any time, including after `Launch()`; live workers periodically reload queue configuration, so changes take effect without a restart.

You can enqueue a workflow using the [`WithQueue`](./workflows-steps.md#withqueue) parameter of [`RunWorkflow`](./workflows-steps.md#runworkflow).

**Parameters:**
- **ctx**: The Context.
- **name**: The name of the queue.  Must be unique among all queues in the application.
- **options**: Functional options for the queue, documented below.

**Example Syntax:**

```go
queue, err := dbos.RegisterQueue(ctx, "email-queue",
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
func WithWorkerConcurrency(concurrency int) QueueOption
```

Set the maximum number of workflows from this queue that may run concurrently within a single DBOS process.

#### WithGlobalConcurrency

```go
func WithGlobalConcurrency(concurrency int) QueueOption
```

Set the maximum number of workflows from this queue that may run concurrently. Defaults to 0 (no limit).
This concurrency limit is global across all DBOS processes using this queue.

####  WithMaxTasksPerIteration

```go
func WithMaxTasksPerIteration(maxTasks int) QueueOption
```

Sets the maximum number of workflows that can be dequeued in a single iteration.
This controls batch sizes for queue processing.

####  WithPriorityEnabled

```go
func WithPriorityEnabled() QueueOption
```

Enable setting priority for workflows on this queue.

####  WithRateLimiter

```go
func WithRateLimiter(limiter *RateLimiter) QueueOption
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
func WithPartitionQueue() QueueOption
```

Enable partitioning for this queue.
When enabled, workflows can be enqueued with a partition key using [`WithQueuePartitionKey`](./workflows-steps.md#withqueuepartitionkey), and each partition has its own concurrency limits.
This allows distributing work across dynamically created queue partitions.

In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.
For example, if you create a partitioned queue with a global concurrency of 1, then at most one workflow from each partition can run concurrently (but workflows from different partitions can run in parallel).

**Example Syntax:**

```go
// Create a partitioned queue with a global concurrency limit of 1
partitionedQueue, err := dbos.RegisterQueue(ctx, "user-tasks",
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
queue, err := dbos.RegisterQueue(ctx, "email-queue", dbos.WithQueueBasePollingInterval(100*time.Millisecond))
```

#### WithQueueMaxPollingInterval

```go
func WithQueueMaxPollingInterval(interval time.Duration) QueueOption
```

Set the maximum (slowest) polling interval for this queue. Polling intervals are subject to base 2 exponential backoff.

The queue will never poll slower than this value, even when backing off due to errors.
If not set, the maximum polling interval is derived from the base polling interval.

#### WithQueueOnConflict

```go
func WithQueueOnConflict(policy QueueConflictResolution) QueueOption

type QueueConflictResolution string

const (
    QueueConflictUpdateIfLatestVersion QueueConflictResolution = "update_if_latest_version"
    QueueConflictAlwaysUpdate          QueueConflictResolution = "always_update"
    QueueConflictNeverUpdate           QueueConflictResolution = "never_update"
)
```

Set how `RegisterQueue` behaves when a queue with the same name already exists in the system database:

- **QueueConflictUpdateIfLatestVersion** (default): overwrite the existing configuration only if the running application is the latest registered application version. This prevents older versions in a rolling deploy from overwriting a newer configuration.
- **QueueConflictAlwaysUpdate**: always overwrite the existing configuration.
- **QueueConflictNeverUpdate**: leave the existing configuration unchanged. The returned queue reflects the persisted configuration, not the supplied options.

### RetrieveQueue

```go
func RetrieveQueue(ctx Context, name string) (Queue, error)
```

Retrieve a queue by name from the system database. If no queue with that name has been registered, returns an error matching `dbos.ErrQueueNotFound`:

```go
q, err := dbos.RetrieveQueue(ctx, name)
if errors.Is(err, dbos.ErrQueueNotFound) { /* absent */ }
```

**Example Syntax:**

```go
queue, err := dbos.RetrieveQueue(ctx, "email-queue")
if err != nil {
    return err
}
if queue != nil {
    fmt.Println("Priority enabled:", queue.GetPriorityEnabled())
}
```

### ListQueues

```go
func ListQueues(ctx Context) ([]Queue, error)
```

Return all queues registered in the system database.

### DeleteQueue

```go
func DeleteQueue(ctx Context, name string) error
```

Delete a queue from the system database. No-op if no queue with that name exists.

:::warning
Workflows already enqueued on a deleted queue can no longer be dequeued, executed, or recovered.
However, if a queue with the same name is later registered, it will dequeue the leftover workflows.
Do not rely on this: stale workflows unexpectedly resuming on a future queue is rarely the intended behavior.
Instead, cancel or drain pending workflows on the queue before deleting it.
:::

## Queue Interface

A `Queue` is returned from [`RegisterQueue`](#registerqueue), [`RetrieveQueue`](#retrievequeue), and [`ListQueues`](#listqueues).
Its `Get*` methods reflect the queue's configuration as of the most recent read from the database; the `Set*` methods update the configuration in the database.

```go
type Queue interface {
    GetName() string
    GetGlobalConcurrency() *int
    GetWorkerConcurrency() *int
    GetRateLimit() *RateLimiter
    GetPriorityEnabled() bool
    GetPartitionQueue() bool
    GetPollingInterval() time.Duration

    SetGlobalConcurrency(ctx Context, value *int) error
    SetWorkerConcurrency(ctx Context, value *int) error
    SetRateLimit(ctx Context, value *RateLimiter) error
    SetPriorityEnabled(ctx Context, value bool) error
    SetPartitionQueue(ctx Context, value bool) error
    SetPollingInterval(ctx Context, value time.Duration) error
}
```

### Reconfiguring Queues

Because queue configuration lives in the system database, you can change a queue's configuration at runtime without redeploying or restarting your workers.
Workers pick up the new configuration on their next polling iteration.
For `SetGlobalConcurrency`, `SetWorkerConcurrency`, and `SetRateLimit`, pass `nil` to clear the limit.

```go
queue, err := dbos.RetrieveQueue(ctx, "email-queue")
if err != nil {
    return err // dbos.ErrQueueNotFound if the queue does not exist
}
concurrency := 50
if err := queue.SetGlobalConcurrency(ctx, &concurrency); err != nil {
    return err
}
if err := queue.SetRateLimit(ctx, &dbos.RateLimiter{Limit: 500, Period: 60 * time.Second}); err != nil {
    return err
}
```

:::warning
If your application calls [`RegisterQueue`](#registerqueue) on startup, the next process to start can overwrite settings you applied at runtime via `Set*` methods.
Either update the `RegisterQueue` call to match the new configuration, or pass `WithQueueOnConflict(dbos.QueueConflictNeverUpdate)` to preserve the runtime changes.
:::

## ListenQueues

```go
func ListenQueues(ctx Context, names ...string)
```

Configure which queues the current DBOS process should listen to for workflow execution.
By default, all registered queues are listened to.
When `ListenQueues` is called, only the specified queues (and the internal DBOS queue) will be processed by the queue runner.

This allows multiple DBOS processes to share the same queues but listen to different subsets.

A queue is identified by name, so a queue can be listened to even before it exists in the database; names are resolved against the database on each polling iteration.

```go
dbos.RegisterQueue(ctx, "queue-1")
dbos.RegisterQueue(ctx, "queue-2")

// Only listen to queue-1 and queue-2.
dbos.ListenQueues(ctx, "queue-1", "queue-2")
```

Each call to `ListenQueues` replaces the whole listen set; passing an empty set listens to every queue. The listen set may be changed at any time, including after `Launch()`. Use `ListenedQueues(ctx)` to retrieve the current set.

---

## Debouncer

A debouncer delays workflow execution until a configurable delay has elapsed since the last invocation.
Each subsequent call pushes back the start time by the delay amount.
This is useful when you want to coalesce rapid successive triggers (e.g., text field edits, sensor data) into a single workflow execution.

See the [debouncing tutorial](../tutorials/workflow-tutorial.md#debouncing) for usage examples.

### NewDebouncer

```go
func NewDebouncer[R any, P any](ctx Context, workflow Workflow[P, R], opts ...DebouncerOption) (*Debouncer[R, P], error)
```

Create a new debouncer for the specified workflow.
The workflow must be registered before creating the debouncer.
Debouncers can be created at any time, including after `Launch()`.
Multiple debouncers can be created for the same workflow.
Both type parameters are inferred from the workflow function.

**Parameters:**
- **ctx**: The Context.
- **workflow**: The workflow function to debounce (must be registered).
- **opts**: Optional configuration, documented below.

### WithDebouncerTimeout

```go
func WithDebouncerTimeout(timeout time.Duration) DebouncerOption
```

Set the maximum time before starting the workflow, measured from the first debounce call for a given key.
If the timeout is zero (the default), there is no maximum time limit and calling the workflow can be pushed back indefinitely.

### WithDebouncerQueue

```go
func WithDebouncerQueue(queueName string) DebouncerOption
```

Run the debounced workflow on the named queue instead of the DBOS internal queue.
Debounce keys are scoped to the queue.
The queue is fixed per debouncer and must be registered (see [`RegisterQueue`](#registerqueue)); `Debounce` calls cannot override it.

### WithDebouncerInstance

```go
func WithDebouncerInstance(instance ConfiguredInstance) DebouncerOption
```

Target the workflow registration bound to the given configured instance (see [`WithInstance`](./workflows-steps.md#withinstance)).
Required when the debounced workflow is a method of a configured instance.

```go
debouncer, err := dbos.NewDebouncer(ctx, slack.Send, dbos.WithDebouncerInstance(slack))
```

### Debouncer.Debounce

```go
func (d *Debouncer[R, P]) Debounce(ctx Context, key string, delay time.Duration, input P, opts ...WorkflowOption) (WorkflowHandle[R], error)
```

Debounce a workflow invocation.
If no debouncer is active for the given key, one is started with the specified delay.
If a debouncer is already active for the key, the delay is pushed back and the input is updated.
When the delay expires _or_ the debouncer preconfigured timeout is reached, the target workflow is executed with the most recent input.

**Parameters:**
- **ctx**: The Context.
- **key**: A unique key to group debounce calls. Calls with the same key are debounced together.
- **delay**: Time by which to delay workflow execution from this call.
- **input**: Input parameters to pass to the workflow.
- **opts**: Optional workflow options (e.g., `WithWorkflowID`). Options the debounce owns or cannot support (`WithQueue`, `WithDeduplicationID`, `WithDelay`, `WithPriority`, `WithQueuePartitionKey`, `WithDeduplicationPolicy`) are rejected with an error matching `dbos.ErrInvalidOption`.

**Returns:**
- A [WorkflowHandle](./workflows-steps.md#workflowhandle) for the target workflow.

You can also create a debouncer from outside a DBOS application using a [`DebouncerClient`](#newdebouncerclient).

### NewDebouncerClient

```go
func NewDebouncerClient[R any, P any](workflowName string, client Client, opts ...DebouncerOption) *DebouncerClient[R, P]
```

`R` is the workflow's result type and `P` its input type; neither can be inferred, so both must be named explicitly.

Create a new debouncer for use from outside a DBOS application.
Similar to [`NewDebouncer`](#newdebouncer) but uses a [standalone client](./dbos-context.md#newclient) instead of a Context and takes a workflow name string instead of a function reference.

**Parameters:**
- **workflowName**: The name of the workflow to debounce.
- **client**: The DBOS client to use for operations.
- **opts**: Optional configuration — the same `DebouncerOption`s as [`NewDebouncer`](#newdebouncer), plus the client-specific options below.

### WithDebouncerClassName

```go
func WithDebouncerClassName(className string) DebouncerOption
```

Set the class/namespace name recorded for the debounced workflow.
Use with `NewDebouncerClient` when the target workflow is registered under a class name — for example by another language's runtime, which may resolve dequeued workflows by class name.

### WithDebouncerConfigName

```go
func WithDebouncerConfigName(configName string) DebouncerOption
```

Target the workflow registration bound to the configured instance with the given config name (see [`WithInstance`](./workflows-steps.md#withinstance)).
Required when the debounced workflow is a method of a configured instance.
Use with `NewDebouncerClient`, where the instance object itself is not available (from a Context, use [`WithDebouncerInstance`](#withdebouncerinstance) instead).

```go
dc := dbos.NewDebouncerClient[string, string]("Send", client,
    dbos.WithDebouncerConfigName("slack"))
```

### DebouncerClient.Debounce

```go
func (dc *DebouncerClient[R, P]) Debounce(key string, delay time.Duration, input P, opts ...WorkflowOption) (WorkflowHandle[R], error)
```

Debounce a workflow invocation from outside a DBOS application.
Behaves the same as [`Debouncer.Debounce`](#debouncerdebounce) but does not require a Context.

**Parameters:**
- **key**: A unique key to group debounce calls.
- **delay**: Time by which to delay workflow execution.
- **input**: Input parameters to pass to the workflow.
- **opts**: Optional workflow options, with the same restrictions as [`Debouncer.Debounce`](#debouncerdebounce).