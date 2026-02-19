---
sidebar_position: 30
title: AI-Assisted Development
---

If you're using an AI coding agent to build a DBOS application, make sure it has the latest information on DBOS by either:

1. [Installing DBOS skills.](#dbos-agent-skills)
2. [Providing your agent with a DBOS prompt.](#dbos-prompt)

You may also want to use the [DBOS MCP server](../production/mcp.md) so your model can directly access your application's workflows and steps.

## DBOS Agent Skills

[Agent Skills](https://agentskills.io/home) help developers use AI agents to add DBOS durable workflows to their applications.
DBOS provides open-source skills you can check out [here](https://github.com/dbos-inc/agent-skills).

To install them into your coding agent, run:

```
npx skills add dbos-inc/agent-skills
```

The [Skills CLI](https://skills.sh/) is compatible with most coding agents, including Claude Code, Codex, Antigravity, and Cursor.

## DBOS Prompt

You can use this prompt to add rich information about DBOS to your AI coding agent's context.
You can copy and paste it directly into your context, or follow these directions to add it to your AI-powered IDE or coding agent of choice:

- Claude Code: Add the prompt, or a link to it, to your CLAUDE.md file.
- Cursor: Add the prompt to [your project rules](https://docs.cursor.com/context/rules-for-ai).
- GitHub Copilot: Create a [`.github/copilot-instructions.md`](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) file in your repository and add the prompt to it.

<details>
<summary><strong>DBOS Python Prompt</strong></summary>

````markdown
# Build Reliable Applications With DBOS

## Guidelines

- Respond in a friendly and concise manner
- Ask clarifying questions when requirements are ambiguous
- Generate code in Python using the DBOS library
- You MUST import all methods and classes used in the code you generate
- You SHALL keep all code in a single file unless otherwise specified.
- DBOS does NOT stand for anything.

## Workflow Guidelines

Workflows provide durable execution so you can write programs that are resilient to any failure.
Workflows are comprised of steps, which are ordinary Python functions annotated with @DBOS.step().
When using DBOS workflows, you should annotate any function that performs complex operations or accesses external APIs or services as a step. 
You can turn any Python function into a step by annotating it with the @DBOS.step decorator. The only requirement is that its inputs and outputs should be serializable.

If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

- If asked to add DBOS to existing code, you MUST ask which function to make a workflow. Do NOT recommend any changes until they have told you what function to make a workflow. Do NOT make a function a workflow unless SPECIFICALLY requested.
- When making a function a workflow, you should make all functions it calls steps. Do NOT change the functions in any way except by adding the @Step annotation.
- Do NOT make functions steps unless they are DIRECTLY called by a workflow.
- If the workflow function performs a non-deterministic action, you MUST move that action to its own function and make that function a step. Examples of non-deterministic actions include accessing an external API or service, accessing files on disk, generating a random number, of getting the current time.
- Do NOT use threads to start workflows or to start steps in workflows. You should instead use DBOS.start_workflow and DBOS queues.
- DBOS workflows and steps should NOT have side effects in memory outside of their own scope. They can access global variables, but they should NOT create or update global variables or variables outside their scope.
- Do NOT call DBOS.start_workflow or DBOS.recv from a step
- Do NOT start workflows from inside a step.
- Do NOT call DBOS.set_event and DBOS.recv from outside a workflow.

## DBOS Lifecycle Guidelines

A DBOS application MUST always be configured like so, unless otherwise specified, configuring and launching DBOS in its main function:

```python
if __name__ == "__main__":
    config: DBOSConfig = {
        "name": "my-app",
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.launch()
```

In a FastAPI application, the server should ALWAYS be started explicitly after a DBOS.launch in the main function:

```python
if __name__ == "__main__":
    config: DBOSConfig = {
        "name": "my-app",
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.launch()
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

If an app contains scheduled workflows and NOTHING ELSE (no HTTP server), then the main thread should block forever while the scheduled workflows run like this:

```python
if __name__ == "__main__":
    config: DBOSConfig = {
        "name": "my-app",
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.launch()
    threading.Event().wait()
```

Or if using asyncio:

```python
import asyncio
from dbos import DBOS, DBOSConfig

async def main():
    config: DBOSConfig = {
        "name": "dbos-app"
    }
    DBOS(config=config)
    DBOS.launch()
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())
```


## Workflow and Steps Examples

Simple example:


```python
import os
from dbos import DBOS, DBOSConfig

@DBOS.step()
def step_one():
    print("Step one completed!")

@DBOS.step()
def step_two():
    print("Step two completed!")

@DBOS.workflow()
def dbos_workflow():
    step_one()
    step_two()

if __name__ == "__main__":
    config: DBOSConfig = {
        "name": "dbos-starter",
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.launch()
    dbos_workflow()
```

Example with FastAPI:

```python
import os

from dbos import DBOS, DBOSConfig
from fastapi import FastAPI

app = FastAPI()

@DBOS.step()
def step_one():
    print("Step one completed!")

@DBOS.step()
def step_two():
    print("Step two completed!")

@app.get("/")
@DBOS.workflow()
def dbos_workflow():
    step_one()
    step_two()

if __name__ == "__main__":
    config: DBOSConfig = {
        "name": "dbos-starter",
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.launch()
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Example with queues:

```python
import os
import time

from dbos import DBOS, DBOSConfig, Queue
from fastapi import FastAPI

app = FastAPI()

queue = Queue("example-queue")

@DBOS.step()
def dbos_step(n: int):
    time.sleep(5)
    print(f"Step {n} completed!")

@app.get("/")
@DBOS.workflow()
def dbos_workflow():
    print("Enqueueing steps")
    handles = []
    for i in range(10):
        handle = queue.enqueue(dbos_step, i)
        handles.append(handle)
    results = [handle.get_result() for handle in handles]
    print(f"Successfully completed {len(results)} steps")

if __name__ == "__main__":
    config: DBOSConfig = {
        "name": "dbos-starter",
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.launch()
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Scheduled Workflows

You can schedule DBOS workflows to run on a cron schedule. Schedules are stored in the database and can be created, paused, resumed, and deleted at runtime.

A scheduled workflow MUST take two arguments: a `datetime` (the scheduled execution time) and a context object:

```python
from datetime import datetime
from typing import Any
from dbos import DBOS

@DBOS.workflow()
def my_periodic_task(scheduled_time: datetime, context: Any):
    DBOS.logger.info(f"Running task scheduled for {scheduled_time}")

DBOS.create_schedule(
    schedule_name="my-task-schedule",
    workflow_fn=my_periodic_task,
    schedule="*/5 * * * *",  # Every 5 minutes
)
```

- Use `DBOS.create_schedule` to create a schedule with a crontab expression.
- Use `DBOS.pause_schedule` and `DBOS.resume_schedule` to pause and resume schedules.
- Use `DBOS.delete_schedule` to delete a schedule.
- Use `DBOS.apply_schedules` to atomically create, update, or delete multiple schedules at once.
- Use `DBOS.list_schedules` and `DBOS.get_schedule` to inspect schedules.
- Use `DBOS.backfill_schedule` to enqueue missed executions for a time range.
- Use `DBOS.trigger_schedule` to immediately trigger a schedule.


## Workflow Documentation:

---
sidebar_position: 10
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows help you write fault-tolerant background tasks, data processing pipelines, AI agents, and more.

You can make a function a workflow by annotating it with `@DBOS.workflow()`.
Workflows call steps, which are Python functions annotated with `@DBOS.step()`.
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
You can use `DBOS.start_workflow` to start a workflow in the background.
If you start a workflow this way, it returns a workflow handle, from which you can access information about the workflow or wait for it to complete and retrieve its result.

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

After starting a workflow in the background, you can use `DBOS.retrieve_workflow` to retrieve a workflow's handle from its ID.
You can also retrieve a workflow's handle from outside of your DBOS application with `DBOSClient.retrieve_workflow`.

If you need to run many workflows in the background and manage their concurrency or flow control, you can also use DBOS queues.

## Workflow IDs and Idempotency

Every time you execute a workflow, that execution is assigned a unique ID, by default a UUID.
You can access this ID through the `DBOS.workflow_id` context variable.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow with `SetWorkflowID`.
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
Instead, you should do all database operations in transactions and all other non-deterministic operations in steps.

For example, **don't do this**:

```python
@DBOS.workflow()
def example_workflow():
    choice = random.randint(0, 1)
    if choice == 0:
        step_one()
    else:
        step_two()
```

Do this instead:

```python
@DBOS.step()
def generate_choice():
    return random.randint(0, 1)

@DBOS.workflow()
def example_workflow(friend: str):
    choice = generate_choice()
    if choice == 0:
        step_one()
    else:
        step_two()
```


## Workflow Timeouts

You can set a timeout for a workflow with `SetWorkflowTimeout`.
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

You can use `DBOS.sleep()` to put your workflow to sleep for any period of time.
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

## Debouncing Workflows

You can create a `Debouncer` to debounce your workflows.
Debouncing delays workflow execution until some time has passed since the workflow has last been called.
This is useful for preventing wasted work when a workflow may be triggered multiple times in quick succession.
For example, if a user is editing an input field, you can debounce their changes to execute a processing workflow only after they haven't edited the field for some time:

### Debouncer.create

```python
Debouncer.create(
    workflow: Callable[P, R],
    *,
    debounce_timeout_sec: Optional[float] = None,
    queue: Optional[Queue] = None,
) -> Debouncer[P, R]
```

**Parameters:**
- `workflow`: The workflow to debounce.
- `debounce_key`: The debounce key for this debouncer. Used to group workflow executions that will be debounced. For example, if the debounce key is set to customer ID, each customer's workflows would be debounced separately.
- `debounce_timeout_sec`: After this time elapses since the first time a workflow is submitted from this debouncer, the workflow is started regardless of the debounce period.
- `queue`: When starting a workflow after debouncing, enqueue it on this queue instead of executing it directly.

### debounce

```python
debouncer.debounce(
    debounce_key: str,
    debounce_period_sec: float,
    *args: P.args,
    **kwargs: P.kwargs,
) -> WorkflowHandle[R]
```

Submit a workflow for execution but delay it by `debounce_period_sec`.
Returns a handle to the workflow.
The workflow may be debounced again, which further delays its execution (up to `debounce_timeout_sec`).
When the workflow eventually executes, it uses the **last** set of inputs passed into `debounce`.

After the workflow begins execution, the next call to `debounce` starts the debouncing process again for a new workflow execution.

**Parameters:**
- `debounce_key`: A key used to group workflow executions that will be debounced together. For example, if the debounce key is set to customer ID, each customer's workflows would be debounced separately.
- `debounce_period_sec`: Delay this workflow's execution by this period.
- `*args`: Variadic workflow arguments.
- `**kwargs`: Variadic workflow keyword arguments.

**Example Syntax**:

```python
@DBOS.workflow()
def process_input(user_input):
    ...

# Each time a user submits a new input, debounce the process_input workflow.
# The workflow will wait until 60 seconds after the user stops submitting new inputs,
debouncer = Debouncer.create(process_input)
# then process the last input submitted.
def on_user_input_submit(user_id, user_input):
    debounce_key = user_id
    debounce_period_sec = 60
    debouncer.debounce(debounce_key, debounce_period_sec, user_input)
```

### Debouncer.create_async

```python
Debouncer.create_async(
    workflow: Callable[P, Coroutine[Any, Any, R]],
    *,
    debounce_timeout_sec: Optional[float] = None,
    queue: Optional[Queue] = None,
) -> Debouncer[P, R]
```
Async version of `Debouncer.create`.

### debounce_async

```python
debouncer.debounce_async(
    debounce_key: str,
    debounce_period_sec: float,
    *args: P.args,
    **kwargs: P.kwargs,
) -> WorkflowHandleAsync[R]:
```

Async version of `debouncer.debounce`.

## Coroutine (Async) Workflows

Coroutinues (functions defined with `async def`, also known as async functions) can also be DBOS workflows.
Coroutine workflows may invoke coroutine steps via await expressions.
You should start coroutine workflows using `DBOS.start_workflow_async` and enqueue them using `enqueue_async`.
Calling a coroutine workflow or starting it with `DBOS.start_workflow_async` always runs it in the same event loop as its caller, but enqueueing it with `enqueue_async` starts the workflow in a different event loop.
Additionally, coroutine workflows should use the asynchronous versions of the workflow communication context methods.


:::tip

At this time, DBOS does not support coroutine transactions.
To execute transaction functions without blocking the event loop, use `asyncio.to_thread`.

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

### Running Async Steps In Parallel

Initiating several concurrent steps in an `async` workflow, followed by awaiting them with
`asyncio.gather(..., return_exceptions=True)`, is valid as long as the steps are started
in a **deterministic order**. For example, the following is allowed:

```python
    # Start steps in a deterministic order (step1, step2, step3, step4),
    # then await them all together.
    tasks = [
        asyncio.create_task(step1("arg1")),
        asyncio.create_task(step2("arg2")),
        asyncio.create_task(step3("arg3")),
        asyncio.create_task(step4("arg4")),
    ]

    # Collects exceptions instead of raising immediately
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

This is allowed because each step is started in a well-defined sequence before awaiting.

By contrast, the following is not allowed:
```python
    async def seq_a():
        await step1("arg1")
        await step2("arg3")

    async def seq_b():
        await step3("arg2")
        await step4("arg4")

    tasks = [
        asyncio.create_task(seq_a()),
        asyncio.create_task(seq_b()),
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

Here, `step2` and `step4` may be started in either order since their execution depends on
the relative time taken by `step1` and `step3`.

If you need to run sequences of operations concurrently, start child workflows and await
their results, rather than interleaving step execution inside a single workflow.

For proper error handling, when using `asyncio.gather()`, specify `return_exceptions=True`.
Without `return_exceptions=True`, `gather` will raise any exception immediately
and stop awaiting the rest of the tasks. If one of the remaining tasks later fails, its
exception may go unobserved. Instead, prefer `asyncio.gather(..., return_exceptions=True)`,
which safely waits for all tasks to complete and reports their outcomes.

## Communicating with Workflows

DBOS provides a few different ways to communicate with your workflows.
You can:

- Send messages to workflows
- Publish events from workflows for clients to read
- Stream values from workflows to clients


## Workflow Messaging and Notifications
You can send messages to a specific workflow.
This is useful for signaling a workflow or sending notifications to it while it's running.

### Send

```python
DBOS.send(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None
) -> None
```

You can call `DBOS.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

You can also call `send` from outside of your DBOS application with the DBOS Client.

### Recv

```python
DBOS.recv(
    topic: Optional[str] = None,
    timeout_seconds: float = 60,
) -> Any
```

Workflows can call `DBOS.recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `None` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in the widget store demo, the checkout workflow, after redirecting customers to a payments page, must wait for a notification that the user has paid.

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

### Reliability Guarantees

All messages are persisted to the database, so if `send` completes successfully, the destination workflow is guaranteed to be able to `recv` it.
If you're sending a message from a workflow, DBOS guarantees exactly-once delivery.
If you're sending a message from normal Python code, you can use `SetWorkflowID` with an idempotency key to guarantee exactly-once delivery.

## Workflow Events

Workflows can publish _events_, which are key-value pairs associated with the workflow.
They are useful for publishing information about the status of a workflow or to send a result to clients while the workflow is running.

### set_event

```python
DBOS.set_event(
    key: str,
    value: Any,
) -> None
```

Any workflow or step can call `DBOS.set_event` to publish a key-value pair, or update its value if has already been published.

### get_event

```python
DBOS.get_event(
    workflow_id: str,
    key: str,
    timeout_seconds: float = 60,
) -> None
```

You can call `DBOS.get_event` to retrieve the value published by a particular workflow identity for a particular key.
If the event does not yet exist, this call waits for it to be published, returning `None` if the wait times out.

You can also call `get_event` from outside of your DBOS application with DBOS Client.

### get_all_events

```python
DBOS.get_all_events(
    workflow_id: str
) -> Dict[str, Any]
```

You can use `DBOS.get_all_events` to retrieve the latest values of all events published by a workflow.

### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in the widget store demo, the checkout workflow, after validating an order, needs to send the customer a unique payment ID.
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

### Reliability Guarantees

All events are persisted to the database, so the latest version of an event is always retrievable.
Additionally, if `get_event` is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated.

## Workflow Streaming

Workflows can stream data in real time to clients.
This is useful for streaming results from a long-running workflow or LLM call or for monitoring or progress reporting.

<img src={require('@site/static/img/workflow-communication/workflow-streams.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

### Writing to Streams

```python
DBOS.write_stream(
    key: str, 
    value: Any
) -> None:
```

You can write values to a stream from a workflow or its steps using `DBOS.write_stream`.
A workflow may have any number of streams, each identified by a unique key.

When you are done writing to a stream, you should close it with `DBOS.close_stream`.
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

### Reading from Streams

```python
DBOS.read_stream(
    workflow_id: str,
    key: str
) -> Generator[Any, Any, None]
```

You can read values from a stream from anywhere using `DBOS.read_stream`.
This function reads values from a stream identified by a workflow ID and key, yielding each value in order until the stream is closed or the workflow terminates.

You can also read from a stream from outside a DBOS application with a DBOS Client.

**Example syntax:**

```python
for value in DBOS.read_stream(workflow_id, example_key):
    print(f"Received: {value}")
```

### Configurable Retries

You can optionally configure a step to automatically retry any exception a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
Retries are configurable through arguments to the step decorator:

```python
DBOS.step(
    retries_allowed: bool = False,
    interval_seconds: float = 1.0,
    max_attempts: int = 3,
    backoff_rate: float = 2.0
)
```

For example, we configure this step to retry exceptions (such as if `example.com` is temporarily down) up to 10 times:

```python
@DBOS.step(retries_allowed=True, max_attempts=10)
def example_step():
    return requests.get("https://example.com").text
```

## DBOS Queues

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

To create a queue, specify its name and optional flow control parameters:

```python
from dbos import Queue

Queue(
    name: str = None,
    concurrency: Optional[int] = None,
    limiter: Optional[QueueRateLimit] = None,
    *,
    worker_concurrency: Optional[int] = None,
    priority_enabled: bool = False,
    partition_queue: bool = False,
    polling_interval_sec: float = 1.0,
)

class QueueRateLimit(TypedDict):
    limit: int
    period: float  # In seconds
```

**Parameters:**
- `name`: The name of the queue. Must be unique among all queues in the application.
- `concurrency`: The maximum number of functions from this queue that may run concurrently. This concurrency limit is global across all DBOS processes using this queue. If not provided, any number of functions may run concurrently.
- `limiter`: A limit on the maximum number of functions which may be started in a given period.
- `worker_concurrency`: The maximum number of functions from this queue that may run concurrently on a given DBOS process. Must be less than or equal to `concurrency`.
- `priority_enabled`: Enable setting priority for workflows on this queue.
- `partition_queue`: Enable partitioning for this queue.
- `polling_interval_sec`: The interval at which DBOS polls the database for new workflows on this queue.

**Example syntax:**

```python
from dbos import Queue

queue = Queue("example_queue")
```

You can then enqueue any DBOS workflow or step.
Enqueuing a function submits it for execution and returns a handle to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```python
queue = Queue("example_queue")

@DBOS.workflow()
def process_task(task):
  ...

task = ...
handle = queue.enqueue(process_task, task)
```

### Queue Example

Here's an example of a workflow using a queue to process tasks concurrently:

```python
from dbos import DBOS, Queue

queue = Queue("example_queue")

@DBOS.workflow()
def process_task(task):
  ...

@DBOS.workflow()
def process_tasks(tasks):
  task_handles = []
  # Enqueue each task so all tasks are processed concurrently.
  for task in tasks:
    handle = queue.enqueue(process_task, task)
    task_handles.append(handle)
  # Wait for each task to complete and retrieve its result.
  # Return the results of all tasks.
  return [handle.get_result() for handle in task_handles]
```

### Enqueueing from Another Application

Often, you want to enqueue a workflow from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

You can use the DBOS Client to enqueue workflows from outside your DBOS application by connecting directly to your DBOS application's system database.
Since the DBOS Client is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

For example, this code enqueues the `data_pipeline` workflow on the `pipeline_queue` queue with `task` as an argument.

```python
from dbos import DBOSClient, EnqueueOptions

client = DBOSClient(system_database_url=os.environ["DBOS_SYSTEM_DATABASE_URL"])

options: EnqueueOptions = {
  "queue_name": "pipeline_queue",
  "workflow_name": "data_pipeline",
}
handle = client.enqueue(options, task)
result = handle.get_result()
```

### Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

#### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```python
from dbos import Queue

queue = Queue("example_queue", worker_concurrency=5)
```

Note that DBOS uses `executor_id` to distinguish processes&mdash;this is set automatically by Conductor and Cloud, but if those are not used it must be set to a unique value for each process through configuration.

#### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions
:::

```python
from dbos import Queue

queue = Queue("example_queue", concurrency=10)
```

#### In-Order Processing

You can use a queue with `concurrency=1` to guarantee sequential, in-order processing of events.
Only a single event will be processed at a time.
For example, this app processes events sequentially in the order of their arrival:

 ```python
from fastapi import FastAPI
from dbos import DBOS, Queue

queue = Queue("in_order_queue", concurrency=1)

@DBOS.step()
def process_event(event: str):
    ...

def event_endpoint(event: str):
    queue.enqueue(process_event, event)
 ```

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 50 with a period of 30 seconds, so it may not start more than 50 functions in 30 seconds:

```python
queue = Queue("example_queue", limiter={"limit": 50, "period": 30})
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.


## Setting Timeouts

You can set a timeout for an enqueued workflow with `SetWorkflowTimeout`.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: a workflow's timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```python
@DBOS.workflow()
def example_workflow():
    ...

queue = Queue("example-queue")

# If the workflow does not complete within 10 seconds after being dequeued, it times out and is cancelled
with SetWorkflowTimeout(10):
    queue.enqueue(example_workflow)
```

## Partitioning Queues

You can **partition** queues to distribute work across dynamically created queue partitions.
When you enqueue a workflow on a partitioned queue, you must supply a queue partition key.
Partitioned queues dequeue workflows and apply flow control limits for individual partitions, not for the entire queue.
Essentially, you can think of each partition as a "subqueue" you dynamically create by enqueueing a workflow with a partition key.

For example, suppose you want your users to each be able to run at most one task at a time.
You can do this with a partitioned queue with a maximum concurrency limit of 1 where the partition key is user ID.

**Example Syntax**

```python
queue = Queue("partitioned_queue", partition_queue=True, concurrency=1)

@DBOS.workflow()
def process_task(task: Task):
  ...


def on_user_task_submission(user_id: str, task: Task):
    # Partition the task queue by user ID. As the queue has a
    # maximum concurrency of 1, this means that at most one
    # task can run at once per user (but tasks from different
    # users can run concurrently).
    with SetEnqueueOptions(queue_partition_key=user_id):
        queue.enqueue(process_task, task)
```

Sometimes, you want to apply global or per-worker limits to a partitioned queue.
You can do this with **multiple levels of queueing**.
Create two queues: a partitioned queue with per-partition limits and a non-partitioned queue with global limits.
Enqueue a "concurrency manager" workflow to the partitioned queue, which then enqueues your actual workflow
to the non-partitioned queue and awaits its result.
This ensures both queues' flow control limits are enforced on your workflow.
For example:

```python
# By using two levels of queueing, we enforce both a concurrency limit of 1 on each partition
# and a global concurrency limit of 5, meaning that no more than 5 tasks can run concurrently
# across all partitions (and at most one task per partition).
concurrency_queue = Queue("concurrency-queue", concurrency=5)
partitioned_queue = Queue("partitioned-queue", partition_queue=True, concurrency=1)

def on_user_task_submission(user_id: str, task: Task):
    # First, enqueue a "concurrency manager" workflow to the partitioned
    # queue to enforce per-partition limits.
    with SetEnqueueOptions(queue_partition_key=user_id):
        partitioned_queue.enqueue(concurrency_manager, task)

@DBOS.workflow()
def concurrency_manager(task):
    # The "concurrency manager" workflow enqueues the process_task
    # workflow on the non-partitioned queue and awaits its results
    # to enforce global flow control limits.
    return concurrency_queue.enqueue(process_task, task).get_result()

@DBOS.workflow()
def process_task(task):
    ...
```

## Deduplication

You can set a deduplication ID for an enqueued workflow with `SetEnqueueOptions`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDeduplicatedError` exception.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

Example syntax:

```python
from dbos import DBOS, Queue, SetEnqueueOptions
from dbos import error as dboserror

queue = Queue("example_queue")

with SetEnqueueOptions(deduplication_id="my_dedup_id"):
    try:
        handle = queue.enqueue(example_workflow, ...)
    except dboserror.DBOSQueueDeduplicatedError as e:
        # Handle deduplication error
```

## Priority

You can set a priority for an enqueued workflow with `SetEnqueueOptions`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
If using priority, you must set `priority_enabled=True` on your queue.

:::tip
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
:::

Example syntax:

```python
queue = Queue("priority_queue", priority_enabled=True)

with SetEnqueueOptions(priority=10):
    # All workflows are enqueued with priority set to 10
    # They will be dequeued in FIFO order
    for task in tasks:
        queue.enqueue(task_workflow, task)

# first_workflow (priority=1) will be dequeued before all task_workflows (priority=10)
with SetEnqueueOptions(priority=1):
    queue.enqueue(first_workflow)
```

## Explicit Queue Listening

By default, a process running DBOS listens to (dequeues workflows from) all declared queues.
However, sometimes you only want a process to listen to to a specific list of queues.
You can use `DBOS.listen_queues` to explicitly tell a process running DBOS to only listen to a specific set of queues.
You must call `DBOS.listen_queues` before DBOS is launched.

This is particularly useful when managing heterogeneous workers, where specific tasks should execute on specific physical servers.
For example, say you have a mix of CPU workers and GPU workers and you want CPU tasks to only execute on CPU workers and GPU tasks to only execute on GPU workers.
You can create separate queues for CPU and GPU tasks and configure each type of worker to only listen to the appropriate queue:

```python
cpu_queue = Queue("cpu_queue")
gpu_queue = Queue("gpu_queue")

if __name__ == "__main__":
    worker_type = ... # "cpu' or 'gpu'
    config: DBOSConfig = ...
    DBOS(config=config)
    if worker_type = "gpu":
        # GPU workers will only dequeue and execute workflows from the GPU queue
        DBOS.listen_queues([gpu_queue])
    elif worker_type == "cpu":
        # CPU workers will only dequeue and execute workflows from the CPU queue
        DBOS.listen_queues([cpu_queue])
    DBOS.launch()
```

Note that `DBOS.listen_queues` only controls what workflows are dequeued, not what workflows can be enqueued, so you can freely enqueue tasks onto the GPU queue from a CPU worker for execution on a GPU worker, and vice versa.


## Python Classes

You can add DBOS decorators to your Python class instance methods.
You can add step decorators to any class methods, but to add a workflow decorator to a class method, its class must inherit from `DBOSConfiguredInstance` and must be decorated with `@DBOS.dbos_class`.
For example:

```python
@DBOS.dbos_class()
class URLFetcher(DBOSConfiguredInstance):
    def __init__(self, url: str):
        self.url = url
        super().__init__(instance_name=url)

    @DBOS.workflow()
    def fetch_workflow(self):
        return self.fetch_url()

    @DBOS.step()
    def fetch_url(self):
        return requests.get(self.url).text
    
example_fetcher = URLFetcher("https://example.com")
print(example_fetcher.fetch_workflow())
```

When you create a new instance of a DBOS class,  `DBOSConfiguredInstance` must be instantiated with an `instance_name`.
This `instance_name` should be a unique identifier of the instance.
Additionally, all DBOS-decorated classes must be instantiated before `DBOS.launch()` is called.

The reason for these requirements is to enable workflow recovery.
When you create a new instance of a DBOS class, DBOS stores it in a global registry indexed by `instance_name`.
When DBOS needs to recover a workflow belonging to that class, it looks up the class instance using `instance_name` so it can run the workflow using the right instance of its class.
If `instance_name` is not supplied, or if DBOS classes are dynamically instantiated after `DBOS.launch()`, then DBOS may not find the class instance it needs to recover a workflow.


### Testing DBOS Functions

Unless otherwise specified, recommend testing DBOS applications with pytest.

You MUST use this fixture to reset DBOS between tests:

```python
@pytest.fixture()
def reset_dbos():
    DBOS.destroy()
    config: DBOSConfig = {
        "name": "my-app",
        "database_url": os.environ.get("TESTING_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.reset_system_database()
    DBOS.launch()
```

## Upgrading Workflow Code

One challenge you may encounter when operating long-running durable workflows in production is **how to deploy breaking changes without disrupting in-progress workflows.**
A breaking change to a workflow is any change in what steps run or the order in which steps run.
The issue is that if a breaking change was made to a workflow, the checkpoints created by a workflow that started on the previous version of the code may not match the steps called by the workflow in the new version of the code, which makes the workflow difficult to recover.

DBOS supports two strategies for safely upgrading workflow code: **patching** and **versioning**.

### Patching

When using patching, you use `DBOS.patch()` to make a breaking change in a conditional.
`DBOS.patch()` returns `True` for new workflows (those started after the breaking change) and `False` for old workflows (those started before the breaking change).
Therefore, if `DBOS.patch()` is `True`, call the new code, else, call the old code.

To use patching, you must enable it in configuration:

```python
config: DBOSConfig = {
    "name": "dbos-app",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "enable_patching": True,
}
DBOS(config=config)
```

For example, let's say our workflow is:

```python
@DBOS.workflow()
def workflow():
  foo()
  bar()
```

We want to replace the call to `foo()` with a call to `baz()`.
This is a breaking change because it changes what steps run.
We can make this breaking change safely using a patch:

```python
@DBOS.workflow()
def workflow():
  if DBOS.patch("use-baz"):
    baz()
  else:
    foo()
  bar()
```

Now, new workflows will run `baz()`, while old workflows will safely continue through `foo()`.

#### Deprecating and Removing Patches

Patches don't need to stay in your code forever.
Once all workflows that started before you deployed the patch are complete, you can safely remove patches from your code.
You can use the list workflows APIs to see what workflows are still active.
First, you must deprecate the patch with `DBOS.deprecate_patch()`.
This safely runs all workflows that contain the patch marker, but does not insert the patch marker into new workflows.
For example, here's how to deprecate the patch above:

```python
@DBOS.workflow()
def workflow():
  DBOS.deprecate_patch("use-baz")
  baz()
  bar()
```

Then, when all workflows that started before you deprecated the patch are complete, you can remove the patch entirely:

```python
@DBOS.workflow()
def workflow():
  baz()
  bar()
```

If any mistakes happen during the process (a breaking change is not patched, or a patch is deprecated or removed prematurely), the workflow will throw a `DBOSUnexpectedStepError` error clearly pointing to the step where the problem occurred.

### Versioning

When using versioning, DBOS **versions** applications and workflows.
All workflows are tagged with the application version on which they started.
By default, application version is automatically computed from a hash of workflow source code.
However, you can set your own version through configuration.

```python
config: DBOSConfig = {
    "name": "dbos-app",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "application_version": "1.0.0",
}
DBOS(config=config)
```

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.

When using versioning, we recommend **blue-green** code upgrades.
When deploying a new version of your code, launch new processes running your new code version, but retain some processes running your old code version.
Direct new traffic to your new processes while your old processes "drain" and complete all workflows of the old code version.
Then, once all workflows of the old version are complete (you can use `DBOS.list_workflows` to check), you can retire the old code version.

## Workflow Handle

DBOS.start_workflow, DBOS.retrieve_workflow, and enqueue return workflow handles.

#### get_workflow_id

```python
handle.get_workflow_id() -> str
```

Retrieve the ID of the workflow.

#### get_result

```python
handle.get_result(
    *,
    polling_interval_sec: float = 1.0,
) -> R
```

Wait for the workflow to complete, then return its result.

**Parameters:**
- **polling_interval_sec**: The interval at which DBOS polls the database for the workflow's result. Only used for enqueued workflows or retrieved handles.

#### get_status

```python
handle.get_status() -> WorkflowStatus
```

## Workflow Management Methods

### list_workflows
```python
def list_workflows(
    *,
    workflow_ids: Optional[List[str]] = None,
    status: Optional[Union[str, List[str]]] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    name: Optional[str] = None,
    app_version: Optional[str] = None,
    forked_from: Optional[str] = None,
    user: Optional[str] = None,
    queue_name: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    sort_desc: bool = False,
    workflow_id_prefix: Optional[str] = None,
    load_input: bool = True,
    load_output: bool = True,
    executor_id: Optional[str] = None,
    queues_only: bool = False,
) -> List[WorkflowStatus]:
```

Retrieve a list of `WorkflowStatus` of all workflows matching specified criteria.

**Parameters:**
- **workflow_ids**: Retrieve workflows with these IDs.
- **status**: Retrieve workflows with this status (or one of these statuses) (Must be `ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`)
- **start_time**: Retrieve workflows started after this (RFC 3339-compliant) timestamp.
- **end_time**: Retrieve workflows started before this (RFC 3339-compliant) timestamp.
- **name**: Retrieve workflows with this fully-qualified name.
- **app_version**: Retrieve workflows tagged with this application version.
- **forked_from**: Retrieve workflows forked from this workflow ID.
- **user**: Retrieve workflows run by this authenticated user.
- **queue_name**: Retrieve workflows that were enqueued on this queue.
- **limit**: Retrieve up to this many workflows.
- **offset**: Skip this many workflows from the results returned (for pagination).
- **sort_desc**: Whether to sort the results in descending (`True`) or ascending (`False`) order by workflow start time.
- **workflow_id_prefix**: Retrieve workflows whose IDs start with the specified string.
- **load_input**: Whether to load and deserialize workflow inputs. Set to `False` to improve performance when inputs are not needed.
- **load_output**: Whether to load and deserialize workflow outputs. Set to `False` to improve performance when outputs are not needed.
- **executor_id**: Retrieve workflows with this executor ID.
- **queues_only**: If `True`, only retrieve workflows that are currently queued (status `ENQUEUED` or `PENDING` and `queue_name` not null).

### list_queued_workflows
```python
def list_queued_workflows(
    *,
    workflow_ids: Optional[List[str]] = None,
    status: Optional[Union[str, List[str]]] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    name: Optional[str] = None,
    app_version: Optional[str] = None,
    forked_from: Optional[str] = None,
    user: Optional[str] = None,
    queue_name: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    sort_desc: bool = False,
    workflow_id_prefix: Optional[str] = None,
    load_input: bool = True,
    load_output: bool = True,
    executor_id: Optional[str] = None,
) -> List[WorkflowStatus]:
```

Retrieve a list of `WorkflowStatus` of all **queued** workflows (status `ENQUEUED` or `PENDING` and `queue_name` not null) matching specified criteria.

**Parameters:**
- **workflow_ids**: Retrieve workflows with these IDs.
- **status**: Retrieve workflows with this status (or one of these statuses) (Must be `ENQUEUED` or `PENDING`)
- **start_time**: Retrieve workflows enqueued after this (RFC 3339-compliant) timestamp.
- **end_time**: Retrieve workflows enqueued before this (RFC 3339-compliant) timestamp.
- **name**: Retrieve workflows with this fully-qualified name.
- **app_version**: Retrieve workflows tagged with this application version.
- **forked_from**: Retrieve workflows forked from this workflow ID.
- **user**: Retrieve workflows run by this authenticated user.
- **queue_name**: Retrieve workflows running on this queue.
- **limit**: Retrieve up to this many workflows.
- **offset**: Skip this many workflows from the results returned (for pagination).
- **sort_desc**: Whether to sort the results in descending (`True`) or ascending (`False`) order by workflow start time.
- **workflow_id_prefix**: Retrieve workflows whose IDs start with the specified string.
- **load_input**: Whether to load and deserialize workflow inputs. Set to `False` to improve performance when inputs are not needed.
- **load_output**: Whether to load and deserialize workflow outputs. Set to `False` to improve performance when outputs are not needed.
- **executor_id**: Retrieve workflows with this executor ID.

### list_workflow_steps
```python
def list_workflow_steps(
    workflow_id: str,
) -> List[StepInfo]
```

Retrieve the steps of a workflow.
This is a list of `StepInfo` objects, with the following structure:

```python
class StepInfo(TypedDict):
    # The unique ID of the step in the workflow. One-indexed.
    function_id: int
    # The (fully qualified) name of the step
    function_name: str
    # The step's output, if any
    output: Optional[Any]
    # The error the step threw, if any
    error: Optional[Exception]
    # If the step starts or retrieves the result of a workflow, its ID
    child_workflow_id: Optional[str]
    # The Unix epoch timestamp at which this step started
    started_at_epoch_ms: Optional[int]
    # The Unix epoch timestamp at which this step completed
    completed_at_epoch_ms: Optional[int]
```

### cancel_workflow

```python
DBOS.cancel_workflow(
    workflow_id: str,
) -> None
```

Cancel a workflow.
This sets is status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step)

### resume_workflow

```python
DBOS.resume_workflow(
    workflow_id: str
) -> WorkflowHandle[R]
```

Resume a workflow.
This immediately starts it from its last completed step.
You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

### fork_workflow

```python
DBOS.fork_workflow(
    workflow_id: str,
    start_step: int,
    *,
    application_version: Optional[str] = None,
) -> WorkflowHandle[R]
```

Start a new execution of a workflow from a specific step.
The input step ID must match the `function_id` of the step returned by `list_workflow_steps`.
The specified `start_step` is the step from which the new workflow will start, so any steps whose ID is less than `start_step` will not be re-executed.

The forked workflow will have a new workflow ID, which can be set with `SetWorkflowID`.
It is possible to specify the application version on which the forked workflow will run by setting `application_version`, this is useful for "patching" workflows that failed due to a bug in a previous application version.

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```python
class WorkflowStatus:
    # The workflow ID
    workflow_id: str
    # The workflow status. Must be one of ENQUEUED, PENDING, SUCCESS, ERROR, CANCELLED, or MAX_RECOVERY_ATTEMPTS_EXCEEDED
    status: str
    # The name of the workflow function
    name: str
    # The name of the workflow's class, if any
    class_name: Optional[str]
    # The name with which the workflow's class instance was configured, if any
    config_name: Optional[str]
    # The user who ran the workflow, if specified
    authenticated_user: Optional[str]
    # The role with which the workflow ran, if specified
    assumed_role: Optional[str]
    # All roles which the authenticated user could assume
    authenticated_roles: Optional[list[str]]
    # The deserialized workflow input object
    input: Optional[WorkflowInputs]
    # The workflow's output, if any
    output: Optional[Any]
    # The error the workflow threw, if any
    error: Optional[Exception]
    # Workflow start time, as a Unix epoch timestamp in ms
    created_at: Optional[int]
    # Last time the workflow status was updated, as a Unix epoch timestamp in ms
    updated_at: Optional[int]
    # If this workflow was enqueued, on which queue
    queue_name: Optional[str]
    # The executor to most recently execute this workflow
    executor_id: Optional[str]
    # The application version on which this workflow was started
    app_version: Optional[str]
    # The start-to-close timeout of the workflow in ms
    workflow_timeout_ms: Optional[int]
    # The deadline of a workflow, computed by adding its timeout to its start time.
    workflow_deadline_epoch_ms: Optional[int]
    # Unique ID for deduplication on a queue
    deduplication_id: Optional[str]
    # Priority of the workflow on the queue, starting from 1 ~ 2,147,483,647. Default 0 (highest priority).
    priority: Optional[int]
    # If this workflow is enqueued on a partitioned queue, its partition key
    queue_partition_key: Optional[str]
    # If this workflow was forked from another, that workflow's ID.
    forked_from: Optional[str]
```

Retrieve the workflow status:


### Configuring DBOS

To configure DBOS, pass a `DBOSConfig` object to its constructor.
For example:

```python
config: DBOSConfig = {
    "name": "dbos-example",
    "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
}
DBOS(config=config)
```

The `DBOSConfig` object has the following fields.
All fields except `name` are optional.

```python
class DBOSConfig(TypedDict):
    name: str
    enable_patching: Optional[bool]
    application_version: Optional[str]
    executor_id: Optional[str]

    system_database_url: Optional[str]
    application_database_url: Optional[str]
    sys_db_pool_size: Optional[int]
    dbos_system_schema: Optional[str]
    system_database_engine: Optional[sqlalchemy.Engine]
    use_listen_notify: Optional[bool]

    conductor_key: Optional[str]
    conductor_url: Optional[str]

    enable_otlp: Optional[bool]
    otlp_traces_endpoints: Optional[List[str]]
    otlp_logs_endpoints: Optional[List[str]]
    otlp_attributes: Optional[dict[str, str]]
    log_level: Optional[str]

    run_admin_server: Optional[bool]
    admin_port: Optional[int]

    serializer: Optional[Serializer]
```

- **name**: Your application's name.
- **enable_patching** Enable the patching strategy for safely upgrading workflow code.
- **application_version**: If using the versioning strategy for safely upgrading workflow code, the code version for this application and its workflows.
- **executor_id**: A unique process ID used to identify the application instance in distributed environments. If using DBOS Conductor or Cloud, this is set automatically.
- **system_database_url**: A connection string to your system database.
This is the database in which DBOS stores workflow and step state.
This may be either Postgres or SQLite, though Postgres is recommended for production.
DBOS uses this connection string, unmodified, to create a SQLAlchemy Engine
A valid connection string looks like:

```
postgresql://[username]:[password]@[hostname]:[port]/[database name]
```

Or with SQLite:

```
sqlite:///[path to database file]
```

:::info
Passwords in connection strings must be escaped (for example with urllib) if they contain special characters.
:::

If no connection string is provided, DBOS uses a SQLite database:

```shell
sqlite:///[application_name].sqlite
```
- **application_database_url**: A connection string to your application database.
This is the database in which DBOS executes `@DBOS.transaction` functions.
This parameter has the same format and default as `system_database_url`.
If you are not using `@DBOS.transaction`, you do not need to supply this parameter.
- **sys_db_pool_size**: The size of the connection pool used for the DBOS system database. Defaults to 20.
- **dbos_system_schema**: Postgres schema name for DBOS system tables. Defaults to "dbos".
- **system_database_engine**: A custom SQLAlchemy engine to use to connect to your system database. If provided, DBOS will not create an engine but use this instead.
- **use_listen_notify**: Whether to use PostgreSQL LISTEN/NOTIFY (`True`) or polling (`False`) to await notifications and events. Defaults to `True` in Postgres and must be False in SQLite.
- **conductor_key**: An API key for DBOS Conductor. If provided, application is connected to Conductor. API keys can be created from the DBOS console.
- **conductor_url**: The URL of the Conductor service to connect to. Only set if you are self-hosting Conductor.
- **enable_otlp**: Enable DBOS OpenTelemetry tracing and export. Defaults to False.
- **otlp_traces_endpoints**: DBOS operations automatically generate OpenTelemetry Traces. Use this field to declare a list of OTLP-compatible trace receivers. Requires `enable_otlp` to be True.
- **otlp_logs_endpoints**: the DBOS logger can export OTLP-formatted log signals. Use this field to declare a list of OTLP-compatible log receivers. Requires `enable_otlp` to be True.
- **otlp_attributes**: A set of attributes (key-value pairs) to apply to all OTLP-exported logs and traces.
- **log_level**: Configure the DBOS logger severity. Defaults to `INFO`.
- **run_admin_server**: Whether to run an HTTP admin server for workflow management operations. Defaults to True.
- **admin_port**: The port on which the admin server runs. Defaults to 3001.
- **serializer**: A custom serializer for the system database.

#### Custom Serialization

DBOS must serialize data such as workflow inputs and outputs and step outputs to store it in the system database.
By default, data is serialized with `pickle` then Base64-encoded, but you can optionally supply a custom serializer through DBOS configuration.
A custom serializer must match this interface:

```python
class Serializer(ABC):

    @abstractmethod
    def serialize(self, data: Any) -> str:
        pass

    @abstractmethod
    def deserialize(cls, serialized_data: str) -> Any:
        pass
```

For example, here is how to configure DBOS to use a JSON serializer:

```python
from dbos import DBOS, DBOSConfig, Serializer

class JsonSerializer(Serializer):
    def serialize(self, data: Any) -> str:
        return json.dumps(data)

    def deserialize(cls, serialized_data: str) -> Any:
        return json.loads(serialized_data)

serializer = JsonSerializer()
config: DBOSConfig = {
    "name": "dbos-starter",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "serializer": serializer
}
DBOS(config=config)
DBOS.launch()
```

### Transactions

Transactions are a special type of step that are optimized for database accesses.
They execute as a single database transaction.

ONLY use transactions if you are SPECIFICALLY requested to perform database operations, DO NOT USE THEM OTHERWISE.

If asked to add DBOS to code that already contains database operations, ALWAYS make it a step, do NOT attempt to make it a transaction unless requested.

ONLY use transactions with a Postgres database.
To access any other database, ALWAYS use steps.

To make a Python function a transaction, annotate it with the DBOS.transaction decorator.
Then, access the database using the DBOS.sql_session client, which is a SQLAlchemy client DBOS automatically connects to your database.
Here are some examples:


#### SQLAlchemy

```python
greetings = Table(
    "greetings", 
    MetaData(), 
    Column("name", String), 
    Column("note", String)
)

@DBOS.transaction()
def example_insert(name: str, note: str) -> None:
    # Insert a new greeting into the database
    DBOS.sql_session.execute(greetings.insert().values(name=name, note=note))

@DBOS.transaction()
def example_select(name: str) -> Optional[str]:
    # Select the first greeting to a particular name
    row = DBOS.sql_session.execute(
        select(greetings.c.note).where(greetings.c.name == name)
    ).first()
    return row[0] if row else None
```

#### Raw SQL

```python
@DBOS.transaction()
def example_insert(name: str, note: str) -> None:
    # Insert a new greeting into the database
    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")
    DBOS.sql_session.execute(sql, {"name": name, "note": note})


@DBOS.transaction()
def example_select(name: str) -> Optional[str]:
    # Select the first greeting to a particular name
    sql = text("SELECT note FROM greetings WHERE name = :name LIMIT 1")
    row = DBOS.sql_session.execute(sql, {"name": name}).first()
    return row[0] if row else None
```

NEVER async def a transaction.

````

</details>
