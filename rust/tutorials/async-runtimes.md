# Async Runtimes

> DBOS for Rust runs on [Tokio](https://tokio.rs) by default, and also on [smol](https://github.com/smol-rs/smol) and [async-global-executor](https://github.com/async-rs/async-global-executor).
> Each runtime is a Cargo feature of the `dbos` crate:

| Feature | Runtime |
|---|---|
| `runtime-tokio` *(default)* | Tokio |
| `runtime-smol` | smol |
| `runtime-async-global-executor` | async-global-executor, the executor async-std ran on |

DBOS needs a runtime only to spawn its background tasks (recovery, queue polling, scheduling) and to set timers.
Everything else it does is ordinary futures, which run on any executor.

## Using smol or async-global-executor

To use another runtime, turn off the default features and turn on that runtime's, keeping `engine` and `macros`:

```toml
[dependencies]
dbos = { version = "0.6", default-features = false, features = ["engine", "macros", "runtime-smol"] }
smol = "2"
```

Then launch DBOS from inside that runtime, as you would on Tokio:

```rust
use std::time::Duration;

use dbos::{Config, DBOS};

async fn workflow(_: ()) -> dbos::Result<String> {
    dbos::step("step_one", || async {
        println!("Step one completed");
        Ok(())
    })
    .await?;
    dbos::sleep(Duration::from_secs(1)).await?;
    dbos::step("step_two", || async {
        println!("Step two completed");
        Ok(())
    })
    .await?;
    Ok("success".to_owned())
}

fn main() -> dbos::Result<()> {
    smol::block_on(async {
        let mut config = Config::from_env("dbos-starter");
        config.app_version = Some("0.1.0".to_owned());
        let dbos = DBOS::new(config);

        let workflow = dbos.register_workflow("workflow", workflow)?;
        dbos.launch().await?;

        let result = workflow.run(()).await?;
        println!("Workflow result: {result}");

        dbos.shutdown().await;
        Ok(())
    })
}
```

The crate still depends on the `tokio` crate for its synchronization primitives, which run on any executor, but it doesn't start a Tokio runtime.

## Enabling more than one runtime

Cargo features are unified across your dependency graph, so another dependency may turn on `runtime-tokio` even if you didn't.
That's allowed: DBOS picks the runtime when it runs, not when it compiles.
If the code calling DBOS is running inside a Tokio runtime, DBOS uses Tokio; otherwise it uses async-global-executor if that feature is on, and then smol.
This is the order [SQLx](https://github.com/launchbadge/sqlx), which DBOS uses for Postgres, picks in, so its tasks and DBOS's run on the same executor.
Building with no runtime feature at all is an error.

## Runtimes and determinism

What you can't do in a workflow body is the same on every runtime: race durable calls without [`select_step!`](./workflow-tutorial.md#selecting-the-first-result), wrap them in a timeout, spawn them onto another task, or consume them in completion order.
See [Determinism](./workflow-tutorial.md#concurrency-in-workflows) for each runtime's forms of these.
