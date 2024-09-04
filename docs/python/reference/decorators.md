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
DBOS.workflow()
```

Durably execute this function as a [DBOS workflow](../tutorials/workflow-tutorial.md).

**Example:**
```python
@DBOS.workflow()
def greeting_workflow(name: str, note: str):
    sign_guestbook(name)
    insert_greeting(name, note)
```

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
- `cron`: The schedule in [crontab](https://en.wikipedia.org/wiki/Cron) syntax.
