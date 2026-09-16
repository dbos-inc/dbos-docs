# DBOS Database Connections

> DBOS uses a database to durably store workflow and step state.
> This database is called the **system database**.
> Its schema is documented [here](../../explanations/system-tables.md).

You can use either a SQLite or Postgres database.
A SQLite database is just a file on disk, while a Postgres database is a server that your application connects to.
By default, DBOS uses SQLite.
SQLite is excellent for prototyping and testing because it requires no configuration or server.
However, because a SQLite database is just a file on disk, it can't be used in a distributed setting where an application runs on multiple servers.
Therefore, **for production, we recommend using Postgres**.

## Configuring the System Database Connection

You can configure the database DBOS connects to through the `system_database_url` field of `DBOSConfig`.
For example:

```python
config: DBOSConfig = {
    "name": "dbos-example",
    "application_version": "0.1.0",
    "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
}
DBOS(config=config)
```

A valid Postgres connection string looks like:

```
postgresql://[username]:[password]@[hostname]:[port]/[database name]
```

For example:

```
postgresql://postgres:dbos@localhost:5432/dbos_example
```

A valid SQLite connection string looks like:

```
sqlite:///[path to database file]
```

For example:

```
sqlite:///dbos_example.sqlite
```

For more information on DBOS configuration, see [the reference](../reference/configuration.md).

## Connecting to an Application Database

To run durable database operations in workflows, use [datasources](./transaction-tutorial.md#datasources).
You create a datasource with its own database URL, independent of the DBOS system database:

```python
import asyncio
import os
from dbos import SQLAlchemyDatasource, AsyncSQLAlchemyDatasource

# Sync
ds = SQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"])

# Async. The datasource is not tied to the event loop that created it,
# so it can be used from the event loop that runs your application
ads = asyncio.run(AsyncSQLAlchemyDatasource.create(os.environ["APP_DATABASE_URL"]))
```

The datasource manages its own connection pool and can point to any PostgreSQL or SQLite database.
To use an async datasource with SQLite, use an async driver URL such as `sqlite+aiosqlite:///app.sqlite`.
Your application database does not need to be the same database (or even on the same server) as your system database, and no additional DBOS configuration is needed.
See the [datasources tutorial](./transaction-tutorial.md#datasources) for full usage details.
