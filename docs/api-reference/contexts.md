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

-------

## Background Information

A context is the first argument of any Operon functions, which provides critical methods for interacting with other functions and the database, and passes useful information along the call graph of functions.
The context must be consistent with the decorator you apply to it.
Different types of contexts are not interchangeable:
- All types of contexts share the same properties and methods defined in the base [`OperonContext`](#operoncontext).
- The first argument of a handler must takes in a [`HandlerContext`](#handlercontext).
- The first argument of a workflow must takes in a [`WorkflowContext`](#workflowcontext).
- The first argument of a transaction must takes in a [`TransactionContext<T>`](#transactioncontextt) with a specific database client type.
- The first argument of a communicator must takes in a [`CommunicatorContext`](#communicatorcontext).

------

## Contexts Reference

### `OperonContext`
The `OperonContext` is the base of all other types of contexts.
You don't directly use this base context in your functions, but when an Operon function invokes other functions using its context, Operon automatically propagates the properties of its base context across invocations.

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
The `request` property includes useful information of an HTTP request (all fields are optional and may be `undefined`):
```typescript
export interface HTTPRequest {
  headers?: IncomingHttpHeaders;  // A node's http.IncomingHttpHeaders object.
  rawHeaders?: string[];          // Raw headers.
  params?: unknown;               // Parsed path parameters from the URL.
  body?: unknown;                 // parsed HTTP body as an object.
  rawBody?: string;               // Unparsed raw HTTP body string.
  query?: ParsedUrlQuery;         // Parsed query string.
  querystring?: string;           // Unparsed raw query string.
  url?: string;                   // Request URL.
  ip?: string;                    // Request remote address.
}
```

#### ctxt.workflowUUID

```typescript
readonly workflowUUID: string
```

The `workflowUUID` property is the current workflow's [identity UUID](../tutorials/workflow-tutorial#workflow-identity), a 128-bit UUID in string format that uniquely identifies that workflow's execution.

Operon passes the identity UUID of a workflow to the contexts of transactions and communicators it invokes.
If a workflow invokes a [child workflow](..), the context of the child workflow will have the parent's UUID as the prefix.

This field is an empty string in [`HandlerContext`](#handlercontext), as a handler is not part of any workflows.

#### ctxt.authenticatedUser
```typescript
readonly authenticatedUser: string
```
The `authenticatedUser` property is the identity of the current authenticated user that runs this function.
The [authentication middleware](..) parses the HTTP request and returns this identity.
Operon passes the authenticated user identity when an Operon function uses its context to invoke other functions.

#### ctxt.logger
```typescript
readonly logger: OperonLogger
```
The `logger` property is a global logger that provides useful methods for logging at multiple levels.
Please see our [logging tutorial](../tutorials/logging.md#logging) for more information.

#### ctxt.span
```typescript
readonly span: Span
```
The `span` property is the current [OpenTelemetry Span](https://opentelemetry.io/docs/concepts/signals/traces/#spans).
You can set custom trace attributes to this span. Please see our [tracing tutorial](../tutorials/logging.md#tracing) for more information.


#### ctxt.getConfig(key)
```typescript
getConfig(key: string): any
```
The `getConfig()` method returns the value/object of the specified [application configuration](./configuration.md#application-configuration).

----

### `HandlerContext`

The `HandlerContext` is the first argument of handler functions, which extends `OperonContext` and provides additional information on the HTTP request and response, and contains useful methods to invoke other functions and interact with workflows.

#### Properties
- [koaContext](#handlerctxtkoacontext)

#### Methods
- [invoke(targetClass, \[workflowUUID\])](#handlerctxtinvoketargetclass-workflowuuid)
- [retrieveWorkflow(workflowUUID)](#handlerctxtretrieveworkflowworkflowuuid)
- [send(destinationUUID, message, \[topic, idempotencyKey\])](#handlerctxtsenddestinationuuid-message-topic-idempotencykey)
- [getEvent(workflowUUID, key, \[timeoutSeconds\])](#handlerctxtgeteventworkflowuuid-key-timeoutseconds)

#### handlerCtxt.koaContext
```typescript
koaContext: Koa.Context
```
The `koaContext` property stores the [Koa Context](https://github.com/koajs/koa/blob/master/docs/api/context.md) of the current request serving.
It allows handlers to have full access and control over the raw request and response objects.
Please see our [HTTP serving](../tutorials/http-serving-tutorial.md) for more information.

#### handlerCtxt.invoke(targetClass, \[workflowUUID\])
 ```typescript
invoke<T>(targetClass: T, workflowUUID?: string): InvokeFuncs<T>
```
The `invoke()` method returns a list of workflows, transactions, and communicators in the specified `targetClass`.
We transform each returned function to exclude its first parameter (the context) and only contain the tail parameters, so you can then invoke a function without needing to worry about how to construct the first context parameter.

For example, as we show in [Programming Quickstart](../getting-started/quickstart-programming-1.md), you only need to provide the second parameter `name` when you invoke `helloTransaction`.
```typescript
handlerCtxt.invoke(Hello).helloTransaction(name);
```

Optionally, you can pass in an [idempotency key](../tutorials/idempotency-tutorial.md) to guarantee the invocation only executes once.
You should not store the returned list and reuse it, because each idempotency key should only be used once.

#### handlerCtxt.retrieveWorkflow(workflowUUID)
```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>
```
The `retrieveWorkflow()` method returns a [Workflow Handle](./workflow-handles.md) for the workflow that has the given identity UUID.
The type `R` is the return type of the target workflow.

#### handlerCtxt.send(destinationUUID, message, \[topic, idempotencyKey\])
```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>
```
The `send()` method sends a provided message to a destination workflow identity. Messages can optionally be associated with a `topic` and are queued on the receiver per topic. The message queue by default allows duplicated messages, but you can specify an `idempotencyKey` for the message to be sent exactly once.
The type `T` is the type of the message (non-nullable).

#### handlerCtxt.getEvent(workflowUUID, key, \[timeoutSeconds\])
```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```
The `getEvent` method retrieves the value published by a workflow identity for a given key.
Optionally, you can specify a `timeoutSeconds` so the method would return `null` if the value is still unavailable after the specified time period.
The type `T` is the type of the message (non-nullable).

-------

### `WorkflowContext`

#### Properties

#### Methods

-------

### `TransactionContext<T>`

The `TransactionContext` is the first argument of transaction functions, which extends `OperonContext` and provides a user database client for functions to execute data operations transactionally.

#### Generic Type Parameter
Transaction context has a generic type parameter `TransactionContext<T extends UserDatabaseClient>`, where Operon currently supports:

[Knex](https://knexjs.org/guide/#typescript)
```typescript
import { Knex } from "knex";
// TransactionContext<Knex>
```

[TypeORM EntityManager](https://orkhan.gitbook.io/typeorm/docs/entity-manager-api)
```typescript
import { EntityManager } from "typeorm";
// TransactionContext<EntityManager>
```

[PrismaClient](https://www.prisma.io/docs/concepts/components/prisma-client)
```typescript
import { PrismaClient } from "@prisma/client"
// TransactionContext<PrismaClient>
```

The provided type must be consistent with the [`user_dbclient` configuration](./configuration.md#user_dbclient).
Operon guarantees that all data operations executed in a transaction function belong to the same transaction.

#### Properties
- [client](#transactionctxtclient)

#### transactionCtxt.client
```typescript
client: T // One of [Knex, EntityManager, PrismaClient]
```
The `client` property is a Knex/TypeORM Entity Manager/PrismaClient object.
A transaction function should only interact with the user database using this client.


--------

### `CommunicatorContext`
The `CommunicatorContext` is the first argument of communicator functions, which extends `OperonContext` and provides information on the communicator's configuration.

#### Properties
- [retriesAllowed](#communicatorctxtretriesallowed)
- [maxAttempts](#communicatorctxtmaxattempts)

#### communicatorCtxt.retriesAllowed
```typescript
readonly retriesAllowed: boolean;
```
The `retriesAllowed` property specifies whether the communicator can be automatically retried on failures.

#### communicatorCtxt.maxAttempts
```typescript
readonly maxAttempts: number;
```
The `maxAttempts` property specifies the maximum number of retries (if allowed) on failures.  
