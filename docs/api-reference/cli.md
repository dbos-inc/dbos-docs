---
sidebar_position: 1
title: SDK CLI
description: DBOS CLI reference
---

The DBOS SDK CLI helps you run DBOS applications locally.

## Commands

---

### `npx dbos-sdk start`

**Description:**  
This command launches the DBOS runtime and HTTP server to serve an application.
It registers all functions and serves all endpoints in classes exported from the specified entrypoint file (typically `src/operations.ts`).
Parameters set from the command line take precedence over parameters set in the [configuration file](./configuration).
You must compile your code (`npm run build`) before running this command.

**Parameters:**  
- `-p, --port <port-number>`: The port on which to serve your functions.
- `-l, --loglevel <log-level>`: The severity of log entries emitted. Can be one of `debug`, `info`, `warn`, `error`, `emerg`, `crit`, `alert`.
- `-c, --configfile <config-file>`: The path to a YAML [configuration file](./configuration) to use.
- `-e, --entrypoint <entrypoint-file>`: The path to an [entrypoint file](./configuration) to use.

---

### `npx dbos-sdk init`

**Description:**  
This command initializes a new DBOS application from a template into a target directory. By default, it instantiates the "Hello, Database!" application used in the [quickstart](../getting-started/quickstart).

**Parameters:**  
- `-n, --appName <app-name>`: The name and directory to which to instantiate the application. Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).

---

### `npx dbos-sdk migrate`

**Description:**
Run all migration commands specified in your [configuration file](./configuration) to apply your application's schema to the database.

---

### `npx dbos-sdk rollback`

**Description:**
Run all rollback commands specified in your [configuration file](./configuration) to roll back the last batch of schema migrations.

---

### `npx dbos-sdk debug`

**Description:**
This command launches the DBOS runtime in debug mode to replay a specified workflow.
It is similar to `dbos-sdk start`, but instead of starting an HTTP server, it replays a single workflow and connects to a locally running DBOS [time travel debug proxy](../cloud-tutorials/timetravel-debugging.md#alternative-debug-mode-non-vscode).
You must compile your code (`npm run build`) and start the debug proxy before running this command.

**Parameters:**
- `-u, --uuid <string>`: The workflow identity to replay.
- `-x, --proxy <string>`: The time travel debug proxy URL (default: "postgresql://localhost:2345").
- `-l, --loglevel <log-level>`: The severity of log entries emitted. Can be one of `debug`, `info`, `warn`, `error`, `emerg`, `crit`, `alert`.
- `-c, --configfile <config-file>`: The path to a YAML [configuration file](./configuration) to use.
- `-e, --entrypoint <entrypoint-file>`: The path to an [entrypoint file](./configuration) to use.

---

### `npx dbos-openapi generate`

**Description:**  
This command generates an [OpenAPI 3.0.x](https://www.openapis.org/) definition file for a DBOS application.
The generated file is named `openapi.yaml` and is saved to the same directory as the TypeScript entrypoint file.
For more information, please see the [OpenAPI Tutorial](../tutorials/openapi-tutorial.md).

**Arguments:**  
- `<entrypoint>`: Path to the application's TypeScript entrypoint (typically `src/operations.ts`)
