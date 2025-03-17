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

Then, install DBOS and create a DBOS configuration file:
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

DBOS helps you write reliable Python programs as **workflows** of **steps**.
You create workflows and steps by adding special annotations (`@DBOS.workflow()` and `@DBOS.step()`) to your Python functions.

The key benefit of DBOS is **durability**&mdash;it automatically saves the state of your workflows and steps to a database.
If your program crashes or is interrupted, DBOS uses this saved state to recover each of your workflows from its last completed step.
Thus, DBOS makes your application **resilient to any failure**.

Run this code with `python3 main.py` and it should print output like:

```shell
13:47:09 [    INFO] (dbos:_dbos.py:272) Initializing DBOS
13:47:09 [    INFO] (dbos:_dbos.py:401) DBOS launched
Step one completed!
Step two completed!
```

To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint using FastAPI.
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

if __name__ == "__main__":
    DBOS.launch()
    dbos_workflow()
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
Learn more about workflows, steps, and their guarantees [here](./tutorials/workflow-tutorial.md).

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

if __name__ == "__main__":
    DBOS.launch()
    dbos_workflow()
```

When you enqueue a function with `queue.enqueue`, DBOS executes it _asynchronously_, running it in the background without waiting for it to finish.
`enqueue` returns a handle representing the state of the enqueued function.
This example enqueues ten functions, then waits for them all to finish using `handle.get_result()` to wait for each of their handles.

Start your app with `dbos start`.
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

DBOS durably executes queued operations. To see this in action, change the definition of `dbos_step` to this so each step takes a different amount of time to run:

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
Learn more about DBOS queues [here](./tutorials/queue-tutorial.md).

## 4. Scheduled Workflows

Sometimes, you need to run a workflow **on a schedule**: for example, once per hour or once per week.
In DBOS, you can schedule workflows with the `@DBOS.scheduled()` decorator.
To try it out, add this code to your `main.py`:

```python
@DBOS.scheduled("* * * * * *")
@DBOS.workflow()
def run_every_second(scheduled_time, actual_time):
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

## 5. Database Operations and Transactions

Often, applications need to manage database tables in Postgres.
We'll show you how to do that from scratch&mdash;first, defining a new table in SQLAlchemy, then creating a schema migration for it in Alembic, then operating on it from a DBOS workflow.

First, create a file named `schema.py` and in it define a new Postgres database table using SQLAlchemy:

```python showLineNumbers title="schema.py"
from sqlalchemy import Column, Integer, MetaData, String, Table

metadata = MetaData()

example_table = Table(
    "example_table",
    metadata,
    Column("count", Integer, primary_key=True, autoincrement=True),
    Column("name", String, nullable=False),
)
```

Next, let's create a schema migration that will create the table in your database.
We'll do that using Alembic, a popular tool for database migrations in Python.
First, intialize Alembic:

```
alembic init migrations
```

This creates a `migrations/` directory in your application.
Next, add the following code to `migrations/env.py` right before the `run_migrations_offline` function:

```python showLineNumbers title="migrations/env.py"
from dbos import get_dbos_database_url
import re
from schema import metadata

target_metadata = metadata

# Programmatically set the sqlalchemy.url field from the DBOS config
# Alembic requires the % in URL-escaped parameters be escaped to %%.
escaped_conn_string = re.sub(
    r"%(?=[0-9A-Fa-f]{2})",
    "%%",
    get_dbos_database_url(),
)
config.set_main_option("sqlalchemy.url", escaped_conn_string)
```

This code imports your table schema into Alembic and tells it to load its database connection parameters from DBOS.

Next, generate your migration files:

```
alembic revision --autogenerate -m "example_table"
```

Edit your `dbos-config.yaml` to add a migration command:

```yaml
database:
  migrate:
    - alembic upgrade head
```

Finally, run your migrations with:

```shell
dbos migrate
```

You should see output like:

```shell
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> f05ae9138107, example_table
```

You just created your new table in your Postgres database!

Now, let's write a DBOS workflow that operates on that table. Copy the following code into `main.py`:

```python showLineNumbers title="main.py"
from dbos import DBOS
from fastapi import FastAPI

from schema import example_table

app = FastAPI()
DBOS(fastapi=app)

@DBOS.transaction()
def insert_row():
        DBOS.sql_session.execute(example_table.insert().values(name="dbos"))

@DBOS.transaction()
def count_rows():
    count = DBOS.sql_session.execute(example_table.select()).rowcount
    print(f"Row count: {count}")

@app.get("/")
@DBOS.workflow()
def dbos_workflow():
    insert_row()
    count_rows()
```

This workflow first inserts a new row into your table, then prints the total number of rows in into your table.
The database operations are done in DBOS _transactions_. These are special steps optimized for database accesses.
They execute as a single database transaction and give you access to a pre-configured database client (`DBOS.sql_session`).
Learn more about transactions [here](./tutorials/transaction-tutorial.md).

Now, start your app with `dbos start`, then visit this URL: http://localhost:8000.

You should see an output like:

```shell
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Row count: 1
```

Every time you visit http://localhost:8000, your workflow should insert another row, and the printed row count should go up by one.

Congratulations!  You've finished the DBOS Python guide.
You can find the code from this guide in the [DBOS Toolbox](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/dbos-toolbox) template app.

Here's what everything looks like put together:

<details>
<summary>Putting it all together</summary>

```python showLineNumbers title="main.py"
import time

from dbos import DBOS, Queue
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

from schema import example_table

app = FastAPI()
DBOS(fastapi=app)

##################################
#### Workflows and Steps
##################################


@DBOS.step()
def step_one():
    DBOS.logger.info("Step one completed!")


@DBOS.step()
def step_two():
    DBOS.logger.info("Step two completed!")


@app.get("/workflow")
@DBOS.workflow()
def dbos_workflow():
    step_one()
    step_two()


##################################
#### Queues
##################################

queue = Queue("example-queue")


@DBOS.step()
def dbos_step(n: int):
    time.sleep(5)
    DBOS.logger.info(f"Step {n} completed!")


@app.get("/queue")
@DBOS.workflow()
def dbos_workflow():
    DBOS.logger.info("Enqueueing steps")
    handles = []
    for i in range(10):
        handle = queue.enqueue(dbos_step, i)
        handles.append(handle)
    results = [handle.get_result() for handle in handles]
    DBOS.logger.info(f"Successfully completed {len(results)} steps")


##################################
#### Scheduled Workflows
##################################


@DBOS.scheduled("* * * * *")
@DBOS.workflow()
def run_every_minute(scheduled_time, actual_time):
    DBOS.logger.info(f"I am a scheduled workflow. It is currently {scheduled_time}.")


##################################
#### Transactions
##################################


@DBOS.transaction()
def insert_row():
    DBOS.sql_session.execute(example_table.insert().values(name="dbos"))


@DBOS.transaction()
def count_rows():
    count = DBOS.sql_session.execute(example_table.select()).rowcount
    DBOS.logger.info(f"Row count: {count}")


@app.get("/transaction")
@DBOS.workflow()
def dbos_workflow():
    insert_row()
    count_rows()
```
</details>

Next, to learn how to build more complex applications, check out the Python tutorials and [example apps](../examples/index.md).