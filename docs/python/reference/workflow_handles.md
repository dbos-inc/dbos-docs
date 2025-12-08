---
sidebar_position: 5
title: Workflow Handles
description: API reference for DBOS workflow handles
---

A workflow handle represents the state of a particular active or completed workflow execution.
You obtain a workflow handle when using `DBOS.start_workflow` to start a workflow in the background.
If you know a workflow's identity, you can also retrieve its handle using `DBOS.retrieve_workflow`.

## WorkflowHandle

### Methods

#### get_workflow_id

```python
handle.get_workflow_id() -> str
```

Retrieve the ID of the workflow.

#### get_result

```python
handle.get_result(
    *,
    polling_interval_sec: float = 1.0,
) -> R
```

Wait for the workflow to complete, then return its result.

**Parameters:**
- **polling_interval_sec**: The interval at which DBOS polls the database for the workflow's result. Only used for enqueued workflows or retrieved handles.

#### get_status

```python
handle.get_status() -> WorkflowStatus
```

Retrieve the [`WorkflowStatus`](./contexts.md#workflow-status) of a workflow.


## WorkflowHandleAsync

### Methods

#### get_workflow_id

```python
handle.get_workflow_id() -> str
```

Retrieve the ID of the workflow. Behaves identically to the [WorkflowHandle](#workflowhandle) version.

#### get_result

```python
handle.get_result(
    *,
    polling_interval_sec: float = 1.0,
) -> Coroutine[Any, Any, R]
```

Asynchronously wait for the workflow to complete, then return its result. Similar to the [WorkflowHandle](#workflowhandle) version, except asynchronous.

#### get_status

```python
handle.get_status() -> Coroutine[Any, Any, WorkflowStatus]
```

Asynchronously retrieve the [`WorkflowStatus`](./contexts.md#workflow-status) of a workflow.
