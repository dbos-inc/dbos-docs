---
sidebar_position: 65
title: Upgrading Workflow Code
toc_max_heading_level: 3
---

One challenge you may encounter when operating long-running durable workflows in production is **how to deploy breaking changes to workflow code without disrupting in-progress workflows.**
A breaking change to a workflow is any change in what steps run or the order in which steps run.
The issue is that if a breaking change was made to a workflow, the checkpoints created by a workflow that started on the previous version of the code may not match the steps called by the workflow in the new version of the code, which makes the workflow difficult to recover.

DBOS supports two strategies for safely upgrading workflow code: **patching** and **versioning**.

## Patching

When using patching, you use [`DBOS.patch()`](../reference/contexts.md#patch) to make a breaking change in a conditional.
`DBOS.patch()` returns `True` for new workflows (those started after the breaking change) and `False` for old workflows (those started before the breaking change).
Therefore, if `DBOS.patch()` is `True`, call the new code, else, call the old code.

To use patching, you must enable it in configuration:

```python
config: DBOSConfig = {
    "name": "dbos-app",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "enable_patching": True,
}
DBOS(config=config)
```

For example, let's say our workflow is:

```python
@DBOS.workflow()
def workflow():
  foo()
  bar()
```

We want to replace the call to `foo()` with a call to `baz()`.
This is a breaking change because it changes what steps run.
We can make this breaking change safely using a patch:

```python
@DBOS.workflow()
def workflow():
  if DBOS.patch("use-baz"):
    baz()
  else:
    foo()
  bar()
```

Now, new workflows will run `baz()`, while old workflows will safely continue through `foo()`.

If you are making multiple breaking changes to your code, you can use multiple patches with different names.
For example, you might later replace the call to `bar()` with a call to `qux()` in a new patch:

```python
@DBOS.workflow()
def workflow():
  if DBOS.patch("use-baz"):
    baz()
  else:
    foo()
  if DBOS.patch("use-qux"):
    qux()
  else:
    bar()
```

### Deprecating and Removing Patches

Patches don't need to stay in your code forever.
Once all workflows that started before you deployed the patch are complete, you can safely remove patches from your code.
First, you must deprecate the patch with [`DBOS.deprecate_patch()`](../reference/contexts.md#deprecate_patch).
This safely runs all workflows that contain the patch marker, but does not insert the patch marker into new workflows.
For example, here's how to deprecate the patch above:

```python
@DBOS.workflow()
def workflow():
  DBOS.deprecate_patch("use-baz")
  baz()
  bar()
```

Then, when all workflows that started before you deprecated the patch are complete, you can remove the patch entirely:

```python
@DBOS.workflow()
def workflow():
  baz()
  bar()
```

If any mistakes happen during the process (a breaking change is not patched, or a patch is deprecated or removed prematurely), the workflow will throw a `DBOSUnexpectedStepError` error clearly pointing to the step where the problem occurred.

### How Patching Works

Under the hood, when you call `DBOS.patch()` from a workflow, it attempts to insert a "patch marker" at its current point in your workflow history.
If it succesfully inserts the patch marker or if the patch marker is already present, then the workflow must be new (it started after the patch, or started before the patch but has not yet reached this point), so `DBOS.patch()` returns `True`.
If there is already a record present in this point in your workflow history, then the workflow must be old (it started before the patch and has already continued past this point), so `DBOS.patch()` returns `False`.

When you deprecate a patch with `DBOS.deprecate_patch()`, new workflows no longer insert patch markers into their workflow history.
However, if a workflow contains the patch marker in its history, it continues past that patch marker, safely ignoring it.
Once all workflows with patch markers are complete, you can safely remove the patch entirely.

## Versioning

When using versioning, DBOS **versions** applications and workflows.
All workflows are tagged with the application version on which they started.
By default, application version is automatically computed from a hash of workflow source code.
However, you can set your own version through configuration.

```python
config: DBOSConfig = {
    "name": "dbos-app",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "application_version": "1.0.0",
}
DBOS(config=config)
```

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.

When using versioning, we recommend **blue-green** code upgrades.
When deploying a new version of your code, launch new processes running your new code version, but retain some processes running your old code version.
Direct new traffic to your new processes while your old processes "drain" and complete all workflows of the old code version.
Then, once all workflows of the old version are complete (you can use [`DBOS.list_workflows`](../reference/contexts.md#list_workflows) to check), you can retire the old code version.