---
sidebar_position: 15
title: DBOS CLI
---

## Workflow Management Commands

### dbos workflow list

**Description:**
List workflows run by your application in JSON format ordered by recency (most recently started workflows last).

**Arguments:**
* `-D, --db-url TEXT`: Your DBOS application database URL
* `-l, --limit INTEGER`: Limit the results returned  [default: 10]
* `-u, --user TEXT`: Retrieve workflows run by this user
* `-s, --start-time TEXT`: Retrieve workflows starting after this timestamp (ISO 8601 format)
* `-e, --end-time TEXT`: Retrieve workflows starting before this timestamp (ISO 8601 format)
* `-S, --status TEXT`: Retrieve workflows with this status (PENDING, SUCCESS, ERROR, RETRIES_EXCEEDED, ENQUEUED, or CANCELLED)
* `-v, --application-version TEXT`: Retrieve workflows with this application version
* `-n, --name TEXT`: Retrieve workflows with this name
* `-d, --sort-desc`: Sort the results in descending order (older first)
* `-o, --offset INTEGER`: Offset for pagination

**Output:**
A JSON-formatted list of [workflow statuses](./contexts#workflow-status).

### dbos workflow get

**Description:**
Retrieve information on a workflow run by your application.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to retrieve
- `-D, --db-url TEXT`: Your DBOS application database URL

**Output:**
A JSON-formatted [workflow status](./contexts#workflow-status).

### dbos workflow steps

**Arguments:**
- `<workflow-id>`: The ID of the workflow to retrieve
- `-D, --db-url TEXT`: Your DBOS application database URL

**Output:**
A JSON-formatted list of [workflow steps](./contexts#list_workflow_steps).

### dbos workflow cancel

**Description:**
 Cancel a workflow so it is no longer automatically retried or restarted. Active executions are not halted.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to cancel
- `-D, --db-url TEXT`: Your DBOS application database URL

### dbos workflow resume

**Description:**
Resume a workflow from its last completed step.
You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an `ENQUEUED` workflow, bypassing its queue.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to resume.
- `-D, --db-url TEXT`: Your DBOS application database URL

:::info
Resuming a workflow on a new version of your application will flag the workflow with the new version.
:::

### dbos workflow restart

**Description:**
Start a new execution of a workflow with the same inputs.
This new workflow has a new workflow ID and is tagged with the current application version.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to restart.
- `-D, --db-url TEXT`: Your DBOS application database URL

**Output:**
A JSON-formatted [workflow status](./contexts#workflow-status).

### dbos workflow fork

**Description:**
Fork a new execution of a workflow, starting at a given step.
This new workflow has a new workflow ID and is tagged with the current application version.
Forking from step N copies the results of all previous steps to the new workflow, which then starts running from step N.

**Arguments:**
* `<workflow-id>`: The ID of the workflow to restart.
* `-s, --step INTEGER`: Restart from this step [default: 1]
* `-D, --db-url TEXT`: Your DBOS application database URL

**Output:**
A JSON-formatted [workflow status](./contexts#workflow-status).

### dbos workflow queue list

**Description:**
Lists all currently enqueued tasks in JSON format ordered by recency (most recently enqueued functions last).

**Arguments:**
* `-D, --db-url TEXT`: Your DBOS application database URL
* `-l, --limit INTEGER`: Limit the results returned
* `-s, --start-time TEXT`: Retrieve functions starting after this timestamp (ISO 8601 format)
* `-e, --end-time TEXT`: Retrieve functions starting before this timestamp (ISO 8601 format)
* `-S, --status TEXT`: Retrieve functions with this status (PENDING, SUCCESS, ERROR, RETRIES_EXCEEDED, ENQUEUED, or CANCELLED)
* `-q, --queue-name TEXT`: Retrieve functions on this queue
* `-n, --name TEXT`: Retrieve functions on this queue
* `-d, --sort-desc`: Sort the results in descending order (older first)
* `-o, --offset INTEGER`: Offset for pagination

**Output:**
A JSON-formatted list of [workflow statuses](./contexts#workflow-status).

## Application Management Commands

### dbos start

Start your DBOS application by executing the `start` command defined in [`dbos-config.yaml`](./configuration.md#runtime-section).
For example:

```yaml
runtimeConfig:
  start:
    - "fastapi run"
```

DBOS Cloud executes this command to start your app.

### dbos migrate

Run all database schema migration commands defined in [`dbos-config.yaml`](./configuration.md#database-section).
For example:

```yaml
database:
  migrate:
    - alembic upgrade head
```

DBOS Cloud uses this command during application deployment to migrate your database schema.

### dbos init

Initialize the local directory with a DBOS template application.

**Arguments:**
- `<application-name>`: The name of your application. If not specified, will be prompted for.
- `-t, --template TEXT`: Specify a template to use. ("dbos-toolbox", "dbos-app-starter", "dbos-cron-starter", "dbos-db-starter")
- `--config, -c`: If this flag is set, only the `dbos-config.yaml` file is added from the template. Useful to add DBOS to an existing project.

### dbos reset

Reset your DBOS [system database](../../explanations/system-tables.md), deleting metadata about past workflows and steps.
No application data is affected by this.

**Arguments:**
* `--yes, -y`: Skip confirmation prompt.
* `-s, --sys-db-name TEXT`: Specify the name of the system database to reset
* `-D, --db-url TEXT`: Your DBOS application database URL

### dbos debug

Execute a DBOS application in debug mode to replay a specified workflow.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to debug.
