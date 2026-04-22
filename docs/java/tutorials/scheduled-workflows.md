---
sidebar_position: 70
title: Scheduled Workflows
description: Learn how to run DBOS workflows on a schedule.
---

You can schedule DBOS [workflows](./workflow-tutorial.md) to run automatically on a cron schedule.
Scheduled workflows are **exactly-once**: DBOS assigns each firing a deterministic workflow ID derived from the schedule name and scheduled time, so even if your application restarts mid-execution, each scheduled invocation runs exactly once.

## Scheduled Workflow Signature

A workflow invoked by a schedule must accept exactly two `Instant` arguments:

```java
@Workflow
public void myWorkflow(Instant scheduled, Instant actual) {
    // scheduled: the time this run was supposed to fire
    // actual: the time it actually started executing
}
```

- **`scheduled`**: The exact cron fire time (used for the workflow ID; always precise).
- **`actual`**: The time the workflow actually began executing (may be slightly later).

## Declaring Schedules with `applySchedules`

The recommended way to declare schedules is to call `dbos.applySchedules()` once after `dbos.launch()`. This atomically creates or replaces the named schedules, so your code is always the source of truth:

```java
DBOS dbos = new DBOS(config);
Example proxy = dbos.registerProxy(Example.class, new ExampleImpl(dbos));
dbos.launch();

dbos.applySchedules(
    new WorkflowSchedule("every-minute", "everyMinute", "com.example.ExampleImpl", "0 * * * * *"),
    new WorkflowSchedule("daily-report", "dailyReport", "com.example.ExampleImpl", "0 0 9 * * *")
        .withCronTimezone(ZoneId.of("America/New_York"))
);
```

`applySchedules` is idempotent: re-running it on every startup always results in the declared set of schedules, with no duplicates.

### WorkflowSchedule Parameters

```java
new WorkflowSchedule(String scheduleName, String workflowName, String className, String cron)
```

- **scheduleName**: A unique name for this schedule (used for management operations).
- **workflowName**: The name of the workflow method to invoke (as registered, or as set by `@Workflow(name=...)`).
- **className**: The fully-qualified class name, or the short name set by [`@WorkflowClassName`](../reference/workflows-steps.md#workflowclassname).
- **cron**: A [Spring 5.3+ CronExpression](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/CronExpression.html).

Common optional configuration via `with` methods:

| Method | Description |
|--------|-------------|
| `withCronTimezone(ZoneId)` | Interpret the cron in this timezone (default: UTC). |
| `withAutomaticBackfill(true)` | Retroactively start any firings missed while the app was down. |
| `withQueueName(String)` | Enqueue executions on this queue instead of the default scheduler queue. |
| `withStatus(ScheduleStatus.PAUSED)` | Create the schedule in a paused state. |
| `withContext(Object)` | Attach a serializable context object passed to the workflow. |

## Runtime Schedule Management

Schedules can also be created, paused, resumed, and deleted at runtime:

```java
// Create a schedule at runtime (throws if name already exists)
dbos.createSchedule(
    new WorkflowSchedule("on-demand", "processReport", "com.example.ReportImpl", "0 0 * * * *"));

// Pause and resume
dbos.pauseSchedule("daily-report");
dbos.resumeSchedule("daily-report");

// Inspect
Optional<WorkflowSchedule> s = dbos.getSchedule("every-minute");
List<WorkflowSchedule> active = dbos.listSchedules(
    List.of(ScheduleStatus.ACTIVE), null, null);

// Delete
dbos.deleteSchedule("on-demand");
```

## Backfill

If your application was down for a period and you need to retroactively run the scheduled workflows that were missed, use `backfillSchedule`:

```java
Instant start = Instant.parse("2025-01-01T00:00:00Z");
Instant end   = Instant.parse("2025-01-02T00:00:00Z");
List<WorkflowHandle<Object, Exception>> handles =
    dbos.backfillSchedule("every-minute", start, end);
```

DBOS uses the same deterministic workflow IDs as the live scheduler, so executions that already ran are skipped.

You can also enable **automatic backfill** on a schedule so DBOS does this for you on every startup:

```java
new WorkflowSchedule("every-minute", "everyMinute", "com.example.ExampleImpl", "0 * * * * *")
    .withAutomaticBackfill(true)
```

## Triggering a Schedule Immediately

To fire a scheduled workflow immediately outside its normal cadence:

```java
WorkflowHandle<?, ?> handle = dbos.triggerSchedule("daily-report");
```

## Using the `@Scheduled` Annotation

As an alternative to the programmatic API, you can annotate a workflow method directly:

```java
@Workflow
@Scheduled(cron = "0 * * * * *")  // Run at the start of every minute
public void everyMinute(Instant scheduled, Instant actual) {
    logger.info("Scheduled at {}, running at {}", scheduled, actual);
}
```

DBOS registers `@Scheduled` workflows automatically at launch — no call to `applySchedules` needed.

The annotation supports the same `queue` and `ignoreMissed` (`true` = skip missed firings) options, but does not support timezone, context, or runtime management. Use the `WorkflowSchedule` API when you need those features.

See the [`@Scheduled` reference](../reference/workflows-steps.md#scheduled) for full parameter details.
