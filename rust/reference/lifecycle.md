# DBOS Lifecycle

> A [`DBOS`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html) instance is your application's handle to DBOS.
> It is cheap to clone (an `Arc` inside): a clone is another handle to the same instance, so clone it into whatever holds your application's state.

```rust
let mut config = dbos::Config::from_env("my-app");
config.app_version = Some(env!("CARGO_PKG_VERSION").to_owned());
let dbos = dbos::DBOS::new(config);

let workflow = dbos.register_workflow("workflow", workflow)?; // before launch
dbos.launch().await?;
// ... run the application ...
dbos.shutdown().await;
```

### DBOS::new

```rust
pub fn new(config: Config) -> DBOS;
```

Create an instance from a [`Config`](./configuration.md). It connects to nothing until `launch`.

### register_workflow

Register workflows before launch; see [`register_workflow`](./workflows-steps.md#register_workflow).

### launch

```rust
pub async fn launch(&self) -> dbos::Result<()>;
```

Start the instance:

1. Resolve the application's identity: its name, its version (from `Config::app_version` or `DBOS__APPVERSION`; launch fails if neither gives one), and its executor ID.
2. Connect to the system database, creating the database if it doesn't exist.
3. Create and migrate the DBOS tables, unless `Config::migrate` is off.
4. Register the application version.
5. Recover the workflows left `PENDING` under this executor's ID and this application version, by a previous run.
6. Start the background tasks: queue polling, the scheduler, and the workflow-timeout sweep.

Launching an instance that is already launched logs a warning and does nothing.
DBOS logs `DBOS launched` through `tracing`.

### shutdown

```rust
pub async fn shutdown(&self);
```

Stop the background tasks and the workflows running in this process, and close the connection pool.
The workflows it stops aren't marked failed: they stay `PENDING` and are recovered from their last recorded step on the next launch.
An instance can be launched again after shutting down.

### shutdown_with

```rust
pub async fn shutdown_with(&self, options: ShutdownOptions);

pub struct ShutdownOptions {
    pub workflow_completion_timeout: Duration,
}
```

[`shutdown`](#shutdown), first waiting up to `workflow_completion_timeout` (default: zero, no wait) for the workflows running in this process to finish.
The timeout trades shutdown time for work redone, never for work lost.

```rust
dbos.shutdown_with(dbos::ShutdownOptions {
    workflow_completion_timeout: Duration::from_secs(30),
}).await;
```

### is_launched

```rust
pub fn is_launched(&self) -> bool;
```

Whether the instance is launched.

### config

```rust
pub fn config(&self) -> &Config;
```

The instance's configuration.

### executor_id, app_version and app_id

```rust
pub fn executor_id(&self) -> dbos::Result<String>;
pub fn app_version(&self) -> dbos::Result<String>;
pub fn app_id(&self) -> dbos::Result<String>;
```

The identity `launch` resolved from the configuration and the environment. Each returns `Error::NotLaunched` before launch.

## Panics

A panic in a workflow body, or in a step it runs, doesn't crash the process.
DBOS logs it with the workflow's ID and records nothing, so the workflow stays `PENDING`, as if the process had crashed, and is recovered from its last completed step the next time an executor with its executor ID and application version launches.
