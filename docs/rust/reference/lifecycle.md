---
sidebar_position: 20
title: DBOS Lifecycle
---

A [`DBOS`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html) instance is your application's handle to DBOS.
It is cheap to clone (an `Arc` inside), so clone it into whatever holds your application's state.

```rust
let dbos = dbos::DBOS::new(config);
let workflow = dbos.register_workflow("workflow", workflow)?; // before launch
dbos.launch().await?;
// ... run the application ...
dbos.shutdown().await;
```

| Method | Description |
|---|---|
| [`DBOS::new(config)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.new) | Creates an instance from a [`Config`](./configuration.md). Connects to nothing. |
| [`register_workflow(name, f)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.register_workflow) | Registers a workflow function under a name and returns its [`WorkflowRef`](./workflows-steps.md#workflowref). **Before `launch` only**; afterwards it returns an error. |
| [`register_workflow_with(name, options, f)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.register_workflow_with) | The same, with [`WorkflowOptions`](https://docs.rs/dbos/latest/dbos/struct.WorkflowOptions.html), whose `serialization` field makes a workflow [portable](../tutorials/serialization.md#portable-workflows). |
| [`launch()`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.launch) | Connects to the system database, creates and migrates its tables (unless `migrate` is off), registers the application version, starts the background tasks (queues, scheduler, timeouts), and recovers the workflows a previous run of this executor left `PENDING`. Launching a launched instance warns and does nothing. |
| [`shutdown()`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.shutdown) | Stops the background tasks and the workflows running in this process, and closes the connection pool. Stopped workflows stay `PENDING` and are recovered on the next launch. An instance can be launched again after shutting down. |
| [`shutdown_with(options)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.shutdown_with) | The same, with [`ShutdownOptions`](https://docs.rs/dbos/latest/dbos/struct.ShutdownOptions.html): `workflow_completion_timeout` waits that long for running workflows to finish before stopping them. |
| [`is_launched()`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.is_launched) | Whether the instance is launched. |
| [`config()`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.config) | The instance's configuration. |
| [`executor_id()`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.executor_id), [`app_version()`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.app_version), [`app_id()`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.app_id) | The identity `launch` resolved from the configuration and environment. An error before launch. |

Most of what a running application does goes through the instance's methods, listed in [DBOS Methods](./methods.md), or through the free functions a workflow body calls.

## Panics

A panic in a workflow body doesn't crash the process.
DBOS logs it with the workflow's ID and records nothing, so the workflow stays `PENDING`, as if the process had crashed, and is recovered from its last completed step the next time an executor of its version launches.
A panic in a step does the same to the workflow it runs in.
