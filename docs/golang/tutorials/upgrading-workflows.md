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

When using patching, processes running your new code must be able to recover workflows started on your old code.
There are two ways to do this:

1. **Pin the application version.** Set a fixed application version in your configuration, so every deployment of your code shares the same version:

   ```go
   dbosCtx, err := dbos.NewContext(context.Background(), dbos.Config{
       AppName:            "my-app",
       DatabaseURL:        os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
       ApplicationVersion: "1.0.0",
   })
   ```

2. **Enable auto-upgrade.** Give each deployment its own application version, and let DBOS automatically move workflows from older versions to the latest version:

   ```go
   import _ "go.dbos.dev/dbos-enterprise-go"

   dbosCtx, err := dbos.NewContext(context.Background(), dbos.Config{
       AppName:         "my-app",
       DatabaseURL:     os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
       ConductorAPIKey: os.Getenv("DBOS_CONDUCTOR_KEY"),
       AutoUpgrade:     true,
   })
   ```

   Auto-upgrade is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature; see [Auto-Upgrading Workflows](#auto-upgrading-workflows) for details.

For example, let's say our original workflow is:

```go
func workflow(ctx dbos.Context, input string) (string, error) {
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
func workflow(ctx dbos.Context, input string) (string, error) {
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
func workflow(ctx dbos.Context, input string) (string, error) {
    err := dbos.DeprecatePatch(ctx, "use-baz")
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
func workflow(ctx dbos.Context, input string) (string, error) {
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

### Auto-Upgrading Workflows

:::info
Auto-upgrade is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature.
It requires importing `go.dbos.dev/dbos-enterprise-go` and an entitled DBOS key; see [DBOS Transact Enterprise](../reference/configuration.md#dbos-transact-enterprise).
:::

With auto-upgrade, each deployment of your code has its own [application version](#versioning), and DBOS automatically moves workflows left on older versions to the latest version, where your patched code completes them.
This way, processes running old code never pick up workflows started on new code, which their code can't handle.
Meanwhile, workflows started on old code are upgraded to new code, so you don't have to keep old processes running until those workflows complete.
**Only enable auto-upgrade for a workflow if every breaking change you make to it is [patched](#patching).**

To enable auto-upgrade for all workflows in your application, set `AutoUpgrade` in your configuration:

```go
import _ "go.dbos.dev/dbos-enterprise-go"

dbosCtx, err := dbos.NewContext(context.Background(), dbos.Config{
    AppName:         "my-app",
    DatabaseURL:     os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    ConductorAPIKey: os.Getenv("DBOS_CONDUCTOR_KEY"),
    AutoUpgrade:     true,
})
```

You can also enable or disable auto-upgrade for individual workflows with the [`WithAutoUpgrade`](../reference/workflows-steps.md#withautoupgrade) registration option.
A workflow registered with `WithAutoUpgrade(true)` is auto-upgraded even if `AutoUpgrade` isn't set in your configuration, and a workflow registered with `WithAutoUpgrade(false)` is never auto-upgraded:

```go
dbos.RegisterWorkflow(dbosCtx, workflowWithoutPatches, dbos.WithAutoUpgrade(false))
```

Auto-upgrade runs in the background on processes running the latest application version, from [`Launch`](../reference/dbos-context.md#launch) until shutdown, and only moves the workflows enrolled in it.
When auto-upgrade runs:

- **`ENQUEUED` and `DELAYED` workflows** are upgraded immediately, so they are dequeued by processes running the latest version.
- **`PENDING` workflows** are re-enqueued on the latest version, which then recovers them from their last completed step, just as it would recover a workflow interrupted by a crash.
If a process running old code is still executing such a workflow, DBOS [detects the concurrent execution](../../explanations/concurrent-executions.md) and ensures only one outcome is recorded.
To give processes running old code time to complete their `PENDING` workflows first, set `AutoUpgradeGracePeriod`: DBOS then only upgrades `PENDING` workflows once the latest version has been the latest for that long.

## Versioning

When using versioning, DBOS **versions** applications and workflows, and only continues workflow execution with the same application version that started the workflow.
All workflows are tagged with the application version on which they started.
By default, application version is automatically computed from a hash of workflow source code.
However, you can set your own version through configuration.

```go
dbosCtx, err := dbos.NewContext(context.Background(), dbos.Config{
    AppName:            "my-app",
    DatabaseURL:        os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    ApplicationVersion: "1.0.0",
})
```

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents recovery of workflows that depend on different code.

Enqueued workflows with no application version (for example, enqueued from a [DBOS Client](../reference/dbos-context.md#newclient) without specifying a version) are only dequeued by processes running their owning application's **latest** registered version.
This ensures version-less work is picked up by the newest code during a rolling deploy.

When using versioning, we recommend **blue-green** code upgrades:

- When deploying a new version of your code, launch new processes running your new code version, but retain some processes running your old code version.
- Direct new traffic to your new processes while your old processes "drain" and complete all workflows of the old code version.
- Then, once all workflows of the old version are complete (you can use [`ListWorkflows`](../reference/methods.md#listworkflows) to check), you can retire the old code version.