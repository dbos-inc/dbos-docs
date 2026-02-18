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
    queuePartitionKey?: string;
}

class DBOSClient {
    static create({systemDatabaseUrl, systemDatabasePool, serializer}: {systemDatabaseUrl: string, systemDatabasePool?: Pool, serializer?: DBOSSerializer}): Promise<DBOSClient>
    destroy(): Promise<void>;

    enqueue<T extends (...args: any[]) => Promise<any>>(
        options: ClientEnqueueOptions,
        ...args: Parameters<T>
    ): Promise<WorkflowHandle<Awaited<ReturnType<T>>>>;
    send<T>(destinationID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>;
    getEvent<T>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>;
    retrieveWorkflow<T = unknown>(workflowID: string): WorkflowHandle<Awaited<T>>;
    readStream<T>(workflowID: string, key: string): AsyncGenerator<T, void, unknown>;

    getWorkflow(workflowID: string): Promise<WorkflowStatus | undefined>;
    listWorkflows(input: GetWorkflowsInput): Promise<WorkflowStatus[]>;
    listQueuedWorkflows(input: GetWorkflowsInput): Promise<WorkflowStatus[]>;
    listWorkflowSteps(workflowID: string): Promise<StepInfo[] | undefined>;

    cancelWorkflow(workflowID: string): Promise<void>;
    resumeWorkflow(workflowID: string): Promise<void>;
    forkWorkflow(workflowID: string, startStep: number,
        options?: { newWorkflowID?: string; applicationVersion?: string; timeoutMS?: number }): Promise<string>;
}
```

#### `create`

You construct a `DBOSClient` with the static `create` function.

**Parameters:**
- **systemDatabaseUrl**: A connection string to your Postgres database. See the [configuration docs](./configuration.md) for more detail.
- **systemDatabasePool**: An optional custom `node-postgres` connection pool to use instead of creating a new one. If provided, the client will use this pool for all database operations.
- **serializer**: An optional custom serializer. If your DBOS application uses [custom serialization](./configuration.md#custom-serialization), you must provide the same serializer to the client to correctly deserialize workflow results and events.

Example:

```ts
import { DBOSClient } from "@dbos-inc/dbos-sdk";

const client = await DBOSClient.create({systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL});
```

#### `destroy`

Asynchronously destroys a `DBOSClient` instance.

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
* **queuePartitionKey**: The queue partition in which to enqueue this workflow. Use if and only if the queue is partitioned. In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.
* **serializationType**: The [serialization strategy](./methods.md#serialization-strategy) for the workflow arguments.

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
    "https://arxiv.org/pdf/2208.13068");

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
    "https://arxiv.org/pdf/2208.13068");

// TypeScript can also infer the result type because 
// we provided the function type declaration to enqueue
const result = await handle.getResult();
```

:::tip
 TypeScript automatically generates type declarations during compilation of your DBOS application.
You can copy or import the function type declaration from your application's 
[generated declaration file (aka.d.ts file)](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html).
::: 

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

#### `getEvent`

Retrieves an event published by workflowID for a given key.
Identical to [DBOS.getEvent](./methods.md#dbosgetevent)

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

#### `readStream`

```typescript
readStream<T>(workflowID: string, key: string): AsyncGenerator<T, void, unknown>
```

Read values from a stream as an async generator from outside the DBOS application.
This function reads values from a stream identified by the workflowID and key,
yielding each value in order until the stream is closed or the workflow terminates.
Similar to [`DBOS.readStream`](./methods.md#dbosreadstream).

**Parameters:**
- **workflowID**: The workflow instance ID that owns the stream.
- **key**: The stream key/name within the workflow.

**Returns:**
- An async generator that yields each value in the stream until the stream is closed.

**Example:**

```ts
for await (const value of client.readStream(workflowID, "example_key")) {
  console.log(`Received: ${JSON.stringify(value)}`);
}
```

### Workflow Inspection

#### `getWorkflow`

Retrieves the status of a single workflow, given its workflow ID.
If the specified workflow ID does not exist, getWorkflow returns undefined.
Please see [`DBOS.getWorkflowStatus`](./methods.md#dbosgetworkflowstatus) for more information.

#### `listWorkflows`

Retrieves information about workflow execution history. 
Please see [`DBOS.listWorkflows`](./methods.md#dboslistworkflows) for more for more information.

#### `listQueuedWorkflows`

Retrieves information about workflow execution history for a given workflow queue. 
Please see [`DBOS.listQueuedWorkflows`](./methods.md#dboslistqueuedworkflows) for more for more information.

#### `listWorkflowSteps`

Retrieves information about the steps executed in a specified workflow. 
If the specified workflow is not found, `listWorkflowSteps` returns undefined
Please see [`DBOS.listWorkflowSteps`](./methods.md#dboslistworkflowsteps) for more for more information.

### Workflow Management

#### `cancelWorkflow`

Cancels a workflow. If the workflow is currently running, `DBOSWorkflowCancelledError` will be thrown from its next DBOS call.
Please see [`DBOS.cancelWorkflow`](./methods.md#dboscancelworkflow) for more for more information.

#### `resumeWorkflow`

Resumes a workflow that had stopped during execution (due to cancellation or error).
Please see [`DBOS.resumeWorkflow`](./methods.md#dbosresumeworkflow) for more for more information.

#### `forkWorkflow`

Start a new execution of a workflow from a specific step. 
Please see [`DBOS.forkWorkflow`](./methods.md#dbosforkworkflow) for more for more information.

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


