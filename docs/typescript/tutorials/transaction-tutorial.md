---
sidebar_position: 30
title: Transactions
description: Learn how to perform database operations
---

We recommend performing database operations in _transactions_.
These are a special type of [step](./step-tutorial.md) that are optimized for database accesses.
They execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction).

To make a TypeScript function a transaction, annotate it with the [`DBOS.transaction`](../reference/transactapi/dbos-class.md#dbostransaction) decorator.
Then, access the database using raw SQL or one of several supported ORMs, including [Knex.js](./orms/using-knex.md), [Drizzle](./orms/using-drizzle.md), [TypeORM](./orms/using-typeorm.md), and [Prisma](./orms/using-prisma.md).
You can configure which ORM to use in your [`dbos-config.yaml`](../reference/configuration.md) file.
Knex is the default.

Here are some examples:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```javascript
interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {
  //...
  @DBOS.transaction()
  static async insertGreeting(gr: GreetingRecord) {
    await DBOS.knexClient('greetings').insert(gr);
  }

  @DBOS.transaction({readOnly: true})
  static async getGreetings(): Promise<GreetingRecord[]>  {
    return await DBOS.knexClient<GreetingRecord>('greetings').select('*');
  }
}
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">

```javascript
export const GreetingRecord = pgTable('greetings', {
  name: text('name'),
  note: text('note'),
});

function getClient() {DBOS.drizzleClient as NodePgDatabase;}

export class Greetings {
  //..
  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    await getClient().insert(GreetingRecord).values({name: name, note: note});
  }

  @DBOS.transaction({ readOnly:true })
  static async getGreetings(): Promise<{name: string | null, note: string | null}[]> {
    return getClient().select().from(GreetingRecord);
  }
}
```

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

function getClient() {return DBOS.typeORMClient as EntityManager;}

@OrmEntities([GreetingRecord])
export class Greetings {
  //...
  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    const greeting = new GreetingRecord();
    greeting.name = name;
    greeting.note = note;
    await getClient().save(greeting);
  }

  @DBOS.transaction({ readOnly:true })
  static async getGreetings(): Promise<GreetingRecord[]> {
    return await getClient().getRepository(GreetingRecord).find();
  }  
}
```

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

function getClient() {return DBOS.prismaClient as PrismaClient;}

export class Greetings {
  //...
  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    await getClient().greetingRecord.create({
      data: {
        name: name,
        note: note
      },
    });
  }

  @DBOS.transaction({ readOnly:true })
  static async getGreetings(): Promise<GreetingRecord[]> {
    return await getClient().greetingRecord.findMany();
  }
}
```

</TabItem>
<TabItem value="raw" label="Raw SQL w/ Knex">

```javascript
interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {
  //...
  @DBOS.transaction()
  static async insertGreeting(gr: GreetingRecord) {
    await ctxt.knexClient.raw('INSERT INTO greetings (name, note) VALUES (?, ?)', [gr.name, gr.note]);
  }

  @DBOS.transaction({readOnly: true})
  static async getGreetings(): Promise<GreetingRecord[]> {
    const result = await DBOS.knexClient.raw('SELECT name, note FROM greetings') as { rows: GreetingRecord[] };
    return result.rows;
  }
}
```

</TabItem>
</Tabs>

:::note
As shown above, we suggest decorating read-only transactions with `@DBOS.transaction({readOnly: true})` for better performance.
:::

## Schema Management

We strongly recommend you manage your database schema using migrations.

Migration commands are configured in your [`dbos-config.yaml`](../reference/configuration.md) file.
At migration time, DBOS runs all migration commands.
Please see these guides for details on how to configure migrations with each supported ORM:

- [Knex schema management guide.](./orms/using-knex.md#schema-management)
- [Drizzle schema management guide.](./orms/using-drizzle.md#schema-management)
- [TypeORM schema management guide.](./orms/using-typeorm.md#schema-management)
- [Prisma schema management guide.](./orms/using-prisma.md#schema-management)
