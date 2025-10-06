---
sidebar_position: 60
title: Configuration
---

## Configuring DBOS

To configure DBOS, pass in a configuration with `DBOS.setConfig` before you call `DBOS.launch`.
For example:

```javascript
DBOS.setConfig({
  name: 'my-app',
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
});
await DBOS.launch();
```

A configuration object has the following fields.
All fields except `name` are optional.

```javascript
export interface DBOSConfig {
  name?: string;

  systemDatabaseUrl?: string;
  systemDatabasePoolSize?: number;
  systemDatabasePool?: Pool;

  enableOTLP?: boolean;
  logLevel?: string;
  otlpLogsEndpoints?: string[];
  otlpTracesEndpoints?: string[];

  runAdminServer?: boolean;
  adminPort?: number;

  applicationVersion?: string;
}
```

- **name**: Your application's name.
- **systemDatabaseUrl**: A connection string to a Postgres database in which [DBOS can store internal state](../../explanations/system-tables.md). The supported format is:
```
postgresql://[username]:[password]@[hostname]:[port]/[database name]
```

The default is:

```
postgresql://postgres:dbos@localhost:5432/[application name]_dbos_sys
```
If the Postgres database referenced by this connection string does not exist, DBOS will attempt to create it.
- **systemDatabasePoolSize**: The size of the connection pool used for the [DBOS system database](../../explanations/system-tables). Defaults to 10.
- **systemDatabasePool**: A custom `node-postgres` connection pool to use to connect to your system database. If provided, DBOS will not create a connection pool but use this instead.
- **enableOTLP**: Enable DBOS OpenTelemetry [tracing and export](../tutorials/logging.md). Defaults to False.
- **logLevel**: Configure the [DBOS logger](../tutorials/logging.md) severity. Defaults to `info`.
- **otlpTracesEndpoints**: DBOS operations [automatically generate OpenTelemetry Traces](../tutorials/logging.md). Use this field to declare a list of OTLP-compatible receivers.
- **otlpLogsEndpoints**: DBOS operations [automatically generate OpenTelemetry Logs](../tutorials/logging.md). Use this field to declare a list of OTLP-compatible receivers.
- **runAdminServer**: Whether to run an [HTTP admin server](../../production/self-hosting/admin-api.md) for workflow management operations. Defaults to True.
- **adminPort**: The port on which the admin server runs. Defaults to 3001.
- **applicationVersion**: The code version for this application and its workflows. Workflow versioning is documented [here](../tutorials/workflow-tutorial.md#workflow-versioning-and-recovery).


## DBOS Configuration File

Some tools in the DBOS ecosystem, including [DBOS Cloud](../../production/dbos-cloud/deploying-to-cloud.md) and the [DBOS CLI](./cli.md), are configured by a `dbos-config.yaml` file.

Here is an example configuration file with default parameters:

```shell
name: my-app
language: node
system_database_url: ${DBOS_SYSTEM_DATABASE_URL}
runtimeConfig:
  start:
    - node dist/main.js
```

### Configuration File Fields

::::info
You can use environment variables for configuration values through the syntax `field: ${VALUE}`.
::::

Each `dbos-config.yaml` file has the following fields and sections:

- **name**: Your application's name.  Must match the name supplied to `DBOS.setConfig()`.
- **language**: The application language.  Must be set to `node` for TypeScript applications.
- **system_database_url**: The connection string to your DBOS system database.
This connection string is used by the DBOS [CLI](cli.md) and [debugger](../tutorials/debugging.md).
It has the same format as the `system_database_url` you pass to the DBOS constructor.
- **runtimeConfig**:
  - **start**: (required only in DBOS Cloud) The command(s) with which to start your app. Called from [`npx dbos start`](./cli.md#npx-dbos-start), which is used to start your app in DBOS Cloud.
  - **setup**: (optional) Setup commands to run before your application is built in DBOS Cloud. Used only in DBOS Cloud. Documentation [here](../../production/dbos-cloud/application-management.md#customizing-microvm-setup).

### Configuration Schema File

There is a schema file available for the DBOS configuration file schema [in GitHub](https://raw.githubusercontent.com/dbos-inc/dbos-ts/main/dbos-config.schema.json).
This schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.
For example, the Visual Studio Code [RedHat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) provides tooltips, statement completion and real-time validation for editing DBOS config files.
This extension provides [multiple ways](https://github.com/redhat-developer/vscode-yaml#associating-schemas) to associate a YAML file with its schema.
The easiest is to simply add a comment with a link to the schema at the top of the config file:

```yaml
# yaml-language-server: $schema=https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json
```
