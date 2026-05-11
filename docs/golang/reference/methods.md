---
sidebar_position: 30
title: DBOS Methods & Variables
toc_max_heading_level: 3
---

## Workflow Communication

### GetEvent

```go
func GetEvent[R any](ctx DBOSContext, targetWorkflowID, key string, timeout time.Duration) (R, error)
```

Retrieve the latest value of an event published by the workflow identified by `targetWorkflowID` to the key `key`.
If the event does not yet exist, wait for it to be published, returning an error if the wait times out.

**Parameters:**
- **ctx**: The DBOS context.
- **targetWorkflowID**: The identifier of the workflow whose events to retrieve.
- **key**: The key of the event to retrieve.
- **timeout**: A timeout. If the wait times out, return an error.


### SetEvent

```go
func SetEvent[P any](ctx DBOSContext, key string, message P, opts ...SetEventOption) error
```
Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
Can only be called from within a workflow.

**Parameters:**
- **ctx**: The DBOS context.
- **key**: The key of the event.
- **message**: The value of the event. Must be serializable.
- **opts**: Optional [SetEventOption](#withportablesetevent) functions.


### Send

```go
func Send[P any](ctx DBOSContext, destinationID string, message P, topic string, opts ...SendOption) error
```
Send a message to the workflow identified by `destinationID`.
Messages can optionally be associated with a topic.

**Parameters:**
- **ctx**: The DBOS context.
- **destinationID**: The workflow to which to send the message.
- **message**: The message to send. Must be serializable.
- **topic**: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- **opts**: Optional [SendOption](#withportablesend) functions.

### Recv

```go
func Recv[R any](ctx DBOSContext, topic string, timeout time.Duration) (R, error)
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning an error if the wait times out.

**Parameters:**
- **ctx**: The DBOS context.
- **topic**: A topic queue on which to wait.
- **timeoutSeconds**: A timeout in seconds. If the wait times out, return an error.

## Streams

Workflows can stream data to clients in real time.
Streams are durable, append-only, and ordered by offset.
See the [streaming tutorial](../tutorials/workflow-communication.md#workflow-streaming) for usage examples.

### WriteStream

```go
func WriteStream[P any](ctx DBOSContext, key string, value P, opts ...WriteStreamOption) error
```

Write a value to a durable stream.
May only be called from within a workflow or step.
Writes from a workflow are exactly-once; writes from a step are at-least-once.

**Parameters:**
- **ctx**: The DBOS context.
- **key**: The stream key. A workflow can have multiple streams, each identified by a unique key.
- **value**: The value to write. Must be serializable (json-encodable).
- **opts**: Optional [WriteStreamOption](#withportablewritestream) functions.

### CloseStream

```go
func CloseStream(ctx DBOSContext, key string) error
```

Close a durable stream.
May only be called from within a workflow or step.
After closing, no more values can be written to the stream.
Streams are also automatically closed when the workflow terminates.

**Parameters:**
- **ctx**: The DBOS context.
- **key**: The stream key to close.

### ReadStream

```go
func ReadStream[R any](ctx DBOSContext, workflowID string, key string) ([]R, bool, error)
```

Read all values from a durable stream.
Blocks until the stream is closed or the workflow becomes inactive (status is not `PENDING` or `ENQUEUED`).

**Parameters:**
- **ctx**: The DBOS context.
- **workflowID**: The ID of the workflow whose stream to read.
- **key**: The stream key to read.

**Returns:**
- The values read from the stream.
- Whether the stream is closed.
- Any error that occurred.

### ReadStreamAsync

```go
func ReadStreamAsync[R any](ctx DBOSContext, workflowID string, key string) (<-chan StreamValue[R], error)
```

Read values from a durable stream asynchronously.
Returns immediately with a channel that receives values as they are written to the stream.
The channel is closed when the stream is closed or an error occurs.

**Parameters:**
- **ctx**: The DBOS context.
- **workflowID**: The ID of the workflow whose stream to read.
- **key**: The stream key to read.

**Returns:**
- A receive-only channel of [`StreamValue[R]`](#streamvalue).
- Any error that occurred during setup.

### StreamValue

```go
type StreamValue[R any] struct {
    Value  R     // The stream value (zero value if error/closed)
    Err    error // Error if one occurred (nil otherwise)
    Closed bool  // Whether the stream is closed
}
```

`StreamValue` holds a value, error, or closed status from an async stream read operation.
When reading from the channel returned by `ReadStreamAsync`, check `Err` and `Closed` before using `Value`.

## Sleep

### Sleep

```go
func Sleep(ctx DBOSContext, duration time.Duration) (time.Duration, error)
```

Sleep for the given duration.
May only be called from within a workflow.
This sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.

**Parameters:**
- **ctx**: The DBOS context.
- **duration**: The duration to sleep.

## Workflow Management Methods

### RetrieveWorkflow

```go
func RetrieveWorkflow[R any](ctx DBOSContext, workflowID string) (*workflowPollingHandle[R], error)
```

Retrieve the [handle](./workflows-steps.md#workflowhandle) of a workflow.

**Parameters**:
- **ctx**: The DBOS context.
- **workflowID**: The ID of the workflow whose handle to retrieve.

### ListWorkflows

```go
func ListWorkflows(ctx DBOSContext, opts ...ListWorkflowsOption) ([]WorkflowStatus, error)
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all workflows matching specified criteria.

**Example usage:**

```go
// List all successful workflows from the last 24 hours
workflows, err := dbos.ListWorkflows(ctx,
    dbos.WithStatus([]dbos.WorkflowStatusType{dbos.WorkflowStatusSuccess}),
    dbos.WithStartTime(time.Now().Add(-24*time.Hour)),
    dbos.WithLimit(100))
if err != nil {
    log.Fatal(err)
}

// List workflows by specific IDs without loading input/output data
workflows, err := dbos.ListWorkflows(ctx,
    dbos.WithWorkflowIDs([]string{"workflow1", "workflow2"}),
    dbos.WithLoadInput(false),
    dbos.WithLoadOutput(false))
if err != nil {
    log.Fatal(err)
}
```

#### WithAppVersion

```go
func WithAppVersion(appVersion string) ListWorkflowsOption
```

Retrieve workflows tagged with this application version.


#### WithEndTime

```go
func WithEndTime(endTime time.Time) ListWorkflowsOption
```

Retrieve workflows started before this timestamp.

#### WithLimit

```go
func WithLimit(limit int) ListWorkflowsOption
```

Retrieve up to this many workflows.

#### WithLoadInput

```go
func WithLoadInput(loadInput bool) ListWorkflowsOption
```

WithLoadInput controls whether to load workflow input data (default: true).

#### WithLoadOutput

```go
func WithLoadOutput(loadOutput bool) ListWorkflowsOption
```

WithLoadOutput controls whether to load workflow output data (default: true).

#### WithName

```go
func WithName(name string) ListWorkflowsOption
```

Filter workflows by the specified workflow function name.

#### WithOffset

```go
func WithOffset(offset int) ListWorkflowsOption
```

Skip this many workflows from the results returned (for pagination).

#### WithSortDesc

```go
func WithSortDesc(sortDesc bool) ListWorkflowsOption
```

Sort the results in descending (true) or ascending (false) order by workflow start time.

#### WithStartTime

```go
func WithStartTime(startTime time.Time) ListWorkflowsOption
```

Retrieve workflows started after this timestamp.

#### WithStatus

```go
func WithStatus(status []WorkflowStatusType) ListWorkflowsOption
```

Filter workflows by [status](#workflowstatustype). Multiple statuses can be specified.

#### WithUser

```go
func WithUser(user string) ListWorkflowsOption
```

Filter workflows run by this authenticated user.

#### WithWorkflowIDs

```go
func WithWorkflowIDs(workflowIDs []string) ListWorkflowsOption
```

Filter workflows by specific workflow IDs.

#### WithWorkflowIDPrefix

```go
func WithWorkflowIDPrefix(prefix string) ListWorkflowsOption
```

Filter workflows whose IDs start with the specified prefix.

#### WithQueuesOnly

```go
func WithQueuesOnly() ListWorkflowsOption
```

Return only workflows that are currently in a queue (queue name is not null, status is `ENQUEUED` or `PENDING`).

### GetWorkflowSteps

```go
func GetWorkflowSteps(ctx DBOSContext, workflowID string) ([]StepInfo, error)
```

GetWorkflowSteps retrieves the execution steps of a workflow.
This is a list of `StepInfo` objects, with the following structure:

```go
type StepInfo struct {
    StepID          int    // The sequential ID of the step within the workflow
    StepName        string // The name of the step function
    Output          any    // The output returned by the step (if any)
    Error           error  // The error returned by the step (if any)
    ChildWorkflowID string  // If the step starts or retrieves the result of a workflow, its ID
}
```

**Parameters:**
- **ctx**: The DBOS context.
- **workflowID**: The ID of the workflow to cancel.

### CancelWorkflow

```go
func CancelWorkflow(ctx DBOSContext, workflowID string) error
```

Cancel a workflow. This sets its status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step).

**Parameters:**
- **ctx**: The DBOS context.
- **workflowID**: The ID of the workflow to cancel.

### ResumeWorkflow

```go
func ResumeWorkflow[R any](ctx DBOSContext, workflowID string, opts ...ResumeWorkflowOption) (*WorkflowHandle[R], error)
```

Resume a workflow. This immediately starts it from its last completed step. You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts. You can also use this to start an enqueued workflow immediately, bypassing its queue.

**Parameters:**
- **ctx**: The DBOS context.
- **workflowID**: The ID of the workflow to resume.
- **opts**: Optional configuration, documented below.

#### WithResumeQueue

```go
func WithResumeQueue(queueName string) ResumeWorkflowOption
```

Re-enqueue the resumed workflow on the specified queue instead of starting it immediately.

### ResumeWorkflows

```go
func ResumeWorkflows[R any](ctx DBOSContext, workflowIDs []string, opts ...ResumeWorkflowOption) ([]WorkflowHandle[R], error)
```

Resume multiple workflows in a single database round-trip.
Each workflow that exists and is not in a terminal state is re-enqueued; completed or missing workflows are skipped.
Unlike [`ResumeWorkflow`](#resumeworkflow), this function does not return an error when some IDs are missing.

Accepts the same options as [`ResumeWorkflow`](#resumeworkflow) (e.g., [`WithResumeQueue`](#withresumequeue)).

**Parameters:**
- **ctx**: The DBOS context.
- **workflowIDs**: The IDs of the workflows to resume.
- **opts**: Optional configuration.

### ForkWorkflow

```go
func ForkWorkflow[R any](ctx DBOSContext, input ForkWorkflowInput) (WorkflowHandle[R], error)
```

Start a new execution of a workflow from a specific step. The input step ID (`startStep`) must match the step number of the step returned by workflow introspection. The specified `startStep` is the step from which the new workflow will start, so any steps whose ID is less than `startStep` will not be re-executed.

**Parameters:**
- **ctx**: The DBOS context.
- **input**: A `ForkWorkflowInput` struct where `OriginalWorkflowID` is mandatory.

```go
type ForkWorkflowInput struct {
    OriginalWorkflowID string // Required: The UUID of the original workflow to fork from
    ForkedWorkflowID   string // Optional: Custom workflow ID for the forked workflow (auto-generated if empty)
    StartStep          uint   // Optional: Step to start the forked workflow from (default: 0)
    ApplicationVersion string // Optional: Application version for the forked workflow (inherits from original if empty)
    QueueName          string // Optional: Queue to enqueue the forked workflow on (defaults to starting immediately)
}
```

If `QueueName` is set, the forked workflow is enqueued on the specified queue instead of starting immediately.

### SetWorkflowDelay

```go
func SetWorkflowDelay(ctx DBOSContext, workflowID string, opts ...SetWorkflowDelayOption) error
```

Set or update the delay on a [`DELAYED`](#workflowstatustype) workflow.
Provide exactly one of [`WithDelayDuration`](#withdelayduration) (relative) or [`WithDelayUntil`](#withdelayuntil) (absolute).
Only affects workflows currently in the `DELAYED` status.

**Parameters:**
- **ctx**: The DBOS context.
- **workflowID**: The ID of the workflow whose delay to update.
- **opts**: Exactly one of `WithDelayDuration` or `WithDelayUntil`.

**Example:**

```go
// Shorten the delay to 10 seconds from now
err := dbos.SetWorkflowDelay(ctx, workflowID, dbos.WithDelayDuration(10*time.Second))

// Or set an absolute deadline
err = dbos.SetWorkflowDelay(ctx, workflowID, dbos.WithDelayUntil(time.Now().Add(time.Hour)))
```

#### WithDelayDuration

```go
func WithDelayDuration(d time.Duration) SetWorkflowDelayOption
```

Set a relative delay measured from now.

#### WithDelayUntil

```go
func WithDelayUntil(t time.Time) SetWorkflowDelayOption
```

Set an absolute time until which the workflow should remain delayed.

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```go
type WorkflowStatus struct {
    ID                 string             `json:"workflow_uuid"`       // Unique identifier for the workflow
    Status             WorkflowStatusType `json:"status"`              // Current execution status
    Name               string             `json:"name"`                // Function name of the workflow
    AuthenticatedUser  *string            `json:"authenticated_user"`  // User who initiated the workflow (if applicable)
    AssumedRole        *string            `json:"assumed_role"`        // Role assumed during execution (if applicable)
    AuthenticatedRoles *string            `json:"authenticated_roles"` // Roles available to the user (if applicable)
    Output             any                `json:"output"`              // Workflow output (available after completion)
    Error              error              `json:"error"`               // Error information (if status is ERROR)
    ExecutorID         string             `json:"executor_id"`         // ID of the executor running this workflow
    CreatedAt          time.Time          `json:"created_at"`          // When the workflow was created
    UpdatedAt          time.Time          `json:"updated_at"`          // When the workflow status was last updated
    ApplicationVersion string             `json:"application_version"` // Version of the application that created this workflow
    ApplicationID      string             `json:"application_id"`      // Application identifier
    Attempts           int                `json:"attempts"`            // Number of execution attempts
    QueueName          string             `json:"queue_name"`          // Queue name (if workflow was enqueued)
    Timeout            time.Duration      `json:"timeout"`             // Workflow timeout duration
    Deadline           time.Time          `json:"deadline"`            // Absolute deadline for workflow completion
    StartedAt          time.Time          `json:"started_at"`          // When the workflow execution actually started
    DeduplicationID    string             `json:"deduplication_id"`    // Deduplication identifier (if applicable)
    Input              any                `json:"input"`               // Input parameters passed to the workflow
    Priority           int                `json:"priority"`            // Execution priority (lower numbers have higher priority)
    DelayUntil         time.Time          `json:"delay_until"`         // Time before which a DELAYED workflow should not be dequeued
}
```

#### WorkflowStatusType

The `WorkflowStatusType` represents the execution status of a workflow:

```go
type WorkflowStatusType string

const (
    WorkflowStatusPending                     WorkflowStatusType = "PENDING"                        // Workflow is running or ready to run
    WorkflowStatusEnqueued                    WorkflowStatusType = "ENQUEUED"                       // Workflow is queued and waiting for execution
    WorkflowStatusDelayed                     WorkflowStatusType = "DELAYED"                        // Workflow is delayed and will transition to ENQUEUED after the delay expires
    WorkflowStatusSuccess                     WorkflowStatusType = "SUCCESS"                        // Workflow completed successfully
    WorkflowStatusError                       WorkflowStatusType = "ERROR"                          // Workflow completed with an error
    WorkflowStatusCancelled                   WorkflowStatusType = "CANCELLED"                      // Workflow was cancelled (manually or due to timeout)
    WorkflowStatusMaxRecoveryAttemptsExceeded WorkflowStatusType = "MAX_RECOVERY_ATTEMPTS_EXCEEDED" // Workflow exceeded maximum retry attempts
)
```

## Workflow Schedules

DBOS lets you schedule workflows to run on a cron expression.
Schedules are stored in the database and can be created, paused, resumed, and deleted at runtime.
See the [scheduled workflows tutorial](../tutorials/scheduled-workflows.md) for an overview.

Scheduled workflows must accept a [`ScheduledWorkflowInput`](#scheduledworkflowinput) as their input parameter.

### ScheduledWorkflowInput

```go
type ScheduledWorkflowInput struct {
    ScheduledTime time.Time // The cron tick time
    Context       any       // The user-defined context attached to the schedule (nil if none)
}
```

The input type of a scheduled workflow function. `Context` is JSON-serialized when stored and decoded into an `any` value when the workflow fires; type-assert or unmarshal it inside the workflow.

### WorkflowSchedule

```go
type WorkflowSchedule struct {
    ScheduleID        string         // Unique ID assigned to this schedule revision
    ScheduleName      string         // User-supplied unique name
    WorkflowName      string         // Fully-qualified or custom name of the workflow
    WorkflowClassName string         // Class/namespace (used for cross-language dispatch)
    Schedule          string         // Cron expression
    Status            ScheduleStatus // ACTIVE or PAUSED
    Context           any            // User-defined context attached to the schedule
    LastFiredAt       *time.Time     // Last time the schedule fired (nil if never)
    AutomaticBackfill bool           // Whether to backfill missed ticks on application start
    CronTimezone      string         // IANA timezone name (empty for UTC)
    QueueName         string         // Queue on which scheduled workflows are enqueued
}
```

#### ScheduleStatus

```go
type ScheduleStatus string

const (
    ScheduleStatusActive ScheduleStatus = "ACTIVE" // Schedule is firing
    ScheduleStatusPaused ScheduleStatus = "PAUSED" // Schedule is paused
)
```

### CreateSchedule

```go
func CreateSchedule(ctx DBOSContext, fn ScheduledWorkflowFunc, input CreateScheduleRequest, opts ...CreateScheduleOption) error
```

Create a new schedule for a registered workflow.
Fails if a schedule with the same name already exists.
The reconciler loop picks the new schedule up on its next tick and installs it in the cron scheduler.

The workflow function `fn` must be already registered via [`RegisterWorkflow`](./workflows-steps.md#registerworkflow) and must conform to:

```go
type ScheduledWorkflowFunc func(ctx DBOSContext, input ScheduledWorkflowInput) (any, error)
```

**Parameters:**
- **ctx**: The DBOS context.
- **fn**: The scheduled workflow function reference.
- **input**: A [`CreateScheduleRequest`](#createschedulerequest) with the schedule name and cron expression.
- **opts**: Optional schedule configuration, documented below.

#### CreateScheduleRequest

```go
type CreateScheduleRequest struct {
    ScheduleName string // Unique name of the schedule
    Schedule     string // Cron expression
}
```

#### WithScheduleContext

```go
func WithScheduleContext(context any) CreateScheduleOption
```

Attach a user-defined value (serialized as JSON) that is passed to each scheduled invocation as `ScheduledWorkflowInput.Context`.

#### WithAutomaticBackfill

```go
func WithAutomaticBackfill(enabled bool) CreateScheduleOption
```

Enable automatic backfill of missed ticks when the schedule is reloaded after downtime (or when a paused schedule is resumed).

#### WithCronTimezone

```go
func WithCronTimezone(tz string) CreateScheduleOption
```

Interpret the cron expression in the given [IANA timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (e.g. `"America/New_York"`). Defaults to UTC.

#### WithScheduleQueueName

```go
func WithScheduleQueueName(name string) CreateScheduleOption
```

Route each scheduled invocation to the named [queue](./queues.md) instead of the default internal queue.

#### WithScheduleWorkflowClassName

```go
func WithScheduleWorkflowClassName(name string) CreateScheduleOption
```

Record a class/namespace name on the schedule for cross-language dispatch.
Use this when the scheduled workflow is owned by a non-Go runtime (e.g. a Python class-based workflow) so the stored schedule carries the correct class name.

**Example:**

```go
err := dbos.CreateSchedule(ctx, myPeriodicTask, dbos.CreateScheduleRequest{
    ScheduleName: "my-schedule",
    Schedule:     "*/5 * * * *",
},
    dbos.WithScheduleContext("my context"),
    dbos.WithAutomaticBackfill(true),
)
```

### ApplySchedules

```go
func ApplySchedules(ctx DBOSContext, schedules []ApplySchedulesRequest) error
```

Atomically create or replace a list of schedules in a single transaction.
For each entry, any existing schedule with the same name is deleted before the new schedule is inserted.
Useful for defining a fixed set of static schedules on application start.

`ApplySchedules` cannot be called from within a workflow.

```go
type ApplySchedulesRequest struct {
    ScheduleName      string // Required
    WorkflowFn        any    // Required: a registered scheduled workflow function
    Schedule          string // Required: cron expression
    Context           any    // Optional: user-defined context (JSON-serialized)
    AutomaticBackfill bool   // Optional
    CronTimezone      string // Optional: IANA timezone name
    QueueName         string // Optional: target queue
}
```

**Example:**

```go
err := dbos.ApplySchedules(ctx, []dbos.ApplySchedulesRequest{
    {ScheduleName: "a", WorkflowFn: workflowA, Schedule: "*/10 * * * *"},
    {ScheduleName: "b", WorkflowFn: workflowB, Schedule: "0 0 * * *"},
})
```

### GetSchedule

```go
func GetSchedule(ctx DBOSContext, scheduleName string) (*WorkflowSchedule, error)
```

Retrieve a [`WorkflowSchedule`](#workflowschedule) by name. Returns `(nil, nil)` if no schedule with that name exists.

### ListSchedules

```go
func ListSchedules(ctx DBOSContext, opts ...ListSchedulesOption) ([]WorkflowSchedule, error)
```

List schedules, optionally filtered. Pass no options to return all schedules.

#### WithScheduleStatuses

```go
func WithScheduleStatuses(statuses ...ScheduleStatus) ListSchedulesOption
```

Filter by one or more [`ScheduleStatus`](#schedulestatus) values.

#### WithScheduleWorkflowNames

```go
func WithScheduleWorkflowNames(names ...string) ListSchedulesOption
```

Filter by workflow name(s). Use the fully qualified name or the custom name registered via [`WithWorkflowName`](./workflows-steps.md#withworkflowname).

#### WithScheduleNamePrefixes

```go
func WithScheduleNamePrefixes(prefixes ...string) ListSchedulesOption
```

Filter by schedule name prefix(es).

### PauseSchedule

```go
func PauseSchedule(ctx DBOSContext, scheduleName string) error
```

Pause a schedule so it stops firing. The schedule's cron entry is removed on the next reconciler tick.

### ResumeSchedule

```go
func ResumeSchedule(ctx DBOSContext, scheduleName string) error
```

Resume a paused schedule. If the schedule was created with [`WithAutomaticBackfill(true)`](#withautomaticbackfill), missed ticks during the pause are backfilled.

### DeleteSchedule

```go
func DeleteSchedule(ctx DBOSContext, scheduleName string) error
```

Delete a schedule. The schedule's cron entry is removed on the next reconciler tick.

### BackfillSchedule

```go
func BackfillSchedule(ctx DBOSContext, scheduleName string, start, end time.Time) ([]string, error)
```

Backfill missed executions for the range `[start, end]`, returning the IDs of the enqueued workflows.
Already-executed ticks are automatically skipped, so it is safe to overlap ranges.
Cannot be called from within a workflow.

**Example:**

```go
ids, err := dbos.BackfillSchedule(ctx, "my-schedule",
    time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
    time.Date(2025, 1, 2, 0, 0, 0, 0, time.UTC),
)
```

### TriggerSchedule

```go
func TriggerSchedule(ctx DBOSContext, scheduleName string) (WorkflowHandle[any], error)
```

Trigger a schedule to fire immediately and return a [`WorkflowHandle`](./workflows-steps.md#workflowhandle) for the enqueued workflow.
Cannot be called from within a workflow.

## DBOS Variables

### GetWorkflowID

```go
func GetWorkflowID(ctx DBOSContext) (string, error)
```

Return the ID of the current workflow, if in a workflow. Returns an error if not called from within a workflow context.

**Parameters:**
- **ctx**: The DBOS context.

### GetStepID

```go
func GetStepID(ctx DBOSContext) (int, error)
```

Return the unique ID of the current step within a workflow. Returns an error if not called from within a step context.

**Parameters:**
- **ctx**: The DBOS context.

## Portable Serialization Options and Types

These options enable [cross-language interoperability](../../explanations/portable-workflows.md) by using the portable JSON serialization format.

### WithPortableSend

```go
func WithPortableSend() SendOption
```

Configure [`Send`](#send) to use the portable JSON serializer, enabling cross-language message passing.

### WithPortableSetEvent

```go
func WithPortableSetEvent() SetEventOption
```

Configure [`SetEvent`](#setevent) to use the portable JSON serializer, enabling cross-language event consumption.

### WithPortableWriteStream

```go
func WithPortableWriteStream() WriteStreamOption
```

Configure [`WriteStream`](#writestream) to use the portable JSON serializer, enabling cross-language stream reading.

### PortableWorkflowError

```go
type PortableWorkflowError struct {
    Name    string // The error type/class name
    Message string // Human-readable error message
    Code    any    // Optional application-specific error code
    Data    any    // Optional structured error details
}
```

A structured error type for workflows using portable serialization.
Portable workflows automatically serialize errors in this format.

```go
return nil, &dbos.PortableWorkflowError{
    Name:    "ValidationError",
    Message: "invalid input",
    Code:    400,
}
```

### PortableWorkflowArgs

```go
type PortableWorkflowArgs struct {
    PositionalArgs []any          `json:"positional_args,omitempty"`
    NamedArgs      map[string]any `json:"named_args,omitempty"`
}
```

The cross-language envelope for workflow inputs.
When passed as the input to a DBOS Client's [`Enqueue`](./client.md#enqueue), portable JSON serialization is used automatically.
Further, a portable workflow ran with [`RunWorkflow`](workflows-steps.md#runworkflow) will serialize its input in this format automatically.

```go
args := dbos.PortableWorkflowArgs{
    PositionalArgs: []any{"order-123", 42},
}
handle, err := dbos.Enqueue[dbos.PortableWorkflowArgs, any](
    client, "queue", "target_workflow", args,
)
```

## Alerting

### SetAlertHandler

```go
func SetAlertHandler(ctx DBOSContext, handler AlertHandler)
```

```go
type AlertHandler func(name string, message string, metadata map[string]string)
```

Register a handler to receive [alerts](../../production/alerting.md) from Conductor.
The handler function is called with three arguments:

- **name**: The type of alert rule. One of `WorkflowFailure`, `SlowQueue`, or `UnresponsiveApplication`.
- **message**: The alert message.
- **metadata**: A map of string key-value pairs with additional alert information.

Only one alert handler may be registered per application, and it must be registered before [`Launch`](./dbos-context.md#launch) is called.
If no handler is registered, alerts are logged automatically.

**Example syntax:**

```go
dbos.SetAlertHandler(dbosContext, func(ruleType string, message string, metadata map[string]string) {
    slog.Warn(fmt.Sprintf("Alert received: %s - %s", ruleType, message))
    for key, value := range metadata {
        slog.Warn(fmt.Sprintf("  %s: %s", key, value))
    }
})
```
