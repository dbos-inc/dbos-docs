---
sidebar_position: 20
title: Comparing DBOS and Temporal
---

DBOS and Temporal both provide durable workflows.
The main difference is that DBOS is a lightweight Postgres-backed library, while Temporal is an external orchestration service.
In our opinion, this architecture makes DBOS radically simpler to adopt and operate.

To add DBOS to an application, you install the open-source library and annotate workflows and steps.
The library checkpoints workflows to your database and recovers workflows from failures.
Because DBOS is just a library, you don't need to change how your application is architected or deployed&mdash;it can run on any infrastructure connected to any Postgres-compatible database.

<img src={require('@site/static/img/architecture/dbos-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

By contrast, Temporal is designed around a central workflow server that orchestrates workflow execution on a cluster of workers.
The central server runs workflow code, dispatching steps to workers.
Workers execute steps, then return their output to the orchestrator, which durably checkpoints it then dispatches the next step.
Application code can't call workflows directly, but instead sends requests to the workflows server to start workflows and fetch their results.

Because of this design, adding Temporal to an application requires rearchitecting it.
First, you must move all workflow and step code from application servers to Temporal workers.
Then, you must also rewrite all interaction between your application and its workflows to go through the orchestration server and its client APIs.
Next, you must build infrastructure to operate and scale the worker servers.
Finally, you must operate and scale the orchestration server and its underlying Cassandra data store.

<img src={require('@site/static/img/architecture/external-architecture.png').default} alt="External Orchestrator Architecture" width="750" className="custom-img"/>