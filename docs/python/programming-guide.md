---
sidebar_position: 1
title: Learn DBOS Python
pagination_next: python/tutorials/workflow-tutorial
pagination_prev: quickstart
---

This tutorial shows you how to build a simple Python app with DBOS.
It highlights how DBOS **durable execution** makes your apps resilient to any temporary failure.
We'll build an app that records greetings to two different systems: Postgres and an online guestbook.
Thanks to DBOS durable execution, the app always writes to both systems consistently, even if it is interrupted or restarted at any point.

This guide assumes you have a Postgres database running locally.
If not, see the [quickstart](../quickstart.md) for instructions on how to set it up.

## 1. Starting Out

Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment.

<Tabs groupId="operating-systems">
<TabItem value="maclinux" label="macOS or Linux">
```shell
python3 -m venv durable-greetings/.venv
cd durable-greetings
source .venv/bin/activate
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
python3 -m venv durable-greetings/.venv
cd durable-greetings
.venv\Scripts\activate.ps1
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
python3 -m venv durable-greetings/.venv
cd durable-greetings
.venv\Scripts\activate.bat
```
</TabItem>
</Tabs>

Then, install and initialize DBOS:
```shell
pip install dbos
dbos init
dbos migrate
```

Next, use [FastAPI](https://github.com/fastapi/fastapi) to write a simple HTTP endpoint to greet friends.
In your app folder, change the file `main.py` to contain only the following:

```python
from dbos import DBOS
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()
DBOS(fastapi=app)

@app.get("/greeting/{name}")
def greeting_endpoint(name: str) -> str:
    return f"Thank you for being awesome, {name}!"
```

Start your app with `dbos start`. 
To see that it's is working, visit this URL: [http://localhost:8000/greeting/Mike](http://localhost:8000/greeting/Mike)
<BrowserWindow url="http://localhost:8000/greeting/Mike">
"Thank you for being awesome, Mike!"
</BrowserWindow>

## 2. Adding Some Steps

Now, let's update the app so that every time it receives a greeting, it performs two steps:

1. Sign an online guestbook with the greeting.
2. Record the greeting in the database.

Copy the following code into your `main.py`:

```python
import logging

import requests
from dbos import DBOS
from fastapi import FastAPI

from .schema import dbos_hello

app = FastAPI()
DBOS(fastapi=app)

logging.basicConfig(level=logging.INFO)

@DBOS.step()
def sign_guestbook(name: str):
    requests.post(
        "https://demo-guest-book.cloud.dbos.dev/record_greeting",
        headers={"Content-Type": "application/json"},
        json={"name": name},
    )
    logging.info(f">>> STEP 1: Signed the guestbook for {name}")

@DBOS.transaction()
def insert_greeting(name: str) -> str:
    query = dbos_hello.insert().values(name=name)
    DBOS.sql_session.execute(query)
    logging.info(f">>> STEP 2: Greeting to {name} recorded in the database!")

@app.get("/greeting/{name}")
def greeting_endpoint(name: str):
    sign_guestbook(name)
    insert_greeting(name)
    return f"Thank you for being awesome, {name}!"
```

We add two new functions.

- `sign_guestbook` &mdash; Signs the online guestbook with an HTTP POST request
- `insert_greeting` &mdash; Uses [SQLAlchemy](https://docs.sqlalchemy.org/en/20/core/) to record the greeting in the database.

Both are ordinary Python functions, but we **annotate** them so we can durably execute them later:
- [`DBOS.step`](./tutorials/step-tutorial.md) is an annotation we can apply to **any function** to use it as a step in a durable workflow.
- [`DBOS.transaction`](./tutorials/transaction-tutorial.md) is a special type of step optimized for performing database operations. It provides a pre-configured `DBOS.sql_session` SQLAlchemy client.

To see your app working, restart it with `dbos start`. Then, visit this URL: http://localhost:8000/greeting/Mike. When you visit, your app should log first that it has recorded your greeting in the guestbook, then that it has recorded your greeting in the database.

```
INFO:root:>>> STEP 1: Signed the guestbook for Mike
INFO:root:>>> STEP 2: Greeting to Mike recorded in the database!
```

Now, this app has a problem: if it is interrupted after signing the guestbook, but before recording the greeting in the database, then **the greeting, though sent, will never be recorded**.
This is bad in many real-world situtations, for example if a program fails to record making or receiving a payment.
To fix this problem, we'll use DBOS durable execution.

## 3. Durable Execution with Workflows

Next, we want to **durably execute** our application: guarantee that it inserts exactly one database record per guestbook signature, even if interrupted or restarted.
DBOS makes this easy with [workflows](./tutorials/workflow-tutorial.md).
Replace your `greeting_endpoint` with the following:

```python
@app.get("/greeting/{name}")
# highlight-next-line
@DBOS.workflow()
def greeting_endpoint(name: str):
    sign_guestbook(name)
    for _ in range(5):
        logging.info("Press Control + C to stop the app...")
        DBOS.sleep(1)
    insert_greeting(name)
    return f"Thank you for being awesome, {name}!"
```

The key change we make is adding the [`@DBOS.workflow`](./tutorials/workflow-tutorial.md) annotation.
Since we've already annotated `sign_guestbook` and `insert_greeting` as steps, **this single line transforms your FastAPI endpoint into a durably executed workflow!**
For demonstration purposes, we also introduce a sleep so you can interrupt your app midway through the workflow.

To see the power of durable execution, restart your app with `dbos start`.
Then, visit this URL: http://localhost:8000/greeting/Mike.
In your terminal, you should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:root:>>> STEP 1: Signed the guestbook for Mike
INFO:root:Press Control + C to stop the app...
INFO:root:Press Control + C to stop the app...
INFO:root:Press Control + C to stop the app...
```
Now, press CTRL+C stop your app. Then, run `dbos start` to restart it. You should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:root:Press Control + C to stop the app...
INFO:root:Press Control + C to stop the app...
INFO:root:Press Control + C to stop the app...
INFO:root:Press Control + C to stop the app...
INFO:root:Press Control + C to stop the app...
INFO:root:>>> STEP 2: Greeting to Mike recorded in the database!
```

Without durable execution&mdash;if you remove `DBOS.workflow()`&mdash;your app restarts with a "clean slate" and completely forgets about your interrupted workflow.
By contrast, DBOS **automatically resumes your workflow from where it left off** and correctly completes it by recording the greeting to the database without re-signing the guestbook.
This is an incredibly powerful guarantee that helps you build complex, reliable applications without worrying about error handling or interruptions.

The code for this guide is available [on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/greeting-guestbook).

Next, to learn how to build more complex applications, check out our Python tutorials and [example apps](../examples/index.md).