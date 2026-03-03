---
sidebar_position: 20
title: Workflow Management
---

:::info
Workflow observability and management features are only available for applications connected to [Conductor](./conductor.md).
:::

## Viewing Workflows

Navigate to the workflows tab of your application's page on the DBOS Console to see a list of its workflows:

<img src={require('@site/static/img/workflow-management/workflow-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

This includes **all** your application's workflows: those currently executing, those enqueued for execution, those that have completed successfully, and those that have failed.
You can filter by time, workflow ID, workflow name, and workflow status (for example, you can search for all failed workflow executions in the past day).

Click on a workflow to see details, including its input and output:

<img src={require('@site/static/img/workflow-management/workflow-details.png').default} alt="Workflow List" width="800" className="custom-img"/>

Click "Show Workflow Steps" to view the workflow's execution graph (including the workflow, its steps, and its child workflows and their steps).
For example, here is the graph of a workflow that processes multiple tasks concurrently by enqueueing child workflows:

<img src={require('@site/static/img/workflow-management/workflow-steps.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Viewing Queues

Navigate to the queues tab of your application's page to see all **currently enqueued** workflows.
This page only shows workflows that are currently executing on a queue (`PENDING` status) or are enqueued for execution (`ENQUEUED` status).
By default, the oldest (first enqueued) workflows are shown first.
You can click on workflows to expand them and see their steps, just as in the workflows page.

<img src={require('@site/static/img/workflow-management/queue-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Workflow Management

You can manage individual workflows directly from the DBOS console.

#### Cancelling Workflows

You can cancel any `PENDING` or `ENQUEUED` workflow.
Cancelling a workflow sets is status to `CANCELLED`.
If the workflow is currently executing, cancelling it preempts its execution (interrupting it at the beginning of its next step).
If the workflow is enqueued, cancelling removes it from the queue.

#### Resuming Workflows

You can resume any `ENQUEUED`, `CANCELLED` or `MAX_RECOVERY_ATTEMPTS_EXCEEDED` workflow.
Resuming a workflow resumes its execution from its last completed step.
If the workflow is enqueued, this bypasses the queue to start it immediately.

#### Forking Workflows

You can start a new execution of a workflow by **forking** it from a specific step.
To do this, open the workflow steps view, select a particular step, and click "Fork".

When you fork a workflow, DBOS generates a new workflow with a new workflow ID, copies to that workflow the original workflow's inputs and all its steps up to the selected step, then begins executing the new workflow from the selected step.

Forking a workflow is useful for recovering from outages in downstream services (by forking from the step that failed after the outage is resolved) or for "patching" workflows that failed due to a bug in a previous application version (by forking from the bugged step to an appliation version on which the bug is fixed).