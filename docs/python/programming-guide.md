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