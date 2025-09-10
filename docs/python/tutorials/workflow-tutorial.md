---
sidebar_position: 10
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

## Debouncing Workflows

You can debounce workflows to delay their execution until some time has passed since the workflow has last been called.
This is useful for preventing wasted work when a workflow may be triggered multiple times in quick succession.
For example, if a user is editing an input field, you can debounce their changes to execute a processing workflow only after they haven't edited the field for some time:

```python
@DBOS.workflow()
def process_input(user_input):
    ...

# Each time a user submits a new input, debounce the process_input workflow.
# The workflow will wait until 60 seconds after the user stops submitting new inputs,
# then process the last input submitted.
def on_user_input_submit(user_id, user_input):
    debounce_period_sec = 60
    debouncer = Debouncer.create(process_input, debounce_key=user_id)
    debouncer.debounce(debounce_period_sec, user_input)
```

See the [debouncing reference](../reference/contexts.md#debouncing) for more details.


## Coroutine (Async) Workflows

Coroutinues (functions defined with `async def`, also known as async functions) can also be DBOS workflows.
Coroutine workflows may invoke [coroutine steps](./step-tutorial.md#coroutine-steps) via [await expressions](https://docs.python.org/3/reference/expressions.html#await).
You should start coroutine workflows using [`DBOS.start_workflow_async`](../reference/contexts.md#start_workflow_async) and enqueue them using [`enqueue_async`](../reference/queues.md#enqueue_async).
Calling a coroutine workflow or starting it with `DBOS.start_workflow_async` always runs it in the same event loop as its caller, but enqueueing it with `enqueue_async` starts the workflow in a different event loop.
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
