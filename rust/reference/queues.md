# Queues

> See the [queues tutorial](../tutorials/queue-tutorial.md) for how to use these.
> Full API documentation is on [docs.rs](https://docs.rs/dbos/latest/dbos/).

## Managing Queues

A queue's configuration is stored in the system database, so these are methods of a launched `DBOS`, and of [`Client`](./client.md).
Every worker re-reads a queue's configuration as it polls, so a change takes effect across the fleet without a restart.

### register_queue

```rust
impl DBOS {
    pub async fn register_queue(
        &self,
        name: &str,
        options: QueueOptions,
        on_conflict: QueueConflict,
    ) -> dbos::Result<Queue>;
}
```

Create a queue, or report the one already registered under `name`, and return its stored configuration.
Call it after [`launch`](./lifecycle.md#launch); before, it returns `Error::NotLaunched`.
Each queue belongs to the application that registers it, and only that application dequeues from it.

**Parameters:**
- **name**: The queue's name.
- **options**: Its [`QueueOptions`](#queueoptions).
- **on_conflict**: What to do if the queue exists. [`QueueConflict`](https://docs.rs/dbos/latest/dbos/enum.QueueConflict.html):
  - `UpdateIfLatestVersion`: overwrite the stored options only if this process runs the application's latest version, so an old version still running during a rolling deploy doesn't revert the new one's settings. The usual choice at startup. A `Client` can't use it.
  - `AlwaysUpdate`: always overwrite them.
  - `NeverUpdate`: keep what is stored.

```rust
let queue = dbos.register_queue(
    "task_queue",
    QueueOptions { worker_concurrency: Some(5), ..QueueOptions::default() },
    QueueConflict::UpdateIfLatestVersion,
).await?;
```

### queue

```rust
pub async fn queue(&self, name: &str) -> dbos::Result<Option<Queue>>;
pub async fn list_queues(&self) -> dbos::Result<Vec<Queue>>;
```

The stored configuration of one queue, or of every queue the application owns.
A [`Queue`](https://docs.rs/dbos/latest/dbos/struct.Queue.html) has `name()`, `concurrency()`, `worker_concurrency()`, `rate_limit()`, `is_partitioned()`, `partition_concurrency()`, `partition_worker_concurrency()`, `partition_rate_limit()` and `polling_interval()`.

### update_queue

```rust
pub async fn update_queue(&self, name: &str, change: QueueChange) -> dbos::Result<Queue>;
```

Change some of a queue's options and return the result.
[`QueueChange`](https://docs.rs/dbos/latest/dbos/struct.QueueChange.html) has a field per option, each a [`Change`](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.Change.html): `Change::Leave` (the default) keeps the stored value, `Change::Set(value)` replaces it.

```rust
dbos.update_queue("task_queue", QueueChange {
    concurrency: Change::Set(Some(50)),
    ..QueueChange::default()
}).await?;
```

### delete_queue

```rust
pub async fn delete_queue(&self, name: &str) -> dbos::Result<()>;
```

Remove a queue's registration. Removing one that isn't registered is not an error.
Workflows already enqueued on it are left in place and aren't dequeued until the queue is registered again, so pause a queue with a concurrency of 0 instead.

### QueueOptions

```rust
pub struct QueueOptions {
    pub concurrency: Option<i32>,
    pub worker_concurrency: Option<i32>,
    pub polling_interval: Duration,
    pub rate_limit: Option<RateLimit>,
    pub partition_concurrency: Option<i32>,
    pub partition_worker_concurrency: Option<i32>,
    pub partition_rate_limit: Option<RateLimit>,
}
```

Build with `..QueueOptions::default()`.

- **worker_concurrency**: The most of the queue's workflows one process runs at once. Default: `None`. `Some(0)` pauses the queue on every executor. It can't be below `partition_worker_concurrency`, which must be at least 1, so to pause a queue that sets one, clear `partition_worker_concurrency` in the same update.
- **concurrency**: The most that run at once across all processes, counting every `PENDING` workflow on the queue, including older versions'. Default: `None`. It can't be below `worker_concurrency` or a per-partition concurrency limit, which must be at least 1, so `Some(0)` pauses the queue only when `worker_concurrency` is 0 or unset and no per-partition concurrency limit is set.
- **rate_limit**: At most [`RateLimit`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.RateLimit.html)`{ limit, period }` starts in any `period`, across all processes. Default: `None`.
- **partition_concurrency**, **partition_worker_concurrency**, **partition_rate_limit**: The same limits per partition key. Setting any of them partitions the queue; queue-wide limits on a partitioned queue are enforced too.
- **polling_interval**: How often a quiet queue is polled. Default: 1 second.

## Enqueueing

A workflow this process registered is enqueued by starting it with a [`QueueRequest`](#queuerequest) in [`StartOptions::queue`](./workflows-steps.md#startoptions).
A workflow it doesn't have is enqueued by name with [`DBOS::enqueue`](#enqueue), or from another application with [`Client::enqueue`](./client.md#enqueue).
Enqueued from inside a workflow, by either route, the enqueued workflow is a child of the caller, recorded at the caller's step.
Queued workflows are dequeued in priority order, then first in, first out.

### QueueRequest

```rust
pub struct QueueRequest<'a> {
    pub name: &'a str,
    pub deduplication_id: Option<&'a str>,
    pub priority: Option<u32>,
    pub partition_key: Option<&'a str>,
    pub delay: Option<Duration>,
    pub duplication_policy: DuplicationPolicy,
    pub serialization: SerializationFormat,
}

impl<'a> QueueRequest<'a> {
    pub fn new(name: &'a str) -> Self;
}
```

A queue to enqueue a workflow on, and what to ask of it. Build with `QueueRequest::new(name)` and struct update syntax.

- **name**: The queue.
- **deduplication_id**: While a workflow with this ID is enqueued or running on the queue, another enqueue with it is refused. Default: `None`.
- **duplication_policy**: What a refused enqueue does. [`DuplicationPolicy`](https://docs.rs/dbos/latest/dbos/enum.DuplicationPolicy.html)`::Reject` (default) fails with `dbos::sysdb::Error::QueueDeduplicated`; `ReturnExisting` returns a handle to the workflow holding the ID, discarding this call's input. `ReturnExisting` needs a `deduplication_id`.
- **priority**: From 1 to 2,147,483,647; lower is dequeued first. Default: `None`, which is dequeued before any priority. `Some(0)` is refused.
- **partition_key**: The workflow's partition on a partitioned queue. A workflow enqueued on a partitioned queue without one is never dequeued; on other queues the key is ignored. A deduplication ID applies across the whole queue, not per partition.
- **delay**: Hold the workflow `DELAYED` this long before it can be dequeued, on the database's clock. Default: `None`.
- **serialization**: A [`SerializationFormat`](./workflows-steps.md#serializationformat) for the workflow's input and output.

### enqueue

```rust
impl DBOS {
    pub fn enqueue<'a, P: Serialize, R, E>(&self, workflow: impl Into<QualifiedWorkflowName>, queue: &'a str, input: P) -> PendingStart<'a, R, E>;
    pub fn enqueue_with<'a, P: Serialize, R, E>(&self, workflow: impl Into<QualifiedWorkflowName>, input: P, options: EnqueueOptions<'a>) -> PendingStart<'a, R, E>;
    pub fn enqueue_portable<'a, R, E>(&self, workflow: impl Into<QualifiedWorkflowName>, args: PortableWorkflowArgs, options: EnqueueOptions<'a>) -> PendingStart<'a, R, E>;
}
```

Enqueue a workflow by name, for a workflow this process needn't have: one another service implements, possibly in another language.
The name isn't looked up locally; whichever executor has the workflow dequeues it.
The type parameters state the workflow's result and error types; nothing checks them until the result is decoded.
`enqueue_portable` passes a [`PortableWorkflowArgs`](https://docs.rs/dbos/latest/dbos/struct.PortableWorkflowArgs.html) (`positional_args`, `named_args`) as given, for a workflow in another language that takes named arguments.

```rust
let handle: WorkflowHandle<String> = dbos.enqueue("send_email", "email-queue", "hello").await?;
```

### EnqueueOptions

```rust
pub struct EnqueueOptions<'a> {
    pub queue_name: &'a str,
    pub deduplication_id: Option<&'a str>,
    pub duplication_policy: DuplicationPolicy,
    pub priority: Option<u32>,
    pub partition_key: Option<&'a str>,
    pub delay: Option<Duration>,
    pub serialization: SerializationFormat,
    pub workflow_id: Option<&'a str>,
    pub workflow_id_reuse_policy: WorkflowIdReusePolicy,
    pub app_name: Option<&'a str>,
    pub app_version: Option<&'a str>,
    pub timeout: Timeout,
    pub attributes: Option<&'a serde_json::Map<String, serde_json::Value>>,
}

impl<'a> EnqueueOptions<'a> {
    pub fn new(queue_name: &'a str) -> Self;
}
```

Options for an enqueue by name. The queue fields mean what they mean on a [`QueueRequest`](#queuerequest). In addition:

- **workflow_id**, **workflow_id_reuse_policy**: As for a [start](./workflows-steps.md#startoptions).
- **app_name**: The [application](../../explanations/sharing-a-system-database.md) that implements the workflow. Default: this application for `DBOS::enqueue_with`, the client's `app_name` for `Client::enqueue_with`. A client with neither writes an unclaimed workflow, which any application may run.
- **app_version**: The version that must run it. Default: `None`, which the application's latest version dequeues.
- **timeout**: The workflow's [`Timeout`](./workflows-steps.md#timeout). From `DBOS::enqueue_with` inside a workflow, `Inherit` takes the caller's deadline.
- **attributes**: Attributes recorded with the workflow.
