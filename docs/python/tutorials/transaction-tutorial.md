---
sidebar_position: 30
title: Transactions & Datasources
description: Learn how to perform database operations
---

DBOS provides two ways to run database operations durably inside workflows: _datasources_ and the built-in `@DBOS.transaction` decorator.

Datasources are the recommended approach. They connect to any PostgreSQL or SQLite database, support both sync and async transaction functions, and integrate with DBOS's exactly-once execution guarantees. `@DBOS.transaction` is an older, simpler option that only supports synchronous functions.

## Datasources

Datasources wrap a SQLAlchemy engine with DBOS transaction tracking, ensuring that each database operation inside a workflow runs exactly once even if the workflow is interrupted and retried.

### Creating a Datasource

Create a datasource by calling the `create` factory method with a database URL. The factory automatically sets up the `datasource_outputs` tracking table in the target database.

Use `SQLAlchemyDatasource` for synchronous (non-async) code and `AsyncSQLAlchemyDatasource` for async code.

```python
from dbos import SQLAlchemyDatasource, AsyncSQLAlchemyDatasource

# Sync datasource
ds = SQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"])

# Async datasource (use `await` since create() is a coroutine)
ads = await AsyncSQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"])
```

:::warning

Due to the nature of SQLAlchemy's object model, `AsyncSQLAlchemyDatasource` only supports coroutine functions (`async def`) and `SQLAlchemyDatasource` only supports regular synchronous functions. Decorating the wrong function type raises a `DBOSException` at decoration time.

:::

Both `create` methods accept optional keyword arguments for advanced configuration:

| Parameter | Type | Description |
|---|---|---|
| `database_url` | `str` | SQLAlchemy-compatible database URL |
| `engine_kwargs` | `dict` | Extra kwargs forwarded to SQLAlchemy's `create_engine` / `create_async_engine` |
| `engine` | `Engine` / `AsyncEngine` | Provide your own SQLAlchemy engine instead of creating one |
| `schema` | `str` | Schema name for the `datasource_outputs` table (defaults to `"dbos"`) |
| `serializer` | `Serializer` | Custom serializer for transaction outputs |

### Using a Datasource

Inside a datasource transaction, access the current SQLAlchemy session with `ds.sql_session()` (or `ads.sql_session()` for async).

#### With the `@ds.transaction` Decorator

Decorate any function with `@ds.transaction` to run it as a tracked database transaction:

```python
@ds.transaction()
def insert_greeting(name: str, note: str) -> None:
    session = ds.sql_session()  # sqlalchemy.orm.Session
    session.execute(
        text("INSERT INTO greetings (name, note) VALUES (:name, :note)"),
        {"name": name, "note": note}
    )

@DBOS.workflow()
def greeting_workflow(name: str, note: str) -> None:
    insert_greeting(name, note)
```

For async code:

```python
@ads.transaction()
async def insert_greeting(name: str, note: str) -> None:
    session = ads.sql_session()  # sqlalchemy.ext.asyncio.AsyncSession
    await session.execute(
        text("INSERT INTO greetings (name, note) VALUES (:name, :note)"),
        {"name": name, "note": note}
    )

@DBOS.workflow()
async def greeting_workflow(name: str, note: str) -> None:
    await insert_greeting(name, note)
```

