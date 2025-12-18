---
sidebar_position: 10
title: Learn DBOS Python
pagination_next: python/tutorials/workflow-tutorial
pagination_prev: quickstart
---

This guide shows you how to use DBOS to build Python apps that are **resilient to any failure**.

## 1. Setting Up Your Environment

Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment.

<Tabs groupId="operating-systems" className="small-tabs">
<TabItem value="maclinux" label="macOS or Linux">
```shell
python3 -m venv dbos-starter/.venv
cd dbos-starter
source .venv/bin/activate
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
python3 -m venv dbos-starter/.venv
cd dbos-starter
.venv\Scripts\activate.ps1
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
python3 -m venv dbos-starter/.venv
cd dbos-starter
.venv\Scripts\activate.bat
```
</TabItem>
</Tabs>

Then, install DBOS:

```shell
pip install dbos
```

## 2. Workflows and Steps

DBOS helps you add reliability to your Python programs.
The key feature of DBOS is **workflow functions** comprised of **steps**.
DBOS checkpoints the state of your workflows and steps to its system database.
If your program crashes or is interrupted, DBOS uses this checkpointed state to recover each of your workflows from its last completed step.
Thus, DBOS makes your application **resilient to any failure**.

:::info
DBOS uses a database to durably store workflow and step state.
By default, it uses SQLite, which requires no configuration.
For production use, we recommend connecting your DBOS application to a Postgres database.
You can optionally run these examples with Postgres by setting the `DBOS_SYSTEM_DATABASE_URL` environment variable to a connection string to your Postgres database.
:::

Let's create a simple DBOS program that runs a workflow of two steps.
Create `main.py` and add this code to it:

```python showLineNumbers title="main.py"
import os
from dbos import DBOS, DBOSConfig

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

if __name__ == "__main__":
    config: DBOSConfig = {
        "name": "dbos-starter",
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.launch()
    dbos_workflow()
```

Now, run this code with `python3 main.py`.
Your program should print output like:

```
15:41:06 [    INFO] (dbos:_dbos.py:534) DBOS launched!
Step one completed!
Step two completed!
```

To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint using FastAPI.
Copy this code into `main.py`:

```python showLineNumbers title="main.py"
import os

import uvicorn
from dbos import DBOS, DBOSConfig
from fastapi import FastAPI

app = FastAPI()

@DBOS.step()
def step_one():
    print("Step one completed!")

@DBOS.step()
def step_two():
    print("Step two completed!")

@app.get("/")
@DBOS.workflow()
def dbos_workflow():
    step_one()
    for _ in range(5):
        print("Press Control + C to stop the app...")
        DBOS.sleep(1)
    step_two()

if __name__ == "__main__":
    config: DBOSConfig = {
        "name": "dbos-starter",
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.launch()
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Now, install FastAPI with:

```shell
pip install 'fastapi[standard]'
```

Then, start your app with `python3 main.py`.
Then, visit this URL: http://localhost:8000.

In your terminal, you should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Step one completed!
Press Control + C to stop the app...
Press Control + C to stop the app...
```

Now, press CTRL+C stop your app (press CTRL+C multiple times to force quit it). Then, run `python3 main.py` to restart it. You should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Step two completed!
```

You can see how DBOS **recovers your workflow from the last completed step**, executing step two without re-executing step one.
Learn more about workflows, steps, and their guarantees [here](./tutorials/workflow-tutorial.md).

## 3. Queues and Parallelism

If you need to run many functions concurrently, use DBOS _queues_.
To try them out, copy this code into `main.py`:

```python showLineNumbers title="main.py"
import os
import time

import uvicorn
from dbos import DBOS, DBOSConfig, Queue
from fastapi import FastAPI

app = FastAPI()

queue = Queue("example-queue")

@DBOS.step()
def dbos_step(n: int):
    time.sleep(5)
    print(f"Step {n} completed!")

@app.get("/")
@DBOS.workflow()
def dbos_workflow():
    print("Enqueueing steps")
    handles = []
    for i in range(10):
        handle = queue.enqueue(dbos_step, i)
        handles.append(handle)
    results = [handle.get_result() for handle in handles]
    print(f"Successfully completed {len(results)} steps")

if __name__ == "__main__":
    config: DBOSConfig = {
        "name": "dbos-starter",
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.launch()
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

When you enqueue a function with `queue.enqueue`, DBOS executes it _asynchronously_, running it in the background without waiting for it to finish.
`enqueue` returns a handle representing the state of the enqueued function.
This example enqueues ten functions, then waits for them all to finish using `handle.get_result()` to wait for each of their handles.

Start your app with `python3 main.py`.
Then, visit this URL: http://localhost:8000.
Wait five seconds and you should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Enqueueing steps
Step 0 completed!
Step 1 completed!
Step 2 completed!
Step 3 completed!
Step 4 completed!
Step 5 completed!
Step 6 completed!
Step 7 completed!
Step 8 completed!
Step 9 completed!
Successfully completed 10 steps
```

You can see how all ten steps run concurrently&mdash;even though each takes five seconds, they all finish at the same time.
Learn more about DBOS queues [here](./tutorials/queue-tutorial.md).

Congratulations!  You've finished the DBOS Python guide.
You can find the code from this guide in the [DBOS Toolbox](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/dbos-toolbox) template app.

Next learn how to [add DBOS to your own application](./integrating-dbos.md) and check out the Python tutorials and [example apps](../examples/index.md).