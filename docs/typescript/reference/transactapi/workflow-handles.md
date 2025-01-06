---
sidebar_position: 20
title: Workflow Handles
description: API reference for workflow handles
---

A workflow handle represents the state of a particular active or completed workflow execution.
A workflow handle is obtained when [a workflow is started](../../tutorials/programmingmodel/workflow-tutorial#asynchronous-workflows) with [`DBOS.startWorkflow`](./dbos-class#starting-background-workflows).
Additionally, a handle can be retrieved by calling [`DBOS.retrieveWorkflow`](./dbos-class#dbosretrieveworkflow) with the workflow's [identity](../../tutorials/programmingmodel/workflow-tutorial#workflow-identity).

---

### Methods

#### `getStatus(): Promise<WorkflowStatus>`

Retrieves the status of a workflow with the following structure:

```typescript
export interface WorkflowStatus {
  readonly status: string; // The status of the workflow.  One of PENDING, SUCCESS, ERROR, RETRIES_EXCEEDED, or CANCELLED.
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

Retrieves the workflow's [identity](../../tutorials/programmingmodel/workflow-tutorial#workflow-identity), a string that uniquely identifies this workflow's execution.

#### `getWorkflowInputs<T extends any []>(): Promise<T>`

Retrieves the worklow's input argument array.