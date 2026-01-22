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

In patching, the result of a call to [`dbos.Patch()`](../reference/workflows-steps.md#patch) is used to conditionally execute the new code.
`dbos.Patch()` returns `true` for new calls (those executing after the breaking change) and `false` for old calls (those that executed before the breaking change).
Therefore, if `dbos.Patch()` returns `true`, the workflow should follow the new code path, otherwise it must follow the prior codepath.

To use patching, you must enable it in the configuration:

```go
dbosCtx, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
    DatabaseURL:    os.Getenv("DBOS_DATABASE_URL"),
    AppName:        "my-app",
    EnablePatching: true,
})
```

For example, let's say our original workflow is:

```go
func workflow(ctx dbos.DBOSContext, input string) (string, error) {
    _, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return foo(stepCtx)
    })
    if err != nil {
        return "", err
    }
    _, err = dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return bar(stepCtx)
    })
    if err != nil {
        return "", err
    }
    return "success", nil
}
```

We want to replace the call to `foo()` with a call to `baz()`.
This is a breaking change because it changes what steps run.
We can make this breaking change safely using a patch:

```go
func workflow(ctx dbos.DBOSContext, input string) (string, error) {
    patched, err := dbos.Patch(ctx, "use-baz")
    if err != nil {
        return "", err
    }
    if patched {
        _, err = dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
            return baz(stepCtx)
        })
    } else {
        _, err = dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
            return foo(stepCtx)
        })
    }
    if err != nil {
        return "", err
    }
    _, err = dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return bar(stepCtx)
    })
    if err != nil {
        return "", err
    }
    return "success", nil
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
First, you must deprecate the patch with [`dbos.DeprecatePatch()`](../reference/workflows-steps.md#deprecatepatch).
`DeprecatePatch` must be used for a transition period prior to fully removing the patch, as it allows coexistence with any ongoing workflows that used `Patch()`.

For example, here's how to deprecate the patch above:

```go
func workflow(ctx dbos.DBOSContext, input string) (string, error) {
    _, err := dbos.DeprecatePatch(ctx, "use-baz") // always returns true
    if err != nil {
        return "", err
    }
    _, err = dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return baz(stepCtx)
    })
    if err != nil {
        return "", err
    }
    _, err = dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return bar(stepCtx)
    })
    if err != nil {
        return "", err
    }
    return "success", nil
}
```

Then, when all workflows that started before you deprecated the patch are complete, you can remove the patch entirely:

```go
func workflow(ctx dbos.DBOSContext, input string) (string, error) {
    _, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return baz(stepCtx)
    })
    if err != nil {
        return "", err
    }
    _, err = dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return bar(stepCtx)
    })
    if err != nil {
        return "", err
    }
    return "success", nil
}
```

If any mistakes happen during the process (a breaking change is not patched, or a patch is deprecated or removed prematurely), the workflow will return an error pointing to the step where the problem occurred.

### How Patching Works

Under the hood, when you call `dbos.Patch()` from a workflow, it attempts to insert a "patch marker" at its current point in your workflow history (this is a new row in the `operation_outputs` table in the DBOS [system database](../../explanations/system-tables.md)).
If it successfully inserts the patch marker or if the patch marker is already present, then the workflow should take the patch codepath.
If there is already a record present in this point in your workflow history and it is not a patch marker, then the workflow must be old (it already continued past this point with old code), and `dbos.Patch()` returns `false`.

When you deprecate a patch with `dbos.DeprecatePatch()`, new workflows no longer insert patch markers into their workflow history.
However, if a workflow contains the patch marker in its history, it continues past that patch marker, safely ignoring it.
Once all workflows with patch markers are complete, the patch may be safely removed.

## Versioning

When using versioning, DBOS **versions** applications and workflows, and only continues workflow execution with the same application version that started the workflow.
All workflows are tagged with the application version on which they started.
By default, application version is automatically computed from a hash of workflow source code.
However, you can set your own version through configuration.

```go
dbosCtx, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
    DatabaseURL:        os.Getenv("DBOS_DATABASE_URL"),
    AppName:            "my-app",
    ApplicationVersion: "1.0.0",
})
```

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents recovery of workflows that depend on different code.

When using versioning, we recommend **blue-green** code upgrades:

- When deploying a new version of your code, launch new processes running your new code version, but retain some processes running your old code version.
- Direct new traffic to your new processes while your old processes "drain" and complete all workflows of the old code version.
- Then, once all workflows of the old version are complete (you can use [`ListWorkflows`](../reference/methods.md#listworkflows) to check), you can retire the old code version.