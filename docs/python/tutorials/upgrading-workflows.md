---
sidebar_position: 65
title: Upgrading Workflow Code
toc_max_heading_level: 3
---

One challenge you may encounter when operating long-running durable workflows in production is **how to deploy breaking changes to workflow code without disrupting in-progress workflows.**
A breaking change to a workflow is any change in what steps run or the order in which steps run.
The issue is that if a breaking change was made to a workflow, the checkpoints created by a workflow that started on the previous version of the code may not match the steps called by the workflow in the new version of the code, which makes the workflow difficult to recover.

DBOS supports two strategies for safely upgrading workflow code: patching and versioning.

## Patching

When using patching, you use `DBOS.patch()` to make a breaking change in a conditional.
`DBOS.patch()` returns True for new workflows (those which started after or reached the patch point after the breaking change) and False for old workflows (those that started before the breaking change).
Therefore, if `DBOS.patch()` is true, call the new code, else, call the old code.

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

### Deprecating and Removing Patches

Patches don't need to stay in your code forever.
Once all workflows of the pre-patch code version are complete, you can safely remove patches from your code.
First, you must deprecate the patch.
This safely runs all workflows that contain the patch marker, but does not insert the patch marker into new workflows.
For example, here's how to deprecate the patch above:

```python
@DBOS.workflow()
def workflow():
  DBOS.deprecate_patch("use-baz")
  baz()
  bar()
```

Then, when all workflows containing the patch marker are complete, you can remove the patch entirely:

```python
@DBOS.workflow()
def workflow():
  baz()
  bar()
```

If any mistakes happen during the process (a breaking change is not patched, or a patch is deprecated or removed prematurely), the workflow will throw a `DBOSUnexpectedStepError` error clearly pointing to the step where the problem occurred.

### Applying Multiple Patches

If you need to make multiple breaking changes to a workflow over time, you can use multiple patches with different names.
You can also "stack" patches to make consecutive breaking changes to the same code.
For example, if you want to call `qux()` instead of `baz()` or `foo()`, you can create another patch:

```python
@DBOS.workflow()
def workflow():
  if DBOS.patch("use-qux"):
    qux()
  elif DBOS.patch("use-baz"):
    baz()
  else:
    foo()
  bar()
```

### How Patching Works