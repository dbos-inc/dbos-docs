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

If you are using TypeORM, Operon needs to know about it so that it can insert workflow status updates into the same transactions used by your applications.

Use of TypeORM is optional.  Operon supports several other libraries for transactional data management.

## Usage Overview

### Setting Up The Database Connection

### Setting Up Entities

### Setting Up The Schema

### Invoking Transactions

### Unit Testing

## TypeORM Example
