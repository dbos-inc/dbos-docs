---
sidebar_position: 10
title: Workflow Management
---

:::info
Workflow observability and management features are only available for applications connected to [Conductor](./overview.md).
:::

## Viewing Workflows

Navigate to the workflows tab of your application's page on the DBOS Console to see a list of its workflows:

<img src={require('@site/static/img/workflow-management/workflow-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

This includes **all** your application's workflows: those currently executing, those enqueued for execution, those that have completed successfully, and those that have failed.
You can filter by time, workflow ID, workflow name, and workflow status (for example, you can search for all failed workflow executions in the past day).

Click on a workflow to see details, including its input and output:

<img src={require('@site/static/img/workflow-management/workflow-details.png').default} alt="Workflow List" width="800" className="custom-img"/>

Click "Show Workflow Steps" to view the workflow's execution as a trace timeline (showing the workflow, its steps, and its child workflows and their steps).
For example, here is the trace of a workflow that processes multiple tasks concurrently by enqueueing child workflows:

<img src={require('@site/static/img/workflow-management/workflow-steps.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Workflow Management

You can manage individual workflows directly from the DBOS Console.

#### Cancelling Workflows

You can cancel any workflow that has not completed: `PENDING`, `ENQUEUED`, `DELAYED`, or `SUSPENDED`.
Cancelling a workflow sets its status to `CANCELLED`.
If the workflow is currently executing, cancelling it preempts its execution (interrupting it at the beginning of its next step).
If the workflow is enqueued or delayed, cancelling it means it is never dequeued.
If the workflow is suspended, cancelling it means it never wakes.

#### Resuming Workflows

You can resume any `DELAYED`, `SUSPENDED`, `CANCELLED` or `MAX_RECOVERY_ATTEMPTS_EXCEEDED` workflow.
Resuming a workflow resumes its execution from its last completed step.

#### Forking Workflows

You can start a new execution of a workflow by **forking** it from a specific step.
To do this, open the workflow steps view, select a particular step, and click "Fork".

When you fork a workflow, DBOS generates a new workflow with a new workflow ID, copies to that workflow the original workflow's inputs and all its steps up to the selected step, then begins executing the new workflow from the selected step.

Forking a workflow is useful for recovering from outages in downstream services (by forking from the step that failed after the outage is resolved) or for "patching" workflows that failed due to a bug in a previous application version (by forking from the bugged step to an application version on which the bug is fixed).

#### Rewinding Workflows

You can re-execute a workflow from a specific step, keeping its workflow ID, by **rewinding** it.
To do this, click "Rewind" in the workflow's action menu, or select a step in the workflow steps view and click "Rewind" to re-execute from that step.
You can also choose an application version and queue to re-execute the workflow on.

When you rewind a workflow, DBOS discards the workflow's recorded steps from the selected step onward, clears its output, and re-enqueues it.
The workflow then re-executes from the selected step, replaying the recorded outputs of earlier steps.
Unlike forking, rewinding modifies the original workflow instead of creating a copy, so other code that refers to the workflow by its ID keeps working.
Rewinding can't be undone, and steps that re-execute repeat their side effects.

You can only rewind a workflow that has completed (`SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`); cancel a running workflow before rewinding it.
Rewinding requires DBOS Transact Python 3.1.0, TypeScript 5.1.0, or Go 1.5.0 or later.
For more on rewinding, see Workflow Management for [Python](../python/tutorials/workflow-management.md#rewinding-workflows), [TypeScript](../typescript/tutorials/workflow-management.md#rewinding-workflows), or [Go](../golang/tutorials/workflow-management.md#rewinding-workflows).

## Exporting Workflows

You can export a workflow from one application to another by clicking the "Export" button in the workflow details panel.
This copies all information on that workflow (and optionally its children) to the other application's system database.
This is most useful for copying workflows from a production to development environment, for example to examine and (using fork) reproduce a bug that originally occurred in production.

<img src={require('@site/static/img/workflow-management/export-workflow.png').default} alt="Workflow List" width="800" className="custom-img"/>
