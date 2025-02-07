---
sidebar_position: 10
title: DBOS Transact CLI
description: DBOS Transact CLI reference
pagination_prev: null
---

The DBOS Transact CLI helps you run applications locally.

## Commands

---

### `npx dbos start`

**Description:**
This command launches the DBOS Transact runtime and HTTP server to serve an application.
It registers all functions and serves all endpoints in classes and dependencies of the [declared entrypoint files](../configuration#runtime) (`dist/operations.js` by default).
Parameters set from the command line take precedence over parameters set in the [configuration file](../configuration).
You must compile your code (`npm run build`) before running this command.

**Parameters:**
- `-p, --port <port-number>`: The port on which to serve your functions.
- `-l, --loglevel <log-level>`: The severity of log entries emitted. Can be one of `debug`, `info`, `warn`, `error`, `emerg`, `crit`, `alert`.
- `-d, --appDir <application-directory>`: The path to your application root directory.

---

### `npx @dbos-inc/create`

**Description:**
This command initializes a new DBOS application from a template into a target directory.

**Parameters:**
- `-n, --appName <app-name>`: The name and directory to which to instantiate the application. Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).
- `-t, --templateName <template>`: The template to use for project creation. If not provided, will prompt with a list of available templates.

---

### `npx dbos migrate`

**Description:**
Run all migration commands specified in your [configuration file](../configuration) to apply your application's schema to the database.

---

### `npx dbos rollback`

**Description:**
Run all rollback commands specified in your [configuration file](../configuration) to roll back the last batch of schema migrations.

---

### `npx dbos configure`

**Description:**
This command configures which database server your application connects to.
It applies changes to your [configuration file](../configuration).
If parameters are not specified, it prompts for them.

**Parameters:**
- `-h, --host <string>`: Your Postgres server hostname (Default: `localhost`).
- `-p, --port <number>`: Your Postgres server port (Default: `5432`).
- `-U, --username <string>`: Your Postgres username (Default: `postgres`).

---

### `npx dbos reset`

Reset your DBOS [system database](../../../explanations/system-tables.md), deleting metadata about past workflows and steps.
No application data is affected by this.

**Parameters:**
- `--yes, -y`: Skip confirmation prompt.

---

### `npx dbos debug`

**Description:**
This command launches the DBOS runtime in debug mode to replay a specified workflow.
It is similar to `dbos start`, but instead of starting an HTTP server, it replays a single workflow and connects to a locally running DBOS [time travel debug proxy](../../../cloud-tutorials/timetravel-debugging.md#time-travel-with-dbos-cli-non-vs-code-users).
You must compile your code (`npm run build`) and start the debug proxy before running this command.

**Parameters:**
- `-u, --uuid <string>`: The workflow identity to replay.
- `-x, --proxy <string>`: The time travel debug proxy URL (default: "postgresql://localhost:2345").
- `-l, --loglevel <log-level>`: The severity of log entries emitted. Can be one of `debug`, `info`, `warn`, `error`, `emerg`, `crit`, `alert`.
- `-d, --appDir <application-directory>`: The path to your application root directory.

## Workflow Management Commands

### `npx dbos workflow list`

**Description:**
List workflows run by your application in JSON format ordered by recency (most recently started workflows last).

**Arguments:**
- `-n, --name <string>`                 Retrieve functions with this name
- `-l, --limit <number>`                Limit the results returned (default: "10") 
- `-u, --user <string>`                 Retrieve workflows run by this user
- `-s, --start-time <string>`           Retrieve workflows starting after this timestamp (ISO 8601 format)
- `-e, --end-time <string>`             Retrieve workflows starting before this timestamp (ISO 8601 format)
- `-S, --status <string>`               Retrieve workflows with this status (`PENDING`, `SUCCESS`, `ERROR`, `RETRIES_EXCEEDED`, `ENQUEUED`, or `CANCELLED`)
- `-v, --application-version <string>`  Retrieve workflows with this application version
- `--request`                           Retrieve workflow request information
- `-d, --appDir <string>`               Specify the application root directory

**Output:**
For each retrieved workflow, emit a JSON whose fields are:
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../../tutorials/instantiated-objects), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `workflowUUID`: The ID of the workflow
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object
- `request`: If the workflow was invoked via HTTP and this field was specified, the serialized request object

### `npx dbos workflow get`

**Description:**
Retrieve information on a workflow run by your application.

**Arguments:**
- `<workflow-uuid>`: The ID of the workflow to retrieve.
- `-d, --appDir <application-directory>`: The path to your application root directory.
- `--request`: Display workflow request information.

**Output:**
A JSON whose fields are:
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../../tutorials/instantiated-objects), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `workflowUUID`: The ID of the workflow
- `queueName`: The queue of the workflow, if enqueued.
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object
- `request`: If the workflow was invoked via HTTP and this field was specified, the serialized request object

### `npx dbos workflow cancel`

**Description:**
 Cancel a workflow so it is no longer automatically retried or restarted. Active executions are not halted.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to cancel.
- `-d, --appDir <application-directory>`: The path to your application root directory.

### `npx dbos workflow resume`

**Description:**
Resume a workflow from its last completed step.
You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an `ENQUEUED` workflow, bypassing its queue.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to resume.
- `-d, --appDir <application-directory>`: The path to your application root directory.

### `npx dbos workflow restart`

**Description:**
Start a new execution of a workflow with the same inputs.
This new workflow has a new workflow ID.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to restart.
- `-d, --appDir <application-directory>`: The path to your application root directory.

### `npx dbos workflow queue list`

**Description:**
Lists all currently enqueued workflows in JSON format ordered by recency (most recently enqueued workflows last).

**Arguments:**
- `-n, --name <string>`        Retrieve functions with this name
- `-s, --start-time <string>`  Retrieve functions starting after this timestamp (ISO 8601 format)
- `-e, --end-time <string>`    Retrieve functions starting before this timestamp (ISO 8601 format)
- `-S, --status <string>`      Retrieve functions with this status (PENDING, SUCCESS, ERROR, RETRIES_EXCEEDED, ENQUEUED, or CANCELLED)
- `-l, --limit <number>`       Limit the results returned
- `-q, --queue <string>`       Retrieve functions run on this queue
- `--request`                  Retrieve workflow request information
- `-d, --appDir <string>`      Specify the application root directory

**Output:**
For each retrieved workflow, emit a JSON whose fields are:
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../../tutorials/instantiated-objects), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `workflowUUID`: The ID of the workflow
- `queueName`: The queue of the workflow, if enqueued.
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object
- `request`: If the workflow was invoked via HTTP and this field was specified, the serialized request object