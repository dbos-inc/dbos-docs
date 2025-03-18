---
sidebar_position: 30
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

## Workflow Management

You can manage individual workflows directly from the DBOS console.

#### Cancelling Workflows

You can cancel any `PENDING` or `ENQUEUED` workflow.
Cancelling a workflow sets is status to `CANCELLED`.
If the workflow is currently executing, cancelling it preempts its execution (interrupting it at the beginning of its next step).
If the workflow is enqueued, cancelling removes it from the queue.

#### Resuming Workflows

You can resume any `ENQUEUED`, `PENDING`, `CANCELLED` or `RETRIES_EXCEEDED` workflow.
Resuming a workflow sets its status to `PENDING` and resumes its execution from its last completed step.
If the workflow is enqueued, this bypasses the queue to start it immediately.

#### Restarting Workflows

You can restart any `SUCCESS` or `ERROR` workflow.
Restarting a workflow restarts it from the beginning, creating a new workflow with the same inputs as the original.
