---
sidebar_position: 1
title: Decorators
description: API reference for DBOS decorators.
---


In DBOS, you annotate functions with decorators to give them properties. 

## Function Decorators

### workflow

```python
DBOS.workflow()
```

Run a function as a DBOS reliable workflow.

```python
@DBOS.workflow()
def example_workflow():
    DBOS.logger.info("I am a workflow")
```


### transaction

```python
DBOS.transaction(
    isolation_level: str = "SERIALIZABLE"
)
```

Run a function as a database transaction. Access the database through the `DBOS.sqlsession` context variable.

```python
@DBOS.transaction()
def example_transaction():
    DBOS.logger.info("I am a transaction")
```

**Parameters:**
- `isolation_level`: The isolation level with which to run the transaction. Must be one of `SERIALIZABLE`, `REPEATABLE READ`, or `READ COMMITTED`. Defaults to `SERIALIZABLE`.

### communicator

```python
DBOS.communicator(
    retries_allowed: bool = False,
    interval_seconds: float = 1.0,
    max_attempts: int = 3,
    backoff_rate: float = 2.0
)
```

Run a function as a DBOS communicator. Communicators allow durably calling third-party APIs from workflows and provide configurable automatic retries.
For example, this communicator fetches the contents of `example.com`.
If `example.com` is down, it will automatically retry up to 10 times with exponential backoff.

```python
@DBOS.communicator(retries_allowed=True, max_attempts=10)
def example_communicator():
    return requests.get("https://example.com").text
```

### scheduled

```python
DBOS.scheduled(
    cron: str
)
```

Run a function on a schedule specified using [crontab](https://en.wikipedia.org/wiki/Cron) syntax. See [here](https://docs.gitlab.com/ee/topics/cron/) for a guide to cron syntax and [here](https://crontab.guru/) for a crontab editor.

The annotated function must take in two parameters: The time that the run was scheduled (as a `datetime`) and the time that the run was actually started (also a `datetime`).

```python
@DBOS.scheduled('* * * * *') # crontab syntax to run once every minute
@DBOS.workflow()
def example_scheduled_workflow(scheduled_time: datetime, actual_time: datetime):
    DBOS.logger.info("I am a workflow scheduled to run once a minute. ")
```


**Parameters:**
- `cron`: The schedule in [crontab](https://en.wikipedia.org/wiki/Cron) syntax.
