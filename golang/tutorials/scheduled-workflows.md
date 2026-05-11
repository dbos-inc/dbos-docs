---
sidebar_position: 60
title: Scheduling Workflows
---

You can schedule DBOS [workflows](./workflow-tutorial.md) to run on a cron schedule.
Schedules are stored in the database and can be created, paused, resumed, and deleted at runtime.

To schedule a workflow, first define a workflow whose input is a [`ScheduledWorkflowInput`](../reference/methods.md#scheduledworkflowinput).
This struct carries the cron tick time (`ScheduledTime`) and a user-defined `Context` value attached to the schedule:

```go
func myPeriodicTask(ctx dbos.DBOSContext, input dbos.ScheduledWorkflowInput) (any, error) {
    logger.Info("running scheduled task",
        "scheduled_time", input.ScheduledTime,
        "context", input.Context)
    return nil, nil
}

dbos.RegisterWorkflow(dbosContext, myPeriodicTask)
```

Then, create a schedule for it using [`CreateSchedule`](../reference/methods.md#createschedule) with a [crontab](https://en.wikipedia.org/wiki/Cron) expression:

```go
err := dbos.CreateSchedule(dbosContext, myPeriodicTask, dbos.CreateScheduleRequest{
    ScheduleName: "my-task-schedule", // The schedule name is a unique identifier of the schedule
    Schedule:     "*/5 * * * *",      // Every 5 minutes
}, dbos.WithScheduleContext("my context")) // The context is passed into every iteration of the workflow
```

Note that `CreateSchedule` will fail if the schedule already exists.
If you're defining a set of static schedules to be created on program start, you can instead use [`ApplySchedules`](../reference/methods.md#applyschedules) to create them atomically, updating them if they already exist:

```go
err := dbos.ApplySchedules(dbosContext, []dbos.ApplySchedulesRequest{
    {
        ScheduleName: "schedule-a",
        WorkflowFn:   workflowA,
        Schedule:     "*/10 * * * *", // Every 10 minutes
        Context:      "context-a",
    },
    {
        ScheduleName: "schedule-b",
        WorkflowFn:   workflowB,
        Schedule:     "0 0 * * *",    // Every day at midnight
        Context:      "context-b",
    },
})
```

To learn more about crontab syntax, see [this guide](https://docs.gitlab.com/ee/topics/cron/) or [this crontab editor](https://crontab.guru/).
DBOS Go uses [robfig/cron](https://pkg.go.dev/github.com/robfig/cron/v3) to parse cron schedules, with seconds as an optional first field.
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

Cron expressions are evaluated in UTC by default. Pass [`WithCronTimezone`](../reference/methods.md#withcrontimezone) with an [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (e.g. `"America/New_York"`) to evaluate the expression in a different timezone.

You can dynamically create many schedules for the same workflow.
For example, if you want to perform certain actions periodically for each of your customers, you can create one schedule per customer, using customer ID as context so each workflow knows which customer to act on:

```go
func customerWorkflow(ctx dbos.DBOSContext, input dbos.ScheduledWorkflowInput) (any, error) {
    customerID := input.Context.(string)
    // ...
    return nil, nil
}

dbos.RegisterWorkflow(dbosContext, customerWorkflow)

func onCustomerRegistration(ctx dbos.DBOSContext, customerID string) error {
    return dbos.CreateSchedule(ctx, customerWorkflow, dbos.CreateScheduleRequest{
        ScheduleName: fmt.Sprintf("customer-%s-sync", customerID),
        Schedule:     "0 * * * *", // Every hour
    }, dbos.WithScheduleContext(customerID))
}
```

The `Context` field on `ScheduledWorkflowInput` is typed as `any` and is serialized as JSON.
Type-assert or unmarshal it inside the workflow to recover the original value.

### Managing Schedules

You can pause, resume, and delete schedules at runtime:

```go
// Pause a schedule so it stops firing
err := dbos.PauseSchedule(dbosContext, "my-task-schedule")

// Resume a paused schedule
err = dbos.ResumeSchedule(dbosContext, "my-task-schedule")

// Delete a schedule
err = dbos.DeleteSchedule(dbosContext, "my-task-schedule")
```

You can also list and inspect schedules:

```go
// List all active schedules
schedules, err := dbos.ListSchedules(dbosContext,
    dbos.WithScheduleStatuses(dbos.ScheduleStatusActive))

// Get a specific schedule by name
schedule, err := dbos.GetSchedule(dbosContext, "my-task-schedule")
```

### Backfilling and Triggering

If a schedule was paused or your application was offline, you can backfill missed executions using [`BackfillSchedule`](../reference/methods.md#backfillschedule).
Already-executed times are automatically skipped:

```go
start := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
end := time.Date(2025, 1, 2, 0, 0, 0, 0, time.UTC)
ids, err := dbos.BackfillSchedule(dbosContext, "my-task-schedule", start, end)
```

Alternatively, pass [`WithAutomaticBackfill(true)`](../reference/methods.md#withautomaticbackfill) when creating a schedule so that missed executions are automatically backfilled whenever your application starts or a paused schedule is resumed.

You can also immediately trigger a schedule using [`TriggerSchedule`](../reference/methods.md#triggerschedule):

```go
handle, err := dbos.TriggerSchedule(dbosContext, "my-task-schedule")
```

### Scheduling to Queues

By default, scheduled workflows are enqueued on an internal queue.
You can instead enqueue them on a declared [queue](./queue-tutorial.md) to manage their concurrency or rate limits.
Pass [`WithScheduleQueueName`](../reference/methods.md#withschedulequeuename) when creating the schedule:

```go
dbos.NewWorkflowQueue(dbosContext, "scheduled_queue",
    dbos.WithGlobalConcurrency(1))

err := dbos.CreateSchedule(dbosContext, myPeriodicTask, dbos.CreateScheduleRequest{
    ScheduleName: "my-task-schedule",
    Schedule:     "*/5 * * * *",
}, dbos.WithScheduleQueueName("scheduled_queue"))
```

This ensures that scheduled workflow executions respect the queue's flow control settings.

### Managing Schedules from Another Application

You can manage schedules from outside your DBOS application using the [DBOS Client](../reference/client.md#schedule-management).
The client accepts workflow names as strings instead of function references:

```go
client, err := dbos.NewClient(context.Background(), dbos.ClientConfig{
    DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
})

err = client.CreateSchedule(dbos.ClientScheduleInput{
    ScheduleName: "my-task-schedule",
    WorkflowName: "myPeriodicTask",
    Schedule:     "*/5 * * * *",
    Context:      "my context",
})
```

### How Scheduling Works

Under the hood, DBOS constructs an [idempotency key](./workflow-tutorial.md#workflow-ids-and-idempotency) for each scheduled workflow execution.
The key is the concatenation of `sched-`, the schedule name, and the scheduled time (RFC3339), ensuring each scheduled invocation occurs exactly once even when multiple application instances share the same schedule.

For the full API reference, see [Workflow Schedules](../reference/methods.md#workflow-schedules).