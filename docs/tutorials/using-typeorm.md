---
sidebar_position: 11
title: Using TypeORM
description: Learn how to create and register TypeORM entities and perform transactional updates
---

## TypeORM Overview
[TypeORM](https://typeorm.io) is an ORM for TypeScript.  It is based on the idea of creating [`Entity`](https://typeorm.io/entities) classes to represent each database table, with the persistent and join key fields marked with [decorators](https://typeorm.io/decorator-reference).  Once entity classes are defined, TypeORM provides methods for storing, updating, and querying the entities via the [`EntityManager`](https://typeorm.io/working-with-entity-manager).  TypeORM can also be used to create and maintain the database schema.

If you are using TypeORM, Operon needs to know about it for inserting workflow status updates along the transactions used for application code.

Use of TypeORM is optional.  Operon supports several other libraries for transactional data management.

## Usage
Operon supports what is essentially direct use of TypeORM, but a few additional steps are necessary to inform Operon about the TypeORM entity list, provide the information for establishing the database connection, and use a transaction in the context of a workflow.

### Setting Up The Database Connection
In order to set up the database connection ([`DataSource`](https://typeorm.io/data-source)), configuration information is provided to Operon instead of creating a separate configuration file or instantiating `DataSource` directly.  Of particular interest is the line `user_dbclient: 'typeorm'`, which indicates that TypeORM is to be loaded and a `DataSource` configured.

```yaml
database:
  hostname: ${POSTGRES_HOST}
  port: ${POSTGRES_PORT}
  username: ${POSTGRES_USERNAME}
  password: ${POSTGRES_PASSWORD}
  user_database: ${POSTGRES_DATABASE}
  system_database: 'opsys'
  connectionTimeoutMillis: 3000
  user_dbclient: 'typeorm'
```

### Setting Up Entities

In Operon, TypeORM entities are [defined in the same way as any other TypeORM project](https://typeorm.io/entities), for example:

```typescript
import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class KV {
  @PrimaryColumn()
  id: string = "t";

  @Column()
  value: string = "v";
}
```

Operon handles the entity registration that would otherwise be done in a TypeORM `DataSource` instantiation or configuration file.  To make Operon aware of the entities, a class-level decorator is used on each class containing Operon transaction methods:
```typescript
@OrmEntities([KV])
class KVOperations {
}
```

### Setting Up The Schema
TypeORM can use the entity classes to create/migrate (synchronize) and drop the database schema.  (This behavior is optional, for those hesitating to use such automation in production scenarios.)

This may be invoked from an Operon user database instance:
```
  await operon.userDatabase.createSchema();
  await operon.userDatabase.dropSchema();
```

Or from the [testing runtime](..):
```typescript
    await testRuntime.dropUserSchema();
    await testRuntime.createUserSchema();
```

Additional options for triggering schema migration during the application deployment process are forthcoming.

### Invoking Transactions
In TypeORM (and many other frameworks), the pattern is to run [transactions](https://typeorm.io/transactions) as callback functions.  (This allows the framework to ensure that the transaction is opened and closed properly, and to ensure that all statements run on the same connection from the connection pool.)

Operon provides a wrapper around TypeORM's transaction functionality so that its workflow state can be kept consistent with the application database.

First, Operon transactions are declared.  The easiest way is with a class method decorated with [`@OperonTransaction`](../api-reference/decorators.md#operontransaction), and the first argument will be an Operon [`TransactionContext`](../api-reference/contexts.md#transactioncontext) with an `EntityManager` named `client` inside.

```typescript
@OrmEntities([KV])
class KVOperations {
  @OperonTransaction()
  static async writeTxn(txnCtxt: TransactionContext<EntityManager>, id: string, value: string) {
    const kv: KV = new KV();
    kv.id = id;
    kv.value = value;
    const res = await txnCtxt.client.save(kv);
    return res.id;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  @OperonTransaction({ readOnly: true })
  static async readTxn(txnCtxt: TransactionContext<EntityManager>, id: string) {
    const kvp = await txnCtxt.client.findOneBy(KV, {id: id});
    return kvp?.value || "<Not Found>";
  }
}
```

If preferred, it is possible to define a `type` to clean up the transaction method prototypes a little bit.
```typescript
type TypeORMTransactionContext = TransactionContext<EntityManager>;
```

### Unit Testing
TODO: A TypeORM test using the test runtime

## TypeORM Example
The YKY social network example uses TypeORM.
