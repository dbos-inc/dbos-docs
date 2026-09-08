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
    system_database_pool_size: Optional[int] = None,
    system_database_polling_concurrency: Optional[int] = None,
    use_listen_notify: bool = False,
    lazy: bool = False,
    retry_connection_errors: bool = True,
    application_name: Optional[str] = None,
)
```
**Parameters:**
- `system_database_url`: A connection string to your DBOS system database, with the same format and defaults as in [DBOSConfig](./configuration.md).
- `system_database_engine`: A custom SQLAlchemy engine to use to connect to your system database. If provided, the client will not create an engine but use this instead.
- `dbos_system_schema`: Postgres schema name for DBOS system tables. Defaults to "dbos".
- `serializer`: A custom [serializer](./contexts.md#custom-serialization) for workflow inputs and outputs. Must match the serializer used by the DBOS application.
- `system_database_pool_size`: The maximum size of the client's system database connection pool. Defaults to 5.
- `system_database_polling_concurrency`: The maximum number of concurrent database-backed polling reads from wait operations. See [`sys_db_polling_concurrency`](./configuration.md#database-connection-settings) in the configuration reference. Defaults to half the pool size (minimum 1).
- `use_listen_notify`: Whether the client runs a background listener thread that uses PostgreSQL LISTEN, so wait operations such as [`get_event`](#get_event) and [`read_stream`](#read_stream) are woken by notifications instead of polling the database. Defaults to `False`. Only enable this if your DBOS application's system database is Postgres and was created with [`use_listen_notify`](./configuration.md#database-connection-settings) enabled (the Postgres default).
- `lazy`: Whether to defer connecting to the system database until the client is first used. Defaults to `False`, meaning the connection is checked on construction and the constructor raises if the system database is unreachable. If `True`, the constructor does not connect; use [`check_connection`](#check_connection) to check the connection explicitly. Cannot be combined with `use_listen_notify`, whose listener thread connects immediately (raises `DBOSException` if both are set).
- `retry_connection_errors`: Whether a client operation that loses its database connection blocks and retries until the connection recovers. Defaults to `True`. Set to `False` to raise connection errors instead, so an unreachable database surfaces as an error rather than a wait.
- `application_name`: The application on whose behalf this client acts. Workflows the client enqueues and queues and schedules it registers are owned by that application, and the client's listing operations default to that application's rows. Always set this if multiple applications share a system database.

**Example syntax:**

This DBOS client connects to the system database specified in the `DBOS_SYSTEM_DATABASE_URL` environment variable.

```python
client = DBOSClient(system_database_url=os.environ["DBOS_SYSTEM_DATABASE_URL"])
```

### check_connection

```python
client.check_connection() -> None
```

Verify that the client can reach the system database, raising an exception if it cannot.
Useful for checking the connection of a client constructed with [`lazy=True`](#constructor), or for verifying at any time that the connection is still healthy.

### check_connection_async

```python
await client.check_connection_async() -> None
```

Asynchronous version of [`check_connection`](#check_connection).

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
    duplication_policy: NotRequired[DuplicationPolicy]
    priority: NotRequired[int]
    delay_seconds: NotRequired[float]
    max_recovery_attempts: NotRequired[int]
    queue_partition_key: NotRequired[str]
    authenticated_user: NotRequired[str]
    authenticated_roles: NotRequired[list[str]]
    serialization_type: NotRequired[WorkflowSerializationFormat]
    attributes: NotRequired[Dict[str, Any]]
    otel_context: NotRequired[opentelemetry.context.Context]
    application_name: NotRequired[str]

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
- `duplication_policy`: How to handle a collision with another workflow that has the same `deduplication_id` on the same queue. Defaults to `"reject"`.
  - `"reject"`: raise `DBOSQueueDeduplicatedError`.
  - `"return-existing"`: return a handle to the existing workflow instead of raising. Requires `deduplication_id`. Arguments passed by the colliding caller are discarded and the returned handle resolves with the original workflow's result. See [Singleton Workflows](../tutorials/queue-tutorial.md#singleton-workflows).
- `priority`: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
- `delay_seconds`: Delay the workflow by this many seconds before it becomes eligible for execution. The workflow is initially placed in `DELAYED` status and transitions to `ENQUEUED` after the delay expires.
- `max_recovery_attempts`: The maximum number of times the workflow will be retried on recovery before its status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED`. Defaults to 100.
- `queue_partition_key`: The queue partition in which to enqueue this workflow. Use if and only if the queue is [partitioned](../tutorials/queue-tutorial.md#partitioning-queues) (registered with at least one `partition_*` limit). A partitioned queue applies its `partition_*` limits to each partition separately, while its `global_concurrency`, `worker_concurrency`, and `limiter` still apply across all partitions.
- `authenticated_user`: An authenticated user to associate with the workflow.
- `authenticated_roles`: Authenticated roles to associate with the workflow.
- `serialization_type`: The [serialization strategy](./contexts.md#serialization-strategy) for the workflow arguments.
- `attributes`: A dictionary of custom, JSON-serializable key-value [attributes](./contexts.md#setworkflowattributes) to attach to the workflow. Recorded in the workflow's [status](./contexts.md#workflow-status) and searchable via the `attributes` filter on [`list_workflows`](#list_workflows).
- `otel_context`: An OpenTelemetry context to propagate to the enqueued workflow, so that when the workflow runs, its span joins that context's trace. The client-side equivalent of [`PropagateOtelContext`](./contexts.md#propagateotelcontext). Only the W3C trace context (`traceparent`/`tracestate`) is propagated, not baggage. See [the tracing tutorial](../tutorials/logging-and-tracing.md#keeping-enqueued-workflows-on-the-callers-trace) for details.
- `application_name`: The application that owns and runs the enqueued workflow. Defaults to the client's own [`application_name`](#constructor). Always set `application_name` either here or in the client constructor if multiple applications share a system database.

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

### enqueue_in_transaction

```python
client.enqueue_in_transaction(
    conn_or_session: Union[sqlalchemy.Connection, sqlalchemy.orm.Session],
    options: EnqueueOptions,
    *args: Any,
    **kwargs: Any
) -> WorkflowHandle[R]
```

Similar to [enqueue](#enqueue), but performs the enqueue write inside a caller-owned SQLAlchemy transaction instead of in its own transaction.
This lets you enqueue a workflow **atomically** with your own database writes: either both are committed or both are rolled back.
Pass either a SQLAlchemy [`Connection`](https://docs.sqlalchemy.org/en/20/core/connections.html) or an ORM [`Session`](https://docs.sqlalchemy.org/en/20/orm/session_basics.html) as `conn_or_session`.
The remaining parameters are the same as [enqueue](#enqueue).

You own the transaction: `enqueue_in_transaction` does not begin, commit, or roll back the transaction, and does not retry on database errors.
You must commit (or roll back) the transaction yourself.
The returned [WorkflowHandle](./workflow_handles.md#workflowhandle) is created immediately, but the workflow is not enqueued until you commit, so do not call `get_result` on the handle until after the transaction commits.

:::warning
`conn_or_session` must target the DBOS system database.
The enqueue cannot atomically span a separate application database.
:::

**Example syntax:**

```python
import sqlalchemy as sa

engine = sa.create_engine(os.environ["DBOS_SYSTEM_DATABASE_URL"])

options: EnqueueOptions = {
  "queue_name": "process_task",
  "workflow_name": "example_queue",
}

with engine.connect() as conn:
    with conn.begin():
        # Perform your own writes on conn here, in the same transaction...
        handle = client.enqueue_in_transaction(conn, options, task)
# Once the transaction commits, the workflow is enqueued.
result = handle.get_result()
```

There is no asynchronous variant of this method.
From an async context, bridge to it using [`AsyncConnection.run_sync`](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html), which hands your callable the underlying synchronous `Connection` bound to the same transaction:

```python
async with async_engine.connect() as conn:
    async with conn.begin():
        handle = await conn.run_sync(
            lambda sync_conn: client.enqueue_in_transaction(sync_conn, options, task)
        )
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

### wait_first

```python
client.wait_first(
    handles: List[WorkflowHandle[Any]],
    *,
    polling_interval_sec: float = 1.0,
) -> WorkflowHandle[Any]
```

Wait for any one of the given workflow handles to complete and return the first completed handle.
Similar to [`DBOS.wait_first`](contexts.md#wait_first).

**Parameters:**
- **handles**: A non-empty list of workflow handles to wait on. Raises `ValueError` if the list is empty.
- **polling_interval_sec**: The interval (in seconds) at which DBOS polls the database. Defaults to `1.0`.

### wait_first_async

```python
client.wait_first_async(
    handles: List[WorkflowHandleAsync[Any]],
    *,
    polling_interval_sec: float = 1.0,
) -> WorkflowHandleAsync[Any]
```

Asynchronous version of [`wait_first`](#wait_first).

### send

```python
client.send(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    *,
    serialization_type: Optional[WorkflowSerializationFormat] = WorkflowSerializationFormat.DEFAULT,
    send_to_forks: bool = False,
) -> None
```

Sends a message to a specified workflow. Similar to [`DBOS.send`](contexts.md#send).

**Parameters:**
- `destination_id`: The workflow to which to send the message.
- `message`: The message to send. Must be serializable.
- `topic`: An optional topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- `idempotency_key`: An optional string used to ensure exactly-once delivery, even from outside of the DBOS application. The key is scoped per destination workflow.
- `serialization_type`: The [serialization strategy](./contexts.md#serialization-strategy) for the message.
- `send_to_forks`: If `True`, also deliver the message to every workflow recursively forked from `destination_id`. Defaults to `False`.

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
    *,
    serialization_type: Optional[WorkflowSerializationFormat] = WorkflowSerializationFormat.DEFAULT,
    send_to_forks: bool = False,
) -> None
```

Asynchronously sends a message to a specified workflow. Similar to [`DBOS.send_async`](contexts.md#send_async).

**Parameters:**
- `destination_id`: The workflow to which to send the message.
- `message`: The message to send. Must be serializable.
- `topic`: An optional topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- `idempotency_key`: An optional string used to ensure exactly-once delivery, even from outside of the DBOS application. The key is scoped per destination workflow.
- `serialization_type`: The [serialization strategy](./contexts.md#serialization-strategy) for the message.
- `send_to_forks`: If `True`, also deliver the message to every workflow recursively forked from `destination_id`. Defaults to `False`.

### send_in_transaction

```python
client.send_in_transaction(
    conn_or_session: Union[sqlalchemy.Connection, sqlalchemy.orm.Session],
    destination_id: str,
    message: Any,
    topic: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    *,
    serialization_type: Optional[WorkflowSerializationFormat] = WorkflowSerializationFormat.DEFAULT,
    send_to_forks: bool = False,
) -> None
```

Similar to [send](#send), but performs the send inside a caller-owned SQLAlchemy transaction instead of in its own transaction.
This lets you send a message **atomically** with your own database writes: either both are committed or both are rolled back.
Pass either a SQLAlchemy [`Connection`](https://docs.sqlalchemy.org/en/20/core/connections.html) or an ORM [`Session`](https://docs.sqlalchemy.org/en/20/orm/session_basics.html) as `conn_or_session`.
The remaining parameters are the same as [send](#send).

You own the transaction: `send_in_transaction` does not begin, commit, or roll back the transaction, and does not retry on database errors.
You must commit (or roll back) the transaction yourself.
The message is not visible to the destination workflow until the transaction commits.

:::warning
`conn_or_session` must target the DBOS system database.
The send cannot atomically span a separate application database.
:::

**Example syntax:**

```python
import sqlalchemy as sa

engine = sa.create_engine(os.environ["DBOS_SYSTEM_DATABASE_URL"])

with engine.connect() as conn:
    with conn.begin():
        # Perform your own writes on conn here, in the same transaction...
        client.send_in_transaction(conn, destination_id, message, idempotency_key="my-key")
# Once the transaction commits, the message is sent.
```

There is no asynchronous variant of this method.
From an async context, bridge to it using [`AsyncConnection.run_sync`](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html), which hands your callable the underlying synchronous `Connection` bound to the same transaction:

```python
async with async_engine.connect() as conn:
    async with conn.begin():
        await conn.run_sync(
            lambda sync_conn: client.send_in_transaction(sync_conn, destination_id, message)
        )
```

### send_bulk

```python
client.send_bulk(
    messages: List[SendMessage],
    *,
    serialization_type: Optional[WorkflowSerializationFormat] = WorkflowSerializationFormat.DEFAULT,
    send_to_forks: bool = False,
) -> None
```

Sends many messages to workflow executions in a single transaction. Similar to [`DBOS.send_bulk`](contexts.md#send_bulk).
Each message is described by a `SendMessage` object specifying its destination, payload, and optional topic and idempotency key:

```python
@dataclass
class SendMessage:
    # The workflow to which to send the message
    destination_id: str
    # The message to send. Must be serializable.
    message: Any
    # A topic with which to associate the message. Messages are enqueued per-topic on the receiver.
    topic: Optional[str] = None
    # If set, the message is sent only once per destination no matter how many times it is submitted with this key.
    idempotency_key: Optional[str] = None
```

The send is atomic: if any message cannot be delivered, the entire batch is rolled back and no messages are sent.

**Parameters:**
- `messages`: The list of `SendMessage` objects to send. Two messages in the same call may not share an idempotency key.
- `serialization_type`: The [serialization strategy](./contexts.md#serialization-strategy) for the messages.
- `send_to_forks`: If `True`, every message is also delivered to all workflows recursively forked from its destination. Defaults to `False`.

:::warning
Since DBOS Client is running outside of a DBOS application,
it is highly recommended that you set an idempotency key on each message
in order to get exactly-once behavior.
:::

### send_bulk_async

```python
client.send_bulk_async(
    messages: List[SendMessage],
    *,
    serialization_type: Optional[WorkflowSerializationFormat] = WorkflowSerializationFormat.DEFAULT,
    send_to_forks: bool = False,
) -> None
```

Asynchronously sends many messages to workflow executions in a single transaction. Similar to [`DBOS.send_bulk_async`](contexts.md#send_bulk_async).
See [`send_bulk`](#send_bulk) for the `SendMessage` definition.

**Parameters:**
- `messages`: The list of `SendMessage` objects to send. Two messages in the same call may not share an idempotency key.
- `serialization_type`: The [serialization strategy](./contexts.md#serialization-strategy) for the messages.
- `send_to_forks`: If `True`, every message is also delivered to all workflows recursively forked from its destination. Defaults to `False`.

### send_bulk_in_transaction

```python
client.send_bulk_in_transaction(
    conn_or_session: Union[sqlalchemy.Connection, sqlalchemy.orm.Session],
    messages: List[SendMessage],
    *,
    serialization_type: Optional[WorkflowSerializationFormat] = WorkflowSerializationFormat.DEFAULT,
    send_to_forks: bool = False,
) -> None
```

Similar to [send_bulk](#send_bulk), but performs the sends inside a caller-owned SQLAlchemy transaction instead of in its own transaction.
This lets you send messages **atomically** with your own database writes: either both are committed or both are rolled back.
Pass either a SQLAlchemy [`Connection`](https://docs.sqlalchemy.org/en/20/core/connections.html) or an ORM [`Session`](https://docs.sqlalchemy.org/en/20/orm/session_basics.html) as `conn_or_session`.
See [`send_bulk`](#send_bulk) for the `SendMessage` definition.

You own the transaction: `send_bulk_in_transaction` does not begin, commit, or roll back the transaction, and does not retry on database errors.
You must commit (or roll back) the transaction yourself.
The messages are not visible to their destination workflows until the transaction commits.

:::warning
`conn_or_session` must target the DBOS system database.
The send cannot atomically span a separate application database.
:::

There is no asynchronous variant of this method.
From an async context, bridge to it using [`AsyncConnection.run_sync`](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) as shown for [`send_in_transaction`](#send_in_transaction).

**Parameters:**
- `messages`: The list of `SendMessage` objects to send. Two messages in the same call may not share an idempotency key.
- `serialization_type`: The [serialization strategy](./contexts.md#serialization-strategy) for the messages.
- `send_to_forks`: If `True`, every message is also delivered to all workflows recursively forked from its destination. Defaults to `False`.

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
    key: str,
    *,
    offset: int = 0,
    polling_interval_sec: Optional[float] = None,
    timeout_seconds: Optional[float] = None,
) -> Generator[Any, Any, None]
```

Read values from a stream as a generator.
This function reads values from a stream identified by the workflow_id and key,
yielding each value in order until the stream is closed or the workflow terminates.
Similar to [`DBOS.read_stream`](contexts.md#read_stream), except that client reads are never checkpointed.

**Parameters:**
- `workflow_id`: The workflow instance ID that owns the stream
- `key`: The stream key / name within the workflow
- `offset`: The offset to start reading from. Defaults to `0`, the start of the stream. A higher offset skips that many values from the beginning of the stream.
- `polling_interval_sec`: Polling interval in seconds when waiting for new values when not using LISTEN/NOTIFY. Must be at least `0.001`. Defaults to the configured `notification_listener_polling_interval_sec` (`1.0` if not configured).
- `timeout_seconds`: How long to wait for **each** value before raising `DBOSStreamTimeoutError`. The clock restarts every time a value is delivered, so this bounds the gap between values, not the total duration of the read. Defaults to `None`, waiting indefinitely.

**Yields:**
- Each value in the stream until the stream is closed

**Raises:**
- `DBOSStreamTimeoutError`: If `timeout_seconds` passes without a value arriving.

**Example syntax:**
```python
for value in client.read_stream(workflow_id, "results"):
    print(f"Received: {value}")
```

### read_stream_async

```python
client.read_stream_async(
    workflow_id: str,
    key: str,
    *,
    offset: int = 0,
    polling_interval_sec: Optional[float] = None,
    timeout_seconds: Optional[float] = None,
) -> AsyncGenerator[Any, None]
```

Coroutine version of [`read_stream`](#read_stream), returning an async generator.

**Example syntax:**
```python
async for value in client.read_stream_async(workflow_id, "results"):
    print(f"Received: {value}")
```

### read_stream_offset

```python
client.read_stream_offset(
    workflow_id: str,
    key: str,
    offset: int,
    *,
    polling_interval_sec: Optional[float] = None,
    timeout_seconds: Optional[float] = None,
) -> Any
```

Read the single value at one offset of a stream, waiting for it to be written.
Similar to [`DBOS.read_stream_offset`](contexts.md#read_stream_offset).

**Parameters:**
- `workflow_id`: The workflow instance ID that owns the stream
- `key`: The stream key / name within the workflow
- `offset`: The offset to read
- `polling_interval_sec`: Polling interval in seconds when waiting for the value when not using LISTEN/NOTIFY. Must be at least `0.001`. Defaults to the configured `notification_listener_polling_interval_sec` (`1.0` if not configured).
- `timeout_seconds`: How long to wait for the value before raising `DBOSStreamTimeoutError`. Defaults to `None`, waiting indefinitely.

**Returns:**
- The value at the offset

**Raises:**
- `DBOSStreamTimeoutError`: If `timeout_seconds` passes, or if the stream ends before reaching `offset` (no value will ever arrive at that offset).

**Example syntax:**
```python
value = client.read_stream_offset(workflow_id, "results", 5, timeout_seconds=30)
```

### read_stream_offset_async

```python
client.read_stream_offset_async(
    workflow_id: str,
    key: str,
    offset: int,
    *,
    polling_interval_sec: Optional[float] = None,
    timeout_seconds: Optional[float] = None,
) -> Coroutine[Any, Any, Any]
```

Coroutine version of [`read_stream_offset`](#read_stream_offset).

### set_workflow_delay

```python
client.set_workflow_delay(
    workflow_id: str,
    *,
    delay_seconds: Optional[float] = None,
    delay_until_epoch_ms: Optional[int] = None,
) -> None
```

Set or update the delay on a workflow.
Only affects workflows with `DELAYED` status.
Provide exactly one of `delay_seconds` (relative) or `delay_until_epoch_ms` (absolute).
Similar to [`DBOS.set_workflow_delay`](./contexts.md#set_workflow_delay).

**Parameters:**
- `workflow_id`: The ID of the workflow whose delay to set.
- `delay_seconds`: Delay the workflow by this many seconds from now. Must be non-negative.
- `delay_until_epoch_ms`: Delay the workflow until this absolute time, specified as a Unix epoch timestamp in milliseconds. Must be non-negative.

### set_workflow_delay_async

```python
client.set_workflow_delay_async(
    workflow_id: str,
    *,
    delay_seconds: Optional[float] = None,
    delay_until_epoch_ms: Optional[int] = None,
) -> None
```

Asynchronous version of [`set_workflow_delay`](#set_workflow_delay).

## Queue Management Methods

### register_queue

```python
client.register_queue(
    name: str,
    *,
    # Applied to the queue as a whole
    global_concurrency: Optional[int] = None,
    worker_concurrency: Optional[int] = None,
    limiter: Optional[QueueRateLimit] = None,
    # Applied to each partition separately
    partition_concurrency: Optional[int] = None,
    partition_worker_concurrency: Optional[int] = None,
    partition_limiter: Optional[QueueRateLimit] = None,
    polling_interval_sec: float = 1.0,
    on_conflict: QueueConflictResolution = "always_update",
    application_name: Optional[str] = None,
) -> Queue
```

Register a [queue](./queues.md) and persist its configuration to the system database, returning the [`Queue`](./queues.md#class-dbosqueue).
Similar to [`DBOS.register_queue`](./contexts.md#register_queue).
Parameters have the same meaning as on `DBOS.register_queue` except for `on_conflict` and `application_name`:

- `on_conflict`:
  - `"always_update"` (default): always overwrite the existing configuration.
  - `"never_update"`: leave any existing configuration unchanged.
  - `"update_if_latest_version"` is **not** supported on the client because clients are not associated with an application version. Passing it raises `DBOSException`.
- `application_name`: The application that owns this queue and dequeues workflows from it. Defaults to the client's own [`application_name`](#constructor). Registering a queue already owned by a different application raises an error.

**Example syntax:**

```python
client = DBOSClient(system_database_url=os.environ["DBOS_SYSTEM_DATABASE_URL"])
client.register_queue("email", global_concurrency=10, limiter={"limit": 100, "period": 60})
client.enqueue({"queue_name": "email", "workflow_name": "send_email"}, "alice@example.com")
```

### register_queue_async

```python
client.register_queue_async(
    name: str,
    *,
    global_concurrency: Optional[int] = None,
    worker_concurrency: Optional[int] = None,
    limiter: Optional[QueueRateLimit] = None,
    partition_concurrency: Optional[int] = None,
    partition_worker_concurrency: Optional[int] = None,
    partition_limiter: Optional[QueueRateLimit] = None,
    polling_interval_sec: float = 1.0,
    on_conflict: QueueConflictResolution = "always_update",
    application_name: Optional[str] = None,
) -> Coroutine[Any, Any, Queue]
```

Asynchronous version of [`register_queue`](#register_queue).

### retrieve_queue

```python
client.retrieve_queue(name: str) -> Optional[Queue]
```

Retrieve a queue by name from the system database, or `None` if no queue with that name has been registered.
Similar to [`DBOS.retrieve_queue`](./contexts.md#retrieve_queue).

### retrieve_queue_async

```python
client.retrieve_queue_async(name: str) -> Coroutine[Any, Any, Optional[Queue]]
```

Asynchronous version of [`retrieve_queue`](#retrieve_queue).

### list_queues

```python
client.list_queues(
    *,
    application_name: Optional[Union[str, List[str]]] = None,
) -> List[Queue]
```

List all database-backed queues registered in the system database.
Returns an empty list if no queues have been registered.
Similar to [`DBOS.list_queues`](./contexts.md#list_queues), including the `application_name` filter.
If the filter is unset, it defaults to the client's own [`application_name`](#constructor); a client with no application name lists every application's queues.

### list_queues_async

```python
client.list_queues_async(
    *,
    application_name: Optional[Union[str, List[str]]] = None,
) -> Coroutine[Any, Any, List[Queue]]
```

Asynchronous version of [`list_queues`](#list_queues).

### delete_queue

```python
client.delete_queue(name: str) -> None
```

Delete a queue from the system database. No-op if no queue with that name exists.
Similar to [`DBOS.delete_queue`](./contexts.md#delete_queue).

:::warning
Workflows already enqueued on a deleted queue can no longer be dequeued, executed, or recovered.
However, if a queue with the same name is later registered, it will dequeue the leftover workflows.
Do not rely on this: stale workflows unexpectedly resuming on a future queue is rarely the intended behavior.
Instead, cancel or drain pending workflows on the queue before deleting it.
:::

### delete_queue_async

```python
client.delete_queue_async(name: str) -> Coroutine[Any, Any, None]
```

Asynchronous version of [`delete_queue`](#delete_queue).


## Workflow Management Methods

### list_workflows

```python
client.list_workflows(
    *,
    workflow_ids: Optional[List[str]] = None,
    status: Optional[Union[str, List[str]]] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    completed_after: Optional[str] = None,
    completed_before: Optional[str] = None,
    dequeued_after: Optional[str] = None,
    dequeued_before: Optional[str] = None,
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
    has_parent: Optional[bool] = None,
    attributes: Optional[Dict[str, Any]] = None,
    schedule_name: Optional[Union[str, List[str]]] = None,
    application_name: Optional[Union[str, List[str]]] = None,
) -> List[WorkflowStatus]:
```

Retrieve a list of [`WorkflowStatus`](./contexts#workflow-status) of all workflows matching specified criteria.
Similar to [`DBOS.list_workflows`](./contexts#list_workflows).

**Parameters:**
- **workflow_ids**: Retrieve workflows with these IDs.
- **status**: Retrieve workflows with this status (or one of these statuses) (Must be `ENQUEUED`, `DELAYED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`)
- **start_time**: Retrieve workflows started after this (RFC 3339-compliant) timestamp.
- **end_time**: Retrieve workflows started before this (RFC 3339-compliant) timestamp.
- **completed_after**: Retrieve workflows that completed after this (RFC 3339-compliant) timestamp.
- **completed_before**: Retrieve workflows that completed before this (RFC 3339-compliant) timestamp.
- **dequeued_after**: Retrieve workflows that were dequeued after this (RFC 3339-compliant) timestamp.
- **dequeued_before**: Retrieve workflows that were dequeued before this (RFC 3339-compliant) timestamp.
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
- **was_forked_from**: If `True`, only retrieve workflows that have been forked from. If `False`, only retrieve workflows that have not been forked from.
- **has_parent**: If `True`, only retrieve workflows that have a parent workflow. If `False`, only retrieve workflows without a parent.
- **attributes**: Retrieve workflows whose [custom attributes](./contexts.md#setworkflowattributes) contain all the given key-value pairs (nested values are matched exactly). Only supported when using a Postgres system database; raises `DBOSException` on SQLite.
- **schedule_name**: Retrieve workflows that were enqueued by this [scheduled workflow](../tutorials/scheduled-workflows.md) (or one of these schedule names).
- **application_name**: Retrieve workflows owned by this application (or one of these applications). Workflows owned by no application are always included. If unset, defaults to the client's own [`application_name`](#constructor); a client with no application name retrieves every application's workflows.

### list_workflows_async

```python
client.list_workflows_async(
    *,
    workflow_ids: Optional[List[str]] = None,
    status: Optional[Union[str, List[str]]] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    completed_after: Optional[str] = None,
    completed_before: Optional[str] = None,
    dequeued_after: Optional[str] = None,
    dequeued_before: Optional[str] = None,
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
    has_parent: Optional[bool] = None,
    attributes: Optional[Dict[str, Any]] = None,
    schedule_name: Optional[Union[str, List[str]]] = None,
    application_name: Optional[Union[str, List[str]]] = None,
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
    completed_after: Optional[str] = None,
    completed_before: Optional[str] = None,
    dequeued_after: Optional[str] = None,
    dequeued_before: Optional[str] = None,
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
    has_parent: Optional[bool] = None,
    attributes: Optional[Dict[str, Any]] = None,
    application_name: Optional[Union[str, List[str]]] = None,
) -> List[WorkflowStatus]:
```

Retrieve a list of [`WorkflowStatus`](./contexts#workflow-status) of all **queued** workflows (status `ENQUEUED` or `PENDING`) matching specified criteria.
Similar to [`DBOS.list_queued_workflows`](./contexts.md#list_queued_workflows).

**Parameters:**
- **workflow_ids**: Retrieve workflows with these IDs.
- **status**: Retrieve workflows with this status (or one of these statuses) (Must be `ENQUEUED` or `PENDING`)
- **start_time**: Retrieve workflows enqueued after this (RFC 3339-compliant) timestamp.
- **end_time**: Retrieve workflows enqueued before this (RFC 3339-compliant) timestamp.
- **completed_after**: Retrieve workflows that completed after this (RFC 3339-compliant) timestamp.
- **completed_before**: Retrieve workflows that completed before this (RFC 3339-compliant) timestamp.
- **dequeued_after**: Retrieve workflows that were dequeued after this (RFC 3339-compliant) timestamp.
- **dequeued_before**: Retrieve workflows that were dequeued before this (RFC 3339-compliant) timestamp.
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
- **has_parent**: If `True`, only retrieve workflows that have a parent workflow. If `False`, only retrieve workflows without a parent.
- **attributes**: Retrieve workflows whose [custom attributes](./contexts.md#setworkflowattributes) contain all the given key-value pairs (nested values are matched exactly). Only supported when using a Postgres system database; raises `DBOSException` on SQLite.
- **application_name**: Retrieve workflows owned by this application (or one of these applications). Workflows owned by no application are always included. If unset, defaults to the client's own [`application_name`](#constructor); a client with no application name retrieves every application's workflows.

### list_queued_workflows_async

```python
client.list_queued_workflows_async(
    *,
    workflow_ids: Optional[List[str]] = None,
    status: Optional[Union[str, List[str]]] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    completed_after: Optional[str] = None,
    completed_before: Optional[str] = None,
    dequeued_after: Optional[str] = None,
    dequeued_before: Optional[str] = None,
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
    has_parent: Optional[bool] = None,
    attributes: Optional[Dict[str, Any]] = None,
    application_name: Optional[Union[str, List[str]]] = None,
) -> List[WorkflowStatus]:
```

Asynchronous version of [`DBOSClient.list_queued_workflows`](#list_queued_workflows).

### list_workflow_steps

```python
client.list_workflow_steps(
    workflow_id: str,
    *,
    load_output: bool = True,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> List[StepInfo]
```

Similar to [`DBOS.list_workflow_steps`](./contexts.md#list_workflow_steps).

**Parameters:**
- **workflow_id**: The ID of the workflow whose steps to list.
- **load_output**: Whether to load and deserialize step outputs and errors. Set to `False` to improve performance when they are not needed.
- **limit**: The maximum number of steps to return.
- **offset**: The number of steps to skip, for pagination.

### list_workflow_steps_async

```python
client.list_workflow_steps_async(
    workflow_id: str,
    *,
    load_output: bool = True,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> List[StepInfo]
```

Asynchronous version of [`list_workflow_steps`](#list_workflow_steps).

### cancel_workflow

```python
client.cancel_workflow(
    workflow_id: str,
    *,
    cancel_children: bool = False,
) -> None
```

Cancel a workflow.
This sets is status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step)
Similar to [`DBOS.cancel_workflow`](./contexts.md#cancel_workflow).

**Parameters:**
- **workflow_id**: The ID of the workflow to cancel.
- **cancel_children**: If `True`, also recursively cancels all child workflows started by this workflow.

### cancel_workflow_async

```python
client.cancel_workflow_async(
    workflow_id: str,
    *,
    cancel_children: bool = False,
) -> None
```

Asynchronous version of [`DBOSClient.cancel_workflow`](#cancel_workflow).

### cancel_workflows

```python
client.cancel_workflows(
    workflow_ids: List[str],
    *,
    cancel_children: bool = False,
) -> None
```

Cancel multiple workflows. Behaves like [`cancel_workflow`](#cancel_workflow) but operates on a list of workflow IDs.
Similar to [`DBOS.cancel_workflows`](./contexts.md#cancel_workflows).

### cancel_workflows_async

Asynchronous version of [`DBOSClient.cancel_workflows`](#cancel_workflows).

### update_workflow_attributes

```python
client.update_workflow_attributes(
    workflow_id: str,
    attributes: Optional[Dict[str, Any]],
) -> None
```

Replace the custom [attributes](./contexts.md#setworkflowattributes) attached to a workflow, identified by `workflow_id`.
This overwrites the workflow's attributes dictionary; it is not a merge. Pass `None` to clear all attributes.
Attributes must be a dictionary of JSON-serializable values.
Similar to [`DBOS.update_workflow_attributes`](./contexts.md#update_workflow_attributes).

**Parameters:**
- `workflow_id`: The ID of the workflow whose attributes to replace.
- `attributes`: The new attributes dictionary, or `None` to clear all attributes.

### update_workflow_attributes_async

Asynchronous version of [`DBOSClient.update_workflow_attributes`](#update_workflow_attributes).

### resume_workflow

```python
client.resume_workflow(
    workflow_id: str,
    *,
    queue_name: Optional[str] = None,
) -> WorkflowHandle[R]
```

Resume a workflow.
This immediately starts it from its last completed step.
You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.
If `queue_name` is provided, the resumed workflow is enqueued on the specified queue instead of starting immediately.
Similar to [`DBOS.resume_workflow`](./contexts.md#resume_workflow).

### resume_workflow_async

```python
client.resume_workflow_async(
    workflow_id: str,
    *,
    queue_name: Optional[str] = None,
) -> WorkflowHandle[R]
```

Asynchronous version of [`DBOSClient.resume_workflow`](#resume_workflow).

### resume_workflows

```python
client.resume_workflows(
    workflow_ids: List[str],
    *,
    queue_name: Optional[str] = None,
) -> List[WorkflowHandle[Any]]
```

Resume multiple workflows. Behaves like [`resume_workflow`](#resume_workflow) but operates on a list of workflow IDs and returns a list of handles.
Similar to [`DBOS.resume_workflows`](./contexts.md#resume_workflows).

### resume_workflows_async

Asynchronous version of [`DBOSClient.resume_workflows`](#resume_workflows). Returns `List[WorkflowHandleAsync[Any]]`.

### fork_workflow

```python
client.fork_workflow(
    workflow_id: str,
    start_step: int,
    *,
    application_version: Optional[str] = None,
    queue_name: Optional[str] = None,
    queue_partition_key: Optional[str] = None,
    replacement_children: Optional[dict[str, str]] = None,
    timeout_seconds: Optional[float] = None,
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
    queue_name: Optional[str] = None,
    queue_partition_key: Optional[str] = None,
    replacement_children: Optional[dict[str, str]] = None,
    timeout_seconds: Optional[float] = None,
) -> WorkflowHandleAsync[R]
```

Asynchronous version of [`DBOSClient.fork_workflow`](#fork_workflow).

### delete_workflow

```python
client.delete_workflow(
    workflow_id: str,
    *,
    delete_children: bool = False,
) -> None
```

Delete a workflow and all its associated data from the system database.
Similar to [`DBOS.delete_workflow`](./contexts.md#delete_workflow).

**Parameters:**
- **workflow_id**: The ID of the workflow to delete.
- **delete_children**: If `True`, also recursively deletes all child workflows started by this workflow.

:::warning
This operation is irreversible. Once a workflow is deleted, it cannot be recovered, resumed, or forked.
:::

### delete_workflow_async

Asynchronous version of [`DBOSClient.delete_workflow`](#delete_workflow).

### delete_workflows

```python
client.delete_workflows(
    workflow_ids: List[str],
    *,
    delete_children: bool = False,
) -> None
```

Delete multiple workflows and all their associated data. Behaves like [`delete_workflow`](#delete_workflow) but operates on a list of workflow IDs.
Similar to [`DBOS.delete_workflows`](./contexts.md#delete_workflows).

### delete_workflows_async

Asynchronous version of [`DBOSClient.delete_workflows`](#delete_workflows).

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
    application_name: Optional[str] = None,
)
```

Similar to [`Debouncer.create`](./contexts.md#debouncercreate) but takes in a DBOSClient and `EnqueueOptions` instead of a workflow function.
`application_name` debounces on behalf of that application; it defaults to the `application_name` in `workflow_options`, then to the client's own.

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

## Workflow Schedules

`DBOSClient` provides methods to manage [workflow schedules](./contexts.md#workflow-schedules) from outside a DBOS application.
Unlike the `DBOS` class methods which accept workflow functions directly, client schedule methods accept workflow names as strings.

### create_schedule

```python
client.create_schedule(
    *,
    schedule_name: str,
    workflow_name: str,
    schedule: str,
    context: Any = None,
    workflow_class_name: Optional[str] = None,
    automatic_backfill: bool = False,
    cron_timezone: Optional[str] = None,
    queue_name: Optional[str] = None,
    application_name: Optional[str] = None,
) -> None
```

Create a cron schedule that periodically invokes a workflow.
Similar to [`DBOS.create_schedule`](./contexts.md#create_schedule), but takes a `workflow_name` string instead of a workflow function.

**Parameters:**
- **schedule_name**: Unique name identifying this schedule.
- **workflow_name**: Fully-qualified name of the workflow function to invoke.
- **schedule**: A cron expression. Supports seconds as the first field with 6-field format.
- **context**: An optional context object passed to the workflow function on each invocation. Must be serializable.
- **workflow_class_name**: The class name if the workflow is a static method on a [DBOS class](../tutorials/classes.md).
- **automatic_backfill**: If `True`, on startup the scheduler will automatically backfill missed executions since the last time the schedule fired. Defaults to `False`.
- **cron_timezone**: [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (e.g. `"America/New_York"`) in which to evaluate the cron expression. Defaults to `None` (UTC).
- **queue_name**: Optional name of a declared queue to enqueue scheduled workflows to. If `None`, uses an internal queue. Defaults to `None`.
- **application_name**: The application that owns this schedule and runs its workflows. Defaults to the client's own [`application_name`](#constructor). Always set `application_name` either here or in the client constructor if multiple applications share a system database.

### create_schedule_async

Coroutine version of [`create_schedule`](#create_schedule).

### list_schedules

```python
client.list_schedules(
    *,
    status: Optional[Union[str, List[str]]] = None,
    workflow_name: Optional[Union[str, List[str]]] = None,
    schedule_name_prefix: Optional[Union[str, List[str]]] = None,
    application_name: Optional[Union[str, List[str]]] = None,
) -> List[WorkflowSchedule]
```

Return all registered workflow schedules, optionally filtered. Returns a list of [`WorkflowSchedule`](./contexts.md#workflowschedule).
Similar to [`DBOS.list_schedules`](./contexts.md#list_schedules).

**Parameters:**
- **status**: Filter by status (e.g. `"ACTIVE"`) or a list of statuses.
- **workflow_name**: Filter by workflow name or a list of names.
- **schedule_name_prefix**: Filter by schedule name prefix or a list of prefixes.
- **application_name**: List only schedules owned by this application (or one of these applications). Schedules owned by no application are always included. If unset, defaults to the client's own [`application_name`](#constructor); a client with no application name lists every application's schedules.

### list_schedules_async

Coroutine version of [`list_schedules`](#list_schedules).

### get_schedule

```python
client.get_schedule(name: str) -> Optional[WorkflowSchedule]
```

Return the [`WorkflowSchedule`](./contexts.md#workflowschedule) with the given name, or `None` if it does not exist.
Similar to [`DBOS.get_schedule`](./contexts.md#get_schedule).

### get_schedule_async

Coroutine version of [`get_schedule`](#get_schedule).

### delete_schedule

```python
client.delete_schedule(name: str) -> None
```

Delete the schedule with the given name. No-op if it does not exist.
Similar to [`DBOS.delete_schedule`](./contexts.md#delete_schedule).

### delete_schedule_async

Coroutine version of [`delete_schedule`](#delete_schedule).

### pause_schedule

```python
client.pause_schedule(name: str) -> None
```

Pause the schedule with the given name. A paused schedule does not fire.
Similar to [`DBOS.pause_schedule`](./contexts.md#pause_schedule).

### resume_schedule

```python
client.resume_schedule(name: str) -> None
```

Resume a paused schedule so it begins firing again.
Similar to [`DBOS.resume_schedule`](./contexts.md#resume_schedule).

### apply_schedules

```python
client.apply_schedules(
    schedules: List[ClientScheduleInput],
) -> None

class ClientScheduleInput(TypedDict):
    schedule_name: str
    workflow_name: str
    schedule: str
    context: Any
    workflow_class_name: Optional[str]
    automatic_backfill: bool  # Optional, defaults to False
    cron_timezone: Optional[str]  # Optional, defaults to None (UTC)
    queue_name: Optional[str]  # Optional, defaults to None (internal queue)
    application_name: Optional[str]  # Optional, defaults to the client's application_name
```

Atomically apply a set of schedules.
Useful for declaratively defining all your static schedules in one place.

### apply_schedules_async

Asynchronous version of [`apply_schedules`](#apply_schedules).

### backfill_schedule

```python
client.backfill_schedule(
    schedule_name: str,
    start: datetime,
    end: datetime,
) -> List[WorkflowHandle[None]]
```

Enqueue (on an internal queue) all executions of a schedule that would have run between `start` and `end`.
Each execution uses the same deterministic workflow ID as the live scheduler, so already-executed times are skipped.
Similar to [`DBOS.backfill_schedule`](./contexts.md#backfill_schedule).

### trigger_schedule

```python
client.trigger_schedule(schedule_name: str) -> WorkflowHandle[None]
```

Immediately enqueue (on an internal queue) the scheduled workflow at the current time.
Similar to [`DBOS.trigger_schedule`](./contexts.md#trigger_schedule).

## Version Management

### list_application_versions

```python
client.list_application_versions() -> List[VersionInfo]
```

Return all registered application versions, ordered by timestamp descending (newest first).
Similar to [`DBOS.list_application_versions`](./contexts.md#list_application_versions).
If the client has an [`application_name`](#constructor), only versions registered by that application (plus versions owned by no application) are returned; otherwise, every application's versions are returned.

### list_application_versions_async

```python
await client.list_application_versions_async() -> List[VersionInfo]
```

Coroutine version of [`list_application_versions`](#list_application_versions).

### get_latest_application_version

```python
client.get_latest_application_version() -> VersionInfo
```

Return the latest application version (the one with the highest timestamp).
Raises `DBOSException` if no versions are registered.
Similar to [`DBOS.get_latest_application_version`](./contexts.md#get_latest_application_version).

### get_latest_application_version_async

```python
await client.get_latest_application_version_async() -> VersionInfo
```

Coroutine version of [`get_latest_application_version`](#get_latest_application_version).

### set_latest_application_version

```python
client.set_latest_application_version(
    version_name: str,
    *,
    application_name: Optional[str] = None,
) -> None
```

Promote a version to latest by updating its timestamp to the current time.
This is useful when rolling back to a previous application version.
Similar to [`DBOS.set_latest_application_version`](./contexts.md#set_latest_application_version).

**Parameters:**
- `version_name`: The name of the version to promote.
- `application_name`: The application to act as. Defaults to the client's own [`application_name`](#constructor). Promoting a version registered by a different application raises an error.

### set_latest_application_version_async

```python
await client.set_latest_application_version_async(
    version_name: str,
    *,
    application_name: Optional[str] = None,
) -> None
```

Coroutine version of [`set_latest_application_version`](#set_latest_application_version).

## Application Rename

### rename_application

```python
client.rename_application(
    old_name: Optional[str],
    new_name: str,
    *,
    batch_size: Optional[int] = 10_000,
    adopt_unclaimed_rows: bool = False,
) -> ApplicationRowCounts

class ApplicationRowCounts(TypedDict):
    queues: int
    schedules: int
    versions: int
    workflows: int
    steps: int
```

Every workflow, step, queue, schedule, and application version is owned by the application (identified by its configured [`name`](./configuration.md#application-settings)) that created it.
After renaming an application, use this method (or the [`dbos rename-application`](./cli.md#dbos-rename-application) CLI command) to transfer everything owned by the old name to the new name.
Returns the number of rows transferred, by table.

Queues, schedules, versions, and in-flight workflows are transferred in a single transaction; completed workflows and their steps are then transferred in batches of `batch_size`.
The operation is idempotent: if interrupted, running it again resumes where it left off.

:::warning
Stop the application being renamed before running this.
A running application would race the rename, creating new work under its old name.
:::

**Parameters:**
- `old_name`: The application's previous name. If `None`, nothing is transferred except rows owned by no application, so `adopt_unclaimed_rows` must be set.
- `new_name`: The application that ends up owning the rows. Must be a valid application name (between 3 and 256 characters, containing only lowercase letters, numbers, dashes, and underscores).
- `batch_size`: The number of completed workflows and steps transferred per transaction. Pass `None` to transfer everything in a single transaction.
- `adopt_unclaimed_rows`: Also transfer rows owned by no application, such as rows created before upgrading to a DBOS version supporting application ownership. Defaults to `False`.

### rename_application_async

Coroutine version of [`rename_application`](#rename_application).