---
sidebar_position: 1
title: Learn DBOS Python
pagination_next: python/tutorials/workflow-tutorial
pagination_prev: quickstart
---

import LocalPostgres from '/docs/partials/_local_postgres.mdx';


This tutorial shows you how to use DBOS durable execution to make your Python app **resilient to any failure.**
First, without using DBOS, we'll build an app that records greetings to two different systems: Postgres and an online guestbook.
Then, we'll add DBOS durable execution to the app in **just four lines of code**.
Thanks to durable execution, the app will always write to both systems consistently, even if it is interrupted or restarted at any point.

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

Then, install and initialize DBOS:
```shell
pip install dbos
dbos init --config
```

## 2. Workflows and Steps

Now, let's create the simplest interesting DBOS program.
Create a `main.py` file and add this code to it:

```python showLineNumbers title="main.py"
from dbos import DBOS

DBOS()

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
    DBOS.launch()
    dbos_workflow()
```

In DBOS, you write programs using **workflows** of **steps**.
Workflows and steps are ordinary Python functions annotated with the `@DBOS.workflow()` and `@DBOS.step()` decorators.
DBOS **durably executes** workflows, persisting their state to a database so if they are interrupted or crash, they automatically recover from the last completed step.

Run this code with `python3 main.py` and it should print output like:

```shell
13:47:09 [    INFO] (dbos:_dbos.py:272) Initializing DBOS
13:47:09 [    INFO] (dbos:_dbos.py:401) DBOS launched
Step one completed!
Step two completed!
```

To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint.
Copy this code into `main.py`:

```python showLineNumbers title="main.py"
from fastapi import FastAPI
from dbos import DBOS

app = FastAPI()
DBOS(fastapi=app)

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
```

Start your app with `dbos start`.
This calls the start command defined in your `dbos-config.yaml`, which by default is `fastapi run main.py`.
Then, visit this URL: http://localhost:8000.

In your terminal, you should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Step one completed!
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
```

Now, press CTRL+C stop your app. Then, run `dbos start` to restart it. You should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Step two completed!
```

You can see how DBOS **recovers your workflow from the last completed step**, executing step 1 without re-executing step 2.

## 3. Queues and Parallelism

If you need to run many functions concurrently, use DBOS _queues_.
To try them out, copy this code into `main.py`:

```python showLineNumbers title="main.py"
import time

from dbos import DBOS, Queue
from fastapi import FastAPI

app = FastAPI()
DBOS(fastapi=app)

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
```

When you enqueue a function (you can enqueue both steps and workflows) with `queue.enqueue`, DBOS executes it _asynchronously_, running it in the background without waiting for it to finish.
`enqueue` returns a handle representing the state of the enqueued function.
This example enqueues ten functions, then waits for them all to finish using `handle.get_result()` to wait for each of their handles.

Start your app with `dbos start`.
Then, visit this URL: http://localhost:8000.
Wait ten seconds and you should see an output like:

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

DBOS also provides durable execution for queues. To see this in action, change the definition of `dbos_step` to this so each step takes a different amount of time to run:

```python
@DBOS.step()
def dbos_step(n: int):
    time.sleep(n)
    print(f"Step {n} completed!")
```

Now, start your app with `dbos start`, then visit this URL: http://localhost:8000.
After about five seconds, you should see an output like:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Enqueueing steps
Step 0 completed!
Step 1 completed!
Step 2 completed!
Step 3 completed!
Step 4 completed!
```

Next, press CTRL+C stop your app. Then, run `dbos start` to restart it. Wait ten seconds and you should see an output like:


```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Enqueueing steps
Step 5 completed!
Step 6 completed!
Step 7 completed!
Step 8 completed!
Step 9 completed!
Successfully completed 10 steps
```

You can see how DBOS again **recovered your workflow from the last completed step**, restarting steps 5-9 without re-executing steps 0-4.

## 4. Scheduled Workflows

Sometimes, you need to run a workflow **on a schedule**: for example, once per hour or once per week.
In DBOS, you can schedule workflows with the `@DBOS.scheduled()` decorator.
To try it out, add this code to your `main.py`:

```python
@DBOS.scheduled("* * * * * *")
@DBOS.workflow()
def scheduled_workflow(scheduled_time, actual_time):
    print(f"I am a scheduled workflow. It is currently {scheduled_time}.")
```

The argument to the `DBOS.scheduled()` decorator is your workflow's schedule, defined in [crontab](https://en.wikipedia.org/wiki/Cron) syntax.
The schedule in the example, `* * * * * *` means "run this workflow every second."
Learn more about scheduled workflows [here](./tutorials/scheduled-workflows.md).

Now, start your app with `dbos start`.
The workflow should run every second, with output like:

```shell
I am a scheduled workflow. It is currently 2025-01-31 23:00:14+00:00.
I am a scheduled workflow. It is currently 2025-01-31 23:00:15+00:00.
I am a scheduled workflow. It is currently 2025-01-31 23:00:16+00:00.
```