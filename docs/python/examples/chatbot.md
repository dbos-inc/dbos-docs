---
displayed_sidebar: examplesSidebar
sidebar_position: 8
title: LLM-Powered Chatbot
---

In this example, we'll show you how to build an interactive LLM-powered chatbot with DBOS and LangChain.

You can see the chatbot live [here](https://demo-chatbot.cloud.dbos.dev/).

In addition to chatting, this bot displays both the amount of CPU time and wall-clock time consumed by your requests.
As you chat, you'll quickly notice that while your requests may take a long time, they consume very little CPU.
That's because they spend most of their time idle waiting for the LLM to respond.
This gap explains why DBOS is 50x cheaper than other serverless platforms for AI workloads&mdash;because DBOS bills only for the CPU time you actually consume, while other platforms bill for the total request duration.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/chatbot).

## Import and Initialize the App

Let's start off with imports and initializing DBOS.

```python
import os
import threading
import time
from collections import deque

import psutil
from dbos import DBOS
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import START, MessagesState, StateGraph
from psycopg_pool import ConnectionPool
from pydantic import BaseModel

from .schema import chat_history

app = FastAPI()
dbos = DBOS(fastapi=app)
```

## Setting Up LangChain

Next, let's set up Langchain.
We'll use Langchain to answer each chat message using OpenAI's `gpt-3.5-turbo`.
We'll configure LangChain to store message history in Postgres so it persists across app restarts.

For fun, let's also instruct our chatbot to talk like a pirate.

```python
def create_langchain():
    # We use gpt-3.5-turbo as our model.
    model = ChatOpenAI(model="gpt-3.5-turbo")

    # This prompt instructs the model how to act. We'll tell it to talk like a pirate!
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You talk like a pirate. Answer all questions to the best of your ability.",
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    # This function tells LangChain to invoke our model with our prompt.
    def call_model(state: MessagesState):
        chain = prompt | model
        response = chain.invoke(state)
        return {"messages": response}

    # Create a checkpointer LangChain can use to store message history in Postgres.
    db = DBOS.config["database"]
    connection_string = f"postgresql://{db['username']}:{db['password']}@{db['hostname']}:{db['port']}/{db['app_db_name']}"
    pool = ConnectionPool(connection_string)
    checkpointer = PostgresSaver(pool)

    # Finally, construct and return the graph LangChain uses to respond to each message.
    # This chatbot uses a simple one-node graph that just calls the model.
    graph = StateGraph(state_schema=MessagesState)
    graph.add_node("model", call_model)
    graph.add_edge(START, "model")
    return graph.compile(checkpointer=checkpointer)


chain = create_langchain()
```

## Handling Chats

Now, let's chat!
We'll first write the endpoint that handles each chat request.

This endpoint is a DBOS workflow with three steps:

1. Store the incoming chat message in Postgres.
2. Use LangChain to query the LLM to respond to the chat message.
3. Store the response in Postgres.

It also records the total duration of each request in an in-memory buffer.

```python
class ChatSchema(BaseModel):
    message: str
    username: str


@app.post("/chat")
@DBOS.workflow()
def chat_workflow(chat: ChatSchema):
    start_time = time.time()
    insert_chat(chat.username, chat.message, True)
    response = query_model(chat.message, chat.username)
    insert_chat(chat.username, response, False)
    elapsed_time = time.time() - start_time
    wallclock_times_buffer.append((time.time(), elapsed_time))
    return {"content": response, "isUser": True}
```

Next, let's write the function that actually queries LangChain for each new message.
It uses your username as a thread ID so different users can have different threads of conversation.

We annotate this function with @DBOS.step() to mark is as a step in our chat workflow.

```python
@DBOS.step()
def query_model(message: str, username: str) -> str:
    config = {"configurable": {"thread_id": username}}
    input_messages = [HumanMessage(message)]
    output = chain.invoke({"messages": input_messages}, config)
    return output["messages"][-1].content
```

We also need a history endpoint that retrieves all past chats from the database for a particular user.

This function is called when we start the chatbot so it can display your chat history.

```python
@app.get("/history/{username}")
def history_endpoint(username: str):
    return get_chats(username)
```

