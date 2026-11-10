# Add DBOS To Your App

> :::caution Pre-production release
> DBOS Transact for Rust 0.6 is a pre-production release, and isn't yet supported for production use.
> Its API may still change in breaking ways between releases.
> :::

This guide shows you how to add the open-source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-rust) library to your existing application to **durably execute** it and make it resilient to any failure.

### 1. Install DBOS

Add the [`dbos`](https://crates.io/crates/dbos) crate to your application:

```shell
cargo add dbos
```

DBOS runs on Tokio by default.
If your application uses smol or async-global-executor, see [Async Runtimes](./tutorials/async-runtimes.md) for the features to enable instead.

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

### 2. Add the DBOS Initializer

Add these lines of code to your program's `main` function.
They create a DBOS instance and launch it when your program starts, and shut it down when it exits.
DBOS logs through [`tracing`](https://docs.rs/tracing), so install a subscriber, such as [`tracing-subscriber`](https://docs.rs/tracing-subscriber), to see its logs:

```rust
use dbos::{Config, DBOS};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Print DBOS's logs, including "DBOS launched".
    tracing_subscriber::fmt::init();

    let mut config = Config::from_env("dbos-starter");
    config.app_version = Some(env!("CARGO_PKG_VERSION").to_owned());
    let dbos = DBOS::new(config);

    // Register your workflows here, before launch.

    dbos.launch().await?;

    // ... run your application ...

    dbos.shutdown().await;
    Ok(())
}
```

[`Config::from_env`](https://docs.rs/dbos/latest/dbos/struct.Config.html#method.from_env) reads the database URL from `DBOS_SYSTEM_DATABASE_URL`.
DBOS requires an [application version](./tutorials/upgrading-workflows.md#versioning), from `app_version` or the `DBOS__APPVERSION` environment variable; your crate's version is a good choice.

`DBOS` is cheap to clone (it's an `Arc` inside), so clone it into whatever holds your application's state, such as an Axum router's state.

### 3. Start Your Application

Try starting your application.
If everything is set up correctly, your app should run normally and log `DBOS launched` on startup.
Congratulations! You've integrated DBOS into your application.

### 4. Start Building With DBOS

DBOS lets you execute your functions as [workflows](./tutorials/workflow-tutorial.md) of [steps](./tutorials/step-tutorial.md).
A workflow is an `async` function that takes one input and returns a `dbos::Result`.
Register your workflows with the DBOS instance before you launch it:

```rust
async fn workflow(_: ()) -> dbos::Result<String> {
    dbos::step("step_one", step_one).await?;
    dbos::step("step_two", step_two).await?;
    Ok("success".to_owned())
}

let workflow = dbos.register_workflow("workflow", workflow)?;
dbos.launch().await?;

let handle = workflow.start(()).await?;
let result = handle.result().await?;
```

DBOS durably executes workflows so if they are ever interrupted, upon restart they automatically resume from the last completed step.

You can add DBOS to your application incrementally&mdash;it won't interfere with code that's already there.
It's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code.

To learn more about programming with DBOS, check out [the guide](./programming-guide.md).
