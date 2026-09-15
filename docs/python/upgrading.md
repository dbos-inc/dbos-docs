---
sidebar_position: 200
title: Upgrading to 3.0
toc_max_heading_level: 3
---

DBOS Python 3.0 removes features that were deprecated in DBOS 2.x.
This guide describes each removed feature and what to replace it with, as well as how to safely upgrade a running application.

To upgrade, install the latest version of DBOS:

```shell
pip install --upgrade dbos
```

## Upgrading a Running Application

DBOS 3.0 automatically migrates your [system database](../explanations/system-tables.md) when it launches, or you can migrate it ahead of time with [`dbos migrate`](./reference/cli.md#dbos-migrate).
DBOS 3.0 can process workflows created by DBOS 2.x, but **DBOS 2.x cannot process workflows created by DBOS 3.0**.
Therefore:

- **Don't run DBOS 2.x and 3.0 processes with the same application version.**
By default, the [application version](./tutorials/upgrading-workflows.md#versioning) is computed from both your workflow code and the DBOS version, so you can perform a blue-green upgrade: new DBOS 3.0 processes run new workflows while DBOS 2.x processes finish the workflows they started.
If you set `application_version` yourself, change it when you upgrade.
If you use [patching](./tutorials/upgrading-workflows.md#patching), shut down all DBOS 2.x processes before launching DBOS 3.0 processes.
- **Upgrade applications that use [`DBOSClient`](./reference/client.md) along with your DBOS processes.**
A DBOS 2.x client cannot retrieve the inputs or results of workflows created by DBOS 3.0.
- **Don't roll back to DBOS 2.x** once DBOS 3.0 processes have created workflows.

## Removed Features

### `@DBOS.transaction` and the Application Database

The `@DBOS.transaction` decorator, `DBOS.sql_session`, and the `application_database_url` and `database_url` configuration fields have been removed.
Instead, run database transactions with [datasources](./tutorials/transaction-tutorial.md#datasources).
A datasource connects to your application database and runs transactions with the same exactly-once guarantees as `@DBOS.transaction`.

Before:

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

After:

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
Set [`system_database_url`](./reference/configuration.md#database-connection-settings) to that database's connection string, or DBOS will start with a new, empty system database.
:::

When replacing `@DBOS.transaction` with datasources, note that:

- Datasource transactions are only checkpointed when called from a workflow.
Outside a workflow, they run as ordinary database transactions.
- You can't start or enqueue a datasource transaction directly.
Instead, call it from a workflow and start or enqueue that workflow.
- DBOS no longer creates your application database for you.
Create it before creating your datasource, for example in your schema migrations.
- DBOS no longer uses the `transaction_outputs` table in your application database, so you can drop it after upgrading.

Other interfaces that accepted an application database URL have also changed:

- The [`DBOSClient`](./reference/client.md#constructor) constructor no longer accepts `database_url` or `application_database_url`.
Pass your system database connection string as the `system_database_url` keyword argument.
- The [DBOS CLI](./reference/cli.md) no longer accepts `-D, --db-url`.
Use `-s, --sys-db-url` or set `system_database_url` in your [`dbos-config.yaml`](./reference/configuration.md#dbos-configuration-file) instead.
The CLI ignores the `database_url` field of `dbos-config.yaml`.
- `run_dbos_database_migrations` no longer accepts `app_database_url`.

### In-Memory Queues

The `Queue(...)` constructor, which declared a queue in process memory, has been removed.
Instead, register queues in the system database with [`DBOS.register_queue`](./reference/contexts.md#register_queue) after launching DBOS, then enqueue workflows by queue name with [`DBOS.enqueue_workflow`](./reference/contexts.md#enqueue_workflow).

Before:

```python
from dbos import DBOS, Queue

queue = Queue("example_queue", worker_concurrency=5)

@DBOS.workflow()
def process_task(task):
    ...

DBOS.launch()
handle = queue.enqueue(process_task, task)
```

After:

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

- `DBOS.register_queue` returns a [`Queue`](./reference/queues.md#class-dbosqueue), which you can also use to enqueue workflows.
You can look up a registered queue with [`DBOS.retrieve_queue`](./reference/contexts.md#retrieve_queue).
- In `async` code, such as a FastAPI lifespan function, use `await DBOS.register_queue_async(...)` instead.
- Register every queue your application previously declared in memory.
Workflows enqueued on a queue that isn't registered stay `ENQUEUED` until the queue is registered.
- [`DBOS.listen_queues`](./tutorials/queue-tutorial.md#explicit-queue-listening) now accepts only queue names, not `Queue` objects.
If you use it, also include any queues your [Kafka consumers](./tutorials/kafka-integration.md) run on through their `queue_name` parameter.
- Queue names starting with `_dbos_` are reserved for DBOS.

For more on queues, see the [queues tutorial](./tutorials/queue-tutorial.md).

### Legacy Partitioned Queues

The `partition_queue` parameter of `DBOS.register_queue` and `DBOSClient.register_queue` has been removed.
Instead, a queue is [partitioned](./tutorials/queue-tutorial.md#partitioning-queues) if you set any per-partition limit.
With `partition_queue=True`, the `concurrency`, `worker_concurrency`, and `limiter` settings applied to each partition.
Replace them with `partition_concurrency`, `partition_worker_concurrency`, and `partition_limiter`.

Before:

```python
DBOS.register_queue("partitioned_queue", partition_queue=True, concurrency=1)
```

After:

```python
DBOS.register_queue("partitioned_queue", partition_concurrency=1)
```

Unlike legacy partitioned queues, a partitioned queue can also have queue-wide limits, as described in [Combining Queue-Wide and Per-Partition Limits](./tutorials/queue-tutorial.md#combining-queue-wide-and-per-partition-limits).

:::warning
DBOS 3.0 treats a queue registered with `partition_queue=True` as a regular, non-partitioned queue, so its limits apply to the whole queue rather than to each partition.
Make sure your application registers these queues with per-partition limits when it starts.
:::

The `priority_enabled` parameter and the `Queue` methods for reading and setting `priority_enabled` and `partition_queue` have also been removed.
[Priority](./tutorials/queue-tutorial.md#priority) is now always enabled.

### Decorator-Based Scheduling

The `@DBOS.scheduled` decorator has been removed.
Instead, create schedules in the system database with [`DBOS.apply_schedules`](./reference/contexts.md#apply_schedules) or [`DBOS.create_schedule`](./reference/contexts.md#create_schedule).
The second argument of a scheduled workflow is now the schedule's `context` instead of the time at which the workflow actually started.

Before:

```python
@DBOS.scheduled("*/5 * * * *")
@DBOS.workflow()
def my_periodic_task(scheduled_time: datetime, actual_time: datetime):
    ...
```

After:

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

Before:

```python
app = FastAPI()
DBOS(fastapi=app, config=config)
```

After:

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

The integrations also did three things you may want to replicate in your own application:

**Idempotency keys:** The integrations used the `dbos-idempotency-key` request header, if present, as the ID of the workflow the request started.
To keep this behavior, set the [workflow ID](./tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) from the header in a middleware:

```python
from fastapi import Request
from dbos import SetWorkflowID

@app.middleware("http")
async def idempotency_key_middleware(request: Request, call_next):
    workflow_id = request.headers.get("dbos-idempotency-key")
    if workflow_id:
        with SetWorkflowID(workflow_id):
            return await call_next(request)
    return await call_next(request)
```

**Error responses:** The FastAPI integration turned uncaught DBOS errors into JSON responses, with status code 403 for authorization errors and 500 for other errors.
`DBOSException` no longer has a `status_code` attribute.
To keep this behavior, add an exception handler:

```python
from fastapi import Request
from fastapi.responses import JSONResponse
from dbos import error as dboserror

@app.exception_handler(dboserror.DBOSException)
async def dbos_exception_handler(request: Request, exc: dboserror.DBOSException):
    status_code = 403 if isinstance(exc, dboserror.DBOSNotAuthorizedError) else 500
    return JSONResponse(status_code=status_code, content={"message": str(exc)})
```

**Request tracing:** The integrations created a tracing span for each HTTP request.
Instead, use the OpenTelemetry instrumentation for your web framework.
DBOS workflow spans automatically join its request spans, as described in the [tracing tutorial](./tutorials/logging-and-tracing.md#connecting-dbos-to-your-observability-provider).

### Admin Server

The HTTP admin server and its `run_admin_server` and `admin_port` configuration fields have been removed.
Replace each admin server feature as follows:

| Admin Server Feature | Replacement |
|---|---|
| Workflow management (listing, cancelling, resuming, and forking workflows) | [DBOS methods](./tutorials/workflow-management.md), [`DBOSClient`](./reference/client.md#workflow-management-methods), the [DBOS CLI](./reference/cli.md), or [Conductor](../production/workflow-management.md) |
| Listing queues | [`DBOS.list_queues`](./reference/contexts.md#list_queues) |
| Recovering workflows from failed processes | [Conductor](../production/workflow-recovery.md#recovery-with-conductor) |
| Garbage collection and global timeouts | [Conductor retention policies](../production/retention.md) |
| Health check (`/dbos-healthz`) | A health check endpoint in your own application |

### Other Removed APIs

| Removed | Replacement |
|---|---|
| `in_order=True` in [`@DBOS.kafka_consumer`](./reference/decorators.md#kafka_consumer) | `ordering="topic"` (see [In-Order Processing](./tutorials/kafka-integration.md#in-order-processing)) |
| `DBOS.register_instance` | Subclass [`DBOSConfiguredInstance`](./tutorials/classes.md), which registers instances automatically |
| The misspelled `deboucne_key` parameter of `DebouncerClient.debounce_async` | [`debounce_key`](./reference/client.md#debounce_async) |
| The `DBOS__CONSOLE_TRACES` environment variable | [Your own OpenTelemetry `TracerProvider`](./tutorials/logging-and-tracing.md#connecting-dbos-to-your-observability-provider) with a `ConsoleSpanExporter` |
| `${DOCKER_SECRET:NAME}` substitution in `dbos-config.yaml` | Environment variable substitution (`${NAME}`) |

## Other Breaking Changes

- **Duplicate workflow names:** Registering two workflows with the same name from different modules now raises a `DBOSException` at import time.
Previously, DBOS logged a warning and the last workflow registered replaced the other, so which function recovered a workflow depended on import order.
Give each workflow a unique name, for example with the `name` parameter of [`@DBOS.workflow`](./reference/decorators.md#workflow).
- **Relaunching DBOS:** [`DBOS.destroy()`](./reference/dbos-class.md#destroy) discards the DBOS instance, and calling `DBOS.launch()` without one now raises an error instead of doing nothing.
To relaunch DBOS after destroying it, for example between tests, construct a new instance with `DBOS(config=...)` first.
