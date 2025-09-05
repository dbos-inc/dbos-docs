---
sidebar_position: 10
title: DBOS Context
pagination_prev: null
---

All DBOS operations require a DBOS context.
You should configure and create a DBOS context on program startup, before running any DBOS workflows.
Here, we document its lifecycle.
Other DBOS methods are documented here.

### NewDBOSContext

```go
func NewDBOSContext(inputConfig Config) (DBOSContext, error)
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

Initialize a new DBOSContext with the provided configuration.
DBOSContext represents a DBOS execution context that provides workflow orchestration capabilities.
It manages the lifecycle of workflows, provides durability guarantees, and enables recovery of interrupted workflows. 
DBOSContext extends the standard Go context.Context.

The newly created DBOSContext must be launched with Launch() before use and should be shut down with Cancel() at program termination.

### DBOSContext.launch()

```go
DBOSContext.Launch() error
```

Launch the DBOS runtime including system database, queues, admin server, and workflow recovery.
`Launch()` should be called by your program during startup before running any workflows.

### DBOSContext.Shutdown()

```go
Shutdown(timeout time.Duration)
```

Gracefully shutdown the DBOS runtime, waiting for workflows to complete and cleaning up resources.

**Parameters:**
- **timeout**: The time to wait for workflows to complete. After the timeout elapses, execution of incomplete workflows is terminated (the workflows may then be recovered by other processes).