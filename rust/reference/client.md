# DBOS Client

> A [`Client`](https://docs.rs/dbos/latest/dbos/struct.Client.html) connects to a DBOS application's system database from outside the application: an API server that enqueues work, an operator's tool, or a service in another process or language.
> It runs no workflows, recovers nothing and dequeues nothing.
> It is cheap to clone.

```rust
let client = dbos::Client::connect(dbos::ClientConfig::from_env()).await?;
let handle: dbos::WorkflowHandle<String> =
    client.enqueue("process_order", "orders", "order-123").await?;
let result = handle.result().await?;
client.close().await;
```

A client has no registered workflows, so the type parameters of the handles it returns state what each workflow returns; nothing checks them until the result is decoded.
Called from inside a workflow, a client's calls are not recorded: use the [free functions](./methods.md) there.

### connect

```rust
pub async fn connect(config: ClientConfig) -> dbos::Result<Client>;
```

Connect to the system database described by a [`ClientConfig`](./configuration.md#clientconfig).

### close

```rust
pub async fn close(&self);
```

Close the client's connection pool.

### app_name

```rust
pub fn app_name(&self) -> Option<&str>;
```

The application the client acts for, from `ClientConfig::app_name`.

### enqueue

```rust
pub async fn enqueue<P: Serialize, R, E>(&self, workflow: impl Into<QualifiedWorkflowName>, queue: &str, input: P) -> dbos::Result<WorkflowHandle<R, E>>;
pub async fn enqueue_with<P: Serialize, R, E>(&self, workflow: impl Into<QualifiedWorkflowName>, input: P, options: EnqueueOptions<'_>) -> dbos::Result<WorkflowHandle<R, E>>;
pub async fn enqueue_portable<R, E>(&self, workflow: impl Into<QualifiedWorkflowName>, args: PortableWorkflowArgs, options: EnqueueOptions<'_>) -> dbos::Result<WorkflowHandle<R, E>>;
```

Enqueue a workflow by name, with [`EnqueueOptions`](./queues.md#enqueueoptions).
Whichever executor has the workflow dequeues it.
To enqueue a workflow written in another language, set `serialization: SerializationFormat::Portable`; see [portable workflows](../../explanations/portable-workflows.md).

```rust
let options = EnqueueOptions {
    workflow_id: Some("order-123"),
    ..EnqueueOptions::new("orders")
};
let handle: WorkflowHandle<String> = client.enqueue_with("process_order", "order-123", options).await?;
```

### retrieve_workflow and workflow_status

```rust
pub fn retrieve_workflow<R, E>(&self, workflow_id: &str) -> WorkflowHandle<R, E>;
pub async fn workflow_status(&self, workflow_id: &str) -> dbos::Result<Option<WorkflowStatus>>;
```

A handle to a workflow by ID, and a workflow's current status (`None` if there's no such workflow).

### Messages, events and streams

```rust
pub async fn send<T: Serialize>(&self, destination_id: &str, message: &T) -> dbos::Result<()>;
pub async fn send_with<T: Serialize>(&self, message: SendMessage<'_, T>, options: SendOptions) -> dbos::Result<()>;
pub async fn send_bulk<T: Serialize>(&self, messages: &[SendMessage<'_, T>]) -> dbos::Result<()>;
pub async fn send_bulk_with<T: Serialize>(&self, messages: &[SendMessage<'_, T>], options: SendOptions) -> dbos::Result<()>;
pub async fn get_event<T: DeserializeOwned>(&self, workflow_id: &str, key: &str, timeout: Duration) -> dbos::Result<Option<T>>;
pub fn read_stream<T: DeserializeOwned>(&self, workflow_id: &str, key: &str, options: ReadStreamOptions) -> StreamReader<T>;
pub fn read_stream_from<T: DeserializeOwned>(&self, workflow_id: &str, key: &str, offset: i32, options: ReadStreamOptions) -> StreamReader<T>;
pub async fn read_stream_value<T: DeserializeOwned>(&self, workflow_id: &str, key: &str, offset: i32, options: ReadStreamOptions) -> dbos::Result<T>;
```

As [on `DBOS`](./methods.md#messages).
A client's send isn't protected by a step, so give a message that must be delivered once an `idempotency_key`.
A client encodes messages with its own configured serializer.

### Waiting for workflows

```rust
pub async fn select_workflow(&self, workflow_ids: &[&str]) -> dbos::Result<String>;
pub async fn join_workflows(&self, workflow_ids: &[&str]) -> dbos::Result<()>;
```

Wait for the first of several workflows to finish, returning its ID, or for all of them.

### Workflow management

```rust
pub async fn list_workflows(&self, filter: &WorkflowFilter<'_>) -> dbos::Result<Vec<WorkflowRecord>>;
pub async fn list_workflow_steps(&self, workflow_id: &str) -> dbos::Result<Vec<StepRecord>>;
pub async fn list_workflow_steps_with(&self, workflow_id: &str, options: ListWorkflowStepsOptions) -> dbos::Result<Vec<StepRecord>>;
pub async fn cancel(&self, workflow_id: &str) -> dbos::Result<()>;
pub async fn cancel_all(&self, workflow_ids: &[&str], children: Children) -> dbos::Result<Vec<String>>;
pub async fn resume<R, E>(&self, workflow_id: &str) -> dbos::Result<WorkflowHandle<R, E>>;
pub async fn resume_with<R, E>(&self, workflow_id: &str, options: ResumeOptions<'_>) -> dbos::Result<WorkflowHandle<R, E>>;
pub async fn resume_all<R, E>(&self, workflow_ids: &[&str], options: ResumeOptions<'_>) -> dbos::Result<Vec<WorkflowHandle<R, E>>>;
pub async fn fork<R, E>(&self, workflow_id: &str, start_step: i32) -> dbos::Result<WorkflowHandle<R, E>>;
pub async fn fork_with<R, E>(&self, fork: Fork<'_>, options: ForkOptions<'_>) -> dbos::Result<WorkflowHandle<R, E>>;
pub async fn fork_all<R, E>(&self, forks: &[Fork<'_>], options: ForkOptions<'_>) -> dbos::Result<Vec<WorkflowHandle<R, E>>>;
pub async fn rewind<R, E>(&self, workflow_id: &str) -> dbos::Result<WorkflowHandle<R, E>>;
pub async fn rewind_with<R, E>(&self, workflow_id: &str, options: RewindOptions<'_>) -> dbos::Result<WorkflowHandle<R, E>>;
pub async fn delete(&self, workflow_id: &str) -> dbos::Result<()>;
pub async fn delete_all(&self, workflow_ids: &[&str], children: Children) -> dbos::Result<u64>;
pub async fn set_workflow_delay(&self, workflow_id: &str, delay: WorkflowDelay) -> dbos::Result<()>;
pub async fn update_workflow_attributes(&self, workflow_id: &str, attributes: Option<&serde_json::Map<String, serde_json::Value>>) -> dbos::Result<()>;
pub async fn merge_workflow_attributes(&self, workflow_id: &str, attributes: &serde_json::Map<String, serde_json::Value>) -> dbos::Result<()>;
```

As [on `DBOS`](./methods.md#workflow-management).
A client with no `app_name` lists every application's workflows.

### Queues

```rust
pub async fn register_queue(&self, name: &str, options: QueueOptions, on_conflict: QueueConflict) -> dbos::Result<Queue>;
pub async fn queue(&self, name: &str) -> dbos::Result<Option<Queue>>;
pub async fn list_queues(&self) -> dbos::Result<Vec<Queue>>;
pub async fn update_queue(&self, name: &str, change: QueueChange) -> dbos::Result<Queue>;
pub async fn delete_queue(&self, name: &str) -> dbos::Result<()>;
```

As [on `DBOS`](./queues.md#managing-queues). `register_queue` can't use `QueueConflict::UpdateIfLatestVersion`, since a client has no version; it returns `Error::Config`.

### Schedules

```rust
pub async fn create_schedule(&self, spec: &ScheduleSpec) -> dbos::Result<()>;
pub async fn apply_schedules(&self, specs: &[ScheduleSpec]) -> dbos::Result<()>;
pub async fn list_schedules(&self, filter: &ScheduleFilter<'_>) -> dbos::Result<Vec<Schedule>>;
pub async fn get_schedule(&self, name: &str) -> dbos::Result<Option<Schedule>>;
pub async fn update_schedule(&self, name: &str, change: &ScheduleChange<'_>) -> dbos::Result<()>;
pub async fn pause_schedule(&self, name: &str) -> dbos::Result<()>;
pub async fn resume_schedule(&self, name: &str) -> dbos::Result<()>;
pub async fn delete_schedule(&self, name: &str) -> dbos::Result<()>;
pub async fn backfill_schedule<R, E>(&self, name: &str, start: SystemTime, end: SystemTime) -> dbos::Result<Vec<WorkflowHandle<R, E>>>;
pub async fn trigger_schedule<R, E>(&self, name: &str) -> dbos::Result<WorkflowHandle<R, E>>;
```

As [on `DBOS`](./methods.md#schedules).
Build a spec with [`ScheduleSpec::for_workflow`](./methods.md#schedulespec), which names the workflow.
A client with no `app_name` and a spec with none writes an unclaimed schedule, which every application sharing the database fires.

### Application versions

```rust
pub async fn list_app_versions(&self) -> dbos::Result<Vec<VersionInfo>>;
pub async fn latest_app_version(&self) -> dbos::Result<Option<VersionInfo>>;
pub async fn set_latest_app_version(&self, version_name: &str) -> dbos::Result<()>;
pub async fn set_latest_app_version_for(&self, version_name: &str, app_name: &str) -> dbos::Result<()>;
```

The application versions that have registered, newest first, and the latest one, which an enqueue naming no version runs on.
`set_latest_app_version` promotes a version to latest; promoting an older one is a rollback.
A client named for an application sees and promotes that application's versions; `set_latest_app_version_for` names the application explicitly.
`DBOS` has the same methods, for its own application.
A [`VersionInfo`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.VersionInfo.html) has `app_name`, `version_id`, `version_name`, `version_timestamp` and `created_at`.

### DebouncerClient

See [`DebouncerClient`](./methods.md#debouncerclient).
