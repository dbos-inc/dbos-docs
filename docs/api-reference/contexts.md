---
sidebar_position: 4
title: Operon Contexts Reference
---

# Operon Context Reference

- [Background Information](#background-information)
- [Contexts Reference](#contexts-reference)
  - [`OperonContext`](#operoncontext)
  - [`HandlerContext`](#handlercontext)
  - [`WorkflowContext`](#workflowcontext)
  - [`TransactionContext<T>`](#transactioncontextt)
  - [`CommunicatorContext`](#communicatorcontext)

---

## Background Information

Each Operon function has a _context_ it can use to call other functions, interact with the runtime, and interact with the database.
Contexts are created by the runtime and always passed in as a function's first argument.
Different types of functions use different types of contexts:

- All contexts inherit from the base [`OperonContext`](#operoncontext).
- Handlers use [`HandlerContext`](#handlercontext).
- Workflows use [`WorkflowContext`](#workflowcontext).
- Transactions use [`TransactionContext<T>`](#transactioncontextt) with a specific database client type.
- Communicators use [`CommunicatorContext`](#communicatorcontext).

---

## Contexts Reference

### `OperonContext`

All contexts inherit from `OperonContext` and share its properties and methods.

#### Properties

- [request](#ctxtrequest)
- [workflowUUID](#ctxtworkflowuuid)
- [authenticatedUser](#ctxtauthenticateduser)
- [logger](#ctxtlogger)
- [span](#ctxtspan)

#### Methods

- [getConfig(key)](#ctxtgetconfigkey)

#### ctxt.request

```typescript
readonly request: HTTPRequest
```

This property exposes an HTTP request object, which contains details about the originating HTTP request that triggered this function, either directly or through its calling chain.
It has the following structure:

```typescript
export interface HTTPRequest {
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

#### ctxt.workflowUUID

```typescript
readonly workflowUUID: string
```

This property exposes the current workflow's [identity UUID](../tutorials/workflow-tutorial#workflow-identity), a 128-bit UUID in string format that uniquely identifies that workflow's execution.
In a transaction or communicator, this field is set to the identity UUID of the calling workflow.
In a handler, this field is empty.

#### ctxt.authenticatedUser

```typescript
readonly authenticatedUser: string
```

This property exposes the identity of the authenticated user who ran this function.
Authenticated users are set by [authentication middleware](..) and inherited through the calling chain.

#### ctxt.logger

```typescript
readonly logger: OperonLogger
```

This property provides access to Operon's logging functionality.
Please see our [logging tutorial](../tutorials/logging.md#logging) for more information.

#### ctxt.span

```typescript
readonly span: Span
```

This property provides access to an [OpenTelemetry Span](https://opentelemetry.io/docs/concepts/signals/traces/#spans) associated with this function.
You can assign custom trace attributes to this span.
Please see our [tracing tutorial](../tutorials/logging.md#tracing) for more information.

#### ctxt.getConfig(key)

```typescript
getConfig(key: string): any
```

This method retrieves a custom property value specified in [application configuration](./configuration.md#application-configuration).

---

### `HandlerContext`

Handlers use `HandlerContext` to invoke other functions, interact with active workflows, and interact directly with HTTP requests and resposes.

#### Properties

- [koaContext](#handlerctxtkoacontext)

#### Methods

- [invoke(targetClass, \[workflowUUID\])](#handlerctxtinvoketargetclass-workflowuuid)
- [retrieveWorkflow(workflowUUID)](#handlerctxtretrieveworkflowworkflowuuid)
- [send(destinationUUID, message, \[topic, idempotencyKey\])](#handlerctxtsenddestinationuuid-message-topic-idempotencykey)
- [getEvent(workflowUUID, key, \[timeoutSeconds\])](#handlerctxtgeteventworkflowuuid-key-timeoutseconds)

#### handlerCtxt.koaContext

```typescript
koaContext: Koa.Context;
```

This property exposes the [Koa Context](https://github.com/koajs/koa/blob/master/docs/api/context.md) of the current request, giving handlers access to the raw HTTP request and response.

#### handlerCtxt.invoke(targetClass, \[workflowUUID\])

```typescript
invoke<T>(targetClass: T, workflowUUID?: string): InvokeFuncs<T>
```

Handlers use `invoke()` to invoke other functions, specifically workflows, transactions, and communicators.

The syntax for invoking function `foo` in class `Bar` with argument `baz` is:

```typescript
handlerCtxt.invoke(Bar).foo(baz)
```

You don't need to supply the context to an invoked function&#8212;the runtime does this for you.

When calling transactions or communicators, `invoke()` asynchronously returns the function's output.
When calling workflows, `invoke()` asynchronously returns a [`handle`](./workflow-handles) for the workflow.

You can optionally provide a UUID idempotency key to the invoked function.
For more information, see our [idempotency tutorial](../tutorials/idempotency-tutorial.md).

#### handlerCtxt.retrieveWorkflow(workflowUUID)

```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>
```

This method returns a [workflow handle](./workflow-handles.md) for the workflow with the input [identity UUID](../tutorials/workflow-tutorial#workflow-identity).
The type `R` is the return type of the target workflow.

#### handlerCtxt.send(destinationUUID, message, \[topic, idempotencyKey\])

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>
```

This method sends a message to a destination workflow identity.
Messages can optionally be associated with a topic and are queued on the receiver per topic.
You can optionally provide an idempotency key to guarantee only a single message is sent even if `send` is called more than once.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### handlerCtxt.getEvent(workflowUUID, key, \[timeoutSeconds\])

```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

This method retrieves a value published by a workflow identity for a given key using the [events API](../tutorials/workflow-communication-tutorial#events-api).
A call to `getEvent` waits for the value to be published, returning `null` if the wait times out.

---

### `WorkflowContext`

Workflows use `WorkflowContext` to invoke other functions and interact with other workflows.

#### Methods

- [invoke(targetClass)](#workflowctxtinvoketargetclass)
- [childWorkflow(wf, ...args)](#workflowctxtchildworkflowwf-args)
- [send(destinationUUID, message, \[topic\])](#workflowctxtsenddestinationuuid-message-topic)
- [recv(\[topic, timeoutSeconds\])](#workflowctxtrecvtopic-timeoutseconds)
- [setEvent(key, value)](#workflowctxtseteventkey-value)

#### workflowCtxt.invoke(targetClass)

```typescript
invoke<T>(targetClass: T, workflowUUID?: string): InvokeFuncs<T>
```

Workflows use `invoke()` to invoke other functions, specifically transactions and communicators.
To invoke other workflows, use [`childWorkflow`](#workflowctxtchildworkflowwf-args).

The syntax for invoking function `foo` in class `Bar` with argument `baz` is:

```typescript
workflowCtxt.invoke(Bar).foo(baz)
```

You don't need to supply the context to an invoked function&#8212;the runtime does this for you.

#### workflowCtxt.childWorkflow(wf, ...args)

```typescript
childWorkflow<T extends any[], R>(wf: OperonWorkflow<T, R>, ...args: T): Promise<WorkflowHandle<R>>
```

Workflows use `childWorkflow()` to invoke another workflow.
This returns a [workflow handle](./workflow-handles) for the new workflow.

The syntax for invoking workflow `foo` in class `Bar` with argument `baz` is:

```typescript
const workflowHandle = await ctxt.childWorkflow(Bar.foo, baz)
```

#### workflowCtxt.send(destinationUUID, message, \[topic\])

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string): Promise<void>
```

This method sends a message to a destination workflow identity.
Messages can optionally be associated with a topic and are queued on the receiver per topic.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### workflowCtxt.recv(\[topic, timeoutSeconds\])

```typescript
recv<T extends NonNullable<any>>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

Workflows use `recv()` receive messages sent to their identity, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `null` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### workflowCtxt.setEvent(key, value)

```typescript
setEvent<T extends NonNullable<any>>(key: string, value: T): Promise<void>
```

A workflow can call `setEvent()` to immutably emit a key-value pair associated with its identity.
Any handler can read the event by calling [`getEvent`](#handlerctxtgeteventworkflowuuid-key-timeoutseconds) with the workflow's identity UUID.
If a workflow has already set an event for a particular key, setting it again is an error.
For more information, see our [events API tutorial](../tutorials/workflow-communication-tutorial#events-api).

---

### `TransactionContext<T>`

Transactions use `TransactionContext` to interact with the database.

#### Generic Type Parameter

`TransactionContext` is typed generically based on the application database client in use.
The application database client is configurable in a project's [configuration file (`user_dbclient`)](./configuration).
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

#### Properties

- [client](#transactionctxtclient)

#### transactionCtxt.client

```typescript
client: T; // One of [Knex, EntityManager, PrismaClient]
```

The `client` property provides access to the chosen application database client.
A transaction function should only interact with the application database using this client.

---

### `CommunicatorContext`

Communicators use `CommunicatorContext` to retrieve information on communicator configuration.

#### Properties

- [retriesAllowed](#communicatorctxtretriesallowed)
- [maxAttempts](#communicatorctxtmaxattempts)

#### communicatorCtxt.retriesAllowed

```typescript
readonly retriesAllowed: boolean;
```

This property specifies whether the communicator is automatically retried on failure.
Retries are configurable through the [`@OperonCommunicator`](./decorators#operoncommunicator) decorator.

#### communicatorCtxt.maxAttempts

```typescript
readonly maxAttempts: number;
```

This property specifies the maximum number of times the communicator is to be retried.
Retries are configurable through the [`@OperonCommunicator`](./decorators#operoncommunicator) decorator.
