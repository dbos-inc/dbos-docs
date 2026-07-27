---
sidebar_position: 50
title: DBOS Client
---

`Client` provides a programmatic way to interact with your DBOS application from external code.
It is a formal sub-interface of [`Context`](./dbos-context.md): it owns every DBOS operation that does not require a launched runtime — enqueue, messaging, events, streams, workflow management, queue management, schedule management, application-version management, and `Shutdown`.
Every `Context` **is** a `Client`, so anywhere a `Client` is accepted you can also pass a (launched or unlaunched) `Context`.

```go
type Client interface {
    context.Context

    // Workflow operations
    Enqueue(_ Client, queueName string, workflowName string, input any, opts ...EnqueueOption) (WorkflowHandle[any], error)
    Send(_ Client, destinationID string, message any, topic string, opts ...SendOption) error
    GetEvent(_ Client, targetWorkflowID string, key string, timeout time.Duration) (any, error)
    ReadStream(_ Client, workflowID string, key string, opts ...ReadStreamOption) ([]any, bool, error)
    ReadStreamAsync(_ Client, workflowID string, key string) (<-chan StreamValue[any], error)

    // Workflow management
    RetrieveWorkflow(_ Client, workflowID string) (WorkflowHandle[any], error)
    CancelWorkflow(_ Client, workflowID string, opts ...CancelWorkflowOption) error
    CancelWorkflows(_ Client, workflowIDs []string, opts ...CancelWorkflowOption) error
    SetWorkflowAttributes(_ Client, workflowID string, attributes map[string]any) error
    SetWorkflowDelay(_ Client, workflowID string, opts ...SetWorkflowDelayOption) error
    ResumeWorkflow(_ Client, workflowID string, opts ...ResumeWorkflowOption) (WorkflowHandle[any], error)
    ResumeWorkflows(_ Client, workflowIDs []string, opts ...ResumeWorkflowOption) ([]WorkflowHandle[any], error)
    ForkWorkflow(_ Client, input ForkWorkflowInput) (WorkflowHandle[any], error)
    ForkWorkflows(_ Client, input ForkWorkflowsInput) ([]WorkflowHandle[any], error)
    ListWorkflows(_ Client, opts ...ListWorkflowsOption) ([]WorkflowStatus, error)
    GetWorkflowSteps(_ Client, workflowID string, opts ...GetWorkflowStepsOption) ([]StepInfo, error)
    GetWorkflowAggregates(_ Client, input GetWorkflowAggregatesInput) ([]WorkflowAggregateRow, error)
    GetStepAggregates(_ Client, input GetStepAggregatesInput) ([]StepAggregateRow, error)
    DeleteWorkflows(_ Client, workflowIDs []string, opts ...DeleteWorkflowOption) error

    // Queue management
    RegisterQueue(_ Client, name string, options ...QueueOption) (Queue, error)
    RetrieveQueue(_ Client, name string) (Queue, error)
    ListQueues(_ Client) ([]Queue, error)
    DeleteQueue(_ Client, name string) error

    // Schedule management
    CreateSchedule(_ Client, spec ScheduleSpec) error
    ApplySchedules(_ Client, schedules []ScheduleSpec) error
    PauseSchedule(_ Client, scheduleName string) error
    ResumeSchedule(_ Client, scheduleName string) error
    DeleteSchedule(_ Client, scheduleName string) error
    GetSchedule(_ Client, scheduleName string) (WorkflowSchedule, error)
    ListSchedules(_ Client, opts ...ListSchedulesOption) ([]WorkflowSchedule, error)
    BackfillSchedule(_ Client, scheduleName string, start, end time.Time) ([]string, error)
    TriggerSchedule(_ Client, scheduleName string) (WorkflowHandle[any], error)

    // Application version management
    ListApplicationVersions(_ Client) ([]VersionInfo, error)
    GetLatestApplicationVersion(_ Client) (VersionInfo, error)
    SetLatestApplicationVersion(_ Client, versionName string) error

    Shutdown(_ Client, timeout time.Duration) error
}
```

