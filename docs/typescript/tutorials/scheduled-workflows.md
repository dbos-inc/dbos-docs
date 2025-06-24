---
sidebar_position: 60
title: Scheduled Workflows
---

You can schedule DBOS [workflows](./workflow-tutorial.md) to run exactly once per time interval.
To do this, annotate the workflow with the [`@DBOS.scheduled`](../reference/transactapi/dbos-class#scheduled-workflows) decorator and specify the schedule in [crontab](https://en.wikipedia.org/wiki/Cron) syntax.  For example:

```typescript
import { DBOS } from '@dbos-inc/dbos-sdk';

class ScheduledExample{
  @DBOS.workflow()
  @DBOS.scheduled({crontab: '*/30 * * * * *'})
  static async scheduledFunc(schedTime: Date, startTime: Date) {
    DBOS.logger.info(`I am a workflow scheduled to run every 30 seconds`);
  }
}
```

Scheduled workflows must take in exactly two arguments: the time that the run was scheduled (as a `Date`) and the time the run was actually started (as a `Date`).

To learn more about crontab syntax, see [this guide](https://docs.gitlab.com/ee/topics/cron/) or [this crontab editor](https://crontab.guru/).
The specification for the DBOS variant can be found in the [DBOS API reference](../reference/transactapi/dbos-class#crontab-specification).

The DBOS crontab format supports some common extensions, as seen in the following examples:
- `* * * * *`: Every minute of every day
- `* 5 * * 1`: Every minute during the hour of 05:00 on Mondays.
- `30 * * * * *`: 30 seconds after the beginning of every minute
- `0 12 * * Sun`: At noon on sundays
- `0 9-17 * * *`: At the top of the hour, from 9am to 5pm
- `*/30 * * * * *`: Every 30 seconds (seconds is evenly divisible by 30)
- `10-19/2 * * January,Feb *`: At 10, 12, 14, 16, and 18 minutes into each hour of every day, only in the months of January and February

### How Scheduling Works
Under the hood, DBOS constructs an [idempotency key](./workflow-tutorial.md#workflow-ids-and-idempotency) for each workflow invocation.  The key is a concatenation of the function name and the scheduled time, ensuring each scheduled invocation occurs exactly once while your application is active.

Sometimes, you may require a scheduled workflow run **exactly once** per interval, even if the application was offline when it should have run.
For example, if your workflow is supposed to run every Friday at 9 PM UTC, but your application is offline for maintenance one Friday, you may want the workflow to launch as soon as your application is restarted.
You can configure this behavior in the `DBOS.scheduled` decorator:

```typescript
    @DBOS.scheduled({mode: SchedulerMode.ExactlyOncePerInterval, crontab: '...'})
```