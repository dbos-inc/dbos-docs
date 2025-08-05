---
sidebar_position: 200
title: DBOS Plugin Architecture
---

# DBOS Plugin Architecture

DBOS Transact for TypeScript currently provides two explicit extension mechanisms:
* [Datasources](#datasources) integrate database clients, ORMs, or other resouces with the DBOS lifecycle and transaction functions.
* [External Event Receivers](#event-receivers) integrate event receivers (pollers, inbound sockets, timers, etc.) with the DBOS lifecycle, and initate workflow functions upon receiving events.

## Datasources

### Method Of Operation

The principle behind DBOS datasources is that DBOS and the datasource work together to execut functions in a checkpointed, transactional context.
1. App code calls a transaction function (which may or may not be registered in advance).  Generally, this call is made to the datasource instance, as it provides full type checking for the transaction configuration.
2. DBOS runs its step wrapper first, consulting the system database, and skipping the step if it has already run.
3. If the step should be run, DBOS calls the datasource to start a transaction.
4. The datasource starts a transaction and calls the app's function, making the transactional datasource client available to that function via context.
5. Upon completion of the function, the datasource generally writes its own completion checkpoint before ending the transaction.  Including this checkpoint in the transaction ensures exactly-once processing of the transaction.
6. Control returns to the DBOS step wrapper, which writes the step result to its system database and emits tracing information.
7. The transaction's result is returned to the caller.

### Datasource Interfaces

Datasource integration is based on 3 key interfaces:
 - `DBOSDataSource`: User-facing datasource API.  Part interface and part guideline, this is technically just a suggestion, but following it ensures a consistent developer experience across datasources.
 - `DataSourceTransactionHandler`: This interface is provided by the datasource to DBOS, so that DBOS can control transaction scope.
 - `@dbos-inc/dbos-sdk/datasource`: Exports from this submodule are used by datasources to do register themselves and initiate transactions.

#### `DBOSDataSource`

`DBOSDataSource` is the API for datasources to present to the application developer.  It provides a consistent, type-safe way to register and call transaction functions.
`DBOSDataSource` is templatized on its `Config` type, which describes datasource-specific configuration for a transaction function.  `Config` typically covers transaction isolation, read-write/read-only, and the transaction's name.

 - `runTransaction` should run its callback, generally with the `runTransaction` function [below](#dbos-incdbos-sdkdatasource)
 - `registerTransaction` should register the provided function and return an invocation wrapper, generally via `registerTransaction` [below](#dbos-incdbos-sdkdatasource)
 - `transaction` should be a decorator that registers its target method and installs it, generally via `registerTransaction` [below](#dbos-incdbos-sdkdatasource)

In addition to implementing the `DBOSDataSource` interface, datasource classes should also provide:
 - A way to access the transactional client.  The preferred method is with an instance `get` method: `get client(): <client type>;`.
 - A function to install any necessary transaction tracking tables, particularly as a helper for use within the test environment.

#### `DataSourceTransactionHandler`

A `DataSourceTransactionHandler` must be provided at datasource registration, and implements the transaction lifecycle using its underlying data access library.
 - `initialize`: This will be called during `DBOS.launch()`, and should validate that a connection can be established and that any required schemas are installed.  If not, a clear error should be thrown.
 - `destroy`: This is called during `DBOS.shutdown()` and should close any connections and perform any other cleanup.
 - `invokeTransactionFunction`: This should execute the provided function within a datasource transaction.  This is called by DBOS from within its step processing code, which keeps system database records and provides tracing.

#### `@dbos-inc/dbos-sdk/datasource`
The primary purpose of this submodule export is to provide the functions datasources need for registration and transaction invocation.
 - `registerDataSource`: Called by a datasource constructor to self-register the datasource with DBOS.
 - `registerTransaction`: Called by a datasource to create the transaction wrapper for a transaction function.  The returned function should be called in lieu of the original.  This is generally used within the datasource's `registerTransaction` method.
 - `runTransaction`: Called by a datasource to run code within a transaction, generally within the implementation of its `runTransaction` method.

This export also includes some utilities for datasource implementations based on Postgres:
 - `PGIsolationLevel` and `PGTransactionConfig`: These types should be used to represent transaction isolation settings in Postgres-based datasources.
 - `createTransactionCompletionSchemaPG` and `createTransactionCompletionTablePG`: These strings contain the SQL statements used to create the transaction completion checkpoint table and its schema.
 - `getPGErrorCode`: Gets the Postgres code, if any, from an `Error`
 - `isPGRetriableTransactionError`: Transactions that throw errors are retried by datasources under some circumstances.  This function establishes whether a transaction is eligible to be retried based on the thrown error.
 - `isPGKeyConflictError`: Indicates if the error is a key conflict.  Such errors, if thrown from the transaction checkpoint insert, indicate that the transaction may already be complete.

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
