---
title: Troubleshooting & FAQ
---

### Where do I find the DBOS tables?

DBOS checkpoints information about your workflows in an isolated _system database_ in your Postgres database server.
By default, the name of your system database is your application database name suffixed with `_dbos_sys`.
For example, if your application database is `dbos_app_starter`, your system database is `dbos_app_starter_dbos_sys`.
You can connect to and explore your system database with popular database clients like [`psql`](https://www.postgresql.org/docs/current/app-psql.html) and [`DBeaver`](https://dbeaver.io/).
All system database tables are documented [here](./explanations/system-tables.md).

:::tip
If you're using Supabase, the default application database name is `postgres`, so the default system database name is `postgres_dbos_sys`.
You cannot connect to or view non-default Postgres databases from the Supabase web console, but you can still connect to and explore your system database using a client like [`psql`](https://www.postgresql.org/docs/current/app-psql.html) and [`DBeaver`](https://dbeaver.io/).
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
