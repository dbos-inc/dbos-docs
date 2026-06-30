---
sidebar_position: 50
title: Workflow Management
---

You can view and manage your durable workflow executions via the [DBOS Console](../../production/workflow-management.md) or programmatically.

## Listing Workflows

You can list your application's workflows programmatically via [`dbos.listWorkflows`](../reference/methods.md#listworkflows) or using the [`DBOSClient`](../reference/client.md#listworkflows).

You can also view a searchable and expandable list of your application's workflows from its page on the [DBOS Console](../../production/workflow-management.md).

<img src={require('@site/static/img/workflow-management/workflow-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Listing Workflow Steps

You can list the steps of a workflow programmatically via [`dbos.listWorkflowSteps`](../reference/methods.md#listworkflowsteps) or using the [`DBOSClient`](../reference/client.md#listworkflowsteps).

You can also visualize a workflow's execution as a trace timeline (showing the workflow, its steps, and its child workflows and their steps) from its page on the [DBOS Console](../../production/workflow-management.md).
For example, here is the trace of a workflow that processes multiple tasks concurrently by enqueuing child workflows:

<img src={require('@site/static/img/workflow-management/workflow-steps.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Cancelling Workflows

You can cancel the execution of a workflow from the web UI, programmatically via [`dbos.cancelWorkflow`](../reference/methods.md#cancelworkflow), or using the [`DBOSClient`](../reference/client.md#cancelworkflow).

If the workflow is currently executing, cancelling it preempts its execution (interrupting it at the beginning of its next step).
If the workflow is enqueued, cancelling removes it from the queue.

To also cancel all descendant workflows spawned by the cancelled workflow, pass `cancelChildren = true`:

```java
dbos.cancelWorkflow(workflowId, true);
// or for multiple workflows:
dbos.cancelWorkflows(workflowIds, true);
```

When a workflow is cancelled while it is waiting inside [`recv`](../reference/methods.md#recv) or [`getEvent`](../reference/methods.md#getevent), a `DBOSWorkflowCancelledException` is thrown to abort it immediately rather than waiting for the timeout to expire.

## Resuming Workflows

You can resume a workflow from its last completed step from the web UI, programmatically via [`dbos.resumeWorkflow`](../reference/methods.md#resumeworkflow), or using the [`DBOSClient`](../reference/client.md#resumeworkflow).

You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

## Forking Workflows

You can start a new execution of a workflow by **forking** it from a specific step.
When you fork a workflow, DBOS generates a new workflow with a new workflow ID, copies to that workflow the original workflow's inputs and all its steps up to the selected step, then begins executing the new workflow from the selected step.

Forking a workflow is useful for recovering from outages in downstream services (by forking from the step that failed after the outage is resolved) or for "patching" workflows that failed due to a bug in a previous application version (by forking from the bugged step to an application version on which the bug is fixed).

You can fork a workflow programmatically using [`dbos.forkWorkflow`](../reference/methods.md#forkworkflow) or using the [`DBOSClient`](../reference/client.md#forkworkflow).
You can also fork a workflow from a step from the web UI by clicking on that step in the workflow's graph visualization:

<img src={require('@site/static/img/workflow-management/workflow-fork.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Forking from Failure

When a workflow fails and you want to re-run it from where it went wrong, use [`forkFromFailure`](../reference/methods.md#forkfromfailure). Unlike `forkWorkflow`, you don't need to look up the exact step number — DBOS finds it automatically based on the mode you choose.

```java
// Restart from the last step that recorded an error (most common)
dbos.forkFromFailure(failedWorkflowId,
    new ForkFromFailureOptions.FromLastFailure());

// Restart from the very last step (whether it failed or succeeded)
dbos.forkFromFailure(failedWorkflowId,
    new ForkFromFailureOptions.FromLastStep());

// Restart from a specific step number
dbos.forkFromFailure(failedWorkflowId,
    new ForkFromFailureOptions.FromStep(3));

// Restart from the last occurrence of a named step
dbos.forkFromFailure(failedWorkflowId,
    new ForkFromFailureOptions.FromStepName("callPaymentAPI"));
```

All options support chaining `withApplicationVersion`, `withQueue`, and `withQueuePartitionKey`.

You can also retry multiple failed workflows at once:

```java
dbos.forkFromFailure(List.of(id1, id2, id3),
    new ForkFromFailureOptions.FromLastFailure()
        .withApplicationVersion("v2.1"));
```

See [`ForkFromFailureOptions`](../reference/methods.md#forkfromfailureoptions) for the full API.

## Workflow Attributes

You can attach custom metadata to any workflow as a `Map<String, Object>`. Attributes are stored as JSON and are searchable.

**At creation:**

```java
dbos.startWorkflow(() -> proxy.processOrder(orderId),
    new StartWorkflowOptions()
        .withAttributes(Map.of("customerId", "cust-123", "region", "us-west")));
```

**After creation (from anywhere, including inside a workflow):**

```java
dbos.updateWorkflowAttributes(workflowId,
    Map.of("status", "awaiting-payment", "invoiceId", "inv-456"));
```

When called from within a workflow, `updateWorkflowAttributes` is recorded as a step and executes exactly once even under recovery.

**Filtering by attributes:**

```java
// Find all workflows for customer cust-123
List<WorkflowStatus> results = dbos.listWorkflows(
    new ListWorkflowsInput()
        .withAttributes(Map.of("customerId", "cust-123")));
```

The filter uses PostgreSQL's `@>` containment operator — it matches any workflow whose `attributes` map contains all the specified key-value pairs. Pass a subset of the attributes to match; extra attributes on the workflow are ignored.
