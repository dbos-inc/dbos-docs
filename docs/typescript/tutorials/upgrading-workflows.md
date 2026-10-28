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

In patching, the result of a call to [`DBOS.patch()`](../reference/workflows-steps.md#patch) is used to conditionally execute the new code.
`DBOS.patch()` returns `true` for new calls (those executing after the breaking change) and `false` for old calls (those that executed before the breaking change).
Therefore, if `DBOS.patch()` returns `true`, the workflow should follow the new code path, otherwise it must follow the prior codepath.

When using patching, processes running your new code must be able to recover workflows started on your old code.
There are two ways to do this:

1. **Pin the application version.** Set a fixed application version in your configuration, so every deployment of your code shares the same version:

   ```typescript
   DBOS.setConfig({
     name: 'dbos-app',
     systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
     applicationVersion: '1.0.0',
   });
   await DBOS.launch();
   ```

2. **Enable auto-upgrade.** Give each deployment its own application version, and let DBOS automatically move workflows from older versions to the latest version:

   ```typescript
   DBOS.setConfig({
     name: 'dbos-app',
     systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
     autoUpgrade: true,
   });
   await DBOS.launch({ conductorKey: process.env.DBOS_CONDUCTOR_KEY });
   ```

   Auto-upgrade is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature; see [Auto-Upgrading Workflows](#auto-upgrading-workflows) for details.

For example, let's say our original workflow is:

```typescript
@DBOS.workflow()
static async workflow() {
  await foo();
  await bar();
}
```

We want to replace the call to `foo()` with a call to `baz()`.
This is a breaking change because it changes what steps run.
We can make this breaking change safely using a patch:

```typescript
@DBOS.workflow()
static async workflow() {
  if (await DBOS.patch('use-baz')) {
    await baz();
  }
  else {
    await foo();
  }
  await bar();
}
```

Now, new workflows will run `baz()`, while old workflows will reexecute `foo()`.

### Deprecating and Removing Patches

Patches add complexity and runtime overhead; fortunately they don't need to stay in your code forever.
Once all workflows that started before you deployed the patch are complete, you can safely remove patches from your code.
:::tip
You can use the [list workflows APIs](./workflow-management.md#listing-workflows) to see what workflows are still active.
:::
First, you must deprecate the patch with [`DBOS.deprecatePatch()`](../reference/workflows-steps.md#deprecatepatch).
`DBOS.deprecatePatch` must be used for a transition period prior to fully removing the patch, as it allows coexistence with any ongoing workflows that used `DBOS.patch()`.

For example, here's how to deprecate the patch above:

```typescript
@DBOS.workflow()
static async workflow(){
  if (await DBOS.deprecatePatch("use-baz")) { // always true
    await baz();
  }
  await bar();
}
```

Then, when all workflows that started before you deprecated the patch are complete, you can remove the patch entirely:

```typescript
@DBOS.workflow()
static async workflow() {
  await baz()
  await bar()
}
```

If any mistakes happen during the process (a breaking change is not patched, or a patch is deprecated or removed prematurely), the workflow will throw a `DBOSUnexpectedStepError` pointing to the step where the problem occurred.

### How Patching Works

Under the hood, when you call `DBOS.patch()` from a workflow, it attempts to insert a "patch marker" at its current point in your workflow history (this is a new row in the `operation_outputs` table in your database).
If it successfully inserts the patch marker or if the patch marker is already present, then the workflow should take the patch codepath.
If there is already a record present in this point in your workflow history and it is not a patch marker, then the workflow must be old (it already continued past this point with old code), and `DBOS.patch()` returns `false`.

When you deprecate a patch with `DBOS.deprecatePatch()`, new workflows no longer insert patch markers into their workflow history.
However, if a workflow contains the patch marker in its history, it continues past that patch marker, safely ignoring it.
Once all workflows with patch markers are complete, the patch may be safely removed.

### Auto-Upgrading Workflows

:::info
Auto-upgrade is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature.
:::

With auto-upgrade, each deployment of your code has its own [application version](#versioning), and DBOS automatically moves workflows left on older versions to the latest version, where your patched code completes them.
This way, processes running old code never pick up workflows started on new code, which their code can't handle.
Meanwhile, workflows started on old code are upgraded to new code, so you don't have to keep old processes running until those workflows complete.
**Only enable auto-upgrade for a workflow if every breaking change you make to it is [patched](#patching).**

To enable auto-upgrade for all workflows in your application, set `autoUpgrade` in your configuration:

```typescript
DBOS.setConfig({
  name: 'dbos-app',
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  autoUpgrade: true,
});
await DBOS.launch({ conductorKey: process.env.DBOS_CONDUCTOR_KEY });
```

You can also enable or disable auto-upgrade for individual workflows with the `autoUpgrade` field of [`WorkflowConfig`](../reference/workflows-steps.md#dbosworkflow).
A workflow that sets `autoUpgrade: true` is auto-upgraded even if `autoUpgrade` isn't set in your configuration, and a workflow that sets `autoUpgrade: false` is never auto-upgraded:

```typescript
@DBOS.workflow({ autoUpgrade: false })
static async workflowWithoutPatches() {
  // ...
}
```

Auto-upgrade runs in the background on processes running the latest application version.
When auto-upgrade runs:

- **`ENQUEUED` and `DELAYED` workflows** are upgraded immediately, so they are dequeued by processes running the latest version.
- **`PENDING` workflows** are re-enqueued on the latest version, which then recovers them from their last completed step, just as it would recover a workflow interrupted by a crash.
If a process running old code is still executing such a workflow, DBOS [detects the concurrent execution](../../explanations/concurrent-executions.md) and ensures only one outcome is recorded.
To give processes running old code time to complete their `PENDING` workflows first, set `autoUpgradeGraceMs`: DBOS then only upgrades `PENDING` workflows once the latest version has been the latest for that many milliseconds.

## Versioning

When using versioning, DBOS **versions** applications and workflows, and only continues workflow execution with the same application version that started the workflow.
All workflows are tagged with the application version on which they started.
By default, application version is automatically computed from a hash of workflow source code.
However, you can set your own version through configuration.

```typescript
const config: DBOSConfig = {
  // ...
  applicationVersion: '1.0.0',
}
```

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents recovery of workflows that depend on different code.

When using versioning, we recommend **blue-green** code upgrades.
When deploying a new version of your code, launch new processes running your new code version, but retain some processes running your old code version.
Direct new traffic to your new processes while your old processes "drain" and complete all workflows of the old code version.
To direct enqueued workflows to processes running the latest version of your code, use [`DBOS.getLatestApplicationVersion`](../reference/methods.md#dbosgetlatestapplicationversion) to look up the latest version:

```typescript
const latestVersion = await DBOS.getLatestApplicationVersion();
const handle = await DBOS.startWorkflow(myWorkflow, {
  queueName: "my_queue",
  enqueueOptions: { applicationVersion: latestVersion.versionName },
})(arg1, arg2);
```

Or using [`DBOSClient`](../reference/client.md#version-management):

```typescript
import { DBOSClient } from "@dbos-inc/dbos-sdk";

const client = await DBOSClient.create({
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL!,
  applicationName: "my-app",
});

const latestVersion = await client.getLatestApplicationVersion();
const handle = await client.enqueue({
  workflowName: "myWorkflow",
  queueName: "my_queue",
  appVersion: latestVersion.versionName,
}, arg1, arg2);
```

Note that [scheduled workflows](./scheduled-workflows.md) are automatically enqueued to their owning application's latest version.

Then, once all workflows of the old version are complete, you can retire the old code version.
You can use [`DBOS.listWorkflows`](../reference/methods.md#dboslistworkflows) to check if any workflows are still active for a given version:

```typescript
const active = await DBOS.listWorkflows({
  applicationVersion: "1.0.0",
  status: ["ENQUEUED", "DELAYED", "PENDING"],
});
if (active.length === 0) {
  console.log("Safe to retire version 1.0.0");
}
```

If you need to roll back to a previous version of your code, use [`DBOS.setLatestApplicationVersion`](../reference/methods.md#dbossetlatestapplicationversion) to promote that version to latest so new enqueued workflows are directed to it:

```typescript
await DBOS.setLatestApplicationVersion("1.0.0");
```