Like `Context` methods, `Client` interface methods take a leading `Client` receiver-argument.
In practice, always call the package-level functions documented below instead: they accept any `Client`, and the generic ones (`Enqueue[R]`, `RetrieveWorkflow[R]`, `GetEvent[R]`, `ReadStream[R]`, `ResumeWorkflow[R]`, `ForkWorkflow[R]`, `TriggerSchedule[R]`, …) return typed handles and values instead of `WorkflowHandle[any]`.

### Constructor

```go
func NewClient(ctx context.Context, config ClientConfig) (Client, error)
```

**Parameters:**
- `ctx`: A context for initialization operations
- `config`: A `ClientConfig` object with connection and application settings

```go
type ClientConfig struct {
    DatabaseURL            string          // Connection string to your system database. May be a PostgreSQL (postgres://...) or SQLite (sqlite:...) URL. Exactly one of DatabaseURL, SystemDBPool, or SQLiteSystemDB is required.
    SystemDBPool           *pgxpool.Pool   // A custom Postgres/CockroachDB connection pool. Optional; takes precedence over DatabaseURL. Mutually exclusive with SQLiteSystemDB.
    SQLiteSystemDB         *sql.DB         // A custom SQLite handle (e.g. from modernc.org/sqlite). Optional; takes precedence over DatabaseURL. Mutually exclusive with SystemDBPool.
    DatabaseSchema         string          // Database schema name (defaults to "dbos")
    Logger                 *slog.Logger    // Optional custom logger
    Serializer             Serializer[any] // Optional custom serializer (defaults to JSON). See the serialization reference.
    SystemDBStartupTimeout time.Duration   // Maximum time for system database connection and migrations (default: 2 minutes)
}
```

