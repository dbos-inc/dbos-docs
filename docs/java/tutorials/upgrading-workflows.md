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

To use patching, you must enable it in the configuration:

```java
var config = DBOSConfig.defaults("my-app-name").withEnablePatching();
```

For example, let's say our original workflow is:

```java
@Workflow
public int workflow() {
  DBOS.runStep(() -> foo(), "foo");
  DBOS.runStep(() -> bar(), "bar");
}
```

We want to replace the call to `foo()` with a call to `baz()`.
This is a breaking change because it changes what steps run.
We can make this breaking change safely using a patch:

```java
@Workflow
public int workflow() {
  if (DBOS.patch("use-baz")) {
    DBOS.runStep(() -> baz(), "baz");
  } else {
    DBOS.runStep(() -> foo(), "foo");
  }
  
  DBOS.runStep(() -> bar(), "bar");
}
```

Now, new workflows will run `baz()`, while old workflows will reexecute `foo()`.

### Deprecating and Removing Patches

Patches add complexity and runtime overhead; fortunately they don't need to stay in your code forever.
Once all workflows that started before you deployed the patch are complete, you can safely remove patches from your code.
:::tip
You can use the [list workflows APIs](./workflow-management.md#listing-workflows) to see what workflows are still active.
:::
First, you must deprecate the patch with [`DBOS.deprecatePatch()`](../reference/methods.md#deprecatepatch)
`DBOS.deprecatePatch` must be used for a transition period prior to fully removing the patch, as it allows coexistence with any ongoing workflows that used `DBOS.patch()`.

For example, here's how to deprecate the patch above:


```java
@Workflow
public int workflow() {
  if (DBOS.deprecatePatch("use-baz")) {
    DBOS.runStep(() -> baz(), "baz");
  }
  
  DBOS.runStep(() -> bar(), "bar");
}
```

Then, when all workflows that started before you deprecated the patch are complete, you can remove the patch entirely:

```java
@Workflow
public int workflow() {
  DBOS.runStep(() -> baz(), "baz");
  DBOS.runStep(() -> bar(), "bar");
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

## Versioning

When using versioning, DBOS **versions** applications and workflows, and only continues workflow execution with the same application version that started the workflow.
All workflows are tagged with the application version on which they started.
By default, application version is automatically computed from a hash of workflow source code.
However, you can set your own version through configuration.

```java
var config = DBOSConfig.defaults("my-app-name").withAppVersion("1.0.0");
```

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents recovery of workflows that depend on different code.

When using versioning, we recommend **blue-green** code upgrades:
 - When deploying a new version of your code, launch new processes running your new code version, but retain some processes running your old code version.
 - Direct new traffic to your new processes while your old processes "drain" and complete all workflows of the old code version.
 - Then, once all workflows of the old version are complete (you can use [`DBOS.listWorkflows`](../reference/methods.md#dboslistworkflows) to check), you can retire the old code version.