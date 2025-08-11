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
    workflowClassName: string;
    queueName: string;
    workflowID?: string;
    appVersion?: string;
    workflowTimeoutMS?: number;
    deduplicationID?: string;
    priority?: number;
}

class DBOSClient {
    static create({systemDatabaseUrl}: {systemDatabaseUrl?: string}): Promise<DBOSClient>
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
    listQueuedWorkflows(input: GetQueuedWorkflowsInput): Promise<WorkflowStatus[]>;
    listWorkflowSteps(workflowID: string): Promise<StepInfo[] | undefined>;

    cancelWorkflow(workflowID: string): Promise<void>;
    resumeWorkflow(workflowID: string): Promise<void>;
    forkWorkflow(workflowID: string, startStep: number,
        options?: { newWorkflowID?: string; applicationVersion?: string }): Promise<string>;
}
```

#### `create`

You construct a `DBOSClient` with the static `create` function.

The `systemDatabaseUrl` parameter is a connection string to your Postgres database. See the [configuration docs](./configuration.md) for more detail.

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
***`workflowID**: The unique ID for the enqueued workflow. 
If left undefined, DBOS Client will generate a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
Please see [Workflow IDs and Idempotency](../tutorials/workflow-tutorial#workflow-ids-and-idempotency) for more information.
* **appVersion**: The version of your application that should process this workflow. 
If left undefined, it will be updated to the current version when the workflow is first dequeued. 
Please see [Managing Application Versions](../../production/self-hosting/workflow-recovery#managing-application-versions) for more information.
* **workflowTimeoutMS**: The timeout of this workflow in milliseconds.
* **deduplicationID**: Optionally specified when enqueueing a workflow. At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDuplicatedError` exception.
* **priority**: Optionally specified when enqueueing a workflow. The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.


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

Sends a message to a specified workflow. Identical to [`DBOS.send`](./methods.md#dbossend).

:::warning
Since DBOS Client is running outside of a DBOS application, 
it is highly recommended that you use the `idempotencyKey` parameter in order to get exactly-once behavior.
:::

#### `getEvent`

Retrieves an event published by workflowID for a given key using the [events API](../tutorials/workflow-tutorial#workflow-events).
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
Please see [`DBOS.getWorkflowStatus`](./methods.md#handlegetstatus) for more for more information.

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


