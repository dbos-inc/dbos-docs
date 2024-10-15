---
sidebar_position: 11
title: Using Drizzle
description: Learn how to build applications with Drizzle and DBOS
---

[Drizzle](https://orm.drizzle.team/) is a lightweight TypeScript ORM.
It allows developers to construct SQL queries in native TypeScript.
It also supports querying the database with [raw SQL](https://orm.drizzle.team/docs/sql).

### Getting Started

An easy way to get started with Drizzle is to bootstrap your application with our Drizzle template.
This is similar to the template used in the [quickstart](../../quickstart.md), but built with Drizzle instead of Knex.
To download it, run:

```bash
npx -y @dbos-inc/create@latest -t hello-drizzle -n <app-name>
```

Then, build it, run schema migrations, and start the sample app:

```bash
npm run build
npx dbos migrate
npx dbos start
```

To see that it's working, visit this URL in your browser: [http://localhost:3000/greeting/dbos](http://localhost:3000/greeting/dbos).  You should get this message: `Hello, dbos! We have made 1 greetings.` Each time you refresh the page, the counter should go up by one.

### Schema Management

We strongly recommend you manage your database schema using migrations.
Drizzle provides rich native migration support, with documentation [here](https://orm.drizzle.team/docs/migrations).

Drizzle can automatically generate migrations from your schema.
To use this feature, update your schema file (by default `src/schema.ts`, configurable in `drizzle.config.ts`) then run:

```
npx drizzle-kit generate --name <migration-name>
```

This will create a new migration file named `drizzle/<sequence-number>_<migration-name>.sql` that contains SQL commands to update your database schema.

To apply your migrations to your database, run:

```
npx dbos migrate
```

You can also write your own migration by running:

```bash
npx drizzle-kit generate --custom --name <migration-name>
```

This will create a new empty migration file named `drizzle/<sequence-number>_<migration-name>.sql`.
You can implement your migration in SQL in this file.


### Using Drizzle

When using DBOS, database operations are performed in [transaction functions](./transaction-tutorial). Transaction functions must be annotated with the [`@Transaction`](../reference/decorators#transaction) decorator and must have a [`TransactionContext<NodePgDatabase>`](../reference/contexts#transactioncontextt) as their first argument.
Note that we specify `NodePgDatabase` in angle brackets to use Drizzle.

Within the transaction function, access your [Drizzle client](https://orm.drizzle.team/docs/overview) from the `.client` field of your transaction context.
For example, this function inserts a new row into the `greetings` table:

```javascript
export const greetings = pgTable('greetings', {
  name: text('name'),
  note: text('note')
});

export class DBOSGreetings {
  @Transaction()
  static async insertGreeting(ctxt: TransactionContext<NodePgDatabase>, name: string, note: string) {
    await ctxt.client.insert(greetings).values({name: name, note: note});
  }
}
```

### Configuring Drizzle

:::info
If you are using the [Drizzle template](#getting-started), this configuration is done for you.
:::

To enable Drizzle, you must set the `app_db_client` field in the [DBOS configuration file](../reference/configuration.md) to `drizzle`.
You should also configure Drizzle migration commands.
Here is an example of a configuration file set up for Drizzle:

```yaml
language: node
database:
  hostname: localhost
  port: 5432
  username: postgres
  password: ${PGPASSWORD}
  app_db_name: dbos_hello_app
  connectionTimeoutMillis: 3000
  app_db_client: drizzle
  migrate:
    - npx drizzle-kit migrate
runtimeConfig:
  entrypoints:
    - dist/operations.js
```

Many Drizzle commands, such as those for [schema migration](#schema-management), require a [`drizzle.config.ts`](https://orm.drizzle.team/kit-docs/conf) configuration file.
To avoid managing your configuration in two places, we recommend `drizzle.config.ts` load configuration information from your [DBOS configuration file](../reference/configuration.md).
Here is an example of a `drizzle.config.ts` that does this:

```typescript
import { defineConfig } from 'drizzle-kit';

const { parseConfigFile } = require('@dbos-inc/dbos-sdk');

const [dbosConfig, ] = parseConfigFile();

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: dbosConfig.poolConfig.host,
    port: dbosConfig.poolConfig.port,
    user: dbosConfig.poolConfig.user,
    password: dbosConfig.poolConfig.password,
    database: dbosConfig.poolConfig.database,
    ssl: dbosConfig.poolConfig.ssl,
  },
});
```
