---
sidebar_position: 50
title: Workflow Management
---

You can view and manage your durable workflow executions via the [DBOS Console](../../production/workflow-management.md), programmatically, or via command line.

## Listing Workflows

You can list your application's workflows programmatically via [`DBOS.listWorkflows`](../reference/methods.md#dboslistworkflows) or from the command line with [`npx dbos workflow list`](../reference/cli.md#npx-dbos-workflow-list).

You can also view a searchable and expandable list of your application's workflows from its page on the [DBOS Console](../../production/workflow-management.md).

<img src={require('@site/static/img/workflow-management/workflow-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Listing Workflow Steps

You can list the steps of a workflow programmatically via [`DBOS.listWorkflowSteps`](../reference/methods.md#dboslistworkflowsteps) or from the command line with [`npx dbos workflow steps`](../reference/cli.md#npx-dbos-workflow-steps).

You can also visualize a workflow's execution as a trace timeline (showing the workflow, its steps, and its child workflows and their steps) from its page on the [DBOS Console](../../production/workflow-management.md).
For example, here is the trace of a workflow that processes multiple tasks concurrently by enqueueing child workflows:

<img src={require('@site/static/img/workflow-management/workflow-steps.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Workflow Attributes

You can attach a record of custom, JSON-serializable key-value **attributes** to a workflow by passing `workflowAttributes` to [`DBOS.startWorkflow`](../reference/methods.md#dbosstartworkflow).
This is useful for tagging workflows with application-specific metadata such as a customer ID, tenant, or region.

```typescript
const handle = await DBOS.startWorkflow(processOrder, {
  workflowAttributes: { customer: 'acme', region: 'us-east-1' },
})(order);
```

Attributes must be a key-value object (not a scalar or array), are recorded at creation time, and are not inherited by child workflows.
They are stored in Postgres as GIN-indexed JSONB, so you can efficiently search for workflows by attribute by passing the `attributes` filter to [`DBOS.listWorkflows`](../reference/methods.md#dboslistworkflows).
A workflow matches if its attributes contain all the key-value pairs you provide:

```typescript
// Retrieve all workflows tagged with this customer
const workflows = await DBOS.listWorkflows({ attributes: { customer: 'acme' } });
```

## Cancelling Workflows

You can cancel the execution of a workflow from the web UI, programmatically via [`DBOS.cancelWorkflow`](../reference/methods.md#dboscancelworkflow), or through the command line with [`npx dbos workflow cancel`](../reference/cli.md#npx-dbos-workflow-cancel).

If the workflow is currently executing, cancelling it preempts its execution (interrupting it at the beginning of its next step).
If the workflow is enqueued, cancelling removes it from the queue.

A step that is executing when its workflow is cancelled is not interrupted, but it can stop early by observing [`DBOS.stepStatus.cancelSignal`](../reference/methods.md#dbosstepstatus), an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that fires when the workflow is cancelled.
Pass it to APIs that accept a signal (for example, `fetch`) to cancel the step's underlying operation:

```typescript
async function fetchData() {
  // fetch aborts if the workflow is cancelled while the request is in flight
  const response = await fetch("https://example.com", { signal: DBOS.stepStatus?.cancelSignal });
  return await response.text();
}
```

## Resuming Workflows

You can resume a workflow from its last completed step from the web UI, programmatically via [`DBOS.resumeWorkflow`](../reference/methods.md#dbosresumeworkflow), or through the command line with [`npx dbos workflow resume`](../reference/cli.md#npx-dbos-workflow-resume).

You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

## Forking Workflows

You can start a new execution of a workflow by **forking** it from a specific step.
When you fork a workflow, DBOS generates a new workflow with a new workflow ID, copies to that workflow the original workflow's inputs and all its steps up to the selected step, then begins executing the new workflow from the selected step.

Forking a workflow is useful for recovering from outages in downstream services (by forking from the step that failed after the outage is resolved) or for "patching" workflows that failed due to a bug in a previous application version (by forking from the bugged step to an application version on which the bug is fixed).

You can fork a workflow programmatically using [`DBOS.forkWorkflow`](../reference/methods.md#dbosforkworkflow).
You can also fork a workflow from a step from the web UI by clicking on that step in the workflow's trace timeline:

<img src={require('@site/static/img/workflow-management/workflow-fork.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Rewinding Workflows

You can re-execute a workflow from a specific step, keeping its workflow ID, by **rewinding** it.
When you rewind a workflow, DBOS discards the workflow's recorded steps from the selected step onward, clears its output, and re-enqueues it.
The workflow then re-executes from the selected step, replaying the recorded outputs of earlier steps.

Rewinding differs from [forking](#forking-workflows) in that the rewound workflow keeps its original workflow ID.
Other workflows and clients can keep sending messages to it and reading its events and streams, and its child workflows keep the same IDs.
Rewinding is useful when other code refers to a workflow by its ID, for example when the ID is an idempotency key derived from an order or request ID.

You can only rewind a workflow that is in a terminal state (for example, `SUCCESS`, `ERROR`, or `CANCELLED`); cancel a running workflow before rewinding it.
Like forking, you can rewind a workflow onto a new application version to "patch" a workflow that failed due to a bug.

You can rewind a workflow programmatically using [`DBOS.rewindWorkflow`](../reference/methods.md#dbosrewindworkflow):

```typescript
// Re-execute the workflow from step 3, keeping its workflow ID
const handle = await DBOS.rewindWorkflow(workflowID, { startStep: 3 });
const result = await handle.getResult();
```
