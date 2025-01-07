---
sidebar_position: 15
title: Using TypeORM
description: Learn how to create and register TypeORM entities and perform transactional updates
---

## TypeORM Overview
[TypeORM](https://typeorm.io) is a popular TypeScript ORM.
It is based on the idea of creating [`Entity`](https://typeorm.io/entities) classes to represent each database table, with the persistent and join key fields marked with [decorators](https://typeorm.io/decorator-reference).
Once entity classes are defined, TypeORM provides methods for storing, updating, and querying the entities via the [`EntityManager`](https://typeorm.io/working-with-entity-manager).
DBOS supports TypeORM as an alternative to [Knex](https://knexjs.org/) for transactional data management.

## Usage
DBOS supports essentially direct use of TypeORM, but a few additional steps are necessary to inform DBOS about the TypeORM entity list, manage database schemas, and use a transaction in the context of a workflow.

### Getting Started

An easy way to get started with TypeORM is to bootstrap your application with the TypeORM template.
To download it, run:

```bash
npx -y @dbos-inc/create@latest -t hello-typeorm -n <app-name>
```

Then, build it, run schema migrations, and start the TypeORM sample app:

```bash
npm run build
npx dbos migrate
npx dbos start
```

To see that it's working, visit this URL in your browser: [http://localhost:3000/greeting/dbos](http://localhost:3000/greeting/dbos).  You should get this message: `Greeting 1: Hello, dbos!` Each time you refresh the page, the counter should go up by one.

### Setting Up Entities

In DBOS, TypeORM entities are [defined in the same way as any other TypeORM project](https://typeorm.io/entities), for example:

```javascript
import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class KV {
  @PrimaryColumn()
  id: string = "t";

  @Column()
  value: string = "v";
}
```

DBOS handles the entity registration that would otherwise be done in a TypeORM `DataSource` instantiation or configuration file.  To make DBOS aware of the entities, a class-level decorator is used on each class containing DBOS transaction methods:
```javascript
@OrmEntities([KV])
class KVOperations {
}
```

### Schema Management

In production scenarios or when using DBOS Cloud, we strongly recommend you manage your database schema using migrations.
TypeORM provides rich native migration support, with documentation [here](https://typeorm.io/migrations).

You can [create a new migration](https://typeorm.io/migrations#creating-a-new-migration) by running:

```bash
npx typeorm migration:create migrations/<migration-name>
```

TypeORM can also [automatically generate migration files from changes to your entity files](https://typeorm.io/migrations#generating-migrations).
This requires a TypeORM datasource file, which is included in our template and [documented below](#configuring-typeorm).

```bash
npx typeorm migration:generate -d dist/datasource.js migrations/<migration-name>
```

This automatically generates a migration file containing commands to transition your database from its current schema to the schema defined in your entity files.

### Invoking Transactions
In TypeORM (and many other frameworks), the pattern is to run [transactions](https://typeorm.io/transactions) as callback functions.  (This allows the framework to ensure that the transaction is opened and closed properly, and to ensure that all statements run on the same connection from the connection pool.)

DBOS provides a wrapper around TypeORM's transaction functionality so that its workflow state can be kept consistent with the application database.

First, DBOS transactions are declared.  The easiest way is with a class method decorated with [`@DBOS.transaction`](../../reference/transactapi/dbos-class#dbostransaction).  `DBOS.typeORMClient` can then be used to access the database using TypeORM.  For the best results with type checking and tab completion, `DBOS.typeORMClient` should be cast to `EntityManager`.

```javascript
function getClient() {return DBOS.typeORMClient as EntityManager;}

@OrmEntities([KV])
class KVOperations {
  @DBOS.transaction()
  static async writeTxn(id: string, value: string) {
    const kv: KV = new KV();
    kv.id = id;
    kv.value = value;
    const res = await getClient().save(kv);
    return res.id;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  @DBOS.transaction({ readOnly: true })
  static async readTxn(id: string) {
    const kvp = await getClient().findOneBy(KV, {id: id});
    return kvp?.value || "<Not Found>";
  }
}
```

### Configuring TypeORM

:::info
If you are using the [TypeORM template](#getting-started), this is done for you.
:::

To enable TypeORM, you must set the `app_db_client` field in the [DBOS configuration file](../../reference/configuration.md) to `typeorm`.
You should also configure TypeORM migration commands.
Here is an example of a configuration file set up for TypeORM:

```yaml
language: node
database:
  hostname: 'localhost'
  port: 5432
  username: 'postgres'
  password: ${PGPASSWORD}
  connectionTimeoutMillis: 3000
  app_db_client: typeorm
  migrate:
    - npx typeorm migration:run -d dist/datasource.js
  rollback:
    - npx typeorm migration:revert -d dist/datasource.js
runtimeConfig:
  entrypoints:
    - dist/src/operations.js
```

Many TypeORM commands, such as those for [schema migration](#schema-management), require a TypeORM datasource file.
To avoid managing your configuration in two places, we recommend this file use your DBOS configuration file as a source.
Here is an example of a datasource file that does this:

```typescript
import { parseConfigFile } from '@dbos-inc/dbos-sdk/dist/src/dbos-runtime/config';
import { TlsOptions } from 'tls';
import { DataSource } from "typeorm";

const [dbosConfig, ] = parseConfigFile();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: dbosConfig.poolConfig.host,
    port: dbosConfig.poolConfig.port,
    username: dbosConfig.poolConfig.user,
    password: dbosConfig.poolConfig.password as string,
    database: dbosConfig.poolConfig.database,
    ssl: dbosConfig.poolConfig.ssl as TlsOptions,
    entities: ['dist/entities/*.js'],
    migrations: ['dist/migrations/*.js'],
});

AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err);
    });

export default AppDataSource;
```

When referencing this file in commands, use the compiled JavaScript (`dist/datasource.js`) instead of the original TypeScript source (`datasource.ts`).