`NewClient` connects to the system database and starts a notification listener (or a poller on backends without listen/notify support), so every client operation — including blocking ones like `GetEvent` — works without launching the DBOS runtime.
Startup follows the same rules as `NewContext`, including `SystemDBStartupTimeout` — see [System database startup](./configuration.md#system-database-startup).

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
defer dbos.Shutdown(client, 5*time.Second)
```

A client manages a connection pool to the [DBOS system database](../../explanations/system-tables.md). Calling `Shutdown` on a client will release the connection pool.


### Shutdown

```go
func Shutdown(c Client, timeout time.Duration) error
```

Gracefully shuts down the client and releases the system database connection pool.
Returns a non-nil error if the timeout expired before all resources stopped.

**Parameters:**
- `c`: The DBOS client instance
- `timeout`: Maximum time to wait for graceful shutdown

## Workflow Interaction Methods

### Enqueue

```go
func Enqueue[R any, P any](
    c Client, 
    queueName string,
    workflowName string, 
    input P, 
    opts ...EnqueueOption
) (WorkflowHandle[R], error)
```

The input type `P` is inferred from the `input` argument — name only the result type `R`.

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
* `WithEnqueueDeduplicationPolicy(policy DeduplicationPolicy)`: Set how a colliding deduplication ID is handled. Requires `WithEnqueueDeduplicationID`. With the default `DeduplicationPolicyReject`, a colliding enqueue fails with a `ErrorCodeQueueDeduplicated` error; with `DeduplicationPolicyReturnExisting`, it instead returns a handle to the existing workflow. See [`WithDeduplicationPolicy`](./workflows-steps.md#withdeduplicationpolicy).
* `WithEnqueuePriority(priority uint)`: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
* `WithEnqueueClassName(className string)`: The class/namespace name for the target workflow. Required when enqueueing to Python, TypeScript, or Java targets, which dispatch workflows by (class_name, workflow_name) pair.
* `WithEnqueueConfigName(configName string)`: The config/instance name for the target workflow. Required when enqueueing to a workflow registered on a configured instance: a Go workflow registered with [`WithInstance`](./workflows-steps.md#withinstance), or a Python, TypeScript, or Java class instance workflow (e.g., Python's [`DBOSConfiguredInstance`](../../python/tutorials/classes.md), TypeScript's [`ConfiguredInstance`](../../typescript/tutorials/instantiated-objects.md)). The value must match the instance name used by the target application.
* `WithEnqueueDelay(delay time.Duration)`: Delay execution of the enqueued workflow by the specified duration. The workflow is initially placed in `DELAYED` status and transitions to `ENQUEUED` after the delay expires. The delay can later be updated via [`SetWorkflowDelay`](#setworkflowdelay).
* `WithEnqueueQueuePartitionKey(partitionKey string)`: The partition key to enqueue under when the target queue is a [partitioned queue](../tutorials/queue-tutorial.md#partitioning-queues). Each partition has its own concurrency limits.
* `WithEnqueueAttributes(attributes map[string]any)`: Attach custom key-value [attributes](./workflows-steps.md#withworkflowattributes) to the enqueued workflow. Attributes are recorded in the workflow status at creation, must be JSON-serializable, and can be searched with [`WithFilterAttributes`](./methods.md#withfilterattributes) on Postgres.
* `WithEnqueueAuthenticatedUser(user string)`: Associate the enqueued workflow with a user name.
* `WithEnqueueAuthenticatedRoles(roles ...string)`: Set the authenticated roles for the enqueued workflow.

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

handle, err := dbos.Enqueue[ProcessOutput](
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
func RetrieveWorkflow[R any](c Client, workflowID string) (WorkflowHandle[R], error)
```

Retrieve the [handle](./workflows-steps.md#workflowhandle) of a workflow with identity `workflowID`.
Similar to [`RetrieveWorkflow`](./methods.md#retrieveworkflow).
The generic `RetrieveWorkflow` returns a typed handle whose `GetResult` decodes the workflow output into type `R`.

**Parameters:**
- `workflowID`: The identifier of the workflow whose handle to retrieve

**Returns:**
- The [WorkflowHandle](./workflows-steps.md#workflowhandle) of the workflow whose ID is `workflowID`

### Send

```go
func Send[P any](c Client, destinationID string, message P, topic string, opts ...SendOption) error
```

Sends a message to a specified workflow. Similar to [`Send`](../tutorials/workflow-communication.md#send).

**Parameters:**
- `destinationID`: The workflow to which to send the message
- `message`: The message to send. Must be serializable
- `topic`: A topic with which to associate the message. Messages are enqueued per-topic on the receiver
- `opts`: Optional `SendOption` functions. Pass [`WithIdempotencyKey`](./methods.md#withidempotencykey) to make a retried `Send` deliver at most once, or [`WithPortableSend`](./methods.md#withportablesend) when the destination workflow runs in another language

### GetEvent

```go
func GetEvent[R any](c Client, targetWorkflowID, key string, timeout time.Duration) (R, error)
```

Retrieve the latest value of an event published by the workflow identified by `targetWorkflowID` to the key `key`.
If the event does not yet exist, wait for it to be published, returning an error if the wait times out.
Similar to [`GetEvent`](../tutorials/workflow-communication.md#getevent).
The generic `GetEvent` decodes the event value into type `R`.

**Parameters:**
- `targetWorkflowID`: The identifier of the workflow whose events to retrieve
- `key`: The key of the event to retrieve
- `timeout`: A timeout duration. If the wait times out, return an error

**Returns:**
- The value of the event published by `targetWorkflowID` with name `key`, or an error if the wait times out

## Workflow Management Methods

### ListWorkflows

```go
func ListWorkflows(c Client, opts ...ListWorkflowsOption) ([]WorkflowStatus, error)
```

Retrieve a list of [`WorkflowStatus`](./methods.md#workflow-status) of all workflows matching specified criteria.
Similar to [`ListWorkflows`](./methods.md#listworkflows).

**Options:**
Options are provided via `ListWorkflowsOption` functions. See [`ListWorkflows`](./methods.md#listworkflows) for available options.

:::warning
Workflow inputs and outputs are not loaded or decoded by default.
Pass [`WithFilterLoadInput(true)`](./methods.md#withfilterloadinput) / [`WithFilterLoadOutput(true)`](./methods.md#withfilterloadoutput) to opt in.
:::

### GetWorkflowSteps

```go
func GetWorkflowSteps(c Client, workflowID string, opts ...GetWorkflowStepsOption) ([]StepInfo, error)
```

List the steps of a given workflow. Similar to [`GetWorkflowSteps`](./methods.md#getworkflowsteps).
Step outputs are not loaded or decoded by default; pass [`WithStepsLoadOutput(true)`](./methods.md#withstepsloadoutput) to opt in.
Also accepts [`WithStepsLimit`](./methods.md#withstepslimit) and [`WithStepsOffset`](./methods.md#withstepsoffset) for pagination.

### CancelWorkflow

```go
func CancelWorkflow(c Client, workflowID string, opts ...CancelWorkflowOption) error
```

Cancel a workflow.
This sets its status to `CANCELLED` and removes it from its queue (if it is enqueued); a running execution stops at the start of its next durable operation.
Pass [`WithCancelChildren`](./methods.md#withcancelchildren) to also cancel the workflow's children, recursively.
Similar to [`CancelWorkflow`](./methods.md#cancelworkflow); see [cancellation behavior](../tutorials/workflow-management.md#cancelling-workflows).

### CancelWorkflows

```go
func CancelWorkflows(c Client, workflowIDs []string, opts ...CancelWorkflowOption) error
```

Cancel multiple workflows in a single database round-trip.
Missing or already-terminal IDs are silently skipped.
Similar to [`CancelWorkflows`](./methods.md#cancelworkflows).

### SetWorkflowAttributes

```go
func SetWorkflowAttributes(c Client, workflowID string, attributes map[string]any) error
```

Replace the custom [attributes](./workflows-steps.md#withworkflowattributes) attached to an existing workflow.
Pass a `nil` attributes map to clear all attributes.
Similar to [`SetWorkflowAttributes`](./methods.md#setworkflowattributes).

### DeleteWorkflows

```go
func DeleteWorkflows(c Client, workflowIDs []string, opts ...DeleteWorkflowOption) error
```

Permanently delete one or more workflows and all their associated data, regardless of their current status.
Pass [`WithDeleteChildren`](./methods.md#withdeletechildren) to also delete all child workflows recursively.
Similar to [`DeleteWorkflows`](./methods.md#deleteworkflows).

### SetWorkflowDelay

```go
func SetWorkflowDelay(c Client, workflowID string, opts ...SetWorkflowDelayOption) error
```

Set or update the delay on a `DELAYED` workflow.
Provide exactly one of [`WithDelayDuration`](./methods.md#withdelayduration) (relative) or [`WithDelayUntil`](./methods.md#withdelayuntil) (absolute).
Similar to [`SetWorkflowDelay`](./methods.md#setworkflowdelay).

### ResumeWorkflow

```go
func ResumeWorkflow[R any](c Client, workflowID string, opts ...ResumeWorkflowOption) (WorkflowHandle[R], error)
```

Resume a workflow.
This immediately starts it from its last completed step.
You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.
Pass [`WithResumeQueue`](./methods.md#withresumequeue) to re-enqueue the resumed workflow on a named queue instead of starting it immediately.
The generic `ResumeWorkflow` returns a typed handle whose `GetResult` decodes the workflow output into type `R`.
Similar to [`ResumeWorkflow`](./methods.md#resumeworkflow).

### ResumeWorkflows

```go
func ResumeWorkflows[R any](c Client, workflowIDs []string, opts ...ResumeWorkflowOption) ([]WorkflowHandle[R], error)
```

Resume multiple workflows in a single database round-trip.
Accepts the same options as [`ResumeWorkflow`](#resumeworkflow).
Similar to [`ResumeWorkflows`](./methods.md#resumeworkflows).

### ForkWorkflow

```go
func ForkWorkflow[R any](c Client, input ForkWorkflowInput) (WorkflowHandle[R], error)
```

Set `QueueName` on the input to enqueue the forked workflow on a named queue instead of starting it immediately.
The generic `ForkWorkflow` returns a typed handle whose `GetResult` decodes the forked workflow's output into type `R`.
Similar to [`ForkWorkflow`](./methods.md#forkworkflow).

### ForkWorkflows

```go
func ForkWorkflows[R any](c Client, input ForkWorkflowsInput) ([]WorkflowHandle[R], error)
```

Fork a batch of workflows in a single database round-trip.
The returned handles are in the same order as `input.Workflows`.
The generic `ForkWorkflows` returns typed handles whose `GetResult` decodes each forked workflow's output into type `R`.
Similar to [`ForkWorkflows`](./methods.md#forkworkflows).

### Debouncer

#### NewDebouncerClient

```go
func NewDebouncerClient[R any, P any](workflowName string, client Client, opts ...DebouncerOption) *DebouncerClient[R, P]
```

`R` is the workflow's result type and `P` its input type; neither can be inferred, so both must be named explicitly.

Create a new debouncer client for use from outside a DBOS application.
Similar to [`NewDebouncer`](./queues.md#newdebouncer) but uses a [Client](#constructor) instead of a Context and takes a workflow name string instead of a function reference.

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

#### WithDebouncerQueue

```go
func WithDebouncerQueue(queueName string) DebouncerOption
```

Run the debounced workflow on the named queue instead of the DBOS internal queue.
Debounce keys are scoped to the queue.
The queue is fixed per debouncer; `Debounce` calls cannot override it.

#### WithDebouncerClassName

```go
func WithDebouncerClassName(className string) DebouncerOption
```

Set the class/namespace name recorded for the debounced workflow.
Use with `NewDebouncerClient` when the target workflow is registered under a class name — for example by another language's runtime, which may resolve dequeued workflows by class name.

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
func (dc *DebouncerClient[R, P]) Debounce(key string, delay time.Duration, input P, opts ...WorkflowOption) (WorkflowHandle[R], error)
```

Debounce a workflow invocation from outside a DBOS application.
Behaves the same as [`Debouncer.Debounce`](./queues.md#debouncerdebounce) but does not require a Context.

**Parameters:**
- `key`: A unique key to group debounce calls.
- `delay`: Time by which to delay workflow execution.
- `input`: Input parameters to pass to the workflow.
- `opts`: Optional workflow options.

## Schedule Management

`Client` exposes the same [workflow scheduling](./methods.md#workflow-schedules) operations as the DBOS context, with the important difference that workflows are identified by name (string) rather than by function reference.
See the [scheduled workflows tutorial](../tutorials/scheduled-workflows.md) for an overview.

### ScheduleSpec

Schedules are described by the same [`ScheduleSpec`](./methods.md#createschedule) struct used from a `Context`.
From a client, set `WorkflowName` (the `Workflow` function-reference field can only be used with a `Context` that has the workflow registered):

```go
type ScheduleSpec struct {
    ScheduleName      string // Required: unique schedule name
    Schedule          string // Required: cron expression
    WorkflowName      string // Required from a client: target workflow name (FQN or custom name)
    Workflow          any    // Registered Go workflow function (Context only; wins over WorkflowName)
    WorkflowClassName string // Optional: class/namespace name (required for Python/TS/Java targets that dispatch by class)
    Context           any    // Optional: user-defined context (JSON-serialized)
    AutomaticBackfill bool   // Optional
    CronTimezone      string // Optional: IANA timezone name
    QueueName         string // Optional: target queue (defaults to the internal queue)
}
```

### CreateSchedule

```go
func CreateSchedule(c Client, spec ScheduleSpec) error
```

Create a new schedule. Similar to [`CreateSchedule`](./methods.md#createschedule).

**Example:**

```go
err := dbos.CreateSchedule(client, dbos.ScheduleSpec{
    ScheduleName: "my-schedule",
    WorkflowName: "myPeriodicTask",
    Schedule:     "*/5 * * * *",
    Context:      "my context",
})
```

### ApplySchedules

```go
func ApplySchedules(c Client, schedules []ScheduleSpec) error
```

Atomically create or replace the given schedules. Similar to [`ApplySchedules`](./methods.md#applyschedules).

### GetSchedule

```go
func GetSchedule(c Client, scheduleName string) (WorkflowSchedule, error)
```

Retrieve a [`WorkflowSchedule`](./methods.md#workflowschedule) by name. If no schedule with that name exists, the returned error matches `dbos.ErrScheduleNotFound`.

### ListSchedules

```go
func ListSchedules(c Client, opts ...ListSchedulesOption) ([]WorkflowSchedule, error)
```

List schedules, optionally filtered. Accepts the same options as [`ListSchedules`](./methods.md#listschedules).

### PauseSchedule

```go
func PauseSchedule(c Client, scheduleName string) error
```

Pause a schedule so it stops firing.

### ResumeSchedule

```go
func ResumeSchedule(c Client, scheduleName string) error
```

Resume a paused schedule.

### DeleteSchedule

```go
func DeleteSchedule(c Client, scheduleName string) error
```

Delete a schedule.

### BackfillSchedule

```go
func BackfillSchedule(c Client, scheduleName string, start, end time.Time) ([]string, error)
```

Backfill missed executions for the range `[start, end]`, returning the IDs of the enqueued workflows. Similar to [`BackfillSchedule`](./methods.md#backfillschedule).

### TriggerSchedule

```go
func TriggerSchedule[R any](c Client, scheduleName string) (WorkflowHandle[R], error)
```

Trigger a schedule to fire immediately, returning a handle for the enqueued workflow.
The generic `TriggerSchedule` returns a typed handle whose `GetResult` decodes the triggered workflow's output into type `R`.

## Application Version Management

### ListApplicationVersions

```go
func ListApplicationVersions(c Client) ([]VersionInfo, error)
```

Return every application version registered in the system database, ordered by timestamp (newest first).
Similar to [`ListApplicationVersions`](./methods.md#listapplicationversions).

### GetLatestApplicationVersion

```go
func GetLatestApplicationVersion(c Client) (VersionInfo, error)
```

Return the application version with the most recent timestamp.
If no versions are registered, the returned error matches `dbos.ErrNoApplicationVersions`.
Similar to [`GetLatestApplicationVersion`](./methods.md#getlatestapplicationversion).

### SetLatestApplicationVersion

```go
func SetLatestApplicationVersion(c Client, versionName string) error
```

Mark the named application version as latest by updating its timestamp to the current time.
Similar to [`SetLatestApplicationVersion`](./methods.md#setlatestapplicationversion).

## Stream Methods

### ReadStream

```go
func ReadStream[R any](c Client, workflowID string, key string, opts ...ReadStreamOption) ([]R, bool, error)
```

Read all values from a durable [stream](../tutorials/workflow-communication.md#workflow-streaming) produced by a workflow.
Blocks until the stream is closed or the workflow becomes inactive (status is not `PENDING` or `ENQUEUED`).
Pass [`WithReadStreamSnapshot`](./methods.md#withreadstreamsnapshot) to instead return as soon as all currently-available values have been drained.
Similar to [`ReadStream`](./methods.md#readstream).

**Parameters:**
- `c`: The DBOS client instance.
- `workflowID`: The ID of the workflow whose stream to read.
- `key`: The stream key to read.
- `opts`: Optional [ReadStreamOption](./methods.md#withreadstreamsnapshot) functions.

**Returns:**
- The typed values read from the stream.
- Whether the stream is closed.
- Any error that occurred.

### ReadStreamAsync

```go
func ReadStreamAsync[R any](c Client, workflowID string, key string) (<-chan StreamValue[R], error)
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