---
sidebar_position: 2
title: DBOS Python Guide
---

This tutorial assumes you have finished the [Quickstart](./quickstart.md) and you have an app running locally.
In this guide we'll modify that app to reliably record events across two different systems: Postgres and a third-party API.
This app will write to both systems consistently, even if interrupted or restarted at any point.

## 1. Serving HTTP Requests

Let's first use [FastAPI](https://fastapi.tiangolo.com/) to implement a simple HTTP endpoint to greet friends. In your app folder, change the file `main.py` to contain only the following:

```python
from dbos import DBOS
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()
DBOS(app)


@app.get("/")
def readme() -> HTMLResponse:
    readme = """<html><body><p>
      Welcome! Visit the route /greeting/:name to be greeted!<br>
      For example, visit <a href="/greeting/dbos">/greeting/dbos</a>.<br>
      </p></body></html>
      """
    return HTMLResponse(readme)

@app.get("/greeting/{name}")
def greet(name: str) -> str:
    return f"Thank you for being awesome, {name}!"
```

Start your application with `dbos start`. You should see an output similar to:

```shell
INFO:     Started server process [191280]
INFO:     Waiting for application startup.
14:21:20 [    INFO] (dbos:admin_sever.py:31) Starting DBOS admin server on port 3001
14:21:20 [    INFO] (dbos:dbos.py:317) DBOS initialized
INFO:     Application startup complete.
14:21:20 [    INFO] (dbos:system_database.py:657) Listening to notifications
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

To see that your application is working, visit this URL in your browser: [http://localhost:8000/greeting/Mike](http://localhost:8000/greeting/Mike). You should see the message `Thank you for being awesome, Mike!`. If you replace Mike with a different name, your application will greet that name instead. 

## 2. Creating Database Tables

Let's make a database table to record greetings.
We strongly recommend managing database tables using [schema migrations](https://en.wikipedia.org/wiki/Schema_migration).
DBOS supports any Python database migration tool, but in this tutorial we'll use [Alembic](https://alembic.sqlalchemy.org/en/latest/).
First, let's define our new table.
Change the file `schema.py` to contain only the following:

```python
from sqlalchemy import Column, Integer, MetaData, Table, Text

metadata = MetaData()

greetings = Table(
    "greetings",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", Text),
    Column("note", Text),
)
```

Then, let's [autogenerate](https://alembic.sqlalchemy.org/en/latest/autogenerate.html) a migration from our schema file.
Run the following commands:

```
dbos migrate
alembic revision --autogenerate -m "greeting_guestbook"
```

This creates a new migration file that instructs the database to create the `greetings` table.
Run it like so:

```
dbos migrate
```

This command should print `Completed schema migration...`

## 3. Writing to the Database

Now that we have `greetings` table, let's change our app to write to it. Change your `main.py` to contain:

```python
from dbos import DBOS
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from schema import greetings

app = FastAPI()
DBOS(app)

# Omitted for brevity: def readme()

@DBOS.transaction()
def insert_greeting(name: str, note: str):
    DBOS.sql_session.execute(greetings.insert().values(name=name, note=note))
    DBOS.logger.info(f">>> Greeting to {name} recorded in the database!")

@app.get("/greeting/{name}")
def greet(name: str) -> str:
    note = f"Thank you for being awesome, {name}!"
    insert_greeting(name, note)
    return note
```

Here, we add a new `insert_greeting` function that records your greeting in the database using [SQLAlchemy Core](https://docs.sqlalchemy.org/en/20/core/).
We annotate it with [`@DBOS.transaction`](../tutorials-python/transaction-tutorial.md) to tell DBOS this function modifies the database.
These annotations are critical for how DBOS provides lightweight durable execution, which we'll see later.

Stop your app with CTRL+C then restart it with `dbos start`. Make a few visits to the greeting URL in your browser (http://localhost:8000/greeting/Mike). With every new visit, the app should print this to the console:

```shell
14:41:13 [    INFO] (dbos:main.py:22) >>> Greeting to Mike recorded in the database!
```

### 3.1. Reading from the Database

You can add another FastAPI endpoint to read all the greetings from the database like so:

```javascript
@app.get("/greetings")
@DBOS.transaction()
def get_greetings():
    rows = DBOS.sql_session.execute(greetings.select())
    return [dict(row) for row in rows.mappings()]
