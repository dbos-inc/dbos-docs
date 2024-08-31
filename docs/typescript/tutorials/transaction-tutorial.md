---
sidebar_position: 2
title: Transactions
description: Learn how to perform database operations
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Use _transaction functions_ to read and write from your database. A transaction function may contain multiple queries as well as TypeScript business logic and executes as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction). 

Transaction functions must be annotated with the [`@Transaction`](../reference/decorators#transaction) decorator and must have a [`TransactionContext`](../reference/contexts#transactioncontextt) as their first argument.
As with other DBOS functions, inputs and outputs must be serializable to JSON.

The [`TransactionContext`](../reference/contexts#transactioncontextt) provides a `.client` field you can use to interact with the database, so you don't need to worry about managing connections.
DBOS supports [Knex.js](./using-knex.md), [Drizzle](./using-drizzle.md), [TypeORM](./using-typeorm.md), and [Prisma](./using-prisma.md) clients as well as raw SQL.
You can configure which client to use in your [`dbos-config.yaml`](../reference/configuration.md) file.
Knex is the default and we recommend using `Knex.raw()` for raw SQL.

Here are examples of a write and a read transaction function using each client.

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```javascript
interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {
  //...
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<Knex>, gr: GreetingRecord) {
    await ctxt.client('greetings').insert(gr);
  }

  @Transaction({readOnly: true})
  static async getGreetings(ctxt: TransactionContext<Knex>): Promise<GreetingRecord[]>  {
    return await ctxt.client<GreetingRecord>('greetings').select('*');
  }
}
```

See our [Knex guide](./using-knex.md) for more information.

</TabItem>
<TabItem value="drizzle" label="Drizzle">

```javascript
export const GreetingRecord = pgTable('greetings', {
  name: text('name'),
  note: text('note'),
});

export class Greetings {
  //..
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<NodePgDatabase>, name: string, note: string) {
    await ctxt.client.insert(GreetingRecord).values({name: name, note: note});
  }

  @Transaction({ readOnly:true })
  static async getGreetings(ctxt: TransactionContext<NodePgDatabase>): Promise<{name: string | null, note: string | null}[]> {
    return await ctxt.client.select().from(GreetingRecord);
  }
}
```

See our [Drizzle guide](./using-drizzle.md) for more information.

</TabItem>
<TabItem value="typeorm" label="TypeORM">

```javascript
@Entity('greetings') //set the name of the table to 'greetings'
export class GreetingRecord {
    @PrimaryGeneratedColumn() //note: TypeORM requires at least one primary key
    id!: number;

    @Column()
    name!: string;

    @Column()
    note!: string;
}

@OrmEntities([GreetingRecord])
export class Greetings {
  //...
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<EntityManager>, name: string, note: string) {
    const greeting = new GreetingRecord();
    greeting.name = name;
    greeting.note = note;
    await ctxt.client.save(greeting);
  }

  @Transaction({ readOnly:true })
  static async getGreetings(ctxt: TransactionContext<EntityManager>): Promise<GreetingRecord[]> {
    return await ctxt.client.getRepository(GreetingRecord).find();
  }  
}
```

See our [TypeORM guide](./using-typeorm.md) for more information.


</TabItem>
<TabItem value="prisma" label="Prisma">

```javascript
//Model specified in prisma/schema.prisma:
//
//model GreetingRecord {
//  @@map("greetings") 
//  greeting_id Int @id @default(autoincrement()) //Note: Prisma requires at least one primary key
//  name String
//  note String
//}

// Use the generated Prisma client and GreetingRecord class
import { PrismaClient, GreetingRecord } from "@prisma/client";

export class Greetings {
  //...
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<PrismaClient>, name: string, note: string) {
    await ctxt.client.greetingRecord.create({
      data: {
        name: name,
        note: note
      },
    });
  }

  @Transaction({ readOnly:true })
  static async getGreetings(ctxt: TransactionContext<PrismaClient>): Promise<GreetingRecord[]> {
    return await ctxt.client.greetingRecord.findMany();
  }
}
```

See our [Prisma guide](./using-prisma.md) for more information.


</TabItem>
<TabItem value="raw" label="Raw SQL">

```javascript
interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {
  //...
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<Knex>, gr: GreetingRecord) {
    await ctxt.client.raw('INSERT INTO greetings (name, note) VALUES (?, ?)', [gr.name, gr.note]);
  }

  @Transaction({readOnly: true})
  static async getGreetings(ctxt: TransactionContext<Knex>): Promise<GreetingRecord[]> {
    const result = await ctxt.client.raw('SELECT name, note FROM greetings') as { rows: GreetingRecord[] };
    return result.rows;
  }
}
```

</TabItem>
</Tabs>

:::note
As shown above, we suggest decorating read transactions as `@Transaction({readOnly: true})` for faster performance.
:::

## Schema Management

We strongly recommend you manage your database schema using migrations.
Knex, TypeORM, and Prisma all provide rich support for schema management through migrations.
Please see their guides for more detail:

- [Knex schema management guide.](./using-knex.md#schema-management)
- [Drizzle schema management guide.](./using-drizzle.md#schema-management)
- [TypeORM schema management guide.](./using-typeorm.md#schema-management)
- [Prisma schema management guide.](./using-prisma.md#schema-management)

If you are not using database transactions, you may wish to disable database migrations.
In [`dbos-config.yaml`](../reference/configuration.md), set your `migrate:` section as below:

```yaml
migrate:
    - echo 'No migrations'  
```