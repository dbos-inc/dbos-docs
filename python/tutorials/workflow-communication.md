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
This is useful for signaling a workflow or sending notifications to it while it's running.

<img src={require('@site/static/img/workflow-communication/workflow-messages.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### Send

```python
DBOS.send(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None
) -> None
```

You can call `DBOS.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

You can also call [`send`](../reference/client.md#send) from outside of your DBOS application with the [DBOS Client](../reference/client.md).

#### Recv

```python
DBOS.recv(
    topic: Optional[str] = None,
    timeout_seconds: float = 60,
) -> Any
```

Workflows can call `DBOS.recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `None` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in the [widget store demo](../examples/widget-store.md), the checkout workflow, after redirecting customers to a payments page, must wait for a notification that the user has paid.

To wait for this notification, the payments workflow uses `recv()`, executing failure-handling code if the notification doesn't arrive in time:

```python
@DBOS.workflow()
def checkout_workflow():
  ... # Validate the order, then redirect customers to a payments service.
  payment_status = DBOS.recv(PAYMENT_STATUS)
  if payment_status is not None and payment_status == "paid":
      ... # Handle a successful payment.
  else:
      ... # Handle a failed payment or timeout.
```

An endpoint waits for the payment processor to send the notification, then uses `send()` to forward it to the workflow:

```python
@app.post("/payment_webhook/{workflow_id}/{payment_status}")
def payment_endpoint(payment_id: str, payment_status: str) -> Response:
    # Send the payment status to the checkout workflow.
    DBOS.send(payment_id, payment_status, PAYMENT_STATUS)
```

#### Reliability Guarantees

All messages are persisted to the database, so if `send` completes successfully, the destination workflow is guaranteed to be able to `recv` it.
If you're sending a message from a workflow, DBOS guarantees exactly-once delivery.
If you're sending a message from normal Python code, you can use [`SetWorkflowID`](../reference/contexts.md#setworkflowid) with an idempotency key to guarantee exactly-once delivery.

## Workflow Events

Workflows can publish _events_, which are key-value pairs associated with the workflow.
They are useful for publishing information about the status of a workflow or to send a result to clients while the workflow is running.

<img src={require('@site/static/img/workflow-communication/workflow-events.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### set_event

```python
DBOS.set_event(
    key: str,
    value: Any,
) -> None
```

Any workflow can call [`DBOS.set_event`](../reference/contexts.md#set_event) to publish a key-value pair, or update its value if has already been published.
#### get_event

```python
DBOS.get_event(
    workflow_id: str,
    key: str,
    timeout_seconds: float = 60,
) -> None
```

You can call [`DBOS.get_event`](../reference/contexts.md#get_event) to retrieve the value published by a particular workflow identity for a particular key.
If the event does not yet exist, this call waits for it to be published, returning `None` if the wait times out.

You can also call [`get_event`](../reference/client.md#get_event) from outside of your DBOS application with [DBOS Client](../reference/client.md).

#### get_all_events

```python
DBOS.get_all_events(
    workflow_id: str
) -> Dict[str, Any]
```

You can use `DBOS.get_all_events` to retrieve the latest values of all events published by a workflow.

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in the [widget store demo](../examples/widget-store.md), the checkout workflow, after validating an order, needs to send the customer a unique payment ID.
To communicate the payment ID to the customer, it uses events.

The payments workflow emits the payment ID using `set_event()`:

```python
@DBOS.workflow()
def checkout_workflow():
    ...
    payment_id = ...
    dbos.set_event(PAYMENT_ID, payment_id)
    ...
```

The FastAPI handler that originally started the workflow uses `get_event()` to await this payment ID, then returns it:

```python
@app.post("/checkout/{idempotency_key}")
def checkout_endpoint(idempotency_key: str) -> Response:
    # Idempotently start the checkout workflow in the background.
    with SetWorkflowID(idempotency_key):
        handle = DBOS.start_workflow(checkout_workflow)
    # Wait for the checkout workflow to send a payment ID, then return it.
    payment_id = DBOS.get_event(handle.workflow_id, PAYMENT_ID)
    if payment_id is None:
        raise HTTPException(status_code=404, detail="Checkout failed to start")
    return Response(payment_id)
```

#### Reliability Guarantees

All events are persisted to the database, so the latest version of an event is always retrievable.
Additionally, if `get_event` is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated.

## Workflow Streaming

Workflows can stream data in real time to clients.
This is useful for streaming results from a long-running workflow or LLM call or for monitoring or progress reporting.

<img src={require('@site/static/img/workflow-communication/workflow-streams.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### Writing to Streams

```python
DBOS.write_stream(
    key: str, 
    value: Any
) -> None:
```

You can write values to a stream from a workflow or its steps using [`DBOS.write_stream`](../reference/contexts.md#write_stream).
A workflow may have any number of streams, each identified by a unique key.

When you are done writing to a stream, you should close it with [`DBOS.close_stream`](../reference/contexts.md#close_stream).
Otherwise, streams are automatically closed when the workflow terminates.

```python
DBOS.close_stream(
    key: str
) -> None
```

DBOS streams are immutable and append-only.
Writes to a stream from a workflow happen exactly-once.
Writes to a stream from a step happen at-least-once; if a step fails and is retried, it may write to the stream multiple times.
Readers will see all values written to the stream from all tries of the step in the order in which they were written.

**Example syntax:**

```python
@DBOS.workflow()
def producer_workflow():
    DBOS.write_stream(example_key, {"step": 1, "data": "value1"})
    DBOS.write_stream(example_key, {"step": 2, "data": "value2"})
    DBOS.close_stream(example_key)  # Signal completion
```

#### Reading from Streams

```python
DBOS.read_stream(
    workflow_id: str,
    key: str
) -> Generator[Any, Any, None]
```

You can read values from a stream from anywhere using [`DBOS.read_stream`](../reference/contexts.md#read_stream).
This function reads values from a stream identified by a workflow ID and key, yielding each value in order until the stream is closed or the workflow terminates.

You can also read from a stream from outside a DBOS application with a [DBOS Client](../reference/client.md#read_stream).

**Example syntax:**

```python
for value in DBOS.read_stream(workflow_id, example_key):
    print(f"Received: {value}")
```