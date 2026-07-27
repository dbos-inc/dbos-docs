---
sidebar_position: 10
title: DBOS Context
pagination_prev: null
---

A DBOS Context is at the center of a DBOS-enabled application. Use it to register [workflows](../tutorials/workflow-tutorial.md), [queues](../tutorials/queue-tutorial.md) and perform [workflow management](../tutorials/workflow-management.md) tasks.

`Context` extends Go's [`context.Context`](https://pkg.go.dev/context#Context) interface and carries essential state across workflow execution. Workflows and steps receive a new `Context` spun out of the root `Context` you manage. In addition, a `Context` can be used to set [workflow timeouts](../tutorials/workflow-tutorial.md#workflow-timeouts).

`Context` satisfies [`Client`](./client.md), which owns every operation that does not require a launched runtime (enqueue, messaging, events, streams, workflow/queue/schedule/version management, `Shutdown`) — so a `Context` can be passed anywhere a `Client` is accepted. The remaining methods require a launched runtime or a workflow scope:

```go
type Context interface {
    context.Context

    // Client methods — every operation below is also available before Launch() and from a standalone Client
    Enqueue(_ Client, queueName string, workflowName string, input any, opts ...EnqueueOption) (WorkflowHandle[any], error)
    Send(_ Client, destinationID string, message any, topic string, opts ...SendOption) error
    GetEvent(_ Client, targetWorkflowID string, key string, timeout time.Duration) (any, error)
    ReadStream(_ Client, workflowID string, key string, opts ...ReadStreamOption) ([]any, bool, error)
    ReadStreamAsync(_ Client, workflowID string, key string) (<-chan StreamValue[any], error)
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
    RegisterQueue(_ Client, name string, options ...QueueOption) (Queue, error)
    RetrieveQueue(_ Client, name string) (Queue, error)
    ListQueues(_ Client) ([]Queue, error)
    DeleteQueue(_ Client, name string) error
    CreateSchedule(_ Client, spec ScheduleSpec) error
    ApplySchedules(_ Client, schedules []ScheduleSpec) error
    PauseSchedule(_ Client, scheduleName string) error
    ResumeSchedule(_ Client, scheduleName string) error
    DeleteSchedule(_ Client, scheduleName string) error
    GetSchedule(_ Client, scheduleName string) (WorkflowSchedule, error)
    ListSchedules(_ Client, opts ...ListSchedulesOption) ([]WorkflowSchedule, error)
    BackfillSchedule(_ Client, scheduleName string, start, end time.Time) ([]string, error)
    TriggerSchedule(_ Client, scheduleName string) (WorkflowHandle[any], error)
    ListApplicationVersions(_ Client) ([]VersionInfo, error)
    GetLatestApplicationVersion(_ Client) (VersionInfo, error)
    SetLatestApplicationVersion(_ Client, versionName string) error
    Shutdown(_ Client, timeout time.Duration) error

    // Context Lifecycle
    Launch() error

    // Workflow operations
    RunAsStep(_ Context, fn StepFunc, opts ...StepOption) (any, error)
    RunAsTransaction(_ Context, ds *DataSource, fn TxnFunc, opts ...StepOption) (any, error)
    RunWorkflow(_ Context, fn WorkflowFunc, input any, opts ...WorkflowOption) (WorkflowHandle[any], error)
    Go(_ Context, fn StepFunc, opts ...StepOption) (<-chan StepOutcome[any], error)
    Select(_ Context, channels []<-chan StepOutcome[any]) (any, error)
    Recv(_ Context, topic string, timeout time.Duration) (any, error)
    SetEvent(_ Context, key string, message any, opts ...SetEventOption) error
    WriteStream(_ Context, key string, value any, opts ...WriteStreamOption) error
    CloseStream(_ Context, key string) error
    Sleep(_ Context, duration time.Duration) (time.Duration, error)
    Patch(_ Context, patchName string) (bool, error)
    DeprecatePatch(_ Context, patchName string) error
    GetWorkflowID() (string, error) // Only available within workflows
    GetStepID() (int, error)        // Only available within workflows

    // Registration
    ListRegisteredWorkflows(_ Context) []WorkflowRegistryEntry
    ListenQueues(_ Context, names ...string)
    ListenedQueues(_ Context) []string

    // Accessors
    GetApplicationVersion() string
    GetExecutorID() string
    GetApplicationID() string

    // Context management
    From(_ Context, ctx context.Context) Context
    WithoutCancel(_ Context) Context
    WithTimeout(_ Context, timeout time.Duration) (Context, context.CancelFunc)
    WithValue(key, val any) Context
    WithCancel() (Context, context.CancelFunc)
    WithCancelCause() (Context, context.CancelCauseFunc)

    // Alert handling
    SetAlertHandler(handler AlertHandler) // Must be called before Launch
}
```

