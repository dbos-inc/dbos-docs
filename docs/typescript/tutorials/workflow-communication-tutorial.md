---
sidebar_position: 40
title: Workflow Communication
description: Learn how to write interactive workflows
---

In this guide, you'll learn how to implement communication with and between workflows.

Workflow communication is useful if you want to make your workflows _interactive_, for example if a long-running workflow needs to query a user for input or report intermediate results back to its caller.
DBOS provides two workflow communication APIs, the events API and the messages API.

### Events API

This API allows workflows to emit and listen for events.
Events are key-value pairs.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### setEvent

Any workflow can call [`DBOS.setEvent`](../../reference/transactapi/dbos-class#dbossetevent) to publish a key-value pair.

```typescript
DBOS.setEvent<T>(key: string, value: T): Promise<void>
```

#### getEvent

[`DBOS.getEvent()`](../../reference/transactapi/dbos-class#dbosgetevent) can be used to retrieve the value published by a particular workflow identity for a particular key.
A call to `getEvent()` waits for the workflow to publish the key, returning `null` if the wait times out:

```typescript
DBOS.getEvent<T>(workflowID: string, key:string, timeoutSeconds?: number);
```

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in our [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/e-commerce), the payments workflow, after validating an order, needs to direct the customer to a secure payments service to handle credit card processing.
To communicate the payments URL to the customer, it uses events.

After validating an order, the payments workflow emits an event containing a payment link using `setEvent()`:

```javascript
  @DBOS.workflow()
  static async paymentWorkflow(...): Promise<void> {
    ... // Order validation
    const paymentsURL = ...
    await DBOS.setEvent(checkout_url_key, paymentsURL);
    ... // Continue handling payment
  }
```

The handler that originally invoked the workflow uses `getEvent()` to await this URL, then redirects the customer to it:

```javascript
  @DBOS.postApi('/api/checkout_session')
  static async webCheckout(...): Promise<void> {
    const handle = await DBOS.startWorkflow(Shop).paymentWorkflow(...);
    const url = await DBOS.getEvent<string>(handle.getWorkflowUUID(), checkout_url_key);
    if (url === null) {
      DBOS.koaContext.redirect(`${origin}/checkout/cancel`);
    } else {
      DBOS.koaContext.redirect(url);
    }
  }
```

#### Reliability Guarantees

All events are persisted to the database durably, so once an event it set, it is guaranteed to always be retrievable.

### Messages API
This API allows operations to send messages to a specific [workflow instance](./workflow-tutorial#workflow-identity).

#### Send

Messages can be sent to a workflow using `DBOS.send()`.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

```typescript
DBOS.send<T>(destinationID: string, message: T, topic?: string): Promise<void>;
```

#### Recv

Workflows can call `DBOS.recv()` to receive messages sent to their identity, optionally for a particular topic.
Each call to `DBOS.recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `null` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

```typescript
DBOS.recv<T>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in our [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/e-commerce), the payments workflow, after redirecting customers to a secure payments service, must wait for a notification from that service that the payment has finished processing.

To wait for this notification, the payments workflow uses `recv()`, executing failure-handling code if the notification doesn't arrive in time:

```javascript
@DBOS.workflow()
static async paymentWorkflow(...): Promise<void> {
  ... // Validate the order, then redirect customers to a secure payments service.
  const notification = await DBOS.recv<string>(checkout_complete_topic, timeout);
  if (notification) {
      ... // Handle the notification.
  } else {
      ... // Notification did not arrive. Query payment state from the payment provider.
  }
}
```

A webhook waits for the payment processor to send the notification, then uses `send()` to forward it to the workflow:

```javascript
@DBOS.postApi('/payment_webhook')
static async paymentWebhook(): Promise<void> {
  const notificationMessage = ... // Parse the notification.
  const workflowIdentityUUID = ... // Retrieve the workflow identity from notification metadata.
  await DBOS.send(workflowIdentityUUID, notificationMessage, checkout_complete_topic);
}
```

#### Reliability Guarantees

All messages are persisted to the database, so if `send()` completes successfully, the destination workflow is guaranteed to be able to `recv()` it.
If you're sending a message from a workflow, we guarantee exactly-once delivery because [workflows are reliable](./workflow-tutorial#reliability-guarantees).
If you're sending a message outside of a workflow, you can supply an [idempotency key](../../reference/transactapi/dbos-class#dbossend) to guarantee exactly-once delivery.

