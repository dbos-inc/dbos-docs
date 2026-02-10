---
sidebar_position: 70
title: Scheduled Workflows
description: Learn how to run DBOS workflows on a schedule.
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