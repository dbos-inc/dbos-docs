---
sidebar_position: 30
title: Workflows & Steps
toc_max_heading_level: 3
---

## Workflows

A workflow is an `async` function or closure of one input that returns a [`dbos::Result`](https://docs.rs/dbos/latest/dbos/type.Result.html):

```rust
async fn my_workflow(input: Input) -> dbos::Result<Output, MyError>
```

`Input` and `Output` implement `Serialize` and `Deserialize`.
The error type, if any, implements [`DurableError`](https://docs.rs/dbos/latest/dbos/trait.DurableError.html): `std::error::Error + Serialize + Deserialize`.
See the [workflows tutorial](../tutorials/workflow-tutorial.md).

### WorkflowRef

[`register_workflow`](./lifecycle.md) returns a [`WorkflowRef<P, R, E>`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html), which starts the workflow it names.
It is cheap to clone.

| Method | Description |
|---|---|
| [`start(input)`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html#method.start) | Starts the workflow in the background and returns a [`WorkflowHandle`](#workflowhandle). |
| [`start_with(input, options)`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html#method.start_with) | The same, with [`StartOptions`](#startoptions). |
| [`run(input)`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html#method.run) | Starts the workflow and waits for its result. |
| [`run_with(input, options)`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html#method.run_with) | The same, with [`RunOptions`](https://docs.rs/dbos/latest/dbos/struct.RunOptions.html): `StartOptions` without the queue. |
| [`name()`](https://docs.rs/dbos/latest/dbos/struct.WorkflowRef.html#method.name) | The name the workflow was registered under. |

Called inside a workflow, `start` and `run` start a child workflow and record it in the parent.

### StartOptions

| Field | Default | Description |
|---|---|---|
| [`workflow_id`](https://docs.rs/dbos/latest/dbos/struct.StartOptions.html#structfield.workflow_id) | a UUID | The workflow's ID, which is also its [idempotency key](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency). A child's default is `{parent_id}-{step_id}`. |
| [`workflow_id_reuse_policy`](https://docs.rs/dbos/latest/dbos/struct.StartOptions.html#structfield.workflow_id_reuse_policy) | `ReturnExisting` | A [`WorkflowIdReusePolicy`](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.WorkflowIdReusePolicy.html): `ReturnExisting` hands back the existing workflow with that ID; `Reject` fails with `WorkflowIdInUse`. |
| [`timeout`](https://docs.rs/dbos/latest/dbos/struct.StartOptions.html#structfield.timeout) | `Inherit` | A [`Timeout`](https://docs.rs/dbos/latest/dbos/enum.Timeout.html): `Inherit` (a child takes its parent's deadline), `None`, or `Explicit(duration)`. See [timeouts](../tutorials/workflow-tutorial.md#workflow-timeouts). |
| [`queue`](https://docs.rs/dbos/latest/dbos/struct.StartOptions.html#structfield.queue) | `None` | A [`QueueRequest`](./queues.md#queuerequest) to enqueue the workflow instead of starting it at once. |
| [`attributes`](https://docs.rs/dbos/latest/dbos/struct.StartOptions.html#structfield.attributes) | `None` | Key-value [attributes](../tutorials/workflow-management.md#tagging-workflows-with-attributes) recorded with the workflow. |

### WorkflowHandle

A [`WorkflowHandle<R, E>`](https://docs.rs/dbos/latest/dbos/struct.WorkflowHandle.html) refers to one workflow execution.
Get one from `start`, or from [`retrieve_workflow`](./methods.md#workflow-management) by ID.

| Method | Description |
|---|---|
| [`workflow_id()`](https://docs.rs/dbos/latest/dbos/struct.WorkflowHandle.html#method.workflow_id) | The workflow's ID. |
| [`result()`](https://docs.rs/dbos/latest/dbos/struct.WorkflowHandle.html#method.result) | Waits for the workflow to finish and returns its result. Inside a workflow, the wait is recorded. Consumes the handle. |
| [`status()`](https://docs.rs/dbos/latest/dbos/struct.WorkflowHandle.html#method.status) | The workflow's current status: `Pending`, `Enqueued`, `Delayed`, `Success`, `Error` or `Cancelled`. |

## Steps

| Function | Description |
|---|---|
| [`dbos::step(name, f)`](https://docs.rs/dbos/latest/dbos/fn.step.html) | Runs `f` as a step: inside a workflow its result is recorded and replayed on recovery; outside a workflow it runs as a plain call. `f` is an `FnMut` closure returning the step's future. |
| [`dbos::step_with(name, options, f)`](https://docs.rs/dbos/latest/dbos/fn.step_with.html) | The same, with [`StepOptions`](#stepoptions). |

### StepOptions

| Field | Default | Description |
|---|---|---|
| [`max_attempts`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html#structfield.max_attempts) | `1` | How many times the step may run in all. |
| [`interval`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html#structfield.interval) | 1 second | The wait after the first failed attempt. |
| [`backoff_rate`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html#structfield.backoff_rate) | `2.0` | What the wait is multiplied by after each failure. |
| [`max_interval`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html#structfield.max_interval) | 1 hour | The longest the wait may grow to. |
| [`timeout`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html#structfield.timeout) | `None` | The longest one attempt may run; it then fails with `StepTimeout`, which counts as a failed attempt. |
| [`preemptible`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html#structfield.preemptible) | `false` | Whether to stop the step as soon as its workflow is seen to be cancelled from elsewhere. |
| [`should_retry`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html#structfield.should_retry) | `None` | Decides whether an error is retried. Set it with the [`should_retry`](https://docs.rs/dbos/latest/dbos/struct.StepOptions.html#method.should_retry) method. |

See the [steps tutorial](../tutorials/step-tutorial.md).

## Durable Calls

Every durable call (`step`, `sleep`, `send`, `recv`, `set_event`, `get_event`, starting a child, awaiting a `result()`, and the management calls made inside a workflow) returns a future that takes its step ID when it is **built**, not when it is first polled:

| Type | Returned by | Description |
|---|---|---|
| [`PendingStep<T, E>`](https://docs.rs/dbos/latest/dbos/struct.PendingStep.html) | steps and most durable calls | A future of `dbos::Result<T, E>`. [`lift()`](https://docs.rs/dbos/latest/dbos/struct.PendingStep.html#method.lift) carries a call with no error type into a workflow's error type; [`map_error()`](https://docs.rs/dbos/latest/dbos/struct.PendingStep.html#method.map_error) converts one error type into another. |
| [`PendingStart<R, E>`](https://docs.rs/dbos/latest/dbos/struct.PendingStart.html) | `start`, `enqueue`, `resume`, `fork`, `rewind`, `debounce` | A future of a `WorkflowHandle`. |
| [`PendingRun<R, E>`](https://docs.rs/dbos/latest/dbos/type.PendingRun.html) | `run` | A future of the workflow's result. |

### Concurrency

| Item | Description |
|---|---|
| [`select_step!`](https://docs.rs/dbos/latest/dbos/macro.select_step.html) | Races durable calls and records the winner, so a recovery takes the same arm. Needs the `macros` feature. |
| [`dbos::select_workflow(ids)`](https://docs.rs/dbos/latest/dbos/fn.select_workflow.html), [`select_workflow!`](https://docs.rs/dbos/latest/dbos/macro.select_workflow.html) | Waits for the first of several workflows to finish and returns its ID, recorded. |
| [`dbos::join_workflows(ids)`](https://docs.rs/dbos/latest/dbos/fn.join_workflows.html), [`join_workflows!`](https://docs.rs/dbos/latest/dbos/macro.join_workflows.html) | Waits for all of several workflows to finish. |

`tokio::join!`, `futures::join!` and `futures::future::join_all` over durable calls are supported; races, timeouts, completion-order streams and spawned tasks are not. See [determinism](../tutorials/workflow-tutorial.md#concurrency-in-workflows).

## Errors

[`dbos::Error<E>`](https://docs.rs/dbos/latest/dbos/enum.Error.html) carries the application's own error as `Error::Application(E)`, or one of DBOS's.
`dbos::Result<T>` (with no `E`) can carry only DBOS's errors.
The variants you're most likely to match on:

| Variant | When |
|---|---|
| `Application(E)` | The workflow or step returned its own error. |
| `WorkflowCancelled` | This workflow was cancelled, or timed out. Return it. |
| `AwaitedWorkflowCancelled` | A workflow this one waited on was cancelled. |
| `StepTimeout` | A step attempt ran past its `timeout`. |
| `MaxStepRetriesExceeded` | A step failed every attempt; carries each attempt's error. |
| `NotInWorkflow` | A call that needs a workflow, such as `set_event` or `recv`, was made outside one. |
| `InsideStep` | A call that can't run in a step, such as starting a workflow, `recv` or `set_event`, was made inside one. |
| `NotLaunched` | The instance hasn't been launched. |
| `Config` | The configuration is invalid. |
| `Portable` | A workflow failed with a [portable error](../../explanations/portable-workflows.md#portable-errors) this process has no type for. |
| `SystemDatabase(e)` | The system database refused or failed the call. [`sysdb::Error`](https://docs.rs/dbos/latest/dbos/sysdb/error/enum.Error.html) includes `WorkflowIdInUse` (a rejected reuse), `QueueDeduplicated` (a deduplication ID in use) and `UnexpectedStep` (a recovery reached a different step than the one recorded). |

`Error` is `#[non_exhaustive]`; match with a wildcard arm.
