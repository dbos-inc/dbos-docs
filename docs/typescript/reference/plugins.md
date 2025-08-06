---
sidebar_position: 200
title: DBOS Plugin Architecture
---

# DBOS Plugin Architecture

:::tip
Unless you intend to extend the DBOS Transact library, you can ignore this topic.
:::

DBOS Transact for TypeScript currently provides two explicit extension mechanisms:
* [Datasources](#datasources) integrate database clients, ORMs, or other resources with the DBOS lifecycle and transaction functions.
* [External Event Receivers](#event-receivers) integrate event receivers (pollers, inbound sockets, timers, etc.) with the DBOS lifecycle, and initiate workflow functions upon receiving events.

## Datasources

### Method Of Operation

The principle behind DBOS datasources is that DBOS and the datasource work together to execut functions in a checkpointed, transactional context.
1. App code calls a transaction function (which does not have to be registered in advance).  Generally, this call is made to the datasource instance, as it provides full type checking for the transaction configuration.
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
Event receivers are a broad category of extensions that run in a DBOS app and handle requests or other outside events.  Examples include:
 - Kafka message consumers
 - SQS message receivers
 - Database notification listeners
 - Clock-based schedulers
 - HTTP or RPC servers

What event receivers have in common is that they run in the background and execute DBOS functions in response to externally-triggered circumstances.

### Event Receiver Architecture

During program initialization, event receivers are constructed and associated with DBOS functions and methods.  Configuration information is collected during initialization, but no actions are taken until `DBOS.launch()` is called.  Upon `launch`, event receivers should review their registrations and connect to any outside resources and report clear error messages if this fails.  After any initialization is complete, event receivers should commence processing events and initiating DBOS function calls in response.  Event receivers are also told to deinitialize when DBOS shuts down.

### Lifecycle

DBOS event receiver objects should implement the `DBOSLifecycleCallback` interface:
```typescript
/**
 * Interface for integrating into the DBOS startup/shutdown lifecycle
 */
export interface DBOSLifecycleCallback {
  /** Called back during DBOS launch */
  initialize?(): Promise<void>;
  /** Called back upon shutdown (usually in tests) to close connections and free resources */
  destroy?(): Promise<void>;
  /** Called at launch; Implementers should emit a diagnostic list of all registrations */
  logRegisteredEndpoints?(): void;
}
```

Upon construction, event receivers should register themselves via `DBOS.registerLifecycleCallback`.  Upon `DBOS.launch()`, all registered `initialize()` methods will be called.  Upon `DBOS.shutdown()`, all registered `destroy()` methods will be called.  Event receivers should implement a `logRegisteredEndpoints()` function, which is a [diagnostic aid](../reference/dbos-class.md#dboslogregisteredendpoints) that logs all associations between events and functions to [`DBOS.logger`](../tutorials/logging.md#logging).

### Associating Information With Classes, Methods, And Parameters
As program initialization is nonlinear, the DBOS library provides infrastructure to help register the classes, functions, and parameters associated with an event receiver.  A cohesive picture of this registration information is then available during `initialize`.

The following `DBOS.` static methods are used to collect registration information during initialization:
```typescript
  associateClassWithInfo(external: AnyConstructor | object | string, cls: AnyConstructor | string): object;

  associateFunctionWithInfo<This, Args extends unknown[], Return>(
    external: AnyConstructor | object | string,
    func: (this: This, ...args: Args) => Promise<Return>,
    target: FunctionName,
  ) : object;

  associateParamWithInfo<This, Args extends unknown[], Return>(
    external: AnyConstructor | object | string,
    func: (this: This, ...args: Args) => Promise<Return>,
    target: FunctionName & {
      param: number | string;
    },
  ) : object | undefined;
```

The parameters to these functions are:
 - `external`: A key that identifies the event reciever; this can be its constructor, an instance, or a name string.
 - `cls`: For `associateClassWithInfo`, the constructor of the class receiving the registration
 - `func`: For `associateFunctionWithInfo` and `associateParamWithInfo`, the function receiving the registration information
 - `target`: For `associateFunctionWithInfo` and `associateParamWithInfo`, this is the name to assign to the function (if it does not already have one).  For `associateParamWithInfo`, `target` also specifies `param`, which is the parameter name or index number

Each of these methods returns an `object` that is specific to the event receiver; this object can be used by the event receiver to store any details.  `associateParamWithInfo` will return `undefined` if there is no such parameter.

### Finding And Invoking Registered Methods
At the time its `initialize` method is called, an event receiver can retrieve all its registration information via `DBOS.getAssociatedInfo`:

```typescript
getAssociatedInfo(
  external: AnyConstructor | object | string,
  cls?: object | string,
  funcName?: string,
): readonly ExternalRegistration[]

interface ExternalRegistration {
  classConfig?: unknown;
  methodConfig?: unknown;
  paramConfig: {
    name: string;
    index: number;
    paramConfig?: object;
  }[];
  methodReg: MethodRegistrationBase;
}
```

The value of `external` should match the value provided to [`associateClassWithInfo`, `associateFunctionWithInfo`, and `associateParamWithInfo` above](#associating-information-with-classes-methods-and-parameters).

If `cls` or `funcName` are provided, these are used to filter the registrations, otherwise all registrations are retrieved.

The returned `ExternalRegistration` array contains one entry per retrieved function:
 - `classConfig` is the same `object` returned by `associateClassWithInfo`
 - `methodConfig` is the same `object` returned by `associateFunctionWithInfo`
 - `paramConfig` is an array of parameter objects, as returned by `associateParameterWithInfo`
 - `methodReg` is the method registration structure, which allow the target (and any associated wrappers) to be invoked.
 
In response to events, receivers should take one of the following approaches to call the target functions:
 - For synchronous calls, event receivers should call the `invoke` method of `methodReg`.  `invoke` ensures that any DBOS wrappers are executed in addition to the function's code.
 - For starting workflows, event receivers should call `DBOS.startWorkflow` with `methodReg.registeredFunction` as the workflow.  The workflow ID, queue, and other parameters may be specified to `startWorkflow`.

### Event Receiver Examples
The best examples are found in the DBOS [github repository](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages).  Event receiver names end with `-receive` or `-serve`, such as [`kafkajs-receive`](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/kafkajs-receive) and [`koa-serve`](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/koa-serve)
