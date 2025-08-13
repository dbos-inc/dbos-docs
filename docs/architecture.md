---
hide_table_of_contents: false
title: DBOS Architecture
---

## DBOS Architecture

DBOS provides a lightweight library for durable workflows built on top of Postgres.
Architecturally, an application built with DBOS looks like this:

<img src={require('@site/static/img/architecture/dbos-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

You install the DBOS library into your existing application running on your existing servers and infrastructure and connect it to a Postgres database.
Then, you annotate workflows and steps in your application code.
The DBOS library **checkpoints** those workflows and steps in Postgres.
If your program fails, crashes, or is interrupted, DBOS uses those checkpoints to automatically recover your workflows from the last completed step.

<img src={require('@site/static/img/architecture/dbos-steps.jpg').default} alt="DBOS Steps" width="750" className="custom-img"/>

## Comparison to External Workflow Orchestrators

DBOS architecture is radically simpler than other workflow systems such as Temporal, Airflow or AWS Step Functions.
All these systems implement workflows via **external orchestration**.
At a high-level, their architectures look like this:

<img src={require('@site/static/img/architecture/external-architecture.png').default} alt="External Orchestrator Architecture" width="750" className="custom-img"/>

Externally orchestrated systems are made up of an orchestrator and a bunch of workers. The orchestrator runs workflow code, dispatching steps to workers through queues.
Workers execute steps, then return their output to the orchestrator, which persists that output to a data store then dispatches the next step.
Application code can't call workflows directly, but instead sends requests to the orchestrator server to start workflows and fetch their results.

While DBOS can be installed into an existing application as a library, adding an external orchestrator to an application requires substantially rearchitecting it.
First, you must move all workflow and step code from application servers to workers.
Then, you must also rewrite all interaction between your application and its workflows to go through the orchestration server and its client APIs.
Next, you must build infrastructure to operate and scale the worker servers.
Finally, you must operate and scale the orchestration server and its underlying data store (for example, Cassandra for Temporal), which are both single points of failure for your application.

## Applications and Databases

Each DBOS application server connects to a Postgres database, called the system database.
This database stores durably stores workflow and step checkpoints, and queue and message state.
Its schema and tables are documented [here](./explanations/system-tables.md).
One physical Postgres server can host multiple logical system databases for several DBOS applications.
However, separate applications (meaning separate code bases) should not share a system database.

For example, in this diagram we deploy two DBOS applications, each with three servers.
Each application has its own isolated system database on the same physical Postgres server, and all of the application's servers connect to that system database.

<img src={require('@site/static/img/architecture/dbos-system-database.png').default} alt="DBOS System Database" width="750" className="custom-img"/>

## How Workflow Recovery Works

To recover workflows from failures, DBOS checkpoints in its system database the input of each workflow and the output of each step.
When a program executing a workflow fails, crashes, or is interrupted, DBOS uses those checkpoints to recover the workflow from its last completed step.
Here's how that works:

1. First, DBOS must detect that workflow execution has failed.
For a single-node application, this is easy: on startup, DBOS looks up and attempts to recover all incomplete (`PENDING`) workflows.
In a distributed setting, detecting failed workflow execution can be done automatically through services like [DBOS Conductor](#operating-dbos-in-production-with-conductor) or manually using the admin API (more documentation [here](./production/self-hosting/workflow-recovery.md)).

2. Next, DBOS restarts the interrupted workflow from the beginning by calling it with its checkpointed inputs.
As the workflow re-executes, it checks before executing each step if that step's output is checkpointed in Postgres.
If there is a checkpoint, the step returns the checkpointed output instead of executing.

3. Eventually, the recovered workflow reaches a step whose output is **not** checkpointed in Postgres.
It then executes that step normally and proceeds from there, thus **resuming from the last completed step.**

For DBOS to be able to safely recover a workflow, your code must satisfy two requirements:

1. The workflow function must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order. If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you should do it in a step instead of directly in the workflow function.

2. Steps should be **idempotent**, meaning it should be safe to retry them multiple times.
If a workflow fails while executing a step, it will retry the step during recovery.
However, once a step completes and is checkpointed, it is never re-executed.

## Application and Workflow Versions

Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the source code of its workflows (this can be overridden through configuration).
All workflows are tagged with the application version on which they started.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
To safely recover workflows started on an older version of your code, you should start a process running that code version.
Alternatively, you can use the [workflow fork](./production/self-hosting/workflow-management.md#forking-workflows) operation to restart a workflow from a specific step on a specific code version.
For more information, see the [workflow recovery documentation](./production/self-hosting/workflow-recovery.md).

## Durable Queues

One powerful feature of DBOS is that you can **enqueue** workflows for later execution.
You can enqueue a workflow from within a DBOS app directly or from anywhere using a DBOS client.

When you enqueue a workflow, it may be executed on any of your application's servers.
All DBOS applications periodically poll their queues to find and execute new work.
This is in contrast to other workflow and queue services that have separate "worker servers" that can execute queued tasks&mdash;in DBOS, all of your application servers act as queue workers, as in this diagram:

<img src={require('@site/static/img/architecture/dbos-queues.png').default} alt="DBOS Conductor Architecture" width="750" className="custom-img"/>

To help you operate at scale, DBOS queues provide **flow control**.
You can customize the rate and concurrency at which workflows are dequeued and executed.
For example, you can set a **worker concurrency** for each of your queues on each of your servers, limiting how many workflows of that queue may execute concurrently on that server.
For more information on queues, see the docs ([Python](./python/tutorials/queue-tutorial.md), [TypeScript](./typescript/tutorials/queue-tutorial.md)).

## Operating DBOS in Production with Conductor

The simplest way to operate DBOS durable workflows in production is to connect your application to DBOS Conductor.
DBOS Conductor is an optional management service that helps you operate DBOS applications.
It provides:

- [**Distributed workflow recovery**](./production/self-hosting//workflow-recovery.md): In a distributed environment with many executors running durable workflows, Conductor automatically detects when the execution of a durable workflow is interrupted (for example, if its executor is restarted, interrupted, or crashes) and recovers the workflow to another healthy executor.
- [**Workflow and queue observability**](./production/self-hosting/workflow-management.md): Conductor provides dashboards of all active and past workflows and all queued tasks, including their status, inputs, outputs, and steps.
- [**Workflow and queue management**](./production/self-hosting/workflow-management.md): From the Conductor dashboard, cancel, resume, or restart any workflow execution and manage the tasks in your distributed queues.

Architecturally, Conductor looks like this:

<img src={require('@site/static/img/architecture/dbos-conductor-architecture.png').default} alt="DBOS Conductor Architecture" width="750" className="custom-img"/>

Each of your application servers opens a secure websocket connection to Conductor.
All of Conductor's features are powered by these websocket connections.
When you open a Conductor dashboard in your browser, your request is sent over websocket to one of your application servers, which serves the request (for example, retrieving a list of recent workflows) and sends the result back through the websocket.
If one of your application servers fails, Conductor detects the failure through the closed websocket connection and, after a grace period, directs another server to recover its workflows.
This architecture has two useful implications:

1. Conductor is **secure** and **privacy-preserving**. It does not have access to your database, nor does it need direct access to your application servers. Instead, your servers open outbound websocket connections to it and communicate exclusively through its websocket protocol.
2. Conductor is **out-of-band**. Conductor is **only** used for observability and recovery and is never in the critical path of workflow execution (unlike the external orchestrators of other workflow systems).
If your application's connection to Conductor is interrupted, it will continue to operate normally, and any failed workflows will automatically be recovered as soon as the connection is restored.