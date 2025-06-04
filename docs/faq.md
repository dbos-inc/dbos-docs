---
title: Troubleshooting & FAQ
---

### Where do I find the DBOS tables?

DBOS checkpoints information about your workflows in an isolated _system database_ in your Postgres database server.
By default, the name of your system database is your application database name suffixed with `_dbos_sys`.
For example, if your application database is `dbos_app_starter`, your system database is `dbos_app_starter_dbos_sys`.
You can connect to and explore your system database with popular database clients like [psql](https://www.postgresql.org/docs/current/app-psql.html) and [DBeaver](https://dbeaver.io/).
All system database tables are documented [here](./explanations/system-tables.md).

:::tip
If you're using Supabase, the default application database name is `postgres`, so the default system database name is `postgres_dbos_sys`.
You cannot connect to or view non-default databases from the Supabase web console, but you can still connect to and explore your system database using a client like [psql](https://www.postgresql.org/docs/current/app-psql.html) or [DBeaver](https://dbeaver.io/).
:::

### Why is my queue stuck?

If a DBOS queue is stuck (newly submitted tasks are not being dequeued), it is likely that the number of tasks currently executing on the queue exceeds the queue's global concurrency limit.
In that case, new tasks cannot be dequeued until some currently executing tasks complete or are cancelled.
You can view all tasks executing on a queue from the queues tab of the DBOS Console ([self-hosted](./production/self-hosting/workflow-management.md), [DBOS Cloud](./production/dbos-cloud/workflow-management.md)).
If you need to, you can cancel tasks to remove them from the queue.

### I'm seeing errors that objects cannot be deserialized?

DBOS requires that the inputs and outputs of workflows, as well as the outputs of steps, be **serializable**.
This is because DBOS checkpoints these inputs and outputs to the database to recover workflows from failures.
DBOS serializes objects to JSON in TypeScript and with pickle in Python.
See these guides ([TypeScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description), [Python](https://docs.python.org/3/library/pickle.html#what-can-be-pickled-and-unpickled)) for information on what objects can and cannot be serialized.

If your workflow needs to access an unserializable object like a database connection or API client, do not pass it into the workflow as an argument.
Instead, either construct the object inside the workflow from parameters passed into the workflow or construct it globally and access it from the workflow or the appropriate steps.

### I'm seeing an error that function X was recorded when Y was expected?

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
However, the called step becomes part of the calling step's execution rather than function as a separate step.

### Can I start or interact with DBOS workflows from a non-DBOS application?

Yes, your non-DBOS application can create a DBOS Client ([Python docs](./python/reference/client.md), [TypeScript docs](./typescript/reference/client.md)) and use it to enqueue a workflow in your DBOS application and interact with it or check its status.