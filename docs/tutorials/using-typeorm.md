---
sidebar_position: 8
title: Using TypeORM
description: Learn how to create and register TypeORM entities and perform transactional updates
---

[TypeORM](https://typeorm.io) is an ORM for TypeScript.  It is based on the idea of creating [`Entity`](https://typeorm.io/entities) classes to represent each database table, with the persistent and join key fields marked with [decorators](https://typeorm.io/decorator-reference).

# Using TypeORM
-   [TypeORM Overview](#typeorm-overview)
-   [Usage Overview](#usage-overview)
    -   [Setting Up The Database Connection](#setting-up-the-database-connection)
    -   [Setting Up Entities](#setting-up-entities)
    -   [Setting Up The Schema](#setting-up-the-schema)
    -   [Invoking Transactions](#invoking-transactions)
    -   [Unit Testing](#unit-testing)
-   [TypeORM Example](#typeorm-example)

## TypeORM Overview
[TypeORM](https://typeorm.io) is an ORM for TypeScript.  It is based on the idea of creating [`Entity`](https://typeorm.io/entities) classes to represent each database table, with the persistent and join key fields marked with [decorators](https://typeorm.io/decorator-reference).  Once entity classes are defined, TypeORM provides methods for storing, updating, and querying the entities via the [`EntityManager`](https://typeorm.io/working-with-entity-manager).  TypeORM can also be used to create and maintain the database schema.

If you are using TypeORM, Operon needs to know about it so that it can insert workflow status updates into the same transactions used by the application code.

Use of TypeORM is optional.  Operon supports several other libraries for transactional data management.

## Usage Overview
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

/**
 * Funtions used in tests.
 */
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
class KVController {
}
```

### Setting Up The Schema

### Invoking Transactions

### Unit Testing

## TypeORM Example
