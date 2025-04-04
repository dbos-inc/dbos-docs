---
sidebar_position: 3
title: DBOS Contexts
description: API reference for DBOS contexts
---

:::note
This document describes a deprecated DBOS Transact v1 API, in which `DBOSContext` objects were passed around.  DBOS code should now be written using decorators and function calls from the [`DBOS` class](../dbos-class.md).
:::

## Background

DBOS automatically supplies a _context_ to each registered function.
A function can use its context to call other DBOS functions, interact with the runtime or the database, and access the logger.
Each DBOS function has a specific context:

- Contexts used within DBOS functions inherit from [`DBOSContext`](#dboscontext).
- Handlers use [`HandlerContext`](#handlercontext).
- Workflows use [`WorkflowContext`](#workflowcontext).
- Transactions use [`TransactionContext<T>`](#transactioncontextt) with a specific database client type.
- Steps use [`StepContext`](#stepcontext).

---

## `DBOSContext`

Many contexts inherit from `DBOSContext` and share its properties and methods.

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

The current workflow's [identity UUID](../../../tutorials/workflow-tutorial#workflow-ids-and-idempotency), a string uniquely identifying a workflow execution.
In a transaction or step, this field is set to the identity UUID of the calling workflow.
In a handler, this field is empty.

#### `ctxt.authenticatedUser`

```typescript
readonly authenticatedUser: string
```

The identity of the authenticated user who ran this function.
Authenticated users are set by [authentication middleware](../../../tutorials/authentication-authorization) and inherited through the calling chain.

#### `ctxt.authenticatedRoles`

```typescript
readonly authenticatedRoles: string[];
```

A list of roles the authenticated user has, if any.
Authenticated roles are set by [authentication middleware](../../../tutorials/authentication-authorization) and inherited through the calling chain.

#### `ctxt.assumedRole`

```typescript
readonly assumedRole: string;
```

The role used to run this function.
Empty string if authorization is not required.
DBOS's [authorization](../../../tutorials/authentication-authorization#authorization-decorators) sets the assumed role right before executing a function and this property is *not* inherited through the calling chain.

#### `ctxt.logger`

```typescript
readonly logger: DBOSLogger
```

A reference to DBOS's logger.
Please see our [logging tutorial](../../../tutorials/logging.md) for more information.

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

Retrieves an application property specified in the application section of the configuration.
Optionally accepts a default value, returned when the key cannot be found in the configuration.

---

## `HandlerContext`

Handlers use `HandlerContext` to invoke other functions, interact with active workflows, and interact directly with HTTP requests and responses.

### Properties

- [koaContext](#handlerctxtkoacontext)

### Methods

- [invoke(target)](#handlerctxtinvoke)
- [invokeWorkflow(target, \[workflowID\])](#handlerctxtinvokeworkflow)
- [startWorkflow(target, \[workflowID\], \[queue\])](#handlerctxtstartworkflow)
- [retrieveWorkflow(workflowID)](#handlerctxtretrieveworkflow)
- [send(destinationUUID, message, \[topic, idempotencyKey\])](#handlerctxtsend)
- [getEvent(workflowID, key, \[timeoutSeconds\])](#handlerctxtgetevent)

#### `handlerCtxt.koaContext`

```typescript
koaContext: Koa.Context;
```

The [Koa Context](https://github.com/koajs/koa/blob/master/docs/api/context.md) of the current request, giving handlers access to the raw HTTP request and response.

#### `handlerCtxt.invoke`

```typescript
invoke<T>(target: T, workflowID?: string): InvokeFuncs<T>
```

Invoke a transaction or step on the `target` class or configured instance.
To invoke workflows, use [`invokeWorkflow`](#handlerctxtinvokeworkflow) or [`startWorkflow`](#handlerctxtstartworkflow) instead.
The syntax for invoking function `fn` in class `Cls` with argument `arg` is:

```typescript
const output = await handlerCtxt.invoke(Cls).fn(arg);
```

You don't supply a context to the invoked function&#8212;the DBOS Transact runtime does this for you.
You can optionally provide an idempotency key to the invoked function.
For more information, see our [idempotency tutorial](../../../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency).

#### `handlerCtxt.invokeWorkflow`

```typescript
invokeWorkflow<T>(target: T, workflowID?: string): InvokeFuncs<T>
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

Start or enqueue a workflow and return a [handle](../workflow-handles.md) to it.
This does not wait for the workflow to complete, though the resulting handle can be used to wait for the workflow result.
To start a workflow and wait for the result, see [`invokeWorkflow`](#handlerctxtinvokeworkflow).
The `startWorkflow` method resolves after the handle is durably created; at this point the workflow is guaranteed to [run to completion](../../../tutorials/workflow-tutorial.md#reliability-guarantees) even if the handler is interrupted.

The syntax for starting workflow `wf` in class `Cls` with argument `arg` is:

```typescript
const workflowHandle = await handlerCtxt.startWorkflow(Cls).wf(arg);
```

If the `workflowID` argument is provided, the workflow will [execute exactly once per the specified ID](../../../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency).

If the `queue` argument is provided, the workflow may not start immediately.  Start of execution will be determined by the [queue](../workflow-queues.md#class-workflowqueue) and its contents.

You don't supply a context to the newly started workflow&#8212;the DBOS Transact runtime does this for you.

#### `handlerCtxt.retrieveWorkflow`

```typescript
retrieveWorkflow<R>(workflowID: string): WorkflowHandle<R>
```

Returns a [workflow handle](../workflow-handles.md) to the workflow with [identity](../../../tutorials/workflow-tutorial#workflow-ids-and-idempotency) `workflowID`.
`R` is the return type of the target workflow.

#### `handlerCtxt.send`

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>
```

Sends a message to workflow `destinationUUID`.
Messages can optionally be associated with a topic.
You can provide an optional idempotency key to guarantee only a single message is sent even if `send` is called more than once.

#### `handlerCtxt.getEvent`

```typescript
getEvent<T extends NonNullable<any>>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by `workflowID` for a given key using the [events API](../../../tutorials/workflow-tutorial.md#workflow-events).
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

It returns as output an object containing a list of the [UUIDs](../../../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) of all retrieved workflows, ordered by workflow creation time:

```typescript
export interface GetWorkflowsOutput {
  workflowUUIDs: string[];
}
```

To obtain further information about a particular workflow, call [`retrieveWorkflow`](#handlerctxtretrieveworkflow) on its UUID to obtain its [handle](../workflow-handles.md).

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
- [retrieveWorkflow(workflowID)](#workflowctxtretrieveworkflow)
- [sleep(durationSec)](#workflowcontextsleep)
- [sleepms(durationMS)](#workflowcontextsleepms)

#### `workflowCtxt.invoke`

```typescript
invoke<T>(target: T, workflowID?: string): InvokeFuncs<T>
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

Start a child workflow and return a [handle](../workflow-handles.md) to it but do not wait for the workflow to complete.
This method resolves after the handle is durably created; at this point the workflow is guaranteed to [run to completion](../../../tutorials/workflow-tutorial.md#reliability-guarantees).
The syntax for starting workflow `wf` in class `Cls` with argument `arg` is:

```typescript
const workflowHandle = await ctxt.startWorkflow(Cls).wf(arg);
```

If the `workflowID` argument is provided, the workflow will [execute exactly once per the specified ID](../../../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency).

If the `queue` argument is provided, the workflow may not start immediately.  Start of execution will be determined by the [queue](../workflow-queues.md#class-workflowqueue) and its contents.


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
For more information, see the [messages API tutorial](../../../tutorials/workflow-tutorial.md#workflow-messaging-and-notifications).

#### `workflowCtxt.recv`

```typescript
recv<T extends NonNullable<any>>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

Receive messages sent to the workflow, optionally for a particular topic.
Messages are dequeued first-in, first-out, from a queue associated with the topic.
Calls to `recv()` wait for the next message in the queue, returning `null` if the wait times out.
If no topic is specified, `recv` can only access messages sent without a topic.
For more information, see the [messages API tutorial](../../../tutorials/workflow-tutorial.md#workflow-messaging-and-notifications).

#### `workflowCtxt.setEvent`

```typescript
setEvent<T extends NonNullable<any>>(key: string, value: T): Promise<void>
```

Creates or updates an event named `key` with value `value`.
Workflows and HTTP handlers can read events by calling [`getEvent`](#handlerctxtgetevent) with the workflow's UUID.
Events are mutable.  Attempting to emit an event twice from a given workflow instance will update the value, but care should be taken to ensure that the value is calculated deterministically for consistency when workflows are recovered.
For more information, see the [events API tutorial](../../../tutorials/workflow-tutorial.md#workflow-events).

#### `workflowCtxt.getEvent`

```typescript
getEvent<T extends NonNullable<any>>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by `workflowID` for a given key using the [events API](../../../tutorials/workflow-tutorial.md#workflow-events).
Awaiting on the promise returned by `getEvent()` waits for the workflow to set the key, returning `null` if the wait times out.

#### `workflowCtxt.retrieveWorkflow`

```typescript
retrieveWorkflow<R>(workflowID: string): WorkflowHandle<R>
```

Returns a [workflow handle](../workflow-handles.md) to the workflow with [identity](../../../tutorials/workflow-tutorial#workflow-ids-and-idempotency) _workflowID_.
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
The application database client is configurable in a project's [configuration file](../../configuration) (`app_db_client`).
DBOS currently supports the following clients:

**Knex**

```typescript
import { Knex } from "knex";
static async exampleTransaction(ctxt: TransactionContext<Knex>, ...)
```

**TypeORM**

```typescript
import { EntityManager } from "typeorm";
static async exampleTransaction(ctxt: TransactionContext<EntityManager>, ...)
```

**Prisma**

```typescript
import { PrismaClient } from "@prisma/client";
static async exampleTransaction(ctxt: TransactionContext<PrismaClient>, ...)
```

**Drizzle**

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
Configurable through the [`@Step`](./olddecorators#step) decorator.

#### `stepCtxt.maxAttempts`

```typescript
readonly maxAttempts: number;
```

Maximum number of retries for the step.
Configurable through the [`@Step`](./olddecorators#step) decorator.

---

## `CommunicatorContext`

`CommunicatorContext` is a historical synonym for [`StepContext`](#stepcontext), as steps are frequently used to communicate with external systems.

---

## Information Available Outside Of Contexts

:::note
This document describes a deprecated DBOS Transact v1 API, in which `DBOSContext` objects were passed around.  All information available from contexts is now also available directly from the [`DBOS` class](../dbos-class.md).
:::
