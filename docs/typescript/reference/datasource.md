---
sidebar_position: 45
title: Transactions & Datasources
---

Transactions are a special type of step that are optimized for database accesses.
They execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction), atomically committing both user-requested changes and a DBOS checkpoint.

Transactions can be performed using _datasources_, which are special database clients that wrap operations in DBOS transactions.
Datasources are available for most popular TypeScript database clients.

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
<TabItem value="prisma" label="Prisma">

```shell
npm i @dbos-inc/prisma-datasource
```


</TabItem>
</Tabs>

## Constructing Datasources

A datasource class must be configured and constructed before use.

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">


```typescript
class KnexDataSource {
  constructor(name: string, config: Knex.Config)  
}
```

**Example:**

```typescript
const config = {client: 'pg', connection: process.env.DBOS_DATABASE_URL}
const dataSource = new KnexDataSource('knex-ds', config);
```

**Parameters:**

- **name**: A unique name for the datasource.
- **config**: A Knex configuration for the datasource. Passed directly into the Knex pool object.

</TabItem>
<TabItem value="drizzle" label="Drizzle">


</TabItem>
<TabItem value="typeorm" label="TypeORM">

</TabItem>
</Tabs>

## Datasource Transactions

### dataSource.client

Use this inside a transaction to access the datasource's transactional client.
See the examples below for syntax.

### dataSource.Transaction

```typescript
dataSource.transaction(
    config?: TransactionConfig
)
```

A decorator that marks a function as a transactional step in a durable workflow.

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```typescript
interface TransactionConfig {
  isolationLevel?: Knex.IsolationLevels;
  readOnly?: boolean;
}
```

**Parameters:**
- **config**:
  - **isolationLevel**: The Postgres isolation level of the transaction. Must be one of `read committed`, `repeatable read`, or `serializable`. Default is `serializable`.
  - **readOnly**: Whether this transaction only performs reads. Optimizes checkpointing if so.

**Example:**

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

### dataSource.registerTransaction

```typescript
registerTransaction<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Promise<Return>,
  config?: TransactionConfig,
  name?: string,
): (this: This, ...args: Args) => Promise<Return>
```

Wrap a function in a tranasction.
Returns the wrapped function.

**Parameters:**
- **func**: The function to be wrapped in a transaction.
- **config**: The transaction config, documented above.
- **name**: A name to give the transaction. If not given, use the function name.

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

**Example:**

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

### dataSource.runTransaction

```typescript
runTransaction<T>(
  func: () => Promise<T>,
  funcName: string, 
  config?: TransactionConfig
)
```

Run a function as a transaction.
Can only be called from a durable workflow.
Returns the output of the transaction.

**Parameters:**
- **func**: The function to run as a transaction.
- **funcName**: A name to give the transaction.
- **config**: The transaction config, documented above.

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

**Example:**

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