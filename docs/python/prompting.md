---
sidebar_position: 30
title: AI Model Prompting
---

You may want assistance from an AI model in building a DBOS application.
To make sure your model has the latest information on how to use DBOS, provide it with this prompt.

## How To Use

First, use the click-to-copy button in the top right of the code block to copy the full prompt to your clipboard.
Then, paste into your AI tool of choice (for example OpenAI's ChatGPT or Anthropic's Claude).
This adds the prompt to your AI model's context, giving it up-to-date instructions on how to build an application with DBOS.

If you are using an AI-powered IDE, you can add this prompt to your project's context.
For example:

- Cursor: Add the prompt to [your project rules](https://docs.cursor.com/context/rules-for-ai).
- Zed: Copy the prompt to a file in your project, then use the [`/file`](https://zed.dev/docs/assistant/commands?highlight=%2Ffile#file) command to add the file to your context.
- Windsurf: Copy the prmopt to a file in your project, then use [`@-Mention`](https://docs.windsurf.com/chat/overview) to add the file to your context.
- GitHub Copilot: Create a [`.github/copilot-instructions.md`](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) file in your repository and add the prompt to it.

## Prompt

````markdown
# Build Reliable Applications With DBOS

## Guidelines

- Respond in a friendly and concise manner
- Ask clarifying questions when requirements are ambiguous
- Generate code in Python using the DBOS library
- You MUST import all methods and classes used in the code you generate
- You SHALL keep all code in a single file unless otherwise specified.

## Workflow Guidelines

Workflows provide durable execution so you can write programs that are resilient to any failure.
Workflows are comprised of steps, which are ordinary Python functions annotated with @DBOS.step().
When using DBOS workflows, you should annotate any function that performs complex operations or accesses external APIs or services as a step. 
You can turn any Python function into a step by annotating it with the @DBOS.step decorator. The only requirement is that its inputs and outputs should be serializable.

- If asked to add DBOS to existing code, you MUST ask which function to make a workflow. Do NOT recommend any changes until they have told you what function to make a workflow. 
- When making a function a workflow, you should make all functions it calls steps. Do NOT change the functions in any way except by adding the @Step annotation.
- Do NOT make functions steps unless they are DIRECTLY called by a workflow.
- If the workflow function performs a non-deterministic action, you MUST move that action to its own function and make that function a step. Examples of non-deterministic actions include accessing an external API or service, accessing files on disk, generating a random number, of getting the current time.
- Do NOT use threads to start workflows or to start steps in workflows. You should instead use DBOS.start_workflow and DBOS queues.
- DBOS workflows and steps should NOT have side effects in memory outside of their own scope. They can access global variables, but they should NOT create or update global variables or variables outside their scope.
- Do NOT call any DBOS context method (DBOS.send, DBOS.recv, DBOS.start_workflow, DBOS.sleep) from a step.
- Do NOT start workflows from inside a step.
- Do NOT call DBOS.set_event and DBOS.recv from outside a workflow.

## DBOS Lifecycle Guidelines

Any DBOS program MUST configure the DBOS constructor at the top and MUST call DBOS.launch() in its main function.
DBOS must always be configured like so, unless otherwise specified:

```python
import os
from dbos import DBOS, DBOSConfig

config: DBOSConfig = {
    "name": "my-app",
    "database_url": os.environ.get("DBOS_DATABASE_URL"),
}
DBOS(config=config)
```

And DBOS.launch() should always be called in the main function like so:

```python
if __name__ == "__main__":
    DBOS.launch()
```

In a FastAPI application, the server should ALWAYS be started explicitly after a DBOS.launch in the main function:

```python
if __name__ == "__main__":
    DBOS.launch()
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Workflow and Steps Examples

Simple example:


```python
import os
from dbos import DBOS, DBOSConfig

config: DBOSConfig = {
    "name": "dbos-starter",
    "database_url": os.environ.get("DBOS_DATABASE_URL"),
}
DBOS(config=config)

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
    DBOS.launch()
    dbos_workflow()
```

Example with FastAPI:

```python
import os

from dbos import DBOS, DBOSConfig
from fastapi import FastAPI

app = FastAPI()
config: DBOSConfig = {
    "name": "dbos-starter",
    "database_url": os.environ.get("DBOS_DATABASE_URL"),
}
DBOS(config=config, fastapi=app)

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
config: DBOSConfig = {
    "name": "dbos-starter",
    "database_url": os.environ.get("DBOS_DATABASE_URL"),
}
DBOS(config=config, fastapi=app)

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
```

Example scheduled workflow:

- A scheduled workflow MUST specify a crontab schedule.
- It MUST take in two arguments, scheduled and actual time. Both are datetime.datetimes of when the workflow started.

```python
@DBOS.scheduled("* * * * *")
@DBOS.workflow()
def run_every_minute(scheduled_time, actual_time):
    print(f"I am a scheduled workflow. It is currently {scheduled_time}.")
```


## Workflow Documentation:

If an exception is thrown from a workflow, the workflow terminates**.
DBOS records the exception, sets the workflow status to `ERROR`, and does not recover the workflow.

Every time you execute a workflow, that execution is assigned a unique ID, by default a UUID.
You can access this ID through the `DBOS.workflow_id` context variable.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow with SetWorkflowID.
Workflow IDs must be globally unique for your application.
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

You can use DBOS.start_workflow to start a workflow in the background without waiting for it to complete.
This is useful for long-running or interactive workflows.

`start_workflow` returns a workflow handle, from which you can access information about the workflow or wait for it to complete and retrieve its result.
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

You can also use DBOS.retrieve_workflow to retrieve a workflow's handle from its ID.

## Workflow Events

Workflows can emit _events_, which are key-value pairs associated with the workflow's ID.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### set_event

Any workflow can call `DBOS.set_event` to publish a key-value pair, or update its value if has already been published.

```python
DBOS.set_event(
    key: str,
    value: Any,
) -> None
```
#### get_event

You can call `DBOS.get_event` to retrieve the value published by a particular workflow identity for a particular key.
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
For example, in one demo, the checkout workflow, after validating an order, needs to send the customer a unique payment ID.
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
For example, in one demo, the checkout workflow, after redirecting customers to a payments page, must wait for a notification that the user has paid.

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

### sleep

```python
DBOS.sleep(
    seconds: float
) -> None
```

Sleep for the given number of seconds.
May only be called from within a workflow.
This sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.

## Coroutine (Async) Workflows

- Coroutinues (functions defined with `async def`, also known as async functions) can also be DBOS workflows.
- If provided with async code, you MUST use coroutine workflows and steps
- Coroutine workflows may invoke and await on coroutine steps
- You MUST use start_workflow_async and enqueue_async to start or enqueue coroutine workflows.
-  You MUST use the async versions of the event and messaging context methods for coroutines (get_event_async, send_async, etc.). They have the same API but are async.


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

### DBOS Queues


Queues allow you to run functions with managed concurrency.
They are useful for controlling the number of functions run in parallel, or the rate at which functions are started.

To create a queue, specify its name:

```python
from dbos import Queue

queue = Queue("example_queue")
```

You can then enqueue any DBOS workflow, step, or transaction.
Enqueuing a function submits it for execution and returns a handle to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```python
queue = Queue("example_queue")

@DBOS.step()
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

@DBOS.step()
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

### Managing Concurrency

You can specify the _concurrency_ of a queue, the maximum number of functions from this queue that may run concurrently, at two scopes: global and per process.
Global concurrency limits are applied across all DBOS processes using this queue.
Per process concurrency limits are applied to each DBOS process using this queue.
If no limit is provided, any number of functions may run concurrently.
For example, this queue has a maximum global concurrency of 10 and a per process maximum concurrency of 5, so at most 10 functions submitted to it may run at once, up to 5 per process:

```python
from dbos import Queue

queue = Queue("example_queue", concurrency=10, worker_concurrency=5)
```

You may want to specify a maximum concurrency if functions in your queue submit work to an external process with limited resources.
The concurrency limit guarantees that even if many functions are submitted at once, they won't overwhelm the process.

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 50 with a period of 30 seconds, so it may not start more than 50 functions in 30 seconds:

```python
queue = Queue("example_queue", limiter={"limit": 50, "period": 30})
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

### In-Order Processing

You can use a queue with `concurrency=1` to guarantee sequential, in-order processing of events.
Only a single event will be processed at a time.
For example, this app processes events sequentially in the order of their arrival:

 ```python
from fastapi import FastAPI
from dbos import DBOS, Queue

app = FastAPI()
DBOS(fastapi=app)

queue = Queue("in_order_queue", concurrency=1)

@DBOS.step()
def process_event(event: str):
    ...

@app.post("/events/{event}")
def event_endpoint(event: str):
    queue.enqueue(process_event, event)
 ```

## Python Classes

 You can add DBOS workflow and step decorators to your Python class instance methods.
To add DBOS decorators to your methods, their class MUST inherit from `DBOSConfiguredInstance` and must be decorated with `@DBOS.dbos_class`.
For example:

```python
@DBOS.dbos_class()
class URLFetcher(DBOSConfiguredInstance):
    def __init__(self, url: str):
        self.url = url
        super().__init__(config_name=url)

    @DBOS.workflow()
    def fetch_workflow(self):
        return self.fetch_url()

    @DBOS.step()
    def fetch_url(self):
        return requests.get(self.url).text
    
example_fetcher = URLFetcher("https://example.com")
print(example_fetcher.fetch_workflow())
```

When you create a new instance of a DBOS-decorated class,  `DBOSConfiguredInstance` must be instantiated with a `config_name`.
This `config_name` should be a unique identifier of the instance.
Additionally, all DBOS-decorated classes must be instantiated before `DBOS.launch()` is called.


### Testing DBOS Functions

Unless otherwise specified, recommend testing DBOS applications with pytest.

**You must use this fixture to reset DBOS between tests**

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

````