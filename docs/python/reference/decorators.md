---
sidebar_position: 2
title: Decorators
description: API reference for DBOS decorators.
pagination_prev: null
---


In DBOS, you annotate functions with decorators to give them properties. 

## Function Decorators

### workflow

```python
DBOS.workflow(
  max_recovery_attempts: int = 50
)
```

Durably execute this function as a [DBOS workflow](../tutorials/workflow-tutorial.md).

**Example:**
```python
@DBOS.workflow()
def greeting_workflow(name: str, note: str):
    sign_guestbook(name)
    insert_greeting(name, note)
```

**Parameters:**
- `max_recovery_attempts`: The maximum number of times the workflow may be automatically recovered.
For safety, DBOS automatically attempts to recover a workflow a set number of times.
If a workflow exceeds this limit, its status is set to `RETRIES_EXCEEDED` and it is no longer retried automatically, though it may be retried manually.
This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue) so that a buggy workflow that crashes its application (for example, by running it out of memory) is not retried infinitely.

### step

```python
DBOS.step(
    retries_allowed: bool = False,
    interval_seconds: float = 1.0,
    max_attempts: int = 3,
    backoff_rate: float = 2.0
)
```

Mark a function as a step in a workflow.
This has two benefits:

1. It lets workflows know this function performs a complex operation or interacts with an external service, so the workflow can guarantee those operations or interactions happen exactly-once.

2. DBOS provides configurable automatic retries with exponential backoff for steps to more easily handle transient errors.

**Example:**
```python
@DBOS.step(retries_allowed=True, max_attempts=10)
def example_step():
    return requests.get("https://example.com").text
```

**Parameters:**
- `retries_allowed`: Whether to retry the step if it throws an exception.
- `interval_seconds`: How long to wait before the initial retry.
- `max_attempts`: How many times to retry a step that is throwing exceptions.
- `backoff_rate`: How much to multiplicatively increase `interval_seconds` between retries.


### transaction

```python
DBOS.transaction(
    isolation_level: str = "SERIALIZABLE"
)
```

Transactions are a special type of step that are optimized for database operations.
They execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction).
They provide database access through the `DBOS.sql_session` context variable.

**Example:**
```python
@DBOS.transaction()
def example_insert(name: str, note: str) -> None:
    # Insert a new greeting into the database
    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")
    DBOS.sql_session.execute(sql, {"name": name, "note": note})
```

**Parameters:**
- `isolation_level`: The isolation level with which to run the transaction. Must be one of `SERIALIZABLE`, `REPEATABLE READ`, or `READ COMMITTED`. Defaults to `SERIALIZABLE`.

### scheduled

```python
DBOS.scheduled(
    cron: str
)
```

