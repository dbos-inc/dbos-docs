---
sidebar_position: 30
title: DBOS Methods & Variables
toc_max_heading_level: 3
---

## DBOS Methods

### getEvent

```java
Object getEvent(String workflowId, String key, float timeOut)
```

Retrieve the latest value of an event published by the workflow identified by `workflowId` to the key `key`.
If the event does not yet exist, wait for it to be published, an error if the wait times out.

**Parameters:**
- **workflowId**: The identifier of the workflow whose events to retrieve.
- **key**: The key of the event to retrieve.
- **timeout**: A timeout in seconds. If the wait times out, return null.

### setEvent

```java
void setEvent(String key, Object value)
```
Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
Can only be called from within a workflow.

**Parameters:**
- **key**: The key of the event.
- **message**: The value of the event. Must be serializable.

### send

```java
void send(String destinationId, Object message, String topic)
```

Send a message to the workflow identified by `destinationID`.
Messages can optionally be associated with a topic.

**Parameters:**
- **destinationId**: The workflow to which to send the message.
- **message**: The message to send. Must be serializable.
- **topic**: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.

### recv

```java
Object recv(String topic, float timeoutSeconds)
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning an error if the wait times out.

**Parameters:**
- **topic**: A topic queue on which to wait.
- **timeoutSeconds**: A timeout in seconds. If the wait times out, return null.

### sleep

```java
void sleep(float seconds)
```

Sleep for the given duration.
May only be called from within a workflow.
This sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.

**Parameters:**
- **seconds**: The duration to sleep in seconds.

### retrieveWorkflow

```go
WorkflowHandle<T, E> retrieveWorkflow(String workflowId)
```

Retrieve the [handle](./workflows-steps.md#workflowhandle) of a workflow.

**Parameters**:
- **workflowId**: The ID of the workflow whose handle to retrieve.
