---
sidebar_position: 20
title: Comparing DBOS and Temporal
hide_table_of_contents: true
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
[This blog post](https://www.dbos.dev/blog/durable-execution-coding-comparison) empirically benchmarks the comparison, showing how adding DBOS to an example data pipeline application requires changing &lt;10 lines of code, while adding Temporal requires a complete rewrite.

<img src={require('@site/static/img/architecture/temporal-architecture.png').default} alt="External Orchestrator Architecture" width="750" className="custom-img"/>

Beyond ease of adoption and operation, the DBOS architecture has a number of other advantages:

#### >10x Better Latency

In DBOS, the only overhead required to call a step is checkpointing its output.
This requires a single Postgres write, which typically takes 1-2ms. 
In Temporal, a step requires an async dispatch from the central server, which takes [tens to hundreds of ms](https://temporal.io/blog/reduce-latency-and-speed-up-your-temporal-workflows).
Thus, DBOS is strongly preferred for interactive or otherwise latency-sensitive workflows.

#### Rich Workflow Introspection and Management

Because DBOS is built on Postgres, it provides rich SQL-backed workflow introspection and management.
You can search workflows by name, time, queue, version, or custom properties, introspect individual steps, and pause, cancel, or resume workflows.
All these capabilities are available both programmatically and through a web UI.

One particularly powerful and unique feature is **fork**: you can restart a workflow from a specific step, either programmatically or from the UI.
This is useful for recovering from an unexpected failure in a step, such as a failure due to a bug or an outage.
For example, if a large number of billing workflows failed overnight due to an outage in a payment API, you can use fork to restart them all from the payment step after the outage is resolved.

#### Improved Operational Reliability

#### Privacy-Preserving Architecture