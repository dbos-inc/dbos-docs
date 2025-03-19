---
sidebar_position: 6
title: Configuration
pagination_next: null
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
    sys_db_name: Optional[str]
    app_db_pool_size: Optional[int]
    sys_db_pool_size: Optional[int]
    log_level: Optional[str]
    otlp_traces_endpoints: Optional[List[str]]
    run_admin_server: Optional[bool]
    admin_port: Optional[int]
```

- **name**: Your application's name.
- **database_url**: A connection string to a Postgres database. The supported format is
```
postgresql://[username]:[password]@[hostname]:[port]/[database name]
```
The `sslmode=require`, `sslrootcert` and `connect_timeout` parameter keywords are also supported.
Defaults to:
```
postgresql://postgres:dbos@localhost:5432/[application name]
```
- **sys_db_name**: Name for the [system database](../../explanations/system-tables) in which DBOS stores internal state. Defaults to `{database name}_dbos_sys`.
- **app_db_pool_size**: The size of the connection pool used by [transactions](../tutorials/transaction-tutorial.md) to connect to your application database. Defaults to 20.
- **sys_db_pool_size**: The size of the connection pool used for the [DBOS system database](../../explanations/system-tables). Defaults to 20.
- **log_level**: Configure the [DBOS logger](../tutorials/logging-and-tracing#logging) severity. Defaults to `INFO`.
- **otlp_traces_endpoints**: DBOS operations [automatically generate OpenTelemetry Traces](../tutorials/logging-and-tracing#tracing). Use this field to declare a list of OTLP-compatible receivers.
- **run_admin_server**: Whether to run an [admin HTTP server](../../production/self-hosting/admin-api.md) for workflow management operations. Defaults to True.
- **admin_port**: The port on which the admin server runs. Defaults to 3001.


## DBOS Configuration File

Many tools in the DBOS ecosystem are configured by a `dbos-config.yaml` file.
Tools that use `dbos-config.yaml` include the [DBOS CLI](./cli.md), [DBOS debugger](../tutorials/debugging.md), and [DBOS Cloud](../../production/dbos-cloud/deploying-to-cloud.md).
Additionally, the DBOS library will fall back to `dbos-config.yaml` if no `DBOSConfig` object is provided to the DBOS constructor.

You can create a `dbos-config.yaml` with default parameters with:

```shell
dbos init --config
```

### Configuration File Fields

::::info
You can use environment variables for configuration values through the syntax `field: ${VALUE}`.
::::

Each `dbos-config.yaml` file has the following fields and sections:

- **name**: Your application's name.
- **language**: The application language. Must be set to `python` for Python applications.
- **database_url**: A connection string to a Postgres database. This connection string is used by tools such as the [DBOS CLI](./cli.md) and [DBOS debugger](../tutorials/debugging.md). It has the same format as (and should match) the connection string you pass to the DBOS constructor.
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
