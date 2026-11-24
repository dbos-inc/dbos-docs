---
sidebar_position: 50
title: Workflow Handles
description: API reference for DBOS workflow handles
---

A workflow handle represents the state of a particular active or completed workflow execution.
You obtain a workflow handle when using `DBOS.start_workflow` to start a workflow in the background or when enqueueing a workflow with [`DBOS.enqueue_workflow`](./contexts.md#enqueue_workflow) or [`Queue.enqueue`](./queues.md#enqueue).
If you know a workflow's identity, you can also retrieve its handle using `DBOS.retrieve_workflow`.

## WorkflowHandle

### Attributes

#### shard_key

```python
handle.shard_key: Optional[str]
```

The workflow's [shard key](../tutorials/sharding.md).

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
    suspend: bool = False,
) -> R
```

Wait for the workflow to complete, then return its result.

**Parameters:**
- **polling_interval_sec**: The interval at which DBOS polls the database for the workflow's result. Only used for enqueued workflows or retrieved handles.
- **suspend**: If `True`, a call from within a workflow that has to wait [suspends the calling workflow](../tutorials/workflow-tutorial.md#suspending-workflows) until this workflow completes, instead of keeping it in memory. Requires [`suspend_mode`](./configuration.md#dbos-transact-enterprise-settings) and DBOS Transact Enterprise. Raises an error outside a workflow, in a step, or on a [`DBOSClient`](./client.md) handle. Defaults to `False`.

#### get_status

```python
handle.get_status() -> WorkflowStatus
```

Retrieve the [`WorkflowStatus`](./contexts.md#workflow-status) of a workflow.


## WorkflowHandleAsync

### Attributes

#### shard_key

```python
handle.shard_key: Optional[str]
```

The workflow's [shard key](../tutorials/sharding.md).

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
    suspend: bool = False,
) -> Coroutine[Any, Any, R]
```

Asynchronously wait for the workflow to complete, then return its result. Similar to the [WorkflowHandle](#workflowhandle) version, except asynchronous.

#### get_status

```python
handle.get_status() -> Coroutine[Any, Any, WorkflowStatus]
```

Asynchronously retrieve the [`WorkflowStatus`](./contexts.md#workflow-status) of a workflow.
