---
sidebar_position: 90
title: Testing
---

A DBOS workflow is an ordinary `async fn`, so you can test it at two levels: as plain code, without a database, and as a durable workflow, against a real Postgres.

## Testing without a database

Outside a workflow, [`dbos::step`](https://docs.rs/dbos/latest/dbos/fn.step.html) runs its function as a plain call and records nothing.
So a function built from steps can be called directly from a test.
For example, given this workflow:

```rust
use dbos::step;

async fn fetch_price(item: &str) -> dbos::Result<u32> {
    Ok(if item == "widget" { 100 } else { 250 })
}

async fn apply_discount(price: u32) -> dbos::Result<u32> {
    Ok(price * 9 / 10)
}

pub async fn quote(item: String) -> dbos::Result<u32> {
    let price = step("fetch_price", || fetch_price(&item)).await?;
    step("apply_discount", || apply_discount(price)).await
}
```

You can test its logic like any other async function:

```rust
#[tokio::test]
async fn quote_applies_the_discount() {
    // Outside a workflow, each step runs as a plain function call and records nothing.
    assert_eq!(quote("widget".to_owned()).await.unwrap(), 90);
}
```

`dbos::sleep` is a plain sleep outside a workflow too.
Calls that only make sense in a workflow, like `dbos::set_event`, `dbos::recv` or `dbos::send`, return `Error::NotInWorkflow` when called outside one; test code that uses them as a workflow, as below.
To test without the step functions' side effects, factor those out behind a trait or a function argument in the usual Rust ways; DBOS doesn't need to know about it.

## Testing workflows against Postgres

To test durable behavior, such as the steps a workflow records, its messages and events, or queues, launch DBOS in the test against a database for tests alone.
DBOS creates the database and its tables on first launch:

```rust
use dbos::{Config, DBOS, StartOptions};

async fn launch_for_test() -> dbos::Result<(DBOS, dbos::WorkflowRef<String, u32>)> {
    // A database for tests alone: DBOS creates it if it doesn't exist.
    let mut config = Config::new(
        "pricing-tests",
        std::env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:dbos@localhost:5432/pricing_test".to_owned()),
    );
    config.app_version = Some("test".to_owned());
    let dbos = DBOS::new(config);
    let quote = dbos.register_workflow("quote", quote)?;
    dbos.launch().await?;
    Ok((dbos, quote))
}

#[tokio::test]
async fn quote_runs_as_a_workflow() -> dbos::Result<()> {
    let (dbos, quote) = launch_for_test().await?;

    let workflow_id = format!("quote-test-{}", uuid::Uuid::new_v4());
    let options = StartOptions {
        workflow_id: Some(&workflow_id),
        ..StartOptions::default()
    };
    let handle = quote.start_with("gadget".to_owned(), options).await?;
    assert_eq!(handle.result().await?, 225);

    // The workflow recorded both steps.
    let steps = dbos.list_workflow_steps(&workflow_id).await?;
    let names: Vec<_> = steps.iter().map(|step| step.step_name.as_str()).collect();
    assert_eq!(names, ["fetch_price", "apply_discount"]);

    dbos.shutdown().await;
    Ok(())
}
```

Keep in mind when writing these tests:

- **Workflow IDs are idempotency keys.** Starting a workflow with an ID that already exists returns the existing workflow instead of running it again. Use fresh IDs in each test run, such as UUIDs as in the example, or drop the test database between runs.
- **Register before launch.** Each test that builds its own `DBOS` registers its workflows before calling `launch`, as an application does.
- **Shut down at the end.** [`shutdown`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.shutdown) stops the background tasks and closes the connection pool.
- **Give tests that run in parallel their own databases.** Cargo runs the tests in a binary in parallel, and every test that calls `launch_for_test` launches with the same application version and executor ID (`"local"` by default). Launching DBOS recovers the `PENDING` workflows recorded under its executor ID and version, so one test's launch can take another test's running workflows away from it. Unique queue names and workflow IDs don't prevent this. Give each test its own database, or its own system schema with [`Config::schema`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.schema), or run the tests that share a database one at a time (`cargo test -- --test-threads=1`).
- **Each test runs on its own runtime.** `#[tokio::test]` gives each test a fresh Tokio runtime, and DBOS's background tasks run on the runtime that launched it. Launch DBOS in each test, rather than sharing one instance across tests through a `static`.
