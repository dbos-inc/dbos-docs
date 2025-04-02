---
sidebar_position: 80
title: Stored Procedures
description: Learn how to improve database interaction performance with Stored Procedures
---

In this guide, you'll learn how to interact with your database using stored procedures.

Stored procedures are similar to [transaction functions](./transaction-tutorial.md). 
They are used to perform operations on your application database.
However, stored procedure functions run inside the database where transaction functions run on the application server. 
Running your business logic inside the database improves both performance and scalability. 
Transaction functions require at least three network round trips to the database in addition to any queries executed by the transaction function itself.
Stored procedure functions only require a single network round trip to the database, while still providing the same behavior and guarantees as transaction functions.

While most database management systems provide support for stored procedures, they are often avoided because they are hard to use.
They typically need to be written in a custom language such as [PL/pgSQL](https://www.postgresql.org/docs/current/plpgsql.html).
Additionally, they are not usually integrated into the application development process.
DBOS stored procedure functions, in contrast, are written in TypeScript like the rest of your DBOS application.
The [DBOS Compiler](../reference/tools/dbos-compiler.md) deploys the stored procedure functions from your application to your application database.

Here's an example of a stored procedure function.
You'll notice it is similar to the [example transaction function](./transaction-tutorial.md) from the transaction tutorial. 

:::warning
Because stored procedures run inside the database, only raw database queries are supported. 
Query builders like [Knex.js](https://knexjs.org/) and ORMs like [TypeORM](./orms/using-typeorm.md) and [Prisma](./orms/using-prisma.md) are not supported in stored procedure functions.
:::

```javascript
export class Greetings {
  @StoredProcedure()
  static async InsertGreeting(ctxt: StoredProcedureContext, friend: string, note: string) {
    await ctxt.query('INSERT INTO greetings (name, note) VALUES ($1, $2)', [friend, note]);
  }
}
```

## Deploying DBOS Stored Procedures

DBOS Stored procedure functions depend on [PLV8](https://plv8.github.io/), a trusted JavaScript language extension for PostgresSQL. 
PLV8 is supported out of the box on DBOS Cloud and several major cloud database providers.
For running locally, we recommend using the [`sibedge/postgres-plv8` Docker image](https://plv8.com) provided by [Sibedge](https://sibedge.com/).
For using DBOS Stored Procedures on your own PostgreSQL server, please see the [official PLV8 documentation](https://plv8.github.io/#building) for installation instructions.

:::info
As of version 1.17, the [@dbos-inc/create](../reference/tools/cli#npx-dbos-inccreate) templates have been updated to use `sibedge/postgres-plv8` in the `start_postgres_docker.js` script.
Older DBOS applications using Docker will need to switch their PostgreSQL image from `postgres:16.1` to `sibedge/postgres-plv8` manually to support Stored Procedures.
:::

Before running your DBOS application that uses stored procedures, you need to deploy those stored procedures to the database.
To deploy your stored procedure functions to the database, you need the [DBOS Compiler](../reference/tools/dbos-compiler.md). 
Add the DBOS Compiler package as a devDependency of your app via NPM:

```
npm install --save-dev @dbos-inc/dbos-compiler
```

Once the DBOS Compiler is installed, you can use it to deploy the stored procedures to the database server specified 
in the [`dbos-config.yaml` file](../reference/configuration.md) with the following command:

```
npx dbosc deploy
```

:::info
For information about all of the compiler's command line options, please see the [DBOS Compiler reference page](../reference/tools/dbos-compiler.md)
:::

You can add `npx dbosc deploy` to your [database migration commands](../reference/configuration.md#database-section) to run it alongside other schema migrations.
Deploying your app's stored procedures via Database Schema Management is required for DBOS Cloud deployment.

```yaml
database:
  migrate:
    - npx knex migrate:latest
    - npx dbosc deploy
```
