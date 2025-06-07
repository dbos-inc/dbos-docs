---
sidebar_position: 3
title: DBOS Methods & Variables
---

DBOS provides a number of useful context methods and variables.
All are accessed through the syntax `DBOS.<method>` and can only be used once a DBOS class object has been initialized.

## Context Methods

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
DBOS.set_event(
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

Start an asynchronous workflow in the background and return a [handle](./workflow_handles.md) to it.
The `DBOS.start_workflow_async` method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

**Example syntax:**

```python
@DBOS.workflow()
async def example_workflow(var1: str, var2: str):
    DBOS.logger.info("I am a workflow")

# Start example_workflow in the background
handle: WorkflowHandleAsync = await DBOS.start_workflow_async(example_workflow, "var1", "var2")
```

## Workflow Management Methods

### list_workflows
```python
def list_workflows(
    *,
    workflow_ids: Optional[List[str]] = None,
    status: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    name: Optional[str] = None,
    app_version: Optional[str] = None,
    user: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    sort_desc: bool = False,
    workflow_id_prefix: Optional[str] = None,
) -> List[WorkflowStatus]:
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all workflows matching specified criteria.

**Parameters:**
- **workflow_ids**: Retrieve workflows with these IDs.
- **workflow_id_prefix**: Retrieve workflows whose IDs start with the specified string.
- **status**: Retrieve workflows with this status (Must be `ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `RETRIES_EXCEEDED`)
- **start_time**: Retrieve workflows started after this (RFC 3339-compliant) timestamp.
- **end_time**: Retrieve workflows started before this (RFC 3339-compliant) timestamp.
- **name**: Retrieve workflows with this fully-qualified name.
- **app_version**: Retrieve workflows tagged with this application version.
- **user**: Retrieve workflows run by this authenticated user.
- **limit**: Retrieve up to this many workflows.
- **offset**: Skip this many workflows from the results returned (for pagination).
- **sort_desc**: Whether to sort the results in descending (`True`) or ascending (`False`) order by workflow start time.

### list_queued_workflows
```python
def list_queued_workflows(
    *,
    queue_name: Optional[str] = None,
    status: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    name: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    sort_desc: bool = False,
) -> List[WorkflowStatus]:
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all **currently enqueued** workflows matching specified criteria.

**Parameters:**
- **queue_name**: Retrieve workflows running on this queue.
- **status**: Retrieve workflows with this status (Must be `ENQUEUED` or `PENDING`)
- **start_time**: Retrieve workflows enqueued after this (RFC 3339-compliant) timestamp.
- **end_time**: Retrieve workflows enqueued before this (RFC 3339-compliant) timestamp.
- **name**: Retrieve workflows with this fully-qualified name.
- **limit**: Retrieve up to this many workflows.
- **offset**: Skip this many workflows from the results returned (for pagination).

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

The forked workflow will have a new workflow ID, which can be set with [`SetWorkflowID`](#setworkflowid).
It is possible to specify the application version on which the forked workflow will run by setting `application_version`, this is useful for "patching" workflows that failed due to a bug in a previous application version.

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```python
class WorkflowStatus:
    # The workflow ID
    workflow_id: str
    # The workflow status. Must be one of ENQUEUED, PENDING, SUCCESS, ERROR, CANCELLED, or RETRIES_EXCEEDED
    status: str
    # The name of the workflow function
    name: str
    # The number of times the workflow was scheduled to run
    recovery_attempts: int
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
    # The executor to most recently executed this workflow (DBOS__VMID if set else "local")
    executor_id: Optional[str]
    # The application version on which this workflow was started
    app_version: Optional[str]
    # The ID of the application (DBOS__APPID if set)
    app_id: Optional[str]
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

### SetEnqueueOptions

```python
SetEnqueueOptions(
    *,
    deduplication_id: Optional[str] = None,
    priority: Optional[int] = None,
)
```

Set options for enclosed workflow enqueue operations.
These options are **not propagated** to child workflows.

**Parameters:**

- `deduplication_id`: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDeduplicatedError` exception. Defaults to `None`.
- `priority`: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Defaults to `None`. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.


**Deduplication Example**

```python
with SetEnqueueOptions(deduplication_id="my_dedup_id"):
    try:
        handle = queue.enqueue(example_workflow, ...)
    except DBOSQueueDeduplicatedError as e:
        # Handle deduplication error
```

**Priority Example**

```python
with SetEnqueueOptions(priority=10):
    # All workflows are enqueued with priority set to 10
    # They will be dequeued in FIFO order
    for task in tasks:
        queue.enqueue(task_workflow, task)

with SetEnqueueOptions(priority=1):
    queue.enqueue(first_workflow)

# first_workflow (priority=1) will be dequeued before all task_workflows (priority=10)
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
