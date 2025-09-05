---
sidebar_position: 50
title: Workflow Management
---

You can view and manage your durable workflow executions via a web UI ([self-hosted](../../production/self-hosting/workflow-management.md), [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)) or programmatically.

## Listing Workflows

You can list your application's workflows programmatically via [`ListWorkflows`](../reference/methods.md#listworkflows).

You can also view a searchable and expandable list of your application's workflows from its page on the DBOS Console (either [self-hosted](../../production/self-hosting/workflow-management.md) or on [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)).

<img src={require('@site/static/img/workflow-management/workflow-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Visualizing Workflow Execution

You can also visualize a workflow's execution graph (including the workflow, its steps, and its child workflows and their steps) from its page on the DBOS Console (either [self-hosted](../../production/self-hosting/workflow-management.md) or on [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)).
For example, here is the graph of a workflow that processes multiple tasks concurrently by enqueueing child workflows:

<img src={require('@site/static/img/workflow-management/workflow-steps.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Cancelling Workflows

You can cancel the execution of a workflow from the web UI or programmatically via [`CancelWorkflow`](../reference/methods.md#cancelworkflow).

If the workflow is currently executing, cancelling it preempts its execution (interrupting it at the beginning of its next step).
If the workflow is enqueued, cancelling removes it from the queue.

## Resuming Workflows

You can resume a workflow from its last completed step from the web UI or programmatically via [`ResumeWorkflow`](../reference/methods.md#resumeworkflow).

You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

## Forking Workflows

You can start a new execution of a workflow by **forking** it from a specific step.
When you fork a workflow, DBOS generates a new workflow with a new workflow ID, copies to that workflow the original workflow's inputs and all its steps up to the selected step, then begins executing the new workflow from the selected step.

Forking a workflow is useful for recovering from outages in downstream services (by forking from the step that failed after the outage is resolved) or for "patching" workflows that failed due to a bug in a previous application version (by forking from the bugged step to an appliation version on which the bug is fixed).

You can fork a workflow programmatically using [`ForkWorkflow`](../reference/methods.md#forkworkflow).
You can also fork a workflow from a step from the web UI by clicking on that step in the workflow's graph visualization:

<img src={require('@site/static/img/workflow-management/workflow-fork.png').default} alt="Workflow List" width="800" className="custom-img"/>