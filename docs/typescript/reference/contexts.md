---
sidebar_position: 3
title: DBOS Contexts
description: API reference for DBOS contexts
---

## Background

DBOS automatically supplies a _context_ to each registered function.
A function can use its context to call other DBOS functions, interact with the runtime or the database, and access the logger.
Each DBOS function has a specific context:

- Contexts used within DBOS functions inherit from [`DBOSContext`](#dboscontext).
- Handlers use [`HandlerContext`](#handlercontext).
- Workflows use [`WorkflowContext`](#workflowcontext).
- Transactions use [`TransactionContext<T>`](#transactioncontextt) with a specific database client type.
- Steps use [`StepContext`](#stepcontext).
- Initialization functions use [`InitContext`](#initcontext).
- Middleware functions use [`MiddlewareContext`](#middlewarecontext).

---

## `DBOSContext`

Many contexts inherit from `DBOSContext` and share its properties and methods.   (`InitContext` and `MiddlewareContext` are exceptions, as these are applied outside the context of DBOS functions.)

### Properties

- [request](#ctxtrequest)
- [workflowUUID](#ctxtworkflowuuid)
- [authenticatedUser](#ctxtauthenticateduser)
- [authenticatedRoles](#ctxtauthenticatedroles)
- [assumedRole](#ctxtassumedrole)
- [logger](#ctxtlogger)
- [span](#ctxtspan)

### Methods

- [getConfig(key, defaultValue)](#ctxtgetconfig)

#### `ctxt.request`

```typescript
readonly request: HTTPRequest
```

An object with information about the originating HTTP request that triggered this function (directly or indirectly).

```typescript
interface HTTPRequest {
  readonly headers?: IncomingHttpHeaders;  // A node's http.IncomingHttpHeaders object.
  readonly rawHeaders?: string[];          // Raw headers.
  readonly params?: unknown;               // Parsed path parameters from the URL.
  readonly body?: unknown;                 // parsed HTTP body as an object.
  readonly rawBody?: string;               // Unparsed raw HTTP body string.
  readonly query?: ParsedUrlQuery;         // Parsed query string.
  readonly querystring?: string;           // Unparsed raw query string.
  readonly url?: string;                   // Request URL.
  readonly ip?: string;                    // Request remote address.
}
```

#### `ctxt.workflowUUID`

```typescript
readonly workflowUUID: string
```

The current workflow's [identity UUID](../tutorials/workflow-tutorial#workflow-identity), a string uniquely identifying a workflow execution.
In a transaction or step, this field is set to the identity UUID of the calling workflow.
In a handler, this field is empty.

#### `ctxt.authenticatedUser`

```typescript
readonly authenticatedUser: string
```

The identity of the authenticated user who ran this function.
Authenticated users are set by [authentication middleware](../tutorials/authentication-authorization) and inherited through the calling chain.

#### `ctxt.authenticatedRoles`

```typescript
readonly authenticatedRoles: string[];
```

A list of roles the authenticated user has, if any.
Authenticated roles are set by [authentication middleware](../tutorials/authentication-authorization) and inherited through the calling chain.

#### `ctxt.assumedRole`

```typescript
readonly assumedRole: string;
```

The role used to run this function.
Empty string if authorization is not required.
DBOS's [authorization](../tutorials/authentication-authorization#authorization-decorators) sets the assumed role right before executing a function and this property is *not* inherited through the calling chain.

#### `ctxt.logger`

```typescript
readonly logger: DBOSLogger
```

A reference to DBOS's logger.
Please see our [logging tutorial](../tutorials/logging.md) for more information.

#### `ctxt.span`

```typescript
readonly span: Span
```

An [OpenTelemetry Span](https://opentelemetry.io/docs/concepts/signals/traces/#spans) associated with this context.
You can assign custom trace attributes to this span.
Please see the [Span API](https://github.com/open-telemetry/opentelemetry-js/blob/main/api/src/trace/span.ts) for more information.

#### `ctxt.getConfig`

```typescript
getConfig<T>(key: string): T | undefined;
getConfig<T>(key: string, defaultValue: T): T;
```

Retrieves an application property specified in the [application section of the configuration](./configuration.md#application).
Optionally accepts a default value, returned when the key cannot be found in the configuration.

---

## `HandlerContext`

Handlers use `HandlerContext` to invoke other functions, interact with active workflows, and interact directly with HTTP requests and responses.

### Properties

- [koaContext](#handlerctxtkoacontext)

### Methods

- [invoke(target)](#handlerctxtinvoke)
- [invokeWorkflow(target, \[workflowUUID\])](#handlerctxtinvokeworkflow)
- [startWorkflow(target, \[workflowUUID\], \[queue\])](#handlerctxtstartworkflow)
- [retrieveWorkflow(workflowUUID)](#handlerctxtretrieveworkflow)
- [send(destinationUUID, message, \[topic, idempotencyKey\])](#handlerctxtsend)
- [getEvent(workflowUUID, key, \[timeoutSeconds\])](#handlerctxtgetevent)

#### `handlerCtxt.koaContext`

```typescript
koaContext: Koa.Context;
```

The [Koa Context](https://github.com/koajs/koa/blob/master/docs/api/context.md) of the current request, giving handlers access to the raw HTTP request and response.

#### `handlerCtxt.invoke`

```typescript
invoke<T>(target: T, workflowUUID?: string): InvokeFuncs<T>
```

Invoke a transaction or step on the `target` class or configured instance.
To invoke workflows, use [`invokeWorkflow`](#handlerctxtinvokeworkflow) or [`startWorkflow`](#handlerctxtstartworkflow) instead.
The syntax for invoking function `fn` in class `Cls` with argument `arg` is:

```typescript
const output = await handlerCtxt.invoke(Cls).fn(arg);
```

You don't supply a context to the invoked function&#8212;the DBOS Transact runtime does this for you.
You can optionally provide an idempotency key to the invoked function.
For more information, see our [idempotency tutorial](../tutorials/idempotency-tutorial.md).

#### `handlerCtxt.invokeWorkflow`

```typescript
invokeWorkflow<T>(target: T, workflowUUID?: string): InvokeFuncs<T>
```

Invoke a workflow and wait for it to complete, returning its result.
To start a workflow without waiting for it to complete, use [`startWorkflow`](#handlerctxtstartworkflow).
The syntax for invoking workflow `wf` in class `Cls` with argument `arg` is:

```typescript
const output = await handlerCtxt.invokeWorkflow(Cls).wf(arg);
```

You don't supply a context to the invoked workflow&#8212;the DBOS Transact runtime does this for you.

#### `handlerCtxt.startWorkflow`

```typescript
startWorkflow<T>(target: T, workflowID?: string, queue?: WorkflowQueue): InvokeFuncs<T>
```

Start or enqueue a workflow and return a [handle](./workflow-handles.md) to it.
This does not wait for the workflow to complete, though the resulting handle can be used to wait for the workflow result.
To start a workflow and wait for the result, see [`invokeWorkflow`](#handlerctxtinvokeworkflow).
The `startWorkflow` method resolves after the handle is durably created; at this point the workflow is guaranteed to [run to completion](../tutorials/workflow-tutorial.md#reliability-guarantees) even if the handler is interrupted.

The syntax for starting workflow `wf` in class `Cls` with argument `arg` is:

```typescript
const workflowHandle = await handlerCtxt.startWorkflow(Cls).wf(arg);
```

If the `workflowID` argument is provided, the workflow will [execute exactly once per the specified ID](../tutorials/idempotency-tutorial.md).

If the `queue` argument is provided, the workflow may not start immediately.  Start of execution will be determined by the [queue](../reference/workflow-queues.md#class-workflowqueue) and its contents.

You don't supply a context to the newly started workflow&#8212;the DBOS Transact runtime does this for you.

#### `handlerCtxt.retrieveWorkflow`

```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>
```

Returns a [workflow handle](./workflow-handles.md) to the workflow with [identity](../tutorials/workflow-tutorial#workflow-identity) `workflowUUID`.
`R` is the return type of the target workflow.

#### `handlerCtxt.send`

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>
```

Sends a message to workflow `destinationUUID`.
Messages can optionally be associated with a topic.
You can provide an optional idempotency key to guarantee only a single message is sent even if `send` is called more than once.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### `handlerCtxt.getEvent`

```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by `workflowUUID` for a given key using the [events API](../tutorials/workflow-communication-tutorial#events-api).
Awaiting on the promise returned by `getEvent()` waits for the workflow to publish the key, returning `null` if the wait times out.

---

#### `handlerCtxt.getWorkflows`

```typescript
getWorkflows(input: GetWorkflowsInput): Promise<GetWorkflowsOutput>
```

This function allows querying workflow execution history. Its input is an object describing which workflows to retrieve (by default, retrieve all workflows):

```typescript
export interface GetWorkflowsInput {
  workflowName?: string; // The name of the workflow function
  authenticatedUser?: string; // The user who ran the workflow.
  startTime?: string; // Timestamp in RFC 3339 format
  endTime?: string; // Timestamp in RFC 3339 format
  status?: "PENDING" | "SUCCESS" | "ERROR" | "RETRIES_EXCEEDED" | "CANCELLED" ; // The status of the workflow.
  applicationVersion?: string; // The application version that ran this workflow.
  limit?: number; // Return up to this many workflows IDs. IDs are ordered by workflow creation time.
}
```

It returns as output an object containing a list of the [UUIDs](../tutorials/idempotency-tutorial.md) of all retrieved workflows, ordered by workflow creation time:

```typescript
export interface GetWorkflowsOutput {
  workflowUUIDs: string[];
}
```

To obtain further information about a particular workflow, call [`retrieveWorkflow`](#handlerctxtretrieveworkflow) on its UUID to obtain its [handle](./workflow-handles.md).

---

## `WorkflowContext`

Workflows use `WorkflowContext` to invoke other functions and interact with other workflows.

### Methods

- [invoke(target)](#workflowctxtinvoke)
- [invokeWorkflow(target)](#workflowctxtinvokeworkflow)
- [startWorkflow(target)](#workflowctxtstartworkflow)
- [send(destinationUUID, message, \[topic\])](#workflowctxtsend)
- [recv(\[topic, timeoutSeconds\])](#workflowctxtrecv)
- [setEvent(key, value)](#workflowctxtsetevent)
- [getEvent()](#workflowctxtgetevent)
- [retrieveWorkflow(workflowUUID)](#workflowctxtretrieveworkflow)
- [sleep(durationSec)](#workflowcontextsleep)
- [sleepms(durationMS)](#workflowcontextsleepms)

#### `workflowCtxt.invoke`

```typescript
invoke<T>(target: T, workflowUUID?: string): InvokeFuncs<T>
```

Invoke transactions and steps.
To invoke other workflows, use [`invokeWorkflow`](#workflowctxtinvokeworkflow) or [`startWorkflow`](#workflowctxtstartworkflow).

The syntax for invoking function `fn` in class `Cls` with argument `arg` is:

```typescript
const output = await workflowCtxt.invoke(Cls).fn(arg);
```

You don't supply a context to the invoked function&#8212;the DBOS Transact runtime does this for you.

#### `workflowCtxt.invokeWorkflow`

```typescript
invokeWorkflow<T>(target: T)
```

Invoke a child workflow and wait for it to complete, returning its result.
To start a workflow without waiting it to complete, use [`startWorkflow`](#workflowctxtstartworkflow).
The syntax for invoking workflow `wf` in class `Cls` with argument `arg` is:

```typescript
const output = await ctxt.invokeWorkflow(Cls).wf(arg);
```

You don't supply a context to the invoked child workflow&#8212;the DBOS Transact runtime does this for you.

#### `workflowCtxt.startWorkflow`

```typescript
startWorkflow<T>(target: T, workflowID?: string, queue?: WorkflowQueue).workflowFunction(args)
```

Start a child workflow and return a [handle](./workflow-handles.md) to it but do not wait for the workflow to complete.
This method resolves after the handle is durably created; at this point the workflow is guaranteed to [run to completion](../tutorials/workflow-tutorial.md#reliability-guarantees).
The syntax for starting workflow `wf` in class `Cls` with argument `arg` is:

```typescript
const workflowHandle = await ctxt.startWorkflow(Cls).wf(arg);
```

If the `workflowID` argument is provided, the workflow will [execute exactly once per the specified ID](../tutorials/idempotency-tutorial.md).

If the `queue` argument is provided, the workflow may not start immediately.  Start of execution will be determined by the [queue](../reference/workflow-queues.md#class-workflowqueue) and its contents.


You don't supply a context to the newly started child workflow&#8212;the DBOS Transact runtime does this for you.

#### `workflowCtxt.invokeChildWorkflow`

Deprecated in favor of [`workflowCtxt.invokeWorkflow`](#workflowctxtinvokeworkflow), which is equivalent but syntactically simpler.

#### `workflowCtxt.startChildWorkflow`

Deprecated in favor of [`workflowCtxt.startWorkflow`](#workflowctxtstartworkflow), which is equivalent but syntactically simpler.

#### `workflowCtxt.send`

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string): Promise<void>
```

Sends a message to `destinationUUID`.
Messages can optionally be associated with a topic.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### `workflowCtxt.recv`

```typescript
recv<T extends NonNullable<any>>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

Receive messages sent to the workflow, optionally for a particular topic.
Messages are dequeued first-in, first-out, from a queue associated with the topic.
Calls to `recv()` wait for the next message in the queue, returning `null` if the wait times out.
If no topic is specified, `recv` can only access messages sent without a topic.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### `workflowCtxt.setEvent`

```typescript
setEvent<T extends NonNullable<any>>(key: string, value: T): Promise<void>
```

Creates or updates an event named `key` with value `value`.
Workflows and HTTP handlers can read events by calling [`getEvent`](#handlerctxtgetevent) with the workflow's UUID.
Events are mutable.  Attempting to emit an event twice from a given workflow instance will update the value, but care should be taken to ensure that the value is calculated deterministically for consistency when workflows are recovered.
For more information, see our [events API tutorial](../tutorials/workflow-communication-tutorial#events-api).

#### `workflowCtxt.getEvent`

```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by `workflowUUID` for a given key using the [events API](../tutorials/workflow-communication-tutorial#events-api).
Awaiting on the promise returned by `getEvent()` waits for the workflow to publish the key, returning `null` if the wait times out.

#### `workflowCtxt.retrieveWorkflow`

```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>
```

Returns a [workflow handle](./workflow-handles.md) to the workflow with [identity](../tutorials/workflow-tutorial#workflow-identity) _workflowUUID_.
`R` is the return type of the target workflow.

#### `WorkflowContext.sleep`

```typescript
sleep(durationSec: number): Promise<void>
```

Sleep for `durationSec` seconds.
The wakeup time is set in the database when the function is first called, so if the workflow is re-executed, it will not oversleep.

Alternatively, [`sleepms`](#workflowcontextsleepms) is more precise.

#### `WorkflowContext.sleepms`

```typescript
sleepms(durationMS: number): Promise<void>
```

Sleep for `durationMS` milliseconds.
The wakeup time is set in the database when the function is first called, so if the workflow is re-executed, it will not oversleep.

---

## `TransactionContext<T>`

Transactions use `TransactionContext` to interact with the database.

### Generic Type Parameter

`TransactionContext` is typed generically based on the application database client in use.
The application database client is configurable in a project's [configuration file](./configuration) (`app_db_client`).
DBOS currently supports the following clients:

**[Knex](../tutorials/using-knex.md)**

```typescript
import { Knex } from "knex";
static async exampleTransaction(ctxt: TransactionContext<Knex>, ...)
```

**[TypeORM](../tutorials/using-typeorm.md)**

```typescript
import { EntityManager } from "typeorm";
static async exampleTransaction(ctxt: TransactionContext<EntityManager>, ...)
```

**[Prisma](../tutorials/using-prisma.md)**

```typescript
import { PrismaClient } from "@prisma/client";
static async exampleTransaction(ctxt: TransactionContext<PrismaClient>, ...)
```

**[Drizzle](../tutorials/using-drizzle.md)**

```typescript
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
static async exampleTransaction(ctxt: TransactionContext<NodePgDatabase>, ...)
```

### Properties

- [client](#transactionctxtclient)

#### `transactionCtxt.client`

```typescript
client: T; // One of [Knex, EntityManager, PrismaClient, NodePgDatabase]
```

Provides access to the chosen application database client.
A transaction function should only interact with the application database using this client.

---

## `StoredProcedureContext`

Stored procedures use StoredProcedureContext to interact with the database.

- [query](#storedprocctxtquery)

:::warning
While `StoredProcedureContext` supports most of the [`DBOSContext`](#dboscontext) methods, it does not support
either the [`span`](#ctxtspan) property or the [`getConfig<T>`](#ctxtgetconfig) method.
::: 


### Methods

#### `storedProcCtxt.query`

```typescript
type QueryResult<TRow> = {
  rowCount: number;
  rows?: TRow[];
}

query<TRow>(sql: string, ...params: unknown[]): Promise<QueryResult<TRow>>;
```

Execute a query against the database.
Returns an object with query result rows (if any) and the number of rows affected by the query.

---

## `StepContext`

Steps use `StepContext` to retrieve configuration information.

#### Properties

- [retriesAllowed](#stepctxtretriesallowed)
- [maxAttempts](#stepctxtmaxattempts)

#### `stepCtxt.retriesAllowed`

```typescript
readonly retriesAllowed: boolean;
```

Whether the step is automatically retried on failure.
Configurable through the [`@Step`](./decorators#step) decorator.

#### `stepCtxt.maxAttempts`

```typescript
readonly maxAttempts: number;
```

Maximum number of retries for the step.
Configurable through the [`@Step`](./decorators#step) decorator.

---

## `CommunicatorContext`

`CommunicatorContext` is a historical synonym for [`StepContext`](#stepcontext), as steps are frequently used to communicate with external systems.

---

## `InitContext`

[Class initialization functions](./decorators.md#dbosinitializer) and instance `initialize()` methods are provided with an `InitContext`, which provides access to configuration information, database access, and a logging facility.

#### Properties and Methods

- [logger](#initcontextlogger)
- [queryuserdb](#initcontextqueryuserdb)
- [getconfig](#initcontextgetconfig)

#### `InitContext.logger`

```typescript
readonly logger: Logger;
```

`logger` is available to record any interesting successes, failures, or diagnostic information that occur during initialization.

#### `InitContext.queryUserDB`

```typescript
queryUserDB<R>(sql: string, ...params: unknown[]): Promise<R[]>;
```

Accesses the user database directly with SQL.  This approach is to be used with caution, as using a string to represent SQL is not fully database independent and careless formation of the string can lead to SQL injection vulnerabilities.

#### `InitContext.getConfig`

```typescript
getConfig<T>(key: string, defaultValue?: T): T | undefined;
```
 
`getConfig` retrieves configuration information (from .yaml config file / environment).  If `key` is not present in the configuration, `defaultValue` is returned.

---

## `MiddlewareContext`

`MiddlewareContext` is provided to functions that execute against a request before entry into handler, transaction, and workflow functions.  These middleware functions are generally executed before, or in the process of, user authentication, request validation, etc.  The context is intended to provide read-only database access, logging services, and configuration information.

#### Properties and Methods

- [logger](#middlewarecontextlogger)
- [span](#middlewarecontextspan)
- [koaContext](#middlewarecontextkoacontext)
- [name](#middlewarecontextname)
- [requiredRole](#middlewarecontextrequiredrole)
- [getConfig](#middlewarecontextgetconfig)
- [query](#middlewarecontextquery)

#### `MiddlewareContext.logger`

```typescript
readonly logger: DBOSLogger;
```

`logger` is available to record any interesting successes, failures, or diagnostic information that occur during middleware processing.

#### `MiddlewareContext.span`
```typescript
readonly span: Span;
```
`span` is the tracing span in which the middleware is being executed.

#### `MiddlewareContext.koaContext`

```typescript
readonly koaContext: Koa.Context;
```

`koaContext` is the Koa context, which contains the inbound HTTP request associated with the middleware invocation.

#### `MiddlewareContext.name`

```typescript
readonly name: string;
```

`name` contains the name of the function (handler, transaction, workflow) to be invoked after successful middleware processing.

#### `MiddlewareContext.requiredRole`

```typescript
readonly requiredRole: string[];
```

`requiredRole` contains the list of roles required for the invoked operation.  Access to the function will granted if the user has any role on the list.  If the list is empty, it means there are no authorization requirements and may indicate that authentication is not required.

#### `MiddlewareContext.getConfig`

```typescript
getConfig<T>(key: string, deflt: T | undefined) : T | undefined
```

`getConfig` retrieves configuration information (from .yaml config file / environment).  If `key` is not present in the configuration, `defaultValue` is returned.

#### `MiddlewareContext.query`

```typescript
  query<C extends UserDatabaseClient, R, T extends unknown[]>(qry: (dbclient: C, ...args: T) => Promise<R>, ...args: T): Promise<R>;
```

The `query` function provides read access to the database.
To provide a scoped database connection and to ensure cleanup, the `query` API works via a callback function.
The application is to pass in a `qry` function that will be executed in a context with access to the database client `dbclient`.
The provided `dbClient` will be a `Knex` or TypeORM `EntityManager` or `PrismaClient` depending on the application's choice of SQL access library.
This callback function may take arguments, and return a value.

Example, for Knex:
```typescript
  const u = await ctx.query(
    // The qry function that takes in a dbClient and a list of arguments (uname in this case)
    (dbClient: Knex, uname: string) => {
      return dbClient<UserTable>(userTableName).select("username").where({ username: uname })
    },
    userName // Input value for the uname argument
  );
```

## Information Available Outside Of Contexts

While most code is executed within one of the numerous DBOS contexts, there are a few exceptions, such as the HTTP server, its non-DBOS middleware, or background tasks.  For these cases, it is possible to access the `globalLogger` and `dbosConfig` from a global location:

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";

function myFunc() {
  DBOS.globalLogger?.info(`There is no context here, but I need to log something anyway!
                    My config is '${dbosConfig?.application?.myvalue}'`);
}
```

The definition of `DBOS` is:
```typescript
class DBOS {
  static globalLogger?: GlobalLogger; // The global logger
  static dbosConfig?: DBOSConfig; // The global DBOS configuration
}
```

Note that `DBOS` is not fully available util runtime initialization starts.
