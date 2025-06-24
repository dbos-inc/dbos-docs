---
sidebar_position: 30
title: Transactions & Datasources
description: Learn how to perform database operations
---

Transactions are a special type of step that are optimized for database accesses.
They execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction), atomically committing both user-requested changes and a DBOS checkpoint.

Transactions can be performed using _datasources_, which are special database clients that wrap operations in DBOS transactions.
Datasources are available for most popular TypeScript database clients.
Each datasource provides the same interface as its underlying client.
For example, a Knex datasource provides a Knex client and a Drizzle datasource a Drizzle client.
Therefore, you don't have to change your database operations to run a function as a DBOS transaction&mdash;just use the datasource client.

## Installing Data Sources

Each datasource is implemented in its own package, which must be installed before use.

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```shell
npm i @dbos-inc/knex-datasource
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
</Tabs>

## Using Datasources

Before using a datasource, you must configure and construct it:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">


```typescript
const config = {client: 'pg', connection: process.env.DBOS_DATABASE_URL}
const dataSource = new KnexDataSource('knex-ds', config);
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">


</TabItem>
<TabItem value="typeorm" label="TypeORM">

</TabItem>
</Tabs>


You can run a function as a transaction using `dataSource.runTransaction`.
The transaction should use `dataSource.client` as a client to access the database. For example:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```typescript
async function insertRow() {
  await KnexDataSource.client.raw('INSERT INTO example_table (name) VALUES (?)', ['dbos']);
}

async function countRows() {
  const result = await KnexDataSource.client.raw('SELECT COUNT(*) as count FROM example_table');
  const count = result.rows[0].count;
}

async function workflowFunction() {
  await dataSource.runTransaction(() => insertRow(), "insertRow")
  await dataSource.runTransaction(() => countRows(), "countRows")
}
const workflow = DBOS.registerWorkflow(workflowFunction, "workflow")
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">


</TabItem>
<TabItem value="typeorm" label="TypeORM">

</TabItem>
</Tabs>

Alternatively, functions can be registered as transactions with `dataSource.registerTransaction`:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```typescript
async function insertRowFunction() {
  await KnexDataSource.client.raw('INSERT INTO example_table (name) VALUES (?)', ['dbos']);
}
const insertRowTransaction = dataSource.registerTransaction(insertRowFunction);

async function countRowsFunction() {
  const result = await KnexDataSource.client.raw('SELECT COUNT(*) as count FROM example_table');
  const count = result.rows[0].count;
}
const countRowsTransaction = dataSource.registerTransaction(countRowsFunction);

async function workflowFunction() {
  await insertRowTransaction();
  await countRowsTransaction();
}
const workflow = DBOS.registerWorkflow(workflowFunction, "workflow")
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">


</TabItem>
<TabItem value="typeorm" label="TypeORM">

</TabItem>
</Tabs>

Or functions can be decorated with `@dataSource.transaction()`:

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">


```typescript
@dataSource.transaction()
  static async insertRow() {
  await KnexDataSource.client.raw('INSERT INTO example_table (name) VALUES (?)', ['dbos']);
}

@dataSource.transaction()
static async countRows() {
  const result = await KnexDataSource.client.raw('SELECT COUNT(*) as count FROM example_table');
  const count = result.rows[0].count;
}

@DBOS.workflow()
static async transactionWorkflow() {
  await Toolbox.insertRow()
  await Toolbox.countRows()
}
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">


</TabItem>
<TabItem value="typeorm" label="TypeORM">

</TabItem>
</Tabs>