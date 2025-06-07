---
sidebar_position: 30
title: Transactions
description: Learn how to perform database operations
---

Transactions are a special type of [step](./step-tutorial.md) that are optimized for database accesses.
They execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction).

To make a TypeScript function a transaction, annotate it with the [`DBOS.transaction`](../reference/transactapi/dbos-class.md#dbostransaction) decorator.
Then, access the database using raw SQL or one of several supported ORMs, including [Knex.js](https://knexjs.org/), [Drizzle](https://orm.drizzle.team/), [TypeORM](https://typeorm.io/), and [Prisma](https://www.prisma.io/).

Configure which ORM to use with the `userDbclient` field in your [DBOS configuration](../reference/configuration.md):

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  userDbclient: 'knex',
});
await DBOS.launch();
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  userDbclient: 'drizzle',
});
await DBOS.launch();
```

</TabItem>
<TabItem value="typeorm" label="TypeORM">

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  userDbclient: 'typeorm',
});
await DBOS.launch();
```


</TabItem>
<TabItem value="prisma" label="Prisma">

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  userDbclient: 'prisma',
});
await DBOS.launch();
```


</TabItem>
<TabItem value="raw" label="Raw SQL w/ Knex">

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  userDbclient: 'knex',
});
await DBOS.launch();
```

</TabItem>
</Tabs>

Here are some example transactions:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```javascript
interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {

  @DBOS.transaction()
  static async insertGreeting(gr: GreetingRecord) {
    await DBOS.knexClient('greetings').insert(gr);
  }

  @DBOS.transaction()
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

function getClient() { return DBOS.drizzleClient as NodePgDatabase; }

@OrmEntities({GreetingRecord})
export class Greetings {

  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    await getClient().insert(GreetingRecord).values({name: name, note: note});
  }

  @DBOS.transaction()
  static async getGreetings(): Promise<{name: string | null, note: string | null}[]> {
    return getClient().select().from(GreetingRecord);
  }
}
```

##### `@OrmEntities`
Marks a class as using ORM entity classes.
```typescript
@OrmEntities({GreetingRecord})
export class Greetings {/**/}
```

This code will ensure that drizzle is aware of the schema.

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

  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    const greeting = new GreetingRecord();
    greeting.name = name;
    greeting.note = note;
    await getClient().save(greeting);
  }

  @DBOS.transaction()
  static async getGreetings(): Promise<GreetingRecord[]> {
    return await getClient().getRepository(GreetingRecord).find();
  }  
}
```

##### `@OrmEntities`
Marks a class as using ORM entity classes.
```typescript
@OrmEntities([GreetingRecord])
export class Greetings {/**/}
```

This code will ensure that the TypeORM entity manager and repository know about the entities in the list.

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

  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    await getClient().greetingRecord.create({
      data: {
        name: name,
        note: note
      },
    });
  }

  @DBOS.transaction()
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

  @DBOS.transaction()
  static async insertGreeting(gr: GreetingRecord) {
    await DBOS.knexClient.raw('INSERT INTO greetings (name, note) VALUES (?, ?)', [gr.name, gr.note]);
  }

  @DBOS.transaction()
  static async getGreetings(): Promise<GreetingRecord[]> {
    const result = await DBOS.knexClient.raw('SELECT name, note FROM greetings') as { rows: GreetingRecord[] };
    return result.rows;
  }
}
```

</TabItem>
</Tabs>

## Templates

You can initialize a template app for each ORM with the following command:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```bash
npx -y @dbos-inc/create@latest -t dbos-knex -n <app-name>
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">

```bash
npx -y @dbos-inc/create@latest -t dbos-drizzle -n <app-name>
```

</TabItem>
<TabItem value="typeorm" label="TypeORM">

```bash
npx -y @dbos-inc/create@latest -t dbos-typeorm -n <app-name>
```


</TabItem>
<TabItem value="prisma" label="Prisma">

```bash
npx -y @dbos-inc/create@latest -t dbos-prisma -n <app-name>
```

</TabItem>
</Tabs>

Then, build it, run schema migrations, and start the app:

```bash
npm run build
npx knex migrate:latest
npx dbos start
```

Visit http://localhost:3000/greeting/dbos to see your app!