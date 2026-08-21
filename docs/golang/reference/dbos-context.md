---
sidebar_position: 10
title: DBOS Context & Client
pagination_prev: null
---

A DBOS Context is at the center of a DBOS-enabled application. Use it to register [workflows](../tutorials/workflow-tutorial.md), [queues](../tutorials/queue-tutorial.md) and perform [workflow management](../tutorials/workflow-management.md) tasks.

DBOS defines two interfaces:

- [`Client`](#client) owns every DBOS operation that only needs a connection to the system database, for instance listing workflows. Create a standalone client with [`NewClient`](#newclient) to perform these operations from outside a DBOS application.
- [`Context`](#context) **extends `Client`** and adds what requires a DBOS runtime, like running workflows and steps. Launching `Context` starts all background resources a DBOS process needs, like the queue runner. Create one with [`NewContext`](#newcontext). It also extends Go's [`context.Context`](https://pkg.go.dev/context#Context) and carries essential state across workflow execution: workflows and steps receive a new `Context` spun out of the root `Context` you manage, and a `Context` can be used to set [workflow timeouts](../tutorials/workflow-tutorial.md#workflow-timeouts).

Because every `Context` **is** a `Client`, anywhere a `Client` is accepted you can pass either a standalone client or a (launched or unlaunched) `Context`.

## Client

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
    ListQueues(_ Client, opts ...ListQueuesOption) ([]Queue, error)
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

    // Application management
    ListApplicationVersions(_ Client) ([]VersionInfo, error)
    GetLatestApplicationVersion(_ Client) (VersionInfo, error)
    SetLatestApplicationVersion(_ Client, versionName string) error
    RenameApplication(_ Client, input RenameApplicationInput) (ApplicationRowCounts, error)

    Shutdown(_ Client, timeout time.Duration) error
}
```

## Context

```go
type Context interface {
    Client

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

## Who can do what

- **Every method in the `Client` interface** works from a standalone client and from any `Context`, before or after `Launch()`. These operations talk directly to the system database. One exception: on the `Context` a step body receives, mutating operations return an error — see [Calling DBOS operations from steps](./workflows-steps.md#calling-dbos-operations-from-steps). When called from workflow code, these operations are checkpointed as steps (`DBOS.*` step names in the workflow's step list).
- **`Launch()`, workflow registration ([`RegisterWorkflow`](./workflows-steps.md#registerworkflow)), and `SetAlertHandler`** require a `Context`; registration and `SetAlertHandler` must happen before `Launch()`.
- **Starting workflows (with [`RunWorkflow`](./workflows-steps.md#runworkflow))** requires a launched `Context`.
- **Workflow-scope methods** ([`RunAsStep`](./workflows-steps.md#runasstep), [`Recv`](./methods.md#recv), [`SetEvent`](./methods.md#setevent), [`WriteStream`](./methods.md#writestream), [`CloseStream`](./methods.md#closestream), [`Sleep`](./methods.md#sleep), [`GetWorkflowID`](./methods.md#getworkflowid), [`GetStepID`](./methods.md#getstepid), [`Patch`](./workflows-steps.md#patch)) can only be called on the `Context` a workflow function receives.

In practice, never call the interface methods directly — call their mirror package-level functions instead. These are strongly typed (generic) and the interface methods are not.

## Lifecycle
### NewContext

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
The newly created Context must be launched with `Launch()` before running workflows and should be shut down with `Shutdown()` at program termination.
Before launch, a `Context` can already be used for every [`Client`](#client) operation.

`AppName` is the application on whose behalf this context acts. Always set `AppName` if multiple applications [share a system database](../../explanations/sharing-a-system-database.md).

### Launch

```go
dbos.Launch(ctx Context) error
```

Launch the following resources managed by a `Context`:
- A [system database connection pool](../../explanations/system-tables.md)
- A [workflow scheduler](../tutorials/scheduled-workflows.md)
- A [workflow queue runner](../tutorials/queue-tutorial.md)
- (Optionally) a Conductor connection

In addition, `Launch()` may perform [workflow recovery](../../architecture.md#how-workflow-recovery-works).
`Launch()` should be called by your program during startup before running any workflows.

### NewClient

```go
func NewClient(ctx context.Context, config ClientConfig) (Client, error)
```

Create a standalone `Client`, to interact with a DBOS application from external code — a process that registers no workflows and never calls `Launch()`.

**Parameters:**
- `ctx`: A context for initialization operations
- `config`: A `ClientConfig` object with connection and application settings

```go
type ClientConfig struct {
    DatabaseURL            string          // Connection string to your system database. May be a PostgreSQL (postgres://...) or SQLite (sqlite:...) URL. Exactly one of DatabaseURL, SystemDBPool, or SQLiteSystemDB is required.
    AppName                string          // The application this client acts on behalf of (optional)
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
Like `NewContext`, using a SQLite system database requires registering the SQLite driver with a blank import — see [Using SQLite](./configuration.md#using-sqlite).

Because workflows are not registered with a client, operations that take a workflow function reference on a `Context` take a workflow **name** (string) from a client — for example [`Enqueue`](./methods.md#enqueue), or the `WorkflowName` field of [`ScheduleSpec`](./methods.md#schedulespec).

`AppName` is the application on whose behalf this client acts: workflows the client enqueues and queues and schedules it registers are owned by that application, and the client's listing operations default to that application's rows.
A client with no `AppName` sees every application's rows, but everything it creates is owned by no application.
Always set `AppName` if multiple applications [share a system database](../../explanations/sharing-a-system-database.md).

**Example syntax:**

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

### Shutdown
```go
dbos.Shutdown(c Client, timeout time.Duration) error
```

Gracefully shut down a `Context` or a standalone `Client`, waiting for resources to stop and cleaning up. Returns a non-nil error if the timeout expired before all resources stopped.

When you shut down a `Context`, the underlying `context.Context` will be cancelled, which signals all DBOS resources they should stop executing, including workflows and steps.
When you shut down a standalone `Client`, its system database connection pool and notification listener are released.

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

### WithValue

```go
func WithValue(ctx Context, key, val any) Context
```

`WithValue` returns a copy of the DBOS context with the given key-value pair, like [`context.WithValue`](https://pkg.go.dev/context#WithValue) but preserving DBOS context capabilities.

### From

```go
func From(dbosCtx Context, ctx context.Context) Context
```

`From` returns a copy of `dbosCtx` whose embedded `context.Context` is replaced by `ctx`.
The returned Context takes its deadline, cancellation, and values entirely from `ctx`; `dbosCtx` contributes only the DBOS runtime state (system database, registries, configuration, logger).
`ctx` must descend from a `context.Context` provided by DBOS (e.g., the first argument of a workflow or step function), because DBOS metadata such as the current workflow state travels in context values.
Returns nil if either argument is nil.

## Context metadata
### GetApplicationVersion

```go
func GetApplicationVersion(ctx Context) string
```

`GetApplicationVersion` returns the application version for this context.

### GetExecutorID

```go
func GetExecutorID(ctx Context) string
```

`GetExecutorID` returns the executor ID for this context.

### GetApplicationID

```go
func GetApplicationID(ctx Context) string
```

`GetApplicationID` returns the application ID for this context (set in DBOS Cloud; empty otherwise).

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
