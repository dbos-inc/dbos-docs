# Configuration

> To configure DBOS, pass a `Config` object to [`NewContext`](./dbos-context.md#newcontext).
> `AppName` and one of `DatabaseURL`, `SystemDBPool`, or `SQLiteSystemDB` are mandatory.

## Configuring DBOS

```go
type Config struct {
    AppName                   string         // Application name for identification (required)
    DatabaseURL               string         // Connection string to your system database. May be a PostgreSQL/CockroachDB URL (postgres://...), a key=value DSN, or a SQLite (sqlite:...) URL. Exactly one of DatabaseURL, SystemDBPool, or SQLiteSystemDB is required.
    SystemDBPool              *pgxpool.Pool  // A custom Postgres/CockroachDB connection pool DBOS can use to access your system database. Optional; takes precedence over DatabaseURL. Mutually exclusive with SQLiteSystemDB.
    SQLiteSystemDB            *sql.DB        // A custom SQLite handle (e.g. from modernc.org/sqlite) DBOS can use as your system database. Optional; takes precedence over DatabaseURL. Mutually exclusive with SystemDBPool.
    DatabaseSchema            string         // Database schema name (defaults to "dbos"; Postgres/CockroachDB only, ignored by SQLite)
    Logger                    *slog.Logger   // Custom logger instance (defaults to a new slog logger)
    ConductorURL              string         // DBOS Conductor service URL (optional; only set if you self-host Conductor). See Connecting to Conductor.
    ConductorAPIKey           string         // DBOS Conductor API key (optional). Setting it requires importing go.dbos.dev/dbos-enterprise-go; see Connecting to Conductor.
    ConductorExecutorMetadata map[string]any // Metadata used to identify this executor on the Conductor dashboard (optional, must be JSON-serializable)
    ConductorMetadataOnlyMode bool           // Send only workflow metadata to Conductor, never workflow data (default: false)
    TransactEnterpriseKey     string         // A key entitling this application to DBOS Transact Enterprise features (optional; ConductorAPIKey stands in for it). See DBOS Transact Enterprise.
    AutoUpgrade               bool           // Auto-upgrade this application's workflows to the latest application version, a DBOS Transact Enterprise feature (default: false). See Auto-Upgrading Workflows.
    AutoUpgradeInterval       time.Duration  // Time between two auto-upgrade passes (default: 30s)
    AutoUpgradeGracePeriod    time.Duration  // How long the latest application version must have been the latest before auto-upgrade moves PENDING workflows to it (default: 0)
    ApplicationVersion        string         // Application version (optional)
    ExecutorID                string         // Executor ID (optional)
    EnablePatching            bool           // Deprecated: pins the application version to "PATCHING_ENABLED". Patch and DeprecatePatch no longer require it; set ApplicationVersion instead.
    Serializer                Serializer[any] // Custom serializer for workflow inputs, outputs, and events (defaults to a JSON serializer). See the serialization reference.
    SchedulerPollingInterval  time.Duration  // How often database-backed schedules are reconciled (default: 30s)
    SystemDBStartupTimeout    time.Duration  // Maximum time for system database connection and schema migration or verification (default: 2 minutes)
    SystemDBIdleTransactionTimeout time.Duration // Postgres idle_in_transaction_session_timeout for the connections DBOS creates (default: 1 minute; negative leaves the server setting)
    NotificationCoalesceInterval time.Duration // How often stream-write and set-event notifications are batched before being sent
    SkipMigrations            bool           // Verify the system database schema on startup instead of creating and migrating it (default: false)
}
```

`ApplicationVersion` and `ExecutorID` are overridden by the `DBOS__APPVERSION` and `DBOS__VMID` environment variables, respectively, when set.

`EnablePatching` is deprecated: [`Patch`](./workflows-steps.md#patch) and [`DeprecatePatch`](./workflows-steps.md#deprecatepatch) no longer require it.
All it does is pin the application version to `PATCHING_ENABLED`, so every deployment shares one version, and `NewContext` logs a warning when it is set.
To keep every deployment on one version, set `ApplicationVersion` explicitly; to give each deployment its own version instead, enable [auto-upgrade](../tutorials/upgrading-workflows.md#auto-upgrading-workflows).

`AppName` identifies your application.
It must be between 3 and 256 characters long and contain only lowercase letters, numbers, dashes, and underscores.
An application connecting to [Conductor](../../conductor/overview.md) (with `ConductorAPIKey` set) fails to start with a name outside that rule, because Conductor refuses to register it; a self-hosted application logs a warning and starts.
Multiple applications (potentially in different languages) may [share a system database](../../explanations/sharing-a-system-database.md), in which case each must have a distinct name: the name identifies which application owns each workflow, queue, schedule, and application version, and applications only run their own workflows.
If you rename an application, transfer ownership of its data with [`RenameApplication`](./methods.md#renameapplication) or the `dbos rename-application` CLI command.

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

## DBOS Transact Enterprise

[DBOS Transact Enterprise](../../explanations/transact-enterprise.md) features, [connecting to Conductor](#connecting-to-conductor) and [auto-upgrade](../tutorials/upgrading-workflows.md#auto-upgrading-workflows), are provided by the `go.dbos.dev/dbos-enterprise-go` module, licensed under the [DBOS Conductor Software License](https://www.dbos.dev/conductor-license).
Add it to your application and import it once, anywhere in your program, with a blank import:

```shell
go get go.dbos.dev/dbos-enterprise-go
```

```go
import (
    "github.com/dbos-inc/dbos-transact-golang/dbos"
    _ "go.dbos.dev/dbos-enterprise-go"
)
```

The module must be at the same minor version as `github.com/dbos-inc/dbos-transact-golang`, so upgrade both together.

The import registers with DBOS Transact the Conductor client, started on [`Launch`](./dbos-context.md#launch) whenever `ConductorAPIKey` is set or the application runs in [DBOS Cloud](../../conductor/reference/dbos-cloud/deploying-to-cloud.md), and the auto-upgrade pass, run when `AutoUpgrade` is set or a workflow is registered with [`WithAutoUpgrade(true)`](./workflows-steps.md#withautoupgrade).
Nothing else changes: configure Conductor and auto-upgrade through `Config`, as documented below.
Without the import, `NewContext` returns an initialization error saying what to add whenever Conductor or auto-upgrade is configured.

### Connecting to Conductor

Connecting an application to [DBOS Conductor](../../conductor/overview.md) requires a Conductor API key.

- **`ConductorAPIKey`**: An API key for Conductor. If provided, the application connects to Conductor. API keys can be created from the [DBOS Console](https://console.dbos.dev).
- **`ConductorURL`**: The URL of the Conductor service to connect to. Set it when you are [self-hosting Conductor](../../conductor/self-hosting/hosting-conductor.md).
- **`ConductorExecutorMetadata`**: A JSON-serializable map of metadata to associate with this executor. It is sent to Conductor and displayed on the dashboard, making it easier to identify executors (for example by region, instance type, or deployment environment).
- **`ConductorMetadataOnlyMode`**: If `true`, this process sends only workflow metadata to Conductor, never workflow data (inputs, outputs, errors, step outputs, events, messages, streams, or schedule context). Defaults to `false`.

When Conductor is configured, `Launch` does not recover this executor's pending workflows itself; [Conductor drives recovery](../../conductor/distributed-recovery.md).

### DBOS Transact Enterprise Settings

- **`TransactEnterpriseKey`**: A key that entitles this application to [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) features without connecting to Conductor. **For development only**: in production, applications using DBOS Transact Enterprise should connect to Conductor by setting `ConductorAPIKey`, which stands in for it. DBOS Transact Enterprise keys are Conductor API keys, which can be created from the [DBOS Console](https://console.dbos.dev).
- **`AutoUpgrade`**: If `true`, [auto-upgrade](../tutorials/upgrading-workflows.md#auto-upgrading-workflows) all workflows in this application, except those registered with [`WithAutoUpgrade(false)`](./workflows-steps.md#withautoupgrade). Requires DBOS Transact Enterprise. Defaults to `false`.
- **`AutoUpgradeInterval`**: How often to check for workflows to auto-upgrade. Defaults to 30 seconds.
- **`AutoUpgradeGracePeriod`**: How long the latest application version must have been the latest before auto-upgrade moves `PENDING` workflows to it, giving processes running older versions time to complete them. `ENQUEUED` and `DELAYED` workflows are moved without waiting. Defaults to 0.

Before auto-upgrade starts, DBOS checks with Conductor that your organization is entitled to it, using `TransactEnterpriseKey` or, when it is unset, `ConductorAPIKey`.
The check runs in `NewContext` when `AutoUpgrade` is set, or in `Launch` when workflows are enrolled with `WithAutoUpgrade(true)` alone, and fails with an initialization error naming the problem: no key, an invalid key, or an organization whose plan does not include auto-upgrade.
If you [self-host Conductor](../../conductor/self-hosting/hosting-conductor.md), the check goes to the Conductor at `ConductorURL`; applications running in DBOS Cloud skip it.

## System database startup

`NewContext` is the call that connects to your system database: it creates and validates the connection pool, creates the database if it does not exist, runs any pending [schema migrations](../../explanations/system-tables.md), and pings the database.
If the database is unreachable or migrations fail, `NewContext` returns an initialization error — a failed `NewContext` (like a failed `Launch`) is terminal; create a fresh context for each attempt.

The entire startup window is bounded by `Config.SystemDBStartupTimeout` (default: 2 minutes).
On expiry, the returned error names the startup phase that timed out (connecting, running migrations, pinging, …), wraps `context.DeadlineExceeded`, and includes a diagnostic hint.
In particular, if the connection pool had no free connections when the timeout expired — common when passing a shared `SystemDBPool` whose connections are checked out by the application — the error reports the pool's acquired/max connection counts and suggests increasing pool capacity or releasing checked-out connections.

By default, DBOS creates its own pool: for Postgres/CockroachDB, at most 20 connections (1 hour max connection lifetime, 5 minutes idle timeout, 10 seconds connect timeout); for SQLite, at most 8 open connections.
For Postgres/CockroachDB, a `pool_max_conns` parameter in `DatabaseURL` (e.g. `postgres://...?pool_max_conns=7`) overrides the default maximum pool size.
To use different pool settings, construct the pool yourself and pass it via `Config.SystemDBPool` (Postgres/CockroachDB) or `Config.SQLiteSystemDB` (SQLite); DBOS uses it as-is.

**Migrations** are versioned and recorded in the `dbos_migrations` table of your system database schema.
`NewContext` applies only migrations newer than the recorded version, so startup against an up-to-date database performs no schema work, and re-running it is a no-op.

Set `Config.SkipMigrations` to make `NewContext` **verify** the schema instead of creating and migrating it.
Use it for a process whose database role cannot run DDL, or a deployment that migrates out of band with the `dbos migrate` [CLI command](./cli.md) or with [`Migrate`](#migrate).
`NewContext` then fails if the system database is missing or its schema is behind the version this build of DBOS requires.
A [standalone client](./dbos-context.md#newclient) always behaves this way: it never creates or migrates the system database.

After a successful `NewContext`, `Launch` and subsequent runtime operations do not fail fast on database outages: transient database errors are retried (indefinitely, until the context is cancelled or shut down).

DBOS sets Postgres's `idle_in_transaction_session_timeout` on the connections it creates, to `Config.SystemDBIdleTransactionTimeout` (default: 1 minute), so a connection stranded mid-transaction by a crashed process releases its locks.
Set it to a negative duration to leave the server's setting in place.

### Migrate

```go
func Migrate(ctx context.Context, databaseURL string, opts ...MigrateOption) error
```

Create or migrate the DBOS system database at `databaseURL` without launching DBOS.
Run it with a privileged role, for example from your deployment's migration step, then start your application processes with `Config.SkipMigrations` so their role needs no DDL privileges.
`Migrate` is what the `dbos migrate` [CLI command](./cli.md) runs.

```go
err := dbos.Migrate(ctx, os.Getenv("ADMIN_DATABASE_URL"), dbos.WithMigrateApplicationRole("app_user"))
```

**Options:**
- **`WithMigrateSchema(schema string)`**: The schema holding the DBOS system tables (default `"dbos"`).
- **`WithMigrateApplicationRole(role string)`**: A Postgres role to grant access to the migrated schema, so an application running under it can launch with `Config.SkipMigrations`. Postgres only.
- **`WithMigrateLogger(logger *slog.Logger)`**: The logger `Migrate` reports progress to (default `slog.Default()`).

To run the same SQL yourself, for example from your own migration tooling, `PermissionStatements(schemaName, roleName string) []string` returns the statements granting `roleName` access to the system schema, and `MigrationStatements(schemaName string, from int) ([]string, error)` returns the statements the migrations execute from version `from` onwards.
[Datasources](./datasources.md#installing-the-datasource-schema) have their own schema and are migrated separately with [`MigrateDataSource`](./datasources.md#migratedatasource).
