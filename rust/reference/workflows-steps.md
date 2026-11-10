# Workflows & Steps

> Full API documentation, with every type and trait bound, is on [docs.rs](https://docs.rs/dbos/latest/dbos/).

## Workflows

### register_workflow

```rust
impl DBOS {
    pub fn register_workflow<P, R, E, F, Fut>(
        &self,
        name: impl Into<QualifiedWorkflowName>,
        workflow: F,
    ) -> dbos::Result<WorkflowRef<P, R, E>>
    where
        F: Fn(P) -> Fut + Send + Sync + 'static,
        Fut: Future<Output = dbos::Result<R, E>> + Send + 'static,
        P: Serialize + DeserializeOwned + Send + 'static,
        R: Serialize + DeserializeOwned + Send + 'static,
        E: DurableError;
}
```

Register a function or closure as a DBOS workflow, and return a typed [`WorkflowRef`](#workflowref) that starts it.
All workflows must be registered before the instance is [launched](./lifecycle.md#launch); registering afterwards returns `Error::AlreadyLaunched`.

A workflow takes exactly **one input** and returns a `dbos::Result<R, E>`.
To take several values, take a struct or a tuple; to take none, take `()`.
The input and output are recorded in the database, so they must implement `serde`'s `Serialize` and `Deserialize`.
`E` is the workflow's own error type (see [Errors](#errors)); leave it out for a workflow that fails only with DBOS's errors.

**Parameters:**
- **name**: The workflow's name. It is the workflow's identity in the database: recovery, queues, clients and schedules find the workflow by it, so keep it stable across deployments. Registering two workflows under one name returns `Error::AlreadyRegistered`.
- **workflow**: The workflow function. Don't capture the `DBOS` instance in it: the instance owns the closure, so the two would keep each other alive. A workflow body never needs the instance; use the [free functions](./methods.md).

```rust
async fn process_order(order: Order) -> dbos::Result<String> {
    dbos::step("charge", || charge(&order)).await?;
    Ok(format!("processed {}", order.id))
}

let process_order = dbos.register_workflow("process_order", process_order)?;
dbos.launch().await?;
```

### register_workflow_with

```rust
impl DBOS {
    pub fn register_workflow_with<P, R, E, F, Fut>(
        &self,
        name: impl Into<QualifiedWorkflowName>,
        options: WorkflowOptions,
        workflow: F,
    ) -> dbos::Result<WorkflowRef<P, R, E>>;
}
```

[`register_workflow`](#register_workflow), with [`WorkflowOptions`](https://docs.rs/dbos/latest/dbos/struct.WorkflowOptions.html):

- **serialization**: A [`SerializationFormat`](#serializationformat) for the workflow's input, output and error, unless a start chooses otherwise. `Portable` for a workflow other languages start or await. Default: `Default`, the configured serializer.

```rust
let greet = dbos.register_workflow_with(
    "greet",
    WorkflowOptions { serialization: SerializationFormat::Portable, ..Default::default() },
    |name: String| async move { Ok::<_, dbos::Error>(format!("hello, {name}")) },
)?;
```

### WorkflowRef

```rust
pub struct WorkflowRef<P, R, E = EngineOnly>;
```

A registered workflow, with its input type `P`, result type `R` and error type `E`.
It is cheap to clone.
A `WorkflowRef` starts workflows while its instance is launched, whether or not a `DBOS` handle is still held, and returns `Error::NotLaunched` before launch and after shutdown.
It doesn't keep the instance alive, so a workflow can capture one to start it as a child.

#### WorkflowRef::start

```rust
pub fn start(&self, input: P) -> PendingStart<'_, R, E>;
```

Start the workflow in the background and return a [`WorkflowHandle`](#workflowhandle) to it, without waiting for it to finish.
Called from inside a workflow, it starts a **child** workflow: the start is recorded at the parent's step, so a recovered parent gets the same child back rather than starting another, and the child's ID defaults to `{parent_id}-{step_id}`.
Called from inside a step, it returns `Error::InsideStep`.

#### WorkflowRef::start_with

```rust
pub fn start_with<'a>(&'a self, input: P, options: StartOptions<'a>) -> PendingStart<'a, R, E>;
```

[`start`](#workflowrefstart), with [`StartOptions`](#startoptions).

```rust
let options = StartOptions {
    workflow_id: Some("order-123"),
    queue: Some(QueueRequest::new("orders")),
    ..StartOptions::default()
};
let handle = process_order.start_with(order, options).await?;
```

#### WorkflowRef::run

```rust
pub fn run(&self, input: P) -> PendingRun<'_, R, E>;
```

Start the workflow and wait for its result: a `start` followed by awaiting the handle's [`result`](#workflowhandleresult).
Inside a workflow, the start and the wait are each recorded.

#### WorkflowRef::run_with

```rust
pub fn run_with<'a>(&'a self, input: P, options: RunOptions<'a>) -> PendingRun<'a, R, E>;
```

[`run`](#workflowrefrun), with `RunOptions`: the fields of [`StartOptions`](#startoptions) except `queue`.

#### WorkflowRef::name

```rust
pub fn name(&self) -> &str;
pub fn qualified_name(&self) -> &QualifiedWorkflowName;
```

The name the workflow was registered under.

### StartOptions

```rust
pub struct StartOptions<'a> {
    pub workflow_id: Option<&'a str>,
    pub workflow_id_reuse_policy: WorkflowIdReusePolicy,
    pub timeout: Timeout,
    pub queue: Option<QueueRequest<'a>>,
    pub attributes: Option<&'a serde_json::Map<String, serde_json::Value>>,
}
```

Options for [`start_with`](#workflowrefstart_with). Build with `..StartOptions::default()`.

- **workflow_id**: The workflow's ID. Default: a UUID, or `{parent_id}-{step_id}` for a child. The ID is an [idempotency key](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency).
- **workflow_id_reuse_policy**: What to do if a workflow with this ID exists. [`WorkflowIdReusePolicy`](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.WorkflowIdReusePolicy.html)`::ReturnExisting` (default) returns a handle to it; `Reject` fails with `dbos::sysdb::Error::WorkflowIdInUse`. `Reject` needs an explicit `workflow_id`. Inside a workflow, the refusal is recorded at the parent's step.
- **timeout**: The workflow's [`Timeout`](#timeout). Default: `Inherit`.
- **queue**: A [`QueueRequest`](./queues.md#queuerequest), to enqueue the workflow instead of starting it at once. Default: `None`.
- **attributes**: JSON key-value [attributes](../tutorials/workflow-management.md#tagging-workflows-with-attributes) recorded with the workflow. Default: `None`.

### Timeout

```rust
pub enum Timeout {
    Inherit,
    None,
    Explicit(Duration),
}
```

How long a workflow may take, counted from when it starts running (an enqueued workflow's clock starts when it is dequeued).
Timeouts are stored in the database, so they survive restarts.

- **Inherit** (default): a child takes its parent's deadline; a workflow started outside a workflow has none.
- **None**: no deadline, even under a parent that has one.
- **Explicit(duration)**: this long, counted from the start, replacing any inherited deadline, whether it is longer or shorter. `Duration` converts into it: `timeout: Duration::from_secs(60).into()`.

When the deadline passes, the workflow is cancelled, with the children that inherited its deadline.
In the process running the workflow, the timeout drops the workflow at once, including a step in progress, which records nothing; a workflow no process is running is marked `CANCELLED` by a sweep.

### WorkflowHandle

```rust
pub struct WorkflowHandle<R, E = EngineOnly>;
```

A handle to one workflow execution, returned by `start`, by the management calls that start a workflow, and by [`retrieve_workflow`](./methods.md#retrieve_workflow).

#### WorkflowHandle::workflow_id

```rust
pub fn workflow_id(&self) -> &str;
```

The workflow's ID.

#### WorkflowHandle::result

```rust
pub fn result<'a>(self) -> PendingStep<'a, R, E>;
```

Wait for the workflow to finish and return its result, or the error it failed with.
Inside a workflow, the wait is recorded, so a recovery gets the same outcome without waiting again.
If the workflow was cancelled, awaiting it returns `Error::AwaitedWorkflowCancelled` inside a workflow and `Error::WorkflowCancelled` outside one.
Consumes the handle.

#### WorkflowHandle::status

```rust
pub async fn status(&self) -> dbos::Result<WorkflowStatus>;
```

The workflow's current [status](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.WorkflowStatus.html): `Pending`, `Enqueued`, `Delayed`, `Success`, `Error`, `Cancelled` or `MaxRecoveryAttemptsExceeded`.

## Steps

### step

```rust
pub fn step<'a, T, E, F, Fut>(name: &str, body: F) -> PendingStep<'a, T, E>
where
    T: Serialize + DeserializeOwned + Send + 'a,
    E: DurableError + Send,
    F: FnMut() -> Fut + Send + 'a,
    Fut: Future<Output = dbos::Result<T, E>> + Send + 'a;
```

Run `body` as a step.
Inside a workflow, the step's result (or error) is recorded, and a recovery returns the recorded result instead of running the step again.
Outside a workflow, or inside another step, it runs `body` as a plain call and records nothing.

**Parameters:**
- **name**: The step's name. It is checked on recovery: a step whose name differs from the one recorded at its position is refused with `dbos::sysdb::Error::UnexpectedStep`.
- **body**: A closure returning the step's future. It is `FnMut` because retries call it again; capture by reference, or clone inside it.

```rust
let total = dbos::step("price_order", || price_order(&order)).await?;
```

### step_with

```rust
pub fn step_with<'a, T, E, F, Fut>(
    name: &str,
    options: StepOptions<E>,
    body: F,
) -> PendingStep<'a, T, E>;
```

[`step`](#step), with [`StepOptions`](#stepoptions).

### StepOptions

```rust
pub struct StepOptions<E = EngineOnly> {
    pub max_attempts: u32,
    pub interval: Duration,
    pub backoff_rate: f64,
    pub max_interval: Duration,
    pub timeout: Option<Duration>,
    pub preemptible: bool,
    pub should_retry: Option<ShouldRetry<E>>,
}
```

Build with `..StepOptions::default()`.

- **max_attempts**: How many times the step may run in all. Default: `1` (no retries). `0` is treated as `1`.
- **interval**: The wait after the first failed attempt. Default: 1 second.
- **backoff_rate**: What the wait is multiplied by after each failure. Default: `2.0`.
- **max_interval**: The longest the wait may grow to. Default: 1 hour.
- **timeout**: The longest one attempt may run. Default: `None`. An attempt that runs past it is dropped and fails with `Error::StepTimeout`, which counts as a failed attempt and is offered to `should_retry`.
- **preemptible**: Whether to stop the step as soon as its workflow is seen to be cancelled. Default: `false`, so a running step finishes. DBOS checks by polling the workflow's status while the step runs.
- **should_retry**: Decides whether a failure is retried; one it declines ends the step at once, whatever attempts are left. Default: `None` (retry every failure). Set it with `StepOptions::should_retry`. Cancellations, shutdowns and database failures are never retried and never reach it.

With `max_attempts` above 1, a step that fails every attempt, or whose `should_retry` declines a failure after earlier failed attempts, returns `Error::MaxStepRetriesExceeded`, carrying every attempt's error. A step that fails its only attempt (the default of 1, or a failure declined on the first attempt) returns its own error unwrapped.

#### StepOptions::should_retry

```rust
pub fn should_retry(self, predicate: impl Fn(&Error<E>) -> bool + Send + Sync + 'static) -> Self;
```

```rust
let options = StepOptions {
    max_attempts: 5,
    ..StepOptions::default()
}
.should_retry(|error| match error {
    dbos::Error::Application(ApiError::Status(status)) => *status >= 500,
    _ => true,
});
```

### Calls inside a step

A step is a leaf: only its result is recorded.
These return `Error::InsideStep` when called from inside a step: starting or enqueueing a workflow, `recv`, `set_event`, `patch` and `deprecate_patch`, and a debouncer's `debounce`.
Nested steps, `dbos::sleep`, `send`, `get_event`, stream writes and the management calls run plainly inside a step, as part of it, so they happen again if the step is retried.

## Durable Calls

### PendingStep

```rust
pub struct PendingStep<'a, T, E = EngineOnly>;
impl<T, E> Future for PendingStep<'_, T, E> { type Output = dbos::Result<T, E>; }
```

The future returned by `step` and by most durable calls (`sleep`, `send`, `recv`, `set_event`, `get_event`, a handle's `result`, stream reads, and the management calls).
It takes its **step ID when it is built**, not when it is first polled, so durable calls built in a fixed order get the same IDs on every execution, however they are later awaited.
A `PendingStep` that is built and dropped has still used its ID.
A `PendingStep` must be awaited in the workflow it was built in; one built outside a workflow and awaited inside one, or carried into another workflow or across a step boundary, fails with `Error::StepBuiltElsewhere`.

#### PendingStep::lift

```rust
pub fn lift<F>(self) -> PendingStep<'a, T, F>;   // on PendingStep<'a, T, EngineOnly>
```

Carry a call that has no error type of its own (`EngineOnly`) into another error type, such as the workflow's.

#### PendingStep::map_error

```rust
pub fn map_error<F>(self, convert: impl Fn(E) -> F + Copy + Send + 'a) -> PendingStep<'a, T, F>;
```

Convert a call's application error type into another.

#### PendingStep::step_id

```rust
pub fn step_id(&self) -> Option<i32>;
pub fn name(&self) -> &str;
```

The step ID the call took when it was built (`None` outside a workflow), and the name it is recorded under.

### PendingStart

```rust
pub struct PendingStart<'a, R, E = EngineOnly, C = E>;
impl<R, E, C> Future for PendingStart<'_, R, E, C> {
    type Output = dbos::Result<WorkflowHandle<R, E>, C>;
}
```

The future returned by `start`, `start_with`, `DBOS::enqueue`, `debounce`, and the management calls that start a workflow (`resume`, `fork`, `rewind`).
`R` and `E` are the started workflow's types; `C` is the error type of the call itself.
Like a `PendingStep`, it takes its step ID when it is built.
`lift()` changes `C`, for example to the calling workflow's error type.

A `PendingStart` can't be a [`select_step!`](#select_step) branch: whether a workflow is started would then depend on which branch won.

`PendingRun<'a, R, E>`, returned by `run`, is a future of `dbos::Result<R, E>`.

## Concurrency

Building durable calls and joining them with `tokio::join!`, `futures::join!` or `futures::future::join_all` is deterministic when each element is one durable call, not an `async` block, except for `patch`, `deprecate_patch` and `debounce`, which can claim positions when awaited and must be awaited on their own.
`tokio::try_join!` and `try_join_all` stop at the first failure, so they're only safe when the error goes straight out of the workflow.
Racing them, wrapping them in timeouts, consuming them in completion order, or spawning them is not: see [Determinism](../tutorials/workflow-tutorial.md#concurrency-in-workflows).

### select_step!

```rust
dbos::select_step! {
    binding = durable_call => expression,
    binding = durable_call => { block }
    ...
}
```

Race two or more durable calls and run the arm of the first to finish.
Inside a workflow, the winning branch is recorded, and a recovery polls only that branch, which replays from its own record.
Outside a workflow, nothing is recorded.
Requires the `macros` Cargo feature (on by default).

- Each branch is exactly one durable call returning a `PendingStep`: a step, `dbos::sleep`, `recv`, `get_event`, a handle's `result()`, `select_workflow`, and so on. Building a branch inside an `async` block would defer its step ID to its first poll, so it isn't allowed.
- Every branch has the same error type; convert a branch with `lift()` or `map_error()` on the call.
- Branches are polled in source order. `if` guards, `else` arms, `biased;` and fewer than two branches are refused at compile time.
- A losing step is dropped and records nothing; its cancellation token fires. A losing `result()` stops waiting, but the child keeps running.
- A branch that ends in a cancellation or database failure is not recorded as the winner: the error is returned, and a recovery races every branch again.
- The value is a `dbos::Result` of the arm's type, because the race itself can fail.

```rust
let outcome = dbos::select_step! {
    paid = dbos::step("wait_for_payment", wait_for_payment) => paid?,
    expired = dbos::sleep(Duration::from_secs(3600)) => {
        expired?;
        "expired".to_owned()
    }
}?;
```

### select_workflow

```rust
pub fn select_workflow<'a, E: DurableError + 'a>(workflow_ids: &'a [&'a str]) -> PendingStep<'a, String, E>;
```

Wait until one of several workflows finishes and return its ID.
Inside a workflow, the answer is recorded.
It takes one query per poll however many workflows it waits on.
Outside a workflow, call [`DBOS::select_workflow`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.select_workflow).

### join_workflows

```rust
pub async fn join_workflows<E: DurableError>(workflow_ids: &[&str]) -> dbos::Result<(), E>;
```

Wait until every one of several workflows finishes.
It records nothing and takes no step ID; a recovery waits for the set again.
Read each workflow's outcome afterwards from its handle's `result()`.
Outside a workflow, call [`DBOS::join_workflows`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.join_workflows).

### select_workflow! and join_workflows!

```rust
dbos::select_workflow! {
    a_result = handle_a => expression,
    b_result = handle_b => expression,
}
let (a, b) = dbos::join_workflows!(handle_a, handle_b)?;
```

Macro forms over handles held in variables.
`select_workflow!` runs the arm of the first handle's workflow to finish, recorded like `select_workflow`; `join_workflows!` waits for all of them and returns their results as a tuple, failing with the first failure in source order.
Outside a workflow, put the instance first: `dbos::join_workflows!(dbos; a, b)`.

## Patching

### patch

```rust
pub fn patch<E: DurableError>(name: &str) -> impl Future<Output = dbos::Result<bool, E>> + Send;
```

Whether this execution should take the new code path at a patch point: `true` for new executions (which record that they took it), `false` for executions that had already run past this point on the old code.
Call it from the workflow body only; inside a step it returns `Error::InsideStep`.
See [patching](../tutorials/upgrading-workflows.md#patching).

### deprecate_patch

```rust
pub fn deprecate_patch<E: DurableError>(name: &str) -> impl Future<Output = dbos::Result<bool, E>> + Send;
```

Replaces `patch` once no execution that ran the old code can run again: it honours patch markers already recorded without recording new ones.
Keep only the new code path after it.

## Errors

### Error

```rust
#[non_exhaustive]
pub enum Error<E = EngineOnly> {
    Application(E),
    // ... DBOS's own variants
    SystemDatabase(dbos::sysdb::Error),
}
pub type Result<T, E = EngineOnly> = std::result::Result<T, Error<E>>;
```

Everything a durable function can fail with: the application's own error, as `Application(E)`, or one of DBOS's.
`dbos::Result<T>` (with no `E`) is the result of a call that fails only in DBOS's terms; [`EngineOnly`](https://docs.rs/dbos/latest/dbos/enum.EngineOnly.html) is uninhabited, so it can't carry an application error.
`?` converts an `E` into `Error::Application(E)`.
`Error` is serializable, because a workflow's or step's error is recorded and replayed.
It is `#[non_exhaustive]`: match it with a wildcard arm.

The application error type must implement [`DurableError`](https://docs.rs/dbos/latest/dbos/trait.DurableError.html): `std::error::Error + Serialize + DeserializeOwned + 'static`, implemented automatically for any such type.

```rust
#[derive(Debug, thiserror::Error, serde::Serialize, serde::Deserialize)]
enum CheckoutError {
    #[error("the card was declined")]
    CardDeclined,
}

async fn checkout(cart: u32) -> dbos::Result<u32, CheckoutError> {
    Err(CheckoutError::CardDeclined)?
}
```

#### Variants

| Variant | Raised when |
|---|---|
| `Application(E)` | The workflow or step returned its own error. |
| `NotLaunched` / `AlreadyLaunched` | A call needs a launched instance, or an unlaunched one (registering a workflow). |
| `NotInWorkflow` | A call that needs a workflow (`send`, `recv`, `set_event`, `get_event`, management free functions) was made outside one. |
| `InsideStep` | A call that can't run in a step was made inside one. |
| `InsideWorkflow` | `apply_schedules`, `backfill_schedule` or `trigger_schedule` was called from a workflow. |
| `WrongInstance` | A `DBOS` method was called from a workflow another instance runs. |
| `Config` | The configuration is invalid. |
| `InvalidArgument` | An argument is out of range or inconsistent, such as priority 0 or a zero duration. |
| `AlreadyRegistered` / `NotRegistered` | A workflow name is already registered, or isn't. |
| `Serialization` / `Deserialization` / `UnknownSerialization` | A payload couldn't be encoded or decoded, or was written by a serializer this process doesn't have. |
| `WorkflowNotFound` | No workflow has the ID. |
| `Interrupted` | Shutdown interrupted the workflow; it stays `PENDING`. |
| `WorkflowFailed` | A workflow failed with an error this process can't rebuild as its type. |
| `Portable` | A workflow failed with a [portable error](../../explanations/portable-workflows.md#portable-errors) (`name`, `message`, `code`, `data`) this process has no type for. |
| `WorkflowCancelled` | Outside a workflow, the workflow a handle awaited was cancelled or timed out. Inside a workflow, that workflow was cancelled: its step in progress couldn't record its result, a later call that checkpoints was refused, or a `preemptible` step was stopped. Return it. |
| `AwaitedWorkflowCancelled` | Inside a workflow, a workflow it awaited was cancelled. |
| `MaxRecoveryAttemptsExceeded` | The workflow was recovered too many times and was parked. |
| `StepFailed` | A recorded step error couldn't be rebuilt as its type. |
| `StepBuiltElsewhere` | A durable call was awaited somewhere other than where it was built. |
| `PatchNondeterminism` | Another durable call took the position a patch was built at. |
| `StepTimeout` | A step attempt ran past its `timeout`. |
| `StreamTimeout` | A stream read timed out, or the stream ended without a value at the offset. |
| `MaxStepRetriesExceeded` | A step with `max_attempts` above 1 failed every attempt. |
| `SystemDatabase(e)` | The system database refused or failed the call; see below. |

### sysdb::Error

[`dbos::sysdb::Error`](https://docs.rs/dbos/latest/dbos/sysdb/error/enum.Error.html) is what the system database reports, inside `Error::SystemDatabase`.
The variants you're most likely to match on:

| Variant | Raised when |
|---|---|
| `WorkflowIdInUse` | A start with `WorkflowIdReusePolicy::Reject` named an ID that exists. |
| `QueueDeduplicated` | An enqueue's deduplication ID is held by a workflow on the queue. |
| `ConflictingWorkflow` | A workflow ID is already used by a different workflow. |
| `WorkflowCancelled` | The workflow has been cancelled. A workflow's own calls report this as `Error::WorkflowCancelled`, so you see this one only by calling `SystemDatabase` directly. |
| `UnexpectedStep` | A recovery reached a different step than the one recorded at that position. The workflow stays `PENDING` and is retried, then parked. |
| `WorkflowConflict` | The workflow was taken over (resumed or recovered) while this execution ran it, such as a step finishing after a recovery. Return it; the stale execution adopts the outcome of whatever owns the workflow now. |
| `NonExistentWorkflow` | The workflow no longer exists, for example because it was deleted while running. |
| `WorkflowNotRewindable` | A rewind named a workflow that hasn't finished. |
| `Backend` | The database connection or a query failed. |

```rust
match process_order.start_with(order, options).await {
    Ok(handle) => { /* ... */ }
    Err(dbos::Error::SystemDatabase(dbos::sysdb::Error::WorkflowIdInUse { .. })) => {
        // A workflow with this ID already exists.
    }
    Err(error) => return Err(error),
}
```

## Serialization

### SerializationFormat

```rust
pub enum SerializationFormat {
    Default,
    Portable,
    Native,
}
```

How one workflow, enqueue, message, event or stream write is encoded.
`Default` takes the context's choice: a workflow's registration, or for a write inside a workflow, that workflow's encoding, otherwise the configured serializer.
`Portable` is `portable_json`, readable by every DBOS SDK.
`Native` is `rust_serde` whatever is configured.
Reading never needs it: every read decodes by what the row records.

### Serializer and CustomSerializer

```rust
pub enum Serializer { RustSerde, Custom(Arc<dyn CustomSerializer>) }
impl Serializer { pub fn custom(serializer: impl CustomSerializer + 'static) -> Self; }

pub trait CustomSerializer: Send + Sync + Debug {
    fn name(&self) -> &str;
    fn serialize(&self, value: Payload<'_>) -> Result<String, Box<dyn Error + Send + Sync>>;
    fn deserialize(&self, text: &str, into: PayloadSlot<'_>) -> Result<(), Box<dyn Error + Send + Sync>>;
}
```

The configured encoding ([`Config::serializer`](./configuration.md)), and the trait for an encoding of your own.
`serialize` encodes a value (`Payload` implements `Serialize`); `deserialize` builds a deserializer over the text and hands it to `into.fill(deserializer)`.
The format must be self-describing, its output can't contain NUL, and its name must not change or be `rust_serde` or `portable_json`.
See [Serialization](../tutorials/serialization.md).
