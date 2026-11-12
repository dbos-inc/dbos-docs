---
sidebar_position: 50
title: Workflow Management
---

You can view and manage your durable workflow executions via the [DBOS Console](../../conductor/workflow-management.md) or programmatically.

## Listing Workflows

You can list your application's workflows programmatically via [`dbos.listWorkflows`](../reference/methods.md#listworkflows) or using the [`DBOSClient`](../reference/client.md#listworkflows).

You can also view a searchable and expandable list of your application's workflows from its page on the [DBOS Console](../../conductor/workflow-management.md).

<img src={require('@site/static/img/workflow-management/workflow-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Listing Workflow Steps

You can list the steps of a workflow programmatically via [`dbos.listWorkflowSteps`](../reference/methods.md#listworkflowsteps) or using the [`DBOSClient`](../reference/client.md#listworkflowsteps).

You can also visualize a workflow's execution as a trace timeline (showing the workflow, its steps, and its child workflows and their steps) from its page on the [DBOS Console](../../conductor/workflow-management.md).
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

A workflow can't cancel, resume, or delete itself.
Called from inside a workflow, or from one of its steps, `cancelWorkflow`, `resumeWorkflow`, and `deleteWorkflow` (and their list forms) throw `IllegalArgumentException` when the calling workflow is among their targets, and change nothing.
A workflow that wants to stop should return or throw instead.

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

## Rewinding Workflows

You can re-execute a workflow from a specific step, keeping its workflow ID, by **rewinding** it.
When you rewind a workflow, DBOS discards the workflow's recorded steps from the selected step onward, clears its output, and re-enqueues it.
The workflow then re-executes from the selected step, replaying the recorded outputs of earlier steps.

The difference between rewind and fork is that fork creates a copy of the workflow with a new ID, while rewind actually "rewinds" the original workflow (modifying its state) and keeps its original ID.
Because the rewound workflow keeps its original ID, other workflows and clients can keep sending messages to it and reading its events and streams.
Rewinding is useful when other code refers to a workflow by its ID, for example when the ID is an idempotency key derived from an order or request ID.

Rewinding doesn't modify a workflow's child workflows, even those started after the selected step: they keep their IDs, so the rewound workflow gets the existing children back instead of starting new ones. To re-run a child, rewind it separately.

You can only rewind a workflow that is in a terminal state (for example, `SUCCESS`, `ERROR`, or `CANCELLED`); cancel a running workflow before rewinding it.
Like forking, you can rewind a workflow onto a new application version to "patch" a workflow that failed due to a bug.

You can rewind a workflow programmatically using [`dbos.rewindWorkflow`](../reference/methods.md#rewindworkflow) or using the [`DBOSClient`](../reference/client.md#rewindworkflow):

```java
// Re-execute the workflow from step 3, keeping its workflow ID
WorkflowHandle<String, Exception> handle = dbos.rewindWorkflow(workflowId, 3);
String result = handle.getResult();

// Rewind onto a new application version, on a specific queue
dbos.rewindWorkflow(workflowId, 3,
    new RewindOptions().withApplicationVersion("2.0.0").withQueue("recovery-queue"));
```

Rewinding from the application also deletes the [step factories'](../reference/workflows-steps.md#step-factories) transaction checkpoints from the selected step on, so those transactions run again. A rewind through `DBOSClient` can't reach your application database, so it leaves them, and those transactional steps replay their recorded results.

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
