---
sidebar_position: 6
title: Workflow Communication
description: Learn how to write interactive workflows
---

Workflow communication is useful if you want to make your workflows _interactive_, for example if a long-running workflow needs to query a user for input or report intermediate results back to its caller.
DBOS provides two workflow communication APIs, the events API and the messages API.

### Events API

This API allows workflows to emit and listen for events.
Events are immutable key-value pairs.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### set_event

Any workflow can call [`DBOS.set_event`](../reference-python/contexts.md#set_event) to immutably publish a key-value pair.
A workflow cannot set a key it has already set.

```python
DBOS.set_event(
    key: str,
    value: Any,
) -> None
```
#### get_event

You can call [`DBOS.get_event`](../reference-python/contexts.md#get_event) to retrieve the value published by a particular workflow identity for a particular key.
This call waits for the event to be published, returning `None` if the wait times out.

```python
DBOS.get_event(
    workflow_id: str,
    key: str,
    timeout_seconds: float = 60,
) -> None
```

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in our [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/widget-store), the payments workflow, after validating an order, needs to direct the customer to a payments URL.
To communicate the payments URL to the customer, it uses events.

The payments workflow emits an event containing a payment link using `set_event()`:

```python
@DBOS.workflow()
def checkout_workflow():
    ...
    payment_url = ...
    dbos.set_event(PAYMENT_URL_KEY, payment_url)
    ...
```

The FastAPI handler that originally started the workflow uses `get_event()` to await this URL, then redirects the customer to it:

```python
@app.post("/checkout/{key}")
def checkout_endpoint() -> Response:
    handle = dbos.start_workflow(checkout_workflow)
    payment_url = dbos.get_event(handle.workflow_id, PAYMENT_URL_KEY)
    if payment_url is None:
        return Response("/error")
    return Response(payment_url)
```

#### Reliability Guarantees

All events are persisted to the database and are immutable, so once an event it set, it is guaranteed to always be retrievable.

### Messages API
This API allows operations to send messages to a specific [workflow ID](./workflow-tutorial#workflow-ids).

#### Send

You can call `DBOS.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

```python
DBOS.send(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None
) -> None
```

#### Recv

Workflows can call `DBOS.recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `None` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

```python
DBOS.recv(
    topic: Optional[str] = None,
    timeout_seconds: float = 60,
) -> Any
```

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in our [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/widget-store), the payments workflow, after redirecting customers to a payments service, must wait for a notification from that service that the payment has finished processing.

To wait for this notification, the payments workflow uses `recv()`, executing failure-handling code if the notification doesn't arrive in time:

```python
@DBOS.workflow()
def checkout_workflow():
  ... # Validate the order, then redirect customers to a payments service.
  payment_status = DBOS.recv(PAYMENT_STATUS_TOPIC)
  if payment_status is not None and payment_status == "paid":
      ... # Handle a successful payment.
  else:
      ... # Handle a failed payment or timeout.
```

A webhook waits for the payment processor to send the notification, then uses `send()` to forward it to the workflow:

```python
@app.post("/payment_webhook/{workflow_id}/{payment_status}")
def payment_endpoint(workflow_id: str, payment_status: str) -> Response:
  DBOS.send(workflow_id, payment_status, PAYMENT_STATUS_TOPIC)
```

#### Reliability Guarantees

All messages are persisted to the database, so if `send` completes successfully, the destination workflow is guaranteed to be able to `recv` it.
If you're sending a message from a workflow, DBOS guarantees exactly-once delivery because [workflows are reliable](./workflow-tutorial#reliability-guarantees).
If you're sending a message from normal Python code, you can use [`SetWorkflowID`](../reference-python/contexts.md#setworkflowid) with an idempotency key to guarantee exactly-once execution.