```

Try accessing it at http://localhost:8000/greetings to see all the greetings you've recorded in the database.

## 4. Interacting with External Services

Now suppose we also want to send our greetings to a remote system. In this example, we'll use a demo DBOS Guestbook app. It lets us generate an API key and use it to record greetings in an online guestbook.

### 4.1. Create a Guestbook Key
To generate a guestbook API key, visit https://demo-guestbook.cloud.dbos.dev/key. It should output a 36-character sequence like `12345abc-1234-5678-1234-567890abcdef` (yours will be different).

You can pass this key to your app as a config variable. In your app folder, edit the file `dbos-config.yaml`. Add a new `env:` section at the bottom with the variable `GUESTBOOK_KEY` set to your key in quotes:
```yaml
env:
  GUESTBOOK_KEY: 'your-key-value-here'
```

For example, if your key is `12345abc-1234-5678-1234-567890abcdef` then you should add:
```yaml
env:
  GUESTBOOK_KEY: '12345abc-1234-5678-1234-567890abcdef'
```

### 4.2. Sign the Guestbook from the App

Let's update our app to record each greeting in the guestbook.
Change your `main.py` to contain the following:

```python
import json
import os

import requests
from dbos import DBOS
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from schema import greetings

app = FastAPI()
DBOS(app)

# Omitted for brevity: def readme()
# Omitted for brevity: def get_greetings()
  
@DBOS.communicator()
def sign_guestbook(name: str):
    key = os.environ.get("GUESTBOOK_KEY", None)
    if key is None or len(key) != 36:
        raise Exception("Please set the guestbook key in dbos-config.yaml")

    url = "https://demo-guestbook.cloud.dbos.dev/record_greeting"
    headers = {"Content-Type": "application/json"}
    payload = {"key": key, "name": name}

    response = requests.post(url, headers=headers, json=payload)
    response_str = json.dumps(response.json())
    if not response.ok:
        raise Exception(f"Error signing guestbook: {response_str}")

    DBOS.logger.info(f">>> STEP 1: Signed the Guestbook: {response_str}")


@DBOS.transaction()
def insert_greeting(name: str, note: str):
    DBOS.sql_session.execute(greetings.insert().values(name=name, note=note))
    DBOS.logger.info(f">>> STEP 2: Greeting to {name} recorded in the database!")


@app.get("/greeting/{name}")
def greet(name: str) -> str:
    note = f"Thank you for being awesome, {name}!"
    sign_guestbook(name)
    insert_greeting(name, note)
    return note
```

We add a new function called `sign_guestbook` that uses `requests` to send an HTTP POST request to the guestbook to record a greeting.
We annotate it with [`@DBOS.communicator`](../tutorials-python/communicator-tutorial.md) to tell DBOS this function makes an external API call.
As we'll see later, these annotations allow DBOS to provide lightweight durable execution.

Stop your app with CTRL+C then restart it with `dbos start`. Make a few visits to the greeting URL in your browser (http://localhost:8000/greeting/Mike). With every new visit, the app should now print first that it has recorded your greeting in the guestbook, then that it has recorded your greeting in the database.

```
14:54:13 [    INFO] (dbos:main.py:39) >>> STEP 1: Signed the Guestbook: {"ip_address": "...", "greeted_name": "Mike", "greeted_ts": "2024-08-29T21:54:13.832Z"}
14:54:13 [    INFO] (dbos:main.py:47) >>> STEP 2: Greeting to Mike recorded in the database!
```

You can visit the URL `https://demo-guestbook.cloud.dbos.dev/greetings/your-key-value` to see all the Guestbook greetings made with your key. Old greetings and keys are removed after a few days.

## 5. Composing Reliable Workflows

Next, we want to make our app reliable: guarantee that it inserts exactly one database record per guestbook signature, even if interrupted or restarted. This is called **durable execution**. DBOS makes this easy with [workflows](../tutorials/workflow-tutorial.md). To see them in action, change your `main.py` like so:

