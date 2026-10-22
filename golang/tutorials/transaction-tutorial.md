# Transactions & Datasources

> Learn how to perform database operations durably

A _datasource_ is a handle to a database **you** own, over which DBOS can run durable transactions.
When you run a transaction through a datasource inside a workflow, your application writes and the DBOS durability record commit atomically in your database, so the transaction executes **exactly once** even if your program crashes and the workflow is recovered.

This is a stronger guarantee than a [step](./step-tutorial.md) provides: a step that writes to a database may re-execute (and re-commit) if the process crashes after the write but before the step is checkpointed.

## Creating a Datasource

Create a datasource with [`NewDataSource`](../reference/datasources.md#newdatasource), passing a connection pool to your database: a `*pgxpool.Pool` for Postgres or CockroachDB, or a `*sql.DB` for SQLite.

```go
import "github.com/jackc/pgx/v5/pgxpool"

pool, err := pgxpool.New(context.Background(), os.Getenv("APP_DATABASE_URL"))
if err != nil {
    log.Fatal(err)
}
ds, err := dbos.NewDataSource(dbosContext, pool, dbos.WithDataSourceName("app"))
if err != nil {
    log.Fatal(err)
}
```

Create all your datasources before calling [`Launch()`](../reference/dbos-context.md#launch): creating a datasource after launch returns an error.
DBOS tracks every datasource created on the context so that [rewinding a workflow](./workflow-management.md#rewinding-workflows) also deletes the transaction checkpoints it holds.

`NewDataSource` creates or migrates a `transaction_completion` durability table in your database (in the `dbos` schema by default, configurable with [`WithDataSourceSchema`](../reference/datasources.md#withdatasourceschema)).

If you pass the same engine handle you gave DBOS as its system database (via [`Config.SystemDBPool` or `Config.SQLiteSystemDB`](../reference/configuration.md)), no `transaction_completion` table is created or managed at all: your application writes and the DBOS checkpoint commit together in a single transaction.
See [Sharing the System Database Engine](../reference/datasources.md#sharing-the-system-database-engine).

### Running Datasource Migrations Separately

By default, creating a datasource creates its `transaction_completion` table (and the schema containing it) if they do not exist, which requires DDL privileges.
If your application's database role should not have those privileges, run the datasource migrations separately with a privileged role, using [`MigrateDataSource`](../reference/datasources.md#migratedatasource).
Pass [`WithMigrateApplicationRole`](../reference/datasources.md#migratedatasource) to grant your application's role the minimal permissions it needs to use the datasource.
Then, create your datasources with [`WithDataSourceSkipMigrations`](../reference/datasources.md#withdatasourceskipmigrations), so they only verify their tables are migrated:

```go
// In your migration script, run with a privileged role:
err := dbos.MigrateDataSource(ctx, adminPool, dbos.WithMigrateApplicationRole("my_app_role"))

// In your application, run as my_app_role:
ds, err := dbos.NewDataSource(dbosContext, pool, dbos.WithDataSourceSkipMigrations())
```

You can similarly migrate the DBOS system database separately with [`Migrate`](../reference/configuration.md#migrate) or the `dbos migrate` [CLI command](../reference/cli.md), and start your application with [`Config.SkipMigrations`](../reference/configuration.md#system-database-startup).

## Running Transactions

Inside a workflow, run a transaction with [`RunAsTransaction`](../reference/datasources.md#runastransaction).
Your function receives a [`Tx`](../reference/datasources.md#the-tx-interface) on which to run queries; DBOS commits the transaction if the function returns successfully and rolls it back if it returns an error.

```go
func checkoutWorkflow(ctx dbos.Context, item string) (int64, error) {
    // This transaction runs exactly once, even across crashes and recovery.
    orderID, err := dbos.RunAsTransaction(ctx, ds, func(txCtx context.Context, tx dbos.Tx) (int64, error) {
        var id int64
        err := tx.QueryRow(txCtx, "INSERT INTO orders(item) VALUES ($1) RETURNING id", item).Scan(&id)
        return id, err
    })
    if err != nil {
        return 0, err
    }

    // Transactions and steps share the workflow's step counter and can be interleaved.
    _, err = dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return sendConfirmation(stepCtx, orderID)
    })
    return orderID, err
}
```

`RunAsTransaction` must be called from within a workflow.
It accepts the same options as [`RunAsStep`](../reference/workflows-steps.md#runasstep) (`WithStepName`, `WithStepMaxRetries`, and so on).
Transient database errors, such as connection failures and serialization or deadlock conflicts, are retried automatically with a fresh transaction, even when your function returns them: they do not count against the step's retries and are never recorded as the step's error.
Other errors returned by your function follow your step retry policy.

:::tip
If your application tables live in the same database that hosts the DBOS system schema (for example, the [shared-engine setup](../reference/datasources.md#sharing-the-system-database-engine)), you can atomically write application data and enqueue a workflow in one transaction by calling the [`dbos.enqueue_workflow`](../../explanations/system-tables.md#dbosenqueue_workflow) PL/pgSQL function from within it.
From outside a workflow (for example, from a [standalone client](../reference/dbos-context.md#newclient)), pass your own open transaction to `Enqueue` or `Send` with [`WithEnqueueTransaction`](../reference/methods.md#withenqueuetransaction) or [`WithSendTransaction`](../reference/methods.md#withsendtransaction) instead.
:::

## Guarantees

- A `RunAsTransaction` called at the top level of a workflow is **exactly-once**: the application writes and the durability record commit atomically, and recovery replays the recorded output instead of re-running the function.
- Nesting a `RunAsTransaction` inside a `RunAsStep` or inside another `RunAsTransaction` is rejected with an error: a nested transaction could not be checkpointed, so it would silently lose its exactly-once guarantee. Run transactions from workflow code.

See the [datasources reference](../reference/datasources.md) for details on durability, recovery, and permissions.
