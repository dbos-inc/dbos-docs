---
sidebar_position: 1
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows help you write fault-tolerant background tasks, data processing pipelines, AI agents, and more.

You can make a function a workflow by annotating it with [`@DBOS.workflow()`](../reference/decorators.md#workflow).
Workflows call [steps](./step-tutorial.md), which are Python functions annotated with [`@DBOS.step()`](../reference/decorators.md#step).
If a workflow is interrupted for any reason, DBOS automatically recovers its execution from the last completed step.

Here's an example of a workflow:

```python
@DBOS.step()
def step_one():
    print("Step one completed!")

@DBOS.step()
def step_two():
    print("Step two completed!")

@DBOS.workflow()
def workflow():
    step_one()
    step_two()
```

## Starting Workflows In The Background

One common use-case for workflows is building reliable background tasks that keep running even when the program is interrupted, restarted, or crashes.
You can use [`DBOS.start_workflow`](../reference/contexts.md#start_workflow) to start a workflow in the background.
If you start a workflow this way, it returns a [workflow handle](../reference/workflow_handles.md), from which you can access information about the workflow or wait for it to complete and retrieve its result.

Here's an example:

```python
@DBOS.workflow()
def background_task(input):
    # ...
    return output

# Start the background task
handle: WorkflowHandle = DBOS.start_workflow(background_task, input)
# Wait for the background task to complete and retrieve its result.
output = handle.get_result()
```

After starting a workflow in the background, you can use [`DBOS.retrieve_workflow`](../reference/contexts.md#retrieve_workflow) to retrieve a workflow's handle from its ID.
You can also retrieve a workflow's handle from outside of your DBOS application with [`DBOSClient.retrieve_workflow`](../reference/client.md#retrieve_workflow).

If you need to run many workflows in the background and manage their concurrency or flow control, you can also use [DBOS queues](./queue-tutorial.md).

## Workflow IDs and Idempotency

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this ID through the [`DBOS.workflow_id`](../reference/contexts.md#workflow_id) context variable.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow with [`SetWorkflowID`](../reference/contexts.md#setworkflowid).
Workflow IDs must be **globally unique** for your application.
An assigned workflow ID acts as an idempotency key: if a workflow is called multiple times with the same ID, it executes only once.
This is useful if your operations have side effects like making a payment or sending an email.
For example:

```python
@DBOS.workflow()
def example_workflow():
    DBOS.logger.info(f"I am a workflow with ID {DBOS.workflow_id}")

with SetWorkflowID("very-unique-id"):
    example_workflow()
```

## Determinism

Workflows are in most respects normal Python functions.
They can have loops, branches, conditionals, and so on.
However, a workflow function must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order (given the same return values from those steps).
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


## Workflow Timeouts

You can set a timeout for a workflow with [`SetWorkflowTimeout`](../reference/contexts.md#setworkflowtimeout).
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```python
@DBOS.workflow()
def example_workflow():
    ...

# If the workflow does not complete within 10 seconds, it times out and is cancelled
with SetWorkflowTimeout(10):
    example_workflow()
```

## Durable Sleep

You can use [`DBOS.sleep()`](../reference/contexts.md#sleep) to put your workflow to sleep for any period of time.
This sleep is **durable**&mdash;DBOS saves the wakeup time in the database so that even if the workflow is interrupted and restarted multiple times while sleeping, it still wakes up on schedule.

Sleeping is useful for scheduling a workflow to run in the future (even days, weeks, or months from now).
For example:

```python
@DBOS.workflow()
def schedule_task(time_to_sleep, task):
  # Durably sleep for some time before running the task
  DBOS.sleep(time_to_sleep)
  run_task(task)
```

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

You can also call [`get_event`](../reference/client.md#get_event) from outside of your DBOS application with [DBOS Client](../reference/client.md).

```python
DBOS.get_event(
    workflow_id: str,
    key: str,
    timeout_seconds: float = 60,
) -> None
```

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

## Workflow Messaging and Notifications
You can send messages to a specific workflow ID.
This is useful for sending notifications to an active workflow.

#### Send

You can call `DBOS.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

You can also call [`send`](../reference/client.md#send) from outside of your DBOS application with [DBOS Client](../reference/client.md).

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
If you're sending a message from normal Python code, you can use [`SetWorkflowID`](../reference/contexts.md#setworkflowid) with an idempotency key to guarantee exactly-once execution.

## Workflow Streaming

Workflows can stream data in real time to clients.
This is useful for streaming results from a long-running workflow or LLM call or for monitoring or progress reporting.

#### Writing to Streams

You can write values to a stream from a workflow or its steps using [`DBOS.write_stream`](../reference/contexts.md#write_stream).
A workflow may have any number of streams, each identified by a unique key.

```python
DBOS.write_stream(
    key: str, 
    value: Any
) -> None:
```

When you are done writing to a stream, you should close it with [`DBOS.close_stream`](../reference/contexts.md#close_stream).
Otherwise, streams are automatically closed when the workflow terminates.

```python
DBOS.close_stream(
    key: str
) -> None
```

DBOS streams are immutable and append-only:.
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

You can read values from a stream from anywhere using [`DBOS.read_stream`](../reference/contexts.md#read_stream).
This function reads values from a stream identified by a workflow ID and key, yielding each value in order until the stream is closed or the workflow terminates.

```python
DBOS.read_stream(
    workflow_id: str,
    key: str
) -> Generator[Any, Any, None]
```

**Example syntax:**

```python
for value in DBOS.read_stream(workflow_id, example_key):
    print(f"Received: {value}")
```

## Coroutine (Async) Workflows

Coroutinues (functions defined with `async def`, also known as async functions) can also be DBOS workflows.
Coroutine workflows may invoke [coroutine steps](./step-tutorial.md#coroutine-steps) via [await expressions](https://docs.python.org/3/reference/expressions.html#await).
You should start coroutine workflows in the background using [`DBOS.start_workflow_async`](../reference/contexts.md#start_workflow_async) and enqueue them using [`enqueue_async`](../reference/queues.md#enqueue_async).
Additionally, coroutine workflows should use the asynchronous versions of the workflow [event](#workflow-events) and [messaging and notification](#workflow-messaging-and-notifications) context methods.


:::tip

At this time, DBOS does not support coroutine [transactions](./transaction-tutorial.md).
To execute transaction functions without blocking the event loop, use [`asyncio.to_thread`](https://docs.python.org/3/library/asyncio-task.html#asyncio.to_thread).

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
    result = await asyncio.to_thread(example_transaction, body)
    return result
```

## Workflow Guarantees

Workflows provide the following guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process is interrupted while executing a workflow and restarts, it resumes the workflow from the last completed step.
2.  [Steps](./step-tutorial.md) are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed, it will never be re-executed.
3.  [Transactions](./transaction-tutorial.md) commit _exactly once_.  Once a workflow commits a transaction, it will never retry that transaction.

If an exception is thrown from a workflow, the workflow terminates&mdash;DBOS records the exception, sets the workflow status to `ERROR`, and does not recover the workflow.
This is because uncaught exceptions are assumed to be nonrecoverable.
If your workflow performs operations that may transiently fail (for example, sending HTTP requests to unreliable services), those should be performed in [steps with configured retries](./step-tutorial.md#configurable-retries).
DBOS provides [tooling](./workflow-management.md) to help you identify failed workflows and examine the specific uncaught exceptions.

## Workflow Versioning and Recovery

Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the source code of its workflows (this can be overridden [through the `application_version` configuration parameter](../reference/configuration.md)).
All workflows are tagged with the application version on which they started.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
You cannot change the version of a workflow, but you can use [`DBOS.fork_workflow`](../reference/contexts#fork_workflow) to restart a workflow from a specific step on a specific code version.

For more information on managing workflow recovery when self-hosting production DBOS applications, check out [the guide](../../production/self-hosting/workflow-recovery.md).
