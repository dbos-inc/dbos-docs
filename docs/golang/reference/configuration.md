---
sidebar_position: 15
title: Configuration
---

## Configuring DBOS

To configure DBOS, pass a `Config` object to [`NewContext`](./dbos-context.md#newcontext).
`AppName` and one of `DatabaseURL`, `SystemDBPool`, or `SQLiteSystemDB` are mandatory.

```go
type Config struct {
    AppName                   string         // Application name for identification (required)
    DatabaseURL               string         // Connection string to your system database. May be a PostgreSQL (postgres://...) or SQLite (sqlite:...) URL. Exactly one of DatabaseURL, SystemDBPool, or SQLiteSystemDB is required.
    SystemDBPool              *pgxpool.Pool  // A custom Postgres/CockroachDB connection pool DBOS can use to access your system database. Optional; takes precedence over DatabaseURL. Mutually exclusive with SQLiteSystemDB.
    SQLiteSystemDB            *sql.DB        // A custom SQLite handle (e.g. from modernc.org/sqlite) DBOS can use as your system database. Optional; takes precedence over DatabaseURL. Mutually exclusive with SystemDBPool.
    DatabaseSchema            string         // Database schema name (defaults to "dbos"; Postgres only)
    Logger                    *slog.Logger   // Custom logger instance (defaults to a new slog logger)
    ConductorURL              string         // DBOS conductor service URL (optional)
    ConductorAPIKey           string         // DBOS conductor API key (optional)
    ConductorExecutorMetadata map[string]any // Metadata used to identify this executor on the Conductor dashboard (optional, must be JSON-serializable)
    ApplicationVersion        string         // Application version (optional)
    ExecutorID                string         // Executor ID (optional)
    EnablePatching            bool           // Enable the patching system for Patch/DeprecatePatch (default: false)
    Serializer                Serializer[any] // Custom serializer for workflow inputs, outputs, and events (defaults to a JSON serializer). See the serialization reference.
    SchedulerPollingInterval  time.Duration  // How often database-backed schedules are reconciled (default: 30s)
    SystemDBStartupTimeout    time.Duration  // Maximum time for system database connection and migrations (default: 2 minutes)
}
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

To supply a custom serializer through `Config.Serializer`, see the [serialization reference](./workflows-steps.md#serialization).

### Using SQLite

SQLite support is not linked into your binary by default — Postgres-only applications do not compile or link a SQLite driver.
To use a SQLite system database (a `sqlite:` URL or `SQLiteSystemDB`), register the driver with one blank import, anywhere in your binary:

```go
import _ "github.com/dbos-inc/dbos-transact-golang/dbos/driver/sqlite"
```

Without it, `NewContext` (or `NewClient`) fails at startup with an error naming this import.
The import registers [modernc.org/sqlite](https://pkg.go.dev/modernc.org/sqlite), a pure-Go driver requiring no cgo.

## System database startup

`NewContext` is the call that connects to your system database: it creates and validates the connection pool, creates the database if it does not exist, runs any pending [schema migrations](../../explanations/system-tables.md), and pings the database.
If the database is unreachable or migrations fail, `NewContext` returns an initialization error — a failed `NewContext` (like a failed `Launch`) is terminal; create a fresh context for each attempt.

The entire startup window is bounded by `Config.SystemDBStartupTimeout` (default: 2 minutes).
On expiry, the returned error names the startup phase that timed out (connecting, running migrations, pinging, …), wraps `context.DeadlineExceeded`, and includes a diagnostic hint.
In particular, if the connection pool had no free connections when the timeout expired — common when passing a shared `SystemDBPool` whose connections are checked out by the application — the error reports the pool's acquired/max connection counts and suggests increasing pool capacity or releasing checked-out connections.

By default, DBOS creates its own pool: for Postgres/CockroachDB, at most 20 connections (1 hour max connection lifetime, 5 minutes idle timeout, 10 seconds connect timeout); for SQLite, at most 8 open connections.
To use different pool settings, construct the pool yourself and pass it via `Config.SystemDBPool` (Postgres/CockroachDB) or `Config.SQLiteSystemDB` (SQLite); DBOS uses it as-is.

**Migrations** are versioned and recorded in the `dbos_migrations` table of your system database schema.
`NewContext` applies only migrations newer than the recorded version, so startup against an up-to-date database performs no schema work, and re-running it is a no-op.

After a successful `NewContext`, `Launch` and subsequent runtime operations do not fail fast on database outages: transient database errors are retried (indefinitely, until the context is cancelled or shut down).
