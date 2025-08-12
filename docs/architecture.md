---
hide_table_of_contents: false
hide_title: false
title: DBOS Architecture
---

DBOS provides a lightweight library for durable workflows built on top of Postgres.
Architecturally, an application built with DBOS looks like this:

<img src={require('@site/static/img/architecture/dbos-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

You install the DBOS library into your existing application running on your existing servers and infrastructure and connect it to a Postgres database.
Then, you annotate workflows and steps in your application code.
The DBOS library **checkpoints** those workflows and steps in Postgres.
If your program fails, crashes, or is interrupted, DBOS uses those checkpoints to automatically recover your workflows from the last completed step.

<img src={require('@site/static/img/architecture/dbos-steps.jpg').default} alt="DBOS Architecture" width="750" className="custom-img"/>

## Comparison to External Workflow Orchestrators

The DBOS architecture is radically simpler than he architecture of other workflow systems such as Temporal, Airflow or AWS Step Functions.
These systems implement workflows via **external orchestration**.
At a high-level, their architectures look like this:

<img src={require('@site/static/img/architecture/external-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

Externally orchestrated systems are made up of an orchestrator and a bunch of workers. The orchestrator runs workflow code, dispatching steps to workers through queues.
Workers execute steps, then return their output to the orchestrator.
The orchestrator persists that output to a data store, then dispatches the next step.
Typically, the orchestrator and workers run on separate servers and communicate via message-passing.
Application code can't call workflows directly, but instead sends requests to the orchestrator server to start workflows and fetch their results.

While DBOS can be installed into an existing application as a library, adding an external orchestrator to an application requires substantially rearchitecting it.
First, you must move all workflow and step code from application servers to workers.
You must also rewrite all interaction between your application and its workflows to go through the orchestration server and its client APIs.
Then, you must build infrastructure to operate and scale the worker servers.
Finally, you must operate the orchestration server itself and its underlying data store (for example, Cassandra for Temporal), which are both single points of failure for your application.

<img src={require('@site/static/img/architecture/dbos-conductor-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

## How Workflow Recovery Works

To recover workflows from failures, DBOS checkpoints in Postgres the input of each workflow and the output of each step.
When a program executing a workflow fails, crashes, or is interrupted, DBOS uses those checkpoints to recover the workflow from its last completed step.
Here's how that works:

1. First, DBOS must detect that workflow execution has failed.
For a single-node application, this is easy: on startup, DBOS looks up and attempts to recover all incomplete (`PENDING`) workflows.
In a distributed setting, detecting failed workflow execution can be done automatically through tools like [DBOS Conductor](./production/self-hosting/conductor.md) or manually using the admin API (more documentation [here](./production/self-hosting/workflow-recovery.md)).

2. Next, DBOS restarts the interrupted workflow from the beginning by calling it with its checkpointed inputs.
As the workflow re-executes, it checks before executing each step if that step's output is checkpointed in Postgres.
If there is a checkpoint, the step returns the checkpointed output instead of executing.

3. Eventually, the recovered workflow reaches a step whose output is **not** checkpointed in Postgres.
It then executes that step normally and proceeds from there, thus **resuming from the last completed step.**

For DBOS to be able to safely recover a workflow, it must satisfy two requirements:

1. The workflow function must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order. If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you should do it in a step instead of directly in the workflow function.

2. Steps should be **idempotent**, meaning it should be safe to retry them multiple times.
If a workflow fails while executing a step, it will retry the step during recovery.
However, once a step completes and is checkpointed, it is never re-executed.