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
)
```

**Parameters:**
- `config`: Configuration parameters for DBOS. See the [configuration docs](./configuration.md).


### launch

```python
DBOS.launch()
```

Launch DBOS, initializing database connections and starting scheduled workflows.
Should be called after all decorators run.
**You should not call a DBOS function until after DBOS is launched.**

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

### destroy

```python
DBOS.destroy(
    workflow_completion_timeout_sec: int = 0,
    destroy_registry: bool = False
)
```

Destroy the DBOS singleton, terminating all active workflows and closing database connections.
After this completes, the singleton can be re-initialized.
Useful for testing.

**Parameters:**
- `workflow_completion_timeout_sec`: Wait this many seconds for active workflows to complete before shutting down.
- `destroy_registry`: Whether to destroy the global registry of decorated functions. If set to `True`, `destroy` will "un-register" all decorated functions. You probably want to leave this `False`.


### reset_system_database

```python
DBOS.reset_system_database()
```

Destroy the DBOS [system database](../../explanations/system-tables.md), resetting DBOS's internal state in Postgres.
Useful when testing a DBOS application to reset the internal state of DBOS between tests.
For example, see its use in the [testing tutorial](../tutorials/testing.md).
**This is a destructive operation and should only be used in a test environment.**