The decorator accepts two optional keyword arguments:
- `name` – a custom step name recorded in the workflow log (defaults to the function's qualified name)
- `isolation_level` – the SQL transaction isolation level; one of `"SERIALIZABLE"` (default), `"REPEATABLE READ"`, or `"READ COMMITTED"`

```python
@ds.transaction(isolation_level="READ COMMITTED", name="insert_greeting")
def insert_greeting(name: str, note: str) -> None:
    session = ds.sql_session()
    session.execute(...)
```

#### Inline with `run_tx_step` / `run_tx_step_async`

You can also run an un-decorated function as a datasource transaction step inline:

```python
def insert_greeting(name: str, note: str) -> None:
    session = ds.sql_session()  # sqlalchemy.orm.Session
    session.execute(
        text("INSERT INTO greetings (name, note) VALUES (:name, :note)"),
        {"name": name, "note": note}
    )

@DBOS.workflow()
def greeting_workflow(name: str, note: str) -> None:
    ds.run_tx_step({"name": "insert_greeting"}, insert_greeting, name, note)
```

For async code:

```python
async def insert_greeting(name: str, note: str) -> None:
    session = ads.sql_session()  # sqlalchemy.ext.asyncio.AsyncSession
    await session.execute(...)

@DBOS.workflow()
async def greeting_workflow(name: str, note: str) -> None:
    await ads.run_tx_step_async({"name": "insert_greeting"}, insert_greeting, name, note)
```

The first argument to `run_tx_step` / `run_tx_step_async` is a dict with optional keys `name` and `isolation_level`, or `None` to use the defaults.

### How Datasource Transactions Work

When a datasource transaction runs inside a DBOS workflow, DBOS records the outcome atomically in the same database transaction. If the workflow is interrupted and replayed, DBOS detects the existing record and returns the stored result without re-executing the function&mdash;exactly-once semantics even for side effects on your application database.

Outside a workflow, datasource transactions execute normally as plain SQLAlchemy transactions with no recording overhead.

## @DBOS.transaction

`@DBOS.transaction` is an older approach to durable database operations. It runs in the application database configured by `application_database_url` in your DBOS config, defaulting to the system database if that field is not set. However, it only supports synchronous functions&mdash;use datasources if you need async transaction steps.

To make a function a transaction, annotate it with [`@DBOS.transaction`](../reference/decorators.md#transaction). Inside the function, use [`DBOS.sql_session`](../reference/contexts.md#sql_session), a [SQLAlchemy](https://www.sqlalchemy.org/) session that executes your operations atomically together with DBOS's checkpoint.

<Tabs groupId="database-clients">
<TabItem value="sqlalchemy" label="SQLAlchemy Core">

```python
greetings = Table(
    "greetings",
    MetaData(),
    Column("name", String),
    Column("note", String)
)

@DBOS.transaction()
def insert_greeting(name: str, note: str) -> None:
    DBOS.sql_session.execute(greetings.insert().values(name=name, note=note))

@DBOS.transaction()
def get_greeting(name: str) -> Optional[str]:
    row = DBOS.sql_session.execute(
        select(greetings.c.note).where(greetings.c.name == name)
    ).first()
    return row[0] if row else None
```

</TabItem>
<TabItem value="raw" label="Raw SQL">

```python
@DBOS.transaction()
def insert_greeting(name: str, note: str) -> None:
    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")
    DBOS.sql_session.execute(sql, {"name": name, "note": note})

@DBOS.transaction()
def get_greeting(name: str) -> Optional[str]:
    sql = text("SELECT note FROM greetings WHERE name = :name LIMIT 1")
    row = DBOS.sql_session.execute(sql, {"name": name}).first()
    return row[0] if row else None
```

</TabItem>
</Tabs>

By default, transactions run against the DBOS system database. To use a separate application database, set `application_database_url` in your DBOS configuration:

```python
config: DBOSConfig = {
    "name": "my-app",
    "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
    "application_database_url": os.environ["APP_DATABASE_URL"],
}
DBOS(config=config)
```

:::warning

`@DBOS.transaction` does not support `async def` functions. When calling a transaction from an async workflow, use [`asyncio.to_thread`](https://docs.python.org/3/library/asyncio-task.html#asyncio.to_thread) to avoid blocking the event loop:

```python
@DBOS.transaction()
def insert_greeting(name: str, note: str) -> None:
    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")
    DBOS.sql_session.execute(sql, {"name": name, "note": note})

@DBOS.workflow()
async def greeting_workflow(name: str, note: str):
    await asyncio.to_thread(insert_greeting, name, note)
```

If you need async transaction steps, use a [datasource](#datasources) instead.

:::
