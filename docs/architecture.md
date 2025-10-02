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

To learn more about how to add DBOS to your application, check out the language-specific integration guides ([Python](./python/integrating-dbos.md), [TypeScript](./typescript/integrating-dbos.md), [Go](./golang/integrating-dbos.md)).


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
You can use the DBOS Client ([Python](./python/reference/client.md), [TypeScript](./typescript/reference/client.md), [Go](./golang/reference/client.md)) to programmatically interact with your application from external code.
For example, your API server can create a client connected to your data processing service's system database and use it to enqueue a job, monitor the job's status, and retrieve its result when complete.
Here's a diagram of what that might look like:

<img src={require('@site/static/img/architecture/api-worker.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

## Comparison to External Workflow Orchestrators

The DBOS architecture is radically simpler than other workflow systems such as Temporal, Airflow or AWS Step Functions.
These systems implement workflows via **external orchestration**.
At a high-level, their architectures look like this:

<img src={require('@site/static/img/architecture/external-architecture.png').default} alt="External Orchestrator Architecture" width="750" className="custom-img"/>

Externally orchestrated systems are made up of an orchestrator and a set of workers. The orchestrator runs workflow code, dispatching steps to workers.
Workers execute steps, then return their output to the orchestrator, which persists that output to a data store then dispatches the next step.
Application code can't call workflows directly, but instead sends requests to the orchestrator server to start workflows and fetch their results.

While DBOS can be installed into an existing application as a library, adding an external orchestrator to an application requires substantially rearchitecting it.
First, you must move all workflow and step code from application servers to workers.
Then, you must also rewrite all interaction between your application and its workflows to go through the orchestration server and its client APIs.
Next, you must build infrastructure to operate and scale the worker servers.
Finally, you must operate and scale the orchestration server and its underlying data store (for example, Cassandra for Temporal), which are both single points of failure for your application.

DBOS is simpler because it runs entirely **in-process** as a library, so your workflows and steps remain normal functions within your application that you can call from other application code.
DBOS simply instruments them to checkpoint their state and recover them from failure.

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

An enequeued workflow may be dequeued and executed by any of your application's servers.
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
For more information on queues, see the docs ([Python](./python/tutorials/queue-tutorial.md), [TypeScript](./typescript/tutorials/queue-tutorial.md), [Go](./golang/tutorials/queue-tutorial.md)).

## Self-Hosting DBOS with Conductor

The simplest way to operate DBOS durable workflows in production is to connect your application to Conductor.
Conductor is an optional management service that helps you self-host DBOS applications.
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
2. Conductor is **out of band** and **off your critical path**. Conductor is **only** used for observability and recovery and is never involved in workflow execution (unlike the external orchestrators of other workflow systems).
If your application's connection to Conductor is interrupted, it will continue to operate normally, and any failed workflows will automatically be recovered as soon as the connection is restored.

For more information on Conductor, see [its docs](./production/self-hosting/conductor.md).

## Host Applications on DBOS Cloud

You can deploy DBOS applications to DBOS Cloud.
DBOS Cloud is a serverless platform for durably executed applications.
It provides:

- [**Application hosting and autoscaling**](./production/dbos-cloud/application-management.md): Managed hosting of your application in the cloud, automatically scaling to millions of users. Applications are charged only for the CPU time they actually consume.
- [**Automatic workflow version management**](./production/dbos-cloud/application-management.md): DBOS Cloud seamlessly manages code version upgrades, launching new workflows on new code versions while completing old workflows on old code versions.
- [**Managed workflow recovery**](./production/dbos-cloud/application-management.md): If a cloud executor is interrupted, crashed, or restarted, each of its workflows is automatically recovered by another executor.
- [**Workflow and queue observability**](./production//dbos-cloud/workflow-management.md): Dashboards of all active and past workflows and all queued tasks, including their status, inputs, outputs, and steps.
- [**Workflow and queue management**](./production/dbos-cloud/workflow-management.md): From an online dashboard, cancel, resume, or restart any workflow execution and manage the tasks in your distributed queues.

See [**Deploying to DBOS Cloud**](./production/dbos-cloud/deploying-to-cloud.md) to learn more.