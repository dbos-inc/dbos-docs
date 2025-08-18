---
sidebar_position: 45
title: Transactions & Datasources
---

## Introduction To Transactions And Datasources
DBOS [workflows](./workflows-steps.md#workflows) reliably execute a sequence of [steps](./workflows-steps.md#steps).  A *DBOS transaction* is a special kind of step that runs a function within a database transaction and records its return value within that transaction.   This guarantees that the transaction is executed exactly once, even in the face of retries or failures.

Different JavaScript libraries have different mechanisms for starting transactions and accessing the database. The *DBOS datasource* layer provides plugin packages for popular libraries, offering:
- Native access to each library’s database APIs
- A consistent transaction control interface
- Compile-time type safety
- Correct runtime behavior across all supported environments

## Setting Up Data Sources
Each data source is implemented in a separate package.
This package, along with its underlying database libraries, should be installed before use.

- [@dbos-inc/drizzle-datasource](https://www.npmjs.com/package/@dbos-inc/drizzle-datasource): [drizzle](https://orm.drizzle.team/)
- [@dbos-inc/knex-datasource](https://www.npmjs.com/package/@dbos-inc/knex-datasource): [Knex.js](https://knexjs.org/)
- [@dbos-inc/nodepg-datasource](https://www.npmjs.com/package/@dbos-inc/nodepg-datasource): [node-postgres](https://github.com/brianc/node-postgres)
- [@dbos-inc/postgres-datasource](https://www.npmjs.com/package/@dbos-inc/postgres-datasource): [Postgres.js](https://github.com/porsager/postgres)
- [@dbos-inc/prisma-datasource](https://www.npmjs.com/package/@dbos-inc/prisma-datasource): [Prisma](https://www.prisma.io/)
- [@dbos-inc/typeorm-datasource](https://www.npmjs.com/package/@dbos-inc/typeorm-datasource): [TypeORM](https://typeorm.io/)

### Instantiating Datasources
In general, datasources should be configured and constructed during program load, noting that they will not open any database connections until later in the initialization process.  This allows the datasource objects to be used to register transaction functions.

Configuration details vary slightly depending on the package used; Knex is shown in the example below:
```typescript
class KnexDataSource {
  /**
   * @param name - A unique name for the datasource.
   * @param config - A Knex configuration for the datasource. Passed directly into the Knex pool object.
   */
  constructor(name: string, config: Knex.Config)  
}

const config = {client: 'pg', connectionString: process.env.DBOS_DATABASE_URL}
const dataSource = new KnexDataSource('knex-ds', config);
```

Note that each datasource is given a `name` upon construction.  These names are used internally within DBOS and must be unique.

To support operation in DBOS Cloud, `DBOS_DATABASE_URL` environment varialbe should be checked within configuration to connect to the primary application database.

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

## Running Transactions

DBOS datasource transactions may be run using one of the following mechanisms:
- Directly inline in the code path, using [`runTransaction`](#datasourceruntransaction)
- Using a function wrapper returned from [`registerTransaction`](#datasourceregistertransaction)
- Using a [`@transaction`](#datasourcetransaction-decorators) decorator on a class method

While datasource transactions are generally run inside workflows, this is not strictly necessary.  Outside of a workflow, the transaction function will still execute, but execution guarantees are not provided.

### dataSource.runTransaction()

`runTransaction` allows code to be run "in line" within a datasource transaction, without pulling the code out into a separate named function.

```typescript
runTransaction<T>(
  func: () => Promise<T>,
  config?: TransactionConfig & {name?: string}
)
```

**Parameters:**
- **func**: The function to run as a transaction.
- **config**: The transaction config, described below.

**Knex Example:**

```typescript
async function workflowFunction() {
  await dataSource.runTransaction(async () => {
    await dataSource.client.raw('INSERT INTO example_table (name) VALUES (?)', ['dbos']);
  }, {name: "insertRow"});

  return await dataSource.runTransaction(async () => {
      const result = await dataSource.client.raw('SELECT COUNT(*) as count FROM example_table');
      const count = result.rows[0].count;
      return count;
    },
    {name: "countRows", readOnly: true}
  );
}
const workflow = DBOS.registerWorkflow(workflowFunction, "workflow");
```

### dataSource.registerTransaction()

A transaction function may be registered, returning a wrapper function that remembers the associated datasource and transaction configuration.  The returned function takes the same argument as the provided function, making it transparent to the caller.

```typescript
registerTransaction<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Promise<Return>,
  config?: TransactionConfig & {name?: string},
): (this: This, ...args: Args) => Promise<Return>
```

Wrap a function in a tranasction.
Returns the wrapped function.

**Parameters:**
- **func**: The function to be wrapped in a transaction.
- **config**: The transaction config, documented below.  The exact configuration type may vary depending on the datasource.

**Knex Example:**

```typescript
async function insertRowFunction() {
  await dataSource.client.raw('INSERT INTO example_table (name) VALUES (?)', ['dbos']);
}
const insertRowTransaction = dataSource.registerTransaction(insertRowFunction);

async function countRowsFunction() {
  const result = await dataSource.client.raw('SELECT COUNT(*) as count FROM example_table');
  const count = result.rows[0].count;
}
const countRowsTransaction = dataSource.registerTransaction(countRowsFunction);

async function workflowFunction() {
  await insertRowTransaction();
  await countRowsTransaction();
}
const workflow = DBOS.registerWorkflow(workflowFunction, "workflow")
```

### dataSource.transaction() Decorators

Decorators can be used on class methods to mark them as transactional steps within a workflow.

Each datasource provides a `transaction` decorator that accepts a `TransactionConfig` appropriate to the datasource.
```typescript
dataSource.transaction(
    config?: TransactionConfig
)
```

For example, the Knex `TransactionConfig` is:
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
  await dataSource.client.raw('INSERT INTO example_table (name) VALUES (?)', ['dbos']);
}

@dataSource.transaction()
static async countRows() {
  const result = await dataSource.client.raw('SELECT COUNT(*) as count FROM example_table');
  const count = result.rows[0].count;
}

@DBOS.workflow()
static async transactionWorkflow() {
  await Toolbox.insertRow()
  await Toolbox.countRows()
}
```

## Transaction Configuration
Transaction configuration varies depending on the underlying datasource package in use.  Generally, fields similar to the following are supported:
- `name`: Provides a name for the function, which will be recorded in the DBOS step record.  If not specified, the `name` will be taken from the transactions `function` object.
- `isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable'`: Allows the transaction isolation level to be set.
- `accessMode?: 'read only' | 'read write'` or `readOnly?: boolean`: Allows a read-only transaction to be requested.  Read-only transactions involve no writes to the underlying application database, but the result will be stored in the DBOS system database to allow for correct workflow behavior.
