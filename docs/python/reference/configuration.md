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
    "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
}
DBOS(config=config)
```

The `DBOSConfig` object has the following fields.
All fields except `name` are optional.

```python
class DBOSConfig(TypedDict):
    name: str

    system_database_url: Optional[str]
    application_database_url: Optional[str]
    sys_db_pool_size: Optional[int]
    db_engine_kwargs: Optional[Dict[str, Any]]
    dbos_system_schema: Optional[str]
    system_database_engine: Optional[sqlalchemy.Engine]

    conductor_key: Optional[str]

    enable_otlp: Optional[bool]
    otlp_traces_endpoints: Optional[List[str]]
    otlp_logs_endpoints: Optional[List[str]]
    otlp_attributes: Optional[dict[str, str]]
    log_level: Optional[str]

    run_admin_server: Optional[bool]
    admin_port: Optional[int]

    application_version: Optional[str]
    executor_id: Optional[str]

    serializer: Optional[Serializer]

    enable_patching: Optional[bool]
```

- **name**: Your application's name.
- **system_database_url**: A connection string to your system database.
This is the database in which DBOS stores workflow and step state; its schema is documented [here](../../explanations/system-tables.md).
This may be either Postgres or SQLite, though Postgres is recommended for production.
DBOS uses this connection string, unmodified, to create a [SQLAlchemy engine](https://docs.sqlalchemy.org/en/20/core/engines.html).
A valid connection string looks like:

```
postgresql://[username]:[password]@[hostname]:[port]/[database name]
```

Or with SQLite:

```
sqlite:///[path to database file]
```

:::info
Passwords in connection strings must be escaped (for example with [urllib](https://docs.python.org/3/library/urllib.parse.html#urllib.parse.quote)) if they contain special characters.
:::

If no connection string is provided, DBOS uses a SQLite database:

```shell
sqlite:///[application_name].sqlite
```
- **application_database_url**: A connection string to your application database.
This is the database in which DBOS executes [`@DBOS.transaction`](../tutorials/step-tutorial.md#transactions) functions.
This parameter has the same format and default as `system_database_url`.
If you are not using `@DBOS.transaction`, you do not need to supply this parameter.
- **db_engine_kwargs**: Additional keyword arguments passed to SQLAlchemy’s [`create_engine()`](https://docs.sqlalchemy.org/en/20/core/engines.html#sqlalchemy.create_engine).
Defaults to:

```python
{
  "pool_size": 20,
  "max_overflow": 0,
  "pool_timeout": 30,
}
```
- **sys_db_pool_size**: The size of the connection pool used for the [DBOS system database](../../explanations/system-tables). Defaults to 20.
- **dbos_system_schema**: Postgres schema name for DBOS system tables. Defaults to "dbos".
- **system_database_engine**: A custom SQLAlchemy engine to use to connect to your system database. If provided, DBOS will not create an engine but use this instead.
- **conductor_key**: An API key for [DBOS Conductor](../../production/self-hosting/conductor.md). If provided, application is connected to Conductor. API keys can be created from the [DBOS console](https://console.dbos.dev).
- **enable_otlp**: Enable DBOS OpenTelemetry [tracing and export](../tutorials/logging-and-tracing.md). Defaults to False.
- **otlp_traces_endpoints**: DBOS operations [automatically generate OpenTelemetry Traces](../tutorials/logging-and-tracing#tracing). Use this field to declare a list of OTLP-compatible trace receivers. Requires `enable_otlp` to be True.
- **otlp_logs_endpoints**: the DBOS logger can export OTLP-formatted log signals. Use this field to declare a list of OTLP-compatible log receivers. Requires `enable_otlp` to be True.
- **otlp_attributes**: A set of attributes (key-value pairs) to apply to all OTLP-exported logs and traces.
- **log_level**: Configure the [DBOS logger](../tutorials/logging-and-tracing#logging) severity. Defaults to `INFO`.
- **run_admin_server**: Whether to run an [HTTP admin server](../../production/self-hosting/admin-api.md) for workflow management operations. Defaults to True.
- **admin_port**: The port on which the admin server runs. Defaults to 3001.
- **application_version**: The code version for this application and its workflows. Workflow versioning is documented [here](../tutorials/workflow-tutorial.md#workflow-versioning-and-recovery).
- **executor_id**: A unique process ID used to identify the application instance in distributed environments. If using DBOS Conductor or Cloud, this is set automatically.
- **serializer**: A custom serializer for the system database. See the [custom serialization reference](./contexts.md#custom-serialization) for details.
- **enable_patching** Enable the [patching](../tutorials/upgrading-workflows.md) strategy for safely upgrading workflow code.


## DBOS Configuration File

Some tools in the DBOS ecosystem, including [DBOS Cloud](../../production/dbos-cloud/deploying-to-cloud.md) and the [DBOS CLI](./cli.md), are configured by a `dbos-config.yaml` file.

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
- **system_database_url**: The connection string to your DBOS system database.
This connection string is used by the DBOS [CLI](cli.md) and [debugger](../tutorials/debugging.md).
It has the same format as the `system_database_url` you pass to the DBOS constructor.
- **database_url**: The connection string to your application database.
This connection string is used by the DBOS [CLI](cli.md) and [debugger](../tutorials/debugging.md).
It has the same format as the `application_database_url` you pass to the DBOS constructor.
- **runtimeConfig**:
  - **start**: (required only in DBOS Cloud) The command(s) with which to start your app. Called from [`dbos start`](../reference/cli.md#dbos-start), which is used to start your app in DBOS Cloud.
  - **setup**: Setup commands to run before your application is built in DBOS Cloud. Used only in DBOS Cloud. Documentation [here](../../production/dbos-cloud/application-management.md#customizing-microvm-setup).

### Configuration Schema File

There is a schema file available for the DBOS configuration file schema [on GitHub](https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json).
This schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.
For example, the Visual Studio Code [RedHat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) provides tooltips, statement completion and real-time validation for editing DBOS config files.
This extension provides [multiple ways](https://github.com/redhat-developer/vscode-yaml#associating-schemas) to associate a YAML file with its schema.
The easiest is to simply add a comment with a link to the schema at the top of the config file:

```yaml
# yaml-language-server: $schema=https://github.com/dbos-inc/dbos-transact-py/blob/main/dbos/dbos-config.schema.json
```
