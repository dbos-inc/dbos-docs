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
Parameters set from the command line override parameters set in the [config file](./configuration).

**Parameters:**  
- `-p, --port <port-number>`: The port on which to serve the application.
- `-l, --logLevel <log-level>`: The log level at which to run the application. Must be one of `DEBUG`, `INFO`, `WARN`, `ERROR`.
- `-c, --configFile <config-file>`: The path to an [Operon configuration file](./configuration) to use for this application.

---

### `npx operon init`

**Description:**  
This command initializes a new Operon application from a template into a target directory. By default, the instantiated application is the "Hello, world!" application using [knex.js](https://knexjs.org/) used in the [quickstart](../getting-started/quickstart).

**Parameters:**  
- `-n, --appName <application-name>`: The name and directory to which to initialize the application.
