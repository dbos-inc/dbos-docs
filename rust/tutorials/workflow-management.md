# Workflow Management

> You can view and manage your durable workflow executions programmatically.

Each management operation comes in two forms.
Outside a workflow, call the method on your [`DBOS`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html) instance (`dbos.cancel`, `dbos.resume`, and so on), or on a [`Client`](https://docs.rs/dbos/latest/dbos/struct.Client.html) from another application.
Inside a workflow, call the free function of the same operation (`dbos::cancel_workflow`, `dbos::resume_workflow`, and so on), which DBOS records as a step, so a recovery doesn't repeat it:

```rust
async fn supervisor(child_id: String) -> dbos::Result<()> {
    // Inside a workflow, use the free functions: each is recorded as a step.
    dbos::cancel_workflow(&child_id).await?;
    let handle = dbos::resume_workflow::<(), dbos::EngineOnly>(&child_id).await?;
    handle.result().await?;
    Ok(())
}
```

Don't capture the `DBOS` instance in a workflow to call its methods: the free functions need no instance.

## Listing Workflows

You can list your application's workflows with [`list_workflows`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.list_workflows), which takes a [`WorkflowFilter`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.WorkflowFilter.html).
The filter can select workflows by ID or ID prefix, name, status, queue, application version, creation and completion time, parent, and more:

```rust
async fn list_errors(dbos: &DBOS) -> dbos::Result<()> {
    let filter = WorkflowFilter {
        status: vec![WorkflowStatus::Error],
        limit: Some(20),
        sort_desc: true,
        ..WorkflowFilter::default()
    };
    for workflow in dbos.list_workflows(&filter).await? {
        println!(
            "{} {:?} {:?}",
            workflow.workflow_id, workflow.name, workflow.error
        );
    }
    Ok(())
}
```

[`list_workflow_steps`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.list_workflow_steps) lists the steps a workflow has recorded, in execution order:

```rust
async fn show_steps(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    for step in dbos.list_workflow_steps(workflow_id).await? {
        println!("{} {}", step.step_id, step.step_name);
    }
    Ok(())
}
```

## Tagging Workflows with Attributes

You can attach custom key-value attributes to a workflow with the `attributes` field of `StartOptions` (or `EnqueueOptions`) when starting or enqueueing it.
Attributes are recorded in the workflow's status, and the `attributes` filter of `WorkflowFilter` finds the workflows whose attributes contain the JSON you give it:

```rust
async fn tag_order(process_order: &WorkflowRef<String, String>) -> dbos::Result<()> {
    let mut attributes = serde_json::Map::new();
    attributes.insert("customer".to_owned(), "acme".into());
    attributes.insert("region".to_owned(), "eu".into());
    let options = StartOptions {
        attributes: Some(&attributes),
        ..StartOptions::default()
    };
    process_order
        .start_with("order-42".to_owned(), options)
        .await?;
    Ok(())
}

async fn find_acme_orders(dbos: &DBOS) -> dbos::Result<()> {
    let filter = WorkflowFilter {
        // The workflow's attributes must contain this JSON.
        attributes: Some(r#"{"customer": "acme"}"#),
        ..WorkflowFilter::default()
    };
    let workflows = dbos.list_workflows(&filter).await?;
    Ok(())
}
```

You can replace a workflow's attributes at any time with [`update_workflow_attributes`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.update_workflow_attributes), or merge new keys into them with [`merge_workflow_attributes`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.merge_workflow_attributes).

## Cancelling Workflows

You can cancel the execution of a workflow with [`cancel`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.cancel).
To cancel many workflows at once, use [`cancel_all`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.cancel_all), which also takes whether to cancel the workflows' children: `Children::Include` cancels every descendant, recursively, and `Children::Skip` only the workflows named.

```rust
async fn cancel_example(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    dbos.cancel(workflow_id).await?;
    Ok(())
}

async fn cancel_tree(dbos: &DBOS, workflow_ids: &[&str]) -> dbos::Result<()> {
    // Cancels each workflow and all its descendants.
    let cancelled = dbos.cancel_all(workflow_ids, Children::Include).await?;
    Ok(())
}
```

If the workflow is enqueued, cancelling removes it from the queue.
If the workflow is currently executing, cancelling sets its status to `CANCELLED` and takes the workflow away from the execution running it. That execution isn't interrupted: a step in progress runs to its end, but its result is no longer recorded, so the step runs again if the workflow is resumed. The step in progress fails with `Error::WorkflowCancelled` when it tries to record its result, and so does any later call that checkpoints.
Don't ignore that error to continue execution: return it, which is what `?` does.
A step marked [`preemptible`](./step-tutorial.md#step-timeouts) stops as soon as DBOS sees the cancellation, instead of running to its end, and fails with the same error.

A workflow is also cancelled when its [durable timeout](./workflow-tutorial.md#workflow-timeouts) expires.
[Shutting down](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.shutdown) DBOS stops the workflows running in the process without cancelling them: they stay `PENDING` and are recovered from their last completed step on the next launch.

### Awaiting a cancelled workflow

Awaiting a cancelled workflow's handle from inside a workflow returns `Error::AwaitedWorkflowCancelled`, a different error from `WorkflowCancelled`, so the awaiting workflow can tell "the workflow I awaited was cancelled" apart from "I was cancelled", and can handle it and continue.
Awaited from outside a workflow, the handle returns `Error::WorkflowCancelled`.
When the awaiter is itself a workflow, this outcome is checkpointed like any other child error, so a recovery of the awaiter sees the same outcome, even if the cancelled workflow is later resumed.

## Resuming Workflows

You can resume a workflow from its last completed step with [`resume`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.resume).
You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.
`resume` returns a handle to the resumed workflow; its type parameters state the workflow's result and error types.

```rust
async fn resume_example(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    let handle = dbos.resume::<String, dbos::EngineOnly>(workflow_id).await?;
    let result = handle.result().await?;
    Ok(())
}
```

Resuming restarts the workflow function from the beginning, but every checkpointed step replays its recorded result instead of re-executing, so only unfinished work runs again.
Resuming also resets the workflow's recovery-attempt counter.
`resume_with` puts the workflow on a queue of your choice instead of DBOS's internal queue, so a resumed backlog can run under that queue's limits.

Resuming, like cancelling, rewinding, or recovering a workflow, takes ownership of it away from any execution still running it, so a stale execution can no longer checkpoint over the current owner.
See [Concurrent Executions](../../explanations/concurrent-executions.md).

## Forking Workflows

You can start a new execution of a workflow by **forking** it from a specific step.
When you fork a workflow, DBOS generates a new workflow with a new workflow ID, copies to that workflow the original workflow's inputs and all its steps up to the selected step, then begins executing the new workflow from the selected step.

Forking a workflow is useful for recovering from outages in downstream services (by forking from the step that failed after the outage is resolved) or for "patching" workflows that failed due to a bug in a previous application version (by forking from the bugged step to an application version on which the bug is fixed).

You can fork a workflow with [`fork`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.fork), or with [`fork_with`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.fork_with) and [`ForkOptions`](https://docs.rs/dbos/latest/dbos/struct.ForkOptions.html) to choose the fork's application version, queue, timeout, and ID (the `forked_id` field of `Fork`):

```rust
async fn fork_example(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    // Fork from step 3, onto the version of the code that has the fix.
    let options = ForkOptions {
        app_version: Some("1.2.1"),
        ..ForkOptions::default()
    };
    let handle = dbos
        .fork_with::<String, dbos::EngineOnly>(Fork::new(workflow_id, 3), options)
        .await?;
    println!("Forked {} as {}", workflow_id, handle.workflow_id());
    Ok(())
}
```

[`fork_all`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.fork_all) forks many workflows at once, each from its own step.
A parent whose children were also forked can be pointed at the new children with `ForkOptions::replacement_children`.

## Rewinding Workflows

You can re-execute a workflow from a specific step, keeping its workflow ID, by **rewinding** it.
When you rewind a workflow, DBOS discards the workflow's recorded steps from the selected step onward, clears its output, and re-enqueues it.
The workflow then re-executes from the selected step, replaying the recorded outputs of earlier steps.

The difference between rewind and fork is that fork creates a copy of the workflow with a new ID, while rewind actually "rewinds" the original workflow (modifying its state) and keeps its original ID.
Because the rewound workflow keeps its original ID, other workflows and clients can keep sending messages to it and reading its events and streams, and its child workflows keep the same IDs.
Rewinding is useful when other code refers to a workflow by its ID, for example when the ID is an idempotency key derived from an order or request ID.

You can only rewind a workflow that has finished (`SUCCESS`, `ERROR`, `CANCELLED` or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`); cancel a running workflow before rewinding it.
Like forking, you can rewind a workflow onto a new application version to "patch" a workflow that failed due to a bug.

You can rewind a workflow with [`rewind`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.rewind), or with [`rewind_with`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.rewind_with) and [`RewindOptions`](https://docs.rs/dbos/latest/dbos/struct.RewindOptions.html) to choose the step:

```rust
async fn rewind_example(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    // Re-execute the workflow from step 3, keeping its workflow ID.
    let options = RewindOptions {
        start_step: 3,
        ..RewindOptions::default()
    };
    let handle = dbos
        .rewind_with::<String, dbos::EngineOnly>(workflow_id, options)
        .await?;
    let result = handle.result().await?;
    Ok(())
}
```

## Deleting Workflows

[`delete`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.delete) removes a workflow and everything recorded for it: its steps, inputs, outcome, events, messages and streams.
`delete_all` deletes many at once, and takes `Children::Include` to delete their descendants too.
Deleting a running workflow makes its execution fail at its next step, so cancel it first.

```rust
async fn delete_example(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    dbos.delete(workflow_id).await?;
    Ok(())
}
```
