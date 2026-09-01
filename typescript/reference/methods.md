# DBOS Methods & Variables

> ```typescript
> static startWorkflow<Args extends unknown[], Return>(
>   target: (...args: Args) => Promise<Return>,
>   params?: StartWorkflowParams,
> ): (...args: Args) => Promise<WorkflowHandle<Return>>;
> ```

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
  duplicationPolicy?: 'reject' | 'return-existing';
  workflowAttributes?: Record<string, unknown>;
}

export interface EnqueueOptions {
  deduplicationID?: string;
  priority?: number;
  delaySeconds?: number;
  queuePartitionKey?: string;
  applicationVersion?: string;
  applicationName?: string;
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
- **duplicationPolicy**: How to handle a collision with another workflow that has the same `enqueueOptions.deduplicationID` on the same queue. Defaults to `'reject'`.
  - `'reject'`: throw `DBOSQueueDuplicatedError`.
  - `'return-existing'`: return a handle to the existing workflow instead of throwing. Requires `queueName` and `enqueueOptions.deduplicationID`. Arguments passed by the colliding caller are discarded and the returned handle resolves with the original workflow's result. See [Singleton Workflows](../tutorials/queue-tutorial.md#singleton-workflows).
- **enqueueOptions**:
  - **deduplicationID**: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDuplicatedError` exception.
  - **priority**: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
  - **delaySeconds**: Delay the workflow by this many seconds before it becomes eligible for execution. The workflow is initially placed in `DELAYED` status and transitions to `ENQUEUED` after the delay expires.
  - **queuePartitionKey**: The queue partition in which to enqueue this workflow. Use if and only if the queue is [partitioned](../tutorials/queue-tutorial.md#partitioning-queues) (registered with at least one partition limit). A partitioned queue applies its partition limits to each partition separately, while its `globalConcurrency`, `workerConcurrency`, and `rateLimit` still apply across all partitions.
  - **applicationVersion**: The application version of the workflow to enqueue. The workflow may only be dequeued by processes running that version. Defaults to the current application version.
  - **applicationName**: The application that owns and runs the enqueued workflow. Defaults to this application. Set to enqueue the workflow on behalf of another application sharing the system database. To enqueue another application's workflow without a reference to its function, use [`DBOS.enqueueWorkflowWithOptions`](./queues.md#dbosenqueueworkflowwithoptions) instead.
- **workflowAttributes**: A record of custom, JSON-serializable key-value attributes to attach to the workflow at creation. Attributes must be a key-value object (not a scalar or array). They are recorded in the workflow's [status](#workflow-status), are **not inherited** by child workflows, and are searchable via the `attributes` filter of [`DBOS.listWorkflows`](#dboslistworkflows). Attributes are stored in Postgres as GIN-indexed JSONB, so they are efficiently searchable.

### DBOS.waitFirst

```typescript
static async waitFirst(
  handles: WorkflowHandle<unknown>[],
  options?: WaitFirstOptions
): Promise<WorkflowHandle<unknown>>
```

```typescript
interface WaitFirstOptions {
  pollingIntervalMs?: number;
}
```

Wait for any one of the given workflow handles to complete and return the first completed handle.
This is useful when you have multiple concurrent workflows and want to process results as they complete.

**Parameters:**
- **handles**: A non-empty array of workflow handles to wait on. Throws an error if the array is empty.
- **options**:
  - **pollingIntervalMs**: The interval, in milliseconds, between system database polls while waiting.

See the [queue tutorial](../tutorials/queue-tutorial.md#queue-example) for an example.

### DBOS.waitAll

```typescript
static async waitAll<R>(
  handles: WorkflowHandle<R>[],
  options?: WaitAllOptions
): Promise<WorkflowHandle<R>[]>
```

```typescript
interface WaitAllOptions {
  pollingIntervalMs?: number;
}
```

Wait for **all** of the given workflow handles to complete, then return them.
The returned array contains the input handles in the same order, including any duplicates.

`waitAll` only waits for the workflows to finish; it does not return their results or throw if one of them failed.
To retrieve results, call [`getResult`](#handlegetresult) on the returned handles.

**Parameters:**
- **handles**: An array of workflow handles to wait on.
- **options**:
  - **pollingIntervalMs**: The interval, in milliseconds, between system database polls while waiting.

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
- **idempotencyKey**: If an idempotency key is set, the message will only be sent once no matter how many times `DBOS.send` is called with this key.
- **options.serializationType**: The [serialization format](#serialization-strategy) to use for this message.

### DBOS.recv

```typescript
recv<T>(
  topic?: string,
  options?: RecvOptions
): Promise<T | null>
```

```typescript
interface RecvOptions {
  timeoutSeconds?: number;
  deadlineEpochMS?: number;
  pollingIntervalMs?: number;
}
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning `null` if the wait times out.  If no timeout is specified, a 60-second timeout is used.
If no topic is specified, `recv` can only access messages sent without a topic.

**Parameters:**
- **topic**: A topic queue on which to wait.
- **options**:
  - **timeoutSeconds**: A timeout in seconds. If the wait times out, return `null`.
  - **deadlineEpochMS**: An absolute deadline as a Unix epoch timestamp in milliseconds. If the deadline passes, return `null`.
  - **pollingIntervalMs**: The interval, in milliseconds, between system database polls while waiting.

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
  options?: GetEventOptions
): Promise<T | null>
```

```typescript
interface GetEventOptions {
  timeoutSeconds?: number;
  deadlineEpochMS?: number;
  pollingIntervalMs?: number;
}
```

Retrieve the latest value of an event published by the workflow identified by `workflowID` to the key `key`.
If the event does not yet exist, wait for it to be published, returning `null` if the wait times out.  If no timeout is specified, a 60-second timeout is used.

**Parameters:**
- **workflowID**: The identifier of the workflow whose events to retrieve.
- **key**: The key of the event to retrieve.
- **options**:
  - **timeoutSeconds**: A timeout in seconds. If the wait times out, return `null`.
  - **deadlineEpochMS**: An absolute deadline as a Unix epoch timestamp in milliseconds. If the deadline passes, return `null`.
  - **pollingIntervalMs**: The interval, in milliseconds, between system database polls while waiting.

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
Can only be called from within a workflow or step.

**Parameters:**
- **key**: The stream key/name within the workflow.

### DBOS.readStream

```typescript
DBOS.readStream<T>(
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

Read values from a stream as an async generator.
This function reads values from a stream identified by the workflowID and key,
yielding each value in order until the stream is closed or the workflow terminates.

**Parameters:**
- **workflowID**: The workflow instance ID that owns the stream.
- **key**: The stream key/name within the workflow.
- **options.offset**: The offset to start reading from. Defaults to `0`, the start of the stream. A higher offset skips that many values from the beginning of the stream. Must be a non-negative integer.
- **options.pollingIntervalMs**: The interval, in milliseconds, between system database polls while waiting for new values. Must be at least `1`.
- **options.timeoutSeconds**: How long to wait for **each** value before throwing `DBOSStreamTimeoutError`. The clock restarts every time a value is delivered, so this bounds the gap between values, not the total duration of the read. Defaults to waiting indefinitely.

**Returns:**
- An async generator that yields each value in the stream until the stream is closed.

**Throws:**
- `DBOSStreamTimeoutError`: If `timeoutSeconds` passes without a value arriving.

**Example syntax:**

```typescript
for await (const value of DBOS.readStream(workflowID, "example_key")) {
  console.log(`Received: ${JSON.stringify(value)}`);
}
```

When called from workflow code, each value read is checkpointed to the database as a step, so a replayed workflow re-yields the values it originally read instead of re-reading a stream that may have advanced since.

### DBOS.readStreamOffset

```typescript
DBOS.readStreamOffset<T>(
  workflowID: string,
  key: string,
  offset: number,
  options?: ReadStreamOffsetOptions
): Promise<T>

type ReadStreamOffsetOptions = Omit<ReadStreamOptions, 'offset'>;
```

Read the single value at one offset of a stream, waiting for it to be written.
Use this when you want one specific value instead of iterating the whole stream&mdash;for example, to resume from where a previous reader left off.

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

**Example syntax:**

```typescript
const value = await DBOS.readStreamOffset(workflowID, "example_key", 5, { timeoutSeconds: 30 });
```

Like [`DBOS.readStream`](#dbosreadstream), a value read from workflow code is checkpointed to the database as a step.

:::note
When a checkpointed timeout is replayed, it is revived as a plain `Error` rather than a `DBOSStreamTimeoutError`, so `instanceof` does not hold.
Use the exported `isStreamTimeoutError` helper to match it in either case.
:::

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
  status?: string | string[]; // Retrieve workflows with this status (or any of these statuses). Must be `ENQUEUED`, `DELAYED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`.
  startTime?: string; // Retrieve workflows started after this (RFC 3339-compliant) timestamp.
  endTime?: string; // Retrieve workflows started before this (RFC 3339-compliant) timestamp.
  completedAfter?: string; // Retrieve workflows completed at or after this (RFC 3339-compliant) timestamp.
  completedBefore?: string; // Retrieve workflows completed at or before this (RFC 3339-compliant) timestamp.
  dequeuedAfter?: string; // Retrieve workflows dequeued at or after this (RFC 3339-compliant) timestamp.
  dequeuedBefore?: string; // Retrieve workflows dequeued at or before this (RFC 3339-compliant) timestamp.
  authenticatedUser?: string | string[]; // Retrieve workflows run by this authenticated user (or any of these users).
  applicationVersion?: string | string[]; // Retrieve workflows started on this application version (or any of these versions).
  executorId?: string | string[]; // Retrieve workflows run by this executor ID (or any of these executor IDs).
  workflow_id_prefix?: string | string[]; // Retrieve workflows whose ID have this prefix (or any of these prefixes).
  queueName?: string | string[]; // If this workflow is enqueued, on which queue (or any of these queues).
  queuesOnly?: boolean; // Return only workflows that are actively enqueued.
  forkedFrom?: string | string[]; // Get workflows forked from this workflow ID (or any of these workflow IDs).
  wasForkedFrom?: boolean; // Filter workflows that have (or have not) been forked from.
  parentWorkflowID?: string | string[]; // Get workflows started by this parent workflow ID (or any of these parent workflow IDs).
  hasParent?: boolean; // If true, only return workflows that have a parent. If false, only return workflows without a parent.
  attributes?: Record<string, unknown>; // Retrieve workflows whose custom attributes contain all of these key-value pairs.
  scheduleName?: string | string[]; // Retrieve workflows enqueued by this scheduled workflow (or any of these schedule names).
  applicationName?: string | string[]; // Retrieve workflows owned by these applications (workflows owned by no application are always included). If unset, retrieve only this application's workflows.
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
  workflowID: string,
  options?: ListWorkflowStepsOptions
): Promise<StepInfo[] | undefined>
```

```typescript
interface ListWorkflowStepsOptions {
  limit?: number;
  offset?: number;
}
```

Retrieve the steps of a workflow. Returns `undefined` if the workflow is not found.
Steps are ordered by `functionID`. Use `limit` and `offset` to paginate results.
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

### DBOS.setWorkflowPriority

```typescript
DBOS.setWorkflowPriority(
  workflowID: string,
  priority: number
): Promise<void>
```

Set the priority of a queued workflow.
Only affects workflows with `ENQUEUED` status.

**Parameters:**
- **workflowID**: The ID of the workflow whose priority to update.
- **priority**: Priority value (`1` to `2,147,483,647`). Lower values are dequeued first.

Throws `DBOSInvalidQueuePriorityError` if the priority is out of range.

### DBOS.setWorkflowDelay

```typescript
DBOS.setWorkflowDelay(
  workflowID: string,
  options: SetWorkflowDelayOptions
): Promise<void>
```

```typescript
interface SetWorkflowDelayOptions {
  delaySeconds?: number;
  delayUntilEpochMS?: number;
}
```

Set or update the delay on a workflow.
Only affects workflows with `DELAYED` status.
Provide exactly one of `delaySeconds` or `delayUntilEpochMS`.

**Parameters:**
- **workflowID**: The ID of the workflow whose delay to set.
- **options**:
  - **delaySeconds**: Delay the workflow by this many seconds from now. Must be greater than 0.
  - **delayUntilEpochMS**: Delay the workflow until this absolute time, specified as a Unix epoch timestamp in milliseconds. Must be greater than 0.

### DBOS.cancelWorkflow

```typescript
cancelWorkflow(
  workflowID: string,
  options?: { cancelChildren?: boolean }
): Promise<void>
```

Cancel a workflow.
This sets is status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step)

**Parameters:**
- **workflowID**: The ID of the workflow to cancel.
- **cancelChildren**: If true, also cancel all child workflows recursively. Defaults to false.

### DBOS.cancelWorkflows

```typescript
DBOS.cancelWorkflows(
  workflowIDs: string[],
  options?: { cancelChildren?: boolean }
): Promise<void>
```

Cancel multiple workflows. Behaves like [`cancelWorkflow`](#dboscancelworkflow) but operates on a list of workflow IDs.

### DBOS.resumeWorkflow

```typescript
DBOS.resumeWorkflow<T>(
  workflowID: string,
  options?: { queueName?: string }
): Promise<WorkflowHandle<Awaited<T>>>
```

Resume a workflow.
This immediately starts it from its last completed step.
You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

If `queueName` is provided, the resumed workflow is enqueued on the specified queue instead of starting immediately.

### DBOS.resumeWorkflows

```typescript
DBOS.resumeWorkflows<T>(
  workflowIDs: string[],
  options?: { queueName?: string }
): Promise<WorkflowHandle<Awaited<T>>[]>
```

Resume multiple workflows. Behaves like [`resumeWorkflow`](#dbosresumeworkflow) but operates on a list of workflow IDs and returns a list of handles.

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

### DBOS.deleteWorkflows

```typescript
DBOS.deleteWorkflows(
  workflowIDs: string[],
  deleteChildren?: boolean
): Promise<void>
```

Delete multiple workflows and all their associated data. Behaves like [`deleteWorkflow`](#dbosdeleteworkflow) but operates on a list of workflow IDs.

### DBOS.forkWorkflow

```typescript
static async forkWorkflow<T>(
  workflowID: string,
  startStep: number,
  options?: {
    newWorkflowID?: string;
    applicationVersion?: string;
    timeoutMS?: number;
    queueName?: string;
    queuePartitionKey?: string;
    replacementChildren?: Record<string, string>;
  },
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
- **queueName**: If provided, the forked workflow is enqueued on the specified queue instead of starting immediately.
- **queuePartitionKey**: If the queue is partitioned, the partition key for the forked workflow.
- **replacementChildren**: A mapping from original child workflow IDs to replacement child workflow IDs. When the forked workflow encounters a step that started a child workflow matching an original ID, it substitutes the replacement ID instead. This is useful when you need to fork a parent workflow that depends on the results of child workflows that have also been forked.

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```typescript
export interface WorkflowStatus {
  // The workflow ID
  readonly workflowID: string;
  // The status of the workflow.  One of PENDING, SUCCESS, ERROR, ENQUEUED, DELAYED, CANCELLED, or MAX_RECOVERY_ATTEMPTS_EXCEEDED.
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
  // The time the workflow completed (transitioned to SUCCESS, ERROR, or CANCELLED), as a UNIX epoch timestamp in milliseconds. Undefined if the workflow has not completed.
  readonly completedAt?: number;

  // If this workflow was forked from another, that workflow's ID.
  readonly forkedFrom?: string;
  // Whether this workflow has ever been forked from by another workflow.
  readonly wasForkedFrom?: boolean;
  // If this workflow was started by another workflow, that workflow's ID.
  readonly parentWorkflowID?: string;

  // Custom key-value attributes attached to the workflow at creation, if any.
  readonly attributes?: Record<string, unknown>;

  // If this workflow was enqueued by a scheduled workflow, that schedule's name.
  readonly scheduleName?: string;

  // The application that owns this workflow, or undefined if it is owned by no application.
  readonly applicationName?: string;
}
```

## Workflow Schedules

You can create, manage, and delete cron schedules at runtime using the DBOS schedule management API.
Schedules are stored in the database and can be created, paused, resumed, or deleted while the application is running.

Scheduled workflow functions take two arguments: a `Date` (the scheduled execution time) and a context object.

### DBOS.createSchedule

```typescript
DBOS.createSchedule(options: {
  scheduleName: string;
  workflowFn: (scheduledDate: Date, context: unknown) => Promise<void>;
  schedule: string;
  context?: unknown;
  options?: ScheduleOptions;
}): Promise<void>

interface ScheduleOptions {
  automaticBackfill?: boolean;
  cronTimezone?: string;
  queueName?: string;
}
```

Create a cron schedule that periodically invokes a workflow function.
If called from within a workflow, the operation is recorded as a step.

**Parameters:**
- **scheduleName**: Unique name identifying this schedule.
- **workflowFn**: The workflow function to invoke. Must take two arguments: a `Date` (the scheduled execution time) and a context object.
- **schedule**: A cron expression. Supports seconds as the first field with 6-field format.
- **context**: An optional context object passed to the workflow function on each invocation. Must be serializable.
- **options.automaticBackfill**: If `true`, on startup the scheduler will automatically backfill missed executions since the last time the schedule fired. Defaults to `false`.
- **options.cronTimezone**: [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (e.g. `"America/New_York"`) in which to evaluate the cron expression. Defaults to the system's local timezone.
- **options.queueName**: Optional name of a declared queue to enqueue scheduled workflows to. If not provided, uses an internal queue. This is useful for managing the concurrency of scheduled workflows.

Schedules are owned by the application that creates them: only that application's processes fire the schedule, and its workflows run on that application.
Schedule names are globally unique across all applications sharing a system database, so creating a schedule whose name is owned by a different application throws an error.

**Example:**

```typescript
async function myPeriodicTask(scheduledTime: Date, context: unknown) {
    DBOS.logger.info(`Running task scheduled for ${scheduledTime}`);
}
const myPeriodicTaskWorkflow = DBOS.registerWorkflow(myPeriodicTask);

await DBOS.createSchedule({
    scheduleName: "my-task-schedule",
    workflowFn: myPeriodicTaskWorkflow,
    schedule: "*/5 * * * *",
});
```

### DBOS.updateSchedule

```typescript
DBOS.updateSchedule(
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

Update an existing schedule in place.
Unlike [`applySchedules`](#dbosapplyschedules), which replaces a schedule's entire definition, this changes only the fields you pass and preserves everything else, including the schedule's ID, status, and last-fired time.
Throws if no schedule with the given name exists.
If called from within a workflow, the operation is recorded as a step.

**Parameters:**
- **name**: The name of the schedule to update.
- **updates**: The fields to change. Any field you omit is left unchanged. `cronTimezone` and `queueName` may be set to `null` to clear them (reverting the schedule to the system's local timezone and to the internal queue, respectively). The workflow a schedule invokes cannot be changed; use [`applySchedules`](#dbosapplyschedules) for that.

:::note
`context` is special: because `undefined` is itself a valid context, passing the key at all sets the context, even if its value is `undefined`. To leave the context unchanged, omit the key entirely.
:::

**Example:**

```typescript
// Change the cadence, and clear the schedule's queue.
await DBOS.updateSchedule("my-task-schedule", {
    schedule: "0 * * * *",
    queueName: null,
});
```

### DBOS.listSchedules

```typescript
DBOS.listSchedules(filters?: {
  status?: string | string[];
  workflowName?: string | string[];
  scheduleNamePrefix?: string | string[];
  applicationName?: string | string[];
}): Promise<WorkflowSchedule[]>
```

Return all registered workflow schedules, optionally filtered. Returns a list of [`WorkflowSchedule`](#workflowschedule).

**Parameters:**
- **status**: Filter by status (e.g. `"ACTIVE"`) or a list of statuses.
- **workflowName**: Filter by workflow name or a list of names.
- **scheduleNamePrefix**: Filter by schedule name prefix or a list of prefixes.
- **applicationName**: List only schedules owned by this application (or one of these applications). Schedules owned by no application are always included. If unset, list only this application's schedules.

### DBOS.getSchedule

```typescript
DBOS.getSchedule(name: string): Promise<WorkflowSchedule | null>
```

Return the [`WorkflowSchedule`](#workflowschedule) with the given name, or `null` if it does not exist.

### DBOS.deleteSchedule

```typescript
DBOS.deleteSchedule(name: string): Promise<void>
```

Delete the schedule with the given name. No-op if it does not exist.

### DBOS.pauseSchedule

```typescript
DBOS.pauseSchedule(name: string): Promise<void>
```

Pause the schedule with the given name. A paused schedule does not fire.

### DBOS.resumeSchedule

```typescript
DBOS.resumeSchedule(name: string): Promise<void>
```

Resume a paused schedule so it begins firing again.

### DBOS.applySchedules

```typescript
DBOS.applySchedules(
  schedules: Array<{
    scheduleName: string;
    workflowFn: (scheduledDate: Date, context: unknown) => Promise<void>;
    schedule: string;
    context?: unknown;
    automaticBackfill?: boolean;
    cronTimezone?: string;
    queueName?: string;
  }>,
): Promise<void>
```

Atomically apply a set of schedules.
Creates or updates each schedule in the list.
May not be called from within a workflow.

Existing schedules are upserted by name: all definition fields are replaced with the new entry's values (so any optional field left unset is cleared, e.g. an omitted `queueName` reverts the schedule to the internal queue), while the schedule's status and last-fired time are preserved.

**Example:**

```typescript
await DBOS.applySchedules([
    { scheduleName: "schedule-a", workflowFn: workflowA, schedule: "*/10 * * * *" },  // Every 10 minutes
    { scheduleName: "schedule-b", workflowFn: workflowB, schedule: "0 0 * * *" },     // Every day at midnight
]);
```

### DBOS.backfillSchedule

```typescript
DBOS.backfillSchedule(
  name: string,
  start: Date,
  end: Date,
): Promise<WorkflowHandle<unknown>[]>
```

Enqueue all executions of a schedule that would have run between `start` and `end`.
Each execution uses the same deterministic workflow ID as the live scheduler, so already-executed times are skipped.
May not be called from within a workflow.

### DBOS.triggerSchedule

```typescript
DBOS.triggerSchedule(name: string): Promise<WorkflowHandle<unknown>>
```

Immediately enqueue the scheduled workflow at the current time.
May not be called from within a workflow.

### WorkflowSchedule

Some schedule management methods return the `WorkflowSchedule` type:

```typescript
interface WorkflowSchedule {
    // The unique identifier of the schedule
    scheduleId: string;
    // The human-readable name of the schedule
    scheduleName: string;
    // The name of the workflow function to execute
    workflowName: string;
    // The class name of the workflow function, if it is a class method
    workflowClassName: string;
    // The cron expression defining the schedule
    schedule: string;
    // The status of the schedule: "ACTIVE" or "PAUSED"
    status: string;
    // The context object passed to each workflow invocation
    context: unknown;
    // The timestamp of when the schedule last fired, if ever
    lastFiredAt: string | null;
    // Whether missed executions are automatically backfilled on startup
    automaticBackfill: boolean;
    // The IANA timezone in which the cron expression is evaluated, or null for system local time
    cronTimezone: string | null;
    // The name of the queue scheduled workflows are enqueued to, or null for the internal queue
    queueName: string | null;
    // The application that owns this schedule, or undefined if it is owned by no application
    applicationName?: string;
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
  applicationName?: string;
}
```

**Parameters:**
- **workflow**: The workflow to debounce. Note that workflows from [configured instances](./workflows-steps.md#instance-method-workflows) cannot be debounced.
- **startWorkflowParams**: Optional workflow parameters, as in [`startWorkflow`](#dbosstartworkflow). Applied to all workflows started from this debouncer.
- **debounceTimeoutMs**: After this time elapses since the first time a workflow is submitted from this debouncer, the workflow is started regardless of the debounce period.
- **applicationName**: Debounce on behalf of this application instead of your own: the debounced workflow is owned and run by that application. This option is the only way to name a target application: setting `applicationName` in `startWorkflowParams.enqueueOptions` throws an error.

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
  // For steps configured with `timeoutMS`: an AbortSignal that fires when the current attempt's timeout
  // expires, so the step can cancel its underlying operation. A fresh signal is issued for each retry attempt.
  timeoutSignal?: AbortSignal;
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

## Version Management

DBOS automatically tracks application versions.
Each time DBOS launches, it registers the current application version in the system database.
You can use these methods to list all registered versions, find the latest version, or promote a version to latest.

### DBOS.listApplicationVersions

```typescript
static async DBOS.listApplicationVersions(): Promise<VersionInfo[]>

interface VersionInfo {
  // A unique ID for this version
  versionId: string;
  // The unique name of this version
  versionName: string;
  // The epoch timestamp (in milliseconds) of this version. Used to determine the latest version.
  versionTimestamp: number;
  // The epoch timestamp (in milliseconds) when this version was first registered.
  createdAt: number;
  // The application that registered this version, or undefined if it is owned by no application
  applicationName?: string;
}
```

Return all registered application versions, ordered by timestamp descending (newest first).
Versions are tracked per application: this returns only versions registered by this application, plus versions owned by no application.

### DBOS.getLatestApplicationVersion

```typescript
static async DBOS.getLatestApplicationVersion(): Promise<VersionInfo>
```

Return the latest application version (the one with the highest timestamp) among versions registered by this application, plus versions owned by no application.
Throws if no versions are registered.

### DBOS.setLatestApplicationVersion

```typescript
static async DBOS.setLatestApplicationVersion(
  versionName: string,
  options?: { applicationName?: string },
): Promise<void>
```

Promote a version to latest by updating its timestamp to the current time.
This is useful when rolling back to a previous application version.

**Parameters:**
- `versionName`: The name of the version to promote.
- `options.applicationName`: The application to act as. Defaults to this application. Version names are globally unique across applications sharing a system database, so promoting a version registered by a different application throws an error.

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
handle.getResult(
  options?: { pollingIntervalMs?: number }
): Promise<R>;
```

Wait for the workflow to complete, then return its result.

**Parameters:**
- **options**:
  - **pollingIntervalMs**: The interval, in milliseconds, between system database polls while waiting. Only applies to handles that wait by polling the database (such as handles from [`DBOS.retrieveWorkflow`](#dbosretrieveworkflow) or the [DBOS Client](./client.md)), not to a handle from `DBOS.startWorkflow` in the same process.

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
