---
sidebar_position: 140
title: DBOS Database Connections
---

DBOS uses a database to durably store workflow and step state.
This database is called the **system database**.
Its schema is documented [here](../../explanations/system-tables.md).

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

## Transactions and the Application Database

[Transactions](./step-tutorial.md#transactions) are an **optional** special kind of step that are optimized for database accesses.
Transactions need to run in the database in which your application stores data.
You can specify the database in which transactions run by setting an `application_database_url` when you configure DBOS.
The application database (the database in which transactions run) does not need to be the same database (or even on the same server) as your system database.
For example:

```python
config: DBOSConfig = {
    "name": "dbos-example",
    "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
    "application_database_url": os.environ["APP_DATABASE_URL"],
}
DBOS(config=config)
```

:::info
If you are not using transactions, you do not need to set `application_database_url`.
:::