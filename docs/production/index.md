---
sidebar_position: 10
title: Deploying To Production
---

Once you've made your application durable with DBOS, there are two ways to take it into production:

## Self-Hosting

DBOS is a library.
You can import it in existing applications and keep deploying them on your infrastructure using your existing build, test, and deploy tools.

To simplify managing and recovering your durable workflows in production, we recommend connecting your production applications to DBOS Conductor.
Conductor is a managed service that helps you operate DBOS applications.
It provides:

- [**Distributed workflow recovery**](./self-hosting/workflow-recovery.md): In a distributed environment with many executors running durable workflows, Conductor automatically detects when the execution of a durable workflow is interrupted (for example, if its executor is restarted, interrupted, or crashes) and recovers the workflow to another healthy executor.
- [**Workflow and queue observability**](./self-hosting/workflow-management.md): Conductor provides dashboards of all active and past workflows and all queued tasks, including their status, inputs, outputs, and steps.
- [**Workflow and queue management**](./self-hosting/workflow-management.md): From the Conductor dashboard, cancel, resume, or restart any workflow execution and manage the tasks in your distributed queues.

Conductor is not part of your application's critical path, so it adds no significant runtime overhead.  If connectivity is lost, your applications continue running without disruption, and recovery, management, and observability resume automatically once connectivity is restored.

## DBOS Cloud

Any application built with DBOS can be deployed to DBOS Cloud.
DBOS Cloud is a serverless platform for durably executed applications.
It provides:

- [**Application hosting and autoscaling**](./dbos-cloud/application-management.md): Managed hosting of your application in the cloud, automatically scaling to millions of users. Applications are charged only for the CPU time they actually consume.
- [**Managed workflow recovery**](./dbos-cloud/application-management.md): If a cloud executor is interrupted, crashed, or restarted, each of its workflows is automatically recovered by another executor.
- [**Workflow and queue observability**](./dbos-cloud/workflow-management.md): Dashboards of all active and past workflows and all queued tasks, including their status, inputs, outputs, and steps.
- [**Workflow and queue management**](./dbos-cloud/workflow-management.md): From an online dashboard, cancel, resume, or restart any workflow execution and manage the tasks in your distributed queues.