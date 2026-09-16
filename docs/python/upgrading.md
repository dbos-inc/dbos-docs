---
sidebar_position: 200
title: Upgrading to 3.0
toc_max_heading_level: 3
---

DBOS Python 3.0 removes features that were deprecated in DBOS 2.x.
This guide describes each removed feature and what to replace it with, as well as how to safely upgrade a running application.

## Upgrading a Running Application

DBOS 3.0 changes the storage schema for workflow inputs and outputs to improve performance.
Therefore, DBOS 3.0 can process workflows created by DBOS 2.x, but **DBOS 2.x cannot process workflows created by DBOS 3.0**.
Therefore:

- **Don't run DBOS 2.x and 3.0 processes concurrently with the same application version.**
If you set `application_version` yourself, change it when you upgrade.
If you use [patching](./tutorials/upgrading-workflows.md#patching), shut down all DBOS 2.x processes before launching DBOS 3.0 processes.
- **Upgrade applications that use [`DBOSClient`](./reference/client.md) along with your DBOS processes.**
A DBOS 2.x client cannot retrieve the inputs or results of workflows created by DBOS 3.0.

## Removed Features

### `@DBOS.transaction` and the Application Database

The `@DBOS.transaction` decorator, `DBOS.sql_session`, and the `application_database_url` and `database_url` configuration fields have been removed.
Instead, run database transactions with [datasources](./tutorials/transaction-tutorial.md#datasources).
A datasource connects to your application database and runs transactions with the same exactly-once guarantees as `@DBOS.transaction`.

**Before:**

```python
config: DBOSConfig = {
    "name": "my-app",
    "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
    "application_database_url": os.environ["APP_DATABASE_URL"],
}
DBOS(config=config)

@DBOS.transaction()
def insert_greeting(name: str, note: str) -> None:
    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")
    DBOS.sql_session.execute(sql, {"name": name, "note": note})
```

**After:**

```python
from dbos import DBOS, DBOSConfig, SQLAlchemyDatasource

config: DBOSConfig = {
    "name": "my-app",
    "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
}
DBOS(config=config)
ds = SQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"])

@ds.transaction()
def insert_greeting(name: str, note: str) -> None:
    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")
    ds.sql_session().execute(sql, {"name": name, "note": note})
```

Datasources also support `async` transactions through [`AsyncSQLAlchemyDatasource`](./reference/datasources.md#asyncsqlalchemydatasource).
For the full API, see the [datasource reference](./reference/datasources.md).

:::warning
If you previously set `database_url` or `application_database_url` but not `system_database_url`, DBOS stored its state in a separate system database.
With Postgres, this database has the same name as your application database followed by `_dbos_sys`.
With SQLite, it is the same database file.
Set [`system_database_url`](./reference/configuration.md#database-connection-settings) to that database's connection string.
:::


### In-Memory Queues

The `Queue(...)` constructor, which declared a queue in process memory, has been removed.
Instead, register queues in the system database with [`DBOS.register_queue`](./reference/contexts.md#register_queue) after launching DBOS, then enqueue workflows by queue name with [`DBOS.enqueue_workflow`](./reference/contexts.md#enqueue_workflow).

**Before:**

```python
from dbos import DBOS, Queue

queue = Queue("example_queue", worker_concurrency=5)

@DBOS.workflow()
def process_task(task):
    ...

DBOS.launch()
handle = queue.enqueue(process_task, task)
```

**After:**

```python
from dbos import DBOS

@DBOS.workflow()
def process_task(task):
    ...

DBOS.launch()
DBOS.register_queue("example_queue", worker_concurrency=5)
handle = DBOS.enqueue_workflow("example_queue", process_task, task)
```

When migrating your queues, note that:

- In `async` code use `await DBOS.register_queue_async(...)` instead.
- Register every queue your application previously declared in memory.
Workflows enqueued on a queue that isn't registered stay `ENQUEUED` until the queue is registered.
- [`DBOS.listen_queues`](./tutorials/queue-tutorial.md#explicit-queue-listening) now accepts only queue names, not `Queue` objects.
- Queue names starting with `_dbos_` are reserved for DBOS.

For more on queues, see the [queues tutorial](./tutorials/queue-tutorial.md).

### Legacy Partitioned Queues

The `partition_queue` parameter of `DBOS.register_queue` and `DBOSClient.register_queue` has been removed.
Instead, a queue is [partitioned](./tutorials/queue-tutorial.md#partitioning-queues) if you set any per-partition limit.
With `partition_queue=True`, the `concurrency`, `worker_concurrency`, and `limiter` settings applied to each partition.
Replace them with `partition_concurrency`, `partition_worker_concurrency`, and `partition_limiter`.

**Before:**

```python
DBOS.register_queue("partitioned_queue", partition_queue=True, concurrency=1)
```

**After:**

```python
DBOS.register_queue("partitioned_queue", partition_concurrency=1)
```

Unlike legacy partitioned queues, a partitioned queue can also have queue-wide limits, as described in [Combining Queue-Wide and Per-Partition Limits](./tutorials/queue-tutorial.md#combining-queue-wide-and-per-partition-limits).

The `priority_enabled` parameter and the `Queue` methods for reading and setting `priority_enabled` and `partition_queue` have also been removed.
[Priority](./tutorials/queue-tutorial.md#priority) is now always enabled.

### Decorator-Based Scheduling

The `@DBOS.scheduled` decorator has been removed.
Instead, create schedules in the system database with [`DBOS.apply_schedules`](./reference/contexts.md#apply_schedules) or [`DBOS.create_schedule`](./reference/contexts.md#create_schedule).
The second argument of a scheduled workflow is now the schedule's `context` instead of the time at which the workflow actually started.

**Before:**

```python
@DBOS.scheduled("*/5 * * * *")
@DBOS.workflow()
def my_periodic_task(scheduled_time: datetime, actual_time: datetime):
    ...
```

**After:**

```python
@DBOS.workflow()
def my_periodic_task(scheduled_time: datetime, context: Any):
    ...

DBOS.launch()
DBOS.apply_schedules([
    {
        "schedule_name": "my-periodic-task",
        "workflow_fn": my_periodic_task,
        "schedule": "*/5 * * * *",
    },
])
```

Schedules persist in the system database, so a schedule you stop applying keeps running until you delete it with [`DBOS.delete_schedule`](./reference/contexts.md#delete_schedule).
To learn more, see the [scheduling tutorial](./tutorials/scheduled-workflows.md).

### FastAPI and Flask Integrations

The `fastapi` and `flask` parameters of the `DBOS` constructor have been removed.

With FastAPI, launch and shut down DBOS from a [lifespan](https://fastapi.tiangolo.com/advanced/events/) function.

**Before:**

```python
app = FastAPI()
DBOS(fastapi=app, config=config)
```

**After:**

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    DBOS.launch()
    try:
        yield
    finally:
        DBOS.destroy()

app = FastAPI(lifespan=lifespan)
DBOS(config=config)
```

With Flask, remove `flask=app` and call [`DBOS.launch()`](./reference/dbos-class.md#launch) before starting your app.

The integrations created a tracing span for each HTTP request.
Instead, use the OpenTelemetry instrumentation for your web framework.
DBOS workflow spans automatically join your request spans, as described in the [tracing tutorial](./tutorials/logging-and-tracing.md#connecting-dbos-to-your-observability-provider).

