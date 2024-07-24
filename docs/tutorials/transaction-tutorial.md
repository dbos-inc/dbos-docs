---
sidebar_position: 2
title: Transactions
description: Learn how to perform database operations
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Transaction Functions

To perform operations on your application database in DBOS, you use _transaction functions_.
As their name implies, these functions execute as [database transactions](https://en.wikipedia.org/wiki/Database_transaction).

Transaction functions must be annotated with the [`@Transaction`](../api-reference/decorators#transaction) decorator and must have a [`TransactionContext`](../api-reference/contexts#transactioncontextt) as their first argument.
As with other DBOS functions, inputs and outputs must be serializable to JSON.

The [`TransactionContext`](../api-reference/contexts#transactioncontextt) provides a `.client` field you can use to transactionally interact with the database, so you don't need to worry about managing database connections.
DBOS supports [Knex.js](./using-knex.md), [TypeORM](./using-typeorm.md), and [Prisma](./using-prisma.md) clients as well as raw SQL through [knex.raw](https://knexjs.org/guide/raw.html).
You can configure which client to use in your [`dbos-config.yaml`](../api-reference/configuration.md) file; Knex is used by default.

Here's an example of a transaction function:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```javascript
export class Greetings {
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {
    await ctxt.client('greetings').insert({
      name: friend,
      note: note
    });
  }
}
```

See our [Knex guide](./using-knex.md) for more information.

</TabItem>
<TabItem value="typeorm" label="TypeORM">

```javascript
@Entity()
export class Greetings {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    note!: string;
}

@OrmEntities([Greetings])
export class DBOSGreetings {
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<EntityManager>, name: string, note: string) {
    let entity = new Greetings();
    entity.name = name;
    entity.note = note;
    await ctxt.client.save(entity);
  }
}
```

See our [TypeORM guide](./using-typeorm.md) for more information.


</TabItem>
<TabItem value="prisma" label="Prisma">

```javascript
export class Greetings {
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<PrismaClient>, name: string, note: string)  {
    await ctxt.client.greetings.create({
      data: {
        name: name,
        note: note,
      },
    });
  }
}
```

See our [Prisma guide](./using-prisma.md) for more information.


</TabItem>
<TabItem value="raw" label="Raw SQL">
```javascript
export class Greetings {
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {
    await ctxt.client.raw('INSERT INTO greetings (name, note) VALUES (?, ?)', [friend, note]);
  }
}
```
</TabItem>
</Tabs>

## Schema Management

We strongly recommend you manage your database schema using migrations.
Knex, TypeORM, and Prisma all provide rich support for schema management through migrations.
Please see their guides for more detail:

- [Knex schema management guide.](./using-knex.md#schema-management)
- [TypeORM schema management guide.](./using-typeorm.md#schema-management)
- [Prisma schema maanagement guide.](./using-prisma.md#schema-management)

If you are not using database transactions, you may wish to disable database migrations.
In [`dbos-config.yaml`](../api-reference/configuration.md), set your `migrate` setting as such:

```yaml
migrate:
    - echo 'No migrations'  
```