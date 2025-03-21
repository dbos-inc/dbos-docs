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
handle.get_result() -> R
```

Wait for the workflow to complete, then return its result.

#### get_status

```python
handle.get_status() -> WorkflowStatus
```

Retrieve the [workflow's status](#workflowstatus), defined below.


## WorkflowHandleAsync

### Methods

#### get_workflow_id

```python
handle.get_workflow_id() -> str
```

Retrieve the ID of the workflow. Behaves identically to the [WorkflowHandle](#workflowhandle) version.

#### get_result

```python
handle.get_result() -> Coroutine[Any, Any, R]
```

Asynchronously wait for the workflow to complete, then return its result. Similar to the [WorkflowHandle](#workflowhandle) version, except asynchronous.

#### get_status

```python
handle.get_status() -> Coroutine[Any, Any, WorkflowStatus]
```

Asynchronously retrieves the [workflow's status](#workflowstatus), defined below.

## WorkflowStatus

```python
class WorkflowStatus:
    workflow_id: str # The workflow's ID
    status: str # The workflow's current state. One of PENDING, SUCCESS, ERROR, RETRIES_EXCEEDED, or CANCELLED
    name: str # The fully qualified name of the workflow function
    class_name: Optional[str] # If the workflow function is a class method, the name of the class
    config_name: Optional[str] # If the workflow function is a method of a configured class, the name of the class configuration
    authenticated_user: Optional[str] # The authenticated user running the workflow
    assumed_role: Optional[str] # The role with which the workflow is run
    authenticatedRoles: Optional[List[str]] # All roles which the authenticated user could assume
```