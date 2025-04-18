---
sidebar_position: 1
title: DBOS Class
pagination_prev: null
---

The DBOS class is a singleton&mdash;you must instantiate it (by calling its constructor) exactly once in a program's lifetime.
Here, we document its constructor and lifecycle methods.
Decorators are documented [here](./decorators.md) and context methods and variables [here](./contexts.md).

## class dbos.DBOS

```python
DBOS(
    *,
    config: Optional[DBOSConfig] = None,
    fastapi: Optional[FastAPI] = None,
    flask: Optional[Flask] = None,
    conductor_key: Optional[str] = None,
)
```

**Parameters:**
- `config`: Configuration parameters for DBOS. See the [configuration docs](./configuration.md).
- `fastapi`: If your application is using FastAPI, the `FastAPI` object. If this is passed in, DBOS automatically calls [`dbos.launch`](#launch) when FastAPI is fully initialized. DBOS also adds to all routes a middleware that enables [tracing](../tutorials/logging-and-tracing.md#tracing) through FastAPI HTTP endpoints.
- `flask`: If your application is using Flask, the `flask` object. If this is passed in, DBOS adds to all routes a middleware that enables [tracing](../tutorials/logging-and-tracing.md#tracing) through Flask HTTP endpoints.
- `conductor_key`: An API key for [DBOS Conductor](../../production/self-hosting/conductor.md). If provided, application is connected to Conductor. API keys can be created from the [DBOS console](https://console.dbos.dev).


### launch

```python
DBOS.launch()
```

Launch DBOS, initializing database connections and starting scheduled workflows.
Should be called after all decorators run.
**You should not call a DBOS function until after DBOS is launched.**
If a FastAPI app is passed into the `DBOS` constructor, `launch` is called automatically during FastAPI setup.

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