```python
import json
import os

import requests
from dbos import DBOS
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from schema import greetings

app = FastAPI()
DBOS(app)

# Omitted for brevity: def readme()
# Omitted for brevity: def get_greetings()

@DBOS.communicator()
def sign_guestbook(name: str):
    key = os.environ.get("GUESTBOOK_KEY", None)
    if key is None or len(key) != 36:
        raise Exception("Please set the guestbook key in dbos-config.yaml")

    url = "https://demo-guestbook.cloud.dbos.dev/record_greeting"
    headers = {"Content-Type": "application/json"}
    payload = {"key": key, "name": name}

    response = requests.post(url, headers=headers, json=payload)
    response_str = json.dumps(response.json())
    if not response.ok:
        raise Exception(f"Error signing guestbook: {response_str}")

    DBOS.logger.info(f">>> STEP 1: Signed the Guestbook: {response_str}")


@DBOS.transaction()
def insert_greeting(name: str, note: str):
    DBOS.sql_session.execute(greetings.insert().values(name=name, note=note))
    DBOS.logger.info(f">>> STEP 2: Greeting to {name} recorded in the database!")


@DBOS.workflow()
def greeting_workflow(name: str, note: str):
    sign_guestbook(name)
    for _ in range(5):
        DBOS.logger.info("Press Control + C to stop the app...")
        DBOS.sleep(1)
    insert_greeting(name, note)


@app.get("/greeting/{name}")
def greet(name: str) -> str:
    note = f"Thank you for being awesome, {name}!"
    DBOS.start_workflow(greeting_workflow, name, note)
    return note
```

Here, we add a new function called `greeting_workflow` that first calls `sign_guestbook`, then calls `insert_greeting`.
We annotate it with `@DBOS.workflow()` to tell DBOS to execute it durably.
We introduce a sleep allowing you to interrupt the program midway through the workflow.
We then change `greet` to start this workflow.

The next step is time-sensitive; you may want to read it over before running. Stop your app with CTRL+C and restart it with `dbos start`.
Then, visit http://localhost:8000/greeting/Mike in your browser to send a request to your application. In your terminal, you should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     127.0.0.1:35398 - "GET /greeting/Mike HTTP/1.1" 200 OK
14:57:53 [    INFO] (dbos:main.py:39) >>> STEP 1: Signed the Guestbook: {"ip_address": "...", "greeted_name": "Mike", "greeted_ts": "2024-08-29T21:57:54.118Z"}
14:57:53 [    INFO] (dbos:main.py:54) Press Control + C to stop the app...
14:57:54 [    INFO] (dbos:main.py:54) Press Control + C to stop the app...
14:57:55 [    INFO] (dbos:main.py:54) Press Control + C to stop the app...
14:57:56 [    INFO] (dbos:main.py:54) Press Control + C to stop the app...
```
Now press Ctrl + C stop your app. Then, run `dbos start` to restart it. You should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
14:58:38 [    INFO] (dbos:main.py:54) Press Control + C to stop the app...
14:58:38 [    INFO] (dbos:main.py:54) Press Control + C to stop the app...
14:58:38 [    INFO] (dbos:main.py:54) Press Control + C to stop the app...
14:58:38 [    INFO] (dbos:main.py:54) Press Control + C to stop the app...
14:58:39 [    INFO] (dbos:main.py:54) Press Control + C to stop the app...
14:58:40 [    INFO] (dbos:main.py:47) >>> STEP 2: Greeting to Mike recorded in the database!
```

If your app did not use `DBOS.workflow()` you would expect it to restart with a "clean slate" and completely forget about your interrupted workflow. However, DBOS automatically resumes your workflow from where it left off and properly completes it by recording the greeting to the database **without** re-signing the guestbook.

:::info
Our example uses `DBOS.start_workflow` to start the workflow in the background.
This behavior is useful when the caller expects a fast response, such as with a [payment webhook](https://www.dbos.dev/blog/open-source-typescript-stripe-processing).
To make it synchronous, call the workflow function directly instead of using `start_workflow`.
:::

The code for this guide is available on GitHub.

Next, to learn how to build more complex applications, check out our Python tutorials and demo apps.