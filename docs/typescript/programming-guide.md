---
sidebar_position: 1
title: Learn DBOS TypeScript
pagination_next: typescript/tutorials/workflow-tutorial
pagination_prev: quickstart
---

import LocalPostgres from '/docs/partials/_local_postgres.mdx';


This tutorial shows you how to use DBOS durable execution to make your Python app **resilient to any failure.**
First, without using DBOS, we'll build an app that records greetings to two different systems: Postgres and an online guestbook.
Then, we'll add DBOS durable execution to the app in **just four lines of code**.
Thanks to durable execution, the app will always write to both systems consistently, even if it is interrupted or restarted at any point.

## 1. Setting Up Your App

Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment.

```
npx @dbos-inc/create -t hello-express -n greeting-guestbook
cd greeting-guestbook
```

DBOS needs a Postgres database to connect to.
Just like in the [quickstart](../quickstart.md), you can use a DBOS Cloud database (if you followed the quickstart to set one up), a Docker container, or a local Postgres installation:

<details>
<summary>Instructions to set up Postgres</summary>

<LocalPostgres cmd={'node start_postgres_docker.js'} />
</details>

Finally, set up some database tables:

```shell
npx dbos migrate
```

Next, let's use FastAPI to write a simple app that greets our friends.
Every time the app receives a greeting, it performs two steps:

1. Sign an online guestbook with the greeting.
2. Record the greeting in the database.

We deliberately **won't** use DBOS yet (except to fetch the database connection string) so we can show you how easy it is to add later.

Copy the following code into `greeting_guestbook/main.py`, replacing its existing contents:

```python showLineNumbers title="greeting_guestbook/main.py"
import logging

import requests
from dbos import get_dbos_database_url
from fastapi import FastAPI
from sqlalchemy import create_engine

from .schema import dbos_hello

app = FastAPI()
logging.basicConfig(level=logging.INFO)

# Sign the guestbook using an HTTP POST request
def sign_guestbook(name: str):
    requests.post(
        "https://demo-guestbook.cloud.dbos.dev/record_greeting",
        headers={"Content-Type": "application/json"},
        json={"name": name},
    )
    logging.info(f">>> STEP 1: Signed the guestbook for {name}")

# Create a SQLAlchemy engine. Adjust this connection string for your database.
engine = create_engine(get_dbos_database_url())

# Record the greeting in the database using SQLAlchemy
def insert_greeting(name: str) -> str:
    with engine.begin() as sql_session:
        query = dbos_hello.insert().values(name=name)
        sql_session.execute(query)
    logging.info(f">>> STEP 2: Greeting to {name} recorded in the database!")

@app.get("/greeting/{name}")
def greeting_endpoint(name: str):
    sign_guestbook(name)
    insert_greeting(name)
    return f"Thank you for being awesome, {name}!"
```

Start your app with `dbos start`.
To see that it's is working, visit this URL: [http://localhost:8000/greeting/Mike](http://localhost:8000/greeting/Mike)
<BrowserWindow url="http://localhost:8000/greeting/Mike">
"Thank you for being awesome, Mike!"
</BrowserWindow>

Each time you visit, your app should log first that it has recorded your greeting in the guestbook, then that it has recorded your greeting in the database.

```
INFO:root:>>> STEP 1: Signed the guestbook for Mike
INFO:root:>>> STEP 2: Greeting to Mike recorded in the database!
```

Now, this app has a problem: if it is interrupted after signing the guestbook, but before recording the greeting in the database, then **the greeting, though sent, will never be recorded**.
This is bad in many real-world situations, for example if a program fails to record making or receiving a payment.
To fix this problem, we'll use DBOS durable execution.

## 2. Durable Execution with Workflows

Next, we want to **durably execute** our application: guarantee that it inserts exactly one database record per guestbook signature, even if interrupted or restarted.
DBOS makes this easy with [workflows](./tutorials/workflow-tutorial.md).
We can add durable execution to our app with **just four lines of code** and an import statement.
Copy the following code into your `greeting_guestbook/main.py`, replacing its existing contents:


