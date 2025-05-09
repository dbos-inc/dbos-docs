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

:::warning

At this time, DBOS does not support coroutine transactions. 
Decorating an `async def` function with `@DBOS.transaction` will raise an error at runtime.

:::

## Schema Management

We strongly recommend you manage your database schema using migrations.
One popular database migration tool in Python is [Alembic](https://alembic.sqlalchemy.org/en/latest/).

If you are using Alembic, you can generate a new migration with:

```shell
alembic revision -m <migration-name>
```

This creates a new migration file in whose `upgrade` and `downgrade` functions you can implement your migration.
For example:

```python
def upgrade() -> None:
    op.execute(sa.text("CREATE TABLE greetings (name TEXT, note TEXT)"))


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE greetings"))
```

You can also generate new migrations directly from your SQLAlchemy schema files using [Alembic autogeneration](https://alembic.sqlalchemy.org/en/latest/autogenerate.html).