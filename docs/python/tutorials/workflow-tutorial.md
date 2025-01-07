---
sidebar_position: 1
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of [steps](./step-tutorial.md), which are ordinary Python functions annotated with `@DBOS.step()`.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

Here's an example workflow that sends a confirmation email, sleeps for a while, then sends a reminder email.
By using a workflow, we guarantee that even if the sleep duration is weeks or months, even if your program crashes or restarts many times, the reminder email is always sent on schedule (and the confirmation email is never re-sent).

```python
@DBOS.workflow()
def reminder_workflow(email: str, time_to_sleep: int):
    send_confirmation_email(email)
    DBOS.sleep(time_to_sleep)
    send_reminder_email(email)
```

Here are some example apps demonstrating what workflows can do:

- [**Widget Store**](../examples/widget-store.md): No matter how many times you crash this online storefront, it always correctly processes your orders.
- [**Scheduled Reminders**](../examples/scheduled-reminders.md): Send a reminder email to yourself on any day in the future&mdash;even if it's months away.


## Reliability Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process crashes while executing a workflow and is restarted, it resumes the workflow from the last completed step.
2.  [Steps](./step-tutorial.md) are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed, it will never be re-executed.
3.  [Transactions](./transaction-tutorial.md) commit _exactly once_.  Once a workflow commits a transaction, it will never retry that transaction.

## Determinism

Workflows are in most respects normal Python functions.
They can have loops, branches, conditionals, and so on.
However, workflow functions must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order.
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in [transactions](./transaction-tutorial) and all other non-deterministic operations in [steps](./step-tutorial.md).

For example, **don't do this**:

```python
@DBOS.workflow()
def example_workflow(friend: str):
    body = requests.get("https://example.com").text
    return example_transaction(body)
```

Do this instead:

```python
@DBOS.step()
def example_step():
    return requests.get("https://example.com").text

@DBOS.workflow()
def example_workflow(friend: str):
    body = example_step()
    return example_transaction(body)
```

## Workflow IDs

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this ID through the [`DBOS.workflow_id`](../reference/contexts.md#workflow_id) context variable.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

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

You can also use [`DBOS.retrieve_workflow`](../reference/contexts.md#retrieve_workflow) to retrieve a workflow's handle from its ID.

## Workflow Events

Workflows can emit _events_, which are key-value pairs associated with the workflow's ID.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### set_event

Any workflow can call [`DBOS.set_event`](../reference/contexts.md#set_event) to publish a key-value pair, or update its value if has already been published.

```python
DBOS.set_event(
    key: str,
    value: Any,
) -> None
```
#### get_event

You can call [`DBOS.get_event`](../reference/contexts.md#get_event) to retrieve the value published by a particular workflow identity for a particular key.
If the event does not yet exist, this call waits for it to be published, returning `None` if the wait times out.

```python
DBOS.get_event(
    workflow_id: str,
    key: str,
    timeout_seconds: float = 60,
) -> None
```

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in our [widget store demo](../examples/widget-store.md), the checkout workflow, after validating an order, needs to send the customer a unique payment ID.
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

All events are persisted to the database, so once an event is set, it is guaranteed to always be retrievable.

## Workflow Messaging and Notifications
You can send messages to a specific workflow ID.
This is useful for sending notifications to an active workflow.

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
For example, in our [widget store demo](../examples/widget-store.md), the checkout workflow, after redirecting customers to a payments page, must wait for a notification that the user has paid.

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
If you're sending a message from a workflow, DBOS guarantees exactly-once delivery because [workflows are reliable](./workflow-tutorial#reliability-guarantees).
If you're sending a message from normal Python code, you can use [`SetWorkflowID`](../reference/contexts.md#setworkflowid) with an idempotency key to guarantee exactly-once execution.



## Coroutine Workflows

Coroutinues (functions defined with `async def`, also known as async functions) can also be DBOS workflows.
Asynchronous workflows provide the same [reliability guarantees](#reliability-guarantees) as synchronous workflow functions. 
Coroutine workflows may invoke [coroutine steps](./step-tutorial.md#coroutine-steps) via [await expressions](https://docs.python.org/3/reference/expressions.html#await).
Additionally, coroutine workflows can and should use the asyncronous versions of the workflow [event](#workflow-events) and [messaging and notification](#workflow-messaging-and-notifications) context methods.


:::info

At this time, DBOS does not support coroutine [transactions](./transaction-tutorial.md). 

:::

```python
@DBOS.step()
async def example_step():
    async with aiohttp.ClientSession() as session:
        async with session.get("https://example.com") as response:
            return await response.text()

@DBOS.workflow()
async def example_workflow(friend: str):
    await DBOS.sleep_async(10)
    body = await example_step()
    return example_transaction(body)
```