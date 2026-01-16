---
sidebar_position: 10
title: DBOS Client
---

`DBOSClient` provides a programmatic way to interact with your DBOS application from external code or from another DBOS application.
`DBOSClient` includes methods similar to [`DBOS`](./contexts.md) that can be used outside of a DBOS application, 
such as [`enqueue`](./queues.md#enqueue) or [`getEvent`](./contexts.md#get_event).

:::note 
`DBOSClient` is included in the `dbos` package, the same package that used by DBOS applications.
Where DBOS applications use the [`DBOS` methods](./contexts.md),
external applications use `DBOSClient` instead.
:::

### Constructor

```python
DBOSClient(
    *,
    system_database_url: Optional[str] = None,
    system_database_engine: Optional[sa.Engine] = None,
    dbos_system_schema: Optional[str] = "dbos",
    serializer: Serializer = DefaultSerializer(),
)
```
**Parameters:**
- `system_database_url`: A connection string to your DBOS system database, with the same format and defaults as in [DBOSConfig](./configuration.md).
- `system_database_engine`: A custom SQLAlchemy engine to use to connect to your system database. If provided, the client will not create an engine but use this instead.
- `dbos_system_schema`: Postgres schema name for DBOS system tables. Defaults to "dbos".
- `serializer`: A custom [serializer](./contexts.md#custom-serialization) for workflow inputs and outputs. Must match the serializer used by the DBOS application.

**Example syntax:**

This DBOS client connects to the system database specified in the `DBOS_SYSTEM_DATABASE_URL` environment variable.

```python
client = DBOSClient(system_database_url=os.environ["DBOS_SYSTEM_DATABASE_URL"])
```

### destroy

```python
client.destroy() -> None
```

Clean up database connections and release resources. Call this method when you are done using the client.

## Workflow Interaction Methods 

### enqueue

```python
class EnqueueOptions(TypedDict):
    workflow_name: str
    queue_name: str
    workflow_id: NotRequired[str]
    app_version: NotRequired[str]
    workflow_timeout: NotRequired[float]
    deduplication_id: NotRequired[str]
    priority: NotRequired[int]
    max_recovery_attempts: NotRequired[int]
    queue_partition_key: NotRequired[str]
    authenticated_user: NotRequired[str]
    authenticated_roles: NotRequired[list[str]]

client.enqueue(
    options: EnqueueOptions, 
    *args: Any, 
    **kwargs: Any
) -> WorkflowHandle[R]
```

Enqueue a workflow for processing and return a handle to it, similar to [Queue.enqueue](queues.md#enqueue).
Returns a [WorkflowHandle](./workflow_handles.md#workflowhandle).

When enqueuing a workflow from within a DBOS application, the workflow and queue metadata can be retrieved automatically.
However, since `DBOSClient` runs outside the DBOS application, the metadata must be specified explicitly.

Required metadata includes:

* `workflow_name`: The name of the workflow method being enqueued.
* `queue_name`: The name of the [Queue](./queues.md) to enqueue the workflow on.

Additional but optional metadata includes:

* `workflow_id`: The unique ID for the enqueued workflow. 
If left undefined, DBOS Client will generate a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier). 
Please see [Workflow IDs and Idempotency](../tutorials/workflow-tutorial#workflow-ids-and-idempotency) for more information.
* `app_version`: The version of your application that should process this workflow. 
If left undefined, it will be updated to the current version when the workflow is first dequeued.
- `workflow_timeout`: Set a timeout for the enqueued workflow. When the timeout expires, the workflow **and all its children** are cancelled. The timeout does not begin until the workflow is dequeued and starts execution.
- `deduplication_id`: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDeduplicatedError` exception.
- `priority`: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
- `max_recovery_attempts`: The maximum number of times the workflow will be retried on recovery before its status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED`. Defaults to 100.
- `queue_partition_key`: A partition key for [partitioned queues](./queues.md#partitioned-queues). Workflows with the same partition key are processed sequentially.
- `authenticated_user`: An authenticated user to associate with the workflow.
- `authenticated_roles`: Authenticated roles to associate with the workflow.

:::warning
At this time, DBOS Client cannot enqueue workflows that are methods on [Python classes](../tutorials/classes.md).
:::

**Example syntax:**

```python
options: EnqueueOptions = {
  "queue_name": "process_task",
  "workflow_name": "example_queue",
}
handle = client.enqueue(options, task)
result = handle.get_result()
```

### enqueue_async

```python
client.enqueue_async(
    options: EnqueueOptions, 
    *args: Any, 
    **kwargs: Any
) -> WorkflowHandleAsync[R]
```

Similar to [enqueue](#enqueue), but enqueues asynchronously and returns a 
[WorkflowHandleAsync](workflow_handles.md#workflowhandleasync).

**Example syntax:**

```python
options: EnqueueOptions = {
  "queue_name": "process_task",
  "workflow_name": "example_queue",
}
handle = await client.enqueue_async(options, task)
result = await handle.get_result()
```

### retrieve_workflow

```python
client.retrieve_workflow(
    workflow_id: str, 
) -> WorkflowHandle[R]
```

Retrieve the [handle](./workflow_handles.md#workflowhandle) of a workflow with identity `workflow_id`.
Similar to [`DBOS.retrieve_workflow`](contexts.md#retrieve_workflow).

**Parameters:**
- `workflow_id`: The identifier of the workflow whose handle to retrieve.

**Returns:**
- The [WorkflowHandle](./workflow_handles.md#workflowhandle) of the workflow whose ID is `workflow_id`.

### retrieve_workflow_async

```python
client.retrieve_workflow_async(
    workflow_id: str, 
) -> WorkflowHandleAsync[R]
```

Asynchronously retrieve the [handle](./workflow_handles.md#workflowhandleasync) of a workflow with identity `workflow_id`.
Similar to [`DBOS.retrieve_workflow`](contexts.md#retrieve_workflow).

**Parameters:**
- `workflow_id`: The identifier of the workflow whose handle to retrieve.

**Returns:**
- The [WorkflowHandleAsync](./workflow_handles.md#workflowhandleasync) of the workflow whose ID is `workflow_id`.

### send

```python
client.send(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> None
```

Sends a message to a specified workflow. Similar to [`DBOS.send`](contexts.md#send).

**Parameters:**
- `destination_id`: The workflow to which to send the message.
- `message`: The message to send. Must be serializable.
- `topic`: An optional topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- `idempotency_key`: An optional string used to ensure exactly-once delivery, even from outside of the DBOS application.

:::warning
Since DBOS Client is running outside of a DBOS application, 
it is highly recommended that you use the `idempotencyKey` parameter with both `send` and `send_async`
in order to get exactly-once behavior.
:::

### send_async

```python
client.send_async(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> None
```

Asynchronously sends a message to a specified workflow. Similar to [`DBOS.send_async`](contexts.md#send_async).

**Parameters:**
- `destination_id`: The workflow to which to send the message.
- `message`: The message to send. Must be serializable.
- `topic`: An optional topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- `idempotency_key`: An optional string used to ensure exactly-once delivery, even from outside of the DBOS application.

### get_event

```python
client.get_event(
    workflow_id: str, 
    key: str, 
    timeout_seconds: float = 60
) -> Any
```

Retrieve the latest value of an event published by the workflow identified by `workflow_id` to the key `key`.
If the event does not yet exist, wait for it to be published, returning `None` if the wait times out.
Similar to [`DBOS.get_event](contexts.md#get_event).

**Parameters:**
- `workflow_id`: The identifier of the workflow whose events to retrieve.
- `key`: The key of the event to retrieve.
- `timeout_seconds`: A timeout in seconds. If the wait times out, return `None`.

**Returns:**
- The value of the event published by `workflow_id` with name `key`, or `None` if the wait times out.

### get_event_async

```python
client.get_event_async(
    workflow_id: str, 
    key: str, 
    timeout_seconds: float = 60
) -> Any
```

Asynchronously retrieve the latest value of an event published by the workflow identified by `workflow_id` to the key `key`.
If the event does not yet exist, wait for it to be published, returning `None` if the wait times out.
Similar to [`DBOS.get_event_async](contexts.md#get_event_async).

**Parameters:**
- `workflow_id`: The identifier of the workflow whose events to retrieve.
- `key`: The key of the event to retrieve.
- `timeout_seconds`: A timeout in seconds. If the wait times out, return `None`.

**Returns:**
- The value of the event published by `workflow_id` with name `key`, or `None` if the wait times out.

### read_stream

```python
client.read_stream(
    workflow_id: str,
    key: str
) -> Generator[Any, Any, None]
```

Read values from a stream as a generator.
This function reads values from a stream identified by the workflow_id and key,
yielding each value in order until the stream is closed or the workflow terminates.
Similar to [`DBOS.read_stream`](contexts.md#read_stream).

**Parameters:**
- `workflow_id`: The workflow instance ID that owns the stream
- `key`: The stream key / name within the workflow

**Yields:**
- Each value in the stream until the stream is closed

**Example syntax:**
```python
for value in client.read_stream(workflow_id, "results"):
    print(f"Received: {value}")
```

### read_stream_async

```python
client.read_stream_async(
    workflow_id: str,
    key: str
) -> AsyncGenerator[Any, None]
```

Read values from a stream as an async generator.
This function reads values from a stream identified by the workflow_id and key,
yielding each value in order until the stream is closed or the workflow terminates.
Similar to [`DBOS.read_stream_async`](contexts.md#read_stream_async).

**Parameters:**
- `workflow_id`: The workflow instance ID that owns the stream
- `key`: The stream key / name within the workflow

**Yields:**
- Each value in the stream until the stream is closed

**Example syntax:**
```python
async for value in client.read_stream_async(workflow_id, "results"):
    print(f"Received: {value}")
```

## Workflow Management Methods

### list_workflows

```python
client.list_workflows(
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

Retrieve a list of [`WorkflowStatus`](./contexts#workflow-status) of all workflows matching specified criteria.
Similar to [`DBOS.list_workflows`](./contexts#list_workflows).

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
- **queues_only**: If `True`, only retrieve workflows that are currently queued (status `ENQUEUED` or `PENDING` and `queue_name` not null). Equivalent to using [`list_queued_workflows`](#list_queued_workflows).

### list_workflows_async

```python
client.list_workflows_async(
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

Asynchronous version of [`DBOSClient.list_workflows`](#list_workflows).

### list_queued_workflows

```python
client.list_queued_workflows(
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

Retrieve a list of [`WorkflowStatus`](./contexts#workflow-status) of all **queued** workflows (status `ENQUEUED` or `PENDING`) matching specified criteria.
Similar to [`DBOS.list_queued_workflows`](./contexts.md#list_queued_workflows).

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

### list_queued_workflows_async

```python
client.list_queued_workflows_async(
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

Asynchronous version of [`DBOSClient.list_queued_workflows`](#list_queued_workflows).

### list_workflow_steps

```python
client.list_workflow_steps(
    workflow_id: str,
) -> List[StepInfo]
```

Similar to [`DBOS.list_workflow_steps`](./contexts.md#list_workflow_steps).

### list_workflow_steps_async

```python
client.list_workflow_steps_async(
    workflow_id: str,
) -> List[StepInfo]
```

Asnychronous version of [`list_workflow_steps`](#list_workflow_steps).

### cancel_workflow

```python
client.cancel_workflow(
    workflow_id: str,
) -> None
```

Cancel a workflow.
This sets is status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step)
Similar to [`DBOS.cancel_workflow`](./contexts.md#cancel_workflow).

### cancel_workflow_async

```python
client.cancel_workflow_async(
    workflow_id: str,
) -> None
```

Asynchronous version of [`DBOSClient.cancel_workflow`](#cancel_workflow).


### resume_workflow

```python
client.resume_workflow(
    workflow_id: str
) -> WorkflowHandle[R]
```

Resume a workflow.
This immediately starts it from its last completed step.
You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.
Similar to [`DBOS.resume_workflow`](./contexts.md#resume_workflow).

### resume_workflow_async

```python
client.resume_workflow_async(
    workflow_id: str,
) -> WorkflowHandle[R]
```

Asynchronous version of [`DBOSClient.resume_workflow`](#resume_workflow).


### fork_workflow

```python
client.fork_workflow(
    workflow_id: str,
    start_step: int,
    *,
    application_version: Optional[str] = None,
) -> WorkflowHandle[R]
```

Similar to [`DBOS.fork_workflow`](./contexts.md#fork_workflow).

### fork_workflow_async

```python
client.fork_workflow_async(
    workflow_id: str,
    start_step: int,
    *,
    application_version: Optional[str] = None,
) -> WorkflowHandleAsync[R]
```

Asynchronous version of [`DBOSClient.fork_workflow`](#fork_workflow).


## Debouncing

Workflows can be [debounced](./contexts.md#debouncing) with the DBOSClient.

### DebouncerClient

```python
DebouncerClient(
    client: DBOSClient,
    workflow_options: EnqueueOptions,
    *,
    debounce_timeout_sec: Optional[float] = None,
    queue: Optional[queue] = None,
)
```

Similar to [`Debouncer.create`](./contexts.md#debouncercreate) but takes in a DBOSClient and `EnqueueOptions` instead of a workflow function.

### debounce

```python
debouncerClient.debounce(
    debounce_key: str,
    debounce_period_sec: float,
    *args: Any,
    **kwargs: Any,
) -> WorkflowHandle[R]
```

Similar to [`Debouncer.debounce`](./contexts.md#debounce).

**Example Syntax**:

```python
client: DBOSClient = ...
workflow_options: EnqueueOptions = {
    "workflow_name": "process_input",
    "queue_name": "process_input_queue",
}
debouncer = DebouncerClient(client, workflow_options)

# Each time a user submits a new input, debounce the process_input workflow.
# The workflow will wait until 60 seconds after the user stops submitting new inputs,
# then process the last input submitted.
def on_user_input_submit(user_id, user_input):
    debounce_key = user_id
    debounce_period_sec = 60
    debouncer.debounce(debounce_key, debounce_period_sec, user_input)
```

### debounce_async

```python
debouncerClient.debounce_async(
    debounce_key: str,
    debounce_period_sec: float,
    *args: Any,
    **kwargs: Any,
) -> WorkflowHandleAsync[R]:
```

Similar to [`Debouncer.debounce_async`](./contexts.md#debounce_async).