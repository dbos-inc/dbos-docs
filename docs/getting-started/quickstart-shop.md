---
sidebar_position: 3
title: Reliable workflows
---

# Programming a reliable checkout workflow

In this guide, we will follow-up on the reliable workflow concept from [programming quickstart](quickstart-programming) and write the checkout workflow of a shopping cart app.
The workflow will maintain three properties:
1. Never charge a customer without fulfilling an order.
2. Never charge a customer twice for the same order.
3. Maintain product inventory correctly.

Without DBOS, maintaining these properties is hard: users can click the buy button twice, the program can crash in the middle of the transaction, the payment service can fail, etc.

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
We will also be using [cURL](https://curl.se/dlwiz/?type=bin) which is likely already installed on your system.

## Overview
In this guide, we'll be implementing two functions: the checkout workflow and its request handler.
These interact with an external payment service modelled on [Stripe](https://stripe.com).
Here's a diagram of what the end-to-end checkout flow looks like:

![](shop-guide-diagram.svg)

Upon receiving a request, the handler starts a payment workflow and waits for a payment session ID.
If it obtains a valid session ID, it will respond the user with links to submit or cancel the payment.

## The request handler

### Registering the handler
```javascript
@PostApi('/checkout/:key?')
static async webCheckout(ctxt: HandlerContext, @ArgOptional key: string): Promise<string> {
```
The handler serves `/checkout/:key?` with the function `webCheckout`.
The route accepts an optional path parameter `key`, used as an [idempotency key](../tutorials/idempotency-tutorial).
Note we must specify the `key` parameter of `webCheckout` is optional using the [@ArgOptional](../api-reference/decorators#argoptional) decorator.

### Invoking the payment workflow
Once a request is received, the handler invokes a `paymentWorkflow` and retrieves a [workflow handle](../api-reference/workflow-handles):
```javascript
// A workflow handle is immediately returned. The workflow continues in the background.
const handle = await ctxt.invoke(Shop, key).paymentWorkflow();`
```
The workflow will start in the background. You can use the handle to inquire on the workflow status, get the workflow UUID, and wait for a result.
Note how we invoke the workflow using the idempotency key so DBOS can resume an existing workflow or simply handle common cases like "the user clicked twice on the buy button".

### Waiting for a payment session ID
The handler uses DBOS [events API](../tutorials/workflow-communication-tutorial#events-api) to wait for a payment session ID.
We will see in the next section how the payment workflow can notify the handler using the topic `session_topic`.
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

The workflow initiates a payment session with a third party service and manages the shop's inventory.
Specifically, it:
- Wraps interactions with the payment service in a [communicator](.../tutorials/communicator-tutorial), so customers cannot be charged twice for the same order.
- Undo inventory modifications on failure.
- Always fulfill orders if payments succeed.

Once a payment session is initiated, the workflow shares the payment session ID with the handler.
The handler will direct the user to a payment endpoint and the workflow be waiting to hear from the payment service.

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

### Update the shop's inventory
The workflow first subtract an item from the inventory using the `subtractInventory` transaction.
If this step fails, the workflow immediately signals the handler using [setEvent](../tutorials/workflow-communication-tutorial#setevent) and returns.
```javascript
// Attempt to update the inventory. Signal the handler if it fails.
try {
  await ctxt.invoke(ShopUtilities).subtractInventory(product);
} catch (error) {
  ctxt.logger.error("Failed to update inventory");
  await ctxt.setEvent(session_topic, null);
  return;
}
```

### Initiating a payment session
Next, the workflow initiates a payment session using the `createPaymentSession` [communicator](../tutorials/communicator-tutorial).
If this fails, it undo changes to the inventory using the `undoSubtractInventory` transaction, signals the handler, and exits.
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

### Waiting for a payment
Now, the workflow must do two things: notify the handler the payment session is ready&horbar;using [setEvent](../tutorials/workflow-communication-tutorial#setevent)&horbar;and wait for the outcome of the payment&horbar;using `recv`.
```javascript
// Notify the handler and share the payment session ID.
await ctxt.setEvent(session_topic, paymentSession.session_id);

// Wait for a notification from the payment service with a 30 seconds timeout.
const notification = await ctxt.recv<string>(payment_complete_topic, 30);
```

### Handling payment outcomes
Finally, the workflow must handle three situations: the payment succeeds, fails, or times out.
For brevity, we will write logic to consider the payment invalid both if it times out or failed and undo changes to the inventory using `undoSubtractInventory`.
In a real application, you will want to check with the payment provider in case of time out, to verify the status of the payment.
```javascript
if (notification && notification === 'paid') {
  // If the payment succeeds, fulfill the order (code omitted for brevity.)
  ctxt.logger.info(`Payment notification received`);
} else {
  // Otherwise, either the payment failed or timed out.
  // Code to check the payment status with the payment service omitted for brevity.
  ctxt.logger.warn(`Payment failed or timed out`);
  await ctxt.invoke(ShopUtilities).undoSubtractInventory(product);
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
    await ctxt.invoke(ShopUtilities).undoSubtractInventory(product);
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
    await ctxt.invoke(ShopUtilities).undoSubtractInventory(product);
  }
}
```

## Building and running
Let's build and run the application (make sure you have the full code as provided in the [guide's repository](https://github.com/dbos-inc/dbos-demo-apps).)

First we will start the payment service in the background. In one terminal, run:
```shell
./start_payment_service.sh
```

Then we will start the shop application itself. In another terminal, run:
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
Submit payment: curl -X POST http://localhost:8086/api/submit_payment -H "Content-type: application/json" -H "dbos-workflowuuid: f5103e9f-e78a-4aab-9801-edd45a933d6a" -d '{"session_id":"fd17b90a-1968-440c-adf7-052aaeaaf788"}'
Cancel payment: curl -X POST http://localhost:8086/api/cancel_payment -H "Content-type: application/json" -H "dbos-workflowuuid: f5103e9f-e78a-4aab-9801-edd45a933d6a" -d '{"session_id":"fd17b90a-1968-440c-adf7-052aaeaaf788"}'
```

You can take three actions: submit the payment, cancel it, or do nothing. Here are example outputs from the application in these three cases:
```shell
# Submit the payment
[info]: Checkout payment notification received
# Cancel the payment or do nothing
[warn]: Checkout payment failed or timed out
```

In the two last cases, the shop's inventory will be rolled back, which you can check in the database.

If you call the endpoint again with the idempotency key provided&horbar;the `dbos-workflowuuid` in the output above&horbar;the application will reuse the same payment session. Check it out with `curl -X POST http://localhost:8082/checkout/f5103e9f-e78a-4aab-9801-edd45a933d6a` (replacing the key with the `dbos-workflowuuid` value printed in the handler's response.)

