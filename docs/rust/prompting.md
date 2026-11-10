---
sidebar_position: 30
title: AI-Assisted Development
---

If you're using an AI coding agent to build a DBOS application, make sure it has the latest information on DBOS for Rust by either:

1. [Installing DBOS skills.](#dbos-agent-skills)
2. [Providing your agent with a DBOS prompt.](#dbos-prompt)

## DBOS Agent Skills

[Agent Skills](https://agentskills.io/home) help developers use AI agents to add DBOS durable workflows to their applications.
DBOS provides open-source skills you can check out [here](https://github.com/dbos-inc/agent-skills), including `dbos-rust` for the Rust SDK.

To install them into your coding agent, run:

```
npx skills add dbos-inc/agent-skills
```

The [Skills CLI](https://skills.sh/) is compatible with most coding agents, including Claude Code, Codex, Antigravity, and Cursor.

## DBOS Prompt

You can use this prompt to add rich information about DBOS to your AI coding agent's context.
You can copy and paste it directly into your context, or follow these directions to add it to your AI-powered IDE or coding agent of choice:

- Claude Code: Add the prompt, or a link to it, to your CLAUDE.md file.
- Cursor: Add the prompt to [your project rules](https://docs.cursor.com/context/rules-for-ai).
- GitHub Copilot: Create a [`.github/copilot-instructions.md`](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) file in your repository and add the prompt to it.

<details>
<summary><strong>DBOS Rust Prompt</strong></summary>

````markdown
# Build Reliable Applications With DBOS

## Guidelines

- Respond in a friendly and concise manner
- Ask clarifying questions when requirements are ambiguous
- Generate code in Rust using the `dbos` crate.
- You MUST include every `use` the code you generate needs. (The examples below leave out `use` lines for brevity: `dbos::step`, `serde::{Serialize, Deserialize}`, `std::time::Duration` and the `dbos` types they name.)
- DBOS does NOT stand for anything.

## Workflow Guidelines

Workflows provide durable execution so you can write programs that are resilient to any failure. In the event of any failure, execution resumes where it left off.
A workflow is an `async` function of one input that returns a `dbos::Result`, made of steps. Steps are the restart unit for the workflow: their results are checkpointed to the database, and on recovery a completed step returns its recorded result instead of running again.
Call any function that performs complex operations or accesses external APIs or services as a step, with `dbos::step(name, || f(args))`.

If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

- If asked to add DBOS to existing code, you MUST ask which function to make a workflow. Do NOT recommend any changes until they have told you what function to make a workflow. Do NOT make a function a workflow unless SPECIFICALLY requested.
- When making a function a workflow, you should make all functions it calls steps. Do NOT change the functions in any way, except to make them return a `dbos::Result` if they don't.
- Do NOT make functions steps unless they are DIRECTLY called by a workflow.
- If the workflow function performs a non-deterministic action, you MUST move that action into a step. Examples of non-deterministic actions include accessing an external API or service, accessing files on disk, reading environment variables, generating a random number or UUID, or getting the current time.
- A workflow function must be deterministic: given the same step results, it must make the same DBOS calls in the same order.
- Do NOT race, time out, spawn, or consume in completion order any DBOS call inside a workflow body. In particular, do NOT use `tokio::select!`, `futures::select!`, `futures::future::select`/`select_all`, `smol::future::race`/`or`, `tokio::time::timeout`, `FuturesUnordered`, `buffer_unordered`, `for_each_concurrent`, `tokio::spawn`, `smol::spawn` or `std::thread::spawn` around DBOS calls in a workflow body. Use `dbos::select_step!` to race DBOS calls, `dbos::sleep` for delays, and `tokio::join!` / `futures::future::join_all` to run them concurrently, with exactly one DBOS call per join element and never an `async` block containing several. `tokio::try_join!` and `try_join_all` stop at the first failure: use them only when the error goes straight out of the workflow, and never branch on which error came back. Do NOT call `start` or `run` inside a spawned task: each recovery that repeats the spawn starts another top-level workflow. Inside a step, plain races, timeouts and spawns are fine, but a DBOS call spawned from a step fails.
- Do NOT use `tokio::time::sleep` or another non-durable sleep in a workflow body; use `dbos::sleep`.
- Await `dbos::patch`, `dbos::deprecate_patch` and a debouncer's `debounce` on their own, never inside a join: they claim their step position when awaited.
- A workflow's future must be `Send + 'static`: don't hold an `Rc`, a `std::sync::MutexGuard` or a borrow across an `.await` in a workflow body.
- To start a child workflow, capture the child's `WorkflowRef` in the parent's registered closure (a `WorkflowRef` can't be a workflow's input), as the queue example below does.
- Do NOT start or enqueue workflows, or call `dbos::recv`, `dbos::set_event` or `dbos::patch`, from inside a step.
- Do NOT capture the `DBOS` instance in a workflow closure. Inside a workflow, use the free functions in the `dbos` crate (`dbos::step`, `dbos::send`, `dbos::cancel_workflow`, ...), which need no instance.
- Workflows and steps should NOT mutate shared state in memory outside their own scope.
- Register every workflow with `register_workflow` BEFORE `launch`. Register queues and create schedules AFTER `launch`.

## Serializability requirements

Workflow inputs and outputs, step outputs, and the values of events, messages and streams are serialized with `serde`, so they MUST implement `serde::Serialize` and `serde::Deserialize`. Derive them:

```rust
#[derive(serde::Serialize, serde::Deserialize)]
struct Order {
    id: u64,
    item: String,
}
```

A workflow takes exactly one input. To pass several values, take a struct or a tuple; to take none, take `()`.
An application error type MUST implement `std::error::Error`, `Serialize` and `Deserialize`, for example with `thiserror`:

```rust
#[derive(Debug, thiserror::Error, Serialize, Deserialize)]
enum CheckoutError {
    #[error("the card was declined")]
    CardDeclined,
    #[error("item {0} is out of stock")]
    OutOfStock(String),
}

async fn reserve(item: &str) -> dbos::Result<bool> {
    Ok(true)
}

async fn checkout(item: String) -> dbos::Result<String, CheckoutError> {
    // A step in the engine's error channel joins this one with `lift`.
    let reserved = step("reserve", || reserve(&item)).lift().await?;
    if !reserved {
        // `?` converts the application's own error into `dbos::Error::Application`.
        Err(CheckoutError::OutOfStock(item.clone()))?;
    }
    Ok(format!("reserved {item}"))
}
```

## Getting set up

Add the crate and Tokio:

```shell
cargo add dbos
cargo add tokio --features full
```

DBOS runs on Tokio by default. To run on smol instead, use `dbos = { version = "0.6", default-features = false, features = ["engine", "macros", "runtime-smol"] }`.

The application needs a PostgreSQL database. If there isn't one, start one with Docker:

```shell
docker run -d --name dbos-postgres -e POSTGRES_PASSWORD=dbos -p 5432:5432 postgres:17
export DBOS_SYSTEM_DATABASE_URL=postgres://postgres:dbos@localhost:5432/<application_name>
```

DBOS creates the database if it doesn't exist.

## DBOS Lifecycle Guidelines

Create a `DBOS` instance from a `Config`, register workflows, then launch. `DBOS` is cheap to clone (an `Arc`), so clone it into application state.
An application version is REQUIRED: set `config.app_version`, or launch fails unless `DBOS__APPVERSION` is set.

```rust
use dbos::{Config, DBOS};

async fn workflow(_: ()) -> dbos::Result<String> {
    dbos::step("step_one", step_one).await?;
    dbos::step("step_two", step_two).await?;
    Ok("success".to_owned())
}

async fn step_one() -> dbos::Result<()> {
    println!("Step one completed");
    Ok(())
}

async fn step_two() -> dbos::Result<()> {
    println!("Step two completed");
    Ok(())
}

#[tokio::main]
async fn main() -> dbos::Result<()> {
    let mut config = Config::from_env("dbos-starter");
    config.app_version = Some("0.1.0".to_owned());
    let dbos = DBOS::new(config);

    let workflow = dbos.register_workflow("workflow", workflow)?;
    dbos.launch().await?;

    let handle = workflow.start(()).await?;
    let result = handle.result().await?;
    println!("Workflow result: {result}");

    dbos.shutdown().await;
    Ok(())
}
```

`launch` recovers any workflows a previous run of this executor left unfinished. `shutdown` stops running workflows without failing them; they are recovered on the next launch.
DBOS logs through `tracing`; install a subscriber such as `tracing_subscriber::fmt::init()` to see its logs.

Here is a DBOS workflow served from an Axum endpoint:

```rust
use std::time::Duration;

use axum::Router;
use axum::extract::State;
use axum::http::StatusCode;
use axum::routing::get;
use dbos::{Config, DBOS, WorkflowRef};

async fn workflow(_: ()) -> dbos::Result<String> {
    dbos::step("step_one", step_one).await?;
    for _ in 0..5 {
        println!("Press Control + C to stop the app...");
        dbos::sleep(Duration::from_secs(1)).await?;
    }
    dbos::step("step_two", step_two).await?;
    Ok("success".to_owned())
}

async fn step_one() -> dbos::Result<()> {
    println!("Step one completed");
    Ok(())
}

async fn step_two() -> dbos::Result<()> {
    println!("Step two completed");
    Ok(())
}

async fn start_workflow(State(workflow): State<WorkflowRef<(), String>>) -> StatusCode {
    match workflow.start(()).await {
        Ok(_) => StatusCode::OK,
        Err(error) => {
            eprintln!("Error in DBOS workflow: {error}");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut config = Config::from_env("dbos-starter");
    config.app_version = Some("0.1.0".to_owned());
    let dbos = DBOS::new(config);

    let workflow = dbos.register_workflow("workflow", workflow)?;
    dbos.launch().await?;

    let app = Router::new()
        .route("/", get(start_workflow))
        .with_state(workflow);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    println!("Listening on http://localhost:8080");
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            tokio::signal::ctrl_c().await.ok();
        })
        .await?;

    dbos.shutdown().await;
    Ok(())
}
```

## Workflows and Steps

```rust
#[derive(Serialize, Deserialize)]
struct Order {
    id: u64,
    item: String,
}

async fn step_one(order_id: u64) -> dbos::Result<()> {
    println!("Step one completed for order {order_id}");
    Ok(())
}

async fn step_two(order_id: u64) -> dbos::Result<()> {
    println!("Step two completed for order {order_id}");
    Ok(())
}

async fn process_order(order: Order) -> dbos::Result<String> {
    dbos::step("step_one", || step_one(order.id)).await?;
    dbos::step("step_two", || step_two(order.id)).await?;
    Ok(format!("processed {}", order.item))
}

fn register(dbos: &DBOS) -> dbos::Result<WorkflowRef<Order, String>> {
    // Before dbos.launch().
    dbos.register_workflow("process_order", process_order)
}
```

Start a workflow with `WorkflowRef::start`, which returns a `WorkflowHandle`, or `run`, which waits for the result:

```rust
async fn start_example(process_order: &WorkflowRef<Order, String>) -> dbos::Result<()> {
    let order = Order {
        id: 1,
        item: "widget".to_owned(),
    };

    // Start the workflow in the background and get a handle to it...
    let handle = process_order.start(order).await?;
    let result = handle.result().await?;
    println!("Workflow result: {result}");

    // ...or run it and wait for its result in one call.
    let result = process_order
        .run(Order {
            id: 2,
            item: "gadget".to_owned(),
        })
        .await?;
    Ok(())
}
```

Called from inside a workflow, `start` and `run` start a child workflow, recorded in the parent.

A step's closure is `FnMut`, because a retry calls it again; capture arguments by reference or clone them inside the closure.
DBOS's own calls take the workflow's error type, so `?` works on them. A step over a function returning `dbos::Result<T>` has no error type of its own; carry it into a workflow with an error type using `.lift()`, or convert it with `.map_error()`.

### Step IDs

Every DBOS call takes its step ID when the call is BUILT, not when it is awaited. That is what makes `tokio::join!` over DBOS calls safe.

### Running steps concurrently

```rust
async fn fan_out(urls: Vec<String>) -> dbos::Result<Vec<String>> {
    // Each step takes its ID here, in the order of `urls`.
    let fetches: Vec<_> = urls
        .iter()
        .map(|url| step("fetch", move || fetch(url.clone())))
        .collect();
    // The steps run concurrently, and the results come back in the same order. The first failure
    // stops the join, which is fine here because the error goes straight out of the workflow.
    futures::future::try_join_all(fetches).await
}

async fn two_at_once(_: ()) -> dbos::Result<(String, String)> {
    let (a, b) = tokio::join!(
        step("fetch_a", || fetch("https://a.example".to_owned())),
        step("fetch_b", || fetch("https://b.example".to_owned())),
    );
    Ok((a?, b?))
}
```

### Racing durable calls

Use `select_step!`, which records the winning branch. Each branch is exactly one DBOS call. It refuses `if` guards, `else`, `biased;` and fewer than two branches.

```rust
async fn pay_or_expire(_: ()) -> dbos::Result<String> {
    dbos::select_step! {
        paid = step("wait_for_payment", wait_for_payment) => paid?,
        expired = dbos::sleep(Duration::from_secs(3600)) => {
            expired?;
            "expired".to_owned()
        }
    }
}
```

`dbos::select_workflow(&ids)` waits for the first of several workflows and returns its ID, recorded; `dbos::join_workflows(&ids)` waits for all of them.

## Workflow IDs and Idempotency

A workflow's ID is its idempotency key: starting a workflow with an ID that already exists returns the existing workflow.

```rust
async fn example_workflow(input: String) -> dbos::Result<String> {
    let id = dbos::workflow_id().expect("called inside a workflow");
    println!("Running workflow with ID: {id}");
    Ok("success".to_owned())
}

async fn workflow_id_example(example_workflow: &WorkflowRef<String, String>) -> dbos::Result<()> {
    let options = StartOptions {
        workflow_id: Some("unique-workflow-id-123"),
        ..StartOptions::default()
    };
    let handle = example_workflow
        .start_with("input".to_owned(), options)
        .await?;
    println!("Result: {}", handle.result().await?);
    Ok(())
}
```

Set `workflow_id_reuse_policy: WorkflowIdReusePolicy::Reject` to fail with `dbos::sysdb::Error::WorkflowIdInUse` instead.

## Determinism

```rust
async fn bad_workflow(_: ()) -> dbos::Result<String> {
    // Don't do this: a recovery may draw a different value and take the other branch.
    if rand_bool() {
        step("charge", charge).await
    } else {
        step("refund", refund).await
    }
}
```

Instead, make the choice a step:

```rust
async fn good_workflow(_: ()) -> dbos::Result<String> {
    // The choice is a step, so it is recorded, and a recovery takes the same branch.
    let choice = step("choose", || async { Ok(rand_bool()) }).await?;
    if choice {
        step("charge", charge).await
    } else {
        step("refund", refund).await
    }
}
```

## Workflow Timeouts

```rust
async fn timeout_example(example_workflow: &WorkflowRef<String, String>) -> dbos::Result<()> {
    let options = StartOptions {
        timeout: Duration::from_secs(12 * 60 * 60).into(),
        ..StartOptions::default()
    };
    let handle = example_workflow
        .start_with("wait-for-cancel".to_owned(), options)
        .await?;
    Ok(())
}
```

On expiry the workflow is cancelled, with the children that inherited its deadline; in the process running it, the workflow is dropped at its current `.await`. A child inherits its parent's deadline (`Timeout::Inherit`) unless given `Timeout::Explicit(d)` or `Timeout::None`.

## Durable Sleep

```rust
#[derive(Serialize, Deserialize)]
struct Reminder {
    time_to_sleep: Duration,
    task: String,
}

async fn reminder_workflow(input: Reminder) -> dbos::Result<String> {
    // Sleep for the specified duration.
    dbos::sleep(input.time_to_sleep).await?;
    // Execute the task after sleeping.
    step("run_task", || run_task(&input.task)).await
}
```

## Configurable Retries

```rust
#[derive(Debug, thiserror::Error, Serialize, Deserialize)]
enum FetchError {
    #[error("request failed: {0}")]
    Request(String),
    #[error("the server answered {0}")]
    Status(u16),
}

async fn fetch_page(url: &str) -> dbos::Result<String, FetchError> {
    let response = reqwest::get(url)
        .await
        .map_err(|error| FetchError::Request(error.to_string()))?;
    if !response.status().is_success() {
        Err(FetchError::Status(response.status().as_u16()))?;
    }
    let body = response
        .text()
        .await
        .map_err(|error| FetchError::Request(error.to_string()))?;
    Ok(body)
}

async fn fetch_workflow(url: String) -> dbos::Result<String, FetchError> {
    let options = StepOptions {
        max_attempts: 10,
        interval: Duration::from_millis(500),
        backoff_rate: 2.0,
        max_interval: Duration::from_secs(30),
        ..StepOptions::default()
    }
    // Retry server errors and network failures, but not a 4xx.
    .should_retry(|error| match error {
        dbos::Error::Application(FetchError::Status(status)) => *status >= 500,
        _ => true,
    });
    step_with("fetch_page", options, || fetch_page(&url)).await
}
```

`StepOptions` fields: `max_attempts` (default 1, no retries), `interval` (1s), `backoff_rate` (2.0), `max_interval` (1h), `timeout` (per attempt, `None`), `preemptible` (false), and `should_retry`, set with the `.should_retry(...)` method. With `max_attempts` above 1, a step that fails every attempt returns `Error::MaxStepRetriesExceeded`; a step that fails its only attempt returns its own error.

## Workflow Communication

Inside a workflow, use the free functions (`dbos::send`, `dbos::recv`, `dbos::set_event`, `dbos::get_event`, `dbos::write_stream`, `dbos::read_stream`). Outside one, call the method of the same name on `DBOS`, or on a `Client`.

### Messages

```rust
const PAYMENT_STATUS: &str = "payment_status";

async fn create_order() -> dbos::Result<()> {
    Ok(())
}
async fn fulfill_order() -> dbos::Result<()> {
    Ok(())
}
async fn cancel_order() -> dbos::Result<()> {
    Ok(())
}

async fn checkout_workflow(_: ()) -> dbos::Result<()> {
    dbos::step("create_order", create_order).await?;
    // Wait up to an hour for the payment service to report.
    let status: Option<String> =
        dbos::recv(Some(PAYMENT_STATUS), Duration::from_secs(60 * 60)).await?;
    match status.as_deref() {
        Some("paid") => dbos::step("fulfill_order", fulfill_order).await?,
        // Cancelled, or no answer before the timeout.
        _ => dbos::step("cancel_order", cancel_order).await?,
    }
    Ok(())
}

// The payment service's webhook handler.
async fn payment_webhook(dbos: &DBOS, workflow_id: &str, status: &str) -> dbos::Result<()> {
    let message = SendMessage {
        topic: Some(PAYMENT_STATUS),
        ..SendMessage::new(workflow_id, &status)
    };
    dbos.send_with(message, SendOptions::default()).await
}
```

### Events

```rust
const PAYMENT_URL: &str = "payment_url";

async fn create_payment_session() -> dbos::Result<String> {
    Ok("https://pay.example.com/session/123".to_owned())
}

async fn payment_workflow(_: ()) -> dbos::Result<()> {
    let url = dbos::step("create_payment_session", create_payment_session).await?;
    // Publish the URL for the web handler to read.
    dbos::set_event(PAYMENT_URL, &url).await?;
    // ... wait for the payment, as in the messages example ...
    Ok(())
}

// The web handler starts the workflow, then waits for it to publish the URL.
async fn start_checkout(
    dbos: &DBOS,
    payment_workflow: &WorkflowRef<(), ()>,
) -> dbos::Result<Option<String>> {
    let handle = payment_workflow.start(()).await?;
    let url: Option<String> = dbos
        .get_event(handle.workflow_id(), PAYMENT_URL, Duration::from_secs(60))
        .await?;
    Ok(url)
}
```

### Streams

```rust
#[derive(Serialize, Deserialize)]
struct Progress {
    item: u32,
    done: bool,
}

async fn process_item(item: u32) -> dbos::Result<()> {
    Ok(())
}

async fn producer_workflow(items: u32) -> dbos::Result<()> {
    for item in 0..items {
        dbos::step("process_item", || process_item(item)).await?;
        dbos::write_stream("progress", &Progress { item, done: false }).await?;
    }
    // Tell readers there's nothing more to come.
    dbos::close_stream("progress").await?;
    Ok(())
}
```

```rust
async fn watch_progress(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    let mut reader =
        dbos.read_stream::<Progress>(workflow_id, "progress", ReadStreamOptions::default());
    // `next` returns `None` once the stream is closed, or the workflow has finished.
    while let Some(progress) = reader.next().await? {
        println!("Processed item {}", progress.item);
    }
    Ok(())
}
```

## Queues

Queues run workflows in the background under flow control. A queue is stored in the database, so register it AFTER `launch`.

```rust
async fn register_example_queue(dbos: &DBOS) -> dbos::Result<()> {
    // After dbos.launch().
    dbos.register_queue(
        "example_queue",
        QueueOptions::default(),
        QueueConflict::UpdateIfLatestVersion,
    )
    .await?;
    Ok(())
}
```

Enqueue a workflow by starting it with a `QueueRequest`:

```rust
async fn process_task(task: String) -> dbos::Result<String> {
    // Process the task...
    Ok(format!("Processed: {task}"))
}

async fn enqueue_example(process_task: &WorkflowRef<String, String>) -> dbos::Result<()> {
    // Enqueue a workflow.
    let options = StartOptions {
        queue: Some(QueueRequest::new("example_queue")),
        ..StartOptions::default()
    };
    let handle = process_task
        .start_with("example_task".to_owned(), options)
        .await?;

    // Get the result.
    let result = handle.result().await?;
    println!("Task result: {result}");
    Ok(())
}
```

Here is a workflow that fans out ten child workflows on a queue and waits for them:

```rust
use std::time::Duration;

use axum::Router;
use axum::extract::State;
use axum::http::StatusCode;
use axum::routing::get;
use dbos::{Config, DBOS, QueueConflict, QueueOptions, QueueRequest, StartOptions, WorkflowRef};

const QUEUE: &str = "queue";

async fn task_workflow(i: u32) -> dbos::Result<u32> {
    dbos::sleep(Duration::from_secs(5)).await?;
    println!("Task {i} completed");
    Ok(i)
}

async fn queue_workflow(task: WorkflowRef<u32, u32>) -> dbos::Result<usize> {
    println!("Enqueuing tasks");
    let mut handles = Vec::new();
    for i in 0..10 {
        let options = StartOptions {
            queue: Some(QueueRequest::new(QUEUE)),
            ..StartOptions::default()
        };
        handles.push(task.start_with(i, options).await?);
    }
    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.result().await?);
    }
    println!("Successfully completed {} tasks", results.len());
    Ok(results.len())
}

async fn start_workflow(State(workflow): State<WorkflowRef<(), usize>>) -> StatusCode {
    match workflow.start(()).await {
        Ok(_) => StatusCode::OK,
        Err(error) => {
            eprintln!("Error in DBOS workflow: {error}");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut config = Config::from_env("dbos-starter");
    config.app_version = Some("0.1.0".to_owned());
    let dbos = DBOS::new(config);

    let task = dbos.register_workflow("task_workflow", task_workflow)?;
    let queue_workflow =
        dbos.register_workflow("queue_workflow", move |_: ()| queue_workflow(task.clone()))?;
    dbos.launch().await?;

    dbos.register_queue(
        QUEUE,
        QueueOptions::default(),
        QueueConflict::UpdateIfLatestVersion,
    )
    .await?;

    let app = Router::new()
        .route("/", get(start_workflow))
        .with_state(queue_workflow);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    println!("Listening on http://localhost:8080");
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            tokio::signal::ctrl_c().await.ok();
        })
        .await?;

    dbos.shutdown().await;
    Ok(())
}
```

### QueueOptions

- `worker_concurrency`: the most of the queue's workflows one process runs at once. Prefer this to `concurrency`.
- `concurrency`: the most that run at once across all processes.
- `rate_limit`: `Some(RateLimit { limit, period })`.
- `partition_concurrency`, `partition_worker_concurrency`, `partition_rate_limit`: the same limits per partition key; setting any of them partitions the queue, and each enqueue must then set `partition_key`.
- `polling_interval`: default one second.

`QueueConflict::UpdateIfLatestVersion` (usual at startup), `AlwaysUpdate` or `NeverUpdate` says what `register_queue` does when the queue exists. Change a queue at runtime with `dbos.update_queue(name, QueueChange { field: Change::Set(value), ..QueueChange::default() })`.

### QueueRequest fields

- `deduplication_id`: at most one enqueued or running workflow per ID on the queue; a second fails with `dbos::sysdb::Error::QueueDeduplicated`, or returns the holder with `duplication_policy: DuplicationPolicy::ReturnExisting`.
- `priority`: 1 to 2,147,483,647; lower runs first.
- `partition_key`: the partition, on a partitioned queue.
- `delay`: hold the workflow `DELAYED` this long before it can run.

```rust
async fn priority_example(task_workflow: &WorkflowRef<String, String>) -> dbos::Result<()> {
    let options = StartOptions {
        queue: Some(QueueRequest {
            priority: Some(10),
            ..QueueRequest::new("example_queue")
        }),
        ..StartOptions::default()
    };
    let handle = task_workflow.start_with("task".to_owned(), options).await?;
    Ok(())
}
```

### Enqueueing from Another Application

```rust
#[derive(Serialize, Deserialize)]
struct ProcessInput {
    task_id: String,
    data: String,
}

#[derive(Serialize, Deserialize)]
struct ProcessOutput {
    result: String,
    status: String,
}

async fn enqueue_from_client() -> dbos::Result<()> {
    let client = Client::connect(ClientConfig::new(
        "postgres://postgres:dbos@localhost:5432/dbos_starter_rust",
    ))
    .await?;

    let input = ProcessInput {
        task_id: "task-123".to_owned(),
        data: "data".to_owned(),
    };
    // The type parameters say what the workflow returns; nothing here can check it.
    let handle: WorkflowHandle<ProcessOutput> = client
        .enqueue("data_pipeline", "pipeline_queue", input)
        .await?;
    let output = handle.result().await?;
    println!("Pipeline finished: {}", output.status);

    client.close().await;
    Ok(())
}
```

## Workflow Management

```rust
async fn list_errors(dbos: &DBOS) -> dbos::Result<()> {
    let filter = WorkflowFilter {
        status: vec![WorkflowStatus::Error],
        limit: Some(20),
        sort_desc: true,
        ..WorkflowFilter::default()
    };
    for workflow in dbos.list_workflows(&filter).await? {
        println!(
            "{} {:?} {:?}",
            workflow.workflow_id, workflow.name, workflow.error
        );
    }
    Ok(())
}
```

```rust
async fn cancel_example(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    dbos.cancel(workflow_id).await?;
    Ok(())
}

async fn cancel_tree(dbos: &DBOS, workflow_ids: &[&str]) -> dbos::Result<()> {
    // Cancels each workflow and all its descendants.
    let cancelled = dbos.cancel_all(workflow_ids, Children::Include).await?;
    Ok(())
}
```

```rust
async fn resume_example(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    let handle = dbos.resume::<String, dbos::EngineOnly>(workflow_id).await?;
    let result = handle.result().await?;
    Ok(())
}
```

```rust
async fn fork_example(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    // Fork from step 3, onto the version of the code that has the fix.
    let options = ForkOptions {
        app_version: Some("1.2.1"),
        ..ForkOptions::default()
    };
    let handle = dbos
        .fork_with::<String, dbos::EngineOnly>(Fork::new(workflow_id, 3), options)
        .await?;
    println!("Forked {} as {}", workflow_id, handle.workflow_id());
    Ok(())
}
```

Inside a workflow, use the free functions, which are recorded as steps:

```rust
async fn supervisor(child_id: String) -> dbos::Result<()> {
    // Inside a workflow, use the free functions: each is recorded as a step.
    dbos::cancel_workflow(&child_id).await?;
    let handle = dbos::resume_workflow::<(), dbos::EngineOnly>(&child_id).await?;
    handle.result().await?;
    Ok(())
}
```

## Scheduled Workflows

A scheduled workflow takes a `ScheduledWorkflowInput<C>`, where `C` is the schedule's context type.

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

Cron expressions have five fields, or six with seconds first. Use `apply_schedules` to create-or-replace a set of schedules at startup.

## Upgrading Workflow Code

To change which steps a workflow runs while old executions may still recover, patch it, keeping the same application version:

```rust
async fn workflow(_: ()) -> dbos::Result<String> {
    let a = if dbos::patch("use-baz").await? {
        // New workflows take the new code.
        step("baz", baz).await?
    } else {
        // Workflows that already ran past this point take the old code.
        step("foo", foo).await?
    };
    let b = step("bar", bar).await?;
    Ok(a + &b)
}
```

Patching protects old executions from new code, not the reverse: a process still running the old code that dequeues or recovers a workflow the new code patched fails with `UnexpectedStep`. Stop every process running the old code before starting the new code; if they must run side by side, give each deployment its own `app_version` instead of patching.

Once no old execution can run, replace `patch` with `dbos::deprecate_patch("use-baz")` and keep only the new path; later remove it entirely.

## Testing

Outside a workflow, `dbos::step` and `dbos::sleep` run as plain calls, so functions built from them can be tested directly:

```rust
#[tokio::test]
async fn quote_applies_the_discount() {
    // Outside a workflow, each step runs as a plain function call and records nothing.
    assert_eq!(quote("widget".to_owned()).await.unwrap(), 90);
}
```

To test durable behavior, launch DBOS against a test database in the test, with fresh workflow IDs, and shut it down at the end. Tests that run in parallel need separate databases or `Config::schema` values (or `--test-threads=1`): they share the executor ID and application version, so one test's launch recovers another's `PENDING` workflows.

## Configuration

`Config` fields (set after `Config::new(app_name, url)` or `Config::from_env(app_name)`):

- `app_name`: required; 3 to 256 lowercase letters, digits, dashes and underscores.
- `database_url`: the system database URL; `from_env` reads `DBOS_SYSTEM_DATABASE_URL`.
- `app_version`: required, here or in `DBOS__APPVERSION`. `env!("CARGO_PKG_VERSION")` is a good choice.
- `executor_id`: default `DBOS__VMID`, then `"local"`.
- `max_connections`: default 10.
- `schema`: default `"dbos"`.
- `migrate`: default true.
- `serializer`: default `rust_serde`; `Serializer::custom(...)` for a `CustomSerializer`.
- `use_listen_notify`: default true.
- `listen_queues`: default `None` (all queues).

DBOS for Rust does not support DBOS Conductor or DBOS Cloud, and has no transaction API: database writes inside a step are at-least-once, so make them idempotent.
````

</details>
