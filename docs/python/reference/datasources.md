---
sidebar_position: 60
title: Datasources
---

Datasources wrap a SQLAlchemy engine so that database transactions run inside DBOS workflows are tracked and replayed with exactly-once guarantees. See the [Transactions & Datasources tutorial](../tutorials/transaction-tutorial.md) for a full walkthrough.

## SQLAlchemyDatasource

A synchronous datasource backed by a SQLAlchemy `Engine`. Use this for non-async code.

### `SQLAlchemyDatasource.create`

```python
SQLAlchemyDatasource.create(
    database_url: str,
    engine_kwargs: Optional[Dict[str, Any]] = None,
    engine: Optional[sa.Engine] = None,
    schema: Optional[str] = None,
    serializer: Optional[Serializer] = None,
    sessionmaker: Optional[sessionmaker] = None,
    run_migrations: bool = True,
) -> SQLAlchemyDatasource
```

Factory method. Creates (or reuses) a SQLAlchemy engine and creates or migrates the datasource's `datasource_outputs` tracking table, unless `run_migrations` is `False`.

**Parameters:**
- `database_url`: A SQLAlchemy-compatible connection URL (e.g., `"postgresql+psycopg://..."` or `"sqlite:///./my.db"`).
- `engine_kwargs`: Optional keyword arguments forwarded verbatim to SQLAlchemy's `create_engine`.
- `engine`: Provide an existing `sa.Engine` instead of creating one from `database_url`. When set, `engine_kwargs` is ignored.
- `schema`: The PostgreSQL schema in which the `datasource_outputs` table is created. Defaults to `"dbos"`. Has no effect for SQLite.
- `serializer`: A custom serializer for transaction outputs. Defaults to the DBOS default serializer (`pickle`, then Base64-encoded), not the `serializer` set in [`DBOSConfig`](./configuration.md#serialization-settings).
- `sessionmaker`: A custom `sqlalchemy.orm.sessionmaker` used to create the session for each transaction, for example to use a custom `Session` subclass, session options, or event hooks. DBOS always binds sessions to the datasource's engine, so any `bind` you set is ignored, and a sessionmaker that sets `binds` raises a `DBOSException`. Defaults to `sessionmaker(expire_on_commit=False)`.
- `run_migrations`: Whether to create and migrate the datasource's tables. Defaults to `True`. Set to `False` if your application's database role cannot run DDL: the datasource then only verifies that its tables are migrated, raising a `DBOSInitializationError` if they are not. Migrate them separately with [`SQLAlchemyDatasource.migrate`](#sqlalchemydatasourcemigrate).

**Example:**
```python
from dbos import SQLAlchemyDatasource

ds = SQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"])
```

### `SQLAlchemyDatasource.migrate`

```python
SQLAlchemyDatasource.migrate(
    database_url: str,
    *,
    schema: Optional[str] = None,
    application_role: Optional[str] = None,
) -> None
```

Create or migrate a datasource's tables without creating a datasource.
Run this with a privileged database role (for example, as part of your deployment's migration step), then create your datasources with `run_migrations=False` so your application's role needs no DDL privileges.

**Parameters:**
- `database_url`: The connection URL of the datasource's database.
- `schema`: The PostgreSQL schema holding the datasource's tables. Defaults to `"dbos"`. Has no effect for SQLite.
- `application_role`: A PostgreSQL role to grant the minimal permissions a datasource needs at runtime: usage on the schema, `SELECT`, `INSERT`, and `DELETE` on the `datasource_outputs` table, and `SELECT` on the migration version table. Not supported for SQLite.

**Example:**
```python
from dbos import SQLAlchemyDatasource

# In your migration script, run with a privileged role:
SQLAlchemyDatasource.migrate(os.environ["ADMIN_DATABASE_URL"], application_role="my_app_role")

# In your application, run with my_app_role:
ds = SQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"], run_migrations=False)
```

### `SQLAlchemyDatasource.transaction`

```python
ds.transaction(
    func: Optional[Callable] = None,
    *,
    name: Optional[str] = None,
    isolation_level: IsolationLevel = "SERIALIZABLE",
)
```

Decorator that registers a synchronous function as a datasource transaction step.

The decorated function must **not** be a coroutine (`async def`). Decorating an `async def` function raises `DBOSException` at decoration time.

**Parameters:**
- `name`: Step name recorded in the workflow log. Defaults to the function's qualified name (`__qualname__`).
- `isolation_level`: SQL transaction isolation level. Must be one of `"SERIALIZABLE"` (default), `"REPEATABLE READ"`, or `"READ COMMITTED"`. SQLite supports only `"SERIALIZABLE"`.

**Example:**
```python
@ds.transaction()
def insert_row(name: str, value: int) -> None:
    session = ds.sql_session()
    session.execute(text("INSERT INTO t VALUES (:n, :v)"), {"n": name, "v": value})

@ds.transaction(isolation_level="READ COMMITTED", name="read_row")
def get_row(name: str) -> Optional[int]:
    session = ds.sql_session()
    row = session.execute(text("SELECT value FROM t WHERE name = :n"), {"n": name}).first()
    return row[0] if row else None
```

### `SQLAlchemyDatasource.run_tx_step`

```python
ds.run_tx_step(
    ds_options: Optional[DatasourceOptions],
    func: Callable[P, R],
    *args: P.args,
    **kwargs: P.kwargs,
) -> R
```

Runs `func` as a datasource transaction step without requiring the `@ds.transaction` decorator. Raises `DBOSException` if `func` is a coroutine.

**Parameters:**
- `ds_options`: A `DatasourceOptions` dict with optional keys `name` and `isolation_level`, or `None` to use the defaults.
- `func`: The function to execute inside the transaction.
- `*args`, `**kwargs`: Arguments forwarded to `func`.

**Example:**
```python
def insert_row(name: str, value: int) -> None:
    session = ds.sql_session()
    session.execute(text("INSERT INTO t VALUES (:n, :v)"), {"n": name, "v": value})

@DBOS.workflow()
def my_workflow(name: str, value: int) -> None:
    ds.run_tx_step({"name": "insert_row"}, insert_row, name, value)
```

### `SQLAlchemyDatasource.sql_session`

```python
ds.sql_session() -> Session
```

Returns the SQLAlchemy `Session` for the current datasource transaction. Must be called from within a function that is executing inside a datasource transaction (i.e., decorated with `@ds.transaction` or called via `run_tx_step`). Raises `AssertionError` if called outside a transaction.

---

## AsyncSQLAlchemyDatasource

An asynchronous datasource backed by a SQLAlchemy `AsyncEngine`. Use this for `async def` code.

### `AsyncSQLAlchemyDatasource.create`

```python
await AsyncSQLAlchemyDatasource.create(
    database_url: str,
    engine_kwargs: Optional[Dict[str, Any]] = None,
    engine: Optional[AsyncEngine] = None,
    schema: Optional[str] = None,
    serializer: Optional[Serializer] = None,
    sessionmaker: Optional[async_sessionmaker] = None,
    run_migrations: bool = True,
) -> AsyncSQLAlchemyDatasource
```

Async factory method. Creates (or reuses) a SQLAlchemy `AsyncEngine` and creates or migrates the datasource's `datasource_outputs` tracking table, unless `run_migrations` is `False`.

**Parameters:**
- `database_url`: A SQLAlchemy-compatible async connection URL (e.g., `"postgresql+psycopg://..."` or `"sqlite+aiosqlite:///./my.db"`).
- `engine_kwargs`: Optional keyword arguments forwarded verbatim to SQLAlchemy's `create_async_engine`.
- `engine`: Provide an existing `AsyncEngine` instead of creating one from `database_url`. When set, `engine_kwargs` is ignored.
- `schema`: The PostgreSQL schema in which the `datasource_outputs` table is created. Defaults to `"dbos"`. Has no effect for SQLite.
- `serializer`: A custom serializer for transaction outputs. Defaults to the DBOS default serializer (`pickle`, then Base64-encoded), not the `serializer` set in [`DBOSConfig`](./configuration.md#serialization-settings).
- `sessionmaker`: A custom `sqlalchemy.ext.asyncio.async_sessionmaker` used to create the session for each transaction, for example to use a custom `AsyncSession` subclass, session options, or event hooks. DBOS always binds sessions to the datasource's engine, so any `bind` you set is ignored, and a sessionmaker that sets `binds` raises a `DBOSException`. Defaults to `async_sessionmaker(expire_on_commit=False)`.
- `run_migrations`: Whether to create and migrate the datasource's tables. Defaults to `True`. Set to `False` if your application's database role cannot run DDL: the datasource then only verifies that its tables are migrated, raising a `DBOSInitializationError` if they are not. Migrate them separately with [`AsyncSQLAlchemyDatasource.migrate`](#asyncsqlalchemydatasourcemigrate).

**Example:**

To safely create `AsyncSQLAlchemyDatasource` at module scope:

```python
import asyncio
import os
from dbos import AsyncSQLAlchemyDatasource

# The datasource is not tied to the event loop that created it,
# so it can be used from the event loop that runs your application.
ads = asyncio.run(AsyncSQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"]))
```

### `AsyncSQLAlchemyDatasource.migrate`

```python
await AsyncSQLAlchemyDatasource.migrate(
    database_url: str,
    *,
    schema: Optional[str] = None,
    application_role: Optional[str] = None,
) -> None
```

Coroutine version of [`SQLAlchemyDatasource.migrate`](#sqlalchemydatasourcemigrate).
Create or migrate a datasource's tables without creating a datasource, then create your datasources with `run_migrations=False`.

### `AsyncSQLAlchemyDatasource.transaction`

```python
ads.transaction(
    func: Optional[Callable] = None,
    *,
    name: Optional[str] = None,
    isolation_level: IsolationLevel = "SERIALIZABLE",
)
```

Decorator that registers an async coroutine function as a datasource transaction step.

The decorated function **must** be a coroutine (`async def`). Decorating a non-coroutine raises `DBOSException` at decoration time.

**Parameters:**
- `name`: Step name recorded in the workflow log. Defaults to the function's qualified name (`__qualname__`).
- `isolation_level`: SQL transaction isolation level. Must be one of `"SERIALIZABLE"` (default), `"REPEATABLE READ"`, or `"READ COMMITTED"`. SQLite supports only `"SERIALIZABLE"`.

**Example:**
```python
@ads.transaction()
async def insert_row(name: str, value: int) -> None:
    session = ads.sql_session()
    await session.execute(text("INSERT INTO t VALUES (:n, :v)"), {"n": name, "v": value})

@ads.transaction(isolation_level="READ COMMITTED", name="read_row")
async def get_row(name: str) -> Optional[int]:
    session = ads.sql_session()
    row = (await session.execute(text("SELECT value FROM t WHERE name = :n"), {"n": name})).first()
    return row[0] if row else None
```

### `AsyncSQLAlchemyDatasource.run_tx_step_async`

```python
await ads.run_tx_step_async(
    ds_options: Optional[DatasourceOptions],
    func: Callable[P, Coroutine[Any, Any, R]],
    *args: P.args,
    **kwargs: P.kwargs,
) -> R
```

Runs `func` as a datasource transaction step without requiring the `@ds.transaction` decorator. Raises `DBOSException` if `func` is not a coroutine.

**Parameters:**
- `ds_options`: A `DatasourceOptions` dict with optional keys `name` and `isolation_level`, or `None` to use the defaults.
- `func`: The coroutine function to execute inside the transaction.
- `*args`, `**kwargs`: Arguments forwarded to `func`.

**Example:**
```python
async def insert_row(name: str, value: int) -> None:
    session = ads.sql_session()
    await session.execute(text("INSERT INTO t VALUES (:n, :v)"), {"n": name, "v": value})

@DBOS.workflow()
async def my_workflow(name: str, value: int) -> None:
    await ads.run_tx_step_async({"name": "insert_row"}, insert_row, name, value)
```

### `AsyncSQLAlchemyDatasource.sql_session`

```python
ads.sql_session() -> AsyncSession
```

Returns the SQLAlchemy `AsyncSession` for the current datasource transaction. Must be called from within a coroutine that is executing inside a datasource transaction (i.e., decorated with `@ds.transaction` or called via `run_tx_step_async`). Raises `AssertionError` if called outside a transaction.

---

## DatasourceOptions

```python
class DatasourceOptions(TypedDict, total=False):
    name: Optional[str]
    isolation_level: Optional[IsolationLevel]
```

A `TypedDict` passed to `run_tx_step` / `run_tx_step_async` to configure the step. Both fields are optional; pass `None` instead of the dict to use all defaults.

**Fields:**
- `name`: Step name recorded in the workflow log.
- `isolation_level`: One of `"SERIALIZABLE"`, `"REPEATABLE READ"`, or `"READ COMMITTED"` (SQLite supports only `"SERIALIZABLE"`).
