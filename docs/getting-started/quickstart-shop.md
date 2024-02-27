---
sidebar_position: 4
title: Programming reliable checkout workflows
---

# Programming reliable checkout workflows

In this guide, we will follow-up on the reliable workflow concept from [programming quickstart](quickstart-programming) and write the checkout workflow of a shopping cart app.
The workflow will maintain two properties: never charge a customer twice and maintain a consistent inventory.

:::info what you will learn
- Handle asynchronous interactions with third party services
- Interact with running workflows
:::

## Resources
This guide comes with a set of [utilities](https://github.com/dbos-inc/dbos-demo-apps) handling some of the complexity of the application, for instance, creating payment sessions with the third party payment system. In addition, you will be using a [sample payment system hosted on DBOS cloud](https://cloud.dbos.dev/dbos-instructor/apps/payment).

[TODO: setup instructions]

## Overview

You will write an application that triggers a payment workflow upon receiving user requests.
The payment workflow will start in the background, prompting the user to follow a link to a third party payment service.
The payment service, upon validation or failure of the payment, will callback your application.
The payment workflow will be waiting for this callback, and, upon reception, signal the request handler it can respond to the user's request.

In any circumstances, the application should only start one payment session (only once execution guarantee) and maintain a consistent inventory (atomicity).

## The HTTP handler

The handler job is to, upon receiving a request, start a payment workflow and direct the user to a payment URL.
The user can decide to submit the payment, cancel the payment, or do nothing (in which case the workflow will timeout.)

```javascript
@PostApi('/api/checkout_session')
static async webCheckout(ctxt: HandlerContext): Promise<void> {
  // A workflow handle is immediately returned. The workflow continues in the background.
  const handle = await ctxt.invoke(Shop).paymentWorkflow();

  // Block until the payment session is ready
  const session_id = await ctxt.getEvent<string>(handle.getWorkflowUUID(), checkout_url_topic);
  if (session_id === null) {
    ctxt.logger.error("workflow failed");
    return;
  }

  // Display links to submit/cancel the payment
  generatePaymentUrls(handle.getWorkflowUUID(), session_id);
}
```

The key elements of this snippet are:
- Invoke the payment workflow with `ctxt.invoke(Shop).paymentWorkflow();`. Note this starts the workflow in the background and returns a [handle](../api-reference/workflow-handles).
- Wait for a notification using the [events API](../tutorials/workflow-communication-tutorial#events-api): `ctxt.getEvent<string>(handle.getWorkflowUUID(), checkout_url_topic);`.

## The payment workflow

The workflow's responsibility is two-folds: initiate a payment session with a third party provider and ensure the state of the shop's inventory is consistent.
First, it substracts a `product` from the inventory.
Second, it calls a [communicator](.../tutorials/communicator-tutorial), `createPaymentSession`, to initiate a payment session with the payment service.

Once a payment session is created, the workflow will share the payment session ID with the handler, which will direct the user to an endpoint at the payment service.
The workflow will then be waiting for a notification from the payment provider.

The workflow will revert changes to the inventory in case of failure at any point in the process.

:::info
Check out our [e-commerce demo app](https://github.com/dbos-inc/dbos-demo-apps/tree/main/e-commerce) for a more complete example.
:::

```javascript
@Workflow()
static async paymentWorkflow(ctxt: WorkflowContext): Promise<void> {
  // Attempt to update the inventory. Signal the handler if it fails.
  try {
    await ctxt.invoke(ShopUtilities).subtractInventory(product);
  } catch (error) {
    ctxt.logger.error(`Checkout failed: unable to update inventory`);
    await ctxt.setEvent(checkout_url_topic, null);
    return;
  }

  // Attempt to start a payment session. If it fails, restore inventory state and signal the handler.
  const paymentSession = await ctxt.invoke(ShopUtilities).createPaymentSession(product);
  if (!paymentSession?.url) {
    ctxt.logger.error(`Checkout failed: couldn't create payment session`);
    await ctxt.invoke(ShopUtilities).undoSubtractInventory(product);
    await ctxt.setEvent(checkout_url_topic, null);
    return;
  }

  // Signal the handler with the payment session ID.
  await ctxt.setEvent(checkout_url_topic, paymentSession.session_id);

  // Wait for a notification from the payment service
  const notification = await ctxt.recv<string>(checkout_complete_topic, 30);

  if (notification && notification === 'paid') {
    // if the checkout complete notification arrived.
    ctxt.logger.info(`Checkout payment notification received`);
  } else {
    // Otherwise, either the payment failed or the notification timed out.
    ctxt.logger.warn(`Checkout payment failed or timed out`);
  }
}
```

The key elements of this snippet are:
- Starting the payment session: `ctxt.invoke(ShopUtilities).createPaymentSession(product);`.
- Signaling the request handler with the session ID: `await ctxt.setEvent(checkout_url_topic, paymentSession.session_id);`.
- Waiting for a notification from the payment service: `ctxt.recv<string>(checkout_complete_topic, 30);`, with a 30 seconds timeout.


Let's build and run the application (make sure you have the full code as provided in the [guide's repository](https://github.com/dbos-inc/dbos-demo-apps).)

```shell
npm run build
npx dbos-sdk start
```

The output should look like:

```shell
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     POST  :  /payment_webhook
[info]:     POST  :  /api/checkout_session
[info]: DBOS Server is running at http://localhost:8082
[info]: DBOS Admin Server is running at http://localhost:8083
```

And send a request to initiate a checkout: `curl -X POST http://localhost:8082/api/checkout_session`.
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

In the two last cases, the shop's inventory will be rolled back.



