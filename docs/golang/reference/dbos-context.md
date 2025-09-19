---
sidebar_position: 10
title: DBOS Context
pagination_prev: null
---

A DBOS Context is at the center of a DBOS-enabled application. Use it to register [workflows](../tutorials/workflow-tutorial.md), [queues](../tutorials/queue-tutorial.md) and perform [workflow management](../tutorials/workflow-management.md) tasks.

`DBOSContext` extends Go's [`context.Context`](https://pkg.go.dev/context#Context) interface and carries essential state across workflow execution. Workflows and steps receive a new `DBOSContext` spun out of the root `DBOSContext` you manage. In addition, a `DBOSContext` can be used to set [workflow timeouts](../tutorials/workflow-tutorial.md#workflow-timeouts).

## Lifecycle
### Initialization

You can create a DBOS context using `NewDBOSContext`, which takes a `Config` object where `AppName` and one of `DatabaseURL` or `SystemDBPool` are mandatory.

```go
func NewDBOSContext(ctx context.Context, inputConfig Config) (DBOSContext, error)
```

```go
type Config struct {
    AppName            string        // Application name for identification (required)
    DatabaseURL        string        // DatabaseURL is a PostgreSQL connection string. Either this or SystemDBPool is required.
    SystemDBPool       *pgxpool.Pool // SystemDBPool is a custom System Database Pool. It's optional and takes precedence over DatabaseURL if both are provided.
    DatabaseSchema     string        // Database schema name (defaults to "dbos")
    Logger             *slog.Logger  // Custom logger instance (defaults to a new slog logger)
    AdminServer        bool          // Enable Transact admin HTTP server (disabled by default)
    AdminServerPort    int           // Port for the admin HTTP server (default: 3001)
    ConductorURL       string        // DBOS conductor service URL (optional)
    ConductorAPIKey    string        // DBOS conductor API key (optional)
    ApplicationVersion string        // Application version (optional, overridden by DBOS__APPVERSION env var)
    ExecutorID         string        // Executor ID (optional, overridden by DBOS__VMID env var)
}
```

For example:
```go
dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
    AppName:     "dbos-starter",
    DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
})
if err != nil {
    panic(err)
}
```

The newly created DBOSContext must be launched with Launch() before use and should be shut down with Shutdown() at program termination.

### launch

```go
DBOSContext.Launch() error
```

Launch the following resources managed by a `DBOSContext`:
- A [system database connection pool](../../explanations/system-tables.md)
- A [workflow scheduler](../tutorials/workflow-tutorial.md#scheduled-workflows)
- A [workflow queue runner](../tutorials/queue-tutorial.md)
- (Optionally) an admin server
- (Optionally) a conductor connection

In addition, `Launch()` will perform a round of [workflow recovery](../../architecture.md#how-workflow-recovery-works) for the current DBOS process.
`Launch()` should be called by your program during startup before running any workflows.

### Shutdown
```go
Shutdown(timeout time.Duration)
```

Gracefully shutdown the DBOS runtime, waiting for workflows to complete and cleaning up resources. When you shutdown a `DBOSContext`, the underlying `context.Context` will be cancelled, which signals all DBOS resources they should stop executing, including workflows and steps.

**Parameters:**
- **timeout**: The time to wait for DBOS resources to gracefully terminate.

## Context management

### WithTimeout

```go
func WithTimeout(ctx DBOSContext, timeout time.Duration) (DBOSContext, context.CancelFunc)
```

`WithTimeout` returns a copy of the DBOS context with a timeout. The returned context will be canceled after the specified duration. See [workflow timeouts](../tutorials/workflow-tutorial.md#workflow-timeouts) for usage.

### WithoutCancel

```go
func WithoutCancel(ctx DBOSContext) DBOSContext
```

`WithoutCancel` returns a copy of the DBOS context that is not canceled when the parent context is canceled. This is useful to detach child workflows from their parent's timeout.

### GetWorkflowID

```go
func GetWorkflowID(ctx DBOSContext) (string, error)
```

`GetWorkflowID` retrieves the workflow ID from the context if called within a DBOS workflow. Returns an error if not called from within a workflow context.

### GetStepID

```go
func GetStepID(ctx DBOSContext) (int, error)
```

`GetStepID` retrieves the current step ID from the context if called within a DBOS workflow. Returns -1 and an error if not called from within a workflow context.

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

### GetApplicationID

```go
func GetApplicationID() string
```

`GetApplicationID` returns the application ID for this context.
