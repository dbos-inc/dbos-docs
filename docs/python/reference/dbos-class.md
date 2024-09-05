---
sidebar_position: 1
title: DBOS Class
---

The DBOS class is a singleton&mdash;you must instantiate it (by calling its constructor) exactly once in a program's lifetime.
Here, we document its constructor and lifecycle methods.
Decorators are documented [here](./decorators.md) and context methods and variables [here](./contexts.md).

### class dbos.DBOS

```python
DBOS(
    *,
    fastapi: Optional[FastAPI] = None,
    config: Optional[ConfigFile] = None,
)
```

**Parameters:**
- `fastapi`: If your application is using FastAPI, the `FastAPI` object. If this is passed in, DBOS automatically calls [`dbos.launch`](#launch) when FastAPI is fully initialized. DBOS also adds to all routes a middleware that enables [tracing](../tutorials/logging-and-tracing.md#tracing) through FastAPI HTTP endpoints.
- `config`: A configuration object. By default, DBOS reads configuration from `dbos-config.yaml`, but if this object is passed in its contents are used instead. We recommend using this for testing only.


### launch

```python
dbos.launch()
```

Launch DBOS, initializing database connections and starting scheduled workflows.
Should be called in your main function.
If a FastAPI app is passed into the `DBOS` constructor, `launch` is called automatically during FastAPI setup.

**Example:**
```python
from dbos import DBOS

# Initialize the DBOS object
dbos = DBOS()

# Define a scheduled workflow
@DBOS.scheduled("* * * * *")
@DBOS.workflow()
def run_every_minute(scheduled_time: datetime, actual_time: datetime):
    DBOS.logger.info("This is a scheduled workflow!")

# In your main function, launch DBOS
if __name__ == "__main__":
    dbos.launch()
```

### destroy

```
DBOS.destroy()
```

Destroy the DBOS singleton, terminating all active workflows and closing database connections.
After this completes, the singleton can be re-initialized.
Useful for testing.