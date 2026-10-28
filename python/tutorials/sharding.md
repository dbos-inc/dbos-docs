# Sharding

> :::info
> Sharding is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature.
> :::

A DBOS application using a single Postgres system database can run tens of thousands of workflows per second.
To scale beyond that, you can **shard** your system database across multiple Postgres servers using a Postgres-compatible sharding layer such as [Citus](https://www.citusdata.com/) or [PgDog](https://pgdog.dev/).

When you shard your system database, every workflow lives under a **shard key** that you assign it.
All of a workflow's data (its status, inputs, outputs, steps, events, messages, and streams) is stored on the shard that owns its key, so every operation on a workflow touches a single shard.

## Setting Up a Sharded System Database

To use a sharded system database, set `sharding` in your DBOS configuration and point `system_database_url` at your sharding router (for example, a Citus coordinator or PgDog router):

```python
config: DBOSConfig = {
    "name": "dbos-app",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "conductor_key": os.environ.get("DBOS_CONDUCTOR_KEY"),
    "sharding": True,
}
DBOS(config=config)
```

When DBOS launches, it creates the sharded system database schema through your sharding layer.
In production, we recommend you create the schema ahead of time with [`dbos migrate --sharding`](../reference/cli.md#dbos-migrate).

Every DBOS table has a `shard_key` column.
You may need to configure your sharding engine to shard on that column, for example in PgDog's `pgdog.toml`:

```toml title="pgdog.toml"
[[sharded_tables]]
database = "dbos"
column = "shard_key"
data_type = "varchar"
```

To connect a [`DBOSClient`](../reference/client.md) to a sharded system database, construct it with `sharding=True`.

## Assigning Shard Keys

On a sharded system database, you must assign a shard key to every workflow you start or enqueue.
Use [`SetShardKey`](../reference/contexts.md#setshardkey) to set the shard key of every workflow started, enqueued, or called in a block:

```python
from dbos import DBOS, SetShardKey

queue = DBOS.register_queue("orders")

with SetShardKey("orders"):
    handle = queue.enqueue(process_order, order)
```

From a [`DBOSClient`](../reference/client.md#enqueue), set `shard_key` in the enqueue options:

```python
options: EnqueueOptions = {
    "workflow_name": "process_order",
    "queue_name": "orders",
    "shard_key": "orders",
}
handle = client.enqueue(options, order)
```

Workflow IDs are unique only within a shard key: two workflows with the same ID under different shard keys are different workflows.
Thus, to identify a workflow on a sharded system database, you need both its ID and its shard key.
Within a workflow, [`DBOS.shard_key`](../reference/contexts.md#shard_key) returns the shard key of the current workflow.

### Choosing Shard Keys

Queue [flow control](./queue-tutorial.md#managing-concurrency) limits (its global concurrency limit, rate limit, and partition limits) are enforced separately within each shard key: for example, a queue with a global concurrency of 10 can run 10 workflows under each shard key.
Worker concurrency limits still apply across all shard keys.

Therefore, we recommend choosing shard keys based on how you enqueue workflows:

- For workflows enqueued on a [partitioned queue](./queue-tutorial.md#partitioning-queues), use their partition key as their shard key. Each partition then lives on one shard, and its partition limits work as they would on an unsharded database.
- For workflows enqueued on a queue that isn't partitioned, if you need queue-wide flow control, use the queue's name as their shard key, so the queue's limits apply to all its workflows.

## Child Workflows

A workflow doesn't inherit its caller's shard key, so you must set the shard key of each child workflow.
A child workflow that you start or call directly must have the same shard key as its parent:

```python
@DBOS.workflow()
def parent_workflow():
    with SetShardKey(DBOS.shard_key):
        child_workflow()
```

A child workflow that you enqueue can have any shard key:

```python
@DBOS.workflow()
def parent_workflow():
    with SetShardKey("reports"):
        handle = report_queue.enqueue(generate_report)
    return handle.get_result()
```

## Interacting With Workflows

Every method that operates on a workflow by its ID, such as [`DBOS.send`](../reference/contexts.md#send), [`DBOS.get_event`](../reference/contexts.md#get_event), [`DBOS.retrieve_workflow`](../reference/contexts.md#retrieve_workflow), and the [workflow management methods](../reference/contexts.md#workflow-management-methods), takes a `shard_key` parameter.
On a sharded system database, you must pass the shard key of the workflow:

```python
DBOS.send(workflow_id, message, "topic", shard_key="orders")
DBOS.cancel_workflow(workflow_id, shard_key="orders")
```

Methods that operate on several workflows at once, such as [`DBOS.cancel_workflows`](../reference/contexts.md#cancel_workflows) and [`DBOS.send_bulk`](../reference/contexts.md#send_bulk), only accept workflows under a single shard key per call.

[`DBOS.list_workflows`](../reference/contexts.md#list_workflows) and [`DBOS.list_queued_workflows`](../reference/contexts.md#list_queued_workflows) list workflows across all shards.
Each returned [`WorkflowStatus`](../reference/contexts.md#workflow-status) includes the workflow's `shard_key`, and you can filter by `shard_key` or `parent_shard_key`.

[Scheduled workflows](./scheduled-workflows.md) run under the shard key of their schedule, which you set with the `shard_key` parameter of [`DBOS.create_schedule`](../reference/contexts.md#create_schedule).

## Limitations

The following features are not supported on a sharded system database:

- [Queue deduplication](./queue-tutorial.md#deduplication) and [debouncing](../reference/contexts.md#debouncing).
- [Kafka consumers](./kafka-integration.md).
- [Auto-upgrade](./upgrading-workflows.md#auto-upgrading-workflows).
- The `"reject"` [workflow ID reuse policy](../reference/contexts.md#setworkflowid), for workflows started from inside another workflow.
- [Renaming an application](../reference/cli.md#dbos-rename-application) and [resetting the system database](../reference/cli.md#dbos-reset).
- SQLite: a sharded system database must be Postgres-compatible.

Of the [DBOS CLI](../reference/cli.md) commands, only `dbos migrate` supports a sharded system database.
