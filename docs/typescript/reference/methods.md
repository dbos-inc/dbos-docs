---
sidebar_position: 30
title: DBOS Methods & Variables
---

## DBOS Methods

### DBOS.startWorkflow

```typescript
static startWorkflow<Args extends unknown[], Return>(
  target: (...args: Args) => Promise<Return>,
  params?: StartWorkflowParams,
): (...args: Args) => Promise<WorkflowHandle<Return>>;
```

```typescript
interface StartWorkflowParams {
  workflowID?: string;
  queueName?: string;
  timeoutMS?: number | null;
  enqueueOptions?: EnqueueOptions;
}

export interface EnqueueOptions {
  deduplicationID?: string;
  priority?: number;
  queuePartitionKey?: string;
}
```

Start a workflow in the background and return a [handle](#workflow-handles) to it.
Optionally enqueue it on a DBOS queue.
The `DBOS.startWorkflow` method resolves after the workflow is durably started; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

**Example syntax:**

```typescript
async function example(input: number) {
    // Call steps
}
const exampleWorkflow = DBOS.registerWorkflow(example);

const input = 10;
const handle = await DBOS.startWorkflow(exampleWorkflow)(input);
```

Or if using decorators: 

```typescript
export class Example {
  @DBOS.workflow()
  static async exampleWorkflow(input: number) {
    // Call steps
  }
}

const input = 10;
const handle = await DBOS.startWorkflow(Example).exampleWorkflow(input);
```

**Parameters:**

- **target**: The workflow to start.
- **workflowID**: An ID to assign to the workflow. If not specified, a random UUID is generated.
- **queueName**: The name of the queue on which to enqueue this workflow, if any.
- **timeoutMS**: The timeout of this workflow in milliseconds.
- **enqueueOptions**:
  - **deduplicationID**: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDuplicatedError` exception.
  - **priority**: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
  - **queuePartitionKey**: The queue partition in which to enqueue this workflow. Use if and only if the queue is partitioned (`partitionQueue: true`). In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.

### DBOS.send

```typescript
DBOS.send<T>(
  destinationID: string,
  message: T,
  topic?: string,
  idempotencyKey?: string,
  options?: SendOptions
): Promise<void>
```

Send a message to the workflow identified by `destinationID`.
Messages can optionally be associated with a topic.

**Parameters:**
- **destinationID**: The workflow to which to send the message.
- **message**: The message to send. Must be serializable.
- **topic**: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- **idempotencyKey**: If `DBOS.send` is called from outside a workflow and an idempotency key is set, the message will only be sent once no matter how many times `DBOS.send` is called with this key.
- **options.serializationType**: The [serialization format](#serialization-strategy) to use for this message.

### DBOS.recv

```typescript
recv<T>(
  topic?: string,
  timeoutSeconds?: number // Default: 60 seconds
): Promise<T | null>
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning `null` if the wait times out.  If `timeoutSeconds` is not specified, a 60-second timeout is used.
If no topic is specified, `recv` can only access messages sent without a topic.

**Parameters:**
- **topic**: A topic queue on which to wait.
- **timeoutSeconds**: A timeout in seconds. If the wait times out, return `null`.

**Returns:**
- The first message enqueued on the input topic, or `null` if the wait times out.

### DBOS.setEvent

```typescript
DBOS.setEvent<T>(
  key: string,
  value: T,
  options?: SetEventOptions
): Promise<void>
```

Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
Can only be called from within a workflow.

**Parameters:**
- **key**: The key of the event.
- **value**: The value of the event. Must be serializable.
- **options.serializationType**: The [serialization format](#serialization-strategy) to use for this event.

### DBOS.getEvent

```typescript
DBOS.getEvent<T>(
  workflowID: string,
  key: string,
  timeoutSeconds?: number // Default: 60 seconds
): Promise<T | null>
```

Retrieve the latest value of an event published by the workflow identified by `workflowID` to the key `key`.
If the event does not yet exist, wait for it to be published, returning `null` if the wait times out.  If `timeoutSeconds` is not specified, a 60-second timeout is used.

**Parameters:**
- **workflowID**: The identifier of the workflow whose events to retrieve.
- **key**: The key of the event to retrieve.
- **timeoutSeconds**: A timeout in seconds. If the wait times out, return `null`.

### DBOS.sleep

```typescript
DBOS.sleep(
    durationMS: number,
): Promise<void>;
```

Sleep for the given number of milliseconds.
May only be called from within a workflow.
This sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.

**Parameters:**
- **durationMS**: The number of milliseconds to sleep.

### DBOS.now

```typescript
DBOS.now(): Promise<number>
```

Returns the current time, in the manner of `Date.now()`, checkpointed as a step.

### DBOS.randomUUID

```typescript
DBOS.randomUUID(): Promise<string>
```

Returns a random UUID, in the manner of `node:crypto`, checkpointed as a step.

### DBOS.writeStream

```typescript
DBOS.writeStream<T>(
  key: string,
  value: T,
  options?: WriteStreamOptions
): Promise<void>
```

Write a value to a stream.
A workflow may have any number of streams, each identified by a unique key.
Can only be called from within a workflow or step.

**Parameters:**
- **key**: The stream key/name within the workflow.
- **value**: A serializable value to write to the stream.
- **options.serializationType**: The [serialization format](#serialization-strategy) to use for this value.

### DBOS.closeStream

```typescript
DBOS.closeStream(
  key: string
): Promise<void>
```

Close a stream identified by a key.
After this is called, no more values can be written to the stream.
Can only be called from within a workflow.

**Parameters:**
- **key**: The stream key/name within the workflow.

### DBOS.readStream

```typescript
DBOS.readStream<T>(
  workflowID: string, 
  key: string
): AsyncGenerator<T, void, unknown>
```

Read values from a stream as an async generator.
This function reads values from a stream identified by the workflowID and key,
yielding each value in order until the stream is closed or the workflow terminates.

**Parameters:**
- **workflowID**: The workflow instance ID that owns the stream.
- **key**: The stream key/name within the workflow.

**Returns:**
- An async generator that yields each value in the stream until the stream is closed.

**Example syntax:**

```typescript
for await (const value of DBOS.readStream(workflowID, "example_key")) {
  console.log(`Received: ${JSON.stringify(value)}`);
}
```

### DBOS.retrieveWorkflow

```typescript
DBOS.retrieveWorkflow<T>(
  workflowID: string,
): WorkflowHandle<Awaited<T>> 
```

Retrieve the [handle](#workflow-handles) of a workflow.

**Parameters**:
- **workflowID**: The ID of the workflow whose handle to retrieve.

### DBOS.getWorkflowStatus

```typescript
DBOS.getWorkflowStatus(
  workflowID: string
): Promise<WorkflowStatus | null>
```

Retrieve the status of a workflow given its ID.
Returns `null` if no workflow with the given ID exists.

**Parameters**:
- **workflowID**: The ID of the workflow whose status to retrieve.

## Workflow Management Methods

### DBOS.listWorkflows

```typescript
DBOS.listWorkflows(
  input: GetWorkflowsInput
): Promise<WorkflowStatus[]>
```

```typescript
interface GetWorkflowsInput {
  workflowIDs?: string[]; // Retrieve workflows with these IDs.
  workflowName?: string | string[]; // Retrieve workflows with this name (or any of these names).
  status?: string | string[]; // Retrieve workflows with this status (or any of these statuses). Must be `ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`.
  startTime?: string; // Retrieve workflows started after this (RFC 3339-compliant) timestamp.
  endTime?: string; // Retrieve workflows started before this (RFC 3339-compliant) timestamp.
  authenticatedUser?: string | string[]; // Retrieve workflows run by this authenticated user (or any of these users).
  applicationVersion?: string | string[]; // Retrieve workflows started on this application version (or any of these versions).
  executorId?: string | string[]; // Retrieve workflows run by this executor ID (or any of these executor IDs).
  workflow_id_prefix?: string | string[]; // Retrieve workflows whose ID have this prefix (or any of these prefixes).
  queueName?: string | string[]; // If this workflow is enqueued, on which queue (or any of these queues).
  queuesOnly?: boolean; // Return only workflows that are actively enqueued.
  forkedFrom?: string | string[]; // Get workflows forked from this workflow ID (or any of these workflow IDs).
  parentWorkflowID?: string | string[]; // Get workflows started by this parent workflow ID (or any of these parent workflow IDs).
  limit?: number; // Return up to this many workflows IDs. IDs are ordered by workflow creation time.
  offset?: number; // Skip this many workflows IDs. IDs are ordered by workflow creation time.
  sortDesc?: boolean; // Sort the workflows in descending order by creation time (default ascending order).
  loadInput?: boolean; // Load the input of the workflow (default true).
  loadOutput?: boolean; // Load the output of the workflow (default true).
}
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all workflows matching specified criteria.

### DBOS.listQueuedWorkflows

```typescript
DBOS.listQueuedWorkflows(
  input: GetWorkflowsInput
): Promise<WorkflowStatus[]>
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all **currently enqueued** (status `PENDING` or `ENQUEUED`) workflows matching specified criteria.
The input type is the same as [`DBOS.listWorkflows`](#dboslistworkflows); this method is equivalent to calling `DBOS.listWorkflows` with `queuesOnly` set.

### DBOS.listWorkflowSteps
```typescript
DBOS.listWorkflowSteps(
  workflowID: string
): Promise<StepInfo[] | undefined>
```

Retrieve the steps of a workflow. Returns `undefined` if the workflow is not found.
This is a list of `StepInfo` objects, with the following structure:

```typescript
interface StepInfo {
  // The unique ID of the step in the workflow. Zero-indexed.
  readonly functionID: number;
  // The name of the step
  readonly name: string;
  // The step's output, if any
  readonly output: unknown;
  // The error the step threw, if any
  readonly error: Error | null;
  // If the step starts or retrieves the result of a workflow, its ID
  readonly childWorkflowID: string | null;
  // The Unix epoch timestamp at which this step started
  readonly startedAtEpochMs?: number;
  // The Unix epoch timestamp at which this step completed
  readonly completedAtEpochMs?: number;
}
```

### DBOS.cancelWorkflow

```typescript
cancelWorkflow(
  workflowID: string
): Promise<void>
```

Cancel a workflow.
This sets is status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step)

### DBOS.resumeWorkflow

```typescript
DBOS.resumeWorkflow<T>(
  workflowID: string
): Promise<WorkflowHandle<Awaited<T>>> 
```

Resume a workflow.
This immediately starts it from its last completed step.
You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

### DBOS.deleteWorkflow

```typescript
DBOS.deleteWorkflow(
  workflowID: string,
  deleteChildren?: boolean
): Promise<void>
```

Delete a workflow and optionally all its child workflows.
This permanently removes the workflow from the system database.

**Warning:** This operation is irreversible.

**Parameters:**
- **workflowID**: The ID of the workflow to delete.
- **deleteChildren**: If true, also delete all child workflows recursively. Defaults to false.

### DBOS.forkWorkflow

```typescript
static async forkWorkflow<T>(
  workflowID: string,
  startStep: number,
  options?: { newWorkflowID?: string; applicationVersion?: string; timeoutMS?: number },
): Promise<WorkflowHandle<Awaited<T>>>
```

Start a new execution of a workflow from a specific step.
The input step ID (`startStep`) must match the `functionID` of the step returned by `listWorkflowSteps`.
The specified `startStep` is the step from which the new workflow will start, so any steps whose ID is less than `startStep` will not be re-executed.

**Parameters:**
- **workflowID**: The ID of the workflow to fork.
- **startStep**: The ID of the step from which to start the forked workflow. Must match the `functionID` of the step in the original workflow execution.
- **newWorkflowID**: The ID of the new workflow created by the fork. If not specified, a random UUID is used.
- **applicationVersion**: The application version on which the forked workflow will run. Useful for "patching" workflows that failed due to a bug in the previous application version.
- **timeoutMS**: A timeout for the forked workflow in milliseconds.

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```typescript
export interface WorkflowStatus {
  // The workflow ID
  readonly workflowID: string;
  // The status of the workflow.  One of PENDING, SUCCESS, ERROR, ENQUEUED, CANCELLED, or MAX_RECOVERY_ATTEMPTS_EXCEEDED.
  readonly status: string;
  // The name of the workflow function.
  readonly workflowName: string;
  // The name of the workflow's class, if any.
  readonly workflowClassName: string;
  // The name with which the workflow's class instance was configured, if any.
  readonly workflowConfigName?: string;
  // If the workflow was enqueued, the name of the queue.
  readonly queueName?: string;

  // The user who ran the workflow, if set.
  readonly authenticatedUser?: string;
  // The role used to run the workflow, if set.
  readonly assumedRole?: string;
  // All roles the authenticated user has, if set.
  readonly authenticatedRoles?: string[];

  // The deserialized workflow inputs.
  readonly input?: unknown[];
  // The workflow's deserialized output, if any.
  readonly output?: unknown;
  // The error thrown by the workflow, if any.
  readonly error?: unknown;

  // The ID of the executor (process) that most recently executed this workflow.
  readonly executorId?: string;
  // The application version on which this workflow started.
  readonly applicationVersion?: string;

  // Workflow start time, as a UNIX epoch timestamp in milliseconds
  readonly createdAt: number;
  // Last time the workflow status was updated, as a UNIX epoch timestamp in milliseconds. For a completed workflow, this is the workflow completion timestamp.
  readonly updatedAt?: number;

  // The timeout specified for this workflow, if any. Timeouts are start-to-close.
  readonly timeoutMS?: number;
  // The deadline at which this workflow times out, if any. Not set until the workflow begins execution.
  readonly deadlineEpochMS?: number;
  // Unique queue deduplication ID, if any. Deduplication IDs are unset when the workflow completes.
  readonly deduplicationID?: string;
  // Priority of the workflow on a queue, starting from 1 ~ 2,147,483,647. Default 0 (highest priority).
  readonly priority: number;
  // If this workflow is enqueued on a partitioned queue, its partition key
  readonly queuePartitionKey?: string;
  // If this workflow was enqueued, the time it was dequeued (started execution), as a UNIX epoch timestamp in milliseconds.
  readonly dequeuedAt?: number;

  // If this workflow was forked from another, that workflow's ID.
  readonly forkedFrom?: string;
  // If this workflow was started by another workflow, that workflow's ID.
  readonly parentWorkflowID?: string;
}
```

## Debouncing

You can create a `Debouncer` to debounce your workflows.
Debouncing delays workflow execution until some time has passed since the workflow has last been called.
This is useful for preventing wasted work when a workflow may be triggered multiple times in quick succession.
For example, if a user is editing an input field, you can debounce their changes to execute a processing workflow only after they haven't edited the field for some time:

### Debouncer

```typescript
new Debouncer<Args extends unknown[], Return>(
  params: DebouncerConfig<Args, Return>
)
```

```typescript
interface DebouncerConfig<Args extends unknown[], Return> {
  workflow: (...args: Args) => Promise<Return>;
  startWorkflowParams?: StartWorkflowParams;
  debounceTimeoutMs?: number;
}
```

**Parameters:**
- **workflow**: The workflow to debounce. Note that workflows from [configured instances](./workflows-steps.md#instance-method-workflows) cannot be debounced.
- **startWorkflowParams**: Optional workflow parameters, as in [`startWorkflow`](#dbosstartworkflow). Applied to all workflows started from this debouncer.
- **debounceTimeoutMs**: After this time elapses since the first time a workflow is submitted from this debouncer, the workflow is started regardless of the debounce period.

### debouncer.debounce

```typescript
debouncer.debounce(
  debounceKey: string,
  debouncePeriodMs: number,
  ...args: Args
): Promise<WorkflowHandle<Return>>
```

Submit a workflow for execution but delay it by `debouncePeriodMs`.
Returns a handle to the workflow.
The workflow may be debounced again, which further delays its execution (up to `debounceTimeoutMs`).
When the workflow eventually executes, it uses the **last** set of inputs passed into `debounce`.
After the workflow begins execution, the next call to `debounce` starts the debouncing process again for a new workflow execution.

**Parameters:**
- **debounceKey**: A key used to group workflow executions that will be debounced together. For example, if the debounce key is set to customer ID, each customer's workflows would be debounced separately.
- **debouncePeriodMs**: Delay this workflow's execution by this period in milliseconds.
- **...args**: Variadic workflow arguments.

**Example Syntax**:

```typescript
async function processInput(userInput: string) {
  ...
}
const processInputWorkflow = DBOS.registerWorkflow(processInput);

// Each time a user submits a new input, debounce the processInput workflow.
// The workflow will wait until 60 seconds after the user stops submitting new inputs,
// then process the last input submitted.
const debouncer = new Debouncer({
  workflow: processInputWorkflow,
});

async function onUserInputSubmit(userId: string, userInput: string) {
  const debounceKey = userId;
  const debouncePeriodMs = 60000; // 60 seconds
  await debouncer.debounce(debounceKey, debouncePeriodMs, userInput);
}
```

## DBOS Variables

### DBOS.logger

```typescript
DBOS.logger: Logger;
```

Retrieve the DBOS logger.
This is a pre-configured Winston logger provided as a convenience.
You do not need to use it if you have your own logger.

### DBOS.workflowID

```typescript
DBOS.workflowID: string | undefined;
```

Return the ID of the current workflow, if in a workflow.

### DBOS.isInStep()
```typescript
DBOS.isInStep(): boolean;
```
Returns true if called from within a step.

### DBOS.stepID

```typescript
DBOS.stepID: number | undefined;
```

Return the unique ID of the current step within a workflow.

### DBOS.stepStatus

```typescript
DBOS.stepStatus: StepStatus | undefined;
```

Return the status of the currently executing step.
This object has the following properties:

```typescript
interface StepStatus {
  // The unique ID of this step in its workflow.
  stepID: number;
  // For steps with automatic retries, which attempt number (zero-indexed) is currently executing.
  currentAttempt?: number;
  // For steps with automatic retries, the maximum number of attempts that will be made before the step fails.
  maxAttempts?: number;
}
```

### DBOS.isInTransaction()
```typescript
DBOS.isInTransaction(): boolean;
```
Returns true if called from within a datasource transaction.


### DBOS.span

```typescript
DBOS.span: Span | undefined
```

Retrieve the OpenTelemetry span associated with the current workflow.
You can use this to set custom attributes in your span.


### DBOS.applicationVersion

```typescript
DBOS.applicationVersion: string
```

Return the current application version, as documented [here](../tutorials/upgrading-workflows.md#versioning).

### DBOS.executorID

```typescript
DBOS.executorID: string
```

Retrieve the current executor ID, a unique process ID used to identify the application instance in distributed environments.

## Workflow Handles

A workflow handle represents the state of a particular active or completed workflow execution.
You obtain a workflow handle when using `DBOS.startWorkflow` to start a workflow in the background.
If you know a workflow's identity, you can also retrieve its handle using `DBOS.retrieveWorkflow`.

Workflow handles have the following methods:

### handle.workflowID

```typescript
handle.workflowID(): string;
```

Retrieve the ID of the workflow.

### handle.getResult

```typescript
handle.getResult(): Promise<R>;
```

Wait for the workflow to complete, then return its result.

### handle.getStatus

```typescript
handle.getStatus(): Promise<WorkflowStatus | null>;
```

Retrieve the [`WorkflowStatus`](#workflow-status) of the workflow, or `null` if not found.

## Alerting

### DBOS.setAlertHandler

```typescript
DBOS.setAlertHandler(
  handler: (ruleType: string, message: string, metadata: Record<string, string>) => Promise<void>
): void
```

Register a handler to receive [alerts](../../production/alerting.md) from Conductor.
The handler function is called with three arguments:

- **ruleType**: The type of alert rule. One of `WorkflowFailure`, `SlowQueue`, or `UnresponsiveApplication`.
- **message**: The alert message.
- **metadata**: A record of string key-value pairs with additional alert information.

Only one alert handler may be registered per application, and it must be registered before `DBOS.launch()` is called.
If no handler is registered, alerts are logged with a warning.

**Example syntax:**

```typescript
DBOS.setAlertHandler(async (ruleType: string, message: string, metadata: Record<string, string>) => {
  DBOS.logger.warn(`Alert received: ${ruleType} - ${message}`);
  for (const [key, value] of Object.entries(metadata)) {
    DBOS.logger.warn(`  ${key}: ${value}`);
  }
});
```

## Serialization Strategy

Several DBOS methods accept an optional `serializationType` parameter that controls how data is serialized.
This is useful for cross-language interoperability&mdash;for example, if a Python or Java DBOS application needs to read events or messages set by a TypeScript application.

```typescript
import { WorkflowSerializationFormat } from "@dbos-inc/dbos-sdk";
```

The available values are:

- **`undefined`** (default): Uses the serializer configured in [`DBOSConfig`](./configuration.md#custom-serialization) (defaults to JSON).
- **`'portable'`**: Uses a portable JSON format (`portable_json`) that can be deserialized by DBOS applications in any language.
- **`'native'`**: Explicitly uses the native TypeScript serializer.
