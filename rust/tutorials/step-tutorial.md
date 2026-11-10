# Steps

> When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a _step_.
> If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.
> Steps execute **at least once**: if a process crashes after a step's side effects but before the step is checkpointed, the step re-executes on recovery.
> This includes database writes a step makes: DBOS for Rust has no transactional step yet, so make such writes idempotent (for example, with a unique key and `ON CONFLICT DO NOTHING`).

You can use [`dbos::step`](https://docs.rs/dbos/latest/dbos/fn.step.html) to call a function as a step.
It takes the step's name and a closure that returns the step's future.
The step's output must implement `Serialize` and `Deserialize`, because DBOS records it, and the closure returns a `dbos::Result`, like a workflow.
Here's a simple example, where the closure passes an argument into the step function:

```rust
async fn generate_random_number(n: u32) -> dbos::Result<u32> {
    Ok(rand::random_range(0..n))
}

async fn workflow_function(n: u32) -> dbos::Result<u32> {
    // The closure passes arguments into the step function.
    let random_number = step("generate_random_number", || generate_random_number(n)).await?;
    Ok(random_number)
}
```

The name is checked on recovery: DBOS refuses a step whose name differs from the one recorded at that position, rather than replaying another step's result.
Name each step for what it does, and don't change a step's name while executions that ran it may still be recovered.

The closure is `FnMut`, not `FnOnce`, because DBOS calls it again for each [retry](#configurable-retries).
Capture arguments by reference, or clone them inside the closure, so it can run more than once.

You should make a function a step if you're using it in a DBOS workflow and it performs a [**nondeterministic**](./workflow-tutorial.md#determinism) operation.
A nondeterministic operation is one that may return different outputs given the same inputs.
Common nondeterministic operations include:

- Accessing an external API or service, like serving a file from [AWS S3](https://aws.amazon.com/s3/), calling an external API like [Stripe](https://stripe.com/), or accessing an external data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).
- Accessing files on disk.
- Generating a random number.
- Getting the current time.

A step's body is ordinary async Rust: it can spawn tasks, race futures, and use timeouts, because only its result is recorded.
The [determinism rules](./workflow-tutorial.md#concurrency-in-workflows) apply to the workflow body around it.

You **cannot** start or enqueue workflows from within a step, and you cannot call `recv`, `set_event`, `patch`, or a debouncer's `debounce` there: each returns `Error::InsideStep`.
These operations should be performed from workflow functions.
You can call one step from another step, but the called step runs as a plain function call, as part of the calling step's execution, rather than as a separate step.
Calls like `send`, `get_event`, `write_stream` and [`list_workflows`](./workflow-management.md#listing-workflows) also work inside a step, recorded as part of that step.

## Configurable Retries

You can optionally configure a step to automatically retry any error a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
Retries are configured with [`StepOptions`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html), passed to [`step_with`](https://docs.rs/dbos/latest/dbos/fn.step_with.html).
Available retry configuration options include:

- `max_attempts` - How many times the step may run in all (default 1: no retries)
- `interval` - How long to wait after the first failed attempt (default 1s)
- `backoff_rate` - What the wait is multiplied by after each failure (default 2.0)
- `max_interval` - The longest the wait may grow to (default 1 hour)
- `should_retry` - A predicate deciding whether an error is retried; an error it rejects is returned at once, whatever attempts are left. Set it with the [`should_retry`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html#method.should_retry) method.

For example, let's configure this step to retry failures (such as if the site to be fetched is temporarily down) up to 10 times, but not to retry a client error:

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

If a step exhausts all retry attempts, it returns `Error::MaxStepRetriesExceeded`, carrying every attempt's error, to the calling workflow.

Cancellations, shutdowns and database failures are never retried, and never reach `should_retry`.

## Step Timeouts

You can limit how long each attempt of a step may run with the `timeout` field of `StepOptions`.
When an attempt runs past its timeout, DBOS drops its future, which stops it at its next `.await`, and the attempt fails with `Error::StepTimeout`.
A timeout is an ordinary failure: it counts against `max_attempts` and is offered to `should_retry`.

```rust
async fn slow_step() -> dbos::Result<String> {
    tokio::time::sleep(Duration::from_secs(10)).await;
    Ok("done".to_owned())
}

async fn timeout_workflow(_: ()) -> dbos::Result<String> {
    let options = StepOptions {
        timeout: Some(Duration::from_secs(2)),
        ..StepOptions::default()
    };
    match step_with("slow_step", options, slow_step).await {
        Err(dbos::Error::StepTimeout { .. }) => Ok("timed out".to_owned()),
        other => other,
    }
}
```

Dropping a future can't stop work running outside it, such as a blocking thread.
For that, read [`dbos::cancellation_token()`](https://docs.rs/dbos/latest/dbos/fn.cancellation_token.html) inside the step.
The token fires whenever DBOS abandons the attempt: when the step times out, when it loses a [`select_step!`](./workflow-tutorial.md#selecting-the-first-result) race, when its workflow's [timeout](./workflow-tutorial.md#workflow-timeouts) expires, when DBOS shuts down, or when a `preemptible` step's workflow is cancelled.
An ordinary cancel doesn't fire it: a step that isn't preemptible runs to its end.
It doesn't fire for an attempt that finishes.

```rust
async fn blocking_step() -> dbos::Result<u64> {
    let token = dbos::cancellation_token();
    let total = tokio::task::spawn_blocking(move || {
        let mut total = 0;
        for chunk in 0..1_000_000u64 {
            if token.is_cancelled() {
                break;
            }
            total += chunk;
        }
        total
    })
    .await
    .expect("the blocking task panicked");
    Ok(total)
}
```

By default, a step that is already running finishes even if its workflow is [cancelled](./workflow-management.md#cancelling-workflows) from another process.
Set `preemptible: true` in `StepOptions` to stop the step as soon as DBOS sees the cancellation instead (which also fires its cancellation token).
DBOS checks for it by polling the workflow's status while the step runs.
A preempted step records nothing, and runs again if the workflow is resumed.
