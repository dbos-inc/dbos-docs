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
In general, each data source is implemented in a separate package.  This package, along with its underlying database libraries, should be installed before use.
-[@dbos-inc/drizzle-datasource](https://www.npmjs.com/package/@dbos-inc/drizzle-datasource): [drizzle](https://orm.drizzle.team/)
-[@dbos-inc/knex-datasource](https://www.npmjs.com/package/@dbos-inc/knex-datasource): [Knex.js](https://knexjs.org/)
-[@dbos-inc/nodepg-datasource](https://www.npmjs.com/package/@dbos-inc/nodepg-datasource): [node-postgres](https://github.com/brianc/node-postgres)
-[@dbos-inc/postgres-datasource](https://www.npmjs.com/package/@dbos-inc/postgres-datasource): [Postgres.js](https://github.com/porsager/postgres)
-[@dbos-inc/prisma-datasource](https://www.npmjs.com/package/@dbos-inc/prisma-datasource): [Prisma](https://www.prisma.io/)
-[@dbos-inc/typeorm-datasource](https://www.npmjs.com/package/@dbos-inc/typeorm-datasource): [TypeORM](https://typeorm.io/)

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

const config = {client: 'pg', connection: process.env.DBOS_DATABASE_URL}
const dataSource = new KnexDataSource('knex-ds', config);
```

Note that each datasource is given a `name` upon construction.  These names are used internally within DBOS and must be unique.

To support operation in DBOS Cloud, `DBOS_DATABASE_URL` environment varialbe should be checked within configuration to connect to the primary application database.

### Schema Migration

Schema setup is outside of the scope of DBOS.  You may use the same library to manage your schema, or a different one.  DBOS Cloud does offer a [configuration option to run your schema migration commands](../../production/dbos-cloud/database-management.md#database-schema-management).

To support operation in DBOS Cloud, `DBOS_DATABASE_URL` environment varialbe should be used within migrations to connect to the primary application database.

### Installing the DBOS Schema

DBOS datasources generally require an additional `transaction_completion` table within the `dbos` schema.  This table is used for recordkeeping, ensuring that each transaction is run once.  This table can be added manually, via a schema migration in your favorite tool, by your DBA, etc.

```sql
CREATE SCHEMA IF NOT EXISTS dbos;

CREATE TABLE IF NOT EXISTS dbos.transaction_completion (
    workflow_id TEXT NOT NULL,
    function_num INT NOT NULL,
    output TEXT,
    error TEXT,
    created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now())*1000)::bigint,
    PRIMARY KEY (workflow_id, function_num)
);
```

## Running Transactions

DBOS datasource transactions may be run using one of the following mechanisms:
- Directly inline in the code path, using [`runTransaction`](#datasourceruntransaction)
- Using a function wrapper returned from [`registerTransaction`](#datasourceregistertransaction)
- Using a [`@transaction`](#datasourcetransaction-decorators) decorator on a class method

While datasource transactions are generally run inside workflows, this is not strictly necessary.  Outside of a workflow, the transaction function will still execute, but execution guarantees are not provided.

### dataSource.runTransaction()

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

### dataSource.registerTransaction()

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

### dataSource.transaction() Decorators

```typescript
dataSource.transaction(
    config?: TransactionConfig
)
```

A decorator that marks a function as a transactional step in a durable workflow.

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

## Transaction configuration

## Standard API for data sources

## Creating New Datasource Packages

Additional datasources can be implemented by following the [interface](https://github.com/dbos-inc/dbos-transact-ts/blob/main/src/datasource.ts) and using the [existing packages](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages) as examples.

Please reach out to DBOS on GitHub or Discord if you have questions or suggestions.