Like `Client` methods, `Context` interface methods take a leading receiver-argument; in practice, call the package-level functions documented on this page and in [Workflows & Steps](./workflows-steps.md) and [DBOS Methods & Variables](./methods.md).

## Lifecycle
### Initialization

You can create a DBOS context using `NewContext`, which takes a [`Config`](./configuration.md) object where `AppName` and one of `DatabaseURL`, `SystemDBPool`, or `SQLiteSystemDB` are mandatory.

```go
func NewContext(ctx context.Context, inputConfig Config) (Context, error)
```

For example:
```go
dbosContext, err := dbos.NewContext(context.Background(), dbos.Config{
    AppName:            "dbos-starter",
    ApplicationVersion: "0.1.0",
    DatabaseURL:        os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
})
if err != nil {
    panic(err)
}
```

`NewContext` connects to your system database and runs any pending schema migrations — see [System database startup](./configuration.md#system-database-startup).
The newly created Context must be launched with `Launch()` before use and should be shut down with Shutdown() at program termination.

### launch

```go
dbos.Launch(ctx Context) error
```

Launch the following resources managed by a `Context`:
- A [system database connection pool](../../explanations/system-tables.md)
- A [workflow scheduler](../tutorials/scheduled-workflows.md)
- A [workflow queue runner](../tutorials/queue-tutorial.md)
- (Optionally) an admin server
- (Optionally) a Conductor connection

In addition, `Launch()` may perform [workflow recovery](../../architecture.md#how-workflow-recovery-works).
`Launch()` should be called by your program during startup before running any workflows.

### Shutdown
```go
dbos.Shutdown(ctx Context, timeout time.Duration) error
```

Gracefully shutdown the DBOS runtime, waiting for workflows to complete and cleaning up resources. Returns a non-nil error if the timeout expired before all resources stopped. When you shutdown a `Context`, the underlying `context.Context` will be cancelled, which signals all DBOS resources they should stop executing, including workflows and steps.

**Parameters:**
- **timeout**: The time to wait for DBOS resources to gracefully terminate.

## Context management

### WithTimeout

```go
func WithTimeout(ctx Context, timeout time.Duration) (Context, context.CancelFunc)
```

`WithTimeout` returns a copy of the DBOS context with a timeout. The returned context will be canceled after the specified duration. See [workflow timeouts](../tutorials/workflow-tutorial.md#workflow-timeouts) for usage.

### WithoutCancel

```go
func WithoutCancel(ctx Context) Context
```

`WithoutCancel` returns a copy of the DBOS context that is not canceled when the parent context is canceled. This is useful to detach child workflows from their parent's timeout.

### WithCancel

```go
func WithCancel(ctx Context) (Context, context.CancelFunc)
```

`WithCancel` returns a copy of the DBOS context that can be manually canceled, along with a `CancelFunc`. Cancelling propagates to workflows and steps running under the returned context. You must call the returned `CancelFunc` (e.g. with `defer`) when the derived context is no longer needed to release its resources.

### WithCancelCause

```go
func WithCancelCause(ctx Context) (Context, context.CancelCauseFunc)
```

`WithCancelCause` behaves like [`WithCancel`](#withcancel) but returns a [`context.CancelCauseFunc`](https://pkg.go.dev/context#CancelCauseFunc), letting you supply an error describing why the context was canceled. The cause can later be retrieved with [`context.Cause`](https://pkg.go.dev/context#Cause).

## Context metadata
### GetApplicationVersion

```go
func GetApplicationVersion() string
```

`GetApplicationVersion` returns the application version for this context.

### GetExecutorID

```go
func GetExecutorID() string
```

`GetExecutorID` returns the executor ID for this context.

### ListRegisteredWorkflows

```go
func ListRegisteredWorkflows(ctx Context) []WorkflowRegistryEntry
```

```go
type WorkflowRegistryEntry struct {
	MaxRetries      int    // Maximum recovery attempts before dead-lettering (set via WithMaxRecoveryAttempts); not step retries
	Name            string
	FQN             string // Fully qualified name of the workflow function. For configured instances, qualified with the config name.
	ClassName       string // Receiver type name for configured instance workflows
	ConfigName      string // Config name for configured instance workflows
}
```

`ListRegisteredWorkflows` Lists the context's workflow registry.