---
sidebar_position: 50
title: Configuration
---

## Configuring DBOS

To configure DBOS, pass in a configuration with `DBOS.setConfig` before you call `DBOS.launch`.
For example:

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
});
await DBOS.launch();
```

A configuration object has the following fields.
All fields except `name` are optional.

```javascript
export interface DBOSConfig {
  name?: string;
  readonly databaseUrl?: string;
  readonly userDbclient?: UserDatabaseName;
  readonly sysDbName?: string;
  readonly userDbPoolSize?: number;
  readonly sysDbPoolSize?: number;
  readonly logLevel?: string;
  readonly otlpTracesEndpoints?: string[];
  readonly runAdminServer?: boolean;
  readonly adminPort?: number;
}
```

- **name**: Your application's name.
- **databaseUrl**: A connection string to a Postgres database. The supported format is
```
postgresql://[username]:[password]@[hostname]:[port]/[database name]
```
The `sslmode=require`, `sslmode=verify-full`, `sslrootcert` and `connect_timeout` parameter keywords are also supported.
Defaults to:
```
postgresql://postgres:dbos@localhost:5432/[application name]
```
- **userDbclient**: If using DBOS transactions, the database client to use. Must be one of `knex`, `drizzle`, `typeorm`, or `prisma`.  Defaults to `knex`.
- **sysDbName**: Name for the [system database](../../explanations/system-tables) in which DBOS stores internal state. Defaults to `{database name}_dbos_sys`.
- **userDbPoolSize**: The size of the connection pool used by [transactions](../tutorials/transaction-tutorial.md) to connect to your application database. Defaults to 20.
- **sysDbPoolSize**: The size of the connection pool used for the [DBOS system database](../../explanations/system-tables). Defaults to 2.
- **logLevel**: Configure the [DBOS logger](../tutorials/logging.md) severity. Defaults to `info`.
- **otlpTracesEndpoints**: DBOS operations [automatically generate OpenTelemetry Traces](../tutorials/logging.md). Use this field to declare a list of OTLP-compatible receivers.
- **runAdminServer**: Whether to run an [HTTP admin server](../../production/self-hosting/admin-api.md) for workflow management operations. Defaults to True.
- **adminPort**: The port on which the admin server runs. Defaults to 3001.


## DBOS Configuration File

Many tools in the DBOS ecosystem are configured by a `dbos-config.yaml` file.
Tools that use `dbos-config.yaml` include the [DBOS CLI](./tools/cli.md), [DBOS debugger](../tutorials/debugging.md), and [DBOS Cloud](../../production/dbos-cloud/deploying-to-cloud.md).
Additionally, the DBOS library will fall back to `dbos-config.yaml` if no configuration object is provided.

Here is an example configuration file with default parameters:

```shell
name: my-app
language: node
database_url: ${DBOS_DATABASE_URL}
runtimeConfig:
  start:
    - node dist/main.js
```

### Configuration File Fields

::::info
You can use environment variables for configuration values through the syntax `field: ${VALUE}`.
::::

Each `dbos-config.yaml` file has the following fields and sections:

- **name**: Your application's name. Must match the name supplied to the DBOS constructor.
- **language**: The application language. Must be set to `node` for TypeScript applications.
- **database_url**: A connection string to a Postgres database. This connection string is used by tools such as the [DBOS CLI](./tools/cli.md) and [DBOS debugger](../tutorials/debugging.md). It has the same format as (and should match) the connection string you pass to the DBOS constructor.
- **database**: The [database section](#database-section).
- **runtimeConfig**: The [runtime section](#runtime-section).

#### Database Section

- **migrate**: A list of commands to run to apply your application's schema to the database. 
- **sys_db_name**: Name for the [system database](../../explanations/system-tables) in which DBOS stores internal state. Defaults to `{database name}_dbos_sys`.

**Example**:

```yaml
database:
  sys_db_name: 'my_dbos_system_db'
  migrate:
    - npx knex migrate:latest
```

#### Runtime Section

- **start**: The command(s) with which to start your app. Called from [`npx dbos start`](./tools/cli.md#npx-dbos-start), which is used to start your app in DBOS Cloud.
- **entrypoints** (optional): The compiled JavaScript files where DBOS looks for your application's code. This should only be used if you are using scheduled workflows, Kafka consumers, or DBOS HTTP decorators in files that are not referenced by your start command. At startup, the DBOS runtime automatically loads all classes exported from these files, serving their endpoints and registering their decorated functions. Defaults to [dist/operations.js].
- **setup**: (optional) Setup commands to run before your application is built in DBOS Cloud. Used only in DBOS Cloud. Documentation [here](../../production/dbos-cloud/application-management.md#customizing-microvm-setup).

**Example**:

```yaml
runtimeConfig:
  start:
    - "node dist/main.js"
```

### Configuration Schema File

There is a schema file available for the DBOS configuration file schema [in GitHub](https://raw.githubusercontent.com/dbos-inc/dbos-ts/main/dbos-config.schema.json).
This schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.
For example, the Visual Studio Code [RedHat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) provides tooltips, statement completion and real-time validation for editing DBOS config files.
This extension provides [multiple ways](https://github.com/redhat-developer/vscode-yaml#associating-schemas) to associate a YAML file with its schema.
The easiest is to simply add a comment with a link to the schema at the top of the config file:

```yaml
# yaml-language-server: $schema=https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json
```
