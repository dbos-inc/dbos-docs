---
sidebar_position: 95
title: Sharding
toc_max_heading_level: 3
---

:::info
Sharding is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature.
:::

A DBOS application using a single Postgres system database can run about 1,000 workflows or steps per second per Postgres vCPU, or [20K workflows or steps per second](https://www.dbos.dev/blog/one-million-workflows) on a 16-vCPU server.
To scale beyond that, you can **shard** your system database across multiple Postgres servers using a Postgres-compatible sharding layer such as [Citus](https://www.citusdata.com/) or [PgDog](https://pgdog.dev/).
With sharded Postgres, DBOS scales linearly to [>1M workflows or steps per second](https://www.dbos.dev/blog/one-million-workflows).

When you shard your system database, every workflow lives under a **shard key** that you assign it.
All of a workflow's data (its status, inputs, outputs, steps, events, messages, and streams) is stored on the shard that owns its key, so every operation on a workflow touches a single shard.

## Setting Up a Sharded System Database

To use a sharded system database, import the [`go.dbos.dev/dbos-enterprise-go`](../reference/configuration.md#dbos-transact-enterprise) module, set `Sharding` in your DBOS configuration, and point `DatabaseURL` at your sharding router (for example, a Citus coordinator or PgDog router):

```go
import (
    "github.com/dbos-inc/dbos-transact-golang/dbos"
    _ "go.dbos.dev/dbos-enterprise-go"
)

dbosContext, err := dbos.NewContext(context.Background(), dbos.Config{
    AppName:         "dbos-app",
    DatabaseURL:     os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    ConductorAPIKey: os.Getenv("DBOS_CONDUCTOR_KEY"),
    Sharding:        true,
})
```

`NewContext` creates the sharded system database schema through your sharding layer.
In production, we recommend you create the schema ahead of time with [`Migrate`](../reference/configuration.md#migrate) and its `WithMigrateSharding` option, then start your application with `Config.SkipMigrations`:

```go
err := dbos.Migrate(ctx, os.Getenv("ADMIN_DATABASE_URL"), dbos.WithMigrateSharding())
```

Every DBOS table has a `shard_key` column.
You may need to configure your sharding engine to shard on that column, for example in PgDog's `pgdog.toml`:

```toml title="pgdog.toml"
[[sharded_tables]]
database = "dbos"
column = "shard_key"
data_type = "varchar"
```

To connect a [standalone client](../reference/dbos-context.md#newclient) to a sharded system database, set `Sharding` in its `ClientConfig`.

## Assigning Shard Keys

On a sharded system database, you must assign a shard key to every workflow you start or enqueue.
Use [`WithShardKey`](../reference/workflows-steps.md#withshardkey) when starting a workflow with `RunWorkflow`:

```go
queue, err := dbos.RegisterQueue(ctx, "orders")

handle, err := dbos.RunWorkflow(ctx, processOrder, order,
    dbos.WithQueue(queue),
    dbos.WithShardKey("orders"),
)
```

When enqueueing a workflow by name with [`Enqueue`](../reference/methods.md#enqueue), for example from a client, use [`WithEnqueueShardKey`](../reference/methods.md#withenqueueshardkey):

```go
handle, err := dbos.Enqueue[string](client, "orders", "processOrder", order,
    dbos.WithEnqueueShardKey("orders"),
)
```

Workflow IDs are unique only within a shard key: two workflows with the same ID under different shard keys are different workflows.
Thus, to identify a workflow on a sharded system database, you need both its ID and its shard key.
Within a workflow, [`GetShardKey`](../reference/methods.md#getshardkey) returns the shard key of the current workflow.

### Choosing Shard Keys

Queue [flow control](./queue-tutorial.md#managing-concurrency) limits (its global concurrency limit, rate limit, and partition limits) are enforced separately within each shard key: for example, a queue with a global concurrency of 10 can run 10 workflows under each shard key.
Worker concurrency limits still apply across all shard keys.

Therefore, we recommend choosing shard keys based on how you enqueue workflows:

- For workflows enqueued on a [partitioned queue](./queue-tutorial.md#partitioning-queues), use their partition key as their shard key. Each partition then lives on one shard, and its partition limits work as they would on an unsharded database.
- For workflows enqueued on a queue that isn't partitioned, if you need queue-wide flow control, use the queue's name as their shard key, so the queue's limits apply to all its workflows.

## Child Workflows

A workflow doesn't inherit its caller's shard key, so you must set the shard key of each child workflow.
A child workflow that you start directly must have the same shard key as its parent:

```go
func parentWorkflow(ctx dbos.Context, input string) (string, error) {
    shardKey, err := dbos.GetShardKey(ctx)
    if err != nil {
        return "", err
    }
    handle, err := dbos.RunWorkflow(ctx, childWorkflow, input, dbos.WithShardKey(shardKey))
    if err != nil {
        return "", err
    }
    return handle.GetResult()
}
```

A child workflow that you enqueue can have any shard key:

```go
func parentWorkflow(ctx dbos.Context, input string) (string, error) {
    handle, err := dbos.RunWorkflow(ctx, generateReport, input,
        dbos.WithQueue(reportQueue),
        dbos.WithShardKey("reports"),
    )
    if err != nil {
        return "", err
    }
    return handle.GetResult()
}
```

## Interacting With Workflows

A [workflow handle](../reference/workflows-steps.md#workflowhandle) carries the shard key of its workflow, so `GetResult` and `GetStatus` work as they do on an unsharded database.

To operate on a workflow by its ID, with [`GetEvent`](../reference/methods.md#getevent), [`RetrieveWorkflow`](../reference/methods.md#retrieveworkflow), or the [workflow management methods](../reference/methods.md#workflow-management-methods) for example, bind the ID to its shard key with [`BindShardKey`](../reference/methods.md#bindshardkey) and call the method on the context it returns:

```go
keyed := dbos.BindShardKey(ctx, workflowID, "orders")
err := dbos.CancelWorkflow(keyed, workflowID)
handle, err := dbos.RetrieveWorkflow[string](keyed, workflowID)
```

[`BindShardKeys`](../reference/methods.md#bindshardkeys) binds several workflow IDs at once.
Methods that operate on several workflows at once, such as [`CancelWorkflows`](../reference/methods.md#cancelworkflows) and [`SendBulk`](../reference/methods.md#sendbulk), only accept workflows under a single shard key per call.

To send a message to a workflow, pass its shard key with [`WithSendShardKey`](../reference/methods.md#withsendshardkey):

```go
err := dbos.Send(ctx, workflowID, message, "topic", dbos.WithSendShardKey("orders"))
```

[`ListWorkflows`](../reference/methods.md#listworkflows) lists workflows across all shards.
Each returned [`WorkflowStatus`](../reference/methods.md#workflow-status) includes the workflow's `ShardKey`, and you can filter with `WithFilterShardKeys` or `WithFilterParentShardKeys`.

[Scheduled workflows](./scheduled-workflows.md) run under the shard key of their schedule, which you set with the `ShardKey` field of [`ScheduleSpec`](../reference/methods.md#schedulespec).

## Limitations

The following features are not supported on a sharded system database:

- [Queue deduplication](./queue-tutorial.md#deduplication) and [debouncing](./workflow-tutorial.md#debouncing).
- [Auto-upgrade](./upgrading-workflows.md#auto-upgrading-workflows).
- The `WorkflowIDReusePolicyReject` [workflow ID reuse policy](../reference/workflows-steps.md#withworkflowidreusepolicy), for workflows started from inside another workflow.
- [Renaming an application](../reference/methods.md#renameapplication) and resetting the system database with `dbos reset`.
- SQLite and CockroachDB: a sharded system database must be Postgres.
