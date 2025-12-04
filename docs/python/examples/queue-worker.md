---
displayed_sidebar: examplesSidebar
sidebar_position: 35
title: Queue Worker
---

This example demonstrates how to build DBOS workflows in their own "queue worker" service and enqueue and manage them from other services.
This design pattern lets you separate concerns and separately scale the workers that execute your durable workflows from your other services.

Architecturally, this example contains two services: a web server and a worker service.
The web server uses the [DBOS Client](../reference/client.md) to enqueue workflows and monitor their status.
The worker service dequeues and executes workflows.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/queue-worker).

<img src={require('@site/static/img/queue-worker/queue-worker.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

## Web Server

## Worker Service

## Try it Yourself!

Clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/queue-worker
```

Then follow the instructions in the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/queue-worker) to run the app.
