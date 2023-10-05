---
sidebar_position: 3
title: Workflow handles
description: API documentation for Operon Workflow Handles
---

Invoking an Operon workflow returns a handle representing an active or completed workflow execution.
Using the handle, you can retrieve information about the workflow: status, result, and UUID.

```tsx
/**
 * Object representing an active or completed workflow execution, identified by the workflow UUID.
 * Allows retrieval of information about the workflow.
 */
export interface WorkflowHandle<R> {
  /**
   * Retrieve the workflow's status.
   * Statuses are updated asynchronously.
   */
  getStatus(): Promise<WorkflowStatus | null>;
  /**
   * Await workflow completion and return its result.
   */
  getResult(): Promise<R>;
  /**
   * Return the workflow's UUID.
   */
  getWorkflowUUID(): string;
}
```
