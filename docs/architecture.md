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