---
sidebar_position: 4
title: DBOS Class
description: API reference for DBOS
---

# DBOS Class

The `DBOS` static utility class is the heart of the DBOS Transact programming API.  `DBOS` provides decorators to identify key application functions, and static access to context-dependent state.  `DBOS` has no instance members and is not to be instantiated.

:::info
Note that this is the second major version of the TypeScript API.  The first version of the API was based on passing [contexts](./contexts.md) and used a separate set of [decorators](./decorators.md).  It is fine to use both approaches in the same DBOS application, however the `DBOS` class is simpler and is therefore recommended.
:::

## Decorating Workflows, Transactions, and Steps
DBOS provides reliability guarantees for programs that are [written as workflows comprised of steps, transactions, and child workflows](../programming-guide.md).  The workflow, transaction, and step functions are marked with decorators.

### `@DBOS.workflow`
`@DBOS.workflow` registers a function as a DBOS workflow.  

```typescript
@DBOS.workflow(config?: WorkflowConfig)
```

When called, `workflow` functions are wrapped such that they will be [run to completion exactly once](../tutorials/idempotency-tutorial.md).

`@DBOS.workflow()` takes an optional [`WorkflowConfig`](#workflow-configuration) object.

#### Decorating Static Methods
Workflow functions must be class members, and may be `static`.  To mark a `static` member function as a workflow, simply place the `@DBOS.workflow()` decorator above it.

Example:
```typescript
import { DBOS } from '@dbos-inc/dbos-sdk';

class Workflows
{
  // Mark a static method as a DBOS workflow
  @DBOS.workflow()
  static async processWorkflow(value: string) {
    ...
  }
}
```

#### Decorating Instance Methods
Workflow functions may also be instance methods.

This requires a few more steps.  For instance methods to work, each class instance must be given a name and registered with DBOS, so that a corresponding instance can be found for workflow recovery.  This is done with `DBOS.configureInstance`:

```typescript
DBOS.configureInstance(cls: Constructor, name: string, ...args: unknown[]) : R
```

The arguments to `DBOS.configureInstance` are:
* `cls`: The class to be instantiated and configured.  This class must extend `ConfiguredInstance`.
* `name`: The name for the configured instance (which must be unique within the set of instances of the same class)
* `...args`: Any additional arguments to pass to the constructor function `cls`.

Configured classes must extend from the following abstract class:
```typescript
export abstract class ConfiguredInstance {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  abstract initialize(ctx: InitContext): Promise<void>;
}
```

The `ConfiguredInstance` base class provides naming information, and also declares the `initialize` function which will be called after the DBOS runtime has started, but before workflow processing commences.  The argument to `initialize` is an [`InitContext`](../reference/contexts.md#initcontext), which provides access to configuration and other information.

Example:
```typescript
import { DBOS, ConfiguredInstance } from '@dbos-inc/dbos-sdk';

class MyClass extends ConfiguredInstance
{
  constructor(name: string) {
    super(name);
  }

  async initialize() {
    // Do initialization work
    return Promise.resolve();
  }

  // Define workflows, transactions, steps, ...
}

const myObj = DBOS.configureInstance(MyClass, 'myname', args);
```

Note that while this will create and register the `myObj` object instance, initialization via the object's `initialize()` method will be deferred until later, after database connections have been established.

#### Workflow Examples

The following example workflow will be used in the sections below:
```typescript
import { DBOS, ConfiguredInstance, WorkflowQueue } from '@dbos-inc/dbos-sdk';

class Workflows extends ConfiguredInstance
{
  // Mark a static method as a DBOS workflow (see above)
  @DBOS.workflow()
  static async processWorkflow(value: string) {
    ...
  }

  // Mark an instance method as a DBOS workflow
  @DBOS.workflow()
  processInstanceWorkflow(value: string) {
    ...
  }

  // Needed to assign an instance name, see "Instance Methods" below
  constructor(name: string) {
    super(name);
  }

  // Initialize an instance, see "Instance Methods" below
  async initialize() {
    return Promise.resolve();
  }
}

// Create and register an object instance for executing workflows
const workflowInstance = DBOS.configureInstance(Workflows, 'InstanceA');
```

#### Calling Workflow Functions
Functions that are registered as workflows with `@DBOS.workflow` can be called directly like regular async functions, but will receive DBOS execution guarantees.

```typescript
// Run functions directly
const result1 = await Workflows.processWorkflow("value1");
const result2 = await workflowsInstance.processInstanceWorkflow("value2");
```

##### Starting Background Workflows
Workflow functions can also be started asynchronously using `DBOS.startWorkflow`.  When run with `DBOS.startWorkflow`, the function will run in the background, and a `WorkflowHandle` is returned from `DBOS`.  This [handle](../reference/workflow-handles.md) can be used to [interact with the workflow](#interacting-with-workflows) or await its result with `getResult()`.

```typescript
DBOS.startWorkflow<T extends ConfiguredInstance>(targetInstance: T, params?: StartWorkflowParams): InvokeFunctionsAsyncInst<T>;
DBOS.startWorkflow<T extends object>(targetClass: T, params?: StartWorkflowParams): InvokeFunctionsAsync<T>;

interface StartWorkflowParams {
  workflowID?: string;
  queueName?: string;
}
```

The optional `StartWorkflowParams` parameter allows the following to be controlled:
* workflowID: The [workflow ID](#assigning-workflow-ids) for the started workflow
* queueName: The name of the [workflow queue](#using-workflow-queues) for the workflow

Examples:
```typescript
// Run static functions asynchronously and get the result later
const handle3 = await DBOS.startWorkflow(Workflows).processWorkflow("value3");
// ...
const result3 = await handle3.getResult();

// Run instance functions asynchronously and get the result later
const handle4 = await DBOS.startWorkflow(workflowInstance).processInstanceWorkflow("value4");
// ...
const result4 = await handle4.getResult();

// Run static functions asynchronously on a queue, with an assigned ID, and get the result later
const handle5 = await DBOS.startWorkflow(Workflows, {workflowID: 'unique wf id', queueName: wfq.name})
  .processWorkflow("value5");
// ...
const result5 = await handle3.getResult();

```

##### Using Workflow Queues
By default, the `startWorkflow` method [described above](#starting-background-workflows) always starts the target workflow immediately.  If it is desired to control the concurrency or rate of workflow invocations, a [`queue`](../reference/workflow-queues.md) can be specified.

```typescript
DBOS.withWorkflowQueue<R>(wfq: string, callback: ()=>Promise<R>) : Promise<R>
```

The `DBOS.withWorkflowQueue` function runs the provided `callback` function and returns its result.  Any workflows started within `callback` will be run on the queue named by `wfq`.

Example:
```typescript
// Create a workflow queue for use below
const wfq = new WorkflowQueue("example_queue", 10, {limitPerPeriod: 50, periodSec: 30});

// Run a workflow on the queue, and await the result
const qres = await DBOS.withWorkflowQueue(wfq.name, async ()=>{
  return await Workflows.processWorkflow("value q");
});

// Start a workflow on the queue, and return a handle to the running workflow
const qhandle = await DBOS.withWorkflowQueue(wfq.name, async ()=>{
  return await DBOS.startWorkflow(Workflows).processWorkflow("value q h");
});
//...
const qhres = await qhandle.getResult();
```

##### Assigning workflow IDs
Specifying a workflow ID is useful if the intent is to start a workflow exactly once for a given circumstance.  Assignment of [workflow IDs](../tutorials/idempotency-tutorial.md) can be done with `DBOS.withNextWorkflowID`.

```typescript
DBOS.withNextWorkflowID<R>(wfid: string, callback: ()=>Promise<R>) : Promise<R>
```

The `DBOS.withNextWorkflowID` function runs the provided `callback` function and returns its result.  The first workflow started within `callback` will be assigned the ID specified by `wfid`.

```typescript
// Assign and idempotency key to the workflow, run syncronously
const result5 = await DBOS.withNextWorkflowID('<wfid_value>', async() => {
  return await workflowInstance.processInstanceWorkflow("value5");
});

// Assign an idempotency key to the workflow, run asynchronously
const handle6 = await DBOS.withNextWorkflowID('<wfid_value>', async() => {
  return await DBOS.startWorkflow(Workflows).processWorkflow("value6");
});
// ...
const result6 = await handle6.getResult();
```

#### Workflow Configuration
`@DBOS.workflow()` takes an optional `WorkflowConfig` object:

```typescript
interface WorkflowConfig {
  maxRecoveryAttempts?: number; // The maximum number of times the workflow may be automatically recovered. Defaults to 50.
}
```

DBOS automatically attempts to recover workflows.  As a safety measure, The `maxRecoveryAttempts` configuration option is used to set the maximum number of times the workflow will be automatically recovered.  If a workflow exceeds this limit, its status is set to `RETRIES_EXCEEDED` and it is no longer retried automatically, though it may be retried manually.
This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue) so that a buggy workflow that crashes its application (for example, by running it out of memory) is not retried infinitely.

### `@DBOS.transaction`
`@DBOS.transaction` registers a function as a DBOS transaction.  Such functions will be provided with database access via a [SQL client](#accesing-sql-database-clients).

```typescript
@DBOS.transaction(config?: TransactionConfig)
```

Functions decorated with `@DBOS.transaction` may be called directly, either inside or outside of workflows.  Functions decorated with `@DBOS.transaction` must be class members, and may be either `static` or [instance methods](#decorating-instance-methods).

`@DBOS.transaction()` takes an optional `TransactionConfig` object:

```typescript
interface TransactionConfig {
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
}
```

DBOS supports declaration of the following values for `IsolationLevel`:
- `READ UNCOMMITTED`
- `READ COMMITTED`
- `REPEATABLE READ`
- `SERIALIZABLE`

The transaction semantics of these levels are defined for PostgreSQL [here](https://www.postgresql.org/docs/current/transaction-iso.html).

A transaction function should be marked as read-only if it doesn't contain any database writes, as it may execute faster, and any inadvertent attempts to write to the database may be caught.  If a transaction function is marked as `readOnly: true` but it contains database writes, it will throw an error at runtime (for example `ERROR:  cannot execute INSERT in a read-only transaction`).

Example:
```typescript
@DBOS.transaction({readOnly: true})
static async doLogin(username: string) {
  ...
}
```

#### Accesing SQL Database Clients
Within a transaction function, the following read-only property is available from the `DBOS` class:
```typescript
DBOS.sqlClient: UserDatabaseClient
```

The following aliases are also available, depending on the database driver or ORM [`app_db_client` that has been configured](../reference/configuration.md#database):
```typescript
DBOS.pgClient: PoolClient
DBOS.prismaClient: PrismaClient
DBOS.knexClient: Knex
DBOS.typeORMClient: TypeORMEntityManager
DBOS.drizzleClient: DrizzleClient
```

For more details, see:
* [Drizzle](../tutorials/using-drizzle.md)
* [Knex](../tutorials/using-knex.md)
* [Prisma](../tutorials/using-prisma.md)
* [TypeORM](../tutorials/using-typeorm.md)

### `@DBOS.step`
`@DBOS.step` registers a function as a DBOS step.  Such functions are a key building block of DBOS's [reliable workflows](../tutorials/workflow-tutorial.md).
The result of each invocation of a function decorated with `@DBOS.step` is stored in the DBOS system database.  This checkpoint of the execution state allows function calls to be skipped during workflow replay, if the step is known to have completed previously.

```typescript
@DBOS.step(config?: StepConfig)
```

Functions decorated with `@DBOS.step` may be called directly, either inside or outside of workflows.  Functions decorated with `@DBOS.step` must be class members, and may be either `static` or [instance methods](#decorating-instance-methods).

`@Step()` takes an optional `StepConfig`, which allows a number of step properties to be specified:

```typescript
export interface StepConfig {
  retriesAllowed?: boolean; // Should failures be retried? (default true)
  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).
  maxAttempts?: number;     // Maximum number of retry attempts (default 3). If errors occur more times than this, throw an exception.
  backoffRate?: number;     // Multiplier by which the retry interval increases after a retry attempt (default 2).
}
```

Example:
```typescript
@DBOS.step()
static async sendToServer(valueToSend: string) {
  ...
}
```

## Accessing Application Functions Requiring Context Arguments
Prior versions of the DBOS SDK were based on functions that took a [`context`](./contexts.md#dboscontext) as the first argument.  It is possible to call these old-style step and transaction functions from new workflows via the `DBOS.invoke` syntax:

```typescript
DBOS.invoke<T extends ConfiguredInstance>(targetInst: T): InvokeFuncsInst<T>;
DBOS.invoke<T extends object>(targetClass: T): InvokeFuncs<T>
```

Example:
```typescript
class MyClass {
  // Older dercorator, function takes `ctx` for SQL access
  @Transaction()
  static async transactionFunction(ctx: TransactionContext, arg: string) {
    //...
  }
}

// Call with `DBOS.invoke`
const res = DBOS.invoke(MyClass).transactionFunction('arg');
```

## Durable Sleep

Within a DBOS workflow, waiting or sleeping should not be done using standard system functions, as these will not be skipped on workflow replay.  Instead, the "durable sleep" functions below should be used.  The wakeup time will be stored in the database when the function is first called, and if the workflow is re-executed, it will not oversleep.

```typescript
DBOS.sleepms(durationMS: number): Promise<void>
DBOS.sleep(durationSec: number): Promise<void>
```

* DBOS.sleep: sleep for `durationSec` seconds.
* DBOS.sleepms: sleep for `durationMS` milliseconds.

These functions work in any context, and will use the system sleep if no workflow is in progress.

## Interacting With Workflows

### Sending And Receiving Messages

`DBOS.send` and `DBOS.recv` allows the sending of messages to a specific [workflow](../tutorials/workflow-tutorial#workflow-identity).  Workflows may wait for the message to be received before proceeding.

#### `DBOS.send`
```typescript
DBOS.send<T>(destinationID: string, message: T, topic?: string): Promise<void>
```
`DBOS.send()` to send a message to a workflow, identified by `destinationID`.  Messages can optionally be associated with a topic and are queued on the receiver per topic.  `DBOS.send` may be called from other workflows, or anywhere else, to pass information to a corresponding `DBOS.recv` call.

For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### `DBOS.recv`
```typescript
DBOS.recv<T>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```
`DBOS.recv` must be called from within a workflow, and will receive messages sent to the workflow, optionally for a particular topic.
Messages are dequeued first-in, first-out, from a queue associated with the topic.
Calls to `recv()` wait for the next message in the queue, returning `null` if the wait times out.
If no topic is specified, `recv` can only access messages sent without a topic.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### Reliability Guarantees

All messages are persisted to the database, so if `DBOS.send()` completes successfully, the destination workflow is guaranteed to be able to `DBOS.recv()` it.  `DBOS.recv()` consumes the message, but also advances the receiving workflow, so messages are received exactly once.
If you're sending a message from within a workflow, we guarantee exactly-once delivery because [workflows are reliable](../tutorials/workflow-tutorial#reliability-guarantees).
If you're sending a message from outside of a workflow, you can run `DBOS.send` with an [idempotency key](#assigning-workflow-ids) to guarantee exactly-once delivery.

### Setting and Getting Events

The event API allows workflows to emit events, which may be awaited.  Events are key-value pairs.  Events are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.  Events must be set from within workflow functions, but may be awaited anywhere.

#### `DBOS.setEvent`
```typescript
DBOS.setEvent<T>(key: string, value: T): Promise<void>
```

Creates or updates an event named `key`, setting its value to `value`.
The event can then be read by calling [`DBOS.getEvent`](#dbosgetevent) with the workflow's ID, from within another workflow, or elsewhere.
Events are mutable.  Attempting to emit an event twice from a given workflow instance will update the value, but care should be taken to ensure that the value is calculated deterministically for consistency when workflows are recovered.
For more information, see our [events API tutorial](../tutorials/workflow-communication-tutorial#events-api).

#### `DBOS.getEvent`
```typescript
DBOS.getEvent<T>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by `workflowID` for a given `key` using the [events API](../tutorials/workflow-communication-tutorial#events-api).
`getEvent()` returns a `Promise`.  `await`ing the promise will retrieve the value once the workflow has set the key, or return `null` if the wait times out.

#### Reliability Guarantees

All events are persisted to the database, so once an event it set, it is guaranteed to always be retrievable.

## Finding and Retrieving Workflows
Information about workflows that are either running or have already been completed can be retrieved from the workflow ID.  The workflow history can also be searched by other criteria, such as the user, function, or queue name.

### `DBOS.getWorkflowStatus`
`DBOS.getWorkflowStatus` retrieves the status of a single workflow, given its workflow ID.  If the workflow ID specified has not been used to start a workflow, the returned `Promise` will resolve to `null`.

```typescript
DBOS.getWorkflowStatus(workflowID: string): Promise<WorkflowStatus | null>
```

The `WorkflowStatus` returned has the following field definition:
```typescript
interface WorkflowStatus {
  readonly status: string; // The status of the workflow.  One of PENDING, SUCCESS, ERROR, RETRIES_EXCEEDED, ENQUEUED, or CANCELLED.
  readonly workflowName: string; // The name of the workflow function.
  readonly workflowClassName: string; // The class name holding the workflow function.
  readonly workflowConfigName: string; // The name of the configuration, if the class needs configuration
  readonly queueName?: string; // The name of the queue, if workflow was queued
  readonly authenticatedUser: string; // The user who ran the workflow. Empty string if not set.
  readonly assumedRole: string; // The role used to run this workflow.  Empty string if authorization is not required.
  readonly authenticatedRoles: string[]; // All roles the authenticated user has, if any.
  readonly request: HTTPRequest; // The parent request for this workflow, if any.
}
```

### `DBOS.retrieveWorkflow`
Similar to [`DBOS.getWorkflowStatus`](#dbosgetworkflowstatus), `DBOS.retrieveWorkflow` retrieves a single workflow by its id, but returns a [`WorkflowHandle`](../reference/workflow-handles.md).  This handle provides status, but also allows other workflow interactions.

```typescript
DBOS.retrieveWorkflow(workflowID: string)
```

### `DBOS.getWorkflows`
`DBOS.getWorkflows` allows querying workflow execution history.

```typescript
DBOS.getWorkflows(input: GetWorkflowsInput): Promise<GetWorkflowsOutput>
```

Its `GetWorkflowsInput` argument is an object describing which workflows to retrieve (by default, retrieve all workflows):
```typescript
interface GetWorkflowsInput {
  workflowName?: string; // The name of the workflow function
  authenticatedUser?: string; // The user who ran the workflow.
  startTime?: string; // Timestamp in RFC 3339 format
  endTime?: string; // Timestamp in RFC 3339 format
  status?: "PENDING" | "SUCCESS" | "ERROR" | "RETRIES_EXCEEDED" | "CANCELLED" ; // The status of the workflow.
  applicationVersion?: string; // The application version that ran this workflow.
  limit?: number; // Return up to this many workflows IDs. IDs are ordered by workflow creation time.
}
```

`getWorkflows` returns as output an object containing a list of the [Workflow IDs](../tutorials/idempotency-tutorial.md) of all retrieved workflows, ordered by workflow creation time:

```typescript
export interface GetWorkflowsOutput {
  workflowUUIDs: string[];
}
```

To obtain further information about a particular workflow, call [`retrieveWorkflow`](#dbosretrieveworkflow) on its ID to obtain a [handle](./workflow-handles.md).

### `DBOS.getWorkflowQueue`
`DBOS.getWorkflowQueue` allows querying workflow execution history for a given [workflow queue](../reference/workflow-queues.md).

```typescript
DBOS.getWorkflowQueue(input: GetWorkflowQueueInput): Promise<GetWorkflowQueueOutput>
```

Its `GetWorkflowQueueInput` argument is an object describing which workflows to retrieve (by default, retrieve all workflows):
```typescript
export interface GetWorkflowQueueInput {
  queueName?: string; // The name of the workflow queue
  startTime?: string; // Timestamp in ISO 8601 format
  endTime?: string; // Timestamp in ISO 8601 format
  limit?: number; // Return up to this many workflows IDs. IDs are ordered by workflow creation time.
}
```

`getWorkflowQueue` returns as output an object containing a list of the [Workflow IDs](../tutorials/idempotency-tutorial.md) of all retrieved workflows, ordered by workflow creation time.  The returned array lists some other details about the workflows also:
```typescript
export interface GetWorkflowQueueOutput {
  workflows: {
    workflowID: string; // Workflow ID
    queueName: string; // Workflow queue name
    createdAt: number; // Time that queue entry was created
    startedAt?: number; // Time that workflow was started, if started
    completedAt?: number; // Time that workflow completed, if complete
  }[];
}
```

To obtain further information about a particular workflow, call [`retrieveWorkflow`](#dbosretrieveworkflow) on its ID to obtain a [handle](./workflow-handles.md).

## Accessing Configuration, Logging, and Tracing Facilities

### `DBOS.getConfig`
```typescript
DBOS.getConfig<T>(key: string): T | undefined
DBOS.getConfig<T>(key: string, defaultValue: T): T
```
Retrieves an application property specified in the [application section of the configuration](./configuration.md#application).
Optionally accepts a default value, returned when the key cannot be found in the configuration.

The entire configuration may also be accessed:
```typescript
DBOS.dbosConfig?: DBOSConfig; // The 
DBOS.runtimeConfig?: DBOSRuntimeConfig;
```

Note that `DBOS.dbosConfig` and `DBOS.runtimeConfig` are not fully available util runtime initialization starts and the configuration files are loaded.

### Accessing Logging
Using `DBOS.logger` is the preferred logging method, as this will return a context-dependent logger if available, or the global logger otherwise.  It is also possible to access the global logger via `DBOS.globalLogger`.

```typescript
DBOS.logger: DLogger
DBOS.globalLogger?: DLogger;
```

### Accessing The Tracing Span
The current tracing span can be read via `DBOS.span`:
```typescript
DBOS.span: Span | undefined
```

## Checking Function Context
The following properties of the `DBOS` class return information about the current execution state:
```typescript
DBOS.workflowID: string
DBOS.isInTransaction: boolean
DBOS.isInStep: boolean
DBOS.isInWorkflow: boolean
DBOS.isWithinWorkflow: boolean
```

`DBOS.workflowId`: Return the ID of the current workflow, if any
`DBOS.isInTransaction`: Returns true if the current context is executing a transaction function
`DBOS.isInStep`: Returns true if the current context is executing a step function
`DBOS.isInWorkflow`: Returns true if the current context is executing a workflow, and not currently in a step or transaction
`DBOS.isWithinWorkflow`: Returns true if the current context is executing a workflow, regardless of whether or not it is currently in a step or transaction

## HTTP Handling
DBOS Transact optionally provides HTTP handling.  This uses a serverless design, based on the Koa framework.  Endpoint functions are simply annotated with HTTP handling decorators.

This provides the following features over using Koa directly:
* Argument validation
* A generated list of endpoint functions and their arguments
* Automatic generation of [OpenAPI](../tutorials/openapi-tutorial.md) clients
* Automatic configuration from `dbos-config.yaml` or the runtime environment
* Automatic network configuration in DBOS Cloud
* Default tracing, parsing, and other middleware, with [additional options](../tutorials/http-serving-tutorial.md#body-parser)

The following sections describe the decorators that can be used to register methods for HTTP serving.  Note that all decorated methods must be `static`, as there is no mechanism to forward function calls to a specific object instance.

### `@DBOS.getApi`
```typescript
@DBOS.getApi(url: string)
```

Associates a function with an HTTP URL accessed via GET.

```typescript
@DBOS.getApi("/hello")
static async hello() {
  return { message: "hello!" };
}
```

The `@DBOS.getApi` decorator can be used by itself, but can also be combined with [`@DBOS.transaction`](#dbostransaction), [`@DBOS.workflow`](#dbosworkflow), or [`@DBOS.step`](#dbosstep) to serve those operations via HTTP.

Endpoint paths may have placeholders, which are parts of the URL mapped to function arguments.  These are represented by a section of the path prefixed with a `:`.

```typescript
@DBOS.getApi("/:id")
static async exampleGet(id: string) {
  DBOS.logger.info(`${id} is parsed from the URL path parameter`)
}
```

#### `@DBOS.postApi`
```typescript
@DBOS.postApi(url: string)
```

Associates a function with an HTTP URL accessed via POST. Analogous to [`@DBOS.getApi`](#dbosgetapi), but may parse arguments from a request body.

```typescript
@DBOS.postApi("/:id")
static async examplePost(id: string, name: string) {
  DBOS.logger.info(`${id} is parsed from the URL path parameter, ${name} is parsed from the request body`)
}
```

#### `@DBOS.putApi`
```typescript
@DBOS.putApi(url: string)
```

Associates a function with an HTTP URL accessed via PUT. Analogous to [`@DBOS.getApi`](#dbosgetapi), but may parse arguments from a request body.

```typescript
@DBOS.putApi("/:id")
static async examplePut(id: string, name: string) {
  DBOS.logger.info(`${id} is parsed from the URL path parameter, ${name} is parsed from the request body`)
}
```

#### `@DBOS.patchApi`
```typescript
@DBOS.patchApi(url: string)
```

Associates a function with an HTTP URL accessed via PATCH. Analogous to [`@DBOS.getApi`](#dbosgetapi), but may parse arguments from a request body.

```typescript
@DBOS.patchApi("/:id")
static async examplePatch(id: string, name: string) {
  DBOS.logger.info(`${id} is parsed from the URL path parameter, ${name} is parsed from the request body`)
}
```

#### `@DBOS.deleteApi`
```typescript
@DBOS.deleteApi(url: string)
```

Associates a function with an HTTP URL accessed via DELETE. Analogous to [`@DBOS.getApi`](#dbosgetapi).

```typescript
@DBOS.deleteApi("/:id")
static async exampleDelete(id: string) {
  DBOS.logger.info(`${id} is parsed from the URL path parameter`)
}
```

### Accessing HTTP Context
Methods decorated as above will be called in response to HTTP requests.  Details of the request, and the Koa context, can be accessed by the following properties of the `DBOS` class:

```typescript
DBOS.request: HTTPRequest // HTTP rquest object
DBOS.koaContext: Koa.Context // Koa context, including response, any middleware information, and output control
```

### Middleware
For details on middleware, argument processing, and data validation, see [HTTP Decorators](../reference/decorators.md#http-api-registration-decorators) or the [HTTP Handling Tutorial](../tutorials/http-serving-tutorial.md).

### HTTP Testing
```typescript
DBOS.getHTTPHandlersCallback(): (req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse) => Promise<void>;
```

The [node-native](https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener) request handler for DBOS Transact's internal HTTP service can be accessed with `DBOS.getHTTPHandlersCallback()`.  This callback can then be used for testing purposes in frameworks such as [supertest](https://www.npmjs.com/package/supertest).

For example, using  to send a `GET` request to the `/greeting/dbos` URL and verify the response:
```typescript
import request from "supertest";

const res = await request(DBOS.getHTTPHandlersCallback()).get(
  "/greeting/dbos"
);
expect(res.statusCode).toBe(200);
expect(res.text).toMatch("Hello, dbos! You have been greeted");
```

## Declarative Role-Based Security
DBOS supports declarative, role-based security. Functions can be decorated with a list of roles (as strings), and execution of the function is forbidden unless the authenticated user has at least one role in the list.  A list of roles can be provided as a class-level default with `@DBOS.defaultRequiredRole()`, in which case it applies to any DBOS function in the class.  Roles for individual functions can be specified with the `@DBOS.requiredRole()` decorator.  The roles listed in a  `@DBOS.requiredRole()` method decorator will override any class-level defaults.

The following decorators configure role-based security:
```typescript
@DBOS.defaultRequiredRole(anyOf: string[])
@DBOS.requiredRole(anyOf: string[])
```

### `@DBOS.requiredRole`
Specify the list of required roles for the decorated method. In order to execute the function, the authenticated user must have at least one role on the specified list.

```typescript
@RequiredRole(['user','guest'])
@DBOS.getApi("/hello")
static async helloUser() {
  return { message: "hello registered user or guest!" };
}
```

### `@DBOS.DefaultRequiredRole`
Specify default required roles for all methods in the class. This can be overridden at the method level with `@DBOS.requiredRole`.

```typescript
@DBOS.defaultRequiredRole(['user'])
class OperationEndpoints {
  // Authentication / authorization not required for this function
  @DBOS.requiredRole([])
  @DBOS.getApi("/hello")
  static async hello() {
    return { message: "hello!" };
  }

  // Role with elevated permissions required for this function
  @DBOS.requiredRole(['admin'])
  @DBOS.getApi("/helloadmin")
  static async helloadmin() {
    return { message: "hello admin!" };
  }

  // Required role will be 'user', from DBOS.defaultRequiredRole
  @DBOS.getApi("/otherfunction")
  static async otherFunc() {
    return { message: "hello admin!" };
  }
}
```

### Retrieving The Authenticated User and Roles
The following property on `DBOS` retrieves the current authenticated user:
```typescript
DBOS.authenticatedUser: string
```

The authentication system can also provide the list of roles that are granted to the user.  This list is accessed via `DBOS.authenticatedRoles`.
```typescript
DBOS.authenticatedRoles: string[]
```

If the current DBOS function required authorization, the role assumed to access the function can be retrieved via `DBOS.assumedRole`.  This role will be one of the [required roles](#declarative-role-based-security) for the function, and is taken from the `DBOS.authenticatedRoles` list.
```typescript
DBOS.assumedRole: string
```

## Scheduled Workflows
DBOS workflow functions may be executed on a schedule via the `@DBOS.scheduled` decorator:
```typescript
@DBOS.scheduled(schedulerConfig?: SchedulerConfig)
```

Workflows decorated with `@DBOS.scheduled` will be run on the specified schedule, with guarantees such as executing exactly once per scheduled interval.

By default, the workflow is executed exactly once per scheduled interval.  This means executions might be started concurrently and can overlap, and that if the application is taken down and restarted, makeup work will be performed.  A workflow idempotency key (consisting of the workflow function name and scheduled time) is used to deduplicate any workflows that may inadvertently be initiated by the scheduler.

The schedule is specified in a format similar to a traditional [`crontab`](https://en.wikipedia.org/wiki/Cron), with the following notes:
. The 5\- and 6\-field versions are supported, if the optional 6th field is prepended it indicates second-level granularity, otherwise it is minute\-level.
. ',' is supported to indicate a list of values, so '0 0,12 \* \* \*' executes at midnight and noon every day.
. '/' is supported to indicate divisibility, so '\*/5 \* \* \* \*' indicates every 5 minutes.
. '\-' is supported to indicate ranges, so '0 9\-17 \* \* \*' indicates every hour (on the hour) from 9am to 5pm.
. Long and short month and weekday names are supported \(in English\).

Two scheduling modes are currently supported:
- *SchedulerMode.ExactlyOncePerInterval*: The workflow execution schedule begins when the decorated function is first deployed and activated.  If the application is deactivated, missed executions will be started when the application is reactivated, such that the workflow is executed exactly once per scheduled interval (starting from when the function is first deployed).
- *SchedulerMode.ExactlyOncePerIntervalWhenActive*: Similar to `ExactlyOncePerInterval`, except that any workflow executions that would have occurred when the application is inactive are not made up.

The `@DBOS.scheduled` decorator's configuration object is:
```typescript
export class SchedulerConfig {
    crontab : string = '* * * * *'; // Every minute by default
    mode ?: SchedulerMode = SchedulerMode.ExactlyOncePerInterval; // How to treat intervals
    queueName ?: string;
}
```

The decorated method takes the following parameters:
- The time that the run was scheduled (as a `Date`).
- The time that the run was actually started (as a `Date`).  This can be used to tell if an exactly-once workflow was started behind schedule.

Example:
```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";

class ScheduledExample{
  @DBOS.scheduled({crontab: '*/5 * * * * *', mode: SchedulerMode.ExactlyOncePerIntervalWhenActive})
  @DBOS.workflow()
  static async scheduledFunc(schedTime: Date, startTime: Date) {
    DBOS.logger.info(`
        Running a workflow every 5 seconds -
          scheduled time: ${schedTime.toISOString()} /
          actual start time: ${startTime.toISOString()}
    `);
  }
}
```

### Concurrency and Rate Limiting
By default, `@DBOS.scheduled` workflows are started immediately, including any make-up work identified when a VM starts.  If `queueName` is specified in the `SchedulerConfig`, then the workflow will be enqueued in a [workflow queue](https://docs.dbos.dev/typescript/reference/workflow-queues) and subject to rate limits.

### `crontab` Specification
The `crontab` format is based on the well-known format used in the [`cron`](https://en.wikipedia.org/wiki/Cron) scheduler.

The crontab field contains 5 or 6 items, separated by spaces:

```
 ┌────────────── second (optional)
 │ ┌──────────── minute
 │ │ ┌────────── hour
 │ │ │ ┌──────── day of month
 │ │ │ │ ┌────── month
 │ │ │ │ │ ┌──── day of week
 │ │ │ │ │ │
 │ │ │ │ │ │
 * * * * * *
```

#### Second Field Format
```
*|number[-number][,number[-number]...][/divisor]
```
Each 'number' is in the range [0-59].  The range of 'divisor' is [2-59].

`*` is interpreted as [0-59].

#### Minute Field Format:
```
*|number[-number][,number[-number]...][/divisor]
```

Each 'number' is in the range [0-59].  The range of 'divisor' is [2-59].

`*` is interpreted as [0-59].

#### Hour Field Format:
````
*|number[-number][,number[-number]...][/divisor]
````
Each 'number' is in the range [0-23].  The range of 'divisor' is [2-23].

`*` is interpreted as [0-23].

#### Day Of Month Field Format
```
*|number[-number][,number[-number]...][/divisor]
```
Each 'number' is in the range [1-31].  The range of 'divisor' is [2-31].

`*` is interpreted as [1-31].

#### Month Field Format
```
*|number[-number][,number[-number]...][/divisor]
```
Each 'number' is in the range [1-12].  The range of 'divisor' is [2-12].

`*` is interpreted as [1-12].

The following symbolic names can be placed instead of numbers, and are case-insensitive:
```
'january',   'jan' -> 1
'february',  'feb' -> 2
'march',     'mar' -> 3
'april',     'apr' -> 4
'may',       'may' -> 5
'june',      'jun' -> 6
'july',      'jul' -> 7
'august',    'aug' -> 8
'september', 'sep' -> 9
'october',   'oct' -> 10
'november',  'nov' -> 11
'december',  'dec' -> 12
```

#### Day Of Week Field Format
```
*|number[-number][,number[-number]...][/divisor]
```
Each 'number' is in the range [0-7], with 0 and 7 both corresponding to Sunday.  The range of 'divisor' is [2-7].

`*` is interpreted as [0-6].

The following symbolic names can be placed instead of numbers, and are case-insensitive:
```
'sunday',    'sun' -> 0
'monday',    'mon' -> 1
'tuesday',   'tue' -> 2
'wednesday', 'wed' -> 3
'thursday',  'thu' -> 4
'friday',    'fri' -> 5
'saturday'   'sat' -> 6
```

#### Matching
For a scheduled workflow to run at a given time, the time must match the crontab pattern.
A time matches the pattern if all fields of the time match the pattern.
Each field matches the pattern if its numerical value is within any of the inclusive ranges provided in the field, and is also divisible by the divisor.

## Application Lifecycle
For DBOS applications using entrypoint classes specified in [`dbos-config.yaml`](../reference/configuration), a "serverless" application lifecycle is handled automatically.  However, it is possible to build a custom application lifecycle.

### Setting The Application Configuration
If the DBOS configuration should not be loaded from `dbos-config.yaml`, it may be provided programatically with `DBOS.setConfig`:
```typescript
DBOS.setConfig(config: DBOSConfig, runtimeConfig?: DBOSRuntimeConfig)
```

If `runtimeConfig` is provided, the runtime will be started when the app is launched with `DBOS.launch`, including HTTP handling for decorated methods.  If `runtimeConfig` is not provided, this will not occur.

### Launching and Shutting Down
The DBOS app can be started with `launch` and stopped with `shutdown`.
```typescript
DBOS.launch(httpApps?: DBOSHttpApps)
DBOS.shutdown()
```

* `launch`: This starts the DBOS app, or registers it to be started in conjunction with a provided HTTP server.  Launching will initialize all DBOS components, run any application initializers, start workflow recovery, start event processing, and start HTTP services (if so configured).
* `shutdown`: This stops the DBOS app.  First, handling of new events and requests is disabled, and then the workflow executor and database connections are destroyed.

### Recovering Workflows
DBOS generally recovers workflows automatically.  However, this process can be initiated externally.

```typescript
DBOS.recoverPendingWorkflows(executorIDs: string[] = ["local"]): Promise<WorkflowHandle<unknown>[]>
DBOS.executeWorkflowById(workflowId: string, startNewWorkflow: boolean = false): Promise<WorkflowHandle<unknown>>
```

* `DBOS.recoverPendingWorkflows`: Retrieves a list of workflows to recover, and starts them, returning their handles
* `DBOS.executeWorkflowById`: Starts executing a workflow given its `workflowId`.  If `startNewWorkflow` is `true`, the workflow is cloned and assigned a new unique workflow ID.

## Extensibility
DBOS Transact allows libraries, such as those designed to receive external events, to initiate DBOS functions.

### Decorators
Such libraries may choose to implement method decorators.  If the method decorator is registering a function with DBOS Transact, it should call `DBOS.registerAndWrapContextFreeFunction` for functions that do not accept a context as the first parameter.

```typescript
DBOS.registerAndWrapContextFreeFunction<This, Args extends unknown[], Return>(
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(this: This, ...args: Args) => Promise<Return>>,
)
```

`DBOS.registerAndWrapContextFreeFunction` registers the function named `propertyKey` on the `target` class, creates a wrapper function, and updates the `descriptor` to use the wrapper function.

### Calling DBOS Functions From Event Dispatchers
DBOS functions that are decorated as `DBOS.workflow`, `DBOS.transaction`, or `DBOS.step`, can be run directly from event receiver dispatch loops.

For more complex circumstances, such as invoking functions with a context argument, `DBOS.executor` provides access to the [`DBOSExecutorContext` interface](../reference/contexts.md#dbosexecutorcontext).

#### Setting Authenticated User And Roles
When calling DBOS functions, it may be desired to set context variables, such as the authenticated user, and the current tracing span.  The following functions can be used for these purposes:

```typescript
// Set the authenticated user, and roles allowed by the authentication system for the scope of the callback() function
DBOS.withAuthedContext<R>(authedUser: string, authedRoles: string[], callback: () => Promise<R>): Promise<R>

// Set the tracing span for the scope of the callback() function
DBOS.withTracedContext<R>(callerName: string, span: Span, request: HTTPRequest, callback: () => Promise<R>): Promise<R>

// Set the caller name for the scope of the callback() function
DBOS.withNamedContext<R>(callerName: string, callback: () => Promise<R>): Promise<R>
```

#### Example
In the following example, the `TestSecurity.testWorkflow` function is executed for authenticated user "joe", with role "user". 
````typescript
  const hijoe = await DBOS.withAuthedContext('joe', ['user'], async() => {
    return await TestSecurity.testWorkflow('joe');
  });
````
