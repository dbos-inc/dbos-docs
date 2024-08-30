---
sidebar_position: 1
title: Transactions
description: Learn how to perform database operations
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

We recommend performing database operations in _transaction functions_, which execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction). 

To make a Python function transactional, annotate it with the [`@DBOS.transaction`](../reference-python/decorators.md#transaction) decorator.
Then, access the database using the [`DBOS.sqlsession`](../reference-python/contexts.md#sql_session) client, which is a [SQLAlchemy](https://www.sqlalchemy.org/) client DBOS automatically connects to your database.

For example:

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
    DBOS.sql_session.execute(greetings.insert().values(name=name, note=note))

@DBOS.transaction()
def example_select(name: str) -> Optional[str]:
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
    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")
    DBOS.sql_session.execute(sql, {"name": name, "note": note})


@DBOS.transaction()
def example_select(name: str) -> Optional[str]:
    sql = text("SELECT note FROM greetings WHERE name = :name LIMIT 1")
    row = DBOS.sql_session.execute(sql, {"name": name}).first()
    return row[0] if row else None
```

</TabItem>
</Tabs>


## Schema Management

We strongly recommend you manage your database schema using migrations.
DBOS supports any Python database migration tool, but by default uses [Alembic](https://alembic.sqlalchemy.org/en/latest/).


Migration commands are configured in your [`dbos-config.yaml`](../reference-python/configuration.md) file.
At migration time, DBOS runs all migration commands.
The default configuration, using Alembic, is:

```yaml
database:
  ...
  migrate:
    - alembic upgrade head
```


To execute all migration commands, run:

```
dbos migrate
```

If you are using Alembic, you can generate a new migration with:

```
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