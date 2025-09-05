---
sidebar_position: 60
title: Workflow Management
---

You can view and manage your durable workflow executions via a web UI ([self-hosted](../../production/self-hosting/workflow-management.md), [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)), programmatically, or via command line.

## Listing Workflows

You can list your application's workflows programmatically via [`DBOS.list_workflows`](../reference/contexts.md#list_workflows) or from the command line with [`dbos workflow list`](../reference/cli.md#dbos-workflow-list).

You can also view a searchable and expandable list of your application's workflows from its page on the DBOS Console (either [self-hosted](../../production/self-hosting/workflow-management.md) or on [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)).

<img src={require('@site/static/img/workflow-management/workflow-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Listing Workflow Steps

You can list the steps of a workflow programmatically via [`DBOS.list_workflow_steps`](../reference/contexts.md#list_workflow_steps) or from the command line with [`dbos workflow steps`](../reference/cli.md#dbos-workflow-steps).

You can also visualize a workflow's execution graph (including the workflow, its steps, and its child workflows and their steps) from its page on the DBOS Console (either [self-hosted](../../production/self-hosting/workflow-management.md) or on [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)).
For example, here is the graph of a workflow that processes multiple tasks concurrently by enqueueing child workflows:

<img src={require('@site/static/img/workflow-management/workflow-steps.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Listing Enqueued Workflows

You can list all **currently enqueued** workflows and steps of your application via [`DBOS.list_queued_workflows`](../reference/contexts.md#list_queued_workflows) or from the command line with [`dbos workflow queue list`](../reference/cli.md#dbos-workflow-queue-list).

You can also view a searchable and expandable list of your application's currently enqueued workflows and steps from its page on the DBOS Console (either [self-hosted](../../production/self-hosting/workflow-management.md) or on [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)).

<img src={require('@site/static/img/workflow-management/queue-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Cancelling Workflows

You can cancel the execution of a workflow from the web UI, programmatically via [`DBOS.cancel_workflow`](../reference/contexts.md#cancel_workflow), or through the command line with [`dbos workflow cancel`](../reference/cli.md#dbos-workflow-cancel).

If the workflow is currently executing, cancelling it preempts its execution (interrupting it at the beginning of its next step).
If the workflow is enqueued, cancelling removes it from the queue.

## Resuming Workflows

You can resume a workflow from its last completed step from the web UI, programmatically via [`DBOS.resume_workflow`](../reference/contexts.md#resume_workflow), or through the command line with [`dbos workflow resume`](../reference/cli.md#dbos-workflow-resume).

You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

## Forking Workflows

You can start a new execution of a workflow by **forking** it from a specific step.
When you fork a workflow, DBOS generates a new workflow with a new workflow ID, copies to that workflow the original workflow's inputs and all its steps up to the selected step, then begins executing the new workflow from the selected step.

Forking a workflow is useful for recovering from outages in downstream services (by forking from the step that failed after the outage is resolved) or for "patching" workflows that failed due to a bug in a previous application version (by forking from the bugged step to an appliation version on which the bug is fixed).

You can fork a workflow programmatically using [`DBOS.fork_workflow`](../reference/contexts.md#fork_workflow).
You can also fork a workflow from a step from the web UI by clicking on that step in the workflow's graph visualization:

<img src={require('@site/static/img/workflow-management/workflow-fork.png').default} alt="Workflow List" width="800" className="custom-img"/>