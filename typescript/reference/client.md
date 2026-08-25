---
sidebar_position: 50
title: DBOS Client
---

`DBOSClient` provides a programmatic way to interact with your DBOS application from external code.
`DBOSClient` includes methods similar to `DBOS`.
that make sense to be used outside of a DBOS workflow or step, such as `enqueueWorkflow` or `getEvent`.

:::note 
`DBOSClient` is included in the `@dbos-inc/dbos-sdk` package, the same package that used by DBOS applications.
Where DBOS applications use the static `DBOS` class,
external applications use the `DBOSClient` class instead.
:::

### class DBOSClient

```ts
interface EnqueueOptions {
    workflowName: string;
    workflowClassName?: string;
    workflowConfigName?: string;
    queueName: string;
    workflowID?: string;
    appVersion?: string;
    workflowTimeoutMS?: number;
    deduplicationID?: string;
    priority?: number;
    delaySeconds?: number;
    queuePartitionKey?: string;
    duplicationPolicy?: 'reject' | 'return-existing';
    attributes?: Record<string, unknown>;
    applicationName?: string;
}

class DBOSClient {
    static create({systemDatabaseUrl, systemDatabasePool, serializer, systemDatabaseSchemaName, systemDatabasePoolSize, systemDatabasePollingConcurrency, logger, applicationName}: {systemDatabaseUrl: string, systemDatabasePool?: Pool, serializer?: DBOSSerializer, systemDatabaseSchemaName?: string, systemDatabasePoolSize?: number, systemDatabasePollingConcurrency?: number, logger?: DLogger, applicationName?: string}): Promise<DBOSClient>
    destroy(): Promise<void>;
    get applicationName(): string | undefined;

    enqueue<T extends (...args: any[]) => Promise<any>>(
        options: ClientEnqueueOptions,
        ...args: Parameters<T>
    ): Promise<WorkflowHandle<Awaited<ReturnType<T>>>>;
    enqueueInTransaction<T extends (...args: any[]) => Promise<any>>(
        client: ClientBase,
        options: ClientEnqueueOptions,
        ...args: Parameters<T>
    ): Promise<WorkflowHandle<Awaited<ReturnType<T>>>>;
    send<T>(destinationID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>;
    sendInTransaction<T>(client: ClientBase, destinationID: string, message: T, topic?: string, idempotencyKey?: string, options?: ClientSendOptions): Promise<void>;
    getEvent<T>(workflowID: string, key: string, options?: GetEventOptions): Promise<T | null>;
    retrieveWorkflow<T = unknown>(workflowID: string): WorkflowHandle<Awaited<T>>;
    waitFirst(handles: WorkflowHandle<any>[], options?: { pollingIntervalMs?: number }): Promise<WorkflowHandle<any>>;
    waitAll<R>(handles: WorkflowHandle<R>[], options?: { pollingIntervalMs?: number }): Promise<WorkflowHandle<R>[]>;
    readStream<T>(workflowID: string, key: string, options?: ReadStreamOptions): AsyncGenerator<T, void, unknown>;
    readStreamOffset<T>(workflowID: string, key: string, offset: number, options?: ReadStreamOffsetOptions): Promise<T>;

    getWorkflow(workflowID: string): Promise<WorkflowStatus | undefined>;
    listWorkflows(input: GetWorkflowsInput): Promise<WorkflowStatus[]>;
    listQueuedWorkflows(input: GetWorkflowsInput): Promise<WorkflowStatus[]>;
    listWorkflowSteps(workflowID: string, options?: ListWorkflowStepsOptions): Promise<StepInfo[] | undefined>;

    setWorkflowDelay(workflowID: string, options: SetWorkflowDelayOptions): Promise<void>;
    cancelWorkflow(workflowID: string, options?: { cancelChildren?: boolean }): Promise<void>;
    cancelWorkflows(workflowIDs: string[], options?: { cancelChildren?: boolean }): Promise<void>;
    resumeWorkflow(workflowID: string, options?: { queueName?: string }): Promise<void>;
    resumeWorkflows(workflowIDs: string[], options?: { queueName?: string }): Promise<void>;
    forkWorkflow(workflowID: string, startStep: number,
        options?: { newWorkflowID?: string; applicationVersion?: string; timeoutMS?: number; queueName?: string; queuePartitionKey?: string; replacementChildren?: Record<string, string> }): Promise<string>;

    registerQueue(name: string, options?: RegisterQueueOptions & { applicationName?: string }): Promise<WorkflowQueue>;
    retrieveQueue(name: string): Promise<WorkflowQueue | null>;
    listQueues(applicationName?: string | string[]): Promise<WorkflowQueue[]>;
    deleteQueue(name: string): Promise<void>;

    createSchedule(options: { scheduleName: string; workflowName: string; workflowClassName?: string; schedule: string; context?: unknown; options?: { automaticBackfill?: boolean; cronTimezone?: string; queueName?: string }; applicationName?: string }): Promise<void>;
    updateSchedule(name: string, updates: { schedule?: string; context?: unknown; automaticBackfill?: boolean; cronTimezone?: string | null; queueName?: string | null }): Promise<void>;
    listSchedules(filters?: { status?: string | string[]; workflowName?: string | string[]; scheduleNamePrefix?: string | string[]; applicationName?: string | string[] }): Promise<WorkflowSchedule[]>;
    getSchedule(name: string): Promise<WorkflowSchedule | null>;
    deleteSchedule(name: string): Promise<void>;
    pauseSchedule(name: string): Promise<void>;
    resumeSchedule(name: string): Promise<void>;
    applySchedules(schedules: Array<{ scheduleName: string; workflowName: string; workflowClassName?: string; schedule: string; context?: unknown; automaticBackfill?: boolean; cronTimezone?: string; queueName?: string; applicationName?: string }>): Promise<void>;
    backfillSchedule(name: string, start: Date, end: Date): Promise<WorkflowHandle<unknown>[]>;
    triggerSchedule(name: string): Promise<WorkflowHandle<unknown>>;

    listApplicationVersions(): Promise<VersionInfo[]>;
    getLatestApplicationVersion(): Promise<VersionInfo>;
    setLatestApplicationVersion(versionName: string, options?: { applicationName?: string }): Promise<void>;

    renameApplication(oldName: string | undefined, newName: string, options?: { batchSize?: number | null; adoptUnclaimedRows?: boolean }): Promise<ApplicationRowCounts>;
}
```

