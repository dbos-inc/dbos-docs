---
sidebar_position: 12
title: Using Prisma
description: Learn how to use Prisma schema and perform transactional updates
---

## Prisma Overview
[Prisma](https://www.prisma.io/) is a popular open-source TypeScript ORM.
The main idea is to use [Prisma Schema](https://www.prisma.io/docs/orm/prisma-schema/overview) to define your application data models (entities).
Based on the schema definition, you can use Prisma to automatically generate [schema migrations](https://www.prisma.io/docs/orm/prisma-migrate/getting-started) as well as the corresponding [Prisma Client](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction) for you to manage your data.
DBOS supports Prisma as an alternative to [Knex](https://knexjs.org/) and [TypeORM](https://typeorm.io) for transactional data management.

## Usage
DBOS supports essentially direct use of Prisma, but a few additional steps are necessary to generate schema migrations and the client, and use a transaction in the context of a workflow.

### Getting Started

An easy way to get started with Prisma is to bootstrap your application with our Prisma template.
This is similar to the template used in the [quickstart](../getting-started/quickstart.md), but built with Prisma instead of Knex.
To download it, run:

```bash
npx -y @dbos-inc/create@latest -t hello-prisma -n <app-name>
```

Then, build it, run schema migrations, and start the Prisma sample app:

```bash
npm run build
npx dbos migrate
npx dbos start
```

To see that it's working, visit this URL in your browser: [http://localhost:3000/greeting/dbos](http://localhost:3000/greeting/dbos).  You should get this message: `Greeting 1: Hello, dbos!` Each time you refresh the page, the counter should go up by one.

### Setting Up Prisma Schema

In DBOS, Prisma Schema by default is located at `./prisma/schema.prisma` and is defined in [the same way as any other Prisma project](https://www.prisma.io/docs/orm/prisma-schema/overview), for example:

```javascript
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model DbosHello {
  @@map("dbos_hello")
  greeting_id Int @id @default(autoincrement())
  greeting String
}
```

Note that the schema file requires a `$DATABASE_URL` environment variable to connect to a database. To make it easy, we include in our template a script to automatically generate a `.env` file under the `./prisma` folder with the correct database URL constructed from your `dbos-config.yaml` file, please see the [document below](#configuring-prisma).


### Schema Management

In production scenarios or when using DBOS Cloud, we strongly recommend you manage your database schema using migrations.
[Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate/getting-started) provides plenty of support for generating and managing migrations.

To update your database schema, you first need to edit your Prisma schema (the `./prisma/schema.prisma` file), and then [create a new migration](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-dev) by running:


```bash
npx prisma migrate dev --name <migration_name>
```

This automatically generates a new migration (under `./prisma/migrations/`) containing SQL commands to transition your database from its current schema to the schema defined in your latest Prisma schema.

### Invoking Transactions
In Prisma, to execute application logic in a transaction is to pass it in as an async callback function. This allows the framework to ensure that the transaction is opened and closed properly, and to ensure that all statements run on the same connection from the connection pool.

DBOS provides a wrapper around Prisma's [interactive transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#interactive-transactions) functionality so that its workflow state can be kept consistent with the application database.

First, DBOS transactions are declared.  The easiest way is with a class method decorated with [`@Transaction`](../api-reference/decorators.md#transaction), and the first argument will be a [`TransactionContext`](../api-reference/contexts.md#transactioncontextt) with `PrismaClient` as the client type inside. Note that the `PrismaClient` is the generated client based on your schema.

```javascript
import { PrismaClient } from "@prisma/client";

export class Hello {
  @Transaction()
  static async helloTransaction(txnCtxt: TransactionContext<PrismaClient>, name: string)  {
    const greeting = `Hello, ${name}!`;
    const res = await txnCtxt.client.dbosHello.create({
      data: {
        greeting: greeting,
      },
    });
    return `Greeting ${res.greeting_id}: ${greeting}`;
  }
}
```

If preferred, it is possible to define a `type` to clean up the transaction method prototypes a little bit.
```javascript
type PrismaTransactionContext = TransactionContext<PrismaClient>;
```

### Configuring Prisma

:::info
If you are using the [Prisma template](#getting-started), this is done for you.
:::

To enable Prisma, you must set the `app_db_client` field in the [DBOS configuration file](../api-reference/configuration.md) to `prisma`.
You should also configure Prisma migration commands.
Here is an example of a configuration file set up for Prisma:

```yaml
database:
  hostname: 'localhost'
  port: 5432
  username: 'postgres'
  app_db_name: 'hello_prisma'
  password: ${PGPASSWORD}
  connectionTimeoutMillis: 3000
  app_db_client: prisma
  migrate:
    - npx prisma migrate deploy
```

:::info
Prisma doesn't [support migration rollback](https://github.com/prisma/prisma/discussions/4617) for successfully applied migrations like other ORMs.
Therefore, we omit the `rollback` configuration here.
To rollback a migration, please revert changes to your Prisma schema and generate a new migration from it.
:::

Many Prisma commands, such as those for [schema migrations](#schema-management), require a `DATABASE_URL` environment variable to be correctly set.
To avoid managing your configuration in two places, we recommend using this script to automatically generate a `./prisma/.env` file with the correct `DATABASE_URL` string constructed from your DBOS config:

```javascript title="generate_env.js"
const { parseConfigFile } = require('@dbos-inc/dbos-sdk/dist/src/dbos-runtime/config');
const fs = require('node:fs');
const path = require('node:path');

// Load the configuration file
const [dbosConfig, ] = parseConfigFile();

// Write out the .env file
const databaseURL = `postgresql://${dbosConfig.poolConfig.user}:${dbosConfig.poolConfig.password}@${dbosConfig.poolConfig.host}:${dbosConfig.poolConfig.port}/${dbosConfig.poolConfig.database}`;

try {
  fs.writeFileSync(path.join(process.cwd(), 'prisma', '.env'), `DATABASE_URL="${databaseURL}"`);
  console.log("Wrote database URL to the prisma/.env file.");
} catch (error) {
  console.error("Error writing prisma/.env file:", error.message);
}
```

You also need to generate a [Prisma Client](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction) from your Prisma schema before compiling your application.
Therefore, we recommend that you set the build script in your `package.json` file as follows:
```js title="package.json"
{
  "scripts": {
    "build": "node generate_env.js && npx prisma generate && tsc"
  }
}
```