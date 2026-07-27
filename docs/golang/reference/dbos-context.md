---
sidebar_position: 10
title: DBOS Context
pagination_prev: null
---

A DBOS Context is at the center of a DBOS-enabled application. Use it to register [workflows](../tutorials/workflow-tutorial.md), [queues](../tutorials/queue-tutorial.md) and perform [workflow management](../tutorials/workflow-management.md) tasks.

`Context` extends Go's [`context.Context`](https://pkg.go.dev/context#Context) interface and carries essential state across workflow execution. Workflows and steps receive a new `Context` spun out of the root `Context` you manage. In addition, a `Context` can be used to set [workflow timeouts](../tutorials/workflow-tutorial.md#workflow-timeouts).

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