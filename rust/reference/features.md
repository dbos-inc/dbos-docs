# Cargo Features

> The [`dbos`](https://crates.io/crates/dbos) crate's Cargo features:

| Feature | Default | What it turns on |
|---|---|---|
| `engine` | yes | The durable execution engine: the lifecycle, workflows, steps, queues, messaging, schedules and the client. Without it, only the system-database layer (`dbos::sysdb`) is left. |
| `macros` | yes | [`select_step!`](https://docs.rs/dbos/latest/dbos/macro.select_step.html), the durable race. It is a procedural macro, so it adds `syn` and `quote` to the build. Implies `engine`. |
| `runtime-tokio` | yes | Runs DBOS's background tasks and timers on [Tokio](https://tokio.rs). |
| `runtime-smol` | no | Runs them on [smol](https://github.com/smol-rs/smol). |
| `runtime-async-global-executor` | no | Runs them on [async-global-executor](https://github.com/async-rs/async-global-executor). |

At least one runtime feature is required.
Several may be enabled; DBOS then picks one when it runs, as [Async Runtimes](../tutorials/async-runtimes.md#enabling-more-than-one-runtime) describes.

To use smol instead of Tokio:

```toml
[dependencies]
dbos = { version = "0.6", default-features = false, features = ["engine", "macros", "runtime-smol"] }
```
