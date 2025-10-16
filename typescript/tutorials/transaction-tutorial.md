---
sidebar_position: 30
title: Transactions & Datasources
description: Learn how to perform database operations
---

DBOS Transactions are a special kind of step intended for database access.  They execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction), atomically committing both user-defined changes and a DBOS checkpoint.

You can perform transactions using datasources, which wrap database clients with DBOS-aware transaction logic.  Datasources are available for popular TypeScript libraries and expose the same interface as the underlying client. For example, the Knex datasource provides a `Knex.Transaction` client, and the Drizzle datasource provides a Drizzle `Transaction<>` client. This means you can use your existing database statements&mdash;just use the transaction provided within the datasource.

## Installing Data Sources

Each datasource is implemented in its own package, which must be installed before use.

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```shell
npm i @dbos-inc/knex-datasource
```

</TabItem>
<TabItem value="kysely" label="Kysely">

```shell
npm i @dbos-inc/kysely-datasource
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">

```shell
npm i @dbos-inc/drizzle-datasource
```

</TabItem>
<TabItem value="typeorm" label="TypeORM">

```shell
npm i @dbos-inc/typeorm-datasource
```


</TabItem>
<TabItem value="prisma" label="Prisma">

```shell
npm i @dbos-inc/prisma-datasource
```


</TabItem>
<TabItem value="node-postgres" label="node-postgres">

```shell
npm i @dbos-inc/nodepg-datasource
```


</TabItem>
<TabItem value="pg" label="Postgres.js">

```shell
npm i @dbos-inc/postgres-datasource
```


</TabItem>
</Tabs>

## Using Datasources

Before using a datasource, you must configure and construct it:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">


```typescript
const config = {client: 'pg', connection: process.env.DBOS_DATABASE_URL}
const dataSource = new KnexDataSource('app-db', config);
```

</TabItem>
<TabItem value="kysely" label="Kysely">


```typescript
const config = { connectionString: process.env.DBOS_DATABASE_URL };
const dataSource = new KyselyDataSource<Database>('app-db', config);
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">

```typescript
export const config = { connectionString: process.env.DBOS_DATABASE_URL };
const dataSource = new DrizzleDataSource<NodePgDatabase>('app-db', config);
```

</TabItem>
<TabItem value="typeorm" label="TypeORM">

```typescript
const config = { connectionString: process.env.DBOS_DATABASE_URL };
const dataSource1 = TypeORMDataSource.createFromConfig('app-db', config, [/*entities*/]);
const dataSource2 = TypeORMDataSource.createFromDataSource('app-db-2', existingTypeOrmDS);
```

</TabItem>
<TabItem value="prisma" label="Prisma">

```typescript
process.env['DATABASE_URL'] = process.env['DBOS_DATABASE_URL'];
const prismaClient = new PrismaClient();
const dataSource = new PrismaDataSource<PrismaClient>('app-db', prismaClient);
```

</TabItem>
<TabItem value="node-postgres" label="node-postgres">

```typescript
const dataSource = new NodePostgresDataSource('app-db', {connectionString: process.env.DBOS_DATABASE_URL});
```

</TabItem>
<TabItem value="pg" label="Postgres.js">

```typescript
const dataSource = new PostgresDataSource('app-db', {connection: {url: process.env.DBOS_DATABASE_URL}});
```

</TabItem>
</Tabs>

Note that the names `dataSource` and `app-db` are used throughout this page, but were chosen arbitrarily.  It is possible to use several datasource instances, with different names.

You can run a function as a transaction using `dataSource.runTransaction`.  The transaction function should use `dataSource.client` as a client to access the database.  (Note that while some data source classes expose a static `client` property, the data source object instance should be used to get the `client` as the instance asserts that its client is actually available.)

Examples:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```typescript
async function insertFunction(user: string) {
  const rows = await dataSource
    .client<greetings>('greetings')
    .insert({ name: user, greet_count: 1 })
    .onConflict('name')
    .merge({ greet_count: dataSource.client.raw('greetings.greet_count + 1') })
    .returning('greet_count');
  const row = rows.length > 0 ? rows[0] : undefined;

  return { user, greet_count: row?.greet_count, now: Date.now() };
}

await dataSource.runTransaction(() => insertFunction(user), { name: 'insertFunction' /*Transaction options go here*/ });
```

</TabItem>

<TabItem value="kysely" label="Kysely">

```typescript
async function insertFunction(user: string) {
  const row = await dataSource.client
    .insertInto('greetings')
    .values({ name: user, greet_count: 1 })
    .onConflict((oc) =>
      oc.column('name').doUpdateSet({
        greet_count: sql`greetings.greet_count + 1`,
      }),
    )
    .returning('greet_count')
    .executeTakeFirst();

  return {
    user,
    greet_count: row?.greet_count!,
    now: Date.now()
  }
}

await dataSource.runTransaction(() => insertFunction(user), { name: 'insertFunction' /*Transaction options go here*/ });
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">

```typescript
async function insertFunction(user: string) {
  const result = await dataSource.client
    .insert(greetingsTable)
    .values({ name: user, greet_count: 1 })
    .onConflictDoUpdate({
      target: greetingsTable.name,
      set: {
        greet_count: sql`${greetingsTable.greet_count} + 1`,
      },
    })
    .returning({ greet_count: greetingsTable.greet_count });

  const row = result.length > 0 ? result[0] : undefined;
  return { user, greet_count: row?.greet_count, now: Date.now() };
}

