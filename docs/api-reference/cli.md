---
sidebar_position: 1
title: CLI
description: Operon CLI reference
---

The Operon CLI helps you manage Operon applications.

## Commands

---

### `npx operon start`

**Description:**  
This command launches the Operon runtime and HTTP server to serve an application.
It registers all functions and serves all endpoints in classes exported from `src/operations.ts`.
Parameters set from the command line take precedence over parameters set in the [configuration file](./configuration).

**Parameters:**  
- `-p, --port <port-number>`: The port on which to serve your functions.
- `-l, --loglevel <log-level>`: The severity of log entries emitted. Can be one of `debug`, `info`, `warn`, `error`, `emerg`, `crit`, `alert`.
- `-c, --configfile <config-file>`: The path to a YAML [configuration file](./configuration) to use.
- `-e, --entrypoint <entrypoint-file>`: The path to an [entrypoint file](./configuration) to use.

---

### `npx operon init`

**Description:**  
This command initializes a new Operon application from a template into a target directory. By default, it sets the "Hello, Database!" application used in the [quickstart](../getting-started/quickstart).

**Parameters:**  
- `-n, --appName <application-name>`: The name and directory to which to initialize the application.

### `npx operon openapi`

**Description:**  
This command generates an [OpenAPI 3.0.x](https://www.openapis.org/) definitions file for an Operon application. 
These definitions are saved to a file named `openapi.yaml` in the same folder as the TypeScript entrypoint file.
For more information, please see the [OpenAPI Tutorial](../tutorials/openapi-tutorial.md).

**Arguments:**  
- `<entrypoint>`: Path to the application's TypeScript entrypoint (typically `src/operations.ts`)
