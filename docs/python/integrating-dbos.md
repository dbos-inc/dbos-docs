---
sidebar_position: 20
title: Add DBOS To Your App
---


This guide shows you how to add the open-source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-py) library to your existing application to **durably execute** it and make it resilient to any failure.

### 1. Install DBOS
`pip install` DBOS into your application.

```shell
pip install dbos
```

DBOS requires a Postgres database.
If you already have Postgres, you can set the `DBOS_DATABASE_URL` environment variable to your connection string.
Otherwise, you can start Postgres in a Docker container with this command:

```shell
dbos postgres start
```

### 2. Add the DBOS Initializer

Add these lines of code to your program's main function.
They initialize DBOS when your program starts.


```python
import os
from dbos import DBOS, DBOSConfig

config: DBOSConfig = {
    "name": "my-app",
    "database_url": os.environ.get("DBOS_DATABASE_URL"),
}
DBOS(config=config)
DBOS.launch()
```

### 3. Start Your Application

Try starting your application.
If everything is set up correctly, your app should run normally, but log `Initializing DBOS` and `DBOS launched!` on startup.
Congratulations!  You've integrated DBOS into your application.


### 4. Start Building With DBOS

At this point, you can add any DBOS decorator or method to your application.
For example, you can annotate one of your functions as a [workflow](./tutorials/workflow-tutorial.md) and the functions it calls as [steps](./tutorials/step-tutorial.md).
DBOS durably executes the workflow so if it is ever interrupted, upon restart it automatically resumes from the last completed step.

You can add DBOS to your application incrementally&mdash;it won't interfere with code that's already there.
It's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code.

To learn more about programming with DBOS, check out [the guide](./programming-guide.md).


```python
@DBOS.step()
def step_one():
    ...

@DBOS.step()
def step_two():
    ...

@DBOS.workflow()
def workflow():
    step_one()
    step_two()
```