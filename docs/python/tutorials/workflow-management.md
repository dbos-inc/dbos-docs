---
sidebar_position: 5
title: Workflow & Queue Management
---

You can view and manage your durable workflow executions via a web UI ([self-hosted](../../production/self-hosting/workflow-management.md), [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)), programmatically, or via command line.

## Listing Workflows

You can list your application's workflows programmatically via [`DBOS.list_workflows`](../reference/contexts.md#list_workflows) or from the command line with [`dbos workflow list`](../reference/cli.md#dbos-workflow-list).

You can also view a searchable and expandable list of your application's workflows from its page on the DBOS Console (either [self-hosted](../../production/self-hosting/workflow-management.md) or on [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)).

<img src={require('@site/static/img/workflow-management/workflow-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Listing Enqueued Workflows

You can list all **currently enqueued** workflows and steps of your application via [`DBOS.list_queued_workflows`](../reference/contexts.md#list_queued_workflows) or from the command line with [`dbos workflow queue list`](../reference/cli.md#dbos-workflow-queue-list).

You can also view a searchable and expandable list of your application's currently enqueued workflows and steps from its page on the DBOS Console (either [self-hosted](../../production/self-hosting/workflow-management.md) or on [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)).

<img src={require('@site/static/img/workflow-management/queue-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

## Cancelling Workflows

You can cancel the execution of a workflow from the web UI, programmatically via [`DBOS.cancel_workflow`](../reference/contexts.md#cancel_workflow), or through the command line with [`dbos workflow cancel`](../reference/cli.md#dbos-workflow-cancel).

If the workflow is currently executing, cancelling it preempts its execution (interrupting it at the beginning of its next step).
If the workflow is enqueued, cancelling removes it from the queue.

## Resuming Workflows

You can resume a workflow from its last copmleted step from the web UI, programmatically via [`DBOS.resume_workflow`](../reference/contexts.md#resume_workflow), or through the command line with [`dbos workflow resume`](../reference/cli.md#dbos-workflow-resume).

You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

## Restarting Workflows

You can start a new execution of a workflow from the web UI, programmatically via [`DBOS.restart_workflow`](../reference/contexts.md#restart_workflow), or through the command line with [`dbos workflow restart`](../reference/cli.md#dbos-workflow-restart).

The new workflow has the same inputs as the original, but a new workflow ID.