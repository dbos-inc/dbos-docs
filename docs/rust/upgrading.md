---
sidebar_position: 200
title: Upgrading
toc_max_heading_level: 3
---

## Upgrading to 0.6.0

```shell
cargo add dbos@0.6
```

0.6 is a large release with breaking changes to the API and to the system database.
Read [Before you upgrade](#before-you-upgrade) first: **stop every 0.5 executor before you start 0.6**.

### Before you upgrade

#### Stop 0.5, then start 0.6

0.6 recovers the workflows 0.5 left unfinished, but 0.5 and 0.6 executors can't run against one system database at the same time. Upgrade like this:

1. Stop every 0.5 executor. Workflows they were running stay `PENDING`.
2. Rename the system database URL variable, if you use it: 0.6 reads `DBOS_SYSTEM_DATABASE_URL`, not `DBOS_DATABASE_URL`.
3. Start the 0.6 executors **with the same application version and executor ID** (`Config::app_version` or `DBOS__APPVERSION`, and `Config::executor_id` or `DBOS__VMID`) as the 0.5 executors they replace. They migrate the system database at launch, then recover the workflows 0.5 left unfinished: an executor recovers only the workflows recorded under its own executor ID and the running version. The executor ID defaults to `"local"` in both releases, so this only matters if you set it per host.
4. Don't run a 0.5 executor against the database again.

Why 0.5 and 0.6 can't run together: 0.6 stores workflow inputs and outputs in new tables, which 0.5 doesn't read, so a 0.5 executor would run a workflow 0.6 enqueued with no input and report no outcome. A rolling upgrade that mixes the two isn't safe.

What carries over: what 0.5 recorded stays readable and replays under 0.6, with one exception, below. Inputs, outputs and errors in the old columns are still read, rows with no serialization tag read as `rust_serde`, the names of the steps DBOS records for its own operations are unchanged, and 0.5's sleeps, errors and management-call records replay as before.

#### Finish reading streams that 0.5 closed

0.6 doesn't recognise the marker 0.5 wrote when it [closed a stream](./tutorials/workflow-communication.md#workflow-streaming).
A 0.6 reader treats 0.5's close as an ordinary value, can't decode it, and its `next()` (or `read_stream_value` at that offset) fails with `Error::Deserialization` instead of returning `None`.
Values before the close still read, and a read a workflow already recorded under 0.5, including reaching the close, replays as before; the error comes only from reading past where a 0.5 reader had got to.
So before upgrading, finish reading any stream that 0.5 closed, and let 0.5 workflows that read streams complete on 0.5 rather than relying on 0.6 to recover them.
Streams 0.6 closes are unaffected.

If you change the application version or the executor IDs as part of the upgrade, 0.6 won't recover 0.5's workflows. Let them finish on 0.5 first, or [fork](./tutorials/workflow-management.md#forking-workflows) them onto the new version afterwards.

#### System database migrations

At launch (with `Config::migrate` on, the default), 0.6 applies migrations 109 to 125:

| Migrations | Change |
|---|---|
| 109–114 | New `workflow_input` and `workflow_output` tables; `operation_outputs.retention_timestamp` and its index; the `operation_outputs` foreign key to `workflow_status` dropped; the `enqueue_workflow` SQL function rewritten to write to `workflow_input`; a duplicate notifications index dropped |
| 115–120 | Three indexes rebuilt with `INCLUDE (application_name)` |
| 121 | `notifications.consumed_by_function_id` |
| 122 | An index for the workflow-timeout sweep |
| 123 | `workflow_status.creator_xid` |
| 124–125 | Two indexes for finding the latest application version |

These are one-way in practice: once 0.6 has written to the database, 0.5 can't read it correctly. To roll back, restore the database from a backup rather than redeploying 0.5.

### Breaking API changes

#### Configuration

**The environment variable constant is renamed.** `dbos::DATABASE_URL_ENV` (`"DBOS_DATABASE_URL"`) is now `dbos::SYSTEM_DATABASE_URL_ENV` (`"DBOS_SYSTEM_DATABASE_URL"`).

**`polling_concurrency` is an enum**, on `Config` and `ClientConfig`:

```rust
// 0.5
Config { polling_concurrency: None, .. }      // half the pool
Config { polling_concurrency: Some(0), .. }   // no cap
Config { polling_concurrency: Some(8), .. }
// 0.6
Config { polling_concurrency: PollingConcurrency::Default, .. }
Config { polling_concurrency: PollingConcurrency::Unlimited, .. }
Config { polling_concurrency: PollingConcurrency::AtMost(NonZeroU32::new(8).unwrap()), .. }
```

**New fields.** `Config` gains `idle_transaction_timeout` and `scheduler_polling_interval`, and `ClientConfig` gains `idle_transaction_timeout`. A struct literal that lists every field must add them; one built with `..Config::new(..)` needn't.

#### Registering and naming workflows

**`WorkflowKey` is now `QualifiedWorkflowName`**, with private fields read through `name()`, `class_name()` and `config_name()`.
**`register_workflow_as` is removed:** `register_workflow` takes `impl Into<QualifiedWorkflowName>`, so calls with a `&str` name are unchanged.

```rust
// 0.5
dbos.register_workflow_as(WorkflowKey::instance("charge", "Billing", "eu"), body)?;
let name = &workflow.key().name;
// 0.6
dbos.register_workflow(QualifiedWorkflowName::instance("charge", "Billing", "eu"), body)?;
let name = workflow.qualified_name().name();
```

Registration now refuses an empty name, or a config name with no class.
`Error::AlreadyRegistered` and `Error::NotRegistered` hold `{ workflow: QualifiedWorkflowName }` instead of `{ key: String }`.

#### Starting and enqueueing

**`Enqueue` is renamed `QueueRequest`**, with a new `serialization` field:

```rust
// 0.5
StartOptions { queue: Some(Enqueue { priority: Some(1), ..Enqueue::new("orders") }), ..Default::default() }
// 0.6
StartOptions { queue: Some(QueueRequest { priority: Some(1), ..QueueRequest::new("orders") }), ..Default::default() }
```

**`EnqueueOptions` is flat.** `EnqueueOptions::on`, `From<Enqueue>`, the nested `queue` field, and the `class_name` and `config_name` fields are gone.
The queue fields sit on the struct itself, `timeout` is a `Timeout` instead of an `Option<Duration>`, and a class-bound or configured workflow is named with a `QualifiedWorkflowName`:

```rust
// 0.5
client.enqueue_with::<_, R, E>("charge", input, EnqueueOptions {
    workflow_id: Some("order-42"),
    class_name: Some("Billing"),
    config_name: Some("eu"),
    timeout: Some(Duration::from_secs(60)),
    ..EnqueueOptions::on(Enqueue { priority: Some(1), ..Enqueue::new("orders") })
}).await?;
// 0.6
client.enqueue_with::<_, R, E>(QualifiedWorkflowName::instance("charge", "Billing", "eu"), input, EnqueueOptions {
    workflow_id: Some("order-42"),
    priority: Some(1),
    timeout: Timeout::Explicit(Duration::from_secs(60)),
    ..EnqueueOptions::new("orders")
}).await?;
```

**`RunOptions`, `StartOptions` and `EnqueueOptions` gain `workflow_id_reuse_policy`**, defaulting to the 0.5 behaviour.

**Refused start arguments are `Error::InvalidArgument`.** A priority of 0, a zero or oversized delay or timeout, or `ReturnExisting` without a deduplication ID used to be `Error::Config`.

#### Messages

`Message` is renamed `SendMessage`, and `SendOptions` loses its `topic` and `idempotency_key` fields: set them on the `SendMessage`, which already had them.
`SendBulkOptions` is removed: bulk sends take `SendOptions`, whose `forks` field is renamed `send_to_forks`.
`send_with` takes a `SendMessage` and a `SendOptions`, on the free function, `DBOS` and `Client`.
`send` is unchanged for callers, and `send_bulk` callers only rename `Message` to `SendMessage`.

```rust
// 0.5
dbos::send_with("order-42", &"approved", SendOptions { topic: Some("approvals"), ..Default::default() }).await?;
dbos::send_bulk_with(&messages, SendBulkOptions { forks: Forks::Include, ..Default::default() }).await?;
// 0.6
dbos::send_with(SendMessage { topic: Some("approvals"), ..SendMessage::new("order-42", &"approved") }, SendOptions::default()).await?;
dbos::send_bulk_with(&messages, SendOptions { send_to_forks: Forks::Include, ..Default::default() }).await?;
```

#### Fork, resume and management

**`ForkFrom` is removed: fork takes a start step.** Forking from the failed step, `LastStep` and `StepNamed` are gone; find a step with `list_workflow_steps`.
**`fork_with` and `fork_all` take a `Fork` per workflow**, and `ForkOptions` loses `forked_id`:

```rust
// 0.5
dbos.fork::<R, E>("wf", ForkFrom::Step(3)).await?;
dbos.fork_with::<R, E>("wf", ForkFrom::Step(3), ForkOptions { forked_id: Some("wf-retry"), queue: Some("q"), ..Default::default() }).await?;
dbos.fork_all::<R, E>(&["a", "b"], ForkFrom::Step(2), ForkOptions::default()).await?;
// 0.6
dbos.fork::<R, E>("wf", 3).await?;
dbos.fork_with::<R, E>(Fork { forked_id: Some("wf-retry"), ..Fork::new("wf", 3) },
                       ForkOptions { queue_name: Some("q"), ..Default::default() }).await?;
dbos.fork_all::<R, E>(&[Fork::new("a", 2), Fork::new("b", 2)], ForkOptions::default()).await?;
```

**`ForkOptions::queue` and `ResumeOptions::queue` are renamed `queue_name`.** `ForkOptions` gains `replacement_children`.

**`fork`, `fork_with`, `resume` and `resume_with` return a `PendingStart`** instead of a `PendingStep` of a handle. Awaiting them gives the same handle, but they can no longer be a `select_step!` branch.

**"application" is spelled "app" in public names:**

| 0.5 | 0.6 |
|---|---|
| `Client::list_application_versions`, `latest_application_version`, `set_latest_application_version`, `set_latest_application_version_for` | `list_app_versions`, `latest_app_version`, `set_latest_app_version`, `set_latest_app_version_for` (now on `DBOS` too) |
| `WorkflowRecord::application_name`, `application_version`, `application_id` | `app_name`, `app_version`, `app_id` |
| `WorkflowFilter::applications`, `application_versions` | `app_scope`, `app_versions` |
| `sysdb::types::Applications` | `AppScope` |

#### Queues

`QueueOptions::priority_enabled`, `QueueChange::priority_enabled` and `Queue::priority_enabled()` are removed: every queue now honours priorities.

#### Errors

`dbos::Error` only gains variants, and is `#[non_exhaustive]`.
`dbos::sysdb::Error` isn't, so an exhaustive match on it breaks: `ConcurrentRecv`, `StepAlreadyRecorded` (replaced by `StepNondeterminism`) and `MaxRecoveryAttemptsExceeded` are removed, and `UnknownSerialization`, `WorkflowIdInUse`, `WorkflowConflict`, `WorkflowNotRewindable` and `RewindInterrupted` are added.
`sysdb::BackendErrorKind::Transient` is renamed `Conflict`.

If you call or implement the `dbos::sysdb::SystemDatabase` trait directly, treat it as rewritten: many of its methods changed.

### Behaviour changes

These change what an application does without a compile error.

#### Configuration and connections

- **The system database URL variable is `DBOS_SYSTEM_DATABASE_URL`.** `Config::from_env` and `ClientConfig::from_env` no longer read `DBOS_DATABASE_URL`, so a deployment that sets only the old name fails at launch.
- **Clients don't use LISTEN/NOTIFY by default.** `ClientConfig`'s `use_listen_notify` defaults to `false`, so a client's `get_event` re-reads every second. Turn it on only if the application's executors use LISTEN/NOTIFY.
- **Idle transactions are ended.** System-database connections end a session left idle in a transaction for 60 seconds, unless the connection string or `PGOPTIONS` sets `idle_in_transaction_session_timeout`. `IdleTransactionTimeout::ServerSetting` restores 0.5's behaviour.

#### Recorded data

- **A stream closed by 0.5 doesn't read as closed.** Reading past its close fails with `Error::Deserialization`; see [Finish reading streams that 0.5 closed](#finish-reading-streams-that-05-closed).

- **Unknown serialization tags are refused.** 0.5 read every payload as `rust_serde`, whatever its tag. A row tagged with an encoding this process doesn't have, such as another SDK's, is now `Error::UnknownSerialization`, and such a queued workflow isn't run.
- **Non-finite floats round-trip.** `NaN` and the infinities are stored as `"NaN"`, `"Infinity"` and `"-Infinity"` in the default encoding, where 0.5 stored them as `null`.

#### Failures and refusals

- **A result DBOS can't encode fails the workflow.** A workflow result or error that can't be encoded (such as a map with non-string keys) now ends the workflow `ERROR`; in 0.5 it stayed `PENDING` and was re-run. A step output that can't be encoded is recorded as the step's error.
- **DBOS's refusals inside a workflow are recorded.** A refusal such as sending to a missing workflow, returned with `?`, now ends the workflow `ERROR`, and replays take the same branch. In 0.5 the workflow stayed `PENDING` until parked.
- **A workflow can't cancel or resume itself.** Naming the calling workflow in `cancel`, `cancel_all` (including through a `Children::Include` cascade) or `resume` returns an error; in 0.5 it went through.
- **Updating a missing workflow's attributes fails** with `NonExistentWorkflow`, where 0.5 returned `Ok(())`.
- **Durations too long to store are refused** with `InvalidArgument`, where 0.5 truncated them.
- **A child start's refusal is recorded**, so a recovered parent gets the same error instead of trying the start again.

#### Concurrency and timing

- **Two `recv` calls may wait on one topic.** A second `recv` on the same workflow and topic used to fail with `ConcurrentRecv`; now both wait and one takes the message.
- **A parent waits for child starts it abandoned**, such as a start on the losing side of a race, before recording its own outcome.
- **Times come from the database's clock**: row timestamps, workflow deadlines, delays, debounce deadlines, sleep wake times, and `recv` and `get_event` deadlines. Executors whose clocks are skewed from the database now behave correctly.
- **Deadlines are enforced for workflows no process is running.** Every executor runs a sweep that cancels its application's workflows past their deadline, including queued ones. In 0.5 only the process running a workflow enforced its deadline.
- **A stale execution can't write beside the current one.** An execution that lost its workflow to a cancel, a resume, a recovery or a timeout stops at its next write and adopts the current execution's outcome.

#### Queues

- **A concurrency of 0 pauses a queue**, where 0.5 refused it.
- **A queue is partitioned only when it has a per-partition limit.** A deduplication ID may now be combined with a partition key; it holds across the whole queue.

#### Retried database errors

Only serialization failures and deadlocks (`40001` and `40P01`) are retried, on their own schedule, on Postgres and CockroachDB alike; the rest of SQLSTATE class 40, including `40003`, no longer is.

### Toolchain and features

- **The minimum Rust version is 1.97**, up from 1.95.
- **A runtime feature is required.** The default features are `engine`, `macros` and `runtime-tokio`, so with default features nothing changes. With `default-features = false`, add a runtime feature, or the build fails naming them:

```toml
# 0.5
dbos = { version = "0.5", default-features = false, features = ["engine"] }
# 0.6
dbos = { version = "0.6", default-features = false, features = ["engine", "runtime-tokio"] }
```

### New in 0.6

- [Durable streams](./tutorials/workflow-communication.md#workflow-streaming)
- [Scheduled workflows](./tutorials/scheduled-workflows.md), stored in the database
- [Rewinding workflows](./tutorials/workflow-management.md#rewinding-workflows)
- [Portable serialization](./tutorials/serialization.md#portable-workflows) and [custom serializers](./tutorials/serialization.md#custom-serializers)
- [Patching](./tutorials/upgrading-workflows.md#patching) workflow code while old executions run
- [Debouncing](./tutorials/workflow-tutorial.md#debouncing)
- [`DBOS::enqueue`](./reference/queues.md#enqueue), enqueueing a workflow by name
- [`WorkflowIdReusePolicy::Reject`](./tutorials/workflow-tutorial.md#workflow-ids-and-idempotency)
- [`shutdown_with`](./reference/lifecycle.md#shutdown_with), draining running workflows before shutdown
- Free-function forms of the [management calls](./tutorials/workflow-management.md), for use in a workflow body
- `merge_workflow_attributes`, `list_workflow_steps_with` and `ForkOptions::replacement_children`
- Pausing a queue with a concurrency of 0
- [smol and async-global-executor](./tutorials/async-runtimes.md) support
