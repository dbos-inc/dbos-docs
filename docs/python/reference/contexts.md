---
sidebar_position: 3
title: Contexts
description: API reference for DBOS context methods and variables
---

DBOS provides a number of useful context methods and variables.
All are accessed through the syntax `DBOS.<method>` and can only be used once a DBOS class object has been initialized.

## Context Methods

### send / send_async

```python
DBOS.send(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None
) -> None

DBOS.send_async(
    destination_id: str,
    message: Any,
    topic: Optional[str] = None
) -> Coroutine[Any, Any, None]
```

Send a message to the workflow identified by `destination_id`.
Messages can optionally be associated with a topic.
The `send` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-workflows), `send_async` should be used instead.


**Parameters:**
- `destination_id`: The workflow to which to send the message.
- `message`: The message to send. Must be serializable.
- `topic`: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.

### recv / recv_async

```python
DBOS.recv(
    topic: Optional[str] = None,
    timeout_seconds: float = 60,
) -> Any

DBOS.recv_async(
    topic: Optional[str] = None,
    timeout_seconds: float = 60,
) -> Coroutine[Any, Any, Any]
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning `None` if the wait times out.
If no topic is specified, `recv` can only access messages sent without a topic.
The `recv` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-workflows), `recv_async` should be used instead.

**Parameters:**
- `topic`: A topic queue on which to wait.
- `timeout_seconds`: A timeout in seconds. If the wait times out, return `None`.

**Returns:**
- The first message enqueued on the input topic, or `None` if the wait times out.

### set_event / set_event_async

```python
DBOS.set_event(
    key: str,
    value: Any,
) -> None

DBOS.set_event(
    key: str,
    value: Any,
) -> Coroutine[Any, Any, None]
```

Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
Can only be called from within a workflow.
The `set_event` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-workflows), `set_event_async` should be used instead.


**Parameters:**
- `key`: The key of the event.
- `value`: The value of the event. Must be serializable.

### get_event / get_event_async

```python
DBOS.get_event(
    workflow_id: str,
    key: str,
    timeout_seconds: float = 60,
) -> Any

DBOS.get_event_async(
    workflow_id: str,
    key: str,
    timeout_seconds: float = 60,
) -> Coroutine[Any, Any, Any]
```

Retrieve the latest value of an event published by the workflow identified by `workflow_id` to the key `key`.
If the event does not yet exist, wait for it to be published, returning `None` if the wait times out.
The `get_event` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-workflows), `get_event_async` should be used instead.

**Parameters:**
- `workflow_id`: The identifier of the workflow whose events to retrieve.
- `key`: The key of the event to retrieve.
- `timeout_seconds`: A timeout in seconds. If the wait times out, return `None`.

**Returns:**
- The value of the event published by `workflow_id` with name `key`, or `None` if the wait times out.


### sleep / sleep_async

```python
DBOS.sleep(
    seconds: float
) -> None

DBOS.sleep_async(
    seconds: float
) -> Coroutine[Any, Any, None]
```

Sleep for the given number of seconds.
May only be called from within a workflow.
This sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.
The `sleep` function should not be used in [coroutine workflows](../tutorials/workflow-tutorial.md#coroutine-workflows), `sleep_async` should be used instead.

**Parameters:**
- `seconds`: The number of seconds to sleep.

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

### span

```python
DBOS.span: opentelemetry.trace.Span
```

Retrieve the OpenTelemetry span associated with the curent request.
You can use this to set custom attributes in your span.

### request

```python
DBOS.request: Request
```

May only be accessed from within the handler of a FastAPI request, or in a function called from the handler.
Retrieve request information parsed from FastAPI:
```python
headers: Headers # The request headers
path_params: dict[str, Any] # The request's path parameters
query_params QueryParams # The request's query parameters
url: URL # The URL to which the request was sent
base_url: URL # The base URL of the request
client: Optional[Address] # Information about the client that sent the request
cookies: dict[str, str] # The request's cookie parameters
method: str # The HTTP method of the request
```

### config

```python
DBOS.config: ConfigFile
```

Return the current DBOS [configuration](./configuration.md), as a `ConfigFile`.

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

Set the [workflow ID](../tutorials/workflow-tutorial.md#workflow-ids)/[idempotency key](../tutorials/idempotency-tutorial.md) of the next workflow to run.
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
