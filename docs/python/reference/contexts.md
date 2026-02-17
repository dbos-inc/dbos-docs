---
sidebar_position: 3
title: DBOS Methods & Variables
---

DBOS provides a number of useful context methods and variables.
All are accessed through the syntax `DBOS.<method>` and can only be used once a DBOS class object has been initialized.

## Context Methods

### start_workflow

```python
DBOS.start_workflow(
    func: Workflow[P, R],
    *args: P.args,
    **kwargs: P.kwargs,
) -> WorkflowHandle[R]
```

Start a workflow in the background and return a [handle](./workflow_handles.md) to it.
The `DBOS.start_workflow` method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

**Example syntax:**

```python
@DBOS.workflow()
def example_workflow(var1: str, var2: str):
    DBOS.logger.info("I am a workflow")

# Start example_workflow in the background
handle: WorkflowHandle = DBOS.start_workflow(example_workflow, "var1", "var2")
```

### start_workflow_async

```python
DBOS.start_workflow_async(
    func: Workflow[P, Coroutine[Any, Any, R]],
    *args: P.args,
    **kwargs: P.kwargs,
) -> Coroutine[Any, Any, WorkflowHandleAsync[R]]
```

Start an asynchronous workflow and return a [handle](./workflow_handles.md) to it.
The `DBOS.start_workflow_async` method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted.
The workflow started with `DBOS.start_workflow_async` runs in the same event loop as its caller.

**Example syntax:**

```python
@DBOS.workflow()
async def example_workflow(var1: str, var2: str):
    DBOS.logger.info("I am a workflow")

# Start example_workflow
handle: WorkflowHandleAsync = await DBOS.start_workflow_async(example_workflow, "var1", "var2")
```

### send

```python
DBOS.send(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None
) -> None
```

