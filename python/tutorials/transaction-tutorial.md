# Transactions & Datasources

> Learn how to perform database operations

DBOS runs database operations durably inside workflows through _datasources_.
Datasources connect to any PostgreSQL or SQLite database, support both sync and async transaction functions, and integrate with DBOS's exactly-once execution guarantees.

## Datasources

Datasources wrap a SQLAlchemy engine with DBOS transaction tracking, ensuring that each database operation inside a workflow runs exactly once even if the workflow is interrupted and retried.

### Creating a Datasource

Create a datasource by calling the `create` factory method with a database URL. The factory automatically sets up the `datasource_outputs` tracking table in the target database.

Use `SQLAlchemyDatasource` for synchronous (non-async) code and `AsyncSQLAlchemyDatasource` for async code:

```python
import os
from dbos import SQLAlchemyDatasource

ds = SQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"])
```

```python
import asyncio
import os
from dbos import AsyncSQLAlchemyDatasource

# The datasource is not tied to the event loop that created it,
# so it can be used from the event loop that runs your application.
ads = asyncio.run(AsyncSQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"]))
```

Create all your datasources before calling [`DBOS.launch()`](../reference/dbos-class.md#launch): creating a datasource after launch raises a `DBOSException`.
DBOS tracks every datasource created in the process so that [rewinding a workflow](./workflow-management.md#rewinding-workflows) also deletes the transaction checkpoints it holds.

To use `AsyncSQLAlchemyDatasource` with SQLite, you must use an async driver URL such as `sqlite+aiosqlite:///app.sqlite` (install the driver with `pip install "dbos[aiosqlite]"`); a plain `sqlite:///` URL raises an error.

:::warning

Due to the nature of SQLAlchemy's object model, `AsyncSQLAlchemyDatasource` only supports coroutine functions (`async def`) and `SQLAlchemyDatasource` only supports regular synchronous functions. Decorating the wrong function type raises a `DBOSException` at decoration time.

:::

Both `create` methods take a required `database_url` and accept optional arguments for advanced configuration:

| Parameter | Type | Description |
|---|---|---|
| `database_url` | `str` | SQLAlchemy-compatible database URL (required). DBOS connects to Postgres with the psycopg driver. |
| `engine_kwargs` | `dict` | Extra kwargs forwarded to SQLAlchemy's `create_engine` / `create_async_engine` |
| `engine` | `Engine` / `AsyncEngine` | Provide your own SQLAlchemy engine instead of creating one |
| `schema` | `str` | Postgres schema name for the `datasource_outputs` table (defaults to `"dbos"`; ignored for SQLite) |
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

Putting it together, a complete async program looks like this. The datasource is created at module scope so that `@ads.transaction()` can decorate `insert_greeting` and `insert_greeting` can call `ads.sql_session()`:

<details>
<summary>Async Datasource Example</summary>

```python
import asyncio
import os

from dbos import DBOS, DBOSConfig, AsyncSQLAlchemyDatasource
from sqlalchemy import text

ads = asyncio.run(AsyncSQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"]))

config: DBOSConfig = {
    "name": "greeting-app",
    "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
}
DBOS(config=config)

@ads.transaction()
async def insert_greeting(name: str, note: str) -> None:
    session = ads.sql_session()
    await session.execute(
        text("INSERT INTO greetings (name, note) VALUES (:name, :note)"),
        {"name": name, "note": note},
    )

@DBOS.workflow()
async def greeting_workflow(name: str, note: str) -> None:
    await insert_greeting(name, note)

async def main() -> None:
    await greeting_workflow("Alice", "Hello!")

if __name__ == "__main__":
    DBOS.launch()
    asyncio.run(main())
```
</details>

The decorator accepts two optional keyword arguments:
- `name` – a custom step name recorded in the workflow log (defaults to the function's qualified name)
- `isolation_level` – the SQL transaction isolation level; one of `"SERIALIZABLE"` (default), `"REPEATABLE READ"`, or `"READ COMMITTED"` (SQLite supports only `"SERIALIZABLE"`)

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
