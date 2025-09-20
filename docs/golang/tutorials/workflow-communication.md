---
sidebar_position: 48
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

```go
func Send[P any](ctx DBOSContext, destinationID string, message P, topic string) error
```

You can call `Send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

#### Recv

```go
func Recv[R any](ctx DBOSContext, topic string, timeout time.Duration) (R, error)
```

Workflows can call `Recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `Recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning an error if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in an e-commerce application, the checkout workflow, after redirecting customers to a secure payments service, must wait for a notification from that service that the payment has finished processing.

To wait for this notification, the payments workflow uses `Recv()`, executing failure-handling code if the notification doesn't arrive in time:

```go
const PaymentStatusTopic = "payment_status"

func checkoutWorkflow(ctx dbos.DBOSContext, orderData OrderData) (string, error) {
    // Process initial checkout steps...

    // Wait for payment notification with a 5-minute timeout
    notification, err := dbos.Recv[PaymentNotification](ctx, PaymentStatusTopic, 5*time.Minute)
    if err != nil {
        ... // Handle timeout or other errors
    }

    // Handle the notification
    if notification.Status == "completed" {
      ... // Handle the notification.
    } else {
      ... // Handle a failure
    }
}
```

A webhook waits for the payment processor to send the notification, then uses `Send()` to forward it to the workflow:

```go
func paymentWebhookHandler(w http.ResponseWriter, r *http.Request) {
    // Parse the notification from the payment processor
    notification := ...
    // Retrieve the workflow ID from notification metadata
    workflowID := ...

    // Send the notification to the waiting workflow
    err := dbos.Send(dbosContext, workflowID, notification, PaymentStatusTopic)
    if err != nil {
        http.Error(w, "Failed to send notification", http.StatusInternalServerError)
        return
    }
}
```

#### Reliability Guarantees

All messages are persisted to the database, so if `Send` completes successfully, the destination workflow is guaranteed to be able to `Recv` it.
If you're sending a message from a workflow, DBOS guarantees exactly-once delivery.

## Workflow Events

Workflows can publish _events_, which are key-value pairs associated with the workflow.
They are useful for publishing information about the status of a workflow or to send a result to clients while the workflow is running.

<img src={require('@site/static/img/workflow-communication/workflow-events.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### SetEvent

```go
func SetEvent[P any](ctx DBOSContext, key string, message P) error
```

Any workflow can call [`SetEvent`](../reference/methods.md#setevent) to publish a key-value pair, or update its value if has already been published.

#### GetEvent

```go
func GetEvent[R any](ctx DBOSContext, targetWorkflowID, key string, timeout time.Duration) (R, error)
```

You can call [`GetEvent`](../reference/methods.md#getevent) to retrieve the value published by a particular workflow ID for a particular key.
If the event does not yet exist, this call waits for it to be published, returning an error if the wait times out.

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in an e-commerce application, the checkout workflow, after validating an order, directs the customer to a secure payments service to handle credit card processing.
To communicate the payments URL to the customer, it uses events.

The checkout workflow emits the payments URL using `SetEvent()`:

```go
const PaymentURLKey = "payment_url"

func checkoutWorkflow(ctx dbos.DBOSContext, orderData OrderData) (string, error) {
    // Process order validation...

    paymentsURL := ...
    err := dbos.SetEvent(ctx, PaymentURLKey, paymentsURL)
    if err != nil {
        return "", fmt.Errorf("failed to set payment URL event: %w", err)
    }

    // Continue with checkout process...
}
```

The HTTP handler that originally started the workflow uses `GetEvent()` to await this URL, then redirects the customer to it:

```go
func webCheckoutHandler(dbosContext dbos.DBOSContext, w http.ResponseWriter, r *http.Request) {
    orderData := parseOrderData(r) // Parse order from request

    handle, err := dbos.RunWorkflow(dbosContext, checkoutWorkflow, orderData)
    if err != nil {
        http.Error(w, "Failed to start checkout", http.StatusInternalServerError)
        return
    }

    // Wait up to 30 seconds for the payment URL event
    url, err := dbos.GetEvent[string](dbosContext, handle.GetWorkflowID(), PaymentURLKey, 30*time.Second)
    if err != nil {
        // Handle a timeout
    }

    // Redirect the customer
}
```

#### Reliability Guarantees

All events are persisted to the database, so the latest version of an event is always retrievable.
Additionally, if `GetEvent` is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated.
