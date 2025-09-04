---
sidebar_position: 100
title: DBOS CLI
---

## Workflow Management Commands

All workflow management commands first attempt to retrieve your DBOS system database URL from [`dbos-config.yaml`](./configuration.md#dbos-configuration-file), then from the `DBOS_SYSTEM_DATABASE_URL` environment variable.

### `npx dbos workflow list`

**Description:**
List workflows run by your application in JSON format ordered by recency (most recently started workflows last).

**Arguments:**
- `-n, --name <string>`                 Retrieve functions with this name
- `-l, --limit <number>`                Limit the results returned (default: "10") 
- `-u, --user <string>`                 Retrieve workflows run by this user
- `-s, --start-time <string>`           Retrieve workflows starting after this timestamp (ISO 8601 format)
- `-e, --end-time <string>`             Retrieve workflows starting before this timestamp (ISO 8601 format)
- `-S, --status <string>`               Retrieve workflows with this status (`PENDING`, `SUCCESS`, `ERROR`, `MAX_RECOVERY_ATTEMPTS_EXCEEDED`, `ENQUEUED`, or `CANCELLED`)
- `-v, --application-version <string>`  Retrieve workflows with this application version

**Output:**
For each retrieved workflow, emit a JSON whose fields are:
- `workflowUUID`: The ID of the workflow
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../tutorials/instantiated-objects.md), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `queueName`: The queue of the workflow, if enqueued.
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object

### `npx dbos workflow get`

**Description:**
Retrieve information on a workflow run by your application.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to retrieve.

**Output:**
A JSON whose fields are:
- `workflowUUID`: The ID of the workflow
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../tutorials/instantiated-objects), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `queueName`: The queue of the workflow, if enqueued.
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object

### `npx dbos workflow steps`

**Arguments:**
- `<workflow-id>`: The ID of the workflow to retrieve

**Output:**
A JSON-formatted list of [workflow steps](./methods.md#dboslistworkflowsteps).

### `npx dbos workflow cancel`

**Description:**
 Cancel a workflow so it is no longer automatically retried or restarted. Active executions are not halted.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to cancel.

### `npx dbos workflow resume`

**Description:**
Resume a workflow from its last completed step.
You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an `ENQUEUED` workflow, bypassing its queue.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to resume.

### `npx dbos workflow queue list`

**Description:**
Lists all currently enqueued workflows in JSON format ordered by recency (most recently enqueued workflows last).

**Arguments:**
- `-n, --name <string>`        Retrieve functions with this name
- `-s, --start-time <string>`  Retrieve functions starting after this timestamp (ISO 8601 format)
- `-e, --end-time <string>`    Retrieve functions starting before this timestamp (ISO 8601 format)
- `-S, --status <string>`      Retrieve functions with this status (PENDING, SUCCESS, ERROR, MAX_RECOVERY_ATTEMPTS_EXCEEDED, ENQUEUED, or CANCELLED)
- `-l, --limit <number>`       Limit the results returned
- `-q, --queue <string>`       Retrieve functions run on this queue
- `-d, --appDir <string>`      Specify the application root directory

**Output:**
For each retrieved workflow, emit a JSON whose fields are:
- `workflowUUID`: The ID of the workflow
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../tutorials/instantiated-objects), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `queueName`: The queue of the workflow, if enqueued.
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object


## Application Management Commands

### `npx dbos schema`

**Description:**
Create the DBOS system database and internal tables.
By default, a DBOS application automatically creates these on startup.
However, in production environments, a DBOS application may not run with sufficient privilege to create databases or tables.
In that case, this command can be run with a privileged user to create all DBOS database tables.

After creating the DBOS database tables with this command, a DBOS application can run with minimum permissions, requiring only access to the DBOS schema in the application and system databases.
Use the `-r` flag to grant a role access to that schema.

**Arguments:**

- `systemDatabaseUrl`:  A connection string for your DBOS [system database](../../explanations/system-tables.md), in which DBOS stores its internal state. This command will create that database if it does not exist and create or update the DBOS system tables within it.
- `-r, --app-role`: The role with which you will run your DBOS app. This role is granted the minimum permissions needed to access the DBOS schema in your system database.

### `npx dbos reset`

Reset your DBOS [system database](../../explanations//system-tables.md), deleting metadata about past workflows and steps.
**Use only in a development environment.**

**Arguments:**
- `--sys-db-url, -s <string>`: Your DBOS system database URL
- `--yes, -y`: Skip confirmation prompt.

### `npx @dbos-inc/create`

**Description:**
This command initializes a new DBOS application from a template into a target directory.

**Arguments:**
- `-n, --appName <app-name>`: The name and directory to which to instantiate the application. Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).
- `-t, --templateName <template>`: The template to use for project creation. If not provided, will prompt with a list of available templates.


### `npx dbos start`

**Description:**
Start your DBOS application by executing the `start` command defined in [`dbos-config.yaml`](./configuration.md#runtime-section).
For example:

```yaml
runtimeConfig:
  start:
    - "node dist/main.js"
```

DBOS Cloud executes this command to start your app.
