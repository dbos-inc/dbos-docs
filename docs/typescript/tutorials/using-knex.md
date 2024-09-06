---
sidebar_position: 12
title: Using Knex
description: Learn how to build applications with Knex and DBOS
---

## Knex Overview
[Knex](https://knexjs.org/) is a popular TypeScript query builder.
It allows developers to construct SQL queries in native TypeScript.
It also supports querying the database with [raw SQL](https://knexjs.org/guide/raw.html).

### Getting Started

The default DBOS template application, used in the [quickstart](../../quickstart.md) uses Knex.
To download it, run:

```bash
npx -y @dbos-inc/create@latest -t hello -n <app-name>
```

Then, build it, run schema migrations, and start the sample app:

```bash
npm run build
npx dbos migrate
npx dbos start
```

To see that it's working, visit this URL in your browser: [http://localhost:3000/greeting/dbos](http://localhost:3000/greeting/dbos).  You should get this message: `Hello, dbos! You have been greeted 1 times.` Each time you refresh the page, the counter should go up by one.

### Schema Management

We strongly recommend you manage your database schema using migrations.
Knex provides rich native migration support, with documentation [here](https://knexjs.org/guide/migrations.html).

You can create a new migration by running:

```bash
npx knex migrate:make <migration-name>
```

This will create a new migration file named `migrations/<timestamp>_<migration-name>.js`.
You can implement your migration in this file.
Here is a simple example from the [programming guide](../programming-guide.md) of a migration that creates a `greetings` table with `name` and `note` text fields:

```javascript
exports.up = function(knex) {
    return knex.schema.createTable('greetings', table => {
        table.text('name');
        table.text('note');
      });
};


exports.down = function(knex) {
    return knex.schema.dropTable('greetings');
};

```

To run your migrations forward, run:

```
npx dbos migrate
```

### Using Knex

When using DBOS, database operations are performed in [transaction functions](./transaction-tutorial). Transaction functions must be annotated with the [`@Transaction`](../reference/decorators#transaction) decorator and must have a [`TransactionContext<Knex>`](../reference/contexts#transactioncontextt) as their first argument.
Note that we specify `Knex` in angle brackets.

Within the transaction function, access your [Knex client](https://knexjs.org/guide/query-builder.html) from the `.client` field of your transaction context.
For example, this function inserts a new row into the `greetings` table:

```javascript
export class Greetings {
  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {
    await ctxt.client('greetings').insert({
      name: friend,
      note: note
    });
  }
}
```

DBOS supports the full [Knex Postgres API](https://knexjs.org/guide/query-builder.html), but doesn't allow manually committing or aborting transactions.
Instead, transactions automatically commit when the function successfully returns and abort and roll back if the function throws an exception.

### Configuring Knex

:::info
If you are using the [Knex template](#getting-started), this is done for you.
:::

To enable Knex, you must set the `app_db_client` field in the [DBOS configuration file](../reference/configuration.md) to `knex`.
You should also configure Knex migration commands.
Here is an example of a configuration file set up for Knex:

```yaml
language: node
database:
  hostname: localhost
  port: 5432
  username: postgres
  password: ${PGPASSWORD}
  app_db_name: hello
  app_db_client: knex
  migrate:
    - npx knex migrate:latest
  rollback:
    - npx knex migrate:rollback
runtimeConfig:
  entrypoints:
    - dist/operations.js
```

Many Knex commands, such as those for [schema migration](#schema-management), require a [`knexfile.js`](https://knexjs.org/guide/migrations.html#knexfile-js) configuration file.
To avoid managing your configuration in two places, we recommend `knexfile.js` load configuration information from your [DBOS configuration file](../reference/configuration.md).
Here is an example of a `knexfile.js` that does this:

```typescript
const { parseConfigFile } = require('@dbos-inc/dbos-sdk');

const [dbosConfig, ] = parseConfigFile();

const config = {
  client: 'pg',
  connection: {
    host: dbosConfig.poolConfig.host,
    port: dbosConfig.poolConfig.port,
    user: dbosConfig.poolConfig.user,
    password: dbosConfig.poolConfig.password,
    database: dbosConfig.poolConfig.database,
    ssl: dbosConfig.poolConfig.ssl,
  },
  migrations: {
    directory: './migrations'
  }
};

module.exports = config;

```
