---
sidebar_position: 60
title: Scheduling Workflows
---

You can schedule DBOS [workflows](./workflow-tutorial.md) to run on a cron schedule.
Schedules are stored in the database and can be created, paused, resumed, and deleted at runtime.
Each time a schedule fires, its workflow is executed by exactly one worker process.

To schedule a workflow, first define a workflow whose input is a [`ScheduledWorkflowInput`](https://docs.rs/dbos/latest/dbos/struct.ScheduledWorkflowInput.html).
It carries the cron tick the run is for (`scheduled_time`) and a `context` value attached to the schedule, whose type you choose:

```rust
#[derive(Serialize, Deserialize)]
struct ReportContext {
    region: String,
}

async fn nightly_report(input: ScheduledWorkflowInput<ReportContext>) -> dbos::Result<()> {
    println!(
        "Report for {} at {:?}",
        input.context.region, input.scheduled_time
    );
    Ok(())
}
```

Then, after launch, create a schedule for it using [`create_schedule`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.create_schedule) with a [`ScheduleSpec`](https://docs.rs/dbos/latest/dbos/struct.ScheduleSpec.html) containing a [crontab](https://en.wikipedia.org/wiki/Cron) expression.
[`ScheduleSpec::new`](https://docs.rs/dbos/latest/dbos/struct.ScheduleSpec.html#method.new) takes the workflow's `WorkflowRef`, so a context the workflow can't read doesn't compile:

```rust
async fn create(dbos: &DBOS) -> dbos::Result<()> {
    // Registered before launch:
    let report = dbos.register_workflow("nightly_report", nightly_report)?;
    dbos.launch().await?;

    // Every day at 2am.
    let context = ReportContext {
        region: "emea".to_owned(),
    };
    let mut spec = ScheduleSpec::new("nightly-emea", &report, "0 2 * * *", &context)?;
    spec.cron_timezone = Some("Europe/Paris".to_owned());
    dbos.create_schedule(&spec).await?;
    Ok(())
}
```

`create_schedule` fails if a schedule with the same name already exists, and checks the cron expression, the timezone, and that this process has registered the workflow before it writes anything.
If you're defining a set of static schedules to be created on program start, you can instead use [`apply_schedules`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.apply_schedules) to create them atomically, updating them if they already exist:

```rust
async fn apply(
    dbos: &DBOS,
    report: &dbos::WorkflowRef<ScheduledWorkflowInput<ReportContext>, ()>,
) -> dbos::Result<()> {
    let emea = ReportContext {
        region: "emea".to_owned(),
    };
    let amer = ReportContext {
        region: "amer".to_owned(),
    };
    dbos.apply_schedules(&[
        ScheduleSpec::new("nightly-emea", report, "0 2 * * *", &emea)?,
        ScheduleSpec::new("nightly-amer", report, "0 8 * * *", &amer)?,
    ])
    .await?;
    Ok(())
}
```

When `apply_schedules` updates an existing schedule, it replaces the entire definition with the new entry, so any optional field left unset is cleared.
For example, if a schedule was routed to a named queue and you re-apply it without setting `queue_name`, it reverts to the internal queue.
The schedule's status and last-fired time are preserved, so re-applying doesn't resume a paused schedule or re-run a tick.

DBOS accepts cron expressions of five or six fields; with six, the first is seconds, and a five-field expression fires at second zero:

```
 ┌────────────── second (optional)
 │ ┌──────────── minute
 │ │ ┌────────── hour
 │ │ │ ┌──────── day of month
 │ │ │ │ ┌────── month
 │ │ │ │ │ ┌──── day of week
 │ │ │ │ │ │
 * * * * * *
```

The expressions also accept nicknames (`@daily`, `@hourly`, and so on), month and weekday names, and `L`, `W` and `#` in the day fields.
When both day-of-month and day-of-week are restricted, both must match, so `0 0 13 * 5` is Friday the 13th.
See [`ScheduleSpec`](https://docs.rs/dbos/latest/dbos/struct.ScheduleSpec.html#the-cron-dialect) for the full syntax.
To learn more about crontab syntax, see [this crontab editor](https://crontab.guru/).

Cron expressions are evaluated in UTC by default.
Set the `cron_timezone` field of `ScheduleSpec` to an [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (e.g. `"America/New_York"`) to evaluate the expression in a different timezone.

### Managing Schedules

You can pause, resume, update, list, and delete schedules at runtime.
The running executors notice a change within a polling interval, with no restart:

```rust
async fn manage(dbos: &DBOS) -> dbos::Result<()> {
    dbos.pause_schedule("nightly-emea").await?;
    dbos.resume_schedule("nightly-emea").await?;

    // Change one field, leaving the rest as they are.
    let change = ScheduleChange {
        schedule: Change::Set("0 3 * * *"),
        ..ScheduleChange::default()
    };
    dbos.update_schedule("nightly-emea", &change).await?;

    for schedule in dbos.list_schedules(&ScheduleFilter::default()).await? {
        println!("{} {:?}", schedule.schedule_name(), schedule.status());
    }
    if let Some(schedule) = dbos.get_schedule("nightly-emea").await? {
        let context: ReportContext = schedule.decode_context()?;
    }

    dbos.delete_schedule("nightly-emea").await?;
    Ok(())
}
```


### Backfilling and Triggering

[`backfill_schedule`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.backfill_schedule) enqueues every tick of a schedule between two times.
A tick that already ran is not run again, so it is safe to backfill a window that overlaps runs that happened.
[`trigger_schedule`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.trigger_schedule) runs a schedule's workflow once, now:

```rust
async fn backfill(dbos: &DBOS) -> dbos::Result<()> {
    // Run every tick of the last week that hasn't run yet.
    let end = SystemTime::now();
    let start = end - Duration::from_secs(7 * 24 * 60 * 60);
    let handles: Vec<WorkflowHandle<()>> =
        dbos.backfill_schedule("nightly-emea", start, end).await?;

    // Run the schedule's workflow once, now.
    let handle: WorkflowHandle<()> = dbos.trigger_schedule("nightly-emea").await?;
    Ok(())
}
```

To have an executor backfill the ticks it missed whenever it starts (after a restart or a deploy), set `automatic_backfill: true` on the `ScheduleSpec`.
`apply_schedules`, `backfill_schedule` and `trigger_schedule` can't be called from inside a workflow, because none of them is recorded as a step.

### Scheduling to Queues

By default, each tick is enqueued on DBOS's internal queue.
To run a schedule's workflows under a queue's [flow control](./queue-tutorial.md), name the queue in the spec; the queue must be registered:

```rust
fn on_a_queue(spec: &mut ScheduleSpec) {
    spec.queue_name = Some("reports".to_owned());
}
```

### Managing Schedules from Another Application

A [`Client`](https://docs.rs/dbos/latest/dbos/struct.Client.html) has the same schedule operations.
It has no registered workflows, so build the spec with [`ScheduleSpec::for_workflow`](https://docs.rs/dbos/latest/dbos/struct.ScheduleSpec.html#method.for_workflow), which names the workflow instead:

```rust
async fn schedule_from_client() -> dbos::Result<()> {
    let client = Client::connect(ClientConfig::from_env()).await?;
    let context = ReportContext {
        region: "apac".to_owned(),
    };
    let mut spec =
        ScheduleSpec::for_workflow("nightly-apac", "nightly_report", "0 2 * * *", &context)?;
    // The application that runs the schedule's workflows.
    spec.app_name = Some("reporting".to_owned());
    client.create_schedule(&spec).await?;
    client.close().await;
    Ok(())
}
```

### How Scheduling Works

Every executor of the schedule's application fires it: each computes the next tick, waits for it, and enqueues the workflow under a workflow ID derived from the schedule name and the tick.
That ID is an [idempotency key](./workflow-tutorial.md#workflow-ids-and-idempotency), so each tick runs once however many executors woke for it.

When a schedule fires, its workflow is enqueued by name rather than invoked directly, so the process hosting the schedule does not need to have the workflow registered.
Name resolution happens at dequeue time on a worker that has the function, letting any process connected to the system database drive schedules for workflows owned by other processes or languages.
Scheduled workflows always run against their owning application's latest registered version, so a stale executor does not pick them up after a new deploy.

You can list the workflows started by a schedule with the `schedule_names` field of [`WorkflowFilter`](./workflow-management.md#listing-workflows).
