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

DBOS supports the full [Knex Postgres API](https://knexjs.org/guide/query-builder.html), but doesn't allow manually committing or aborting transactions.
Instead, transactions automatically commit when the function successfully returns and abort and roll back if the function throws an exception.
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

Using TypeORM with DBOS requires defining entities (like `DBOSHello`), which are [defined in the same way as any other TypeORM project](https://typeorm.io/entities).
To make DBOS aware of the entities, a class-level decorator (`OrmEntities`) is used on each class containing DBOS transaction methods.


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