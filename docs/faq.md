---
title: Troubleshooting & FAQ
---

### Where do I find the DBOS tables?

DBOS checkpoints information about your workflows in an isolated _system database_ in your Postgres database server.
You connect to this database through the `system_database_url` parameter in DBOS configuration.
You can connect to and explore your system database with popular database clients like [psql](https://www.postgresql.org/docs/current/app-psql.html) and [DBeaver](https://dbeaver.io/).
Note that the tables are in the `dbos` schema in that database, so the tables are accessible at `dbos.workflow_status`, `dbos.operation_outputs`, etc.
All system database tables are documented [here](./explanations/system-tables.md).

:::tip
If you're using Supabase, only the `postgres` database is visible from the Supabase web console.
You can use `postgres` as your system database, or you can use a different system database and connect to and explore your system database using a client like [psql](https://www.postgresql.org/docs/current/app-psql.html) or [DBeaver](https://dbeaver.io/).
:::

### Why is my queue stuck?

If a DBOS queue is stuck (workflows are not moving from `ENQUEUED` to `PENDING`), it is likely that either the number of `PENDING` workflows exceeds the queue's global "concurrency" limit or the number of queued workflows in a `PENDING` state on each worker exceeds the queue's "worker concurrency" limit. In either case, new tasks cannot be dequeued until some currently executing tasks complete or are cancelled. You can view all tasks executing on a queue from the "Queues" tab of the DBOS Console ([self-hosted](./production/self-hosting/workflow-management.md), [DBOS Cloud](./production/dbos-cloud/workflow-management.md)).
If you need to, you can cancel tasks to remove them from the queue.

### Why is my workflow not finishing?

When self-hosted workflows don't make progress, the cause is often [version mismatch](./architecture.md#application-and-workflow-versions). Check that your app version matches the version of your workflow. Note that changing the workflow code automatically generates a new version string, unless there is a config override. When upgrading a self-hosted app, we recommend keeping at least some old-version workers running until all workflows of that version are complete. You can also cancel such workflows and, if possible, use [fork](./production/self-hosting/workflow-management.md#workflow-management) to resume them on a new app version.

A worker crash or outage may delay workflow completion. In certain rare cases, you may need to allow up to 15 minutes for DBOS Cloud or Conductor to begin workflow recovery.

Workflows may also get "stuck" due to their logic: infinite loops, indefinitely waiting for an event or improper use of async.

### How can I cancel or fork a large number of workflows in a batch?

Write a script using the DBOS Client ([Python](./python/reference/client.md), [TypeScript](./typescript/reference/client.md) or [Go](./golang/reference/client.md)) to list all the workflows that fit your criteria, then iteratively process them.

### Why am I seeing errors that objects cannot be deserialized?

DBOS requires that the inputs and outputs of workflows, as well as the outputs of steps, are **serializable**.
This is because DBOS checkpoints these inputs and outputs to the database to recover workflows from failures.
DBOS serializes objects to JSON in TypeScript, with `pickle` in Python (this is customizable), and with `gob` in Go.
See these guides ([TypeScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description), [Python](https://docs.python.org/3/library/pickle.html#what-can-be-pickled-and-unpickled), [Go](https://pkg.go.dev/encoding/gob)) for information on what objects can and cannot be serialized.

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
If you view a workflow's call graph from the DBOS console ([self-hosted](./production/self-hosting/workflow-management.md), [DBOS Cloud](./production/dbos-cloud/workflow-management.md)), it will include the workflow's children.

### Can I call a step from a step?

Yes, you can call a step from another step.
However, the called step becomes part of the calling step's execution rather than functioning as a separate step.

### Can I start, monitor, or cancel DBOS workflows from a non-DBOS application?

Yes, your non-DBOS application can create a DBOS Client ([Python docs](./python/reference/client.md), [TypeScript docs](./typescript/reference/client.md), [Go docs](./golang/reference/client.md)) and use it to enqueue a workflow in your DBOS application and interact with it or check its status.

### What happens if you start two workflows with the same workflow ID?

In DBOS, workflow IDs are unique identifiers of workflow executions.
If you enqueue a workflow with the ID of a workflow that already exists, it's a no-op and a handle to the existing workflow execution is returned.
If you start a workflow with the ID of a workflow that has already completed, it will return the result of the previous execution.
If you start a workflow with the ID of a workflow that is currently executing, it will attempt to recover that workflow's execution, continuing execution from the last completed step.

If another process is concurrently executing the same workflow, both processes may execute the step.
The first process to complete the step will checkpoint its outcome and continue executing the workflow. The second process will see that a checkpoint has already been written, wait for the first process to complete the workflow, retrieve the result from the database and return it.

### How can I reset all my DBOS state during development?

You can reset your DBOS system database and all internal DBOS state with the `dbos reset` command ([Python](./python/reference/cli.md#dbos-reset), [TypeScript](./typescript/reference/cli.md#npx-dbos-reset), [Go](./golang/reference/cli.md)).

### How can I reduce the number of Postgres connections DBOS uses?

You can use the app config to reduce the system database pool size. Do not use values less than 5 ([Python](./python/reference/configuration.md), [TypeScript](./typescript/reference/client.md), [Go](./golang/reference/dbos-context.md)).

### Can I use DBOS with an external Postgres connection pooler?

You can connect a DBOS application to its system database through a connection pooler like [PgBouncer](https://www.pgbouncer.org/), but **only in session mode**, not in transaction mode. See [this page](https://www.pgbouncer.org/features.html) for more information on the difference between session and transaction mode.

### Why do I get insufficient privilege errors when starting DBOS?

DBOS creates tables for its internal state in its [system database](./explanations/system-tables.md).
By default, a DBOS application automatically creates these on startup.
However, in production environments, a DBOS application may not run with sufficient privilege to create databases or tables.
In that case, the [`dbos migrate`](./python/reference/cli.md#dbos-migrate) command in Python, the [`dbos migrate`](./golang/reference/cli.md) in Go, or the [`dbos schema`](./typescript/reference/cli.md#npx-dbos-schema) command in TypeScript can be run with a privileged user to create all DBOS database tables.
Then, a DBOS application can run without privilege (requiring only access to the application and system databases).

### How does DBOS scale?

The [architecture page](./architecture.md) describes how to architect a distributed DBOS application and how DBOS scales.
