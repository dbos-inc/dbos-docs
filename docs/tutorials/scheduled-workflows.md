---
sidebar_position: 18
title: Scheduled Workflows
description: Learn how to run DBOS workflows on a schedule.
---

In this guide, you'll learn how to execute DBOS workflows exactly once per time interval.

### Defining A Workflow Function For Scheduling
First, define your workflow.  Its parameters must be:
- The `WorkflowContext`
- The time that the run was scheduled (as a `Date`).
- The time that the run was actually started (as a `Date`).  This can be used to tell if an exactly-once workflow was started behind schedule.

```typescript
import { Scheduled, Workflow, WorkflowContext } from '@dbos-inc/dbos-sdk';

class ScheduledExample{
  @Workflow()
  static async scheduledFunc(ctxt: WorkflowContext, schedTime: Date, startTime: Date) {
    ctxt.logger.info(`
        Running a workflow every 5 seconds -
          scheduled time: ${schedTime.toISOString()} /
          actual start time: ${startTime.toISOString()}
    `);
  }
}
```

### Scheduling The Workflow
Then, annotate your method with a [`@Scheduled`](../api-reference/decorators.md#scheduled) decorator specifiying the schedule in a [`crontab`](https://en.wikipedia.org/wiki/Cron)-like format, which optionally specifies a constraint for seconds, followed by constraints for minutes, hours, day of month, month of year, and day of week.  For example, the following workflow will run every 30 seconds:

```typescript
import { Scheduled, Workflow, WorkflowContext } from '@dbos-inc/dbos-sdk';

class ScheduledExample{
  @Workflow()
  @Scheduled({crontab: '*/30 * * * * *'})
  static async scheduledFunc(ctxt: WorkflowContext, schedTime: Date, startTime: Date) {
    ctxt.logger.info(``);
  }
}
```

The DBOS crontab format supports some common extensions, as seen in the following examples:
- `* * * * *`: Every minute of every day
- `* 5 * * 1`: Every minute during the hour of 05:00 on Mondays.
- `30 * * * * *`: 30 seconds after the beginning of every minute
- `0 12 * * Sun`: At noon on sundays
- `0 9-17 * * *`: At the top of the hour, from 9am to 5pm
- `*/30 * * * * *`: Every 30 seconds (seconds is evenly divisible by 30)
- `10-19/2 * * January,Feb *`: At 10, 12, 14, 16, and 18 minutes into each hour of every day, only in the months of January and February

### How Scheduling Works
Under the hood, DBOS constructs an [idempotency key](./idempotency-tutorial) for each workflow invocation.  The key is a concatenation of the function name and the scheduled time, ensuring each scheduled invocation occurs at most once.  The DBOS system database tracks the last time that the workflow was known to have started; this implementation ensures that the workflow is started at least once.  The combination of mechanisms can therefore ensure that the scheduled workflow occurs exactly once per time interval.

### Skipping Scheduled Workflows
By default, scheduled workflows are executed exactly once per interval.  This means that, if an application is stopped for an extended period, DBOS Transact could initiate a significant number of workflows upon restart.  If it is known by the application developer that "makeup work" should not be scheduled for a given workflow function, the mode for that function should be changed in its configuration:
```typescript
    @Scheduled({mode: SchedulerMode.ExactlyOncePerIntervalWhenActive, crontab: '...'})
```

If the mode is set to `ExactlyOncePerIntervalWhenActive` , DBOS Transact will not consult the system database to figure out if scheduled workflows were missed, but will instead start the schedule at the current time.
