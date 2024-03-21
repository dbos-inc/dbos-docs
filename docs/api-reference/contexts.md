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
- Communicators use [`CommunicatorContext`](#communicatorcontext).
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

### Methods

- [getConfig(key, defaultValue)](#ctxtgetconfigkey-defaultvalue)

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
In a transaction or communicator, this field is set to the identity UUID of the calling workflow.
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

#### `ctxt.getConfig(key, [defaultValue])`

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

- [invoke(targetClass, \[workflowUUID\])](#handlerctxtinvoketargetclass-workflowuuid)
- [retrieveWorkflow(workflowUUID)](#handlerctxtretrieveworkflowworkflowuuid)
- [send(destinationUUID, message, \[topic, idempotencyKey\])](#handlerctxtsenddestinationuuid-message-topic-idempotencykey)
- [getEvent(workflowUUID, key, \[timeoutSeconds\])](#handlerctxtgeteventworkflowuuid-key-timeoutseconds)

#### `handlerCtxt.koaContext`

```typescript
koaContext: Koa.Context;
```

The [Koa Context](https://github.com/koajs/koa/blob/master/docs/api/context.md) of the current request, giving handlers access to the raw HTTP request and response.

#### `handlerCtxt.invoke(targetClass, [workflowUUID])`

```typescript
invoke<T>(targetClass: T, workflowUUID?: string): InvokeFuncs<T>
```

Used to invoke workflows, transactions, and communicators.
The syntax for invoking function `foo` in class `Bar` with argument `baz` is:

```typescript
handlerCtxt.invoke(Bar).foo(baz)
```

When calling transactions or communicators, `invoke()` asynchronously returns the function's output.
When calling workflows, `invoke()` asynchronously returns a [`handle`](./workflow-handles) for the workflow.

Note that the DBOS runtime will supply the context to invoked functions.
You can optionally provide a UUID idempotency key to the invoked function.
For more information, see our [idempotency tutorial](../tutorials/idempotency-tutorial.md).

#### `handlerCtxt.retrieveWorkflow(workflowUUID)`

```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>
```

Returns a [workflow handle](./workflow-handles.md) to the workflow with [identity](../tutorials/workflow-tutorial#workflow-identity) `workflowUUID`.
`R` is the return type of the target workflow.

#### `handlerCtxt.send(destinationUUID, message, [topic, idempotencyKey])`

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>
```

Sends a message to workflow `destinationUUID`.
Messages can optionally be associated with a topic.
You can provide an optional idempotency key to guarantee only a single message is sent even if `send` is called more than once.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### `handlerCtxt.getEvent(workflowUUID, key, [timeoutSeconds])`

```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by `workflowUUID` for a given key using the [events API](../tutorials/workflow-communication-tutorial#events-api).
Awaiting on the promise returned by `getEvent()` waits for the workflow to publish the key, returning `null` if the wait times out.

---

## `WorkflowContext`

Workflows use `WorkflowContext` to invoke other functions and interact with other workflows.

### Methods

- [invoke(targetClass)](#workflowctxtinvoketargetclass)
- [childWorkflow(wf, ...args)](#workflowctxtchildworkflowwf-args)
- [send(destinationUUID, message, \[topic\])](#workflowctxtsenddestinationuuid-message-topic)
- [recv(\[topic, timeoutSeconds\])](#workflowctxtrecvtopic-timeoutseconds)
- [setEvent(key, value)](#workflowctxtseteventkey-value)
- [getEvent()](#workflowctxtgeteventworkflowuuid-key-timeoutseconds)
- [retrieveWorkflow(workflowUUID)](#workflowctxtretrieveworkflowworkflowuuid)
- [sleep(durationSec)](#workflowctxtsleepdurationsec)

#### `workflowCtxt.invoke(targetClass)`

```typescript
invoke<T>(targetClass: T, workflowUUID?: string): InvokeFuncs<T>
```

Invoke transactions and communicators.
To invoke other workflows, use [`childWorkflow`](#workflowctxtchildworkflowwf-args).

The syntax for invoking function `foo` in class `Bar` with argument `baz` is:

```typescript
workflowCtxt.invoke(Bar).foo(baz)
```

Note that the DBOS runtime will supply a context to invoked functions.

#### `workflowCtxt.childWorkflow(wf, ...args)`

```typescript
childWorkflow<T extends any[], R>(wf: Workflow<T, R>, ...args: T): Promise<WorkflowHandle<R>>
```

Invoke another workflow.
This returns a [workflow handle](./workflow-handles) for the new workflow.

The syntax for invoking workflow `foo` in class `Bar` with argument `baz` is:

```typescript
const workflowHandle = await ctxt.childWorkflow(Bar.foo, baz)
```

#### `workflowCtxt.send(destinationUUID, message, [topic])`

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string): Promise<void>
```

Sends a message to `destinationUUID`.
Messages can optionally be associated with a topic.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### `workflowCtxt.recv([topic, timeoutSeconds])`

```typescript
recv<T extends NonNullable<any>>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

Receive messages sent to the workflow, optionally for a particular topic.
Messages are dequeued first-in, first-out, from a queue associated with the topic.
Calls to `recv()` wait for the next message in the queue, returning `null` if the wait times out.
If no topic is specified, `recv` can only access messages sent without a topic.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### `workflowCtxt.setEvent(key, value)`

```typescript
setEvent<T extends NonNullable<any>>(key: string, value: T): Promise<void>
```

Creates an immutable event named `key` with value `value`.
Workflows and HTTP handlers can read events by calling [`getEvent`](#handlerctxtgeteventworkflowuuid-key-timeoutseconds) with the workflow's UUID.
Events are immutable and attempting to emit an event twice from a given workflow instance will result in an error.
For more information, see our [events API tutorial](../tutorials/workflow-communication-tutorial#events-api).

#### `workflowCtxt.getEvent(workflowUUID, key, [timeoutSeconds])`

```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by `workflowUUID` for a given key using the [events API](../tutorials/workflow-communication-tutorial#events-api).
Awaiting on the promise returned by `getEvent()` waits for the workflow to publish the key, returning `null` if the wait times out.

#### `workflowCtxt.retrieveWorkflow(workflowUUID)`

```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>
```

Returns a [workflow handle](./workflow-handles.md) to the workflow with [identity](../tutorials/workflow-tutorial#workflow-identity) _workflowUUID_.
`R` is the return type of the target workflow.

#### `workflowCtxt.sleep(durationSec)`

```typescript
sleep(durationSec: number): Promise<void>
```

Sleep for `durationSec` seconds.
The wakeup time is set in the database when the function is first called, so if the workflow is re-executed, it will not oversleep.

---

## `TransactionContext<T>`

Transactions use `TransactionContext` to interact with the database.

### Generic Type Parameter

`TransactionContext` is typed generically based on the application database client in use.
The application database client is configurable in a project's [configuration file](./configuration) (`app_db_client`).
DBOS currently supports the following clients:

**[Knex](https://knexjs.org/guide/#typescript)**

```typescript
import { Knex } from "knex";
static async exampleTransaction(ctxt: TransactionContext<Knex>, ...)
```

**[TypeORM](https://orkhan.gitbook.io/typeorm/docs/entity-manager-api)**

```typescript
import { EntityManager } from "typeorm";
static async exampleTransaction(ctxt: TransactionContext<EntityManager>, ...)
```

### Properties

- [client](#transactionctxtclient)

#### `transactionCtxt.client`

```typescript
client: T; // One of [Knex, EntityManager]
```

Provides access to the chosen application database client.
A transaction function should only interact with the application database using this client.

---

## `CommunicatorContext`

Communicators use `CommunicatorContext` to retrieve information on communicator configuration.

#### Properties

- [retriesAllowed](#communicatorctxtretriesallowed)
- [maxAttempts](#communicatorctxtmaxattempts)

#### `communicatorCtxt.retriesAllowed`

```typescript
readonly retriesAllowed: boolean;
```

Whether the communicator is automatically retried on failure.
Configurable through the [`@Communicator`](./decorators#communicator) decorator.

#### `communicatorCtxt.maxAttempts`

```typescript
readonly maxAttempts: number;
```

Maximum number of retries for the communicator.
Configurable through the [`@Communicator`](./decorators#communicator) decorator.

---

## `InitContext`

[Initialization functions](./decorators.md#dbosinitializer) are provided with an `InitContext`, which provides access to configuration information, database access, and a logging facility.

#### Properties and Methods

- [logger](#initcontextlogger)
- [createUserSchema](#initcontextcreateuserschema)
- [dropUserSchema](#initcontextdropuserschema)
- [queryuserdb](#initcontextqueryuserdb)
- [getconfig](#initcontextgetconfig)

#### `InitContext.logger`

```typescript
readonly logger: Logger;
```

`logger` is available to record any interesting successes, failures, or diagnostic information that occur during initialization.

#### `InitContext.createUserSchema`

```typescript
createUserSchema(): Promise<void>;
```

Creates the user database schema.  This currently works in TypeORM only, as in this case the `@Entity` decorations provide enough information for the schema and table DDL to be generated automatically.

#### `InitContext.dropUserSchema`

```typescript
dropUserSchema(): Promise<void>;
```
Drops the user database schema.  This currently works in TypeORM only, as in this case the `@Entity` decorations provide enough information for the schema and table DDL to be generated automatically.

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
The provided `dbClient` will either be a `Knex` or TypeORM `EntityManager` depending on the application's choice of SQL access library.
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
