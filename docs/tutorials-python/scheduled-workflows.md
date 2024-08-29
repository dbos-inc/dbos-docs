---
sidebar_position: 6
title: Scheduled Workflows
description: Learn how to run DBOS workflows on a schedule.
---

You can schedule DBOS [workflows](./workflow-tutorial.md) to run exactly once per time interval.
To do this, annotate the workflow with the [`@DBOS.scheduled`](../reference-python/decorators.md#scheduled) decorator and specify the schedule in [crontab](https://en.wikipedia.org/wiki/Cron) syntax.  For example:

```python
@DBOS.scheduled('* * * * *') # crontab syntax to run once every minute
@DBOS.workflow()
def example_scheduled_workflow(scheduled_time: datetime, actual_time: datetime):
    DBOS.logger.info("I am a workflow scheduled to run once a minute. ")
```

Scheduled workflows must take in exactly two arguments: the time that the run was scheduled (as a `datetime`) and the time the run was actually started (as a `datetime`).

To learn more about crontab syntax, see [this guide](https://docs.gitlab.com/ee/topics/cron/) or [this crontab editor](https://crontab.guru/). DBOS uses [croniter](https://pypi.org/project/croniter/) to parse cron schedules.

### How Scheduling Works
Under the hood, DBOS constructs an [idempotency key](./idempotency-tutorial) for each workflow invocation.  The key is a concatenation of the function name and the scheduled time, ensuring each scheduled invocation occurs exactly once while your application is active.