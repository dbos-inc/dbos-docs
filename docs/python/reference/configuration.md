---
sidebar_position: 12
title: Configuration
---

## Configuring DBOS

To configure DBOS, pass a `DBOSConfig` object to its constructor.
For example:

```python
config: DBOSConfig = {
    "name": "dbos-example",
    "database_url": os.environ["DBOS_DATABASE_URL"],
}
DBOS(config=config)
```

The `DBOSConfig` object has the following fields.
All fields except `name` are optional.

```python
class DBOSConfig(TypedDict):
    name: str
    database_url: Optional[str]
    system_database_url: Optional[str]
    sys_db_pool_size: Optional[int]
    db_engine_kwargs: Optional[Dict[str, Any]]
    log_level: Optional[str]
    otlp_traces_endpoints: Optional[List[str]]
    otlp_logs_endpoints: Optional[List[str]]
    otlp_attributes: Optional[dict[str, str]]
    admin_port: Optional[int]
    run_admin_server: Optional[bool]
    application_version: Optional[str]
```

- **name**: Your application's name.
- **database_url**: A connection string to a Postgres database. DBOS uses this connection string, unmodified, to create a [SQLAlchemy engine](https://docs.sqlalchemy.org/en/20/core/engines.html).
A valid connection string looks like:

```
postgresql://[username]:[password]@[hostname]:[port]/[database name]
```

:::info
SQLAlchemy requires passwords in connection strings to be escaped if they contain special characters (e.g., with [urllib](https://docs.python.org/3/library/urllib.parse.html#urllib.parse.quote)).
:::

If no connection string is provided, DBOS uses this default:

```shell
postgresql://postgres:dbos@localhost:5432/application_name?connect_timeout=10
```

- **db_engine_kwargs**: Additional keyword arguments passed to SQLAlchemy’s [`create_engine()`](https://docs.sqlalchemy.org/en/20/core/engines.html#sqlalchemy.create_engine), applied to both the application and [system database](../../explanations/system-tables) engines. Defaults to:
```python
{
  "pool_size": 20,
  "max_overflow": 0,
  "pool_timeout": 30,
}
```
- **system_database_url**: A connection string to a Postgres database, used to create the [system database](../../explanations/system-tables.md) in which DBOS stores internal state. If not supplied, system database is created using `database_url` suffixing the database name with `_dbos_sys`
- **sys_db_pool_size**: The size of the connection pool used for the [DBOS system database](../../explanations/system-tables). Defaults to 20.
- **otlp_traces_endpoints**: DBOS operations [automatically generate OpenTelemetry Traces](../tutorials/logging-and-tracing#tracing). Use this field to declare a list of OTLP-compatible trace receivers.
- **otlp_logs_endpoints**: the DBOS logger can export OTLP-formatted log signals. Use this field to declare a list of OTLP-compatible log receivers.
- **otlp_attributes**: A set of attributes (key-value pairs) to apply to all OTLP-exported logs and traces.
- **log_level**: Configure the [DBOS logger](../tutorials/logging-and-tracing#logging) severity. Defaults to `INFO`.
- **run_admin_server**: Whether to run an [HTTP admin server](../../production/self-hosting/admin-api.md) for workflow management operations. Defaults to True.
- **admin_port**: The port on which the admin server runs. Defaults to 3001.
- **application_version**: The code version for this application and its workflows. Workflow versioning is documented [here](../tutorials/workflow-tutorial.md#workflow-versioning-and-recovery).


## DBOS Configuration File


Some tools in the DBOS ecosystem, including [DBOS Cloud](../../production/dbos-cloud/deploying-to-cloud.md) and the [DBOS debugger](../tutorials/debugging.md), are configured by a `dbos-config.yaml` file.

You can create a `dbos-config.yaml` with default parameters with:

```shell
dbos init <app-name> --config
```

### Configuration File Fields

::::info
You can use environment variables for configuration values through the syntax `field: ${VALUE}`.
::::

Each `dbos-config.yaml` file has the following fields and sections:

- **name**: Your application's name. Must match the name supplied to the DBOS constructor.
- **language**: The application language. Must be set to `python` for Python applications.
- **database_url**: A connection string to a Postgres database. This connection string is used only by the [DBOS debugger](../tutorials/debugging.md). It has the same format as the connection string you pass to the DBOS constructor.
- **database**: The [database section](#database-section).
- **runtimeConfig**: The [runtime section](#runtime-section).

#### Database Section

- **migrate**: A list of commands to run to apply your application's schema to the database. 

**Example**:

```yaml
database:
  migrate:
    - alembic upgrade head
```

#### Runtime Section

- **start**: The command(s) with which to start your app. Called from [`dbos start`](../reference/cli.md#dbos-start), which is used to start your app in DBOS Cloud.
- **setup**: Setup commands to run before your application is built in DBOS Cloud. Used only in DBOS Cloud. Documentation [here](../../production/dbos-cloud/application-management.md#customizing-microvm-setup).

**Example**:

```yaml
runtimeConfig:
  start:
    - "fastapi run"
```

### Configuration Schema File

There is a schema file available for the DBOS configuration file schema [on GitHub](https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json).
This schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.
For example, the Visual Studio Code [RedHat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) provides tooltips, statement completion and real-time validation for editing DBOS config files.
This extension provides [multiple ways](https://github.com/redhat-developer/vscode-yaml#associating-schemas) to associate a YAML file with its schema.
The easiest is to simply add a comment with a link to the schema at the top of the config file:

```yaml
# yaml-language-server: $schema=https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json
```