Then, let's use SQLAlchemy to write the functions that write chats to and read chats from the database.
We annotate these functions with @DBOS.transaction() to use a DBOS-provided managed database connection.

```python
@DBOS.transaction()
def insert_chat(username: str, content: str, is_user: bool):
    DBOS.sql_session.execute(
        chat_history.insert().values(
            username=username, content=content, is_user=is_user
        )
    )


@DBOS.transaction()
def get_chats(username: str):
    stmt = (
        chat_history.select()
        .where(chat_history.c.username == username)
        .order_by(chat_history.c.created_at.asc())
    )
    result = DBOS.sql_session.execute(stmt)
    return [{"content": row.content, "isUser": row.is_user} for row in result]
```

Additionally, let's serve the app's frontend from an HTML file using FastAPI.
In production, we recommend using DBOS primarily for the backend, with your frontend deployed elsewhere.

```python
@app.get("/")
def frontend():
    with open(os.path.join("html", "app.html")) as file:
        html = file.read()
    return HTMLResponse(html)
```

## Tracking App Usage

Finally, let's write some code to track the CPU time and wall-clock time consumed by your requests so we can display those metrics in the app's UI.
This code runs once a second in a background thread.

We track the CPU consumption of this process using `psutil`.
We track wall-clock time by recording the end-to-end duration of each request.

When you first start the app, you'll notice some small residual CPU consumption from the HTTP server.
However, as you start chatting, you'll quickly see that each chat consumes only ~10ms of CPU time, but 1-2 seconds of wall-clock time.
This gap explains why DBOS is 50x cheaper than other serverless platforms for AI workloads&mdash;because DBOS bills only for the CPU time you actually consume, while other platforms bill for the total request duration.

```python
last_cpu_time_ms = 0
cpu_times_buffer = deque()
wallclock_times_buffer = deque()


def update_cpu_usage():
    while True:
        time.sleep(1)
        global last_cpu_time_ms
        # Every second, record CPU time consumed by this process
        # in the last second.
        process = psutil.Process()
        cpu_times = process.cpu_times()
        cpu_time = cpu_times.system + cpu_times.user
        time_consumed = cpu_time - last_cpu_time_ms
        if last_cpu_time_ms > 0:
            cpu_times_buffer.append((time.time(), time_consumed))
        last_cpu_time_ms = cpu_time
        # We only track usage in the last minute, so
        # pop measurements more than 60 seconds old.
        for buf in [cpu_times_buffer, wallclock_times_buffer]:
            while buf and time.time() - buf[0][0] > 60:
                buf.popleft()


threading.Thread(target=update_cpu_usage).start()


@app.get("/times")
def times_endpoint():
    return {
        "cpu_time": sum([t for _, t in cpu_times_buffer]),
        "wall_clock_time": sum([t for _, t in wallclock_times_buffer]),
    }

```

## Try it Yourself!

### Creating an OpenAI Account

To run this app, you need an OpenAI developer account.
Obtain an API key [here](https://platform.openai.com/api-keys) and set up a payment method for your account [here](https://platform.openai.com/account/billing/overview).
This bot uses `gpt-3.5-turbo` for text generation.
Make sure you have some credits (&lt;&dollar;1) to use it.

Set your API key as an environment variable:

```shell
export OPENAI_API_KEY=<your_openai_key>
```

### Deploying to the Cloud

To deploy this app to DBOS Cloud, first install the DBOS Cloud CLI (requires Node):

```shell
npm i -g @dbos-inc/dbos-cloud
```

Then clone the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository and deploy:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/chatbot
dbos-cloud app deploy
```

This command outputs a URL&mdash;visit it to schedule a reminder!
You can also visit the [DBOS Cloud Console](https://console.dbos.dev/login-redirect) to see your app's status and logs.

### Running Locally

First, clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/scheduled-reminders
```

Then create a virtual environment:

```shell
python3 -m venv .venv
source .venv/bin/activate
```

DBOS requires a Postgres database.
If you don't already have one, you can start one with Docker:

```shell
export PGPASSWORD=dbos
python3 start_postgres_docker.py
```

Then run the app in the virtual environment:

```shell
pip install -r requirements.txt
dbos migrate
dbos start
```

Visit [`http://localhost:8000`](http://localhost:8000) to see your chatbot!
