---
sidebar_position: 4
title: Decorators
description: API reference for DBOS decorators.
---


In DBOS, you annotate functions with decorators to give them properties. 

## Function Decorators

### workflow

```python
dbos.workflow()
```

Run a function as a DBOS reliable workflow.

```python
@dbos.workflow()
def example_workflow():
    print("I am a workflow")
```


### transaction

```python
dbos.transaction(
    isolation_level: str = "SERIALIZABLE"
)
```

Run a function as a database transaction. Access the database through the `DBOS.sqlsession` context variable.

```python
@dbos.transaction()
def example_transaction():
    print("I am a transaction")
```

**Parameters:**
- `isolation_level`: The isolation level with which to run the transaction. Must be one of `SERIALIZABLE`, `REPEATABLE READ`, or `READ COMMITTED`. Defaults to `SERIALIZABLE`.

### communicator

```python
dbos.communicator(
    retries_allowed: bool = False,
    interval_seconds: float = 1.0,
    max_attempts: int = 3,
    backoff_rate: float = 2.0
)
```

Run a function as a DBOS communicator. Communicators allow durably calling third-party APIs from workflows and provide configurable automatic retries.

```python
@dbos.communicator()
def example_communicator():
    print("I am a communicator")
```

### scheduled

```python
dbos.scheduled(
    cron: str
)
```

Run a function on a schedule specified using [cron](https://en.wikipedia.org/wiki/Cron) syntax. See [here](https://docs.gitlab.com/ee/topics/cron/) for a guide to cron syntax and [here](https://crontab.guru/) for a cron editor.

The annotated function must take in two parameters: The time that the run was scheduled (as a `datetime`) and the time that the run was actually started (also a `datetime`).

```python
@dbos.scheduled('* * * * *')
@dbos.workflow()
def example_communicator(scheduled_time: datetime, actual_time: datetime):
    print("I am a workflow scheduled to run once a minute. ")
```


**Parameters:**
- `cron`: The schedule in [cron](https://en.wikipedia.org/wiki/Cron) syntax.

## Authorization Decorators

### default_required_roles

### required_roles