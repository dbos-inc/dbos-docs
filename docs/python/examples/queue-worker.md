---
displayed_sidebar: examplesSidebar
sidebar_position: 35
title: Queue Worker
---

This app demonstrates how to build DBOS workflows in their own "queue worker" service and enqueue and manage them from other services.
This design pattern lets you separate concerns and separately scale the workers that execute your durable workflows from your other services.

Architecturally, this app contains two services: a web server and a worker service.
The web server uses the [DBOS Client](../reference/client.md) to enqueue workflows and monitor their status.
The worker service dequeues and executes workflows.

<img src={require('@site/static/img/queue-worker/queue-worker.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>