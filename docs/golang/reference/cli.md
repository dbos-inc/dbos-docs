---
sidebar_position: 50
title: DBOS CLI
---

## Workflow Management Commands

These commands all require the URL of your DBOS system database.
You can supply this URL through the `--db-url` argument or through the `DBOS_SYSTEM_DATABASE_URL` environment variable.

### dbos workflow list

List workflows run by your application in JSON format ordered by recency (most recently started workflows last).

**Arguments:**
- `-D, --db-url URL`: Your DBOS system database URL.
- `-l, --limit INTEGER`: Limit the results returned  [default: 10]
- `-u, --user TEXT`: Retrieve workflows run by this user
- `-s, --start-time TEXT`: Retrieve workflows starting after this timestamp (ISO 8601 format)
- `-e, --end-time TEXT`: Retrieve workflows starting before this timestamp (ISO 8601 format)
- `-S, --status TEXT`: Retrieve workflows with this status (PENDING, SUCCESS, ERROR, MAX_RECOVERY_ATTEMPTS_EXCEEDED, ENQUEUED, or CANCELLED)
- `-v, --application-version TEXT`: Retrieve workflows with this application version
- `-n, --name TEXT`: Retrieve workflows with this name
- `-d, --sort-desc`: Sort the results in descending order (older first)
- `-o, --offset INTEGER`: Offset for pagination
- `-q, --queue TEXT`: Retrieve workflows on this queue
- `-Q, --queues-only`: Retrieve only queued workflows

**Output:**
A JSON-formatted list of workflow statuses.

### dbos workflow get

Retrieve information on a workflow run by your application.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to retrieve
- `-D, --db-url URL`: Your DBOS system database URL.

**Output:**
A JSON-formatted workflow status.

### dbos workflow steps

List the steps of a workflow.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to retrieve
- `-D, --db-url URL`: Your DBOS system database URL.

**Output:**
A JSON-formatted list of workflow steps.

### dbos workflow cancel

Cancel a workflow so it is no longer automatically retried or restarted. Active executions are not halted.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to cancel
- `-D, --db-url URL`: Your DBOS system database URL.

### dbos workflow resume

Resume a workflow from its last completed step.
You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an `ENQUEUED` workflow, bypassing its queue.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to resume.
- `-D, --db-url URL`: Your DBOS system database URL.

**Output:**
A JSON-formatted workflow status.

### dbos workflow fork

Fork a new execution of a workflow, starting at a given step.
This new workflow has a new workflow ID but the same code version.
Forking from step N copies the results of all previous steps to the new workflow, which then starts running from step N.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to fork.
- `-D, --db-url URL`: Your DBOS system database URL.
- `-s, --step INTEGER`: Restart from this step [default: 1]

**Output:**
A JSON-formatted workflow status.

## Application Management Commands

### dbos migrate

Create the DBOS system database and internal tables.
By default, a DBOS application automatically creates these on startup.
However, in production environments, a DBOS application may not run with sufficient privilege to create databases or tables.
In that case, this command can be run with a privileged user to create all DBOS database tables.

After creating the DBOS database tables with this command, a DBOS application can run with minimum permissions, requiring only access to the DBOS schema in the system database.
Use the `-r` flag to grant a role access to that schema.

**Arguments:**

- `-D, --db-url URL`: A connection string for your DBOS system database, in which DBOS stores its internal state. This command will create that database if it does not exist and create or update the DBOS system tables within it.
- `-r, --app-role TEXT`: The role with which you will run your DBOS app. This role is granted the minimum permissions needed to access the DBOS schema in your system database.

### dbos init

Initialize a new DBOS application from a template.

**Arguments:**
- `<project-name>`: The name of your application. If not specified, will be prompted for.

### dbos reset

Reset your DBOS system database, deleting metadata about past workflows and steps.
**Only use in a development environment**

**Arguments:**
- `--yes, -y`: Skip confirmation prompt.
- `-D, --db-url URL`: Your DBOS system database URL.

### dbos postgres start

Start a local Postgres database using Docker for development.

### dbos postgres stop

Stop the local Docker Postgres database.
