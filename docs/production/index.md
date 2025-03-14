---
sidebar_position: 10
title: Deploying To Production
---

Once you've made your application durable with DBOS, there are two ways to take it into production:

## Self Hosting

If you're adding DBOS to an existing application, the easiest way to take it into production is to self-host it: deploy it on your infrastructure using your existing build, test, and deploy tools.
DBOS can run anywhere as long as it has a Postgres database to connect to.

To simplify managing and recovering your durable workflows in production, we recommend connecting your self-hosted application to DBOS Conductor.
Conductor is a managed service for operating DBOS applications.
It provides:

- [**Distributed workflow recovery**](./self-hosting/workflow-recovery.md): If one of the servers hosting your DBOS application becomes unhealthy (for example, it is restarted, interrupted, or crashes), Conductor automatically recovers each of its workflows on exactly one healthy server.
- [**Workflow and queue observability**](./self-hosting/workflow-management.md): Dashboards of all active and past workflows and all queued tasks, including their status, inputs, outputs, and steps.
- [**Workflow and queue management**](./self-hosting/workflow-management.md): From an online dashboard, cancel, resume, or restart any workflow execution and manage the tasks in your distributed queues.

Conductor runs totally out-of-band, so if your connection to it is interrupted your applications will continue operating normally.

## DBOS Cloud

Any application built with DBOS can be deployed for free to DBOS Cloud.
DBOS Cloud is a serverless platform for durably executed applications.
It provides:

- [**Application hosting and autoscaling**](./dbos-cloud/application-management.md): Managed hosting of your application in the cloud, automatically scaling to millions of users. Applications are charged only for the CPU time they actually consume.
- [**Managed workflow recovery**](./dbos-cloud/application-management.md): If a cloud executor is interrupted, crashed, or restarted, each of its workflows is automatically recovered by another executor.
- **Workflow and queue observability**: Dashboards of all active and past workflows and all queued tasks, including their status, inputs, outputs, and steps.
- **Workflow and queue management**: From an online dashboard, cancel, resume, or restart any workflow execution and manage the tasks in your distributed queues.