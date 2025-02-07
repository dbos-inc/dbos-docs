---
sidebar_position: 6
title: DBOS CLI
---

## Commands

### dbos start

Start your DBOS application by executing the `start` command defined in [`dbos-config.yaml`](./configuration.md#runtime).
For example:

```yaml
runtimeConfig:
  start:
    - "fastapi run"
```

DBOS Cloud executes this command to start your app.

### dbos migrate

Run all database schema migration commands defined in [`dbos-config.yaml`](./configuration.md#database).
For example:

```yaml
database:
  migrate:
    - alembic upgrade head
```

DBOS Cloud uses this command during application deployment to migrate your database schema.

### dbos init

Initialize the local directory with a DBOS template application.

**Parameters:**
- `<application-name>`: The name of your application. If not specified, will be prompted for.
- `--template, -t <str>`: Specify a template to use. Currently, we have a single "hello" template, which is used by default.
- `--config, -c`: If this flag is set, only the `dbos-config.yaml` file is added from the template. Useful to add DBOS to an existing project.

### dbos reset

Reset your DBOS [system database](../../explanations/system-tables.md), deleting metadata about past workflows and steps.
No application data is affected by this.

**Parameters:**
- `--yes, -y`: Skip confirmation prompt.

## Workflow Management Commands

### dbos workflow list

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

**Output:**
For each retrieved workflow, emit a JSON whose fields are:
- `workflowUUID`: The ID of the workflow
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../reference/decorators.md#dbosconfiguredinstance), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `queueName`: The queue of the workflow, if enqueued.
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object
- `request`: If the workflow was invoked via HTTP and this field was specified, the serialized request object

### dbos workflow get

**Description:**
Retrieve information on a workflow run by your application.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to retrieve.
- `--request`: Display workflow request information.

**Output:**
A JSON whose fields are:
- `workflowUUID`: The ID of the workflow
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../reference/decorators.md#dbosconfiguredinstance), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `queueName`: The queue of the workflow, if enqueued.
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object
- `request`: If the workflow was invoked via HTTP and this field was specified, the serialized request object

### dbos workflow cancel

**Description:**
 Cancel a workflow so it is no longer automatically retried or restarted. Active executions are not halted.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to cancel.

### dbos workflow

**Description:**
Resume a workflow from its last completed step.
You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an `ENQUEUED` workflow, bypassing its queue.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to resume.
- `-d, --appDir <application-directory>`: The path to your application root directory.

### dbos workflow restart

**Description:**
Start a new execution of a workflow with the same inputs.
This new workflow has a new workflow ID.

**Arguments:**
- `<workflow-id>`: The ID of the workflow to restart.

### dbos workflow queue list

**Description:**
Lists all currently enqueued functions in JSON format ordered by recency (most recently enqueued functions last).

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
For each retrieved function, emit a JSON whose fields are:
- `workflowUUID`: The ID of the workflow
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../reference/decorators.md#dbosconfiguredinstance), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `queueName`: The queue of the workflow, if enqueued.
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object
- `request`: If the workflow was invoked via HTTP and this field was specified, the serialized request object