---
sidebar_position: 6
title: Workflow Communication
description: Learn how to write interactive workflows
---

In this guide, you'll learn how to implement communication with and between workflows.

Workflow communication is useful if you want to make your workflows _interactive_, for example if a long-running workflow needs to query a user for input or report intermediate results back to its caller.
DBOS provides two workflow communication APIs, the events API and the messages API.

### Events API

This API allows workflows to emit and listen for events.
Events are immutable key-value pairs.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### setEvent

Any workflow can call [`ctxt.setEvent`](../api-reference/contexts#workflowctxtsetevent) to immutably publish a key-value pair.
A workflow cannot set a key it has already set.

```typescript
ctxt.setEvent<T>(key: string, value: T): Promise<void>
```

#### getEvent

[Handlers](../tutorials/http-serving-tutorial.md#handlers) can call `ctxt.getEvent()` to retrieve the value published by a particular workflow identity for a particular key.
A call to `getEvent()` waits for the workflow to publish the key, returning `null` if the wait times out:

```typescript
ctxt.getEvent<T>(workflowIdentityUUID: string, key:string, timeoutSeconds?: number);
```

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in our [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/e-commerce), the payments workflow, after validating an order, needs to direct the customer to a secure payments service to handle credit card processing.
To communicate the payments URL to the customer, it uses events.

After validating an order, the payments workflow emits an event containing a payment link using `setEvent()`:

```javascript
  @Workflow()
  static async paymentWorkflow(ctxt: WorkflowContext, ...): Promise<void> {
    ... // Order validation
    const paymentsURL = ...
    await ctxt.setEvent(checkout_url_key, paymentsURL);
    ... // Continue handling payment
  }
```

The handler that originally invoked the workflow uses `getEvent()` to await this URL, then redirects the customer to it:

```javascript
  @PostApi('/api/checkout_session')
  static async webCheckout(ctxt: HandlerContext, ...): Promise<void> {
    const handle = await ctxt.invoke(Shop).paymentWorkflow(...);
    const url = await ctxt.getEvent<string>(handle.getWorkflowUUID(), checkout_url_key);
    if (url === null) {
      ctxt.koaContext.redirect(`${origin}/checkout/cancel`);
    } else {
      ctxt.koaContext.redirect(url);
    }
  }
```

#### Reliability Guarantees

All events are persisted to the database and are immutable, so once an event it set, it is guaranteed to always be retrievable.

### Messages API
This API allows operations to send messages to a specific [workflow identity](./workflow-tutorial#workflow-identity).

#### Send

Any workflow or handler can call `ctxt.send()` to send a message to a workflow identity.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

```typescript
ctxt.send<T>(destinationIdentityUUID: string, message: T, topic?: string): Promise<void>;
```

#### Recv

Workflows can call `ctxt.recv()` to receive messages sent to their identity, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `null` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

```typescript
ctxt.recv<T>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in our [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/e-commerce), the payments workflow, after redirecting customers to a secure payments service, must wait for a notification from that service that the payment has finished processing.

To wait for this notification, the payments workflow uses `recv()`, executing failure-handling code if the notification doesn't arrive in time:

```javascript
@Workflow()
static async paymentWorkflow(ctxt: WorkflowContext, ...): Promise<void> {
  ... // Validate the order, then redirect customers to a secure payments service.
  const notification = await ctxt.recv<string>(checkout_complete_topic, timeout);
  if (notification) {
      ... // Handle the notification.
  } else {
      ... // Notification did not arrive. Query payment state from the payment provider.
  }
}
```

A webhook waits for the payment processor to send the notification, then uses `send()` to forward it to the workflow:

```javascript
@PostApi('/payment_webhook')
static async paymentWebhook(ctxt: HandlerContext): Promise<void> {
  const notificationMessage = ... // Parse the notification.
  const workflowIdentityUUID = ... // Retrieve the workflow identity from notification metadata.
  await ctxt.send(workflowIdentityUUID, notificationMessage, checkout_complete_topic);
}
```

#### Reliability Guarantees

All messages are persisted to the database, so if `send()` completes successfully, the destination workflow is guaranteed to be able to `recv()` it.
If you're sending a message from a workflow, we guarantee exactly-once delivery because [workflows are reliable](./workflow-tutorial#reliability-guarantees).
If you're sending a message from a handler, you can supply an [idempotency key](../api-reference/contexts#handlerctxtsend) to guarantee exactly-once delivery.

