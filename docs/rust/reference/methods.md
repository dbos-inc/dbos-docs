---
sidebar_position: 40
title: DBOS Methods & Functions
toc_max_heading_level: 3
---

Most operations come in two forms:

- a **free function** in the `dbos` crate, for use inside a workflow. It finds the running workflow on its own and records the call as a step, so a recovery doesn't repeat it. Outside a workflow, it returns `Error::NotInWorkflow`.
- a **method** of the same operation on [`DBOS`](./lifecycle.md), for use outside a workflow, and on [`Client`](./client.md), from another application.

Don't capture the `DBOS` instance in a workflow to call its methods: the instance owns the workflow, so the two would keep each other alive.
Starting a child workflow needs the child's `WorkflowRef`, which holds the instance; that is a known limitation, harmless for a process that launches once.

Every free function and most methods return a [`PendingStep`](./workflows-steps.md#pendingstep), which takes its step ID when it is built, or a [`PendingStart`](./workflows-steps.md#pendingstart) for calls that start a workflow.
The free functions take the calling workflow's error type `E`, so `?` works on them in any workflow.

Full API documentation is on [docs.rs](https://docs.rs/dbos/latest/dbos/).

## Workflow Context

### workflow_id

```rust
pub fn workflow_id() -> Option<String>;
```

The ID of the workflow the caller is running in, or `None` outside one.

### step_id

```rust
pub fn step_id() -> Option<i32>;
```

Inside a step, its step ID (counted from zero); otherwise `None`.

### step_status

```rust
pub fn step_status() -> Option<StepStatus>;
```

Inside a step, a [`StepStatus`](https://docs.rs/dbos/latest/dbos/struct.StepStatus.html) with `step_id()`, `current_attempt()` (counted from one) and `max_attempts()`; otherwise `None`.

### cancellation_token

```rust
pub fn cancellation_token() -> CancellationToken;
```

A [`CancellationToken`](https://docs.rs/tokio-util/latest/tokio_util/sync/struct.CancellationToken.html) that fires when DBOS abandons the current step attempt: a step timeout, a lost `select_step!` race, the workflow's timeout, shutdown, or the cancellation of a `preemptible` step.
An ordinary cancel doesn't fire it, and neither does an attempt that finishes.
Outside a step it returns a token that never fires, so code that also runs outside a workflow needs no second path.
Use it to stop work that dropping the step's future can't reach, such as a `spawn_blocking` thread.

## Durable Sleep

### sleep

```rust
pub fn sleep<E: DurableError>(duration: Duration) -> PendingStep<'static, (), E>;
```

Sleep for `duration`, durably: the wake time is recorded before the wait, so a recovered workflow wakes at the original time rather than starting the wait again.
Outside a workflow, or inside a step, it is a plain sleep.
Durations too long to store are refused with `Error::InvalidArgument`.

```rust
dbos::sleep(Duration::from_secs(24 * 60 * 60)).await?;
```

## Messages

### send

```rust
pub fn send<T: Serialize, E: DurableError>(destination_id: &str, message: &T) -> PendingStep<'static, (), E>;

impl DBOS {
    pub fn send<T: Serialize>(&self, destination_id: &str, message: &T) -> PendingStep<'static, ()>;
}
```

Send a message to a workflow, on the default topic, for it to [`recv`](#recv).
Messages are stored, so a message sent before the workflow reaches `recv` waits for it.
From a workflow body, the send is recorded, so it happens exactly once.
From inside a step it runs plainly and happens again if the step is retried; give the message an `idempotency_key` to prevent that.

### send_with

```rust
pub fn send_with<T: Serialize, E: DurableError>(message: SendMessage<'_, T>, options: SendOptions) -> PendingStep<'static, (), E>;

impl DBOS {
    pub fn send_with<T: Serialize>(&self, message: SendMessage<'_, T>, options: SendOptions) -> PendingStep<'static, ()>;
}
```

[`send`](#send), with a [`SendMessage`](https://docs.rs/dbos/latest/dbos/struct.SendMessage.html) and [`SendOptions`](https://docs.rs/dbos/latest/dbos/struct.SendOptions.html).

`SendMessage` fields (build with `SendMessage::new(destination_id, &message)` and struct update syntax):
- **destination_id**: The workflow the message is for.
- **message**: The payload.
- **topic**: The topic. Default: `None`, the default topic. A `recv` on another topic doesn't see it.
- **idempotency_key**: A key that makes sending the message again a no-op. Default: `None`. For senders no step protects: a `Client`, or a send from inside a step.

`SendOptions` fields (build with `..SendOptions::default()`):
- **send_to_forks**: [`Forks::Skip`](https://docs.rs/dbos/latest/dbos/enum.Forks.html) (default) sends to the destination only; `Forks::Include` also to every workflow forked from it.
- **serialization**: A [`SerializationFormat`](./workflows-steps.md#serializationformat). `Portable` for a message a workflow in another language receives.

```rust
let message = SendMessage {
    topic: Some("payment_status"),
    ..SendMessage::new("order-123", &"paid")
};
dbos.send_with(message, SendOptions::default()).await?;
```

### send_bulk

```rust
pub fn send_bulk<T: Serialize, E: DurableError>(messages: &[SendMessage<'_, T>]) -> PendingStep<'static, (), E>;
pub fn send_bulk_with<T: Serialize, E: DurableError>(messages: &[SendMessage<'_, T>], options: SendOptions) -> PendingStep<'static, (), E>;
```

Send many messages in one transaction: all of them, or none.
`DBOS` and `Client` have the same methods.

### recv

```rust
pub fn recv<'a, T: DeserializeOwned, E: DurableError>(topic: Option<&'a str>, timeout: Duration) -> PendingStep<'a, Option<T>, E>;
```

Wait up to `timeout` for the oldest message on `topic` (or the default topic, for `None`) sent to this workflow, consume it, and return it; `None` if none arrives in time.
The wait's deadline is recorded, so a recovered workflow waits only for what is left of it.
Workflow body only: it returns `Error::InsideStep` inside a step and `Error::NotInWorkflow` outside a workflow.

```rust
let status: Option<String> = dbos::recv(Some("payment_status"), Duration::from_secs(3600)).await?;
```

## Events

### set_event

```rust
pub fn set_event<'a, T: Serialize, E: DurableError>(key: &'a str, value: &T) -> PendingStep<'a, (), E>;
pub fn set_event_with<'a, T: Serialize, E: DurableError>(key: &'a str, value: &T, options: SetEventOptions) -> PendingStep<'a, (), E>;
```

Publish a key-value pair on the calling workflow, or replace the value if the key was published already.
Workflow body only: it returns `Error::InsideStep` inside a step.
[`SetEventOptions`](https://docs.rs/dbos/latest/dbos/struct.SetEventOptions.html) has one field, `serialization`.

### get_event

```rust
pub fn get_event<'a, T: DeserializeOwned, E: DurableError>(workflow_id: &'a str, key: &'a str, timeout: Duration) -> PendingStep<'a, Option<T>, E>;

impl DBOS {
    pub fn get_event<'a, T: DeserializeOwned>(&self, workflow_id: &'a str, key: &'a str, timeout: Duration) -> PendingStep<'a, Option<T>>;
}
```

Read the latest value a workflow published for `key`, waiting up to `timeout` for it to be published; `None` if it isn't in time.
Inside a workflow, the value read is recorded, so a recovery reads the same value even if the event has since changed.
Inside a step, it reads plainly.

```rust
let url: Option<String> = dbos.get_event(&workflow_id, "payment_url", Duration::from_secs(60)).await?;
```

## Streams

### write_stream

```rust
pub fn write_stream<'a, T: Serialize, E: DurableError>(key: &'a str, value: &T) -> PendingStep<'a, (), E>;
pub fn write_stream_with<'a, T: Serialize, E: DurableError>(key: &'a str, value: &T, options: WriteStreamOptions) -> PendingStep<'a, (), E>;
```

Append a value to stream `key` of the calling workflow.
From the workflow body the write is recorded, so it happens exactly once; from inside a step it is a plain write that happens again if the step is retried.
[`WriteStreamOptions`](https://docs.rs/dbos/latest/dbos/struct.WriteStreamOptions.html) has one field, `serialization`.

### close_stream

```rust
pub fn close_stream<'a, E: DurableError>(key: &'a str) -> PendingStep<'a, (), E>;
```

Close stream `key`, so its readers end once they reach the close.

### read_stream

```rust
pub fn read_stream<T: DeserializeOwned, E: DurableError>(workflow_id: &str, key: &str, options: ReadStreamOptions) -> StreamReader<T, E>;
pub fn read_stream_from<T: DeserializeOwned, E: DurableError>(workflow_id: &str, key: &str, offset: i32, options: ReadStreamOptions) -> StreamReader<T, E>;

impl DBOS {
    pub fn read_stream<T: DeserializeOwned>(&self, workflow_id: &str, key: &str, options: ReadStreamOptions) -> StreamReader<T>;
    pub fn read_stream_from<T: DeserializeOwned>(&self, workflow_id: &str, key: &str, offset: i32, options: ReadStreamOptions) -> StreamReader<T>;
}
```

Read a workflow's stream from the beginning, or from `offset`, as a [`StreamReader`](https://docs.rs/dbos/latest/dbos/struct.StreamReader.html):

- `next()` waits for the next value and returns it, or `None` once the reader reaches the close, or the end of the stream after the workflow has finished. Inside a workflow, each value read is recorded.
- `offset()` is the offset of the next value, for starting a later read where this one stopped.

[`ReadStreamOptions`](https://docs.rs/dbos/latest/dbos/struct.ReadStreamOptions.html) fields:
- **polling_interval**: How often to look again when nothing wakes the reader. Default: 1 second; at least 1 millisecond.
- **timeout**: How long to wait for each value. Default: `None`, as long as the workflow runs. Expiry is `Error::StreamTimeout`.

```rust
let mut reader = dbos.read_stream::<Progress>(&workflow_id, "progress", ReadStreamOptions::default());
while let Some(progress) = reader.next().await? {
    println!("item {}", progress.item);
}
```

### read_stream_value

```rust
pub fn read_stream_value<'a, T: DeserializeOwned, E: DurableError>(workflow_id: &'a str, key: &'a str, offset: i32, options: ReadStreamOptions) -> PendingStep<'a, T, E>;
```

Read the one value at `offset`, waiting for it to be written.
If the stream ends with nothing there, it returns `Error::StreamTimeout`.
`DBOS` and `Client` have the same method.

## Workflow Management

Each operation below is listed by its `DBOS` method; the free function for use inside a workflow is named beside it.
The [Client](./client.md) has the same methods.
The type parameters `R` and `E` on calls that return a handle state the workflow's result and error types; nothing checks them until the result is decoded.

### retrieve_workflow

```rust
impl DBOS {
    pub fn retrieve_workflow<R, E>(&self, workflow_id: &str) -> dbos::Result<WorkflowHandle<R, E>>;
}
pub fn retrieve_workflow<R, E: DurableError>(workflow_id: &str) -> dbos::Result<WorkflowHandle<R, E>, E>;
```

A [`WorkflowHandle`](./workflows-steps.md#workflowhandle) to an existing workflow, by ID.

### list_workflows

```rust
impl DBOS {
    pub fn list_workflows<'a>(&self, filter: &'a WorkflowFilter<'a>) -> PendingStep<'a, Vec<WorkflowRecord>>;
}
// Free function: dbos::list_workflows(filter)
```

The workflows matching a [`WorkflowFilter`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.WorkflowFilter.html), oldest first unless `sort_desc` is set.
Build a filter with `..WorkflowFilter::default()`; every field narrows the result, and an empty one doesn't filter:

- **workflow_ids**, **workflow_id_prefixes**: By ID, or ID prefix.
- **names**: Registered workflow names.
- **status**: [`WorkflowStatus`](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.WorkflowStatus.html) values.
- **app_versions**, **executor_ids**, **authenticated_users**: By version, executor, or user.
- **queue_names**, **queues_only**: By queue, or only workflows that were enqueued.
- **schedule_names**: Workflows started by these schedules.
- **deduplication_ids**, **is_debounced**: By deduplication ID, or whether a debouncer created them.
- **parent_workflow_ids**, **has_parent**: By parent, or whether there is one.
- **forked_from**, **is_fork**, **was_forked_from**: Fork lineage.
- **created_after**/**created_before**, **started_after**/**started_before**, **completed_after**/**completed_before**: Time ranges.
- **attributes**: JSON the workflow's attributes must contain, such as `r#"{"customer": "acme"}"#`.
- **app_scope**: Whose workflows: [`AppScope`](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.AppScope.html)`::Unset` (default: this application's and unclaimed ones for a search, every application's for a lookup by ID), `Any`, or `Named(names)`.
- **limit**, **offset**, **sort_desc**: Paging and order.
- **load_input**, **load_output**: Whether to read the encoded input and output.

Each [`WorkflowRecord`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.WorkflowRecord.html) carries the workflow's ID, status, name, encoded input, output and error, executor, app version, recovery attempts, queue, timestamps, parent and fork lineage, deduplication ID, priority, partition key, schedule, timeout and deadline, delay, and attributes.

### list_workflow_steps

```rust
impl DBOS {
    pub fn list_workflow_steps<'a>(&self, workflow_id: &'a str) -> PendingStep<'a, Vec<StepRecord>>;
    pub fn list_workflow_steps_with<'a>(&self, workflow_id: &'a str, options: ListWorkflowStepsOptions) -> PendingStep<'a, Vec<StepRecord>>;
}
// Free functions: dbos::list_workflow_steps(id), dbos::list_workflow_steps_with(id, options)
```

A workflow's recorded steps, in execution order.
Each [`StepRecord`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.StepRecord.html) has `step_id`, `step_name`, the encoded `output` or `error`, `child_workflow_id` for a step that started a child, and `started_at`/`completed_at`.
[`ListWorkflowStepsOptions`](https://docs.rs/dbos/latest/dbos/struct.ListWorkflowStepsOptions.html): `load_output` (default `true`), `limit`, `offset`.

### cancel

```rust
impl DBOS {
    pub fn cancel<'a>(&self, workflow_id: &'a str) -> PendingStep<'a, ()>;
    pub fn cancel_all<'a>(&self, workflow_ids: &'a [&'a str], children: Children) -> PendingStep<'a, Vec<String>>;
}
// Free functions: dbos::cancel_workflow(id), dbos::cancel_workflows(ids, children)
```

Mark workflows `CANCELLED` and remove enqueued ones from their queues.
A running workflow isn't interrupted: the execution running it loses ownership, its step in progress runs to its end without being recorded, and its next durable call fails with `Error::WorkflowCancelled`.
`cancel_all` returns the IDs it cancelled.
[`Children`](https://docs.rs/dbos/latest/dbos/enum.Children.html)`::Include` also cancels every descendant; `Skip` only the workflows named.
A workflow can't cancel itself.

### resume

```rust
impl DBOS {
    pub fn resume<'a, R, E>(&self, workflow_id: &'a str) -> PendingStart<'a, R, E, EngineOnly>;
    pub fn resume_with<'a, R, E>(&self, workflow_id: &'a str, options: ResumeOptions<'a>) -> PendingStart<'a, R, E, EngineOnly>;
    pub fn resume_all<'a, R, E>(&self, workflow_ids: &'a [&'a str], options: ResumeOptions<'a>) -> PendingStep<'a, Vec<WorkflowHandle<R, E>>>;
}
// Free functions: dbos::resume_workflow(id), dbos::resume_workflow_with(id, options), dbos::resume_workflows(ids, options)
```

Resume workflows from their last recorded step: a cancelled workflow, one that exceeded its recovery attempts, or an enqueued one, bypassing its queue.
The workflow is put on DBOS's internal queue, or the queue named by [`ResumeOptions`](https://docs.rs/dbos/latest/dbos/struct.ResumeOptions.html)`::queue_name`, and its recovery-attempt count is reset.
Returns a handle to each.
A workflow can't resume itself.

### fork

```rust
impl DBOS {
    pub fn fork<'a, R, E>(&self, workflow_id: &'a str, start_step: i32) -> PendingStart<'a, R, E, EngineOnly>;
    pub fn fork_with<'a, R, E>(&self, fork: Fork<'a>, options: ForkOptions<'a>) -> PendingStart<'a, R, E, EngineOnly>;
    pub fn fork_all<'a, R, E>(&self, forks: &'a [Fork<'a>], options: ForkOptions<'a>) -> PendingStep<'a, Vec<WorkflowHandle<R, E>>>;
}
// Free functions: dbos::fork_workflow(id, start_step), dbos::fork_workflow_with(fork, options), dbos::fork_workflows(forks, options)
```

Start a new workflow that copies the original's input and its steps before `start_step`, and runs from `start_step`.
[`Fork`](https://docs.rs/dbos/latest/dbos/struct.Fork.html): `original_id`, `start_step`, and `forked_id` (default: generated).
[`ForkOptions`](https://docs.rs/dbos/latest/dbos/struct.ForkOptions.html), shared by every fork of a call:
- **app_version**: The version that runs the fork. Default: the original's.
- **queue_name**, **queue_partition_key**: The queue the fork is enqueued on. Default: DBOS's internal queue. A partitioned queue needs a key.
- **timeout**: The fork's timeout. Default: `None`, no deadline.
- **replacement_children**: `(original_child_id, new_child_id)` pairs, pointing the fork's recorded child starts at children that were forked too.

### rewind

```rust
impl DBOS {
    pub fn rewind<'a, R, E>(&self, workflow_id: &'a str) -> PendingStart<'a, R, E, EngineOnly>;
    pub fn rewind_with<'a, R, E>(&self, workflow_id: &'a str, options: RewindOptions<'a>) -> PendingStart<'a, R, E, EngineOnly>;
}
// Free functions: dbos::rewind_workflow(id), dbos::rewind_workflow_with(id, options)
```

Re-run a finished workflow (`SUCCESS`, `ERROR` or `CANCELLED`) under the same ID: its steps from `start_step` on are discarded, its outcome cleared, and it is re-enqueued.
[`RewindOptions`](https://docs.rs/dbos/latest/dbos/struct.RewindOptions.html): `start_step` (default 0, the whole workflow), `app_version`, `queue_name`, `queue_partition_key`.
Rewinding an unfinished workflow returns `dbos::sysdb::Error::WorkflowNotRewindable`; cancel it first.

### delete

```rust
impl DBOS {
    pub fn delete<'a>(&self, workflow_id: &'a str) -> PendingStep<'a, ()>;
    pub fn delete_all<'a>(&self, workflow_ids: &'a [&'a str], children: Children) -> PendingStep<'a, u64>;
}
// Free functions: dbos::delete_workflow(id), dbos::delete_workflows(ids, children)
```

Remove workflows and everything recorded for them: steps, input, outcome, events, messages and streams.
A running workflow is deleted too, and its execution fails at its next step; cancel it first.
An unknown ID is not an error.
`delete_all` returns how many workflows it deleted.

### set_workflow_delay

```rust
impl DBOS {
    pub fn set_workflow_delay<'a>(&self, workflow_id: &'a str, delay: WorkflowDelay) -> PendingStep<'a, ()>;
}
// Free function: dbos::set_workflow_delay(id, delay)
```

Change when a delayed workflow may start: [`WorkflowDelay`](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.WorkflowDelay.html)`::For(duration)` from now, on the database's clock, or `Until(timestamp)`.

### update_workflow_attributes

```rust
impl DBOS {
    pub fn update_workflow_attributes<'a>(&self, workflow_id: &'a str, attributes: Option<&serde_json::Map<String, serde_json::Value>>) -> PendingStep<'a, ()>;
    pub fn merge_workflow_attributes<'a>(&self, workflow_id: &'a str, attributes: &serde_json::Map<String, serde_json::Value>) -> PendingStep<'a, ()>;
}
// Free functions: dbos::update_workflow_attributes, dbos::merge_workflow_attributes
```

Replace a workflow's attributes (or clear them with `None`), or merge keys into them.
An unknown workflow ID fails with `dbos::sysdb::Error::NonExistentWorkflow`.

### select_workflow and join_workflows

`DBOS::select_workflow(ids)` and `DBOS::join_workflows(ids)` are the outside-a-workflow forms of [`select_workflow`](./workflows-steps.md#select_workflow) and [`join_workflows`](./workflows-steps.md#join_workflows).

## Schedules

These are methods of `DBOS` (and of `Client`), for use outside a workflow; there are no free-function forms.
See the [scheduling tutorial](../tutorials/scheduled-workflows.md).

### ScheduleSpec

```rust
pub struct ScheduleSpec {
    pub schedule_name: String,
    pub schedule: String,
    pub workflow: QualifiedWorkflowName,
    pub automatic_backfill: bool,
    pub cron_timezone: Option<String>,
    pub queue_name: Option<String>,
    pub app_name: Option<String>,
    // and the context, set by the constructor
}

impl ScheduleSpec {
    pub fn new<C: Serialize, R, E>(schedule_name: impl Into<String>, workflow: &WorkflowRef<ScheduledWorkflowInput<C>, R, E>, schedule: impl Into<String>, context: &C) -> dbos::Result<Self>;
    pub fn for_workflow<C: Serialize>(schedule_name: impl Into<String>, workflow: impl Into<QualifiedWorkflowName>, schedule: impl Into<String>, context: &C) -> dbos::Result<Self>;
}
```

A schedule's definition. `new` takes the workflow's `WorkflowRef`, so a context the workflow can't read doesn't compile; `for_workflow` names the workflow, for a client.

- **schedule_name**: Unique across every application sharing the database.
- **schedule**: A cron expression of five fields, or six with seconds first. Nicknames (`@daily`, `@hourly`, ...), month and weekday names, `?`, and `L`, `W` and `#` are accepted; when day-of-month and day-of-week are both restricted, both must match. A pattern that can never fire is refused.
- **automatic_backfill**: Whether an executor first runs the ticks missed since the schedule last fired. Default: `false`.
- **cron_timezone**: An IANA timezone. Default: `None`, UTC.
- **queue_name**: The queue each tick is enqueued on. Default: DBOS's internal queue.
- **app_name**: The application that owns the schedule. Default: the caller's.

The scheduled workflow takes a [`ScheduledWorkflowInput<C>`](https://docs.rs/dbos/latest/dbos/struct.ScheduledWorkflowInput.html), with `scheduled_time: SystemTime` and `context: C`.

### create_schedule

```rust
pub fn create_schedule<'a>(&self, spec: &'a ScheduleSpec) -> PendingStep<'a, ()>;
```

Create a schedule. Fails if the name is taken, the cron expression or timezone is invalid, this process hasn't registered the workflow, or the queue isn't registered.

### apply_schedules

```rust
pub async fn apply_schedules(&self, specs: &[ScheduleSpec]) -> dbos::Result<()>;
```

Create or replace a set of schedules in one transaction.
A replaced schedule takes the new definition whole (unset fields are cleared) but keeps its status and last-fired time.
Refused inside a workflow.

### list_schedules and get_schedule

```rust
pub fn list_schedules<'a>(&self, filter: &'a ScheduleFilter<'a>) -> PendingStep<'a, Vec<Schedule>>;
pub fn get_schedule<'a>(&self, name: &'a str) -> PendingStep<'a, Option<Schedule>>;
```

Read schedules. [`ScheduleFilter`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.ScheduleFilter.html): `statuses`, `workflow_names`, `schedule_name_prefixes`, `app_scope`.
A [`Schedule`](https://docs.rs/dbos/latest/dbos/struct.Schedule.html) has `schedule_name()`, `workflow()`, `schedule()`, `status()`, `last_fired_at()`, `automatic_backfill()`, `cron_timezone()`, `queue_name()`, `app_name()`, and `decode_context::<C>()`.

### update_schedule

```rust
pub fn update_schedule<'a>(&self, name: &'a str, change: &'a ScheduleChange<'a>) -> PendingStep<'a, ()>;
```

Change some of a schedule's fields. [`ScheduleChange`](https://docs.rs/dbos/latest/dbos/struct.ScheduleChange.html) has `schedule`, `context`, `automatic_backfill`, `cron_timezone` and `queue_name`, each a `Change::Leave` (default) or `Change::Set(value)`.

### pause_schedule, resume_schedule and delete_schedule

```rust
pub fn pause_schedule<'a>(&self, name: &'a str) -> PendingStep<'a, ()>;
pub fn resume_schedule<'a>(&self, name: &'a str) -> PendingStep<'a, ()>;
pub fn delete_schedule<'a>(&self, name: &'a str) -> PendingStep<'a, ()>;
```

Stop a schedule firing, start it again, or remove it.

### backfill_schedule

```rust
pub async fn backfill_schedule<R, E>(&self, name: &str, start: SystemTime, end: SystemTime) -> dbos::Result<Vec<WorkflowHandle<R, E>>>;
```

Enqueue every tick of a schedule strictly between `start` and `end`, and return a handle to each.
A tick that already ran isn't run again, but its handle is returned.
Refused inside a workflow.

### trigger_schedule

```rust
pub async fn trigger_schedule<R, E>(&self, name: &str) -> dbos::Result<WorkflowHandle<R, E>>;
```

Run a schedule's workflow once, now, with the current time as its `scheduled_time`.
Refused inside a workflow.

## Debouncing

### Debouncer

```rust
pub struct Debouncer<'a, P, R, E = EngineOnly> {
    pub workflow: WorkflowRef<P, R, E>,
    pub queue: Option<&'a str>,
    pub serialization: SerializationFormat,
    pub timeout: Option<Duration>,
    pub attributes: Option<&'a serde_json::Map<String, serde_json::Value>>,
    pub debounce_timeout: Option<Duration>,
    pub app_name: Option<&'a str>,
}

impl<'a, P, R, E> Debouncer<'a, P, R, E> {
    pub fn new(workflow: &WorkflowRef<P, R, E>) -> Self;
    pub fn debounce<'b>(&'b self, key: &str, period: Duration, input: P) -> PendingStart<'b, R, E>;
    pub fn debounce_with<'b>(&'b self, key: &str, period: Duration, input: P, options: DebounceOptions<'_>) -> PendingStart<'b, R, E>;
}
```

Delay a workflow until `period` has passed since the last `debounce` for `key`, then run it once with the latest input.
Every call that coalesces returns a handle to the same workflow.

- **queue**: The queue the debounced workflow waits and runs on, and the scope of its key. Default: DBOS's internal queue.
- **timeout**: The workflow's timeout once it runs. Default: `None`. Never the calling workflow's deadline.
- **debounce_timeout**: The longest the workflow may be held back, counted from the call that created it. Default: `None`, no cap.
- **serialization**, **attributes**, **app_name**: As for an enqueue.

[`DebounceOptions`](https://docs.rs/dbos/latest/dbos/struct.DebounceOptions.html) has `workflow_id`: the ID of a freshly created workflow (a call that coalesces returns the existing one).
Inside a workflow, a debounce is recorded; inside a step it returns `Error::InsideStep`.
A key held by an ordinary deduplicated enqueue, or by another application, fails with `dbos::sysdb::Error::QueueDeduplicated`.

### DebouncerClient

```rust
impl<'a> DebouncerClient<'a> {
    pub fn new(client: &Client, workflow: impl Into<QualifiedWorkflowName>, queue: &'a str) -> Self;
    pub async fn debounce<P: Serialize, R, E>(&self, key: &str, period: Duration, input: P) -> dbos::Result<WorkflowHandle<R, E>>;
    pub async fn debounce_with<P: Serialize, R, E>(&self, key: &str, period: Duration, input: P, options: DebounceOptions<'_>) -> dbos::Result<WorkflowHandle<R, E>>;
}
```

A debouncer for a [`Client`](./client.md), naming the workflow and its queue. Its fields match `Debouncer`'s, plus `app_version`.
