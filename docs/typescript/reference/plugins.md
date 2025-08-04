---
sidebar_position: 200
title: DBOS Plugin Architecture
---

# DBOS Plugin Architecture

DBOS Transact for TypeScript currently provides two explicit extension mechanisms:
* [Datasources](#datasources) integrate database clients, ORMs, or other resouces with DBOS transaction lifecycle management.
* [External Event Receivers](#event-receivers) generally integrate event receivers (pollers, inbound sockets, timers, etc.) with the DBOS lifecycle, and initate workflows upon received events.

## Datasources

### Method Of Operation

The principle behind DBOS datasources is that DBOS and the datasource work together to execute user functions in a checkpointed, transactional context.
1. User calls a transaction function (which may or may not be registered).  Generally, this call is made to the datasource object, as it provides full type checking for the transaction configuration.
2. DBOS runs its step wrapper first, consulting the system database, and skipping the step if it has already run.
3. If the step should be run, DBOS calls the datasource to start a transaction.
4. The datasource starts a transaction and calls the user function, making the transactional datasource client available to that function via context.
5. Upon completion of the user routine, the datasource generally writes its own completion checkpoint before ending the transaction.  Including this checkpoint in the transaction ensures exactly-once processing of the transaction.
6. Control returns to the DBOS step wrapper, which writes the step result to its system database and emits tracing information.
7. The transaction's result is returned to the user.

### Key Interfaces

Datasource integration is based on 3 key interfaces:
 - `DBOSDataSource`: User-facing datasource API.  Part interface and part guideline, this is technically just a suggestion, but following it ensures a consistent developer experience across datasources.
 - `DataSourceTransactionHandler`: This interface is provided by the datasource to DBOS, so that DBOS can control transaction scope.
 - `@dbos-inc/dbos-sdk/datasource`: Exports from this submodule are used by datasources to do register themselves and initiate transactions.

#### `DBOSDataSource`

#### `DataSourceTransactionHandler`

#### `@dbos-inc/dbos-sdk/datasource`

### Datasource Examples
The best examples are found in the DBOS [github repository](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages).  Datasource package names end with `-datasource`, such as [`knex-datasource`](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/knex-datasource)

## Event Receivers

### Overview
Event receivers are constructed and associated with functions and methods
Information is collected, but no actions are taken until launch
Upon launch, the event receiver finds its methods and connects them to the event sources
Event receiver calls functions as appropriate

### Lifecycle

### Associating Information With Classes, Methods, And Parameters

### Finding Registered Methods

### Event Receiver Examples
The best examples are found in the DBOS [github repository](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages).  Event receiver names end with `-receive` or `-serve`, such as [`kafkajs-receive`](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/kafkajs-receive) and [`koa-serve`](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/koa-serve)
