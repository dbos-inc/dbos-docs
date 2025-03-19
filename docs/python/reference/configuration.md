---
sidebar_position: 7
title: Configuration
description: DBOS configuration reference
pagination_next: null
---

You can configure the DBOS library programmatically when instantiating the [DBOS Class](dbos-class#dbosconfig), or using a configuration file.
This section describes the configuration file. CLI tools like [dbos migrate](cli#dbos-migrate) rely on the configuration file.

Valid configuration files must be:
- Named `dbos-config.yaml`
- Located at the application package root.
- Valid [YAML](https://yaml.org/) conforming to the schema described below.

::::info
You can use environment variables for configuration values through the syntax `key: ${VALUE}`. They are expanded during `dbos start` or `dbos-cloud app deploy` and passed to the app securely. We strongly recommend using environment variables for secrets like the database password, as demonstrated below. 
::::

---

### Fields

Each `dbos-config.yaml` file has the following fields and sections:

- **language**: The application language field. Must be set to `python` for Python applications.
- **database_url**: The [database_url](#database_url) section.
- **database**: The [database](#database) section.
- **runtimeConfig**: The [runtime](#runtime) section.
- **telemetry**: The [telemetry](#telemetry) section.

---

### database_url

The database_url field is used to declare a connection string pointing to your application database.
DBOS currently only supports Postgres-compatible databases.
The supported format is `postgres://[username]:[password]@[hostname]:[port]/[database name]`. The `sslmode=require`, `sslrootcert` and `connect_timeout` parameter keywords are also supported.
See the [Postgres docs](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS) for connection strings examples.

::::info
The role with which DBOS connects to Postgres must have [`CREATE`](https://www.postgresql.org/docs/current/ddl-priv.html#DDL-PRIV-CREATE) privileges on both the application database and system database if they already exist.
If either does not exist, the Postgres role must have the [`CREATEDB`](https://www.postgresql.org/docs/current/sql-createdatabase.html) privilege to create them.
::::


---

### database

The database section is used to configure database parameters not related to connections:
- **migrate**: A list of commands to run to apply your application's schema to the database. 
- **sys_db_name**: Name of the [system database](../../explanations/system-tables) in which DBOS stores internal state. Defaults to `{app_db_name}_dbos_sys`. For local deployment only, not used in DBOS Cloud.
- **local_suffix**: Whether to suffix `app_db_name` with '_local'. Set to true when doing local development using a DBOS Cloud database. For local development only, not used in DBOS Cloud.

**Example**:

```yaml
database:
  sys_db_name: 'my_dbos_system_db'
  migrate:
    - alembic upgrade head
```

---

### Runtime

This section is used to specify DBOS runtime parameters.

- **start**: The command(s) with which to start your app. Called from `dbos start`.
- **setup**: Setup commands to run before your application is built in DBOS Cloud. Used only in DBOS Cloud. Documentation [here](../../production/dbos-cloud/application-management.md#customizing-microvm-setup)

**Example**:

```yaml
runtimeConfig:
  start:
    - "fastapi run"
```
---

### Telemetry

You can use the configuration file to tune the behavior of DBOS logging facility.
Note all options in this section are optional and will, if not specified, use the default values indicated in the example below.

#### Logs
- **logLevel**: Filters, by severity, what logs should be printed by the [DBOS logger](../tutorials/logging-and-tracing#logging). Defaults to `'INFO'`.

**Example**:

```yaml
telemetry:
  logs:
    logLevel: 'INFO'
```

---

#### OTLPExporter
Configures the Transact OpenTelemetry exporter.
- **logsEndpoint**: The endpoint to which logs are sent.
- **tracesEndpoint**: The endpoint to which traces are sent.

The Transact exporter uses [protobuf over HTTP](https://www.npmjs.com/package/@opentelemetry/exporter-trace-otlp-proto). An example configuration for a local Jaeger instance with default configuration is shown below.

**Example**:

```yaml
telemetry:
  OTLPExporter:
    logsEndpoint: 'http://localhost:4318/v1/logs'
    tracesEndpoint: 'http://localhost:4318/v1/traces'
```

### Configuration Schema File

There is a schema file available for the DBOS configuration file schema [in our GitHub repo](https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json).
This schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.
For example, the Visual Studio Code [RedHat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) provides tooltips, statement completion and real-time validation for editing DBOS config files.
This extension provides [multiple ways](https://github.com/redhat-developer/vscode-yaml#associating-schemas) to associate a YAML file with its schema.
The easiest is to simply add a comment with a link to the schema at the top of the config file:

```yaml
# yaml-language-server: $schema=https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json
```

### Accessing Configuration From Code

The information in `dbos-config.yaml` can be accessed from python code using `DBOS.config`.

```python
lang = DBOS.config["language"]  # "python"
url = DBOS.config["application"]["service_url"]
```