await dataSource.runTransaction(() => insertFunction(user), { name: 'insertFunction' /*Transaction options go here*/ });
```

</TabItem>
<TabItem value="typeorm" label="TypeORM">

```typescript
async function insertFunction(user: string) {
  type Result = Array<{ greet_count: number }>;
  const rows = await dataSource.entityManager.sql<Result>`
     INSERT INTO greetings(name, greet_count) VALUES(${user}, 1)
     ON CONFLICT(name) DO UPDATE SET greet_count = greetings.greet_count + 1
     RETURNING greet_count`;

  const row = rows.length > 0 ? rows[0] : undefined;
  return { user, greet_count: row?.greet_count, now: Date.now() };
}

await dataSource.runTransaction(() => insertFunction(user), { name: 'insertFunction' /*Transaction options go here*/ });
```

</TabItem>
<TabItem value="prisma" label="Prisma">

```typescript
async function insertFunction(user: string) {
  const existing = await dataSource.client.dbosHello.findUnique({
    where: { name: user },
    select: { greet_count: true },
  });

  let greet_count: number;

  if (!existing) {
    const created = await dataSource.client.dbosHello.create({
      data: { name: user, greet_count: 1 },
      select: { greet_count: true },
    });
    greet_count = created.greet_count;
  } else {
    const updated = await dataSource.client.dbosHello.update({
      where: { name: user },
      data: { greet_count: { increment: 1 } },
      select: { greet_count: true },
    });
    greet_count = updated.greet_count;
  }

  return {
    user,
    greet_count,
    now: Date.now(),
  };
}

await dataSource.runTransaction(() => insertFunction(user), { name: 'insertFunction' /*Transaction options go here*/ });
```

</TabItem>
<TabItem value="node-postgres" label="node-postgres">

```typescript
async function insertFunction(user: string) {
  const { rows } = await dataSource.client.query<Pick<greetings, 'greet_count'>>(
    `INSERT INTO greetings(name, greet_count)
     VALUES($1, 1)
     ON CONFLICT(name)
     DO UPDATE SET greet_count = greetings.greet_count + 1
     RETURNING greet_count`,
    [user],
  );
  const row = rows.length > 0 ? rows[0] : undefined;
  return { user, greet_count: row?.greet_count, now: Date.now() };
}

await dataSource.runTransaction(() => insertFunction(user), { name: 'insertFunction' /*Transaction options go here*/ });
```

</TabItem>
<TabItem value="pg" label="Postgres.js">

```typescript
async function insertFunction(user: string) {
  const rows = await dataSource.client<Pick<greetings, 'greet_count'>[]>`
    INSERT INTO greetings(name, greet_count)
    VALUES(${user}, 1)
    ON CONFLICT(name)
    DO UPDATE SET greet_count = greetings.greet_count + 1
    RETURNING greet_count`;
  const row = rows.length > 0 ? rows[0] : undefined;
  return { user, greet_count: row?.greet_count, now: Date.now() };
}

await dataSource.runTransaction(() => insertFunction(user), { name: 'insertFunction' /*Transaction options go here*/ });
```

</TabItem>
</Tabs>

## Registering Functions

Alternatively, functions can be registered as transactions with `dataSource.registerTransaction`:

```typescript
const insertRowTransaction = dataSource.registerTransaction(insertFunction, {/*Transaction options go here*/});
```

The function wrapper returned from `dataSource.registerTransaction` has the same signature as the input function, and will automatically start a transaction with any name and transaction options provided.

## Using Decorators

Class member functions can be decorated with `@dataSource.transaction()`:

```typescript
@dataSource.transaction(/*Transaction options go here*/)
static async insertRow() {
  await dataSource.client. // Use library-specific client calls
}

@DBOS.workflow()
static async transactionWorkflow() {
  await Toolbox.insertRow()
}
```

Such methods will be run inside datasource transactions when called.

### Installing the DBOS Schema

DBOS datasources require an additional `transaction_completion` table within the `dbos` schema.  This table is used for recordkeeping, ensuring that each transaction is run exactly once.

This table can be installed by running the `initializeDBOSSchema` method of your datasource. You may do this as part of database schema migrations or at app startup. For example, here is a Knex migration file that installs the DBOS schema in Knex:

```ts
const {
  KnexDataSource
} = require('@dbos-inc/knex-datasource');

exports.up = async function(knex) {
  await KnexDataSource.initializeDBOSSchema(knex);
};

exports.down = async function(knex) {
  await KnexDataSource.uninitializeDBOSSchema(knex);
};
```
