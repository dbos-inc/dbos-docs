---
hide_table_of_contents: false
title: DBOS Architecture
---

DBOS provides a lightweight library for durable workflows built on top of Postgres.

You use DBOS by installing the open-source library into your application and annotating workflows and steps.
While your application runs, DBOS checkpoints those workflows and steps to a Postgres database.
When failures occur, whether from crashes, interruptions, or restarts, DBOS uses those checkpoints to recover each of your workflows from the last completed step.

Architecturally, an application built with DBOS looks the below diagram.
DBOS is implemented entirely in the open-source library you install into your application.
The library handles both checkpointing workflows and steps and recovering workflows from failures.
There's no orchestration server and no external dependencies except a Postgres database.

<img src={require('@site/static/img/architecture/dbos-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

To learn more about how to add DBOS to your application, check out the language-specific integration guides ([Python](./python/integrating-dbos.md), [TypeScript](./typescript/integrating-dbos.md), [Go](./golang/integrating-dbos.md), [Java](./java/integrating-dbos.md)).


## Using DBOS in a Distributed Setting

DBOS naturally scales to a distributed setting with many servers per application and many applications.
For example, you might deploy a DBOS application to a Kubernetes cluster, a fleet of EC2 instances, or a serverless platform like Google Cloud Run.
Each of your application's servers should connect to the same Postgres database, called the system database.
This database stores all workflow checkpoints, step outputs, and queue state.
By default, each workflow runs on only a single server.
However, you can use mechanisms like [durable queues](#durable-queues) to distribute work across many servers.

Often, you have multiple applications or services that need durable workflows.
For example, you might have a service that handles client requests, a service that handles data ingestion, and a service that runs an AI agent.
You can separately add DBOS to each of these applications, connecting each to a separate system database to isolate their workflows.
This doesn't require multiple Postgres servers&mdash;a single physical Postgres server can host multiple system databases, with each database serving a separate DBOS application.

Sometimes, you need to communicate between separate DBOS applications, or between a DBOS application and an application not using DBOS.
For example, you might want your API server to enqueue a job on your data processing service.
You can use the DBOS Client ([Python](./python/reference/client.md), [TypeScript](./typescript/reference/client.md), [Go](./golang/reference/client.md), [Java](./java/reference/client.md)) to programmatically interact with your application from external code.
For example, your API server can create a client connected to your data processing service's system database and use it to enqueue a job, monitor the job's status, and retrieve its result when complete.
Here's a diagram of what that might look like:

<img src={require('@site/static/img/architecture/api-worker.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

## How DBOS Scales

You can easily scale a DBOS application by adding more servers to it, so the scalability of DBOS is fundamentally determined by the database it is connected to.
The only overhead DBOS adds is database writes: one database write per step (to checkpoint the step's outcome) plus two additional database writes per workflow (one at the beginning to checkpoint workflow inputs, one at the end to checkpoint the workflow outcome).

As these writes are checkpointing workflow inputs and outputs and step outputs, the sizes of the writes are determined by the sizes of your inputs and outputs.
If your steps return small objects, the write sizes are negligible, but if they return large files, the write sizes are large.
Thus, we recommend architecting steps to avoid large output sizes (for example, store large files in cloud blob storage like S3 and have steps return pointers to those files).

While exact numbers depend on the database you are using, a large Postgres database can typically sustain well over 10K writes per second (for example, [this benchmark shows 12-18K writes/second](https://planetscale.com/benchmarks/aurora); most large-scale Postgres benchmarks have similar results).
Thus, a DBOS application using a single Postgres database can sustain a throughput of several thousand workflows or steps per second.
Scaling beyond that is possible by sharding workflows across multiple Postgres databases.

## How Workflow Recovery Works

DBOS achieves fault tolerance by checkpointing workflows and steps.
Every workflow input and step output is durably stored in the system database.
When workflow execution fails, whether from crashes, network issues, or server restarts, DBOS leverages these checkpoints to recover workflows from their last completed step.

Workflow recovery occurs in three steps:

1. First, DBOS detects interrupted workflows.
In single-node deployments, this happens automatically at startup when DBOS scans for incomplete (PENDING) workflows.
In a distributed deployment, some coordination is required, either automatically through services like [DBOS Conductor](#self-hosting-dbos-with-conductor) or [DBOS Cloud](#host-applications-on-dbos-cloud), or manually using the admin API (detailed [here](./production/self-hosting/workflow-recovery.md)).

2. Next, DBOS restarts each interrupted workflow by calling it with its checkpointed inputs.
As the workflow re-executes, it checks before each step if that step's output is checkpointed in Postgres.
If there is a checkpoint, the step returns the checkpointed output instead of executing.

3. Eventually, the recovered workflow reaches a step with **no checkpoint**.
This marks the point where the original execution failed.
The recovered workflow executes that step normally and proceeds from there, thus **resuming from the last completed step.**

For DBOS to be able to safely recover a workflow, your code must satisfy two requirements:

1. The workflow function must be **deterministic**: if executed multiple times, with the same arguments and step return values, the workflow should invoke the same steps with the same inputs in the same order. If you need to perform any non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you should do it in a step instead of directly in the workflow function.

2. Steps should be **idempotent**, meaning it should be safe to retry them multiple times.
If a workflow fails while executing a step, it retries the step during recovery.
However, once a step completes and is checkpointed, it is never re-executed.

## Application and Workflow Versions

If code changes between when a workflow starts and when it its recovered, safe recovery may not be possible.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the source code of your workflows. You can override the version through configuration.
All workflows are tagged with the application version on which they started.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
To safely recover workflows started on an older version of your code, you should start a process running that code version.
Alternatively, you can use the [workflow fork](./production/self-hosting/workflow-management.md#forking-workflows) operation to restart a workflow from a specific step on a specific code version.
For more information, see the [workflow recovery documentation](./production/self-hosting/workflow-recovery.md).

## Durable Queues

One powerful feature of DBOS is that you can **enqueue** workflows for distributed execution with flow control.
You can enqueue a workflow from within a DBOS app directly or from anywhere using a DBOS client.

An enqueued workflow may be dequeued and executed by any of your application's servers.
All processes running DBOS periodically poll their queues to find and execute new work.
Essentially, all of your application servers act as queue workers, as in this diagram:

<img src={require('@site/static/img/architecture/dbos-queues.png').default} alt="DBOS Queues" width="750" className="custom-img"/>

Sometimes, you want to separate the worker servers that execute your queued tasks from the rest of your application.
For example, you may want to scale them separately.
To do this in DBOS, deploy your queue workers as a separate [application](#using-dbos-in-a-distributed-setting) with their own system database.
Then, use the DBOS Client ([Python](./python/reference/client.md), [TypeScript](./typescript/reference/client.md), [Go](./golang/reference/client.md)) to enqueue and manage workflows on your worker application from your other applications.

To help you operate at scale, DBOS queues provide **flow control**.
You can customize the rate and concurrency at which workflows are dequeued and executed.
For example, you can set a **worker concurrency** for each of your queues on each of your servers, limiting how many workflows from that queue may execute concurrently on that server.
For more information on queues, see the docs ([Python](./python/tutorials/queue-tutorial.md), [TypeScript](./typescript/tutorials/queue-tutorial.md), [Go](./golang/tutorials/queue-tutorial.md), [Java](./java/tutorials/queue-tutorial.md)).

## Operating DBOS in Production with Conductor

When operating DBOS durable workflows in production, we strongly recommend connecting your application to Conductor.
Conductor is a management service that provides:

- [**Distributed workflow recovery**](./production/self-hosting//workflow-recovery.md): In a distributed environment with many executors running durable workflows, Conductor automatically detects when the execution of a durable workflow is interrupted (for example, if its executor is restarted, interrupted, or crashes) and recovers the workflow to another healthy executor.
- [**Workflow and queue observability**](./production/self-hosting/workflow-management.md): Conductor provides dashboards of all active and past workflows and all queued tasks as well as real-time workflow visualization.
- [**Workflow and queue management**](./production/self-hosting/workflow-management.md): From the Conductor dashboard, you can pause any workflow execution, start any stopped or enqueued workflow, or restart any workflow from a specific step. This is useful for rapidly responding to incidents or debugging.
- [**Managed Retention Policies**](./production/self-hosting/retention.md): From the Conductor dashboard, manage how much workflow history each of your applications should retain and for how long to retain it.

Architecturally, Conductor looks like this:

<img src={require('@site/static/img/architecture/dbos-conductor-architecture.png').default} alt="DBOS Conductor Architecture" width="750" className="custom-img"/>

Each of your application servers opens a secure websocket connection to Conductor.
All of Conductor's capabilities are powered by these websocket connections.
When you open a Conductor dashboard in your browser, your request is sent over websocket to one of your application servers, which serves the request (for example, retrieving a list of recent workflows) and sends the result back through the websocket.
If one of your application servers fails, Conductor detects the failure through the closed websocket connection and, after a grace period, directs another server to recover its workflows.
This architecture has two useful implications:

1. Conductor is **secure** and **privacy-preserving**. It does not have access to your database, nor does it need direct access to your application servers. Instead, your servers open outbound websocket connections to it and communicate exclusively through its websocket protocol.
2. Conductor is **out of band** and **off your critical path**. Conductor is **only** used for observability and recovery and is never involved in workflow execution (unlike the external orchestrators of other workflow systems).
If your application's connection to Conductor is interrupted, it will continue to operate normally, and any failed workflows will automatically be recovered as soon as the connection is restored.

For more information on Conductor, see [its docs](./production/self-hosting/conductor.md).
