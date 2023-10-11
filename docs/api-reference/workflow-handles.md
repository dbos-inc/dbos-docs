---
sidebar_position: 5
title: Workflow Handles
description: API documentation for workflow handles
---

Workflow handles represent the state of an active or completed workflow execution.
A workflow handle is obtained when [calling a workflow](../tutorials/workflow-tutorial#asynchronous-workflows) from a handler or another workflow with [`ctxt.invoke`](..) or [`ctxt.childWorkflow`](..).
A handler can retrieve the handle of any workflow by calling [`ctxt.retrieveWorkflow`](..) on that workflow's [identity UUID](../tutorials/workflow-tutorial#workflow-identity).

### Methods

#### `getStatus() : Promise<WorkflowStatus>`

This retrieves the status of a workflow.  A status is the following object:

```typescript
export interface WorkflowStatus {
  status: string; // The status of the workflow.  One of PENDING, SUCCESS, or ERROR.
  workflowName: string; // The name of the workflow function.
  authenticatedUser: string; // The user who ran the workflow. Empty string if not set.
  assumedRole: string; // The role used to run this workflow.  Empty string if authorization is not required.
  authenticatedRoles: string[]; // All roles the authenticated user has, if any.
  request: HTTPRequest; // The parent request for this workflow, if any.
}
```

#### `getResult(): Promise<R>`

This waits for a workflow to complete then returns its result.

#### `getWorkflowUUID() : string`

This returns the workflow's [identity UUID](../tutorials/workflow-tutorial#workflow-identity), a 128-bit UUID in string format that uniquely identifies that workflow's execution.
