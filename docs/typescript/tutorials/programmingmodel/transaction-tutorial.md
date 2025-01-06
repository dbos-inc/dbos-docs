---
sidebar_position: 30
title: Transactions
description: Learn how to perform database operations
---

Use _transaction functions_ to read and write from your database. A transaction function may contain multiple queries as well as TypeScript business logic and executes as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction). 

Transaction functions must be annotated with the [`@DBOS.transaction`](../../reference/transactapi/dbos-class#dbostransaction) decorator.
As with other DBOS functions, inputs and outputs must be serializable to JSON.

[`DBOS`](../../reference/transactapi/dbos-class#accesing-sql-database-clients) provides a `DBOS.sqlClient` field you can use to interact with the database, so you don't need to worry about managing connections.
DBOS supports [Knex.js](./orms/using-knex.md), [Drizzle](./orms/using-drizzle.md), [TypeORM](./orms/using-typeorm.md), and [Prisma](./orms/using-prisma.md) clients as well as raw SQL.
You can configure which client to use in your [`dbos-config.yaml`](../../reference/configuration.md) file.  Knex is the default.

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

See our [Knex guide](./orms/using-knex.md) for more information.

</TabItem>
<TabItem value="drizzle" label="Drizzle">

```javascript
export const GreetingRecord = pgTable('greetings', {
  name: text('name'),
  note: text('note'),
});

export class Greetings {
  //..
  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    await (DBOS.drizzleClient as NodePgDatabase).insert(GreetingRecord).values({name: name, note: note});
  }

  @DBOS.transaction({ readOnly:true })
  static async getGreetings(): Promise<{name: string | null, note: string | null}[]> {
    return (DBOS.drizzleClient as NodePgDatabase).select().from(GreetingRecord);
  }
}
```

See our [Drizzle guide](./orms/using-drizzle.md) for more information.

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
  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    const greeting = new GreetingRecord();
    greeting.name = name;
    greeting.note = note;
    await (DBOS.typeORMClient as EntityManager).save(greeting);
  }

  @DBOS.transaction({ readOnly:true })
  static async getGreetings(): Promise<GreetingRecord[]> {
    return await (DBOS.typeORMClient as EntityManager).getRepository(GreetingRecord).find();
  }  
}
```

See our [TypeORM guide](./orms/using-typeorm) for more information.


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
  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    await (DBOS.prismaClient as PrismaClient).greetingRecord.create({
      data: {
        name: name,
        note: note
      },
    });
  }

  @DBOS.transaction({ readOnly:true })
  static async getGreetings(): Promise<GreetingRecord[]> {
    return await (DBOS.prismaClient as PrismaClient).greetingRecord.findMany();
  }
}
```

See our [Prisma guide](./orms/using-prisma.md) for more information.


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
As shown above, we suggest decorating read transactions as `@DBOS.transaction({readOnly: true})` for faster performance.
:::

## Schema Management

We strongly recommend you manage your database schema using migrations.
Knex, TypeORM, and Prisma all provide rich support for schema management through migrations.
Please see their guides for more detail:

- [Knex schema management guide.](./orms/using-knex.md#schema-management)
- [Drizzle schema management guide.](./orms/using-drizzle.md#schema-management)
- [TypeORM schema management guide.](./orms/using-typeorm.md#schema-management)
- [Prisma schema management guide.](./orms/using-prisma.md#schema-management)

If you are not using database transactions, you may wish to disable database migrations.
In [`dbos-config.yaml`](../../reference/configuration.md), set your `migrate:` section as below:

```yaml
migrate:
    - echo 'No migrations'  
```