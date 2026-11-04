---
sidebar_position: 10
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of [steps](./step-tutorial.md), which wrap ordinary Rust functions.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

A workflow is an `async` function (or closure) that takes **one input** and returns a [`dbos::Result`](https://docs.rs/dbos/latest/dbos/type.Result.html).
To take several values, take a struct or a tuple; to take none, take `()`.
The input and output must implement `serde`'s `Serialize` and `Deserialize`, because DBOS records them in the database.

Register each workflow with [`register_workflow`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.register_workflow) **before** calling `launch`.
Registration names the workflow and returns a typed [`WorkflowRef`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html), which is how you start it:

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

The name is the workflow's identity in the database: recovery, queues and clients find the workflow by it, so keep it stable across deployments.

Start a workflow with [`start`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html#method.start), which runs it in the background and returns a [`WorkflowHandle`](https://docs.rs/dbos/latest/dbos/struct.WorkflowHandle.html).
Await the handle's `result()` to wait for the workflow to finish, or use [`run`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html#method.run) to start the workflow and wait for its result in one call:

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

Called from inside another workflow, `start` and `run` start a **child workflow**: DBOS records the start in the parent, so a recovered parent gets the same child back rather than starting another.

:::warning
Don't capture the `DBOS` instance in a workflow closure.
The instance owns its registered workflows, so a workflow that holds the instance keeps it from ever being freed.
A workflow body doesn't need it: steps, sleeps, events, messages and the [workflow management calls](./workflow-management.md) are all free functions in the `dbos` crate that find the running workflow on their own.
Starting a child workflow is the exception: it needs the child's `WorkflowRef`, which holds the instance too, so a workflow that captures one (as the [queue example](../programming-guide.md#3-queues-and-parallelism) does) keeps the instance alive.
That is a known limitation, harmless for a process that launches DBOS once and runs until it exits.
:::

## Errors

A workflow's result type is `dbos::Result<T, E>`, which is `Result<T, dbos::Error<E>>`.
`E` is your application's own error type; [`dbos::Error`](https://docs.rs/dbos/latest/dbos/enum.Error.html) wraps it as `Error::Application(E)` alongside DBOS's own errors (a cancellation, a database failure, and so on).
When the workflow has no error of its own, leave `E` out: `dbos::Result<T>` uses the uninhabited [`EngineOnly`](https://docs.rs/dbos/latest/dbos/enum.EngineOnly.html), so it can carry only DBOS's errors.

DBOS records a workflow's error and returns that same error from every later await of the workflow, so the error type must implement `std::error::Error`, `Serialize` and `Deserialize`.
`?` converts your error into `dbos::Error` for you:

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

DBOS's own calls, like `dbos::sleep`, `dbos::send` and `dbos::recv`, take the error type of the workflow they're used in, so `?` works on them directly.
A step takes its error type from its function: a step over a function returning `dbos::Result<T>` has none, and [`.lift()`](https://docs.rs/dbos/latest/dbos/struct.PendingStep.html#method.lift) carries it into the workflow's, as `checkout` does.
For a step whose error type differs from the workflow's, convert it with [`.map_error()`](https://docs.rs/dbos/latest/dbos/struct.PendingStep.html#method.map_error).

## Workflow IDs and Idempotency

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this ID inside the workflow with [`dbos::workflow_id()`](https://docs.rs/dbos/latest/dbos/fn.workflow_id.html), or from the handle's [`workflow_id()`](https://docs.rs/dbos/latest/dbos/struct.WorkflowHandle.html#method.workflow_id) method.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow with [`StartOptions`](https://docs.rs/dbos/latest/dbos/struct.StartOptions.html) and `start_with` (or [`RunOptions`](https://docs.rs/dbos/latest/dbos/struct.RunOptions.html) and `run_with`).
Workflow IDs must be **globally unique** for your application.
An assigned workflow ID acts as an idempotency key: if a workflow is called multiple times with the same ID, it executes only once.
This is useful if your operations have side effects like making a payment or sending an email.
For example:

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

By default, if you start a workflow with an ID that is already in use, DBOS returns a handle to the existing workflow instead of starting a new one.
To instead return an error when a workflow ID is already in use, set `workflow_id_reuse_policy` to `WorkflowIdReusePolicy::Reject`:

```rust
async fn reject_example(example_workflow: &WorkflowRef<String, String>) -> dbos::Result<()> {
    let options = StartOptions {
        workflow_id: Some("very-unique-id"),
        workflow_id_reuse_policy: WorkflowIdReusePolicy::Reject,
        ..StartOptions::default()
    };
    match example_workflow
        .start_with("input".to_owned(), options)
        .await
    {
        Ok(handle) => println!("started {}", handle.workflow_id()),
        Err(dbos::Error::SystemDatabase(dbos::sysdb::Error::WorkflowIdInUse { .. })) => {
            // A workflow with this ID already exists.
        }
        Err(error) => return Err(error),
    }
    Ok(())
}
```

## Determinism

Workflows are in most respects normal Rust functions.
They can have loops, branches, conditionals, and so on.
However, a workflow function must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order (given the same return values from those steps).
When DBOS recovers a workflow, it runs the workflow function again from the start and replays each completed step's recorded result in place of running the step.
That only works if the function reaches the same durable calls in the same order as the first time.

### Non-deterministic values

If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, reading a file or an environment variable, or getting the local time (`SystemTime::now()`, `Instant::now()`, `chrono::Utc::now()`, `Uuid::new_v4()`), you shouldn't do it directly in a workflow function.
Instead, you should perform all non-deterministic operations in [steps](./step-tutorial.md), whose results are recorded and replayed.

For example, **don't do this**:

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

Instead, do this:

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

When a recovery does reach a different step than the one recorded at that position, DBOS refuses it with `dbos::sysdb::Error::UnexpectedStep` (inside `Error::SystemDatabase`) rather than replaying the wrong result.
The refusal isn't recorded as the workflow's outcome: the workflow stays `PENDING`, recovery tries it again, and after 100 attempts it is parked as `MAX_RECOVERY_ATTEMPTS_EXCEEDED`.
DBOS compares step names, not inputs, so a recovery that reaches the same step with different inputs isn't detected. Don't rely on the error to catch every mistake.

### Step IDs are taken where a call is written

Every durable call (`step`, `sleep`, `set_event`, `recv`, starting a child, awaiting a handle's `result()`, and so on) returns a future that has **already taken its step ID** when it is built, before it is first polled.
IDs follow the order your code *builds* the calls in, not the order they finish in:

```rust
async fn build_order(_: ()) -> dbos::Result<()> {
    let first = step("first", || async { Ok(1) }); // step ID 0
    let second = step("second", || async { Ok(2) }); // step ID 1
    // Awaiting them in the other order doesn't change their IDs.
    second.await?;
    first.await?;
    Ok(())
}
```

This is what makes concurrency inside a workflow safe, as long as nothing records a choice that depends on timing.

### Concurrency in workflows

Rust's async ecosystem makes it easy to race, time out, or spawn futures, and most of those make a choice that depends on timing.
DBOS records step results, not which future won a race, so a recovery can take a different branch than the original execution did.
**The following are not supported inside a workflow body:**

- **Races over durable calls.** The winner isn't recorded, so a recovery can take another branch.
  Use [`select_step!`](#selecting-the-first-result) instead.
  - Tokio: `tokio::select!`
  - `futures`: `futures::select!`, `select_biased!`, `futures::future::select`, `select_all` and `select_ok`
  - smol and `futures-lite`: `future::or`, `future::race`, and `FutureExt::or` / `FutureExt::race` (`smol::future` re-exports `futures_lite::future`)
- **Timeouts around durable calls.** A timeout is a race against a timer.
  Use `select_step!` with a durable [`dbos::sleep`](#durable-sleep), or the call's own timeout option where it has one (such as [step timeouts](./step-tutorial.md#step-timeouts) or `recv`'s timeout).
  - Tokio: `tokio::time::timeout` and `timeout_at`
  - smol and async-global-executor: an `async_io::Timer` (also `smol::Timer`) raced with `or` or `race`
- **Non-durable sleeps.** `tokio::time::sleep`, `smol::Timer::after` or an `async_io::Timer` used as a delay in a workflow body isn't recorded, so it runs again in full on every recovery.
  Use [`dbos::sleep`](#durable-sleep).
- **Completion-order streams over durable calls.** The order in which concurrent calls finish comes from their latency, which isn't recorded.
  On a recovery, every completed call is ready at once and comes out in the order it was pushed, so steps a loop runs for each completion can be handed each other's recorded results.
  Nothing reports an error.
  DBOS has no durable replacement for these yet; run such a fan-out as [child workflows](#starting-workflows-in-parallel) on a queue, or sequentially.
  - `futures::stream::FuturesUnordered`, `StreamExt::buffer_unordered` and `StreamExt::for_each_concurrent`
  - any other combinator that yields results in completion order, including `futures-lite`'s
- **Spawning a durable call.** DBOS finds the running workflow through a task-local, which a spawned task doesn't inherit, on any runtime. What happens then depends on the call, and the commonest case is silent:
  a step or `dbos::sleep` built inside the spawned task runs as a plain call and records nothing;
  a step built in the workflow and awaited in the spawned task fails with `Error::StepBuiltElsewhere`;
  and `send`, `recv`, `set_event`, `get_event` and the management calls fail with `Error::NotInWorkflow`.
  - Tokio: `tokio::spawn`, `tokio::task::spawn_blocking` and `JoinSet`
  - smol: `smol::spawn`, `smol::unblock` and `Executor::spawn`
  - async-global-executor: `async_global_executor::spawn`, `spawn_local` and `spawn_blocking`
  - `std::thread::spawn`

None of this applies **inside a step**: a step's body runs once per attempt and only its result is recorded, so it can use any of these freely.

These are supported in a workflow body:

- `tokio::join!`, `futures::join!`, `futures::future::join_all` and `try_join_all`, and `futures_lite::future::zip` and `try_zip`.
  Each returns results in input order, and each step took its ID when it was built.
  They work on every runtime DBOS supports.
- [`select_step!`](#selecting-the-first-result), and [`select_workflow`](#waiting-for-child-workflows) and [`join_workflows`](#waiting-for-child-workflows) (and their `select_workflow!` and `join_workflows!` macro forms).
- [`dbos::sleep`](#durable-sleep), for durable delays.

## Concurrent Steps

### Running steps concurrently

To run several steps at once, build them and then join them.
Each step takes its ID where it is built, so the steps get the same IDs on every recovery, and the join returns the results in the order you built them:

```rust
async fn fan_out(urls: Vec<String>) -> dbos::Result<Vec<String>> {
    // Each step takes its ID here, in the order of `urls`.
    let fetches: Vec<_> = urls
        .iter()
        .map(|url| step("fetch", move || fetch(url.clone())))
        .collect();
    // The steps run concurrently, and the results come back in the same order.
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

### Selecting the first result

To race durable calls, use [`select_step!`](https://docs.rs/dbos/latest/dbos/macro.select_step.html).
It runs the branches concurrently and records which one finished first, so a recovery replays the recorded winner and takes the same arm.
Each branch is a single durable call: a step, a `dbos::sleep`, a `get_event` or `recv`, a handle's `result()`, and so on.
For example, to wait for a payment for at most an hour:

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

Branches are polled in source order, and the macro refuses `if` guards, `else` arms, `biased;` and races of fewer than two branches at compile time, because each would let the set of branches change between an execution and its recovery.
A losing step is dropped and records nothing; a losing `result()` stops waiting, but the child workflow keeps running.
`select_step!` needs the `macros` Cargo feature, which is on by default.

### Waiting for child workflows

[`select_workflow`](https://docs.rs/dbos/latest/dbos/fn.select_workflow.html) waits for the first of several workflows to finish and returns its ID, and [`join_workflows`](https://docs.rs/dbos/latest/dbos/fn.join_workflows.html) waits for all of them.
`select_workflow` records which workflow finished first, so a recovery gets the same answer. `join_workflows` records nothing and takes no step ID: a recovery simply waits for the set again. Both take one query per poll whatever the number of workflows, so prefer them to racing many handles' `result()` calls in `select_step!`:

```rust
async fn first_child(children: Vec<String>) -> dbos::Result<String> {
    let ids: Vec<&str> = children.iter().map(String::as_str).collect();
    // The ID of the first child to finish, recorded so a recovery picks the same one.
    let winner = dbos::select_workflow(&ids).await?;
    // Wait for all of them.
    dbos::join_workflows(&ids).await?;
    Ok(winner)
}
```

### Starting workflows in parallel

To run many functions concurrently, start them as child workflows on a [queue](./queue-tutorial.md).
Each child has its own steps and recovers on its own.

## Workflow Timeouts

You can set a timeout for a workflow with the `timeout` field of `StartOptions` or `RunOptions`, which takes a [`Timeout`](https://docs.rs/dbos/latest/dbos/enum.Timeout.html):

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

When the timeout expires, the workflow is cancelled, along with the children that inherited its deadline; a child with its own timeout, or `Timeout::None`, is left running.
In the process running the workflow, the timeout stops it at once, including a step in progress (whose [cancellation token](./step-tutorial.md#step-timeouts) fires); the step records nothing and runs again if the workflow is resumed.
A workflow no process is running is marked `CANCELLED` by a sweep.
Either way, the workflow's next durable call fails with `Error::WorkflowCancelled`.
See [cancelling workflows](./workflow-management.md#cancelling-workflows) for details.

Timeouts are **start-to-completion**: if a workflow is [enqueued](./queue-tutorial.md), the timeout does not begin until the workflow is dequeued and starts execution.
Timeouts are also durable: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

A child workflow inherits its parent's deadline by default (`Timeout::Inherit`), even when it is enqueued.
`Timeout::Explicit(duration)` (or `duration.into()`) gives the child its own budget in place of the parent's, and `Timeout::None` lets it run with no deadline, even under a parent that has one.

## Durable Sleep

You can use [`dbos::sleep`](https://docs.rs/dbos/latest/dbos/fn.sleep.html) to put your workflow to sleep for any period of time.
This sleep is **durable**&mdash;DBOS saves the wakeup time in the database so that even if the workflow is interrupted and restarted multiple times while sleeping, it still wakes up on schedule.

Sleeping is useful for scheduling a workflow to run in the future (even days, weeks, or months from now).
For example:

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

## Scheduled Workflows

You can schedule workflows to run on a cron expression.
Schedules are stored in the database and can be created, paused, resumed, and deleted at runtime.
See the [scheduled workflows tutorial](./scheduled-workflows.md) for details.

## Debouncing

**Debouncing** delays a workflow's execution until some time has passed since it was last called.
This is useful when rapid successive triggers should be coalesced into a single workflow execution.
For example, if a user is editing a text field, you may want to start a processing workflow only after the user stops typing.

To debounce a workflow, create a [`Debouncer`](https://docs.rs/dbos/latest/dbos/struct.Debouncer.html) for it:

```rust
async fn process_input(input: String) -> dbos::Result<String> {
    Ok(input)
}

async fn debounce_example(dbos: &DBOS) -> dbos::Result<()> {
    // Registered before launch:
    let process_input = dbos.register_workflow("process_input", process_input)?;

    // After launch:
    let debouncer = dbos::Debouncer {
        // Never hold the workflow back more than a minute after the first call.
        debounce_timeout: Some(Duration::from_secs(60)),
        ..dbos::Debouncer::new(&process_input)
    };
    // Each call within five seconds of the last pushes the start back;
    // the workflow runs once, with the last input.
    let handle = debouncer
        .debounce(
            "user-123",
            Duration::from_secs(5),
            "latest input".to_owned(),
        )
        .await?;
    Ok(())
}
```

Key behaviors:

- Each call to `debounce` with the same key pushes back the workflow's start by the given period.
- When the period passes without another call, the workflow executes with the most recent input.
- `debounce_timeout` caps how long the workflow can be held back, counted from the first call. With no cap (the default), the start can be pushed back indefinitely.
- Different keys debounce independently, so you can debounce per user, per tenant, or per resource.
- The debounced workflow waits and runs on an internal queue unless you name one with the `queue` field. The same key on two queues is two debounces.
- Every call that coalesces returns a handle to the same workflow.

### Debouncing from an External Application

You can also debounce workflows from outside your DBOS application with a [`DebouncerClient`](https://docs.rs/dbos/latest/dbos/struct.DebouncerClient.html), which names the workflow and its queue:

```rust
async fn debounce_from_client() -> dbos::Result<()> {
    let client = dbos::Client::connect(dbos::ClientConfig::from_env()).await?;
    let debouncer = dbos::DebouncerClient::new(&client, "process_input", "process-queue");
    let handle: WorkflowHandle<String> = debouncer
        .debounce("user-123", Duration::from_secs(5), "some input")
        .await?;
    client.close().await;
    Ok(())
}
```

## Workflow Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process is interrupted while executing a workflow and restarts, it resumes the workflow from the last completed step.
2.  [Steps](./step-tutorial.md) are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed (returned a value or an error to the calling workflow), it will never be re-executed.
The exception is a step that was running when its workflow was [cancelled](./workflow-management.md#cancelling-workflows): its result isn't recorded, so it runs again if the workflow is resumed.

If a workflow returns an error, the workflow **terminates**&mdash;DBOS records the error, sets the workflow status to `ERROR`, and **does not recover the workflow**.
This is because errors returned from a workflow are assumed to be nonrecoverable.
If your workflow performs operations that may transiently fail (for example, sending HTTP requests to unreliable services), those should be performed in [steps with configured retries](./step-tutorial.md#configurable-retries).
DBOS provides [tooling](./workflow-management.md) to help you identify failed workflows and examine their errors.

A **panic** in a workflow is not an error: DBOS logs it with the workflow's ID and records nothing, so the workflow stays `PENDING`, exactly as if the process had crashed, and is recovered from its last completed step the next time the application launches.

## Workflow Versioning and Recovery

DBOS **versions** applications and workflows.
All workflows are tagged with the application version on which they started.
Set the version with [`Config::app_version`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.app_version), or with the `DBOS__APPVERSION` environment variable; DBOS doesn't compute one, so launch fails if neither is set.
A common choice is your crate's version, `env!("CARGO_PKG_VERSION")`.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
To safely recover workflows started on an older version of your code, start a process running that code version.
To change a workflow's code while executions of the old code are still in flight, without changing the version, use [patching](./upgrading-workflows.md).
