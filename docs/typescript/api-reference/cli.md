---
sidebar_position: 1
title: DBOS Transact CLI
description: DBOS Transact CLI reference
---

The DBOS Transact CLI helps you run applications locally.

## Commands

---

### `npx dbos start`

**Description:**
This command launches the DBOS Transact runtime and HTTP server to serve an application.
It registers all functions and serves all endpoints in classes and dependencies of the [declared entrypoint files](./configuration#runtime) (`dist/operations.js` by default).
Parameters set from the command line take precedence over parameters set in the [configuration file](./configuration).
You must compile your code (`npm run build`) before running this command.

**Parameters:**
- `-p, --port <port-number>`: The port on which to serve your functions.
- `-l, --loglevel <log-level>`: The severity of log entries emitted. Can be one of `debug`, `info`, `warn`, `error`, `emerg`, `crit`, `alert`.
- `-d, --appDir <application-directory>`: The path to your application root directory.

---

### `npx @dbos-inc/create`

**Synonyms**
`npm create @dbos-inc` and `npm init @dbos-inc` are synonyms for `npx @dbos-inc/create`.  When using `npm create @dbos-inc` with any of the command line switches below, be sure to use `--` to separate `npm` arguments from the arguments intended for `@dbos-inc/create`.

**Description:**
This command initializes a new DBOS application from a template into a target directory. By default, it instantiates the "Hello, Database!" application used in the [quickstart](../getting-started/quickstart).

**Parameters:**
- `-n, --appName <app-name>`: The name and directory to which to instantiate the application. Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).
- `-t, --templateName <template>`: The template to use for project creation, such as 'hello'.

---

### `npx dbos migrate`

**Description:**
Run all migration commands specified in your [configuration file](./configuration) to apply your application's schema to the database.

---

### `npx dbos rollback`

**Description:**
Run all rollback commands specified in your [configuration file](./configuration) to roll back the last batch of schema migrations.

---

### `npx dbos configure`

**Description:**
This command configures which database server your application connects to.
It applies changes to your [configuration file](./configuration).
If parameters are not specified, it prompts for them.

**Parameters:**
- `-h, --host <string>`: Your Postgres server hostname (Default: `localhost`).
- `-p, --port <number>`: Your Postgres server port (Default: `5432`).
- `-U, --username <string>`: Your Postgres username (Default: `postgres`).

---

### `npx dbos debug`

**Description:**
This command launches the DBOS runtime in debug mode to replay a specified workflow.
It is similar to `dbos start`, but instead of starting an HTTP server, it replays a single workflow and connects to a locally running DBOS [time travel debug proxy](../cloud-tutorials/timetravel-debugging.md#time-travel-with-dbos-cli-non-vs-code-users).
You must compile your code (`npm run build`) and start the debug proxy before running this command.

**Parameters:**
- `-u, --uuid <string>`: The workflow identity to replay.
- `-x, --proxy <string>`: The time travel debug proxy URL (default: "postgresql://localhost:2345").
- `-l, --loglevel <log-level>`: The severity of log entries emitted. Can be one of `debug`, `info`, `warn`, `error`, `emerg`, `crit`, `alert`.
- `-d, --appDir <application-directory>`: The path to your application root directory.

---

### `npx dbos-openapi generate`

**Description:**
This command generates an [OpenAPI 3.0.x](https://www.openapis.org/) definition file for a DBOS application.
The generated file is named `openapi.yaml` and is saved to the same directory as the TypeScript entrypoint file.
For more information, please see the [OpenAPI Tutorial](../tutorials/openapi-tutorial.md).

**Arguments:**
- `<entrypoints>`: Path to the application's TypeScript entrypoints (for example, `src/a.ts src/b.ts`)

## Workflow Management Commands

### `npx dbos workflow list`

**Description:**
This command lists workflows run by your application in JSON format ordered by recency (most recent workflows last).

**Arguments:**
- `-l, --limit <string>`: The number of results to retrieve (only the most recent results are returned). Defaults to 10.
- `-u, --user <string>`: Retrieve results run by this user.
- `-s, --start-time <string>`: Retrieve workflows starting after this timestamp (ISO 8601 format).
- `-e, --end-time <string>`: Retrieve workflows starting before this timestamp (ISO 8601 format).
- `-S, --status <string>`: Retrieve workflows with this status (`PENDING`, `SUCCESS`, `ERROR`, `RETRIES_EXCEEDED`, or `CANCELLED`)
- `-d, --appDir <application-directory>`: The path to your application root directory.
- `--request`: Display workflow request information.

**Output:**
For each retrieved workflow, emit a JSON whose fields are:
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../tutorials/configured-instances.md), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `workflowUUID`: The UUID of the workflow
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object
- `request`: If the workflow was invoked via HTTP and this field was specified, the serialized request object

### `npx dbos workflow get`

**Description:**
Retrieve information on a workflow run by your application.

**Arguments:**
- `<workflow-uuid>`: The UUID of the workflow to retrieve.
- `-d, --appDir <application-directory>`: The path to your application root directory.
- `--request`: Display workflow request information.

**Output:**
A JSON whose fields are:
- `status`: The status of the workflow
- `workflowName`: The name of the workflow function
- `workflowClassName`: The name of the class in which the workflow function is implemented
- `workflowConfigName`: If the workflow is in a [configured class](../tutorials/configured-instances.md), the name of the configuration
- `authenticatedUser`: The user who ran the workflow, if specified
- `assumedRole`: The role with which the workflow ran, if specified
- `authenticatedRoles`: All roles which the authenticated user could assume
- `workflowUUID`: The UUID of the workflow
- `input`: The input arguments to the workflow, in array format
- `output`: If the workflow completed successfuly, its output
- `error`: If the workflow threw an error, the serialized error object
- `request`: If the workflow was invoked via HTTP and this field was specified, the serialized request object

### `npx dbos workflow cancel`

**Description:**
 Cancel a workflow so it is no longer automatically retried or restarted. Active executions are not halted and the workflow can still be manually retried or restarted.

**Arguments:**
- `<workflow-uuid>`: The UUID of the workflow to cancel.
- `-d, --appDir <application-directory>`: The path to your application root directory.

### `npx dbos workflow resume`

**Description:**
Retries a workflow from the last step it executed, keeping its UUID.

**Arguments:**
- `<workflow-uuid>`: The UUID of the workflow to resume.
- `-d, --appDir <application-directory>`: The path to your application root directory.

### `npx dbos workflow restart`

**Description:**
Resubmits a workflow, restarting it from the beginning with the same arguments but a new UUID.

**Arguments:**
- `<workflow-uuid>`: The UUID of the workflow to restart.
- `-d, --appDir <application-directory>`: The path to your application root directory.