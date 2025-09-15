---
sidebar_position: 10
title: DBOS Context
pagination_prev: null
---

A DBOS Context is at the center of a DBOS-enabled application. Use it to register [workflows](./workflow-tutorial.md), [queues](./queue-tutorial.md) and perform [workflow management](./workflow-management.md) tasks.

[`DBOSContext`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#DBOSContext) extends Go's [`context.Context`](https://pkg.go.dev/context#Context) interface and carries essential state across workflow execution. Workflows and steps receive a new `DBOSContext` spun out of the root `DBOSContext` you manage. In addition, a `DBOSContext` can be used to set [workflow timeouts](./workflow-tutorial.md#workflow-timeouts).

### Initialization

You can create a DBOS context using [`NewDBOSContext`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#NewDBOSContext), which takes a [`Config`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#Config) object where `AppName` and `DatabaseURL` are mandatory.

```go
func NewDBOSContext(ctx context.Context, inputConfig Config) (DBOSContext, error)
```

```go
type Config struct {
    DatabaseURL        string       // PostgreSQL connection string (required)
    AppName            string       // Application name for identification (required)
    Logger             *slog.Logger // Custom logger instance (defaults to a new slog logger)
    AdminServer        bool         // Enable Transact admin HTTP server (disabled by default)
    AdminServerPort    int          // Port for the admin HTTP server (default: 3001)
    ConductorAPIKey    string       // DBOS conductor API key (optional)
    ApplicationVersion string       // Application version (optional, overridden by DBOS__APPVERSION env var)
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

The newly created DBOSContext must be launched with Launch() before use and should be shut down with Cancel() at program termination.

### DBOSContext.launch()

```go
DBOSContext.Launch() error
```

Launch the following resources managed by a `DBOSContext`:
- A [system database connection pool](../../explanations/system-tables.md)
- A [workflow scheduler](./workflow-tutorial.md#scheduled-workflows)
- A [workflow queue runner](./queue-tutorial.md)
- (Optionally) an admin server
- (Optionally) a conductor connection

`Launch()` should be called by your program during startup before running any workflows.

### DBOSContext.Shutdown()

```go
Shutdown(timeout time.Duration)
```

Gracefully shutdown the DBOS runtime, waiting for workflows to complete and cleaning up resources. When you shutdown a `DBOSContext`, the underlying `context.Context` will be cancelled.

**Parameters:**
- **timeout**: The time to wait for workflows to complete. After the timeout elapses, execution of incomplete workflows is terminated (the workflows may then be recovered by other processes).