#### `create`

You construct a `DBOSClient` with the static `create` function.

**Parameters:**
- **systemDatabaseUrl**: A connection string to your Postgres database. See the [configuration docs](./configuration.md) for more detail.
- **systemDatabasePool**: An optional custom `node-postgres` connection pool to use instead of creating a new one. If provided, the client will use this pool for all database operations, and `systemDatabasePoolSize` is ignored. The pool remains yours: its configuration is your responsibility (we recommend attaching an `error` handler to it so connection failures are handled), and [`destroy`](#destroy) does not close it.
- **serializer**: An optional custom serializer. If your DBOS application uses [custom serialization](./configuration.md#custom-serialization), you must provide the same serializer to the client to correctly deserialize workflow results and events.
- **systemDatabaseSchemaName**: An optional Postgres schema name for DBOS system tables. Defaults to `dbos`. If your DBOS application uses a [custom schema name](./configuration.md#database-connection-settings), you must provide the same schema name to the client.
- **systemDatabasePoolSize**: An optional maximum size for the system database connection pool. Defaults to 10.
- **systemDatabasePollingConcurrency**: An optional maximum number of concurrent database-backed polling reads from wait operations. See [`systemDatabasePollingConcurrency`](./configuration.md#database-connection-settings) in the configuration reference. Defaults to half the pool size (minimum 1).
- **logger**: An optional [custom logger](../tutorials/logging.md#custom-logger) implementing the `DLogger` interface, to which the client directs all its logging, replacing the built-in console logger.
- **applicationName**: The application on whose behalf this client acts. Workflows the client enqueues and queues and schedules it registers are owned by that application, and the client's listing operations default to that application's rows. Always set this if multiple applications share a system database.

Example:

```ts
import { DBOSClient } from "@dbos-inc/dbos-sdk";

const client = await DBOSClient.create({systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL});
```

#### `destroy`

Asynchronously destroys a `DBOSClient` instance, releasing the resources it holds.
A custom connection pool passed in through [`systemDatabasePool`](#create) is left open for you to close.

### Workflow Interaction

#### `enqueue`

Enqueues a workflow, similar to passing a queue name to `DBOS.startWorkflow`.
Like `startWorkflow`, the `enqueue` method returns a `WorkflowHandle` that you can use to retrieve the workflow results 
asynchronously from an external application.

When enqueuing a workflow from within a DBOS application, the workflow and queue metadata can be retrieved automatically.
However, since `DBOSClient` runs outside the DBOS application, the metadata must be specified explicitly.

Required metadata includes:

* **workflowName**: The name of the workflow method being enqueued.
* **queueName**: The name of the queue to enqueue the workflow on.

Additional but optional metadata includes:

* **workflowClassName**: The name of the class the workflow method is a member of, if any.
* **workflowConfigName**: If the workflow is an instance method (of class `workflowClassName`), the name of the [instance](./workflows-steps.md#instance-method-workflows).
* **workflowID**: The unique ID for the enqueued workflow. If left undefined, DBOS Client will generate a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier). Please see [Workflow IDs and Idempotency](../tutorials/workflow-tutorial#workflow-ids-and-idempotency) for more information.
* **appVersion**: The version of your application that should process this workflow. If left undefined, it will be updated to the current version when the workflow is first dequeued.
* **workflowTimeoutMS**: The timeout of this workflow in milliseconds.
* **deduplicationID**: Optionally specified when enqueueing a workflow. At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDuplicatedError` exception.
* **priority**: Optionally specified when enqueueing a workflow. The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
* **delaySeconds**: Delay the workflow by this many seconds before it becomes eligible for execution. The workflow is initially placed in `DELAYED` status and transitions to `ENQUEUED` after the delay expires.
* **queuePartitionKey**: The queue partition in which to enqueue this workflow. Use if and only if the queue is partitioned. In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.
* **duplicationPolicy**: How to handle a collision with another workflow that has the same `deduplicationID` on the same queue. Defaults to `'reject'`.
  * `'reject'`: throw `DBOSQueueDuplicatedError`.
  * `'return-existing'`: return a handle to the existing workflow instead of throwing. Requires `deduplicationID`. Arguments passed by the colliding caller are discarded and the returned handle resolves with the original workflow's result. See [Singleton Workflows](../tutorials/queue-tutorial.md#singleton-workflows).
* **serializationType**: The [serialization strategy](./methods.md#serialization-strategy) for the workflow arguments.
* **attributes**: A record of custom, JSON-serializable key-value attributes to attach to the workflow at creation. Attributes must be a key-value object (not a scalar or array). They are recorded in the workflow's [status](./methods.md#workflow-status) and are searchable via the `attributes` filter of [`listWorkflows`](./methods.md#dboslistworkflows).
* **applicationName**: The application that owns and runs the enqueued workflow. Defaults to the client's own [`applicationName`](#create). Always set `applicationName` either here or in the client constructor if multiple applications share a system database.

In addition to the `EnqueueOptions` described above, you must also provide the workflow arguments to `enqueue`. 
These are passed to `enqueue` after the initial `EnqueueOptions` parameter.

Since DBOS Client works independently of your DBOS application code, `enqueue` accepts whatever arguments you provide it without verifying if they match the workflow's expected argument types.
However, you can get type safety by providing a function declaration type parameter to `enqueue`.
This enables TypeScript to verify that the provided arguments match the provided declaration and to infer the returned `WorkflowHandle` result type.

Untyped Example:

```ts
// Because we did not provide a function type declaration to enqueue,
// there is no way to verify the workflow arguments are of the correct type. 
const handle = await client.enqueue(
    {
        workflowName: 'indexDocument',
        workflowClassName: 'DocumentDetective',
        queueName: 'indexingQueue',
    }, 
    "https://example.com");

// Explicitly specify the result type since we did not provide a 
// function type declaration to enqueue.
const result: number = await handle.getResult();
```

Typed Example:

```ts
// TypeScript type declaration for our sample app workflow
declare class DocumentDetective {
    static indexDocument(url: string): Promise<number>
}

// Because we provided the function type declaration to enqueue, TypeScript
// can validate the workflow parameters and infer the workflow return type.
const handle = await client.enqueue<typeof DocumentDetective.indexDocument>(
    {
        workflowName: 'indexDocument',
        workflowClassName: 'DocumentDetective',
        queueName: 'indexingQueue',
    }, 
    "https://example.com");

// TypeScript can also infer the result type because 
// we provided the function type declaration to enqueue
const result = await handle.getResult();
```

:::tip
 TypeScript automatically generates type declarations during compilation of your DBOS application.
You can copy or import the function type declaration from your application's 
[generated declaration file (aka.d.ts file)](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html).
::: 

#### `enqueueInTransaction`

```typescript
enqueueInTransaction<T extends (...args: any[]) => Promise<any>>(
  client: ClientBase,
  options: ClientEnqueueOptions,
  ...args: Parameters<T>
): Promise<WorkflowHandle<Awaited<ReturnType<T>>>>
```

Similar to [`enqueue`](#enqueue), but performs the enqueue write inside a caller-owned transaction instead of in its own transaction.
This lets you enqueue a workflow **atomically** with your own database writes: either both are committed or both are rolled back.
Pass a `node-postgres` [`Client`](https://node-postgres.com/apis/client) or [`PoolClient`](https://node-postgres.com/apis/pool) with an open transaction as `client`.
The remaining parameters are the same as [`enqueue`](#enqueue).

You own the transaction: `enqueueInTransaction` does not begin, commit, or roll back the transaction, and does not retry on database errors.
You must commit (or roll back) the transaction yourself.
The returned [`WorkflowHandle`](./methods.md#workflow-handles) is created immediately, but the workflow is not enqueued until you commit, so do not call `getResult` on the handle until after the transaction commits.

:::warning
`client` must be connected to your DBOS system database.
:::

**Example syntax:**

```ts
import { Client } from "pg";

const pg = new Client({ connectionString: process.env.DBOS_SYSTEM_DATABASE_URL });
await pg.connect();

await pg.query("BEGIN");
// Perform your own writes on pg here, in the same transaction...
const handle = await client.enqueueInTransaction<typeof DocumentDetective.indexDocument>(
    pg,
    {
        workflowName: "indexDocument",
        workflowClassName: "DocumentDetective",
        queueName: "indexingQueue",
    },
    "https://example.com");
// Until this commits, the workflow does not exist. If you roll back instead, it never does.
await pg.query("COMMIT");

const result = await handle.getResult();
```

For a workflow that takes named arguments (for example, a Python workflow with keyword arguments), use `enqueuePortableInTransaction(client, options, positionalArgs, namedArgs?)`, which is the same operation but serializes arguments in [portable format](../../explanations/portable-workflows.md).

#### `send`

```typescript
send<T>(
  destinationID: string,
  message: T,
  topic?: string,
  idempotencyKey?: string,
  options?: ClientSendOptions
): Promise<void>
```

Sends a message to a specified workflow. Similar to [`DBOS.send`](./methods.md#dbossend).
The optional `ClientSendOptions` parameter allows specifying a [serialization strategy](./methods.md#serialization-strategy) via `serializationType`.

:::warning
Since DBOS Client is running outside of a DBOS application,
it is highly recommended that you use the `idempotencyKey` parameter in order to get exactly-once behavior.
:::

#### `sendInTransaction`

```typescript
sendInTransaction<T>(
  client: ClientBase,
  destinationID: string,
  message: T,
  topic?: string,
  idempotencyKey?: string,
  options?: ClientSendOptions
): Promise<void>
```

Similar to [`send`](#send), but performs the send inside a caller-owned transaction instead of in its own transaction.
This lets you send a message **atomically** with your own database writes: either both are committed or both are rolled back.
Pass a `node-postgres` [`Client`](https://node-postgres.com/apis/client) or [`PoolClient`](https://node-postgres.com/apis/pool) with an open transaction as `client`.
The remaining parameters are the same as [`send`](#send).

You own the transaction: `sendInTransaction` does not begin, commit, or roll back the transaction, and does not retry on database errors.
You must commit (or roll back) the transaction yourself.
The message is not visible to the destination workflow until the transaction commits.

:::warning
`client` must be connected to your DBOS system database.
:::

**Example syntax:**

```ts
// pg is a node-postgres Client connected to the system database, as in enqueueInTransaction above.
await pg.query("BEGIN");
// Perform your own writes on pg here, in the same transaction...
await client.sendInTransaction(pg, destinationID, message, "my-topic", "my-idempotency-key");
// Until this commits, the message is not sent. If you roll back instead, it never is.
await pg.query("COMMIT");
```

#### `getEvent`

Retrieves an event published by workflowID for a given key.
Similar to [DBOS.getEvent](./methods.md#dbosgetevent).
Like `DBOS.getEvent`, accepts a [`GetEventOptions`](./methods.md#dbosgetevent) object with `timeoutSeconds` or `deadlineEpochMS`, plus an optional `pollingIntervalMs`.

#### `retrieveWorkflow`

Retrieves a workflow by ID, similar to [`DBOS.retrieveWorkflow`](./methods.md#dbosretrieveworkflow).
Returns a [WorkflowHandle](./methods.md#workflow-handles) that can be used to retrieve information about the workflow, 
including its current state and its eventual result.

Similar to enqueue, `retrieveWorkflow` can be made type safe by use of a class declaration
and the [ReturnType Utility Class](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypetype).

Example:

```ts
const handle = client.retrieveWorkflow<ReturnType<IndexDocument>>(documentWFID);
const pageCount = await handle.getResult();
```

#### `waitFirst`

```typescript
waitFirst(
  handles: WorkflowHandle<unknown>[],
  options?: { pollingIntervalMs?: number }
): Promise<WorkflowHandle<unknown>>
```

Wait for any one of the given workflow handles to complete and return the first completed handle.
Similar to [`DBOS.waitFirst`](./methods.md#dboswaitfirst), including the optional `pollingIntervalMs`.

**Parameters:**
- **handles**: A non-empty array of workflow handles to wait on. Throws an error if the array is empty.

#### `waitAll`

```typescript
waitAll<R>(
  handles: WorkflowHandle<R>[],
  options?: { pollingIntervalMs?: number }
): Promise<WorkflowHandle<R>[]>
```

Wait for **all** of the given workflow handles to complete, then return them in the same order (including duplicates).
An empty input array returns immediately with an empty array.
Similar to [`DBOS.waitAll`](./methods.md#dboswaitall), including the optional `pollingIntervalMs`.

`waitAll` only waits for the workflows to finish; it does not return their results. To retrieve results, call `getResult` on the returned handles.

**Parameters:**
- **handles**: An array of workflow handles to wait on.

#### `readStream`

```typescript
readStream<T>(
  workflowID: string,
  key: string,
  options?: ReadStreamOptions
): AsyncGenerator<T, void, unknown>

interface ReadStreamOptions {
  offset?: number;
  pollingIntervalMs?: number;
  timeoutSeconds?: number;
}
```

Read values from a stream as an async generator from outside the DBOS application.
This function reads values from a stream identified by the workflowID and key,
yielding each value in order until the stream is closed or the workflow terminates.
Similar to [`DBOS.readStream`](./methods.md#dbosreadstream), except that client reads are never checkpointed.

**Parameters:**
- **workflowID**: The workflow instance ID that owns the stream.
- **key**: The stream key/name within the workflow.
- **options.offset**: The offset to start reading from. Defaults to `0`, the start of the stream. A higher offset skips that many values from the beginning of the stream, so a reader that was disconnected after consuming _N_ values can resume with `offset: N` instead of replaying the whole stream. Must be a non-negative integer.
- **options.pollingIntervalMs**: The interval, in milliseconds, between system database polls while waiting for new values. Must be at least `1`.
- **options.timeoutSeconds**: How long to wait for **each** value before throwing `DBOSStreamTimeoutError`. The clock restarts every time a value is delivered, so this bounds the gap between values, not the total duration of the read. Defaults to waiting indefinitely.

**Returns:**
- An async generator that yields each value in the stream until the stream is closed.

**Throws:**
- `DBOSStreamTimeoutError`: If `timeoutSeconds` passes without a value arriving.

**Example:**

```ts
for await (const value of client.readStream(workflowID, "example_key")) {
  console.log(`Received: ${JSON.stringify(value)}`);
}
```

#### `readStreamOffset`

```typescript
readStreamOffset<T>(
  workflowID: string,
  key: string,
  offset: number,
  options?: ReadStreamOffsetOptions
): Promise<T>

type ReadStreamOffsetOptions = Omit<ReadStreamOptions, 'offset'>;
```

Read the single value at one offset of a stream, waiting for it to be written.
Similar to [`DBOS.readStreamOffset`](./methods.md#dbosreadstreamoffset).

**Parameters:**
- **workflowID**: The workflow instance ID that owns the stream.
- **key**: The stream key/name within the workflow.
- **offset**: The offset to read. Must be a non-negative integer.
- **options.pollingIntervalMs**: The interval, in milliseconds, between system database polls while waiting for the value. Must be at least `1`.
- **options.timeoutSeconds**: How long to wait for the value before throwing `DBOSStreamTimeoutError`. Defaults to waiting indefinitely.

**Returns:**
- The value at the offset.

**Throws:**
- `DBOSStreamTimeoutError`: If `timeoutSeconds` passes, or if the stream ends before reaching `offset` (no value will ever arrive at that offset).

**Example:**

```ts
const value = await client.readStreamOffset(workflowID, "example_key", 5, { timeoutSeconds: 30 });
```

### Workflow Inspection

#### `getWorkflow`

Retrieves the status of a single workflow, given its workflow ID.
If the specified workflow ID does not exist, getWorkflow returns undefined.
Please see [`DBOS.getWorkflowStatus`](./methods.md#dbosgetworkflowstatus) for more information.

#### `listWorkflows`

Retrieves information about workflow execution history. 
Please see [`DBOS.listWorkflows`](./methods.md#dboslistworkflows) for more for more information.
If the `applicationName` filter is unset, it defaults to the client's own [`applicationName`](#create); a client with no application name retrieves every application's workflows.

#### `listQueuedWorkflows`

Retrieves information about workflow execution history for a given workflow queue. 
Please see [`DBOS.listQueuedWorkflows`](./methods.md#dboslistqueuedworkflows) for more for more information.
If the `applicationName` filter is unset, it defaults to the client's own [`applicationName`](#create); a client with no application name retrieves every application's workflows.

#### `listWorkflowSteps`

Retrieves information about the steps executed in a specified workflow. 
If the specified workflow is not found, `listWorkflowSteps` returns undefined
Please see [`DBOS.listWorkflowSteps`](./methods.md#dboslistworkflowsteps) for more for more information.

### Workflow Management

#### `cancelWorkflow`

Cancels a workflow. If the workflow is currently running, `DBOSWorkflowCancelledError` will be thrown from its next DBOS call.
Please see [`DBOS.cancelWorkflow`](./methods.md#dboscancelworkflow) for more for more information.

#### `cancelWorkflows`

Cancel multiple workflows. Behaves like [`cancelWorkflow`](#cancelworkflow) but operates on a list of workflow IDs.
Please see [`DBOS.cancelWorkflows`](./methods.md#dboscancelworkflows) for more information.

#### `setWorkflowPriority`

Sets the priority of a queued workflow. Only affects workflows with `ENQUEUED` status.
Please see [`DBOS.setWorkflowPriority`](./methods.md#dbossetworkflowpriority) for more information.

#### `setWorkflowDelay`

Set or update the delay on a workflow. Only affects workflows with `DELAYED` status.
Accepts a [`SetWorkflowDelayOptions`](./methods.md#dbossetworkflowdelay) object with `delaySeconds` or `delayUntilEpochMS`.
Please see [`DBOS.setWorkflowDelay`](./methods.md#dbossetworkflowdelay) for more information.

#### `resumeWorkflow`

Resumes a workflow that had stopped during execution (due to cancellation or error).
Please see [`DBOS.resumeWorkflow`](./methods.md#dbosresumeworkflow) for more information.

#### `resumeWorkflows`

Resume multiple workflows. Behaves like [`resumeWorkflow`](#resumeworkflow) but operates on a list of workflow IDs.
Please see [`DBOS.resumeWorkflows`](./methods.md#dbosresumeworkflows) for more information.

#### `forkWorkflow`

Start a new execution of a workflow from a specific step.
Please see [`DBOS.forkWorkflow`](./methods.md#dbosforkworkflow) for more information.

#### `deleteWorkflow`

Delete a workflow and all its associated data from the system database.
Please see [`DBOS.deleteWorkflow`](./methods.md#dbosdeleteworkflow) for more information.

#### `deleteWorkflows`

Delete multiple workflows and all their associated data. Behaves like [`deleteWorkflow`](#deleteworkflow) but operates on a list of workflow IDs.
Please see [`DBOS.deleteWorkflows`](./methods.md#dbosdeleteworkflows) for more information.

### Queue Management

#### `registerQueue`

```typescript
client.registerQueue(
  name: string,
  options?: RegisterQueueOptions & { applicationName?: string },
): Promise<WorkflowQueue>
```

Register a [queue](./queues.md) and persist its configuration to the system database, returning a [`WorkflowQueue`](./queues.md#class-workflowqueue).
Similar to [`DBOS.registerQueue`](./queues.md#dbosregisterqueue).
Options have the same meaning as on `DBOS.registerQueue` except for `onConflict` and `applicationName`:

- `onConflict`:
  - `'always_update'` (default): always overwrite the existing configuration.
  - `'never_update'`: leave any existing configuration unchanged.
  - `'update_if_latest_version'` is **not** supported on the client because clients are not associated with an application version. Passing it throws an error.
- `applicationName`: The application that owns this queue and dequeues workflows from it. Defaults to the client's own [`applicationName`](#create). Registering a queue already owned by a different application throws an error.

**Example syntax:**

```ts
const client = await DBOSClient.create({systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL});
await client.registerQueue("email", {
  globalConcurrency: 10,
  rateLimit: { limitPerPeriod: 100, periodSec: 60 },
});
await client.enqueue({queueName: "email", workflowName: "sendEmail"}, "alice@example.com");
```

#### `retrieveQueue`

```typescript
client.retrieveQueue(name: string): Promise<WorkflowQueue | null>
```

Retrieve a queue by name from the system database, or `null` if no queue with that name has been registered.
Similar to [`DBOS.retrieveQueue`](./queues.md#dbosretrievequeue).

The returned queue is bound to this client's system database; you can read its configuration and call its [`setX`](./queues.md#reconfiguring-queues) methods, but you cannot enqueue on it directly (use [`client.enqueue`](#enqueue) instead).

#### `listQueues`

```typescript
client.listQueues(applicationName?: string | string[]): Promise<WorkflowQueue[]>
```

List all database-backed queues registered in the system database.
Similar to [`DBOS.listQueues`](./queues.md#dboslistqueues).
If `applicationName` is unset, lists only queues owned by the client's own [`applicationName`](#create); a client with no application name lists every application's queues.
The returned queues are bound to this client's system database, as with [`retrieveQueue`](#retrievequeue).

#### `deleteQueue`

```typescript
client.deleteQueue(name: string): Promise<void>
```

Delete a queue from the system database. No-op if no queue with that name exists.
Similar to [`DBOS.deleteQueue`](./queues.md#dbosdeletequeue).

:::warning
Workflows already enqueued on a deleted queue can no longer be dequeued, executed, or recovered.
However, if a queue with the same name is later registered, it will dequeue the leftover workflows.
Do not rely on this: stale workflows unexpectedly resuming on a future queue is rarely the intended behavior.
Instead, cancel or drain pending workflows on the queue before deleting it.
:::

## Workflow Schedules

`DBOSClient` provides methods to manage [workflow schedules](./methods.md#workflow-schedules) from outside a DBOS application.
Unlike the `DBOS` class methods which accept workflow functions directly, client schedule methods accept workflow names as strings.

#### `createSchedule`

```typescript
client.createSchedule(options: {
  scheduleName: string;
  workflowName: string;
  workflowClassName?: string;
  schedule: string;
  context?: unknown;
  options?: {
    automaticBackfill?: boolean;
    cronTimezone?: string;
    queueName?: string;
  };
  applicationName?: string;
}): Promise<void>
```

Create a cron schedule that periodically invokes a workflow.
Similar to [`DBOS.createSchedule`](./methods.md#dboscreateschedule), but takes a `workflowName` string instead of a workflow function.

**Parameters:**
- **scheduleName**: Unique name identifying this schedule.
- **workflowName**: Fully-qualified name of the workflow function to invoke.
- **workflowClassName**: The class name if the workflow is a static method on a class.
- **schedule**: A cron expression. Supports seconds as the first field with 6-field format.
- **context**: An optional context object passed to the workflow function on each invocation. Must be serializable.
- **options.automaticBackfill**: If `true`, on startup the scheduler will automatically backfill missed executions since the last time the schedule fired. Defaults to `false`.
- **options.cronTimezone**: [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (e.g. `"America/New_York"`) in which to evaluate the cron expression. Defaults to the system's local timezone.
- **options.queueName**: Optional name of a declared queue to enqueue scheduled workflows to. If not provided, uses an internal queue.
- **applicationName**: The application that owns this schedule and runs its workflows. Defaults to the client's own [`applicationName`](#create). Always set `applicationName` either here or in the client constructor if multiple applications share a system database: a schedule owned by no application is run by **every** application.

#### `updateSchedule`

```typescript
client.updateSchedule(
  name: string,
  updates: {
    schedule?: string;
    context?: unknown;
    automaticBackfill?: boolean;
    cronTimezone?: string | null;
    queueName?: string | null;
  },
): Promise<void>
```

Update an existing schedule in place, changing only the fields you pass and preserving the schedule's ID, status, and last-fired time.
Throws if no schedule with the given name exists.
Similar to [`DBOS.updateSchedule`](./methods.md#dbosupdateschedule).

#### `listSchedules`

```typescript
client.listSchedules(filters?: {
  status?: string | string[];
  workflowName?: string | string[];
  scheduleNamePrefix?: string | string[];
  applicationName?: string | string[];
}): Promise<WorkflowSchedule[]>
```

Return all registered workflow schedules, optionally filtered. Returns a list of [`WorkflowSchedule`](./methods.md#workflowschedule).
Similar to [`DBOS.listSchedules`](./methods.md#dboslistschedules).

**Parameters:**
- **status**: Filter by status (e.g. `"ACTIVE"`) or a list of statuses.
- **workflowName**: Filter by workflow name or a list of names.
- **scheduleNamePrefix**: Filter by schedule name prefix or a list of prefixes.
- **applicationName**: List only schedules owned by this application (or one of these applications). Schedules owned by no application are always included. If unset, defaults to the client's own [`applicationName`](#create); a client with no application name lists every application's schedules.

#### `getSchedule`

```typescript
client.getSchedule(name: string): Promise<WorkflowSchedule | null>
```

Return the [`WorkflowSchedule`](./methods.md#workflowschedule) with the given name, or `null` if it does not exist.
Similar to [`DBOS.getSchedule`](./methods.md#dbosgetschedule).

#### `deleteSchedule`

```typescript
client.deleteSchedule(name: string): Promise<void>
```

Delete the schedule with the given name. No-op if it does not exist.
Similar to [`DBOS.deleteSchedule`](./methods.md#dbosdeleteschedule).

#### `pauseSchedule`

```typescript
client.pauseSchedule(name: string): Promise<void>
```

Pause the schedule with the given name. A paused schedule does not fire.
Similar to [`DBOS.pauseSchedule`](./methods.md#dbospauseschedule).

#### `resumeSchedule`

```typescript
client.resumeSchedule(name: string): Promise<void>
```

Resume a paused schedule so it begins firing again.
Similar to [`DBOS.resumeSchedule`](./methods.md#dbosresumeschedule).

#### `applySchedules`

```typescript
client.applySchedules(
  schedules: Array<{
    scheduleName: string;
    workflowName: string;
    workflowClassName?: string;
    schedule: string;
    context?: unknown;
    automaticBackfill?: boolean;
    cronTimezone?: string;
    queueName?: string;
    applicationName?: string; // Defaults to the client's own applicationName
  }>,
): Promise<void>
```

Atomically apply a set of schedules.
Creates or updates each schedule in the list.
Similar to [`DBOS.applySchedules`](./methods.md#dbosapplyschedules), but takes workflow name strings instead of workflow functions.

#### `backfillSchedule`

```typescript
client.backfillSchedule(
  name: string,
  start: Date,
  end: Date,
): Promise<WorkflowHandle<unknown>[]>
```

Enqueue all executions of a schedule that would have run between `start` and `end`.
Each execution uses the same deterministic workflow ID as the live scheduler, so already-executed times are skipped.
Similar to [`DBOS.backfillSchedule`](./methods.md#dbosbackfillschedule).

#### `triggerSchedule`

```typescript
client.triggerSchedule(name: string): Promise<WorkflowHandle<unknown>>
```

Immediately enqueue the scheduled workflow at the current time.
Similar to [`DBOS.triggerSchedule`](./methods.md#dbostriggerschedule).

## Version Management

### listApplicationVersions

```typescript
client.listApplicationVersions(): Promise<VersionInfo[]>
```

Return all registered application versions, ordered by timestamp descending (newest first).
Similar to [`DBOS.listApplicationVersions`](./methods.md#dboslistapplicationversions).
If the client has an [`applicationName`](#create), only versions registered by that application (plus versions owned by no application) are returned; otherwise, every application's versions are returned.

### getLatestApplicationVersion

```typescript
client.getLatestApplicationVersion(): Promise<VersionInfo>
```

Return the latest application version (the one with the highest timestamp).
Throws if no versions are registered.
Similar to [`DBOS.getLatestApplicationVersion`](./methods.md#dbosgetlatestapplicationversion).

### setLatestApplicationVersion

```typescript
client.setLatestApplicationVersion(
  versionName: string,
  options?: { applicationName?: string },
): Promise<void>
```

Promote a version to latest by updating its timestamp to the current time.
This is useful when rolling back to a previous application version.
Similar to [`DBOS.setLatestApplicationVersion`](./methods.md#dbossetlatestapplicationversion).

**Parameters:**
- `versionName`: The name of the version to promote.
- `options.applicationName`: The application to act as. Defaults to the client's own [`applicationName`](#create). Promoting a version registered by a different application throws an error.

## Application Rename

### renameApplication

```typescript
client.renameApplication(
  oldName: string | undefined,
  newName: string,
  options?: { batchSize?: number | null; adoptUnclaimedRows?: boolean },
): Promise<ApplicationRowCounts>

interface ApplicationRowCounts {
  queues: number;
  schedules: number;
  versions: number;
  workflows: number;
  steps: number;
}
```

Every workflow, step, queue, schedule, and application version is owned by the application (identified by its configured [`name`](./configuration.md#application-settings)) that created it.
After renaming an application, use this method (or the [`npx dbos rename-application`](./cli.md#npx-dbos-rename-application) CLI command) to transfer everything owned by the old name to the new name.
Returns the number of rows transferred, by table.

Queues, schedules, versions, and in-flight workflows are transferred in a single transaction; completed workflows and their steps are then transferred in batches of `batchSize`.
The operation is idempotent: if interrupted, running it again resumes where it left off.

:::warning
Stop the application being renamed before running this.
A running application would race the rename, creating new work under its old name.
:::

**Parameters:**
- **oldName**: The application's previous name. If undefined, nothing is transferred except rows owned by no application, so `adoptUnclaimedRows` must be set.
- **newName**: The application that ends up owning the rows. Must be a valid application name (between 3 and 30 characters, containing only lowercase letters, numbers, dashes, and underscores).
- **options.batchSize**: The number of completed workflows and steps transferred per transaction. Defaults to 10,000. Pass `null` to transfer everything in a single transaction.
- **options.adoptUnclaimedRows**: Also transfer rows owned by no application, such as rows created before upgrading to a DBOS version supporting application ownership. Defaults to `false`.

## Debouncing

Workflows can be debounced with the DBOSClient.

### DebouncerClient

```typescript
new DebouncerClient(
  client: DBOSClient,
  params: DebouncerClientConfig
)
```

```typescript
interface DebouncerClientConfig {
  workflowName: string;
  workflowClassName?: string;
  startWorkflowParams?: StartWorkflowParams;
  debounceTimeoutMs?: number;
  applicationName?: string;
}
```

Similar to [`Debouncer`](./methods.md#debouncer) but takes in a DBOSClient and workflow metadata instead of a workflow function.

**Parameters:**
- **client**: The DBOSClient instance to use.
- **params**:
  - **workflowName**: The name of the workflow method to debounce.
  - **workflowClassName**: The name of the class the workflow method is a member of, if any.
  - **startWorkflowParams**: Optional workflow parameters, as in [`startWorkflow`](./methods.md#dbosstartworkflow). Applied to all workflows started from this debouncer.
  - **debounceTimeoutMs**: After this time elapses since the first time a workflow is submitted from this debouncer, the workflow is started regardless of the debounce period.
  - **applicationName**: Debounce on behalf of this application. Defaults to the `applicationName` in `startWorkflowParams.enqueueOptions`, then to the client's own.

### debouncerClient.debounce

```typescript
debouncerClient.debounce(
  debounceKey: string,
  debouncePeriodMs: number,
  ...args: unknown[]
): Promise<WorkflowHandle<unknown>>
```

Similar to [`Debouncer.debounce`](./methods.md#debouncerdebounce).

**Example Syntax**:

```typescript
import { DBOSClient, DebouncerClient } from "@dbos-inc/dbos-sdk";

const client = await DBOSClient.create({
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL
});

const debouncer = new DebouncerClient(client, {
  workflowName: "processInput",
  debounceTimeoutMs: 120000, // 2 minutes
});

// Each time a user submits a new input, debounce the processInput workflow.
// The workflow will wait until 60 seconds after the user stops submitting new inputs,
// then process the last input submitted.
async function onUserInputSubmit(userId: string, userInput: string) {
  const debounceKey = userId;
  const debouncePeriodMs = 60000; // 60 seconds
  await debouncer.debounce(debounceKey, debouncePeriodMs, userInput);
}
```


