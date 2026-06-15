---
sidebar_position: 50
title: DBOS Client
---

`Client` provides a programmatic way to interact with your DBOS application from external code.
`Client` includes methods similar to [`DBOSContext`](./dbos-context.md) that can be used outside of a DBOS application.

:::note 
`Client` is included in the `dbos` package, the same package that is used by DBOS applications.
Where DBOS applications use the [`DBOSContext` methods](./dbos-context.md),
external applications use `Client` methods instead.
:::

```go
type Client interface {
    Enqueue(queueName, workflowName string, input any, opts ...EnqueueOption) (WorkflowHandle[any], error)
    ListWorkflows(opts ...ListWorkflowsOption) ([]WorkflowStatus, error)
    Send(destinationID string, message any, topic string) error
    GetEvent(targetWorkflowID, key string, timeout time.Duration) (any, error)
    RetrieveWorkflow(workflowID string) (WorkflowHandle[any], error)
    CancelWorkflow(workflowID string) error
    CancelWorkflows(workflowIDs []string) error
    SetWorkflowDelay(workflowID string, opts ...SetWorkflowDelayOption) error
    ResumeWorkflow(workflowID string, opts ...ResumeWorkflowOption) (WorkflowHandle[any], error)
    ResumeWorkflows(workflowIDs []string, opts ...ResumeWorkflowOption) ([]WorkflowHandle[any], error)
    ForkWorkflow(input ForkWorkflowInput) (WorkflowHandle[any], error)
    ListApplicationVersions() ([]VersionInfo, error)
    GetLatestApplicationVersion() (*VersionInfo, error)
    SetLatestApplicationVersion(versionName string) error
    GetWorkflowSteps(workflowID string) ([]StepInfo, error)
    ClientReadStream(workflowID string, key string) ([]any, bool, error)
    ClientReadStreamAsync(workflowID string, key string) (<-chan StreamValue[any], error)
    CreateSchedule(input ClientScheduleInput) error
    ApplySchedules(schedules []ClientScheduleInput) error
    GetSchedule(scheduleName string) (*WorkflowSchedule, error)
    ListSchedules(opts ...ListSchedulesOption) ([]WorkflowSchedule, error)
    PauseSchedule(scheduleName string) error
    ResumeSchedule(scheduleName string) error
    DeleteSchedule(scheduleName string) error
    BackfillSchedule(scheduleName string, start, end time.Time) ([]string, error)
    TriggerSchedule(scheduleName string) (WorkflowHandle[any], error)
    Shutdown(timeout time.Duration)
}
```

### Constructor

```go
func NewClient(ctx context.Context, config ClientConfig) (Client, error)
```

**Parameters:**
- `ctx`: A context for initialization operations
- `config`: A `ClientConfig` object with connection and application settings

```go
type ClientConfig struct {
    DatabaseURL    string        // Connection string to your system database. May be a PostgreSQL (postgres://...) or SQLite (sqlite:...) URL. Exactly one of DatabaseURL, SystemDBPool, or SqliteSystemDB is required.
    SystemDBPool   *pgxpool.Pool // A custom Postgres/CockroachDB connection pool. Optional; takes precedence over DatabaseURL. Mutually exclusive with SqliteSystemDB.
    SqliteSystemDB *sql.DB       // A custom SQLite handle (e.g. from modernc.org/sqlite). Optional; takes precedence over DatabaseURL. Mutually exclusive with SystemDBPool.
    DatabaseSchema string        // Database schema name (defaults to "dbos"; Postgres only)
    Logger         *slog.Logger  // Optional custom logger
}
```

**Returns:**
- A new `Client` instance or an error if initialization fails

**Example syntax:**

This DBOS client connects to the system database specified in the configuration:

```go
config := dbos.ClientConfig{
    DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
}
client, err := dbos.NewClient(context.Background(), config)
if err != nil {
    log.Fatal(err)
}
defer client.Shutdown(5 * time.Second)
```

A client manages a connection pool to the [DBOS system database](../../explanations/system-tables.md). Calling `Shutdown` on a client will release the connection pool.


