---
sidebar_position: 3
title: Advanced Programming Tutorial
---

# Building a Reliable Checkout Workflow

In this guide, we will follow-up on the reliable workflow concept from [programming quickstart](quickstart-programming) and write the checkout workflow of a shopping cart app.
The workflow will maintain three properties:
1. Never charge a customer without fulfilling an order.
2. Never charge a customer twice for the same order.
3. Reserve inventory for an order if and only if the order is fulfilled.

Without DBOS, maintaining these properties is hard.
For example, if the checkout service is interrupted after a customer pays, we have to fulfill their order.
If a customer clicks the buy button twice, we have to make sure they aren't charged twice.
If the payment doesn't go through, we have to return any reserved inventory.
As we'll show, DBOS makes it much easier to write programs that do these correctly.

:::info what you will learn
- Handle asynchronous interactions with third party services
- Interact with running workflows
- Use idempotency keys
:::

## Resources
This guide comes a companion [repository](https://github.com/dbos-inc/dbos-demo-apps). Let's clone it:
```shell
git clone https://github.com/dbos-inc/dbos-demo-apps
cd dbos-demo-apps/shop-guide
```

## Overview
In this guide, we'll be implementing two functions: the checkout workflow and its request handler.
These interact with an external payment service modelled on [Stripe](https://stripe.com).
Here's a diagram of what the end-to-end checkout flow looks like:

![](shop-guide-diagram.svg)

Upon receiving a request, the handler starts a payment workflow and waits for a payment session ID.
If it obtains a valid session ID, it responds to the user with links to submit or cancel the payment.
After the user has paid, the workflow fulfills the user's order.

## The request handler

We'll start by building the checkout request handler, which initiates checkout in response to user HTTP requests.

### Registering the handler
```javascript
@PostApi('/checkout/:key?')
static async webCheckout(ctxt: HandlerContext, @ArgOptional key: string): Promise<string> {
```

The handler is implemented in this `webCheckout` function which is served from HTTP POST requests to the URL `<host>/checkout/:key?`.
The route accepts an optional path parameter `key`, used as an [idempotency key](../tutorials/idempotency-tutorial).
We specify the `key` parameter is optional using the [@ArgOptional](../api-reference/decorators#argoptional) decorator.

### Invoking the payment workflow
Once a request is received, the handler invokes `paymentWorkflow` asynchronously, obtaining its [workflow handle](../api-reference/workflow-handles):
```javascript
// A workflow handle is immediately returned. The workflow continues in the background.
const handle = await ctxt.invoke(Shop, key).paymentWorkflow();`
```

Note that we invoke the workflow using an [idempotency key](../tutorials/idempotency-tutorial.md) so we don't pay multiple times if the user clicks twice on the buy button.

### Waiting for a payment session ID
The handler uses the DBOS [events API](../tutorials/workflow-communication-tutorial#events-api) to wait for the payment workflow to send it a payment session ID.
We will see in the next section how the payment workflow can notify the handler.
```javascript
// Block until the payment session is ready
const session_id = await ctxt.getEvent<string>(handle.getWorkflowUUID(), session_topic);
if (session_id === null) {
  ctxt.logger.error("workflow failed");
  return;
}
```
If `session_id` is invalid, the handler logs an error using its [context logger](../api-reference/contexts#ctxtlogger).
Otherwise, it respond the request with links to submit or cancel the payment.

### Full handler code

```javascript
@PostApi('/checkout/:key?')
static async webCheckout(ctxt: HandlerContext, @ArgOptional key: string): Promise<string> {
  // Handle will be returned immediately, and the workflow will continue in the background
  const handle = await ctxt.invoke(Shop, key).paymentWorkflow();
  ctxt.logger.info(`Checkout workflow started with UUID: ${handle.getWorkflowUUID()}`);

  // This will block until the payment session is ready
  const session_id = await ctxt.getEvent<string>(handle.getWorkflowUUID(), session_topic);
  if (session_id === null) {
    ctxt.logger.error("workflow failed");
    return "";
  }

  return generatePaymentUrls(ctxt, handle.getWorkflowUUID(), session_id);
}
```

## The payment workflow

The payment workflow reserves inventory for an order, attempts to process its payment, and fufills it if the payment is successful.
As we'll show, it's _reliable_: it always fulfills orders if payments succeed, never chages customers twice for the same order, and always undoes inventory modifications on failure.

:::info
Check out our [e-commerce demo app](https://github.com/dbos-inc/dbos-demo-apps/tree/main/e-commerce) for a more elaborate example.
:::

Let's build the payment workflow step by step. For the sake of brevity, we will be using pre-installed functions in `src/utilities.ts`. Feel free to check them out!

### Registering the workflow
Let's declare a simple workflow:
```javascript
@Workflow()
static async paymentWorkflow(ctxt: WorkflowContext): Promise<void> {
```

### Reserving inventory
The workflow first reserves an item from inventory using the `subtractInventory` transaction.
If this fails (likely because the item is out of stock), the workflow signals the handlers using [setEvent](../tutorials/workflow-communication-tutorial#setevent) to tell it checkout cannot proceed.

```javascript
// Attempt to update the inventory. Signal the handler if it fails.
try {
  await ctxt.invoke(ShopUtilities).subtractInventory();
} catch (error) {
  ctxt.logger.error("Failed to update inventory");
  await ctxt.setEvent(session_topic, null);
  return;
}
```

### Initiating a payment session
Next, the workflow initiates a payment session using the `createPaymentSession` [communicator](../tutorials/communicator-tutorial).
If this fails, it returns reserved items to the inventory using the `undoSubtractInventory` transaction, signals the handler, and exits.
```javascript
// Attempt to start a payment session. If it fails, restore inventory state and signal the handler.
const paymentSession = await ctxt.invoke(ShopUtilities).createPaymentSession();
if (!paymentSession.url) {
  ctxt.logger.error("Failed to create payment session");
  await ctxt.invoke(ShopUtilities).undoSubtractInventory();
  await ctxt.setEvent(session_topic, null);
  return;
}
```
Under the hood, `createPaymentSession` registers a callback with the payment service, which will signal the workflow when the payment is completed.

### Notifying the handler
Now, the workflow must notify the handler the payment session is ready.
We use [setEvent](../tutorials/workflow-communication-tutorial#setevent) to publish the payment session ID on the `session_topic`, on which the handler is waiting for a notification.
```javascript
// Notify the handler and share the payment session ID.
await ctxt.setEvent(session_topic, paymentSession.session_id);
```

### Waiting for a payment
As the handler has been notified to direct the user to the payment service, the payment workflow must wait until the payment service notifies it whether the payment succeeded or failed.
We use [recv](../tutorials/workflow-communication-tutorial#recv) to wait on a signal from the callback registed by `createPaymentSession`.
```javascript
// Wait for a notification from the payment service with a 30 seconds timeout.
const notification = await ctxt.recv<string>(payment_complete_topic, 30);
```

### Handling payment outcomes
Finally, the workflow must handle three situations: the payment succeeds, fails, or times out.
For simplicity, if it fails or times out, we consider the payment failed and return reserved inventory using `undoSubtractInventory`.
In a real application, you will want to check with the payment provider in case of a time out, to verify the status of the payment.
```javascript
if (notification && notification === 'paid') {
  // If the payment succeeds, fulfill the order (code omitted for brevity.)
  ctxt.logger.info(`Payment notification received`);
} else {
  // Otherwise, either the payment failed or timed out.
  // Code to check the payment status with the payment service omitted for brevity.
  ctxt.logger.warn(`Payment failed or timed out`);
  await ctxt.invoke(ShopUtilities).undoSubtractInventory();
}
```

### Full workflow code
```javascript
@Workflow()
static async paymentWorkflow(ctxt: WorkflowContext): Promise<void> {
  // Attempt to update the inventory. Signal the handler if it fails.
  try {
    await ctxt.invoke(ShopUtilities).subtractInventory();
  } catch (error) {
    ctxt.logger.error("Failed to update inventory");
    await ctxt.setEvent(session_topic, null);
    return;
  }

  // Attempt to start a payment session. If it fails, restore inventory state and signal the handler.
  const paymentSession = await ctxt.invoke(ShopUtilities).createPaymentSession();
  if (!paymentSession.url) {
    ctxt.logger.error("Failed to create payment session");
    await ctxt.invoke(ShopUtilities).undoSubtractInventory();
    await ctxt.setEvent(session_topic, null);
    return;
  }

  // Signal the handler with the payment session ID.
  await ctxt.setEvent(session_topic, paymentSession.session_id);

  // Wait for a notification from the payment service.
  const notification = await ctxt.recv<string>(payment_complete_topic, 30);

  if (notification && notification === 'paid') {
    // If the payment succeeds, fulfill the order (code omitted for clarity.)
    ctxt.logger.info(`Payment notification received`);
  } else {
    // Otherwise, either the payment failed or timed out.
    // Code to check the latest session status with the payment service omitted for clarity.
    ctxt.logger.warn(`Payment failed or timed out`);
    await ctxt.invoke(ShopUtilities).undoSubtractInventory();
  }
}
```

## Building and running
Let's build and run the application (make sure you have the full code as provided in the [guide's repository](https://github.com/dbos-inc/dbos-demo-apps).)

First we start the payment service in the background. In one terminal, run:
```shell
./start_payment_service.sh
```

Then we start the shop application. In another terminal, run:
```shell
npm run build
npx dbos-sdk start
```

The output should look like:

```shell
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     POST  :  /payment_webhook
[info]:     POST  :  /checkout/:key?
[info]: DBOS Server is running at http://localhost:8082
[info]: DBOS Admin Server is running at http://localhost:8083
```

Let's send a request to initiate a checkout: `curl -X POST http://localhost:8082/checkout`.
The response will include two links, one for validating the payment and one for cancelling it:
```shell
Submit payment: curl -X POST http://localhost:8086/api/submit_payment -H "Content-type: application/json" -H "dbos-idmpotency-key: f5103e9f-e78a-4aab-9801-edd45a933d6a" -d '{"session_id":"fd17b90a-1968-440c-adf7-052aaeaaf788"}'
Cancel payment: curl -X POST http://localhost:8086/api/cancel_payment -H "Content-type: application/json" -H "dbos-idempotency-key: f5103e9f-e78a-4aab-9801-edd45a933d6a" -d '{"session_id":"fd17b90a-1968-440c-adf7-052aaeaaf788"}'
```

You can take three actions: submit the payment, cancel it, or do nothing. Here are example outputs from the application in these three cases:
```shell
# Submit the payment
[info]: Checkout payment notification received
# Cancel the payment or do nothing
[warn]: Checkout payment failed or timed out
```

In the two last cases, the shop's inventory will be rolled back, which you can check in the database.

## Using idempotency keys

If you call the endpoint again with the idempotency key provided&horbar;the `dbos-idempotency-key` in the output above&horbar;the application will reuse the same payment session.
For instance, if you call the application once and see the idempotency key `f5103e9f-e78a-4aab-9801-edd45a933d6a` in the response, try calling the endpoint againt with the key: `curl -X POST http://localhost:8082/checkout/f5103e9f-e78a-4aab-9801-edd45a933d6a`.
Note the new response's `session_id` is unchanged.

<!---
TODO: Flesh this out more.
-->

