---
sidebar_position: 3
title: Transactions
description: Learn how to perform database operations
---

Transactions are a special type of [step](./step-tutorial.md) that are optimized for database accesses.
They execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction).

To make a Python function a transaction, annotate it with the [`@DBOS.transaction`](../reference/decorators.md#transaction) decorator.
Then, access the database using the [`DBOS.sql_session`](../reference/contexts.md#sql_session) client, which is a [SQLAlchemy](https://www.sqlalchemy.org/) client DBOS automatically connects to your database.
Here are some examples:

<Tabs groupId="database-clients">
<TabItem value="sqlalchemy" label="SQLAlchemy">

```python
greetings = Table(
    "greetings", 
    MetaData(), 
    Column("name", String), 
    Column("note", String)
)

@DBOS.transaction()
def example_insert(name: str, note: str) -> None:
    # Insert a new greeting into the database
    DBOS.sql_session.execute(greetings.insert().values(name=name, note=note))

@DBOS.transaction()
def example_select(name: str) -> Optional[str]:
    # Select the first greeting to a particular name
    row = DBOS.sql_session.execute(
        select(greetings.c.note).where(greetings.c.name == name)
    ).first()
    return row[0] if row else None
```

</TabItem>
<TabItem value="raw" label="Raw SQL">

```python
@DBOS.transaction()
def example_insert(name: str, note: str) -> None:
    # Insert a new greeting into the database
    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")
    DBOS.sql_session.execute(sql, {"name": name, "note": note})


@DBOS.transaction()
def example_select(name: str) -> Optional[str]:
    # Select the first greeting to a particular name
    sql = text("SELECT note FROM greetings WHERE name = :name LIMIT 1")
    row = DBOS.sql_session.execute(sql, {"name": name}).first()
    return row[0] if row else None
```

</TabItem>
</Tabs>

Transactions should run in the database in which your application stores data.
You can specify what database transactions run in by setting an `application_database_url` when you configure DBOS.
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

For more information, see the [DBOS configuration reference](../reference/configuration.md).

:::warning

At this time, DBOS does not support coroutine transactions. 
Decorating an `async def` function with `@DBOS.transaction` will raise an error at runtime.

:::
