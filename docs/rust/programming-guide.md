---
sidebar_position: 10
title: Learn DBOS Rust
pagination_prev: quickstart
---

This guide shows you how to use DBOS to build Rust apps that are **resilient to any failure**.

## 1. Setting Up Your Environment

Create a new Rust project and add DBOS and [Tokio](https://tokio.rs) to it:

```shell
cargo new dbos-starter
cd dbos-starter
cargo add dbos
cargo add tokio --features full
```

DBOS runs on Tokio by default.
It also runs on [smol](https://github.com/smol-rs/smol) and [async-global-executor](https://github.com/async-rs/async-global-executor); see [Choosing an Async Runtime](./tutorials/async-runtimes.md).

DBOS requires a Postgres database.
If you don't already have Postgres, you can start one in a Docker container:

```shell
docker run -d --name dbos-postgres -e POSTGRES_PASSWORD=dbos -p 5432:5432 postgres:17
```

Then set the `DBOS_SYSTEM_DATABASE_URL` environment variable to your connection string.
DBOS creates the database if it doesn't exist.
For example:

```shell
export DBOS_SYSTEM_DATABASE_URL=postgres://postgres:dbos@localhost:5432/dbos_starter_rust
```

## 2. Workflows and Steps

DBOS helps you add reliability to Rust programs.
The key feature of DBOS is **workflow functions** comprised of **steps**.
DBOS automatically provides durability by checkpointing the state of your workflows and steps to its system database.
If your program crashes or is interrupted, DBOS uses this saved state to recover each of your workflows from its last completed step.
Thus, DBOS makes your application **resilient to any failure**.

Let's create a simple DBOS program that runs a workflow of two steps.
Replace the contents of `src/main.rs` with:

```rust showLineNumbers title="src/main.rs"
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

A workflow is an `async fn` that takes one input and returns a `dbos::Result`.
You register it with [`register_workflow`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.register_workflow) before calling `launch`, which hands back a typed [`WorkflowRef`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html) you start the workflow with.
Inside it, [`dbos::step`](https://docs.rs/dbos/latest/dbos/fn.step.html) runs a function as a step and checkpoints its result.

Now, run this code with:

```shell
cargo run
```

Your program should print output like:

```
Step one completed
Step two completed
Workflow result: success
```

To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint using [Axum](https://github.com/tokio-rs/axum).
First, add Axum to your project:

```shell
cargo add axum
```

Then replace the contents of `src/main.rs` with:

```rust showLineNumbers title="src/main.rs"
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

Now, run this code with:

```shell
cargo run
```

Then, visit this URL: http://localhost:8080.

In your terminal, you should see an output like:

```
Listening on http://localhost:8080
Step one completed
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
```

Now, press CTRL+C to stop your app. Then, run `cargo run` to restart it. You should see an output like:

```
Listening on http://localhost:8080
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Step two completed
```

You can see how DBOS **recovers your workflow from the last completed step**, executing step two without re-executing step one.
`launch` recovers the workflows a previous run of the app left unfinished.
The sleeps that already finished return at once, so the loop prints its message again without waiting.
Learn more about workflows, steps, and their guarantees [here](./tutorials/workflow-tutorial.md).

## 3. Queues and Parallelism

To run many functions concurrently, use DBOS _queues_.
To try them out, copy this code into `src/main.rs`:

```rust showLineNumbers title="src/main.rs"
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

When you start a workflow with a [`QueueRequest`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html) in its `StartOptions`, DBOS enqueues it and runs it _asynchronously_, in the background, without waiting for it to finish.
`start_with` returns a [handle](https://docs.rs/dbos/latest/dbos/struct.WorkflowHandle.html) representing the state of the enqueued workflow.
This example enqueues ten workflows, then waits for them all to finish by awaiting each handle's `result()`.

A queue is stored in the database, so `register_queue` comes after `launch`.
`QueueConflict::UpdateIfLatestVersion` says what to do if the queue already exists: overwrite its stored configuration, but only from the latest version of the application.

Now, restart your app with:

```shell
cargo run
```

Then, visit this URL: http://localhost:8080.
Wait five seconds and you should see an output like:

```
Listening on http://localhost:8080
Enqueuing tasks
Task 6 completed
Task 1 completed
Task 9 completed
Task 3 completed
Task 8 completed
Task 5 completed
Task 2 completed
Task 7 completed
Task 0 completed
Task 4 completed
Successfully completed 10 tasks
```

You can see how all ten tasks run concurrently&mdash;even though each takes five seconds, they all finish at the same time.
Learn more about DBOS queues [here](./tutorials/queue-tutorial.md).

Congratulations!  You've finished the DBOS Rust guide.
Next, you should:
- Learn how to [**add DBOS to your own application**](./integrating-dbos.md).
- Read about [**determinism in workflows**](./tutorials/workflow-tutorial.md#determinism), including why a `tokio::select!` over steps isn't durable.
