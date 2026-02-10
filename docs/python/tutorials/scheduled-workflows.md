---
sidebar_position: 70
title: Scheduling Workflows
---

You can schedule DBOS [workflows](./workflow-tutorial.md) to run on a cron schedule.
Schedules are stored in the database and can be created, paused, resumed, and deleted at runtime.

To schedule a workflow, first define a workflow that takes two arguments: a `datetime` (the scheduled execution time) and a context object:

```python
from datetime import datetime
from typing import Any
from dbos import DBOS

@DBOS.workflow()
def my_periodic_task(scheduled_time: datetime, context: Any):
    DBOS.logger.info(f"Running task scheduled for {scheduled_time} with context {context}")
```

Then, create a schedule for it using [`DBOS.create_schedule`](../reference/contexts.md#create_schedule) with a [crontab](https://en.wikipedia.org/wiki/Cron) expression:

```python
DBOS.create_schedule(
    schedule_name="my-task-schedule", # The schedule name is a unique identifier of the schedule
    workflow_fn=my_periodic_task,
    schedule="*/5 * * * *",  # Every 5 minutes
    context="my context", # The context is passed into every iteration of the workflow
)
```

To learn more about crontab syntax, see [this guide](https://docs.gitlab.com/ee/topics/cron/) or [this crontab editor](https://crontab.guru/).
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

You can dynamically create many schedules for the same workflow.
For example, if you want to perform certain actions periodically for each of your customers, you can create one schedule per customer, using customer ID as context so each workflow knows which customer to act on:

```python
from datetime import datetime
from dbos import DBOS

@DBOS.workflow()
def customer_workflow(scheduled_time: datetime, customer_id: str):
    # ...

def on_customer_registration(customer_id: str):
    DBOS.create_schedule(
        schedule_name=f"customer-{customer_id}-sync",
        workflow_fn=customer_workflow,
        schedule="0 * * * *",  # Every hour
        context=customer_id,
    )
```

### Atomically Updating Schedules

If you need to create, update, or delete multiple schedules at once, use [`DBOS.apply_schedules`](../reference/contexts.md#apply_schedules).
This is useful for declaratively defining all your static schedules in one place:

```python
DBOS.apply_schedules([
    {"schedule_name": "schedule-a", "workflow_fn": workflow_a, "schedule": "*/10 * * * *"},  # Every 10 minutes
    {"schedule_name": "schedule-b", "workflow_fn": workflow_b, "schedule": "0 0 * * *"},     # Every day at midnight
])
```

### Managing Schedules

You can pause, resume, and delete schedules at runtime:

```python
# Pause a schedule so it stops firing
DBOS.pause_schedule("my-task-schedule")

# Resume a paused schedule
DBOS.resume_schedule("my-task-schedule")

# Delete a schedule
DBOS.delete_schedule("my-task-schedule")
```

You can also list and inspect schedules:

```python
# List all active schedules
schedules = DBOS.list_schedules(status="ACTIVE")

# Get a specific schedule by name
schedule = DBOS.get_schedule("my-task-schedule")
```

### Backfilling and Triggering

If a schedule was paused or your application was offline, you can backfill missed executions using [`DBOS.backfill_schedule`](../reference/contexts.md#backfill_schedule).
Already-executed times are automatically skipped:

```python
from datetime import datetime, timezone

DBOS.backfill_schedule(
    "my-task-schedule",
    start=datetime(2025, 1, 1, tzinfo=timezone.utc),
    end=datetime(2025, 1, 2, tzinfo=timezone.utc),
)
```

You can also immediately trigger a schedule using [`DBOS.trigger_schedule`](../reference/contexts.md#trigger_schedule):

```python
handle = DBOS.trigger_schedule("my-task-schedule")
```

### Managing Schedules from Another Application

You can manage schedules from outside your DBOS application using the [DBOS Client](../reference/client.md#workflow-schedules).
The client accepts workflow names as strings instead of function references:

```python
from dbos import DBOSClient

client = DBOSClient(system_database_url=os.environ["DBOS_SYSTEM_DATABASE_URL"])

client.create_schedule(
    schedule_name="my-task-schedule",
    workflow_name="my_periodic_task",
    schedule="*/5 * * * *",
    context="my context",
)
```

### How Scheduling Works

Under the hood, DBOS constructs an [idempotency key](./workflow-tutorial.md#workflow-ids-and-idempotency) for each scheduled workflow execution.
The key is a concatenation of the schedule name and the scheduled time, ensuring each scheduled invocation occurs exactly once while your application is active.

For the full API reference, see [Workflow Schedules](../reference/contexts.md#workflow-schedules).

---

# Decorator-Based Scheduling (Deprecated)

You can annotate a workflow with the [`@DBOS.scheduled`](../reference/decorators.md#scheduled) decorator, specifying a schedule in [crontab](https://en.wikipedia.org/wiki/Cron) syntax, to schedule it to run exactly once per time interval.

For example:

```python
@DBOS.scheduled('* * * * *') # crontab syntax to run once every minute
@DBOS.workflow()
def example_scheduled_workflow(scheduled_time: datetime, actual_time: datetime):
    DBOS.logger.info("I am a workflow scheduled to run once a minute. ")
```

Workflow scheduled in this way must take in exactly two arguments: the time that the run was scheduled (as a `datetime`) and the time the run was actually started (as a `datetime`).  Note that this means scheduled workflows should either be plain functions, or be `@staticmethod` class members.

To learn more about crontab syntax, see [this guide](https://docs.gitlab.com/ee/topics/cron/) or [this crontab editor](https://crontab.guru/). DBOS uses [croniter](https://pypi.org/project/croniter/) to parse cron schedules, which is able to do second repetition and by default we use seconds as the first field.
The specification for the DBOS variant can be found in the [decorator reference](../reference/decorators.md#scheduled).