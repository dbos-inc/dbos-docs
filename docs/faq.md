---
title: Troubleshooting & FAQ
---

### Where do I find the DBOS tables?

DBOS checkpoints information about your workflows in an isolated _system database_ in your Postgres database server.
You connect to this database through the `system_database_url` parameter in DBOS configuration.
You can connect to and explore your system database with popular database clients like [psql](https://www.postgresql.org/docs/current/app-psql.html) and [DBeaver](https://dbeaver.io/).
Note that the tables are in the `dbos` schema in that database, so the tables are accessible at `dbos.workflow_status`, `dbos.operation_outputs`, etc.
The system database schema is documented [here](./explanations/system-tables.md).

:::tip
If you're using Supabase, only the `postgres` database is visible from the Supabase web console.
You can use `postgres` as your system database, or you can use a different system database and connect to and explore your system database using a client like [psql](https://www.postgresql.org/docs/current/app-psql.html) or [DBeaver](https://dbeaver.io/).
:::

### Why is my queue stuck?

If a DBOS queue is stuck (workflows are not moving from `ENQUEUED` to `PENDING`), it is likely that either the number of `PENDING` workflows exceeds the queue's global "concurrency" limit or the number of queued workflows in a `PENDING` state on each worker exceeds the queue's "worker concurrency" limit. In either case, new tasks cannot be dequeued until some currently executing tasks complete or are cancelled. You can view all tasks executing on a queue from the "Queues" tab of the [DBOS Console](./production/workflow-management.md)
If you need to, you can cancel tasks to remove them from the queue.

### Why is my workflow not finishing?

The most common cause of "stuck" workflows is logic issues: infinite loops, indefinitely waiting for an event, or improper use of async in Python or TypeScript.
The last is always worth checking when using those languages: any synchronous call anywhere in your program can block your event loop, preventing async operations (such as workflows) from making progress.

If a worker crash or outage occurred, it may briefly delay workflow completion. In certain rare cases, you may need to allow up to 15 minutes for Conductor to begin workflow recovery.

If workflows do not recover after a code upgrade, the cause is often [version mismatch](./architecture.md#upgrading-workflow-code).
If you are using versioning, check that your app version matches the version of your workflow.

### How can I cancel or fork a large number of workflows in a batch?

On the [DBOS Console](./production/workflow-management.md), filter for all workflows that meet your criteria, then select them all and apply a batch operation.
Alternatively, write a script using the DBOS Client ([Python](./python/reference/client.md), [TypeScript](./typescript/reference/client.md), [Go](./golang/reference/client.md), [Java](./java/reference/client.md)) to list all the workflows that fit your criteria, then process them.

### Why am I seeing errors that objects cannot be deserialized?

DBOS requires that the inputs and outputs of workflows, as well as the outputs of steps, are **serializable**.
This is because DBOS checkpoints these inputs and outputs to the database to recover workflows from failures.
DBOS serializes objects to JSON in TypeScript and Go, with `pickle` in Python, and with Jackson in Java.

If your workflow needs to access an unserializable object like a database connection or API client, do not pass it into the workflow as an argument.
Instead, either construct the object inside the workflow from parameters passed into the workflow, or construct it globally.

### How large can serialized step and workflow outputs be?

DBOS stores two serialized fields (`inputs` and `output`) for each workflow  and one `output` field for each step. Each of these is stored as a Postgres `TEXT` value which is limited by the maximum field size; currently 1GB. See [Postgres documentation](https://wiki.postgresql.org/wiki/FAQ#What_is_the_maximum_size_for_a_row.2C_a_table.2C_and_a_database.3F).

### Why am I seeing an error that function X was recorded when Y was expected?

This error arises when DBOS is recovering a workflow and attempts to execute step Y, but finds a checkpoint in the database for step X instead.
Typically, this occurs because the workflow function is not **deterministic**.
A workflow function is deterministic if, when called multiple times with the same inputs, it invokes the same steps with the same inputs in the same order (given the same return values from those steps).
If a workflow is non-deterministic, it may execute different steps during recovery than it did during its original execution.

To make a workflow deterministic, make sure all non-deterministic operations (such as calling a third-party API, generating a random number, or getting the local time) are performed **in steps** instead of in the workflow function.

### Can I call a workflow from a workflow?

Yes, you can call (or start, or enqueue) a workflow from inside another workflow.
That workflow becomes a **child** of its caller and is by default assigned a workflow ID derived from its parent's.
If you view a workflow's trace from the [DBOS console](./production/workflow-management.md), it will include the workflow's children.

### Can I call a step from a step?

Yes, you can call a step from another step.
However, the called step becomes part of the calling step's execution rather than functioning as a separate step.

### Can I start, monitor, or cancel DBOS workflows from a non-DBOS application?

Yes, your non-DBOS application can create a DBOS Client ([Python](./python/reference/client.md), [TypeScript](./typescript/reference/client.md), [Go](./golang/reference/client.md), [Java](./java/reference/client.md)) and use it to enqueue a workflow in your DBOS application and interact with it or check its status.

### What happens if you start two workflows with the same workflow ID?

In DBOS, workflow IDs are unique identifiers of workflow executions.
If you enqueue a workflow with the ID of a workflow that already exists, it's a no-op and a handle to the existing workflow execution is returned.

### How can I reset all my DBOS state during development?

You can reset your DBOS system database and all internal DBOS state with the `dbos reset` command ([Python](./python/reference/cli.md#dbos-reset), [TypeScript](./typescript/reference/cli.md#npx-dbos-reset), [Go](./golang/reference/cli.md)).

### How can I reduce the number of Postgres connections DBOS uses?

You can set the system database pool size in DBOS configuration ([Python](./python/reference/configuration.md), [TypeScript](./typescript/reference/configuration.md), [Go](./golang/reference/dbos-context.md), [Java](./java/reference/lifecycle.md)).
Do not use values less than 5.

### Can I use DBOS with an external Postgres connection pooler?

You can connect a DBOS application to its system database through a connection pooler like [PgBouncer](https://www.pgbouncer.org/), but **only in session mode**, not in transaction mode. See [this page](https://www.pgbouncer.org/features.html) for more information on the difference between session and transaction mode.

### Why do I get insufficient privilege errors when starting DBOS?

DBOS creates tables for its internal state in its [system database](./explanations/system-tables.md).
By default, a DBOS application automatically creates these on startup.
However, in production environments, a DBOS application may not run with sufficient privilege to create databases or tables.
In that case, the [`dbos migrate`](./python/reference/cli.md#dbos-migrate) command in Python, the [`dbos migrate`](./golang/reference/cli.md) in Go, or the [`dbos schema`](./typescript/reference/cli.md#npx-dbos-schema) command in TypeScript can be run with a privileged user to create all DBOS database tables.
Then, a DBOS application can run without privilege (requiring only access to the system database).

### How does DBOS scale?

The [architecture page](./architecture.md) describes how to architect a distributed DBOS application and how DBOS scales.

### Why is my application not connecting to Conductor?

The most common reason an application fails to connect to Conductor is that the name the application is registered with in its DBOS configuration does not match the name it was registered with in Conductor.
Additionally, if you are [self-hosting Conductor](./production/hosting-conductor.md) with a free license, you may connect at most one executor per application to Conductor, so additional executors may see their connections rejected.
To connect multiple executors, upgrade to a paid license.

### Why is my Conductor dashboard flickering?

The most common cause of flickering is that you have connected multiple executors using different system databases to the same Conductor application (for example, both an executor from your dev environment and one from your prod environment), causing Conductor to receive inconsistent data.
For isolation, you should set up a separate Conductor app for each environment in which you run your DBOS application.
For example, you may want to have separate dev, staging, and prod Conductor apps.
See [the docs](./production/conductor.md#managing-conductor-applications) for more information.

### How are "checkpoints" calculated in Conductor pricing?

Every workflow counts as one checkpoint and every step counts as one additional checkpoint. You can monitor your current usage at https://console.dbos.dev/usage

You can also run the following SQL query on your [System Database](./explanations/system-tables.md) to compute your daily checkpoint count:
```SQL
WITH daily_workflows AS (
  SELECT
  DATE_TRUNC('day', TO_TIMESTAMP(created_at / 1000)) AS day,
  workflow_uuid
  FROM dbos.workflow_status
)
SELECT
  dw.day,
  COUNT(DISTINCT dw.workflow_uuid) AS workflow_count,
  COUNT(oo.workflow_uuid) AS step_count,
  COUNT(DISTINCT dw.workflow_uuid) + COUNT(oo.workflow_uuid) AS total_checkpoints
FROM daily_workflows dw
LEFT JOIN dbos.operation_outputs oo ON dw.workflow_uuid = oo.workflow_uuid
GROUP BY dw.day
ORDER BY dw.day DESC;
```