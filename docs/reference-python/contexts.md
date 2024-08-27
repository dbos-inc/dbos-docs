---
sidebar_position: 2
title: Contexts
description: API reference for DBOS context methods and variables
---

DBOS provides a number of context methods and variables you can use to interact with functions and the database.
All are accessed through the syntax `DBOS.<method>` and can only be used once a DBOS class object has been initialized.

## Context Methods

### send

```python
DBOS.send(
    destination_uuid: str,
    message: Any,
    topic: Optional[str] = None
) -> None
```

Send a message to the workflow identified by `destination_uuid`.
Messages can optionally be associated with a topic.
For more information, see our [workflow communication tutorial](#).

**Parameters:**
- `destination_uuid`: The workflow to which to send the message.
- `message`: The message to send. Must be serializable.
- `topic`: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.

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
For more information, see our [workflow communication tutorial](#).

**Parameters:**
- `topic`: A topic queue on which to wait.
- `timeout_seconds`: A timeout in seconds. If the wait times out, return `None`.

**Returns:**
- The first message enqueued on the input topic, or `None` if the wait times out.

### set_event

```python
DBOS.set_event(
    key: str,
    value: Any,
) -> None
```

Create and associate with this workflow an immutable event named `key` with value `value`.
Can only be called from within a workflow.
Events are immutable and attempting to emit an event twice from a given workflow instance will result in an error.
For more information, see our [workflow communication tutorial](#).


**Parameters:**
- `key`: The name to give the event.
- `value`: The value of the event. Must be serializable.

### get_event

```python
DBOS.get_event(
    workflow_uuid: str,
    key: str,
    timeout_seconds: float = 60,
) -> None
```

Retrieve an event published by the workflow identified by `workflow_uuid` to the key `key`.
Waits for the event to be published, returning `None` if the wait times out.

**Parameters:**
- `workflow_uuid`: The identifier of the workflow whose events to retrieve.
- `key`: The key of the event to retrieve.
- `timeout_seconds`: A timeout in seconds. If the wait times out, return `None`.

**Returns:**
- The value of the event published by `workflow_uuid` with name `key`, or `None` if the wait times out.


### sleep

```python
DBOS.sleep(
    seconds: float
)
```

Sleep for the given number of seconds.
May only be called from within a workflow.
This sleep is durable--it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.

**Parameters:**
- `seconds`: The number of seconds to sleep.

## Context Variables

### logger

```python
DBOS.logger: Logger
```

Retrieve the DBOS logger. We recommend, but do not require, using it for all logging in DBOS apps.

### sql_session

```python
DBOS.sql_session: sqlalchemy.Session
```

May only be accessed from within a transaction.
Retrieves the SQLAlchemy session of the transaction, a database connection the transaction can use to interact with the database.

### workflow_id

```python
DBOS.workflow_id: str
```

May only be accessed from within a workflow, transaction, or communicator.
Return the identity of the current workflow.

### span

```python
span -> opentelemetry.trace.Span
```

Retrieve the OpenTelemetry span associated with the curent request.
You can use this to set custom attributes in your span.

### request

```python
request -> Request
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