### Shutdown

```go
Shutdown(timeout time.Duration)
```

Gracefully shuts down the client and releases the system database connection pool.

**Parameters:**
- `timeout`: Maximum time to wait for graceful shutdown

## Workflow Interaction Methods

### Enqueue

```go
func Enqueue[P any, R any](
    c Client, 
    queueName string,
    workflowName string, 
    input P, 
    opts ...EnqueueOption
) (WorkflowHandle[R], error)
```

Enqueue a workflow for processing and return a handle to it, similar to [RunWorkflow with the WithQueue option](./workflows-steps.md#withqueue).
Returns a [WorkflowHandle](./workflows-steps.md#workflowhandle).

When enqueuing a workflow from the DBOS client, you must specify the name of the workflow to enqueue (rather than passing a workflow function as with `RunWorkflow`.)

Required parameters:

* `c`: The DBOS client instance
* `queueName`: The name of the [queue](./queues.md) on which to enqueue the workflow
* `workflowName`: The name of the workflow function being enqueued
* `input`: The input to pass to the workflow

Optional configuration via `EnqueueOption`:

* `WithEnqueueWorkflowID(id string)`: The unique ID for the enqueued workflow. 
If left undefined, DBOS Client will generate a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier). 
Please see [Workflow IDs and Idempotency](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) for more information.
* `WithEnqueueApplicationVersion(version string)`: The version of your application that should process this workflow. 
If left undefined, it will use the current application version.
* `WithEnqueueTimeout(timeout time.Duration)`: Set a timeout for the enqueued workflow. When the timeout expires, the workflow **and all its children** are cancelled (except if the child's context has been made uncancellable using [`WithoutCancel`](./dbos-context.md#withoutcancel)). The timeout does not begin until the workflow is dequeued and starts execution.
* `WithEnqueueDeduplicationID(id string)`: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will fail.
* `WithEnqueueDeduplicationPolicy(policy DeduplicationPolicy)`: Set how a colliding deduplication ID is handled. Requires `WithEnqueueDeduplicationID`. With the default `DeduplicationPolicyReject`, a colliding enqueue fails with a `QueueDeduplicated` error; with `DeduplicationPolicyReturnExisting`, it instead returns a handle to the existing workflow. See [`WithDeduplicationPolicy`](./workflows-steps.md#withdeduplicationpolicy).
* `WithEnqueuePriority(priority uint)`: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
* `WithEnqueueClassName(className string)`: The class/namespace name for the target workflow. Required when enqueueing to Python, TypeScript, or Java targets, which dispatch workflows by (class_name, workflow_name) pair.
* `WithEnqueueConfigName(configName string)`: The config/instance name for the target workflow. Required when enqueueing to a workflow registered on a configured instance: a Go workflow registered with [`WithInstance`](./workflows-steps.md#withinstance), or a Python, TypeScript, or Java class instance workflow (e.g., Python's [`DBOSConfiguredInstance`](../../python/tutorials/classes.md), TypeScript's [`ConfiguredInstance`](../../typescript/tutorials/instantiated-objects.md)). The value must match the instance name used by the target application.
* `WithEnqueueDelay(delay time.Duration)`: Delay execution of the enqueued workflow by the specified duration. The workflow is initially placed in `DELAYED` status and transitions to `ENQUEUED` after the delay expires. The delay can later be updated via [`SetWorkflowDelay`](#setworkflowdelay).
* `WithEnqueueQueuePartitionKey(partitionKey string)`: The partition key to enqueue under when the target queue is a [partitioned queue](../tutorials/queue-tutorial.md#partitioning-queues). Each partition has its own concurrency limits.

:::tip Cross-Language Enqueue
To enqueue a workflow on a target application written in another language, pass a [`PortableWorkflowArgs`](./methods.md#portableworkflowargs) as the input.
This automatically uses portable JSON serialization.
See [Cross-Language Interaction](../../explanations/portable-workflows.md) for details.
:::

**Example syntax:**

```go
type ProcessInput struct {
    TaskID string
    Data   string
}

type ProcessOutput struct {
    Result string
    Status string
}

handle, err := dbos.Enqueue[ProcessInput, ProcessOutput](
    client, 
    "process_queue",
    "ProcessWorkflow",
    ProcessInput{TaskID: "task-123", Data: "data"},
    dbos.WithEnqueueTimeout(30 * time.Minute),
    dbos.WithEnqueuePriority(5),
)
if err != nil {
    log.Fatal(err)
}

result, err := handle.GetResult()
if err != nil {
    log.Printf("Workflow failed: %v", err)
} else {
    log.Printf("Result: %+v", result)
}
```

### RetrieveWorkflow

```go
RetrieveWorkflow(workflowID string) (WorkflowHandle[any], error)
```

Retrieve the [handle](./workflows-steps.md#workflowhandle) of a workflow with identity `workflowID`.
Similar to [`RetrieveWorkflow`](./methods.md#retrieveworkflow).

**Parameters:**
- `workflowID`: The identifier of the workflow whose handle to retrieve

**Returns:**
- The [WorkflowHandle](./workflows-steps.md#workflowhandle) of the workflow whose ID is `workflowID`

### Send

```go
Send(destinationID string, message any, topic string) error
```

Sends a message to a specified workflow. Similar to [`Send`](../tutorials/workflow-communication.md#send).

**Parameters:**
- `destinationID`: The workflow to which to send the message
- `message`: The message to send. Must be serializable
- `topic`: A topic with which to associate the message. Messages are enqueued per-topic on the receiver

### GetEvent

```go
GetEvent(targetWorkflowID, key string, timeout time.Duration) (any, error)
```

Retrieve the latest value of an event published by the workflow identified by `targetWorkflowID` to the key `key`.
If the event does not yet exist, wait for it to be published, returning an error if the wait times out.
Similar to [`GetEvent`](../tutorials/workflow-communication.md#getevent).

**Parameters:**
- `targetWorkflowID`: The identifier of the workflow whose events to retrieve
- `key`: The key of the event to retrieve
- `timeout`: A timeout duration. If the wait times out, return an error

**Returns:**
- The value of the event published by `targetWorkflowID` with name `key`, or an error if the wait times out

## Workflow Management Methods

### ListWorkflows

```go
ListWorkflows(opts ...ListWorkflowsOption) ([]WorkflowStatus, error)
```

Retrieve a list of [`WorkflowStatus`](./methods.md#workflow-status) of all workflows matching specified criteria.
Similar to [`ListWorkflows`](./methods.md#listworkflows).

**Options:**
Options are provided via `ListWorkflowsOption` functions. See [`ListWorkflows`](./methods.md#listworkflows) for available options.

:::warning
The client `ListWorkflows` method does not include workflow inputs and outputs in its results.
:::

### GetWorkflowSteps

```go
GetWorkflowSteps(workflowID string) ([]StepInfo, error)
```

List the steps of a given workflow. Returned entries do not include step outputs.


### CancelWorkflow

```go
CancelWorkflow(workflowID string) error
```

Cancel a workflow.
This sets its status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step).
Similar to [`CancelWorkflow`](./methods.md#cancelworkflow).

### CancelWorkflows

```go
CancelWorkflows(workflowIDs []string) error
```

Cancel multiple workflows in a single database round-trip.
Missing or already-terminal IDs are silently skipped.
Similar to [`CancelWorkflows`](./methods.md#cancelworkflows).

### SetWorkflowDelay

```go
SetWorkflowDelay(workflowID string, opts ...SetWorkflowDelayOption) error
```

Set or update the delay on a `DELAYED` workflow.
Provide exactly one of [`WithDelayDuration`](./methods.md#withdelayduration) (relative) or [`WithDelayUntil`](./methods.md#withdelayuntil) (absolute).
Similar to [`SetWorkflowDelay`](./methods.md#setworkflowdelay).

### ResumeWorkflow

```go
ResumeWorkflow(workflowID string, opts ...ResumeWorkflowOption) (WorkflowHandle[any], error)
```

Resume a workflow.
This immediately starts it from its last completed step.
You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.
Pass [`WithResumeQueue`](./methods.md#withresumequeue) to re-enqueue the resumed workflow on a named queue instead of starting it immediately.
Similar to [`ResumeWorkflow`](./methods.md#resumeworkflow).

### ResumeWorkflows

```go
ResumeWorkflows(workflowIDs []string, opts ...ResumeWorkflowOption) ([]WorkflowHandle[any], error)
```

Resume multiple workflows in a single database round-trip.
Accepts the same options as [`ResumeWorkflow`](#resumeworkflow).
Similar to [`ResumeWorkflows`](./methods.md#resumeworkflows).

### ForkWorkflow

```go
ForkWorkflow(input ForkWorkflowInput) (WorkflowHandle[any], error)
```

Set `QueueName` on the input to enqueue the forked workflow on a named queue instead of starting it immediately.
Similar to [`ForkWorkflow`](./methods.md#forkworkflow).

### Debouncer

#### NewDebouncerClient

```go
func NewDebouncerClient[P any, R any](workflowName string, client Client, opts ...DebouncerOption) *DebouncerClient[P, R]
```

Create a new debouncer client for use from outside a DBOS application.
Similar to [`NewDebouncer`](./queues.md#newdebouncer) but uses a [Client](#constructor) instead of a DBOSContext and takes a workflow name string instead of a function reference.

**Parameters:**
- `workflowName`: The name of the workflow to debounce.
- `client`: The DBOS client to use for operations.
- `opts`: Optional configuration, documented below.

#### WithDebouncerTimeout

```go
func WithDebouncerTimeout(timeout time.Duration) DebouncerOption
```

Set the maximum time before starting the workflow, measured from the first debounce call for a given key.
If the timeout is zero (the default), there is no maximum time limit and calling the workflow can be pushed back indefinitely.

#### WithDebouncerConfigName

```go
func WithDebouncerConfigName(configName string) DebouncerOption
```

Target the workflow registration bound to the configured instance with the given config name (see [`WithInstance`](./workflows-steps.md#withinstance)).
Required when the debounced workflow is a method of a configured instance.
Use with `NewDebouncerClient`, where the instance object itself is not available.

```go
dc := dbos.NewDebouncerClient[string, string]("Send", client,
    dbos.WithDebouncerConfigName("slack"))
```

#### DebouncerClient.Debounce

```go
func (dc *DebouncerClient[P, R]) Debounce(key string, delay time.Duration, input P, opts ...WorkflowOption) (WorkflowHandle[R], error)
```

Debounce a workflow invocation from outside a DBOS application.
Behaves the same as [`Debouncer.Debounce`](./queues.md#debouncerdebounce) but does not require a DBOSContext.

**Parameters:**
- `key`: A unique key to group debounce calls.
- `delay`: Time by which to delay workflow execution.
- `input`: Input parameters to pass to the workflow.
- `opts`: Optional workflow options.

## Schedule Management

`Client` exposes the same [workflow scheduling](./methods.md#workflow-schedules) operations as the DBOS context, with the important difference that workflows are identified by name (string) rather than by function reference.
See the [scheduled workflows tutorial](../tutorials/scheduled-workflows.md) for an overview.

### ClientScheduleInput

```go
type ClientScheduleInput struct {
    ScheduleName      string // Required: unique schedule name
    WorkflowName      string // Required: target workflow name (FQN or custom name)
    WorkflowClassName string // Optional: class/namespace name (required for Python/TS/Java targets that dispatch by class)
    Schedule          string // Required: cron expression
    Context           any    // Optional: user-defined context (JSON-serialized)
    AutomaticBackfill bool   // Optional
    CronTimezone      string // Optional: IANA timezone name
    QueueName         string // Optional: target queue
}
```

### Client.CreateSchedule

```go
CreateSchedule(input ClientScheduleInput) error
```

Create a new schedule. Similar to [`CreateSchedule`](./methods.md#createschedule).

**Example:**

```go
err := client.CreateSchedule(dbos.ClientScheduleInput{
    ScheduleName: "my-schedule",
    WorkflowName: "myPeriodicTask",
    Schedule:     "*/5 * * * *",
    Context:      "my context",
})
```

### Client.ApplySchedules

```go
ApplySchedules(schedules []ClientScheduleInput) error
```

Atomically create or replace the given schedules. Similar to [`ApplySchedules`](./methods.md#applyschedules).

### Client.GetSchedule

```go
GetSchedule(scheduleName string) (*WorkflowSchedule, error)
```

Retrieve a [`WorkflowSchedule`](./methods.md#workflowschedule) by name. Returns `(nil, nil)` if not found.

### Client.ListSchedules

```go
ListSchedules(opts ...ListSchedulesOption) ([]WorkflowSchedule, error)
```

List schedules, optionally filtered. Accepts the same options as [`ListSchedules`](./methods.md#listschedules).

### Client.PauseSchedule

```go
PauseSchedule(scheduleName string) error
```

Pause a schedule so it stops firing.

### Client.ResumeSchedule

```go
ResumeSchedule(scheduleName string) error
```

Resume a paused schedule.

### Client.DeleteSchedule

```go
DeleteSchedule(scheduleName string) error
```

Delete a schedule.

### Client.BackfillSchedule

```go
BackfillSchedule(scheduleName string, start, end time.Time) ([]string, error)
```

Backfill missed executions for the range `[start, end]`, returning the IDs of the enqueued workflows. Similar to [`BackfillSchedule`](./methods.md#backfillschedule).

### Client.TriggerSchedule

```go
TriggerSchedule(scheduleName string) (WorkflowHandle[any], error)
```

Trigger a schedule to fire immediately, returning a handle for the enqueued workflow.

## Application Version Management

### ListApplicationVersions

```go
ListApplicationVersions() ([]VersionInfo, error)
```

Return every application version registered in the system database, ordered by timestamp (newest first).
Similar to [`ListApplicationVersions`](./methods.md#listapplicationversions).

### GetLatestApplicationVersion

```go
GetLatestApplicationVersion() (*VersionInfo, error)
```

Return the application version with the most recent timestamp.
Similar to [`GetLatestApplicationVersion`](./methods.md#getlatestapplicationversion).

### SetLatestApplicationVersion

```go
SetLatestApplicationVersion(versionName string) error
```

Mark the named application version as latest by updating its timestamp to the current time.
Similar to [`SetLatestApplicationVersion`](./methods.md#setlatestapplicationversion).

## Stream Methods

### ClientReadStream

```go
func ClientReadStream[R any](c Client, workflowID string, key string) ([]R, bool, error)
```

Read all values from a durable [stream](../tutorials/workflow-communication.md#workflow-streaming) produced by a workflow.
Blocks until the stream is closed or the workflow becomes inactive (status is not `PENDING` or `ENQUEUED`).
Similar to [`ReadStream`](./methods.md#readstream).

**Parameters:**
- `c`: The DBOS client instance.
- `workflowID`: The ID of the workflow whose stream to read.
- `key`: The stream key to read.

**Returns:**
- The typed values read from the stream.
- Whether the stream is closed.
- Any error that occurred.

### ClientReadStreamAsync

```go
func ClientReadStreamAsync[R any](c Client, workflowID string, key string) (<-chan StreamValue[R], error)
```

Read values from a durable [stream](../tutorials/workflow-communication.md#workflow-streaming) asynchronously.
Returns immediately with a channel that receives values as they are written to the stream.
The channel is closed when the stream is closed or an error occurs.
Similar to [`ReadStreamAsync`](./methods.md#readstreamasync).

**Parameters:**
- `c`: The DBOS client instance.
- `workflowID`: The ID of the workflow whose stream to read.
- `key`: The stream key to read.

**Returns:**
- A receive-only channel of [`StreamValue[R]`](./methods.md#streamvalue).
- Any error that occurred during setup.