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