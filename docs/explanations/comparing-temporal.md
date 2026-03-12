---
sidebar_position: 20
title: Comparing DBOS and Temporal
hide_table_of_contents: false
---

DBOS and Temporal both provide durable workflows.
The main difference is that DBOS is a lightweight Postgres-backed library, while Temporal is an external orchestration service.
In our opinion, this architecture makes DBOS simpler to adopt and operate.

### Simpler Architecture

To add DBOS to an application, you install the open-source library and annotate workflows and steps.
The library checkpoints workflows to your database and recovers workflows from failures.
Because DBOS is just a library, you don't need to change how your application is architected or deployed&mdash;it can run on any infrastructure connected to any Postgres-compatible database.

<img src={require('@site/static/img/architecture/dbos-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

By contrast, Temporal is designed around a central workflow server that orchestrates workflow execution on a cluster of workers.
The central server runs workflow code, dispatching steps to workers.
Workers execute steps, then return their output to the orchestrator, which durably checkpoints it then dispatches the next step.

Because of this design, adding Temporal to an application requires rearchitecting it.
First, you build infrastructure to operate and scale a cluster of Temporal workers, on which you must run all your workflow and activity (step) code.
Then, you must also rewrite all interactions between your application and its workflows to go through the orchestration server and its client APIs.
Finally, you must operate and scale the orchestration server and its underlying Cassandra data store (Temporal supports other backends, but Cassandra is strongly recommended in production).

<img src={require('@site/static/img/architecture/temporal-architecture.png').default} alt="External Orchestrator Architecture" width="750" className="custom-img"/>

Beyond ease of adoption and operation, the DBOS architecture has a number of other advantages:

### >10x Better Latency

In DBOS, the only overhead required to call a step is checkpointing its output.
This requires a single Postgres write, which typically takes 1-2ms. 
In Temporal, a step requires an async dispatch from the central server, which takes [tens to hundreds of ms](https://temporal.io/blog/reduce-latency-and-speed-up-your-temporal-workflows).
Thus, DBOS is preferred for interactive or otherwise latency-sensitive workflows.

### Rich Workflow Introspection and Management

Because DBOS is built on Postgres, it provides rich SQL-backed workflow introspection and management.
You can search workflows by name, time, queue, version, or custom properties, introspect individual steps, and pause, cancel, or resume workflows.
All these capabilities are available both programmatically and through a web UI.

One particularly powerful and unique feature is **fork**: you can restart a workflow from a specific step, either programmatically or from the UI.
This is useful for recovering from an unexpected failure in a step, such as a failure due to a bug or an outage.
For example, if a large number of billing workflows failed overnight due to an outage in a payment API, you can use fork to restart them all from the payment step after the outage is resolved.

### Improved Operational Reliability

Because DBOS is just a library, its only point of failure is Postgres.
If your organization already uses Postgres, DBOS does not add any new infrastructural dependencies or points of failure to your application's architecture.

By contrast, the Temporal architecture adds two new two points of failure: the Temporal server and its Cassandra data store.
Your team is responsible for operating both, and if either has downtime, your application becomes unavailable.

### Privacy-Preserving Architecture

Because DBOS is just an open-source library and can store data in any Postgres database, it is intrinsically privacy-preserving&mdash;you own your data, you store it in your Postgres, and it is never stored or sent anywhere else. By contrast, to use Temporal, you must send potentially sensitive data (including workflow and step checkpoints) to the Temporal server for storage.

### Durable Workflow Queues

DBOS provides durable workflow queues with managed flow control.
Using queues, you can manage how many workflows can execute concurrently (globally, per-worker, and per-tenant) as well as which workers can execute which workflows.
Temporal does not have comparable queueing or flow control abstractions, making it harder to control when and where workflows execute.
Learn more about DBOS queues in the queues tutorial ([Python](../python/tutorials/queue-tutorial.md), [TypeScript](../typescript/tutorials/queue-tutorial.md), [Go](../golang/tutorials/queue-tutorial.md), [Java](../java/tutorials/queue-tutorial.md)).