Run a function on a schedule specified using [crontab](https://en.wikipedia.org/wiki/Cron) syntax. See [here](https://docs.gitlab.com/ee/topics/cron/) for a guide to cron syntax and [here](https://crontab.guru/) for a crontab editor.

The annotated function must take in two parameters: The time that the run was scheduled (as a `datetime`) and the time that the run was actually started (also a `datetime`).

**Example:**
```python
@DBOS.scheduled('* * * * *') # crontab syntax to run once every minute
@DBOS.workflow()
def example_scheduled_workflow(scheduled_time: datetime, actual_time: datetime):
    DBOS.logger.info("I am a workflow scheduled to run once a minute. ")
```

**Parameters:**
- `cron`: The schedule in [crontab](https://en.wikipedia.org/wiki/Cron) syntax. DBOS uses [croniter](https://pypi.org/project/croniter/) to parse cron schedules, which is able to do second repetition and by default we use seconds as the first field ([`second_at_beginning=True`](https://pypi.org/project/croniter/#about-second-repeats)). The DBOS variant contains 5 or 6 items, separated by spaces:

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

### required_roles

```python
DBOS.required_roles(
  roles: List[str]
)
```

The `@DBOS.dbos_required_roles` decorator applies role-based security to the decorated function.  The authenticated user must have at least one of the roles on the `roles` list in order to access the function.

**Parameters:**
- `roles`: List of required roles applied to the decorated function.


**Example:**
```python
@DBOS.workflow()
@DBOS.required_roles(["support","admin")
def my_support_workflow():
  pass # Function accessible only with "support" or "admin" role
```

### kafka_consumer

```python
DBOS.kafka_consumer(
        config: dict[str, Any],
        topics: list[str],
        in_order: bool = False,
)
```

Runs a function for each Kafka message received on the specified topic(s). 
Uses the Kafka message's topic, partition and offset to create a unique [workflow id](../reference/contexts#setworkflowid) to ensure once and only once execution.
Takes a configuration dictionary and a list of topics to consume. 
The decorated function must take a KafkaMessage as its only parameter.

**Parameters:**
- `config`: a dictionary of config settings. Information on required settings follows with full configuration setting details available in the [official Kafka documentation](https://kafka.apache.org/documentation/#consumerconfigs).
  - `bootstrap.servers`: A list of host/port pairs to use for establishing the initial connection to the Kafka cluster.
    This list should be in the form host1:port1,host2:port2,...
  - `group.id`: A unique string that identifies the consumer group this consumer belongs to.
- `topics`: a list of Kafka topics to subscribe to
- `in_order`: If true, messages will be processed sequentially in offset order.

**Example**
```python
@DBOS.kafka_consumer(
        config={
            "bootstrap.servers": "localhost:9092",
            "group.id": "dbos-kafka-group",
        },
        topics=["example-topic"],
)
@DBOS.workflow()
def test_kafka_workflow(msg: KafkaMessage):
    DBOS.logger.info(f"Message received: {msg.value.decode()}")
```


## Classes and Decorators

Methods in classes can be decorated with any of the [function decorators](#function-decorators) above.
Functions marked as `@classmethod` or `@staticmethod` are supported in the same way as regular functions. 
Classes with instance methods should extend from [`DBOSConfiguredInstance`](#dbosconfiguredinstance).

### dbos_class

```python
DBOS.dbos_class()
```

The `@DBOS.dbos_class` decorator should be applied to all classes with DBOS workflow, transaction, and step functions.  This decorator assists in making sure all functions are properly registered with the class and provided with class-level configuration information.

**Example:**
```python
@DBOS.dbos_class()
class MyClass:
  @staticmethod
  @DBOS.workflow()
  def my_class_wf():
    pass
```

### default_required_roles

```python
DBOS.default_required_roles(
  roles: List[str]
)
```

The `@DBOS.default_required_roles` decorator can be applied to a class to set the default list of required access roles for all functions in the class.  The list of required roles for individual functions can be overridden with [`required_roles`](#required_roles).

**Parameters:**
- `roles`: List of required roles to apply to all functions not individually decorated with [`required_roles`](#required_roles).

**Example:**
```python
@DBOS.default_required_roles(["user"])
class MyClass:
  @staticmethod
  @DBOS.workflow()
  def my_user_function() -> None:
    pass  # Must have "user" role to access

  @staticmethod
  @DBOS.workflow()
  @DBOS.required_roles(["admin"])
  def my_admin_function() -> None:
    pass  # Must have "admin" role to access
```


### DBOSConfiguredInstance

```python
DBOSConfiguredInstance(
  instance_name: str
)
```

`DBOSConfiguredInstance` should be used as a base for classes with decorated instance member functions.
`DBOSConfiguredInstance` collects the instance name; this name is recorded in the database workflow records so that recovery can be targeted to the correct instance.
`DBOSConfiguredInstance` also registers the class instance with the DBOS recovery system.

**Parameters:**
- `instance_name`: The name of the instance, for recording in workflow database records

**Example:**
```python
    @DBOS.dbos_class()
    class DBOSTestClass(DBOSConfiguredInstance):
        def __init__(self) -> None:
            super().__init__("instance1")
```

