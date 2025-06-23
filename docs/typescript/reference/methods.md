---
sidebar_position: 30
title: DBOS Methods & Variables
---

## DBOS Methods

### DBOS.send

```typescript
DBOS.send<T>(
  destinationID: string, 
  message: T, 
  topic?: string, 
  idempotencyKey?: string
): Promise<void>
```

Send a message to the workflow identified by `destinationID`.
Messages can optionally be associated with a topic.

**Parameters:**
- **destinationID**: The workflow to which to send the message.
- **message**: The message to send. Must be serializable.
- **topic**: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- **idempotencyKey**: If `DBOS.send` is called from outside a workflow and an idempotency key is set, the message will only be sent once no matter how many times `DBOS.send` is called with this key.

### DBOS.recv

```typescript
recv<T>(
  topic?: string,
  timeoutSeconds?: number
): Promise<T | null>
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning `null` if the wait times out.
If no topic is specified, `recv` can only access messages sent without a topic.

**Parameters:**
- **topic**: A topic queue on which to wait.
- **timeoutSeconds**: A timeout in seconds. If the wait times out, return `None`.

**Returns:**
- The first message enqueued on the input topic, or `null` if the wait times out.

### DBOS.setEvent

```typescript
DBOS.setEvent<T>(
  key: string,
  value: T
): Promise<void>
```

Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
Can only be called from within a workflow.

**Parameters:**
- **key**: The key of the event.
- **value**: The value of the event. Must be serializable.

### DBOS.getEvent

```typescript
DBOS.getEvent<T>(
  workflowID: string,
  key: string,
  timeoutSeconds?: number
): Promise<T | null>
```

Retrieve the latest value of an event published by the workflow identified by `workflowID` to the key `key`.
If the event does not yet exist, wait for it to be published, returning `null` if the wait times out.

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

### DBOS.retrieveWorkflow

```typescript
DBOS.retrieveWorkflow<T>(
  workflowID: string,
): WorkflowHandle<Awaited<T>> 
```

Retrieve the [handle](#workflow-handles) of a workflow.

**Parameters**:
- **workflowID**: The ID of the workflow whose handle to retrieve.

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
}
```

Start a workflow in the background and return a [handle](#workflow-handles) to it.
Optionally enqueue it on a DBOS queue.
The `DBOS.startWorkflow` method resolves after the workflow is durably started; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

**Example syntax:**

To start a workflow created by registering a function:

```typescript
async function example(input: number) {
    // Call steps
}
const exampleWorkflow = DBOS.registerWorkflow(example, "exampleWorkflow");

const input = 10;
const handle = await DBOS.startWorkflow(exampleWorkflow)(input);
```

To start a workflow created by decorating a class method:

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
- **deduplicationID**: Optionally specified when enqueueing a workflow. At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDuplicatedError` exception.
- **priority**: Optionally specified when enqueueing a workflow. The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.



## Workflow Management Methods

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```typescript
export interface WorkflowStatus {
  // The workflow ID
  readonly workflowID: string;
  // The workflow status. Must be one of ENQUEUED, PENDING, SUCCESS, ERROR, CANCELLED, or RETRIES_EXCEEDED
  readonly status: string;
  // The name of the workflow function.
  readonly workflowName: string;
  // The name of the workflow's class, if any
  readonly workflowClassName: string; // The class name holding the workflow function.
  // The name with which the workflow's class instance was configured, if any.
  readonly workflowConfigName?: string;
  // If the workflow was enqueued, the name of the queue.
  readonly queueName?: string;
  // The workflow's output, if any.
  readonly output?: unknown;
  // The error thrown by the workflow, if any.
  readonly error?: unknown;
  // The deserialized workflow inputs.
  readonly input?: unknown[];
  // The ID of the executor (process) that most recently executed this workflow.
  readonly executorId?: string;
  // The application version on which this workflow started.
  readonly applicationVersion?: string;
  // The number of times this workflow has been started.
  readonly recoveryAttempts?: number;
  // Workflow start time, as a UNIX epoch timestamp in milliseconds
  readonly createdAt: number;
  // Last time the workflow status was updated, as a UNIX epoch timestamp in milliseconds. For a completed workflow, this is the workflow completion timestamp.
  readonly updatedAt?: number;
  // The timeout specified for this workflow, if any. Timeouts are start-to-close.
  readonly timeoutMS?: number | null;
  // The deadline at which this workflow times out, if any. Not set until the workflow begins execution.
  readonly deadlineEpochMS?: number;
}
```

## DBOS Variables

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
handle.getStatus(): Promise<WorkflowStatus>;
```

Retrieve the [`WorkflowStatus`](#workflow-status) of the workflow.

## Context Management