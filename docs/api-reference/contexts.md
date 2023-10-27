---
sidebar_position: 3
title: Operon Contexts
description: API reference for Operon contexts
---

## Background

Operon automatically create a _context_ for each registered function.
Functions use their context to call other Operon functions, interact with the runtime or the database, and access the logger.
Each Operon function has a specific context:

- All contexts inherit [`OperonContext`](#operoncontext).
- Handlers use [`HandlerContext`](#handlercontext).
- Workflows use [`WorkflowContext`](#workflowcontext).
- Transactions use [`TransactionContext<T>`](#transactioncontextt) with a specific database client type.
- Communicators use [`CommunicatorContext`](#communicatorcontext).
- Initialization and deployment functions use [`InitContext`](#initcontext).
- Middleware functions use [`InitContext`](#middlewarecontext).

---

## `OperonContext`

Many contexts (`InitContext is the exception`) inherit from `OperonContext` and share its properties and methods.

### Properties

- [request](#ctxtrequest)
- [workflowUUID](#ctxtworkflowuuid)
- [authenticatedUser](#ctxtauthenticateduser)
- [authenticatedRoles](#ctxtauthenticatedroles)
- [assumedRole](#ctxtassumedrole)
- [logger](#ctxtlogger)
- [span](#ctxtspan)


### Methods

- [getConfig(key, defaultValue)](#ctxtgetconfigkey-defaultvalue)

### ctxt.request

```typescript
readonly request: HTTPRequest
```

An object with information about the originating HTTP request that triggered, directly or not, this function.

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

### ctxt.workflowUUID

```typescript
readonly workflowUUID: string
```

The current workflow's [identity UUID](../tutorials/workflow-tutorial#workflow-identity), a string uniquely identifying a workflow instance.
In a transaction or communicator, this field is set to the identity UUID of the calling workflow.
In a handler, this field is empty.

### ctxt.authenticatedUser

```typescript
readonly authenticatedUser: string
```

The identity of the authenticated user who ran this function.
Authenticated users are set by [authentication middleware](../tutorials/authentication-authorization) and inherited through the calling chain.

### ctxt.authenticatedRoles

```typescript
readonly authenticatedRoles: string[];
```

A list of roles the authenticated user has, if any.
Authenticated roles are set by [authentication middleware](../tutorials/authentication-authorization) and inherited through the calling chain.

### ctxt.assumedRole

```typescript
readonly assumedRole: string;
```

The role used to run this function.
Empty string if authorization is not required.
Operon's [authorization](../tutorials/authentication-authorization#authorization-decorators) sets the assumed role right before executing a function and this property is *not* inherited through the calling chain.

### ctxt.logger

```typescript
readonly logger: OperonLogger
```

A reference to Operon's logger.
Please see our [logging tutorial](../tutorials/logging.md#logging) for more information.

### ctxt.span

```typescript
readonly span: Span
```

An [OpenTelemetry Span](https://opentelemetry.io/docs/concepts/signals/traces/#spans) associated with this function.
You can assign custom trace attributes to this span.
Please see our [tracing tutorial](../tutorials/logging.md#tracing) for more information.

### ctxt.getConfig(key, defaultValue)

```typescript
getConfig<T>(key: string): T | undefined;
getConfig<T>(key: string, defaultValue: T): T;
```

Retrieves an application property specified in the [application section of the configuration](./configuration.md#application-configuration).
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

### handlerCtxt.koaContext

```typescript
koaContext: Koa.Context;
```

The [Koa Context](https://github.com/koajs/koa/blob/master/docs/api/context.md) of the current request, giving handlers access to the raw HTTP request and response.

### handlerCtxt.invoke(targetClass, \[workflowUUID\])

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

Note Operon runtime will supply the context to invoked functions.
You can optionally provide a UUID idempotency key to the invoked function.
For more information, see our [idempotency tutorial](../tutorials/idempotency-tutorial.md).

### handlerCtxt.retrieveWorkflow(workflowUUID)

```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>
```

Returns a [workflow handle](./workflow-handles.md) to the workflow with [identity](../tutorials/workflow-tutorial#workflow-identity) _workflowUUID_.
`R` is the return type of the target workflow.

### handlerCtxt.send(destinationUUID, message, \[topic, idempotencyKey\])

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>
```

Sends a message to workflow _destinationUUID_.
Messages can optionally be associated with a topic.
You can provide an optional idempotency key to guarantee only a single message is sent even if `send` is called more than once.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

### handlerCtxt.getEvent(workflowUUID, key, \[timeoutSeconds\])

```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by _workflowUUID_ for a given key using the [events API](../tutorials/workflow-communication-tutorial#events-api).
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

### workflowCtxt.invoke(targetClass)

```typescript
invoke<T>(targetClass: T, workflowUUID?: string): InvokeFuncs<T>
```

Invoke transactions and communicators.
To invoke other workflows, use [`childWorkflow`](#workflowctxtchildworkflowwf-args).

The syntax for invoking function `foo` in class `Bar` with argument `baz` is:

```typescript
workflowCtxt.invoke(Bar).foo(baz)
```

Note Operon runtime will supply a context to invoked functions.

### workflowCtxt.childWorkflow(wf, ...args)

```typescript
childWorkflow<T extends any[], R>(wf: OperonWorkflow<T, R>, ...args: T): Promise<WorkflowHandle<R>>
```

Invoke another workflow.
This returns a [workflow handle](./workflow-handles) for the new workflow.

The syntax for invoking workflow `foo` in class `Bar` with argument `baz` is:

```typescript
const workflowHandle = await ctxt.childWorkflow(Bar.foo, baz)
```

### workflowCtxt.send(destinationUUID, message, \[topic\])

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string): Promise<void>
```

Sends a message to _destinationUUID_.
Messages can optionally be associated with a topic.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

### workflowCtxt.recv(\[topic, timeoutSeconds\])

```typescript
recv<T extends NonNullable<any>>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

Receive messages sent to the workflow, optionally for a particular topic.
Messages are dequeued first-in, first-out, from a queue associated with the topic.
Calls to `recv()` wait for the next message in the queue, returning `null` if the wait times out.
If no topic is specified, `recv` can only access messages sent without a topic.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

### workflowCtxt.setEvent(key, value)

```typescript
setEvent<T extends NonNullable<any>>(key: string, value: T): Promise<void>
```

Creates an immutable event named `key` with value `value`.
HTTP handlers can read events by calling [`getEvent`](#handlerctxtgeteventworkflowuuid-key-timeoutseconds) with the workflow's UUID.
Events are immutable and attempting to emit an event twice from a given workflow instance will result in an error.
For more information, see our [events API tutorial](../tutorials/workflow-communication-tutorial#events-api).

### workflowCtxt.getEvent(workflowUUID, key, \[timeoutSeconds\])

```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by _workflowUUID_ for a given key using the [events API](../tutorials/workflow-communication-tutorial#events-api).
Awaiting on the promise returned by `getEvent()` waits for the workflow to publish the key, returning `null` if the wait times out.

### workflowCtxt.retrieveWorkflow(workflowUUID)

```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>
```

Returns a [workflow handle](./workflow-handles.md) to the workflow with [identity](../tutorials/workflow-tutorial#workflow-identity) _workflowUUID_.
`R` is the return type of the target workflow.


---

## `TransactionContext<T>`

Transactions use `TransactionContext` to interact with the database.

### Generic Type Parameter

`TransactionContext` is typed generically based on the application database client in use.
The application database client is configurable in a project's [configuration file](./configuration) (`user_dbclient`).
Operon currently supports the following clients:

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

**[Prisma](https://www.prisma.io/docs/concepts/components/prisma-client)**

```typescript
import { PrismaClient } from "@prisma/client";
static async exampleTransaction(ctxt: TransactionContext<Prisma>, ...)
```

### Properties

- [client](#transactionctxtclient)

### transactionCtxt.client

```typescript
client: T; // One of [Knex, EntityManager, PrismaClient]
```

Provides access to the chosen application database client.
A transaction function should only interact with the application database using this client.

---

## `CommunicatorContext`

Communicators use `CommunicatorContext` to retrieve information on communicator configuration.

#### Properties

- [retriesAllowed](#communicatorctxtretriesallowed)
- [maxAttempts](#communicatorctxtmaxattempts)

### communicatorCtxt.retriesAllowed

```typescript
readonly retriesAllowed: boolean;
```

Whether the communicator is automatically retried on failure.
Configurable through the [`@OperonCommunicator`](./decorators#operoncommunicator) decorator.

### communicatorCtxt.maxAttempts

```typescript
readonly maxAttempts: number;
```

Maximum number of retries for the communicator.
Configurable through the [`@OperonCommunicator`](./decorators#operoncommunicator) decorator.

---

## `InitContext`

Initialization and deployment functions are provided with an `InitContext`, which provides access to configuration information, database access, and a logging facility.
```typescript
export class InitContext {
  // Log any interesting successes / failures to initialize using `logger`
  readonly logger: Logger ;

  // Create or drop the user database schema (TypeORM only)
  createUserSchema(): Promise<void>;
  dropUserSchema(): Promise<void>;

  // Execute SQL against the user database
  queryUserDB<R>(sql: string, ...params: unknown[]): Promise<R[]>;

  // Retrieve configuration information (from .yaml config file / environment)
  getConfig<T>(key: string, defaultValue?: T): T | undefined;
}
```

---

## `MiddlewareContext`

`MiddlewareContext` is provided to functions that execute against a request before entry into Operon handler, transaction, and workflow functions.  These middleware functions are generally executed before, or in the process of, user authentication, request validation, etc.  The context is intended to provide read-only database access, logging services, and configuration information.

```typescript
export interface MiddlewareContext {
  readonly koaContext: Koa.Context; // Koa context, which contains the inbound HTTP request
  readonly name: string;            // Method (handler, transaction, workflow) name
  readonly requiredRole: string[];  // Roles required for the invoked Operon operation, if empty perhaps auth is not required

  readonly logger: OperonLogger;    // Logger, for logging from middleware
  readonly span: Span;              // Tracing pan from which middleware is called

  getConfig<T>(key: string, deflt: T | undefined) : T | undefined; // Access to configuration information

  // Database access - This is expected to be read-only
  query<C extends UserDatabaseClient, R, T extends unknown[]>(qry: (dbclient: C, ...args: T) => Promise<R>, ...args: T): Promise<R>;
}
```