```python showLineNumbers title="greeting_guestbook/main.py"
import logging

import requests
#highlight-next-line
from dbos import DBOS, get_dbos_database_url
from fastapi import FastAPI
from sqlalchemy import create_engine

from .schema import dbos_hello

app = FastAPI()
#highlight-next-line
DBOS(fastapi=app)

logging.basicConfig(level=logging.INFO)

# Sign the guestbook using an HTTP POST request
#highlight-next-line
@DBOS.step()
def sign_guestbook(name: str):
    requests.post(
        "https://demo-guestbook.cloud.dbos.dev/record_greeting",
        headers={"Content-Type": "application/json"},
        json={"name": name},
    )
    logging.info(f">>> STEP 1: Signed the guestbook for {name}")

# Create a SQLAlchemy engine. Adjust this connection string for your database.
engine = create_engine(get_dbos_database_url())

# Record the greeting in the database using SQLAlchemy
#highlight-next-line
@DBOS.step()
def insert_greeting(name: str) -> str:
    with engine.begin() as sql_session:
        query = dbos_hello.insert().values(name=name)
        sql_session.execute(query)
    logging.info(f">>> STEP 2: Greeting to {name} recorded in the database!")

@app.get("/greeting/{name}")
#highlight-next-line
@DBOS.workflow()
def greeting_endpoint(name: str):
    sign_guestbook(name)
    for _ in range(5):
        logging.info("Press Control + C to stop the app...")
        DBOS.sleep(1)
    insert_greeting(name)
    return f"Thank you for being awesome, {name}!"
```

Only the **four highlighted lines of code** are needed to enable durable execution.

- First, we initialize DBOS on line 12.
- Then, we annotate `sign_guestbook` and `insert_greeting` as _workflow steps_ on lines 17 and 30.
- Finally, we annotate `greeting_endpoint` as a [_durable workflow_](./tutorials/workflow-tutorial.md) on line 38.

Because `greeting_endpoint` is now a durably executed workflow, if it's ever interrupted, it automatically resumes from the last completed step.
To help demonstrate this, we also add a sleep so you can interrupt your app midway through the workflow.

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

Without durable execution&mdash;if you remove the four highlighted lines&mdash;your app would restart with a "clean slate" and completely forget about your interrupted workflow.
By contrast, DBOS **automatically resumes your workflow from where it left off** and correctly completes it by recording the greeting to the database without re-signing the guestbook.
This is an incredibly powerful guarantee that helps you build complex, reliable applications without worrying about error handling or interruptions.

## 3. Optimizing Database Operations

For workflow steps that access the database, like `insert_greeting` in the example, DBOS provides powerful optimizations.
To see this in action, replace the `insert_greeting` function in `greeting_guestbook/main.py` with the following:

```python showLineNumbers
@DBOS.transaction()
def insert_greeting(name: str) -> str:
    query = dbos_hello.insert().values(name=name)
    DBOS.sql_session.execute(query)
    logging.info(f">>> STEP 2: Greeting to {name} recorded in the database!")
```

[`@DBOS.transaction()`](./tutorials/transaction-tutorial.md) is a special annotation for workflow steps that access the database.
It executes your function in a single database transaction.
We recommend using transactions because:

1. They give you access to a pre-configured database client (`DBOS.sql_session`), which is more convenient than connecting to the database yourself. You no longer need to configure a SQLAlchemy engine!
2. Under the hood, transactions are highly optimized because DBOS can update its record of your program's execution _inside_ your transaction. For more info, see our ["how workflows work"](../explanations/how-workflows-work.md) explainer.

Now, restart your app with `dbos start` and visit its URL again: http://localhost:8000/greeting/Mike.
The app should durably execute your workflow the same as before!

The code for this guide is available [on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/greeting-guestbook).

Next, to learn how to build more complex applications, check out our Python tutorials and [example apps](../examples/index.md).
