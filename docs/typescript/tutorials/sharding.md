---
sidebar_position: 110
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

To use a sharded system database, set `sharding` in your DBOS configuration and point `systemDatabaseUrl` at your sharding router (for example, a Citus coordinator or PgDog router):

```typescript
DBOS.setConfig({
  name: "dbos-app",
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  sharding: true,
});
await DBOS.launch({ conductorKey: process.env.DBOS_CONDUCTOR_KEY });
```

When DBOS launches, it creates the sharded system database schema through your sharding layer.
In production, we recommend you create the schema ahead of time with [`npx dbos schema --sharding`](../reference/cli.md#npx-dbos-schema).

Every DBOS table has a `shard_key` column.
You may need to configure your sharding engine to shard on that column, for example in PgDog's `pgdog.toml`:

```toml title="pgdog.toml"
[[sharded_tables]]
database = "dbos"
column = "shard_key"
data_type = "varchar"
```

To connect a [`DBOSClient`](../reference/client.md) to a sharded system database, create it with `sharding: true`.

## Assigning Shard Keys

On a sharded system database, you must assign a shard key to every workflow you start or enqueue.
Use [`DBOS.withShardKey`](../reference/methods.md#dboswithshardkey) to set the shard key of every workflow started, enqueued, or called within a callback:

```typescript
await DBOS.withShardKey("orders", async () => {
  await DBOS.startWorkflow(processOrder, { queueName: "orders" })(order);
});
```

From a [`DBOSClient`](../reference/client.md#enqueue), set `shardKey` in the enqueue options:

```typescript
const handle = await client.enqueue(
  {
    workflowName: "processOrder",
    queueName: "orders",
    shardKey: "orders",
  },
  order,
);
```

Workflow IDs are unique only within a shard key: two workflows with the same ID under different shard keys are different workflows.
Thus, to identify a workflow on a sharded system database, you need both its ID and its shard key.
Within a workflow, [`DBOS.shardKey`](../reference/methods.md#dbosshardkey) returns the shard key of the current workflow.

### Choosing Shard Keys

Queue [flow control](./queue-tutorial.md#managing-concurrency) limits (its global concurrency limit, rate limit, and partition limits) are enforced separately within each shard key: for example, a queue with a global concurrency of 10 can run 10 workflows under each shard key.
Worker concurrency limits still apply across all shard keys.

Therefore, we recommend choosing shard keys based on how you enqueue workflows:

- For workflows enqueued on a [partitioned queue](./queue-tutorial.md#partitioning-queues), use their partition key as their shard key. Each partition then lives on one shard, and its partition limits work as they would on an unsharded database.
- For workflows enqueued on a queue that isn't partitioned, if you need queue-wide flow control, use the queue's name as their shard key, so the queue's limits apply to all its workflows.

## Child Workflows

A workflow doesn't inherit its caller's shard key, so you must set the shard key of each child workflow.
A child workflow that you start or call directly must have the same shard key as its parent:

```typescript
async function parentWorkflow() {
  await DBOS.withShardKey(DBOS.shardKey!, () => childWorkflow());
}
```

A child workflow that you enqueue can have any shard key:

```typescript
async function parentWorkflow() {
  const handle = await DBOS.withShardKey("reports", () =>
    DBOS.startWorkflow(generateReport, { queueName: "reports" })(),
  );
  return await handle.getResult();
}
```

## Interacting With Workflows

Every method that operates on a workflow by its ID, such as [`DBOS.send`](../reference/methods.md#dbossend), [`DBOS.getEvent`](../reference/methods.md#dbosgetevent), [`DBOS.retrieveWorkflow`](../reference/methods.md#dbosretrieveworkflow), and the [workflow management methods](../reference/methods.md#workflow-management-methods), takes a `shardKey` option.
On a sharded system database, you must pass the shard key of the workflow:

```typescript
await DBOS.send(workflowID, message, "topic", undefined, { shardKey: "orders" });
await DBOS.cancelWorkflow(workflowID, { shardKey: "orders" });
```

Methods that operate on several workflows at once, such as [`DBOS.cancelWorkflows`](../reference/methods.md#dboscancelworkflows), only accept workflows under a single shard key per call.

[`DBOS.listWorkflows`](../reference/methods.md#dboslistworkflows) and [`DBOS.listQueuedWorkflows`](../reference/methods.md#dboslistqueuedworkflows) list workflows across all shards.
Each returned [`WorkflowStatus`](../reference/methods.md#workflow-status) includes the workflow's `shardKey`, and you can filter by `shardKey` or `parentShardKey`.

[Scheduled workflows](./scheduled-workflows.md) run under the shard key of their schedule, which you set with the `shardKey` option of [`DBOS.createSchedule`](../reference/methods.md#dboscreateschedule).

## Limitations

The following features are not supported on a sharded system database:

- [Queue deduplication](./queue-tutorial.md#deduplication) and [debouncing](../reference/methods.md#debouncing).
- [Kafka consumers](./externalmessages.md).
- [Auto-upgrade](./upgrading-workflows.md#auto-upgrading-workflows).
- The `'reject'` [workflow ID reuse policy](../reference/methods.md#dbosstartworkflow), for workflows started from inside another workflow.
- [Renaming an application](../reference/cli.md#npx-dbos-rename-application) and [resetting the system database](../reference/cli.md#npx-dbos-reset).

Of the [DBOS CLI](../reference/cli.md) commands, only [`npx dbos schema`](../reference/cli.md#npx-dbos-schema) supports a sharded system database.
