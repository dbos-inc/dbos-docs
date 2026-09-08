---
sidebar_position: 25
title: Transactions & Datasources
description: Learn how to perform database operations durably
---

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

`NewDataSource` may be called at any time, before or after `Launch()`.
It provisions a `transaction_completion` durability table in your database (in the `dbos` schema by default, configurable with [`WithDataSourceSchema`](../reference/datasources.md#withdatasourceschema)) unless the table already exists.
If you prefer to manage DDL yourself, pre-create the table in your own migrations and connect with a role that only needs `SELECT, INSERT` on it.

If you pass the same engine handle you gave DBOS as its system database (via [`Config.SystemDBPool` or `Config.SQLiteSystemDB`](../reference/configuration.md)), no `transaction_completion` table is created or managed at all: your application writes and the DBOS checkpoint commit together in a single transaction.
See [Sharing the System Database Engine](../reference/datasources.md#sharing-the-system-database-engine).

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
Serialization and deadlock conflicts are retried automatically with a fresh transaction; errors returned by your function follow your step retry policy.

:::tip
If your application tables live in the same database that hosts the DBOS system schema (for example, the [shared-engine setup](../reference/datasources.md#sharing-the-system-database-engine)), you can atomically write application data and enqueue a workflow in one transaction by calling the [`dbos.enqueue_workflow`](../../explanations/system-tables.md#dbosenqueue_workflow) PL/pgSQL function from within it.
From outside a workflow (for example, from a [standalone client](../reference/dbos-context.md#newclient)), pass your own open transaction to `Enqueue` or `Send` with [`WithEnqueueTransaction`](../reference/methods.md#withenqueuetransaction) or [`WithSendTransaction`](../reference/methods.md#withsendtransaction) instead.
:::

## Guarantees

- A `RunAsTransaction` called at the top level of a workflow is **exactly-once**: the application writes and the durability record commit atomically, and recovery replays the recorded output instead of re-running the function.
- Nesting a `RunAsTransaction` inside a `RunAsStep` or inside another `RunAsTransaction` is rejected with an error: a nested transaction could not be checkpointed, so it would silently lose its exactly-once guarantee. Run transactions from workflow code.

See the [datasources reference](../reference/datasources.md) for details on durability, recovery, and permissions.
