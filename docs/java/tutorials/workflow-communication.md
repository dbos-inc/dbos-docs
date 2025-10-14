---
sidebar_position: 50
title: Communicating with Workflows
---

DBOS provides a few different ways to communicate with your workflows.
You can:

- [Send messages to workflows](#workflow-messaging-and-notifications)
- [Publish events from workflows for clients to read](#workflow-events)


## Workflow Messaging and Notifications
You can send messages to a specific workflow.
This is useful for signaling a workflow or sending notifications to it while it's running.

<img src={require('@site/static/img/workflow-communication/workflow-messages.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### Send

```java
static void send(String destinationId, Object message, String topic)
```

You can call `dbos.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

You can also call [`send`](../reference/client.md#send) from outside of your DBOS application with the [DBOS Client](../reference/client.md).

#### Recv

```java
static Object recv(String topic, Duration timeout)
```

Workflows can call `dbos.recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `null` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in a payments system, after redirecting customers to a payments page, the checkout workflow must wait for a notification that the user has paid.

To wait for this notification, the payments workflow uses `recv()`, executing failure-handling code if the notification doesn't arrive in time:

```java
interface Checkout {
    void checkoutWorkflow();
}

class CheckoutImpl implements Checkout {
    private static final String PAYMENT_STATUS = "payment_status";

    @Workflow(name = "checkout-workflow")
    public void checkoutWorkflow() {
        // Validate the order, redirect the customer to a payments page,
        // then wait for a notification.
        String paymentStatus = (String) DBOS.recv(PAYMENT_STATUS, Duration.ofSeconds(60));
        if (paymentStatus != null && paymentStatus.equals("paid")) {
            // Handle a successful payment.
        } else {
            // Handle a failed payment or timeout.
        }
    }
}
```

An endpoint waits for the payment processor to send the notification, then uses `send()` to forward it to the workflow:

```java
// Using Javalin for the HTTP endpoint
app.post("/payment_webhook/{workflow_id}/{payment_status}", ctx -> {
    String workflowId = ctx.pathParam("workflow_id");
    String paymentStatus = ctx.pathParam("payment_status");
    // Send the payment status to the checkout workflow.
    DBOS.send(workflowId, paymentStatus, PAYMENT_STATUS);
    ctx.result("Payment status sent");
});
```

#### Reliability Guarantees

All messages are persisted to the database, so if `send` completes successfully, the destination workflow is guaranteed to be able to `recv` it.
If you're sending a message from a workflow, DBOS guarantees exactly-once delivery.
If you're sending a message from normal Java code, you can use a unique workflow ID to guarantee exactly-once delivery.

## Workflow Events

Workflows can publish _events_, which are key-value pairs associated with the workflow.
They are useful for publishing information about the status of a workflow or to send a result to clients while the workflow is running.

<img src={require('@site/static/img/workflow-communication/workflow-events.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### setEvent

```java
static void setEvent(String key, Object value)
```

Any workflow can call [`dbos.setEvent`](../reference/methods.md#setevent) to publish a key-value pair, or update its value if it has already been published.

#### getEvent

```java
static Object getEvent(String workflowId, String key, Duration timeout)
```

You can call [`dbos.getEvent`](../reference/methods.md#getevent) to retrieve the value published by a particular workflow identity for a particular key.
If the event does not yet exist, this call waits for it to be published, returning `null` if the wait times out.

You can also call [`getEvent`](../reference/client.md#getevent) from outside of your DBOS application with [DBOS Client](../reference/client.md).

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in a checkout system, after validating an order, the checkout workflow needs to send the customer a unique payment ID.
To communicate the payment ID to the customer, it uses events.

The payments workflow emits the payment ID using `setEvent()`:

```java
interface Checkout {
    void checkoutWorkflow();
}

class CheckoutImpl implements Checkout {
    private static final String PAYMENT_ID = "payment_id";

    @Workflow(name = "checkout-workflow")
    public void checkoutWorkflow() {
        // ... validation logic
        String paymentId = generatePaymentId();
        DBOS.setEvent(PAYMENT_ID, paymentId);
        // ... continue processing
    }
}
```

The Javalin handler that originally started the workflow uses `getEvent()` to await this payment ID, then returns it:

```java
// Using Javalin for the HTTP endpoint
app.post("/checkout/{idempotency_key}", ctx -> {
    String idempotencyKey = ctx.pathParam("idempotency_key");

    // Idempotently start the checkout workflow in the background.
    WorkflowHandle<Void, RuntimeException> handle = DBOS.startWorkflow(
        () -> checkoutProxy.checkoutWorkflow(),
        new StartWorkflowOptions().withWorkflowId(idempotencyKey)
    );

    // Wait for the checkout workflow to send a payment ID, then return it.
    String paymentId = (String) DBOS.getEvent(handle.getWorkflowId(), PAYMENT_ID, Duration.ofSeconds(60));
    if (paymentId == null) {
        ctx.status(404);
        ctx.result("Checkout failed to start");
    } else {
        ctx.result(paymentId);
    }
});
```

#### Reliability Guarantees

All events are persisted to the database, so the latest version of an event is always retrievable.
Additionally, if `getEvent` is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated.
