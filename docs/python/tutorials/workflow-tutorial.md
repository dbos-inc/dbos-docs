---
sidebar_position: 1
title: Workflows
description: Learn how to make applications reliable using workflows.
toc_max_heading_level: 3
---

Workflows orchestrate the execution of other functions, like transactions and communicators.
Workflows provide _durable execution_: if they are interrupted for any reason (e.g., an executor is restarted or crashes), DBOS automatically resumes them from where they left off, running them to completion without re-executing any operation that already finished.
You can use workflows to coordinate multiple operations that must all complete for a program to be correct.
For example, in our [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/widget-store), we use a workflow for payment processing.

To make a function a workflow, annotate it with the [`@DBOS.workflow`](../reference/decorators.md#workflow) decorator.
Workflows may freely call transactions, communicators, and other workflows.
However, they must be **[deterministic](#determinism).**

Here's an example workflow (from the [programming guide](../../getting-started/quickstart-programming-python.md)) signing an online guestbook then recording the signature in the database.
Here, `sign_guestbook` is a [communicator](./communicator-tutorial.md) and `insert_greeting` is a [transaction](./transaction-tutorial.md).
By using a workflow, we guarantee that every guestbook signature is recorded in the database, even if execution is interrupted.

```python
@DBOS.workflow()
def greeting_workflow(name: str, note: str):
    sign_guestbook(name)
    insert_greeting(name, note)
```
## Reliability Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process crashes while executing a workflow and is restarted, it resumes the workflow from where it left off.
2.  Transactions commit _exactly once_.  Once a workflow commits a transaction, it will never retry that transaction.
3.  Communicators are tried _at least once_ but are never re-executed after they successfully complete.  If a failure occurs inside a communicator, the communicator may be retried, but once a communicator has completed, it will never be re-executed.

## Determinism

A workflow implementation must be deterministic: if called multiple times with the same inputs, it should invoke the same transactions and communicators with the same inputs in the same order.
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in [transactions](./transaction-tutorial) and all other non-deterministic operations in [communicators](./communicator-tutorial).
You can safely call these methods from your workflow.

For example, **don't do this**:

```python
@DBOS.workflow()
def example_workflow(friend: str):
    body = requests.get("https://example.com").text
    return example_transaction(body)
```

Do this instead:

```python
@DBOS.communicator()
def example_communicator():
    return requests.get("https://example.com").text

@DBOS.workflow()
def example_workflow(friend: str):
    body = example_communicator()
    return example_transaction(body)
```

## Workflow IDs

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this ID through the [`DBOS.workflow_id`](../reference/contexts.md#workflow_id) context variable.
Workflow IDs are important for communicating with workflows and developing interactive workflows.
For more information on workflow communication, see our guide.

## Starting Workflows Asynchronously

You can use [start_workflow](../reference/contexts.md#start_workflow) to start a workflow in the background without waiting for it to complete.
This is useful for long-running or interactive workflows.

`start_workflow` returns a [workflow handle](../reference/workflow_handles.md), from which you can access information about the workflow or wait for it to complete and retrieve its result.
The `start_workflow` method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted.


Here's an example:

```python
@DBOS.workflow()
def example_workflow(var1: str, var2: str):
    DBOS.sleep(10) # Sleep for 10 seconds
    return var1 + var2

# Start example_workflow in the background
handle: WorkflowHandle = DBOS.start_workflow(example_workflow, "var1", "var2")
# Wait for the workflow to complete and retrieve its result.
result = handle.get_result()
```

You can also use [`DBOS.retrieve_workflow`](../reference/contexts.md#retrieve_workflow) to retrieve a workflow's handle from its [workflow ID](#workflow-ids).

## Interactive Workflows

It is often useful to make workflows _interactive_, for example if a long-running workflow needs to query a user for input or report intermediate results back to its caller.
To make this easier, DBOS provides two workflow communication APIs, the events API and the messages API.

### Events API

This API allows workflows to emit and listen for events.
Events are immutable key-value pairs.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### set_event

Any workflow can call [`DBOS.set_event`](../reference/contexts.md#set_event) to immutably publish a key-value pair.
A workflow cannot set a key it has already set.

```python
DBOS.set_event(
    key: str,
    value: Any,
) -> None
```
#### get_event

You can call [`DBOS.get_event`](../reference/contexts.md#get_event) to retrieve the value published by a particular workflow identity for a particular key.
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
If you're sending a message from normal Python code, you can use [`SetWorkflowID`](../reference/contexts.md#setworkflowid) with an idempotency key to guarantee exactly-once execution.
