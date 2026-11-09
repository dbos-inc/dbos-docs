---
sidebar_position: 65
title: Upgrading Workflow Code
toc_max_heading_level: 3
---

A challenge encountered when operating long-running durable workflows in production is **how to deploy breaking changes without disrupting in-progress workflows.**
A breaking change to a workflow is one that changes which steps are run, or the order in which the steps are run.
If a breaking change was made to a workflow and that workflow is replayed by the recovery system, the checkpoints created by the previous version of the code may not match the steps called by the workflow in the new version of the code, causing recovery to fail.

DBOS supports two strategies for safely upgrading workflow code: **patching** and **versioning**.

## Patching

In patching, the result of a call to [`dbos::patch`](https://docs.rs/dbos/latest/dbos/fn.patch.html) is used to conditionally execute the new code.
`patch` returns `true` for new calls (those executing after the breaking change) and `false` for old calls (those that executed before the breaking change).
Therefore, if `patch` returns `true`, the workflow should follow the new code path, otherwise it must follow the prior code path.

When using patching, processes running your new code must be able to recover workflows started on your old code.
To do this, **pin the application version**: set a fixed application version in your configuration, so every deployment of your code shares the same version:

```rust
fn config() -> dbos::Config {
    let mut config = dbos::Config::from_env("my-app");
    // Every deployment shares this version, so new code recovers old workflows.
    config.app_version = Some("1.0.0".to_owned());
    config
}
```

:::warning
Patching protects old workflows from new code, not new workflows from old code.
Under a pinned version, a process still running the old code can dequeue or recover a workflow the new code started.
Where the new code recorded a patch marker, the old code expects one of its own steps, so the workflow fails with `UnexpectedStep` there: it stays `PENDING`, and recovery retries it until it is parked.
So don't let processes running old code pick up new workflows: stop them all before starting processes running the new code, rather than rolling the new code out alongside them.
If old and new code have to run side by side, use [versioning](#versioning) instead.
:::

For example, let's say our original workflow is:

```rust
async fn workflow(_: ()) -> dbos::Result<String> {
    let a = step("foo", foo).await?;
    let b = step("bar", bar).await?;
    Ok(a + &b)
}
```

We want to replace the call to `foo()` with a call to `baz()`.
This is a breaking change because it changes what steps run.
We can make this breaking change safely using a patch:

```rust
async fn workflow(_: ()) -> dbos::Result<String> {
    let a = if dbos::patch("use-baz").await? {
        // New workflows take the new code.
        step("baz", baz).await?
    } else {
        // Workflows that already ran past this point take the old code.
        step("foo", foo).await?
    };
    let b = step("bar", bar).await?;
    Ok(a + &b)
}
```

Now, new workflows will run `baz()`, while old workflows will reexecute `foo()`.

Examples of workflows taking the old code:

- Recovered workflows that executed up to or beyond the patch point
- Workflows forked after the patch point

Examples of workflows taking the new code:

- Entirely new workflows
- Recovered workflows that executed before the patch point
- Workflows forked before the patch point

### Deprecating and Removing Patches

Patches add complexity and runtime overhead; fortunately they don't need to stay in your code forever.
Once all workflows that started before you deployed the patch are complete, you can safely remove patches from your code.

:::tip
You can use the [list workflows APIs](./workflow-management.md#listing-workflows) to see what workflows are still active.
:::

First, you must deprecate the patch with [`dbos::deprecate_patch`](https://docs.rs/dbos/latest/dbos/fn.deprecate_patch.html).
`deprecate_patch` must be used for a transition period prior to fully removing the patch, as it allows coexistence with any ongoing workflows that used `patch`.
For example, here's how to deprecate the patch above:

```rust
async fn workflow(_: ()) -> dbos::Result<String> {
    dbos::deprecate_patch("use-baz").await?;
    let a = step("baz", baz).await?;
    let b = step("bar", bar).await?;
    Ok(a + &b)
}
```

Then, when all workflows that started before you deprecated the patch are complete, you can remove the patch entirely:

```rust
async fn workflow(_: ()) -> dbos::Result<String> {
    let a = step("baz", baz).await?;
    let b = step("bar", bar).await?;
    Ok(a + &b)
}
```

If any mistakes happen during the process (a breaking change is not patched, or a patch is deprecated or removed prematurely), recovery refuses to replay the workflow past the step where the problem occurred. The workflow isn't marked `ERROR`: it stays `PENDING`, recovery keeps retrying it, and after 100 attempts it is parked as `MAX_RECOVERY_ATTEMPTS_EXCEEDED`, so fix the code and [resume](./workflow-management.md#resuming-workflows) it.

### How Patching Works

Under the hood, when you call `patch` from a workflow, it attempts to insert a "patch marker" at its current point in your workflow history (this is a new row in the `operation_outputs` table in the DBOS [system database](../../explanations/system-tables.md)).
If it successfully inserts the patch marker or if the patch marker is already present, then the workflow should take the patch code path.
If there is already a record present at this point in your workflow history and it is not a patch marker, then the workflow must be old (it already continued past this point with old code), and `patch` returns `false`.
The same holds when the old code left this point empty and went on past it, as a `recv` or `get_event` waiting on its timeout can.

When you deprecate a patch with `deprecate_patch`, new workflows no longer insert patch markers into their workflow history.
However, if a workflow contains the patch marker in its history, it continues past that patch marker, safely ignoring it.
Once all workflows with patch markers are complete, the patch may be safely removed.

`patch` and `deprecate_patch` take a step position like any other durable call, so call them only from the workflow body, never from inside a step.

## Versioning

When using versioning, DBOS **versions** applications and workflows, and only continues workflow execution with the same application version that started the workflow.
All workflows are tagged with the application version on which they started.
DBOS for Rust doesn't compute a version: set one with [`Config::app_version`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.app_version) or the `DBOS__APPVERSION` environment variable.
To version each release, use your crate's version:

```rust
config.app_version = Some(env!("CARGO_PKG_VERSION").to_owned());
```

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents recovery of workflows that depend on different code.

Enqueued workflows with no application version (for example, enqueued from a [`Client`](./queue-tutorial.md#enqueueing-from-another-application) without specifying a version) are only dequeued by processes running their owning application's **latest** registered version.
This ensures version-less work is picked up by the newest code during a rolling deploy.

When using versioning, we recommend **blue-green** code upgrades:

- When deploying a new version of your code, launch new processes running your new code version, but retain some processes running your old code version.
- Direct new traffic to your new processes while your old processes "drain" and complete all workflows of the old code version.
- Then, once all workflows of the old version are complete (you can use [`list_workflows`](./workflow-management.md#listing-workflows) to check), you can retire the old code version.

A workflow stuck on a retired version can be moved to a new one by [forking](./workflow-management.md#forking-workflows) or [rewinding](./workflow-management.md#rewinding-workflows) it onto that version.
