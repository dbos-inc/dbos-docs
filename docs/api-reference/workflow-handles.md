---
sidebar_position: 6
title: Workflow Handles
description: API reference for workflow handles
---

A workflow handle represents the state of a particular active or completed workflow execution.
A workflow handle is obtained when [calling a workflow](../tutorials/workflow-tutorial#asynchronous-workflows) from a handler or another workflow with [`ctxt.invoke`](./contexts#handlerctxtinvoketargetclass-workflowuuid) or [`ctxt.childWorkflow`](./contexts#workflowctxtchildworkflowwf-args) respectively.
Additionally, a handler can retrieve a workflow handle by calling [`ctxt.retrieveWorkflow`](./contexts#handlerctxtretrieveworkflowworkflowuuid) with the workflow's [identity UUID](../tutorials/workflow-tutorial#workflow-identity).

---

### Methods

#### `getStatus(): Promise<WorkflowStatus>`

Retrieves the status of a workflow with the following structure:

```typescript
export interface WorkflowStatus {
  readonly status: string; // The status of the workflow.  One of PENDING, SUCCESS, or ERROR.
  readonly workflowName: string; // The name of the workflow function.
  readonly authenticatedUser: string; // The user who ran the workflow. Empty string if not set.
  readonly assumedRole: string; // The role used to run this workflow.  Empty string if authorization is not required.
  readonly authenticatedRoles: string[]; // All roles the authenticated user has, if any.
  readonly request: HTTPRequest; // The parent request for this workflow, if any.
}
```

#### `getResult(): Promise<R>`

Waits for the workflow to complete then returns its output.

#### `getWorkflowUUID(): string`

Retrieves the workflow's [identity UUID](../tutorials/workflow-tutorial#workflow-identity), a string that uniquely identifies this workflow's execution.
