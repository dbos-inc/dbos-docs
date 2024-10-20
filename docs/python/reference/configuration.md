---
sidebar_position: 7
title: Configuration
description: DBOS configuration reference
pagination_next: null
---

You can configure DBOS with a configuration file.
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
- **database**: The [database](#database) section.
- **runtimeConfig**: The [runtime](#runtime) section.
- **env**: The [environment variables](#environment-variables) section.
- **telemetry**: The [telemetry](#telemetry) section.

---

### Database

The database section is used to set up the connection to the database.
DBOS currently only supports Postgres-compatible databases.
Every field is required unless otherwise specified.

- **hostname**: Database server hostname. For local deployment only, not used in DBOS Cloud.
- **port**: Database server port. For local deployment only, not used in DBOS Cloud.
- **username**: Username with which to connect to the database server. For local deployment only, not used in DBOS Cloud.
- **password**: Password with which to connect to the database server.  We recommend using an environment variable for this field, instead of plain text. For local deployment only, not used in DBOS Cloud.
- **app_db_name**: (optional): Name of the application database. If not supplied, the application name is used instead.
- **sys_db_name** (optional): Name of the system database in which DBOS stores internal state. Defaults to `{app_db_name}_dbos_sys`.  For local deployment only, not used in DBOS Cloud.
- **ssl_ca** (optional): If using SSL/TLS to securely connect to a database, path to an SSL root certificate file.  Equivalent to the [`sslrootcert`](https://www.postgresql.org/docs/current/libpq-ssl.html) connection parameter in `psql`.
- **local_suffix** (optional): Whether to suffix `app_db_name` with '_local'. Set to true when doing local development using a DBOS Cloud database. For local development only, not used in DBOS Cloud.
- **migrate** (optional): A list of commands to run to apply your application's schema to the database. 


**Example**:

```yaml
database:
  hostname: 'localhost'
  port: 5432
  username: 'postgres'
  password: ${PGPASSWORD}
  migrate:
    - alembic upgrade head
```

::::info
The role with which DBOS connects to Postgres must have [`CREATE`](https://www.postgresql.org/docs/current/ddl-priv.html#DDL-PRIV-CREATE) privileges on both the application database and system database if they already exist.
If either does not exist, the Postgres role must have the [`CREATEDB`](https://www.postgresql.org/docs/current/sql-createdatabase.html) privilege to create them.
::::

---

### Runtime

This section is used to specify DBOS runtime parameters.

- **start**: The command(s) with which to start your app. Called from `dbos start`.

**Example**:

```yaml
runtimeConfig:
  start:
    - "fastapi run"
```
---

### Environment Variables

Applications can optionally use the `env` configuration to define environment variables.
These are set in your application before its code is initialized and can be retrieved from `os.environ` like any other environment variables.
For example, the `WEB_PORTAL` variable set below could be retrieved from an application as `os.environ["WEB_PORTAL"]`.
Environment variables configured here are automatically exported to and set in DBOS Cloud.

**Example**:
```yaml
env:
  WEB_PORTAL: 'https://example.com'
```

```python
  portal_url=os.environ.get('WEB_PORTAL', '')
```

---

### Application

Applications can optionally keep a hierarchy of configuration information in the `application` section of the configuration file.
The schema for this section is defined by the application.
The configuration is available to your application when its code is initialized.

**Example**:
```yaml
application:
  service_url: 'https://service.org'
  service_config:
    user: "user"
    password: "password"
```

```python
url = DBOS.config["application"]["service_url"]
pass = DBOS.config["application"]["service_config"]["password"]
```

---

### Telemetry

You can use the configuration file to tune the behavior of DBOS logging facility.
Note all options in this section are optional and will, if not specified, use the default values indicated in the example below.

#### Logs
- **logLevel**: Filters, by severity, what logs should be printed. Defaults to `'INFO'`.

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
    logsEndpoint: 'http://localhost:4318'
    tracesEndpoint: 'http://localhost:4318'
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
