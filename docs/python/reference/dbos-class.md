---
sidebar_position: 1
title: DBOS Class
---

The DBOS class is a singleton&mdash;you must instantiate it (by calling its constructor) exactly once in a program's lifetime.
Here, we document its constructor and lifecycle methods.
Decorators are documented [here](./decorators.md) and context methods and variables [here](./contexts.md).

## class dbos.DBOS

```python
DBOS(
    *,
    fastapi: Optional[FastAPI] = None,
    flask: Optional[Flask] = None,
    config: Optional[DBOSConfig] = None,
)
```

**Parameters:**
- `fastapi`: If your application is using FastAPI, the `FastAPI` object. If this is passed in, DBOS automatically calls [`dbos.launch`](#launch) when FastAPI is fully initialized. DBOS also adds to all routes a middleware that enables [tracing](../tutorials/logging-and-tracing.md#tracing) through FastAPI HTTP endpoints.
- `flask`: If your application is using Flask, the `flask` object. If this is passed in, DBOS adds to all routes a middleware that enables [tracing](../tutorials/logging-and-tracing.md#tracing) through Flask HTTP endpoints.
- `config`: A configuration object. See the [DBOSConfig section](#dbosconfig).


### DBOSConfig
You can configure a DBOS instance with a `DBOSConfig` object. All fields, except your application's `name`, are optional and defaults will be provided when constructing the DBOS singleton.

```python
class DBOSConfig(TypedDict):
    name: str
    database_url: Optional[str]
    sys_db_name: Optional[str]
    log_level: Optional[str]
    otlp_traces_endpoints: Optional[List[str]]
    admin_port: Optional[int]
```

- `name`: Your application's name. This field is used by tools from the DBOS ecosystem, like the [DBOS debugger](../tutorials/debugging).
- `database_url`: A connection string pointing to your application's database. See the [Postgres docs](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS) for examples. We support the `sslmode`, `sslrootcert` and `connect_timeout` parameter keywords. The default parameters are `postgres://postgres:${PGPASSWORD}@localhost:5432`.
- `sys_db_name`: An optional name for [DBOS' system database](../../explanations/system-tables). Defaults to your application database name + `_dbos_sys`.
- `log_level`: Configure the [DBOS logger](../tutorials/logging-and-tracing#logging) severity. Defaults to `INFO`.
- `otlp_traces_endpoints`: DBOS operations [automatically generate OpenTelemetry Traces](../tutorials/logging-and-tracing#tracing). Use this field to declare a list of OTLP-compatible receivers.
- `admin_port`: DBOS starts an [admin web server](../../self-hosting#admin-api-reference), by default on port 3001, for workflow management operations. Use this property to set a custom port.

If you do not provide a `DBOSConfig` object, DBOS will look for a [dbos-config.yaml file](./configuration.md). We recommend using `DBOSConfig` except if you use other tools from the DBOS ecosystem such as `dbos migrate`.

### launch

```python
DBOS.launch()
```

Launch DBOS, initializing database connections and starting scheduled workflows.
Should be called after all decorators run.
**You should not call a DBOS function until after DBOS is launched.**
If a FastAPI app is passed into the `DBOS` constructor, `launch` is called automatically during FastAPI setup.

`DBOS.launch()` connects your app to a Postgres database.
It looks for database connection parameters in your [`dbos-config.yaml`](./configuration.md) and `.dbos/db_connection` files.
If those parameters are set to default values and no database is found, it prompts you to launch a local Postgres database using Docker.
If Docker is not found, it prompts you to connect to a database hosted on DBOS Cloud.

**Example:**
```python
from dbos import DBOS

# Initialize the DBOS object
DBOS()

# Define a scheduled workflow
@DBOS.scheduled("* * * * *")
@DBOS.workflow()
def run_every_minute(scheduled_time: datetime, actual_time: datetime):
    DBOS.logger.info("This is a scheduled workflow!")

# After all decorators run, launch DBOS
DBOS.launch()
```

**Example using Flask:**
```python
from flask import Flask
from dbos import DBOS

app = Flask(__name__)
DBOS(flask=app)

@app.route("/")
@DBOS.workflow()
def test_workflow():
    return "<p>Workflow successful!</p>"

# After all decorators run, launch DBOS
DBOS.launch()

if __name__ == "__main__":
    app.run()
```

Assuming your file is `main.py`, run with `python3 -m main` (dev) or `gunicorn -w 1 'main:app' -b 0.0.0.0:8000` (prod)

### destroy

```python
DBOS.destroy(
    destroy_registry: bool = False
)
```

Destroy the DBOS singleton, terminating all active workflows and closing database connections.
After this completes, the singleton can be re-initialized.
Useful for testing.

**Parameters:**
- `destroy_registry`: Whether to destroy the global registry of decorated functions. If set to `True`, `destroy` will "un-register" all decorated functions. You probably want to leave this `False`.


### reset_system_database

```python
DBOS.reset_system_database()
```

Destroy the DBOS [system database](../../explanations/how-workflows-work.md), resetting DBOS's internal state in Postgres.
Useful when testing a DBOS application to reset the internal state of DBOS between tests.
For example, see its use in the [testing tutorial](../tutorials/testing.md).
**This is a destructive operation and should only be used in a test environment.**

## Configuration Management

### load_config

```python
load_config(
    config_file_path: str = "dbos-config.yaml",
    use_db_wizard: bool = True
) -> ConfigFile:
```

Load and parse a DBOS configuration file into a `ConfigFile` object.

**Parameters:**
- `config_file_path`: The path to the DBOS configuration file to parse.
- `use_db_wizard`: If the configuration file specifies default database connection parameters and there is no Postgres database there, whether to prompt the user to connect to a different database.

### get_dbos_database_url

```python
get_dbos_database_url(
    config_file_path: str = "dbos-config.yaml"
) -> str
```

Parse database connection information from a DBOS configuration file into a Postgres database connection string.

**Parameters:**
- `config_file_path`: The path to the DBOS configuration file to parse.