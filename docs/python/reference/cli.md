---
sidebar_position: 15
title: DBOS CLI
---

## Workflow Management Commands

These commands all require the URL of your DBOS system database (and optionally your application database, if you use DBOS [transactions](../tutorials/transaction-tutorial.md)).
You can supply this URL through the `--sys-db-url` argument or through a [`dbos-config.yaml` configuration file](./configuration.md#dbos-configuration-file).

### dbos workflow list

**Description:**
List workflows run by your application in JSON format ordered by recency (most recently started workflows last).

**Arguments:**
- `-s, --sys-db-url URL`: Your DBOS system database URL.
- `-D, --db-url URL`: Your DBOS application database URL.
* `-l, --limit INTEGER`: Limit the results returned  [default: 10]
* `-u, --user TEXT`: Retrieve workflows run by this user
* `-s, --start-time TEXT`: Retrieve workflows starting after this timestamp (ISO 8601 format)
* `-e, --end-time TEXT`: Retrieve workflows starting before this timestamp (ISO 8601 format)
* `-S, --status TEXT`: Retrieve workflows with this status (PENDING, SUCCESS, ERROR, MAX_RECOVERY_ATTEMPTS_EXCEEDED, ENQUEUED, or CANCELLED)
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
- `-s, --sys-db-url URL`: Your DBOS system database URL.
- `-D, --db-url URL`: Your DBOS application database URL.

**Output:**
A JSON-formatted [workflow status](./contexts#workflow-status).

### dbos workflow steps

**Arguments:**
- `<workflow-id>`: The ID of the workflow to retrieve
- `-s, --sys-db-url URL`: Your DBOS system database URL.
- `-D, --db-url URL`: Your DBOS application database URL.

**Output:**
A JSON-formatted list of [workflow steps](./contexts#list_workflow_steps).

### dbos workflow cancel

**Description:**
 Cancel a workflow so it is no longer automatically retried or restarted. Active executions are not halted.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to cancel
- `-s, --sys-db-url URL`: Your DBOS system database URL.
- `-D, --db-url URL`: Your DBOS application database URL.

### dbos workflow resume

**Description:**
Resume a workflow from its last completed step.
You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an `ENQUEUED` workflow, bypassing its queue.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to resume.
- `-s, --sys-db-url URL`: Your DBOS system database URL.
- `-D, --db-url URL`: Your DBOS application database URL.

**Output:**
A JSON-formatted [workflow status](./contexts#workflow-status).

### dbos workflow fork

**Description:**
Fork a new execution of a workflow, starting at a given step.
This new workflow has a new workflow ID but the same code version (you can fork to a different code version [programmatically](./client.md#fork_workflow)).
Forking from step N copies the results of all previous steps to the new workflow, which then starts running from step N.

**Arguments:**
* `<workflow-id>`: The ID of the workflow to restart.
- `-s, --sys-db-url URL`: Your DBOS system database URL.
- `-D, --db-url URL`: Your DBOS application database URL.
* `-f, --forked-workflow-id`: Custom ID for the forked workflow
* `-v, --application-version`: Custom application version for the forked workflow
* `-S, --step INTEGER`: Restart from this step [default: 1]

**Output:**
A JSON-formatted [workflow status](./contexts#workflow-status).

### dbos workflow queue list

**Description:**
Lists all currently enqueued tasks in JSON format ordered by recency (most recently enqueued functions last).

**Arguments:**
- `-s, --sys-db-url URL`: Your DBOS system database URL.
- `-D, --db-url URL`: Your DBOS application database URL.
* `-l, --limit INTEGER`: Limit the results returned
* `-s, --start-time TEXT`: Retrieve functions starting after this timestamp (ISO 8601 format)
* `-e, --end-time TEXT`: Retrieve functions starting before this timestamp (ISO 8601 format)
* `-S, --status TEXT`: Retrieve functions with this status (PENDING, SUCCESS, ERROR, MAX_RECOVERY_ATTEMPTS_EXCEEDED, ENQUEUED, or CANCELLED)
* `-q, --queue-name TEXT`: Retrieve functions on this queue
* `-n, --name TEXT`: Retrieve functions on this queue
* `-d, --sort-desc`: Sort the results in descending order (older first)
* `-o, --offset INTEGER`: Offset for pagination

**Output:**
A JSON-formatted list of [workflow statuses](./contexts#workflow-status).

## Application Management Commands

### dbos migrate

Create the DBOS system database and internal tables.
By default, a DBOS application automatically creates these on startup.
However, in production environments, a DBOS application may not run with sufficient privilege to create databases or tables.
In that case, this command can be run with a privileged user to create all DBOS database tables.

After creating the DBOS database tables with this command, a DBOS application can run with minimum permissions, requiring only access to the DBOS schema in the application and system databases.
Use the `-r` flag to grant a role access to that schema.

**Arguments:**

- `-s, --sys-db-url URL`: A connection string for your DBOS [system database](../../explanations/system-tables.md), in which DBOS stores its internal state. This command will create that database if it does not exist and create or update the DBOS system tables within it.
- `-D, --db-url URL`: A connection string for your DBOS application database, in which DBOS [transactions](../tutorials/transaction-tutorial.md) run. Optional if you are not using transactions.
- `-r, --app-role`: The role with which you will run your DBOS app. This role is granted the minimum permissions needed to access the DBOS schema in your application and system databases.

### dbos start

Start your DBOS application by executing the `start` command defined in [`dbos-config.yaml`](./configuration.md#dbos-configuration-file).
For example:

```yaml
runtimeConfig:
  start:
    - "fastapi run"
```

DBOS Cloud executes this command to start your app.

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
- `-s, --sys-db-url URL`: Your DBOS system database URL.
