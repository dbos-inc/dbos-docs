---
sidebar_position: 70
title: Scheduled Workflows
description: Learn how to run DBOS workflows on a schedule.
---

You can schedule DBOS [workflows](./workflow-tutorial.md) to run exactly once per time interval.
To do this, annotate the workflow with the [`@Scheduled`](#scheduled) annotation and specify the schedule in [Spring 5.3 CronExpression](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/CronExpression.html) syntax.  For example:

```java
@Workflow
@Scheduled(cron = "0 * * * * *") // Run at the beginning of every minute
public void everyMinute(Instant scheduled, Instant actual) {
    logger.info("I am a workflow scheduled to run once a minute. ");
}
```

Scheduled workflows must take in exactly two arguments: the time that the run was scheduled (as an `Instant`) and the time the run was actually started (as an `Instant`).

### `@Scheduled`
The `@Scheduled` annotation takes the following:
- `cron`: The schedule, expressed in [Spring 5.3+ CronExpression](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/CronExpression.html) syntax.

### How Scheduling Works
Under the hood, DBOS constructs an [idempotency key](./workflow-tutorial.md#workflow-ids-and-idempotency) for each workflow invocation.  The key is a concatenation of the function name and the scheduled time, ensuring each scheduled invocation occurs exactly once while your application is active.