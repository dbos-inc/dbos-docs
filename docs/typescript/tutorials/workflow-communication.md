---
sidebar_position: 50
title: Communicating with Workflows
---

DBOS provides a few different ways to communicate with your workflows.
You can:

- [Send messages to workflows](#workflow-messaging-and-notifications)
- [Publish events from workflows for clients to read](#workflow-events)
- [Stream values from workflows to clients](#workflow-streaming)


## Workflow Messaging and Notifications
You can send messages to a specific workflow.
This is useful for sending notifications to a workflow while it's running.

<img src={require('@site/static/img/workflow-communication/workflow-messages.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### Send

You can call `DBOS.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

You can also call [`send`](../reference/client.md#send) from outside of your DBOS application with the [DBOS Client](../reference/client.md).

```typescript
DBOS.send<T>(destinationID: string, message: T, topic?: string): Promise<void>;
```

#### Recv

Workflows can call `DBOS.recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `null` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

```typescript
DBOS.recv<T>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in the [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/e-commerce), the checkout workflow, after redirecting customers to a secure payments service, must wait for a notification from that service that the payment has finished processing.

To wait for this notification, the payments workflow uses `recv()`, executing failure-handling code if the notification doesn't arrive in time:

```javascript
@DBOS.workflow()
static async checkoutWorkflow(...): Promise<void> {
  ...
  const notification = await DBOS.recv<string>(PAYMENT_STATUS, timeout);
  if (notification) {
      ... // Handle the notification.
  } else {
      ... // Handle a timeout.
  }
}
```

A webhook waits for the payment processor to send the notification, then uses `send()` to forward it to the workflow:

```javascript
static async paymentWebhook(): Promise<void> {
  const notificationMessage = ... // Parse the notification.
  const workflowID = ... // Retrieve the workflow ID from notification metadata.
  await DBOS.send(workflowID, notificationMessage, PAYMENT_STATUS);
}
```

#### Reliability Guarantees

All messages are persisted to the database, so if `send` completes successfully, the destination workflow is guaranteed to be able to `recv` it.
If you're sending a message from a workflow, DBOS guarantees exactly-once delivery.
If you're sending a message from normal TypeScript code, you can specify an idempotency key for `send` to guarantee exactly-once delivery.

## Workflow Events

Workflows can publish _events_, which are key-value pairs associated with the workflow.
They are useful for publishing information about the status of a workflow or to send a result to clients while the workflow is running.

<img src={require('@site/static/img/workflow-communication/workflow-events.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### setEvent

Any workflow can call [`DBOS.setEvent`](../reference/methods.md#dbossetevent) to publish a key-value pair, or update its value if has already been published.

```typescript
DBOS.setEvent<T>(key: string, value: T): Promise<void>
```

#### getEvent

You can call [`DBOS.getEvent`](../reference/methods.md#dbosgetevent) to retrieve the value published by a particular workflow ID for a particular key.
If the event does not yet exist, this call waits for it to be published, returning `null` if the wait times out.

You can also call [`getEvent`](../reference/client.md#getevent) from outside of your DBOS application with [DBOS Client](../reference/client.md).

```typescript
DBOS.getEvent<T>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in the [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/e-commerce), the checkout workflow, after validating an order, directs the customer to a secure payments service to handle credit card processing.
To communicate the payments URL to the customer, it uses events.

The checkout workflow emits the payments URL using `setEvent()`:

```javascript
@DBOS.workflow()
static async checkoutWorkflow(...): Promise<void> {
  ...
  const paymentsURL = ...
  await DBOS.setEvent(PAYMENT_URL, paymentsURL);
  ... 
}
```

The HTTP handler that originally started the workflow uses `getEvent()` to await this URL, then redirects the customer to it:

```javascript
static async webCheckout(...): Promise<void> {
  const handle = await DBOS.startWorkflow(Shop).checkoutWorkflow(...);
  const url = await DBOS.getEvent<string>(handle.workflowID, PAYMENT_URL);
  if (url === null) {
    DBOS.koaContext.redirect(`${origin}/checkout/cancel`);
  } else {
    DBOS.koaContext.redirect(url);
  }
}
```

#### Reliability Guarantees

All events are persisted to the database, so the latest version of an event is always retrievable.
Additionally, if `getEvent` is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated.

## Workflow Streaming

Workflows can stream data in real time to clients.
This is useful for streaming results from a long-running workflow or LLM call or for monitoring or progress reporting.

<img src={require('@site/static/img/workflow-communication/workflow-streams.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### Writing to Streams

You can write values to a stream from a workflow or its steps using [`DBOS.writeStream`](../reference/methods.md#dboswritestream).
A workflow may have any number of streams, each identified by a unique key.

```typescript
DBOS.writeStream<T>(key: string, value: T): Promise<void>
```

When you are done writing to a stream, you should close it with [`DBOS.closeStream`](../reference/methods.md#dbosclosestream).
Otherwise, streams are automatically closed when the workflow terminates.

```typescript
DBOS.closeStream(key: string): Promise<void>
```

DBOS streams are immutable and append-only.
Writes to a stream from a workflow happen exactly-once.
Writes to a stream from a step happen at-least-once; if a step fails and is retried, it may write to the stream multiple times.
Readers will see all values written to the stream from all tries of the step in the order in which they were written.

**Example syntax:**

```typescript
async function producerWorkflowFunction() {
  await DBOS.writeStream("example_key", { step: 1, data: "value1" });
  await DBOS.writeStream("example_key", { step: 2, data: "value2" });
  await DBOS.closeStream("example_key"); // Signal completion
}

const producerWorkflow = DBOS.registerWorkflow(producerWorkflowFunction);
```

#### Reading from Streams

You can read values from a stream from anywhere using [`DBOS.readStream`](../reference/methods.md#dbosreadstream).
This function reads values from a stream identified by a workflow ID and key, yielding each value in order until the stream is closed or the workflow terminates.

```typescript
DBOS.readStream<T>(workflowID: string, key: string): AsyncGenerator<T, void, unknown>
```

You can also read from a stream from outside a DBOS application with a [DBOS Client](../reference/client.md#readstream).

**Example syntax:**

```typescript
for await (const value of DBOS.readStream(workflowID, "example_key")) {
  console.log(`Received: ${JSON.stringify(value)}`);
}
```