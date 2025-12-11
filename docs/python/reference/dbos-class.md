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

Launch DBOS, initializing database connections and starting queues and scheduled workflows.
Should be called after all decorators run.
**You should not run a DBOS workflow until after DBOS is launched.**

**Example:**
```python
import os
from dbos import DBOS, DBOSConfig

# Configure and initialize DBOS
config: DBOSConfig = {
    "name": "dbos-starter",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
}
DBOS(config=config)

@DBOS.step()
def step_one():
    print("Step one completed!")

@DBOS.step()
def step_two():
    print("Step two completed!")

@DBOS.workflow()
def dbos_workflow():
    step_one()
    step_two()

# Launch DBOS, then run a workflow.
if __name__ == "__main__":
    DBOS.launch()
    dbos_workflow()
```

### listen_queues

```python
DBOS.listen_queues(
    queues: List[Queue]
)
```

Configure this DBOS process to only listen to (dequeue workflows from) specific queues.
If this is not used, DBOS will listen to all declared queues.
Must be called before DBOS is launched.

**Parameters:**
- `queues`: The list of queues to listen to.

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