Send a message to the workflow identified by `destination_id`.
Messages can optionally be associated with a topic.
The `send` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-async-workflows), [`send_async`](#send_async) should be used instead.

**Parameters:**
- `destination_id`: The workflow to which to send the message.
- `message`: The message to send. Must be serializable.
- `topic`: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.

### send_async

```python
DBOS.send_async(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None
) -> Coroutine[Any, Any, None]
```

Coroutine version of [`send`](#send)

### recv

```python
DBOS.recv(
    topic: Optional[str] = None,
    timeout_seconds: float = 60,
) -> Any
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning `None` if the wait times out.
If no topic is specified, `recv` can only access messages sent without a topic.
The `recv` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-async-workflows), [`recv_async`](#recv_async) should be used instead.

**Parameters:**
- `topic`: A topic queue on which to wait.
- `timeout_seconds`: A timeout in seconds. If the wait times out, return `None`.

**Returns:**
- The first message enqueued on the input topic, or `None` if the wait times out.

### recv_async

```python
DBOS.recv_async(
    topic: Optional[str] = None,
    timeout_seconds: float = 60,
) -> Coroutine[Any, Any, Any]
```

Coroutine version of [`recv`](#recv)

### set_event

```python
DBOS.set_event(
    key: str,
    value: Any,
) -> None
```

Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
Can only be called from within a workflow.
The `set_event` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-async-workflows), `set_event_async` should be used instead.

**Parameters:**
- `key`: The key of the event.
- `value`: The value of the event. Must be serializable.

### set_event_async

```python
DBOS.set_event_async(
    key: str,
    value: Any,
) -> Coroutine[Any, Any, None]
```

Coroutine version of [`set_event`](#set_event)

### get_event

```python
DBOS.get_event(
    workflow_id: str,
    key: str,
    timeout_seconds: float = 60,
) -> Any
```

Retrieve the latest value of an event published by the workflow identified by `workflow_id` to the key `key`.
If the event does not yet exist, wait for it to be published, returning `None` if the wait times out.
The `get_event` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-async-workflows), [`get_event_async`](#get_event_async) should be used instead.

**Parameters:**
- `workflow_id`: The identifier of the workflow whose events to retrieve.
- `key`: The key of the event to retrieve.
- `timeout_seconds`: A timeout in seconds. If the wait times out, return `None`.

**Returns:**
- The value of the event published by `workflow_id` with name `key`, or `None` if the wait times out.

### get_event_async

```python
DBOS.get_event_async(
    workflow_id: str,
    key: str,
    timeout_seconds: float = 60,
) -> Coroutine[Any, Any, Any]
```

Coroutine version of [`get_event`](#get_event)

### get_all_events

```python
DBOS.get_all_events(
    workflow_id: str
) -> Dict[str, Any]
```

Retrieve the latest values of all events published by `workflow_id`.
- `workflow_id`: The identifier of the workflow whose events to retrieve.

### get_all_events_async

```python
DBOS.get_all_events_async(
    workflow_id: str
) -> Dict[str, Any]
```

Coroutine version of [`get_all_events`](#get_all_events).


### sleep

```python
DBOS.sleep(
    seconds: float
) -> None
```

Sleep for the given number of seconds.
May only be called from within a workflow.
This sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.
The `sleep` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-async-workflows), [`sleep_async`](#sleep_async) should be used instead.

**Parameters:**
- `seconds`: The number of seconds to sleep.

### sleep_async

```python
DBOS.sleep_async(
    seconds: float
) -> Coroutine[Any, Any, None]
```

Coroutine version of [`sleep`](#sleep)

### run_step

```python
DBOS.run_step(
    dbos_step_options: Optional[StepOptions],
    func: Callable[P, R],
    *args: P.args,
    **kwargs: P.kwargs,
) -> R:
```

Runs the provided `func` function (or lambda) as a checkpointed DBOS [step](../tutorials/step-tutorial.md).  `args` and `kwargs` will be passed to `func`.

The `StepOptions` object has the following fields.  All fields are optional.

```python
class StepOptions(TypedDict, total=False):
    """
    Configuration options for steps.

    Attributes:
        name:
            Optional name for the step.
            If not provided, the function's name will be used.

        retries_allowed:
            Whether the step should be retried on failure.

        interval_seconds:
            Initial delay (in seconds) between retry attempts.

        max_attempts:
            Maximum number of attempts before the step is
            considered failed.

        backoff_rate:
            Multiplier applied to `interval_seconds` after
            each failed attempt (e.g. 2.0 = exponential backoff).
    """

    name: Optional[str]
    retries_allowed: bool
    interval_seconds: float
    max_attempts: int
    backoff_rate: float
```

### run_step_async

Version of [`run_step`](#run_step) to be called from `async` contexts.

### get_result

```python
DBOS.get_result(
    workflow_id: str,
) -> Optional[Any]
```

Wait for the workflow identified by `workflow_id` to complete, and return its result.  This is similar to calling [`get_result`](./workflow_handles.md#get_result) on a [WorkflowHandle](./workflow_handles.md), but is a single step that does not require a handle.

**Parameters:**
- `workflow_id`: The identifier of the workflow whose result to return.

**Returns:**
- The result of the workflow, or throws an exception if the workflow threw an exception.

### get_result_async

```python
DBOS.get_result_async(
    workflow_id: str,
) -> Coroutine[Any, Any, Optional[Any]]
```

Coroutine version of [`get_result`](#get_result).

### get_workflow_status

```python
DBOS.get_workflow_status(
    workflow_id: str,
) -> Optional[WorkflowStatus]
```

Retrieve the status of a workflow by its ID.
Returns `None` if no workflow with the given ID exists.

**Parameters:**
- `workflow_id`: The identifier of the workflow whose status to retrieve.

**Returns:**
- The [`WorkflowStatus`](#workflow-status) of the workflow, or `None` if not found.

### get_workflow_status_async

```python
DBOS.get_workflow_status_async(
    workflow_id: str,
) -> Coroutine[Any, Any, Optional[WorkflowStatus]]
```

Coroutine version of [`get_workflow_status`](#get_workflow_status).

### retrieve_workflow

```python
DBOS.retrieve_workflow(
    workflow_id: str,
    existing_workflow: bool = True,
) -> WorkflowHandle[R]
```

Retrieve the [handle](./workflow_handles.md) of a workflow with identity `workflow_id`.


**Parameters:**
- `workflow_id`: The identifier of the workflow whose handle to retrieve.
- `existing_workflow`: Whether to throw an exception if the workflow does not yet exist, or to wait for its creation. If set to `False` and the workflow does not exist, will wait for the workflow to be created, then return its handle.

**Returns:**
- The [handle](./workflow_handles.md) of the workflow whose ID is `workflow_id`.

### retrieve_workflow_async

```python
DBOS.retrieve_workflow(
    workflow_id: str,
    existing_workflow: bool = True,
) -> WorkflowHandleAsync[R]
```

Coroutine version of [`DBOS.retrieve_workflow`](#retrieve_workflow), retrieving an async workflow handle.

### write_stream

```python
DBOS.write_stream(
    key: str,
    value: Any
) -> None
```

Write a value to a stream.
Can only be called from within a workflow or its steps.
The `write_stream` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-async-workflows), [`write_stream_async`](#write_stream_async) should be used instead.

**Parameters:**
- `key`: The stream key / name within the workflow
- `value`: A serializable value to write to the stream

### write_stream_async

```python
DBOS.write_stream_async(
    key: str,
    value: Any
) -> Coroutine[Any, Any, None]
```

Coroutine version of [`write_stream`](#write_stream)

### close_stream

```python
DBOS.close_stream(
    key: str
) -> None
```

Close a stream identified by a key.
After this is called, no more values can be written to the stream.
Can only be called from within a workflow.
The `close_stream` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-async-workflows), [`close_stream_async`](#close_stream_async) should be used instead.

**Parameters:**
- `key`: The stream key / name within the workflow

### close_stream_async

```python
DBOS.close_stream_async(
    key: str
) -> Coroutine[Any, Any, None]
```

Coroutine version of [`close_stream`](#close_stream)

### read_stream

```python
DBOS.read_stream(
    workflow_id: str,
    key: str
) -> Generator[Any, Any, None]
```

Read values from a stream as a generator.

This function reads values from a stream identified by the workflow_id and key,
yielding each value in order until the stream is closed or the workflow terminates.

**Parameters:**
- `workflow_id`: The workflow instance ID that owns the stream
- `key`: The stream key / name within the workflow

**Yields:**
- Each value in the stream until the stream is closed

**Example syntax:**

```python
for value in DBOS.read_stream(workflow_id, example_key):
    print(f"Received: {value}")
```

### read_stream_async

```python
DBOS.read_stream_async(
    workflow_id: str,
    key: str
) -> AsyncGenerator[Any, None]
```

Read values from a stream as an async generator.

This function reads values from a stream identified by the workflow_id and key,
yielding each value in order until the stream is closed or the workflow terminates.

**Parameters:**
- `workflow_id`: The workflow instance ID that owns the stream
- `key`: The stream key / name within the workflow

**Example syntax:**

```python
async for value in DBOS.read_stream_async(workflow_id, example_key):
    print(f"Received: {value}")
```

**Yields:**
- Each value in the stream until the stream is closed

### patch

```python
DBOS.patch(
    patch_name: str
) -> bool
```

Insert a patch marker at the current point in workflow history, returning `True` if it was successfully inserted and `False` if there is already a checkpoint present at this point in history.
Used to safely upgrade workflow code, see the [patching tutorial](../tutorials/upgrading-workflows.md#patching) for more detail.

**Parameters:**
- `patch_name`: The name to give the patch marker that will be inserted into workflow history.

### patch_async

```python
DBOS.patch_async(
    patch_name: str
) -> Coroutine[Any, Any, bool]
```

Coroutine version of [`DBOS.patch()`](#patch).

### deprecate_patch

```python
DBOS.deprecate_patch(
    patch_name: str
) -> bool
```

Safely bypass a patch marker at the current point in workflow history if present.
Always returns `True`.
Used to safely deprecate patches, see the [patching tutorial](../tutorials/upgrading-workflows.md#patching) for more detail. 

**Parameters:**
- `patch_name`: The name of the patch marker to be bypassed.

### deprecate_patch_async

```python
DBOS.deprecate_patch_async(
    patch_name: str
) -> Coroutine[Any, Any, bool]
```
Coroutine version of [`DBOS.deprecate_patch()`](#deprecate_patch)


## Workflow Management Methods

### list_workflows
```python
def list_workflows(
    *,
    workflow_ids: Optional[List[str]] = None,
    status: Optional[Union[str, List[str]]] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    name: Optional[Union[str, List[str]]] = None,
    app_version: Optional[Union[str, List[str]]] = None,
    forked_from: Optional[Union[str, List[str]]] = None,
    parent_workflow_id: Optional[Union[str, List[str]]] = None,
    user: Optional[Union[str, List[str]]] = None,
    queue_name: Optional[Union[str, List[str]]] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    sort_desc: bool = False,
    workflow_id_prefix: Optional[Union[str, List[str]]] = None,
    load_input: bool = True,
    load_output: bool = True,
    executor_id: Optional[Union[str, List[str]]] = None,
    queues_only: bool = False,
) -> List[WorkflowStatus]:
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all workflows matching specified criteria.

**Parameters:**
- **workflow_ids**: Retrieve workflows with these IDs.
- **status**: Retrieve workflows with this status (or one of these statuses) (Must be `ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`)
- **start_time**: Retrieve workflows started after this (RFC 3339-compliant) timestamp.
- **end_time**: Retrieve workflows started before this (RFC 3339-compliant) timestamp.
- **name**: Retrieve workflows with this fully-qualified name (or one of these names).
- **app_version**: Retrieve workflows tagged with this application version (or one of these versions).
- **forked_from**: Retrieve workflows forked from this workflow ID (or one of these IDs).
- **parent_workflow_id**: Retrieve workflows that were started as children of this workflow (or one of these workflows).
- **user**: Retrieve workflows run by this authenticated user (or one of these users).
- **queue_name**: Retrieve workflows that were enqueued on this queue (or one of these queues).
- **limit**: Retrieve up to this many workflows.
- **offset**: Skip this many workflows from the results returned (for pagination).
- **sort_desc**: Whether to sort the results in descending (`True`) or ascending (`False`) order by workflow start time.
- **workflow_id_prefix**: Retrieve workflows whose IDs start with the specified string (or one of these strings).
- **load_input**: Whether to load and deserialize workflow inputs. Set to `False` to improve performance when inputs are not needed.
- **load_output**: Whether to load and deserialize workflow outputs. Set to `False` to improve performance when outputs are not needed.
- **executor_id**: Retrieve workflows with this executor ID (or one of these IDs).
- **queues_only**: If `True`, only retrieve workflows that are currently queued (status `ENQUEUED` or `PENDING` and `queue_name` not null). Equivalent to using [`list_queued_workflows`](#list_queued_workflows).

### list_workflows_async

Coroutine version of [`list_workflows`](#list_workflows).

### list_queued_workflows
```python
def list_queued_workflows(
    *,
    workflow_ids: Optional[List[str]] = None,
    status: Optional[Union[str, List[str]]] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    name: Optional[Union[str, List[str]]] = None,
    app_version: Optional[Union[str, List[str]]] = None,
    forked_from: Optional[Union[str, List[str]]] = None,
    parent_workflow_id: Optional[Union[str, List[str]]] = None,
    user: Optional[Union[str, List[str]]] = None,
    queue_name: Optional[Union[str, List[str]]] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    sort_desc: bool = False,
    workflow_id_prefix: Optional[Union[str, List[str]]] = None,
    load_input: bool = True,
    load_output: bool = True,
    executor_id: Optional[Union[str, List[str]]] = None,
) -> List[WorkflowStatus]:
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all **queued** workflows (status `ENQUEUED` or `PENDING` and `queue_name` not null) matching specified criteria.

**Parameters:**
- **workflow_ids**: Retrieve workflows with these IDs.
- **status**: Retrieve workflows with this status (or one of these statuses) (Must be `ENQUEUED` or `PENDING`)
- **start_time**: Retrieve workflows enqueued after this (RFC 3339-compliant) timestamp.
- **end_time**: Retrieve workflows enqueued before this (RFC 3339-compliant) timestamp.
- **name**: Retrieve workflows with this fully-qualified name (or one of these names).
- **app_version**: Retrieve workflows tagged with this application version (or one of these versions).
- **forked_from**: Retrieve workflows forked from this workflow ID (or one of these IDs).
- **parent_workflow_id**: Retrieve workflows that were started as children of this workflow (or one of these workflows).
- **user**: Retrieve workflows run by this authenticated user (or one of these users).
- **queue_name**: Retrieve workflows running on this queue (or one of these queues).
- **limit**: Retrieve up to this many workflows.
- **offset**: Skip this many workflows from the results returned (for pagination).
- **sort_desc**: Whether to sort the results in descending (`True`) or ascending (`False`) order by workflow start time.
- **workflow_id_prefix**: Retrieve workflows whose IDs start with the specified string (or one of these strings).
- **load_input**: Whether to load and deserialize workflow inputs. Set to `False` to improve performance when inputs are not needed.
- **load_output**: Whether to load and deserialize workflow outputs. Set to `False` to improve performance when outputs are not needed.
- **executor_id**: Retrieve workflows with this executor ID (or one of these IDs).

### list_queued_workflows_async

Coroutine version of [`list_queued_workflows`](#list_queued_workflows).

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

### list_workflow_steps_async

Coroutine version of [`list_workflow_steps`](#list_workflow_steps).

### cancel_workflow

```python
DBOS.cancel_workflow(
    workflow_id: str,
) -> None
```

Cancel a workflow.
This sets is status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step)

### cancel_workflow_async

Coroutine version of [`cancel_workflow`](#cancel_workflow).

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

### resume_workflow_async

Coroutine version of [`resume_workflow`](#resume_workflow).

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

The forked workflow will have a new workflow ID, which can be set with [`SetWorkflowID`](#setworkflowid).
It is possible to specify the application version on which the forked workflow will run by setting `application_version`, this is useful for "patching" workflows that failed due to a bug in a previous application version.

### fork_workflow_async

Coroutine version of [`fork_workflow`](#fork_workflow).

### delete_workflow

```python
DBOS.delete_workflow(
    workflow_id: str,
    *,
    delete_children: bool = False,
) -> None
```

Delete a workflow and all its associated data (inputs, outputs, step results, etc.) from the system database.

**Parameters:**
- **workflow_id**: The ID of the workflow to delete.
- **delete_children**: If `True`, also recursively deletes all child workflows started by this workflow.

:::warning
This operation is irreversible. Once a workflow is deleted, it cannot be recovered, resumed, or forked.
:::

### delete_workflow_async

```python
DBOS.delete_workflow_async(
    workflow_id: str,
    *,
    delete_children: bool = False,
) -> Coroutine[Any, Any, None]
```

Coroutine version of [`delete_workflow`](#delete_workflow).

## Workflow Schedules

### create_schedule

```python
DBOS.create_schedule(
    *,
    schedule_name: str,
    workflow_fn: Callable[[datetime, Any], None],
    schedule: str,
    context: Any = None,
) -> None
```

Create a cron schedule that periodically invokes a workflow function.

**Parameters:**
- **schedule_name**: Unique name identifying this schedule.
- **workflow_fn**: The workflow function to invoke. Must take two arguments: a `datetime` (the scheduled execution time) and a context object.
- **schedule**: A cron expression. Supports seconds as the first field with 6-field format.
- **context**: An optional context object passed to the workflow function on each invocation. Must be serializable.

DBOS uses [croniter](https://pypi.org/project/croniter/) to parse cron schedules, using seconds as an optional first field ([`second_at_beginning=True`](https://pypi.org/project/croniter/#about-second-repeats)).
Valid cron schedules contain 5 or 6 items, separated by spaces:

```
 ┌────────────── second (optional)
 │ ┌──────────── minute
 │ │ ┌────────── hour
 │ │ │ ┌──────── day of month
 │ │ │ │ ┌────── month
 │ │ │ │ │ ┌──── day of week
 │ │ │ │ │ │
 │ │ │ │ │ │
 * * * * * *
```

**Example:**

```python
from datetime import datetime
from dbos import DBOS

@DBOS.workflow()
def my_periodic_task(scheduled_time: datetime, context: Any):
    DBOS.logger.info(f"Running task scheduled for {scheduled_time} with context {context}")

# Create a schedule that runs every 5 minutes
DBOS.create_schedule(
    schedule_name="my-task-schedule", # The schedule name is a unique identifier of the schedule
    workflow_fn=my_periodic_task,
    schedule="*/5 * * * *",  # Every 5 minutes
    context="my context", # The context is passed into every iteration of the workflow
)
```

### create_schedule_async

Coroutine version of [`create_schedule`](#create_schedule).

### list_schedules

```python
DBOS.list_schedules(
    *,
    status: Optional[Union[str, List[str]]] = None,
    workflow_name: Optional[Union[str, List[str]]] = None,
    schedule_name_prefix: Optional[Union[str, List[str]]] = None,
) -> List[WorkflowSchedule]
```

Return all registered workflow schedules, optionally filtered. Returns a list of [`WorkflowSchedule`](#workflowschedule).

**Parameters:**
- **status**: Filter by status (e.g. `"ACTIVE"`) or a list of statuses.
- **workflow_name**: Filter by workflow name or a list of names.
- **schedule_name_prefix**: Filter by schedule name prefix or a list of prefixes.

### list_schedules_async

Coroutine version of [`list_schedules`](#list_schedules).

### get_schedule

```python
DBOS.get_schedule(name: str) -> Optional[WorkflowSchedule]
```

Return the [`WorkflowSchedule`](#workflowschedule) with the given name, or `None` if it does not exist.

### get_schedule_async

Coroutine version of [`get_schedule`](#get_schedule).

### delete_schedule

```python
DBOS.delete_schedule(name: str) -> None
```

Delete the schedule with the given name. No-op if it does not exist.

### delete_schedule_async

Coroutine version of [`delete_schedule`](#delete_schedule).

### pause_schedule

```python
DBOS.pause_schedule(name: str) -> None
```

Pause the schedule with the given name. A paused schedule does not fire.

### resume_schedule

```python
DBOS.resume_schedule(name: str) -> None
```

Resume a paused schedule so it begins firing again.

### apply_schedules

```python
DBOS.apply_schedules(
    schedules: List[ScheduleInput],
) -> None

class ScheduleInput(TypedDict):
    schedule_name: str
    workflow_fn: Callable[[datetime, Any], None]
    schedule: str
    context: Any
```

Atomically apply a set of schedules.
Useful for declaratively defining all your static schedules in one place.
May not be called from within a workflow.

**Example:**

```python
DBOS.apply_schedules([
    {"schedule_name": "schedule-a", "workflow_fn": workflow_a, "schedule": "*/10 * * * *"},  # Every 10 minutes
    {"schedule_name": "schedule-b", "workflow_fn": workflow_b, "schedule": "0 0 * * *"},     # Every day at midnight
])
```

### backfill_schedule

```python
DBOS.backfill_schedule(
    schedule_name: str,
    start: datetime,
    end: datetime,
) -> List[WorkflowHandle[None]]
```

Enqueue all executions of a schedule that would have run between `start` and `end`.
Each execution uses the same deterministic workflow ID as the live scheduler, so already-executed times are skipped.
May not be called from within a workflow.

### trigger_schedule

```python
DBOS.trigger_schedule(schedule_name: str) -> WorkflowHandle[None]
```

Immediately enqueue the scheduled workflow at the current time.
May not be called from within a workflow.

### WorkflowSchedule

Some schedule management methods return the `WorkflowSchedule` type:

```python
class WorkflowSchedule(TypedDict):
    schedule_id: str
    schedule_name: str
    workflow_name: str
    schedule: str
    status: str  # "ACTIVE" or "PAUSED"
    context: Any
```

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
    # If this workflow was started as a child of another workflow, that workflow's ID.
    parent_workflow_id: Optional[str]
    # The Unix epoch timestamp at which the workflow was last dequeued, if it had been enqueued
    dequeued_at: Optional[int]
```

## Context Variables

### logger

```python
DBOS.logger: Logger
```

Retrieve the DBOS logger. This is a pre-configured Python logger provided as a convenience.

### sql_session

```python
DBOS.sql_session: sqlalchemy.Session
```

May only be accessed from within a transaction.
Retrieves the SQLAlchemy session of the transaction, a database connection the transaction can use to interact with the database.

:::tip
DBOS automatically wraps your transaction functions in a SQLAlchemy ["begin once" block](https://docs.sqlalchemy.org/en/20/core/connections.html#connect-and-begin-once-from-the-engine). Transaction functions automatically commit when they successfully complete and roll back if they throw an exception. Therefore, do not use `DBOS.sql_session.commit()` or `DBOS.sql_session.rollback()` in your transaction functions. Otherwise, you might see a `sqlalchemy.exc.InvalidRequestError: Can't operate on closed transaction inside
context manager` error.
:::

### workflow_id

```python
DBOS.workflow_id: str
```

May only be accessed from within a workflow, step, or transaction.
Return the identity of the current workflow.

### step_id

```python
DBOS.step_id: int
```

Returns the unique ID of the current step within a workflow.

### step_status

```python
DBOS.step_status: StepStatus
```

Return the status of the currently executing step.
This object has the following properties:

```python
class StepStatus:
    # The unique ID of this step in its workflow.
    step_id: int
    # For steps with automatic retries, which attempt number (zero-indexed) is currently executing.
    current_attempt: Optional[int]
    # For steps with automatic retries, the maximum number of attempts that will be made before the step fails.
    max_attempts: Optional[int]
```

### span

```python
DBOS.span: opentelemetry.trace.Span
```

Retrieve the OpenTelemetry span associated with the curent request.
You can use this to set custom attributes in your span.

### application_version

```python
DBOS.application_version: str
```

Retrieve the current application version, as documented [here](../tutorials/upgrading-workflows.md#versioning).

### executor_id

```python
DBOS.executor_id: str
```

Retrieve the current executor ID, a unique process ID used to identify the application instance in distributed environments.

## Debouncing

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
# The debouncer will wait until 60 seconds after the user stops submitting new inputs,
# then start the workflow processing the last input submitted.
debouncer = Debouncer.create(process_input)
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

## Authentication

### authenticated_user

```python
DBOS.authenticated_user: Optional[str]
```

Return the current authenticated user, if any, associated with the current context.

### authenticated_roles

```python
DBOS.authenticated_roles: Optional[List[str]]
```

Return the roles granted to the current authenticated user, if any, associated with the current context.

### assumed_role

```python
DBOS.assumed_role: Optional[str]
```

Return the role currently assumed by the authenticated user, if any, associated with the current context.

### set_authentication

```python
DBOS.set_authentication(
  authenticated_user: Optional[str],
  authenticated_roles: Optional[List[str]]
) -> None
```

Set the current authenticated user and granted roles into the current context.  This would generally be done by HTTP middleware 

## Context Management

### SetWorkflowID

```python
SetWorkflowID(
    wfid: str
)
```

Set the [workflow ID](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) of the next workflow to run.
Should be used in a `with` statement.

Example syntax:

```python
@DBOS.workflow()
def example_workflow():
    DBOS.logger.info(f"I am a workflow with ID {DBOS.workflow_id}")

# The workflow will run with the supplied ID
with SetWorkflowID("very-unique-id"):
    example_workflow()
```

### SetWorkflowTimeout

```python
SetWorkflowTimeout(
    workflow_timeout_sec: Optional[float]
)
```

Set a timeout for all enclosed workflow invocations or enqueues.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Timeout deadlines are propagated to child workflows by default, so when a workflow's deadline expires all of its child workflows (and their children, and so on) are also cancelled.
If you want to detach a child workflow from its parent's timeout, you can start it with `SetWorkflowTimeout(custom_timeout)` to override the propagated timeout.
You can use `SetWorkflowTimeout(None)` to start a child workflow with no timeout.

Example syntax:

```python
@DBOS.workflow()
def example_workflow():
    ...

# If the workflow does not complete within 10 seconds, it times out and is cancelled
with SetWorkflowTimeout(10):
    example_workflow()
```

### DBOSContextEnsure

```python
DBOSContextEnsure()

  # Code inside will run with a DBOS context available
  with DBOSContextEnsure():
    # Call DBOS functions
    pass
```

Use of `DBOSContextEnsure` ensures that there is a DBOS context associated with the enclosed code prior to calling DBOS functions.  `DBOSContextEnsure` is generally not used by applications directly, but used by event dispatchers, HTTP server middleware, etc., to set up the DBOS context prior to entry into function calls.

### DBOSContextSetAuth

```python
DBOSContextSetAuth(user: Optional[str], roles: Optional[List[str]])

  # Code inside will run with `curuser` and `curroles`
  with DBOSContextSetAuth(curuser, curroles):
    # Call DBOS functions
    pass
```

`with DBOSContextSetAuth` sets the current authorized user and roles for the code inside the `with` block.  Similar to `DBOSContextEnsure`, `DBOSContextSetAuth` also ensures that there is a DBOS context associated with the enclosed code prior to calling DBOS functions.

`DBOSContextSetAuth` is generally not used by applications directly, but used by event dispatchers, HTTP server middleware, etc., to set up the DBOS context prior to entry into function calls.

## Alerting

### alert_handler

```python
@DBOS.alert_handler
def my_handler(rule_type: str, message: str, metadata: Dict[str, str]) -> None:
    ...
```

Register a function to handle [alerts](../../production/alerting.md) received from Conductor.
The handler function is called with three arguments:

- **rule_type**: The type of alert rule. One of `WorkflowFailure`, `SlowQueue`, or `UnresponsiveApplication`.
- **message**: The alert message.
- **metadata**: A dictionary of string key-value pairs with additional alert information.

Only one alert handler may be registered per application, and it must be defined before `DBOS.launch()` is called.
If no handler is registered, alerts are logged to the DBOS logger.

**Example syntax:**

```python
@DBOS.alert_handler
def handle_alert(rule_type: str, message: str, metadata: dict[str, str]) -> None:
    DBOS.logger.warning(f"Alert received: {rule_type} - {message}")
    for key, value in metadata.items():
        DBOS.logger.warning(f"  {key}: {value}")
```

## Custom Serialization

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