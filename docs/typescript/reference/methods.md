---
sidebar_position: 30
title: DBOS Methods & Variables
---

DBOS provides a number of useful context methods and variables.
All are accessed through the syntax `DBOS.<method>`.

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

## DBOS Variables

## Context Management