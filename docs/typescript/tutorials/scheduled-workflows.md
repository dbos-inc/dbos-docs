---
sidebar_position: 60
title: Scheduling Workflows
---

You can schedule DBOS [workflows](./workflow-tutorial.md) to run on a cron schedule.
Schedules are stored in the database and can be created, paused, resumed, and deleted at runtime.

To schedule a workflow, first define a workflow that takes two arguments: a `Date` (the scheduled execution time) and a context object:

```typescript
async function myPeriodicTask(scheduledTime: Date, context: unknown) {
    DBOS.logger.info(`Running task scheduled for ${scheduledTime} with context ${context}`);
}
const myPeriodicTaskWorkflow = DBOS.registerWorkflow(myPeriodicTask);
```

Then, create a schedule for it using [`DBOS.createSchedule`](../reference/methods.md#dboscreateschedule) with a [crontab](https://en.wikipedia.org/wiki/Cron) expression:

```typescript
await DBOS.createSchedule({
    scheduleName: "my-task-schedule", // The schedule name is a unique identifier of the schedule
    workflowFn: myPeriodicTaskWorkflow,
    schedule: "*/5 * * * *",  // Every 5 minutes
    context: "my context", // The context is passed into every iteration of the workflow
});
```

Note that `DBOS.createSchedule` will fail if the schedule already exists.
If you're defining a set of static schedules to be created on program start, you can instead use `DBOS.applySchedules` to create them atomically, updating them if they already exist:

```typescript
await DBOS.applySchedules([
    {
        scheduleName: "schedule-a",
        workflowFn: workflowA,
        schedule: "*/10 * * * *",  // Every 10 minutes
        context: "context-a",
    },
    {
        scheduleName: "schedule-b",
        workflowFn: workflowB,
        schedule: "0 0 * * *",  // Every day at midnight
        context: "context-b",
    },
]);
```

To learn more about crontab syntax, see [this guide](https://docs.gitlab.com/ee/topics/cron/) or [this crontab editor](https://crontab.guru/).
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

```typescript
async function customerWorkflow(scheduledTime: Date, customerId: string) {
    // ...
}
const customerWorkflowFn = DBOS.registerWorkflow(customerWorkflow);

async function onCustomerRegistration(customerId: string) {
    await DBOS.createSchedule({
        scheduleName: `customer-${customerId}-sync`,
        workflowFn: customerWorkflowFn,
        schedule: "0 * * * *",  // Every hour
        context: customerId,
    });
}
```

Note that scheduling is not supported for workflows that are methods on [instantiated objects](./instantiated-objects.md). Scheduled workflows should be free functions or static class methods.

### Managing Schedules

You can pause, resume, and delete schedules at runtime:

```typescript
// Pause a schedule so it stops firing
await DBOS.pauseSchedule("my-task-schedule");

// Resume a paused schedule
await DBOS.resumeSchedule("my-task-schedule");

// Delete a schedule
await DBOS.deleteSchedule("my-task-schedule");
```

You can also list and inspect schedules:

```typescript
// List all active schedules
const schedules = await DBOS.listSchedules({ status: "ACTIVE" });

// Get a specific schedule by name
const schedule = await DBOS.getSchedule("my-task-schedule");
```

### Backfilling and Triggering

If a schedule was paused or your application was offline, you can backfill missed executions using [`DBOS.backfillSchedule`](../reference/methods.md#dbosbackfillschedule).
Already-executed times are automatically skipped:

```typescript
await DBOS.backfillSchedule(
    "my-task-schedule",
    new Date("2025-01-01T00:00:00Z"),
    new Date("2025-01-02T00:00:00Z"),
);
```

You can also immediately trigger a schedule using [`DBOS.triggerSchedule`](../reference/methods.md#dbostriggerschedule):

```typescript
const handle = await DBOS.triggerSchedule("my-task-schedule");
```

### Managing Schedules from Another Application

You can manage schedules from outside your DBOS application using the [DBOS Client](../reference/client.md#workflow-schedules).
The client accepts workflow names as strings instead of function references:

```typescript
import { DBOSClient } from "@dbos-inc/dbos-sdk";

const client = await DBOSClient.create({ systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL });

await client.createSchedule({
    scheduleName: "my-task-schedule",
    workflowName: "myPeriodicTask",
    schedule: "*/5 * * * *",
    context: "my context",
});
```

### How Scheduling Works

Under the hood, DBOS constructs an [idempotency key](./workflow-tutorial.md#workflow-ids-and-idempotency) for each scheduled workflow execution.
The key is a concatenation of the schedule name and the scheduled time, ensuring each scheduled invocation occurs exactly once while your application is active.

For the full API reference, see [Workflow Schedules](../reference/methods.md#workflow-schedules).

---

# Static Scheduling (Deprecated)

You can use the [`DBOS.registerScheduled`](../reference/workflows-steps.md#dbosregisterscheduled) method or the [`DBOS.scheduled`](../reference/workflows-steps.md#dbosscheduled) decorator, specifying a schedule in [crontab](https://en.wikipedia.org/wiki/Cron) syntax, to schedule a workflow to run exactly once per time interval.

For example:


```typescript
async function scheduledFunction(schedTime: Date, startTime: Date) {
    DBOS.logger.info(`I am a workflow scheduled to run every 30 seconds`);
}

const scheduledWorkflow = DBOS.registerWorkflow(scheduledFunction);
DBOS.registerScheduled(scheduledWorkflow, {crontab: '*/30 * * * * *'});
```

Or using decorators:

```typescript
class ScheduledExample{
  @DBOS.workflow()
  @DBOS.scheduled({crontab: '*/30 * * * * *'})
  static async scheduledWorkflow(schedTime: Date, startTime: Date) {
    DBOS.logger.info(`I am a workflow scheduled to run every 30 seconds`);
  }
}
```

Scheduled workflows must take in exactly two arguments: the time that the run was scheduled (as a `Date`) and the time the run was actually started (as a `Date`).

Sometimes, you may require a scheduled workflow run **exactly once** per interval, even if the application was offline when it should have run.
For example, if your workflow is supposed to run every Friday at 9 PM UTC, but your application is offline for maintenance one Friday, you may want the workflow to launch as soon as your application is restarted.
You can configure this behavior in the `DBOS.scheduled` decorator:

```typescript
    @DBOS.scheduled({mode: SchedulerMode.ExactlyOncePerInterval, crontab: '...'})
```
