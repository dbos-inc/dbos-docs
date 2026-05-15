---
sidebar_position: 20
title: Comparing DBOS and Temporal
hide_table_of_contents: false
---

DBOS and Temporal both provide durable workflows.
The main difference is that Temporal implements durable workflows in a heavyweight orchestration service, whereas DBOS implements them in a Postgres-backed library.
In our opinion, the DBOS architecture is simpler to adopt and operate.

:::info
To learn how to migrate an application from Temporal to DBOS, see the [migration guide](./migrating-from-temporal.md).
:::

## Simpler Architecture

Temporal is designed around a central workflow server that orchestrates workflow execution on a cluster of workers.
The central server runs workflow code, dispatching steps to workers.
Workers execute steps, then return their output to the orchestrator, which durably checkpoints it then dispatches the next step.

Because of this design, adding Temporal to an application requires rearchitecting it.
First, you must move all your workflow and activity (step) code to run on a cluster of Temporal workers.
You must also rewrite all interactions between your application and its workflows to go through the orchestration server and its client APIs.
Then, you must manage and scale both the Temporal server and the datastores it relies on (most commonly Cassandra for durability and Elasticsearch for observability).
The Temporal server and its data stores are on the critical path for workflow execution and are single points of failure for your system; if they have downtime your application becomes unavailable.

<img src={require('@site/static/img/architecture/temporal-architecture.png').default} alt="External Orchestrator Architecture" width="750" className="custom-img"/>

By contrast, DBOS is an open-source Postgres-backed library.
To add DBOS to an application, you install the open-source library and annotate workflows and steps.
The library uses Postgres to checkpoint workflow progress and recover workflows from failure.
Because DBOS uses Postgres for orchestration, you don't need to change how your application is architected or deployed&mdash;it can run on any infrastructure connected to any Postgres-compatible database.
You scale DBOS by scaling Postgres, and Postgres [scales well](https://www.dbos.dev/blog/benchmarking-workflow-execution-scalability-on-postgres).

<img src={require('@site/static/img/architecture/dbos-comparison-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

## Advantages of DBOS

### Improved Operational Reliability

The only point of failure in DBOS is Postgres.
If your organization already uses Postgres, DBOS does not add any new infrastructural dependencies or points of failure to your application's architecture.

By contrast, the Temporal architecture adds multiple new points of failure: the Temporal orchestration server and the datastores it relies on (most commonly Cassandra for durability and Elasticsearch for observability).
Your team is responsible for operating them, and if they have downtime, your application becomes unavailable.

### >10x Better Latency

In DBOS, the only overhead required to call a step is checkpointing its output.
This requires a single Postgres write, which typically takes 1-2ms. 
In Temporal, a step requires an async dispatch from the central server, which takes [tens to hundreds of ms](https://temporal.io/blog/reduce-latency-and-speed-up-your-temporal-workflows).
Thus, DBOS is preferred for interactive or otherwise latency-sensitive workflows.

### Privacy-Preserving Architecture

Because DBOS stores workflow data in your Postgres database, it is intrinsically privacy-preserving: you own your data, you store it in your Postgres, and it is never stored or sent anywhere else.
By contrast, to use Temporal, you must send potentially sensitive data (including workflow and step checkpoints) to the Temporal server for storage.

### Rich Workflow Introspection and Management

Because DBOS is built on Postgres, it provides rich SQL-backed workflow introspection and management.
You can search workflows by name, time, queue, version, or custom properties, introspect individual steps, and pause, cancel, or resume workflows.
All these capabilities are available both programmatically and through a web UI.

One particularly powerful and unique feature is **fork**: you can restart a workflow from a specific step, either programmatically or from the UI.
This is useful for recovering from an unexpected failure in a step, such as a failure due to a bug or an outage.
For example, if a large number of billing workflows fail overnight due to an outage in a payment API, you can use fork to restart them all from the payment step after the outage is resolved.

### Durable Workflow Queues

DBOS provides durable workflow queues with managed flow control.
Using queues, you can manage how many workflows can execute concurrently (globally, per-worker, and per-tenant) as well as which workers can execute which workflows.
Temporal does not have comparable queueing or flow control abstractions, making it harder to control when and where workflows execute.
Learn more about DBOS queues in the queues tutorial ([Python](../python/tutorials/queue-tutorial.md), [TypeScript](../typescript/tutorials/queue-tutorial.md), [Go](../golang/tutorials/queue-tutorial.md), [Java](../java/tutorials/queue-tutorial.md)).