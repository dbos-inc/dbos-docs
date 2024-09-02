---
displayed_sidebar: examplesSidebar
sidebar_position: 4
title: RAG Slackbot
---

In this example, we use DBOS and LlamaIndex to build and deploy a Slackbot that uses retrieval-augmented generation (RAG) to answer questions about previous Slack conversations.
The bot listens to conversations in a Slack channel, persists them in a Postgres vector index, and uses that knowledge to answer questions about what's going on in your Slack channel.

Here's what the bot looks like in action:

<img src="https://github.com/user-attachments/assets/1051ed46-ac6f-49bf-9109-449df9e4bca2" alt="Debug this workflow menu" width="400" />

This app uses DBOS to:

1. Serverlessly deploy the bot to the cloud.
2. Durably orchestrate the RAG pipeline, guaranteeing each Slack message is processed exactly once and no message is lost or duplicated.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/llamabot).

## Import and Initialize the App

Let's start off with imports and initializing DBOS and FastAPI.


```python
import datetime
import os
import uuid
from typing import Any, Dict, Optional

from dbos import DBOS, SetWorkflowUUID, load_config
from fastapi import Body, FastAPI
from fastapi import Request as FastAPIRequest
from llama_index.core import StorageContext, VectorStoreIndex, set_global_handler
from llama_index.core.postprocessor import FixedRecencyPostprocessor
from llama_index.core.prompts import PromptTemplate
from llama_index.core.schema import NodeRelationship, RelatedNodeInfo, TextNode
from llama_index.vector_stores.postgres import PGVectorStore
from slack_bolt import App, BoltRequest
from slack_bolt.adapter.starlette.handler import to_bolt_request
from slack_sdk.web import SlackResponse

app = FastAPI()
DBOS(fastapi=app)
```

Next, let's initialize LlamaIndex to use the app's Postgres database as its vector store.

```python
set_global_handler("simple", logger=DBOS.logger)
dbos_config = load_config()
vector_store = PGVectorStore.from_params(
    database=dbos_config["database"]["app_db_name"],
    host=dbos_config["database"]["hostname"],
    password=dbos_config["database"]["password"],
    port=dbos_config["database"]["port"],
    user=dbos_config["database"]["username"],
    perform_setup=False,  # Set up during migration step
)
storage_context = StorageContext.from_defaults(vector_store=vector_store)
index = VectorStoreIndex([], storage_context=storage_context)
```

Then, let's initialize a Slack Bolt app that handles incoming events from Slack.

```python
slackapp = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET"),
    logger=DBOS.logger,
)
auth_response = slackapp.client.auth_test()
bot_user_id = auth_response["user_id"]
```

## Dispatching Slack Messages

Now, let's create a FastAPI HTTP endpoint that listens for messages on a Slack channel and dispatches them to Slack Bolt.

```python
@app.post("/")
def slack_challenge(request: FastAPIRequest, body: Dict[str, Any] = Body(...)):
    if "challenge" in body:
        # Respond to the Slack challenge request
        DBOS.logger.info("Received challenge")
        return {"challenge": body["challenge"]}
    # Dispatch other incoming requests to the Slack Bolt app
    return slackapp.dispatch(to_bolt_request(request, request._body))
```

We'll then write a Slack Bolt endpoint to handle messages.
Whenever this endpoint receives a message, it starts a DBOS workflow to durably process the message.
We use the message's unique event ID as an [idempotency key](../tutorials/idempotency-tutorial.md) to guarantee that no matter how many times Slack calls this endpoint, the message is processed exactly-once.

```python
@slackapp.message()
def handle_message(request: BoltRequest) -> None:
    DBOS.logger.info(f"Received message: {request.body}")
    event_id = request.body["event_id"]
    # Use the unique event_id as an idempotency key to guarantee each message is processed exactly-once
    with SetWorkflowUUID(event_id):
        # Start the event processing workflow in the background then respond to Slack.
        # We can't wait for the workflow to finish because Slack expects the
        # endpoint to reply within 3 seconds.
        DBOS.start_workflow(message_workflow, request.body["event"])
```

## Processing Messages

Now, let's write the main workflow that durably processes Slack messages.

This function parses each message to determine whether it's asking the bot a question.
If it is asking a question, it answers the question using a RAG-assisted LLM call, then posts the answer to the channel.
Otherwise, it stores the message in a vector index to help answer future questions.

```python
@DBOS.workflow()
def message_workflow(message: Dict[str, Any]) -> None:
    # Check if the message mentions the bot (@ the bot). If so, it is a question for the bot, and we answer the question and post the response back to the channel.
    # If the message contains a "blocks" key
    #   then look for a "block" with the type "rich text"
    #       if you find it, then look inside that block for an "elements" key
    #               then examine each one of those for an "elements" key
    #                   then look inside each "element" for one with type "user"
    #                   if that user matches the bot_user_id
    #                   then it's a message for the bot
    if message.get("blocks") is not None:
        for block in message["blocks"]:
            if block.get("type") == "rich_text":
                for rich_text_section in block["elements"]:
                    for element in rich_text_section["elements"]:
                        if (
                            element.get("type") == "user"
                            and element.get("user_id") == bot_user_id
                        ):
                            for element in rich_text_section.get("elements"):
                                if element.get("type") == "text":
                                    # The user is asking the bot a question
                                    query: str = element["text"]
                                    response = answer_question(query, message)
                                    post_slack_message(
                                        str(response),
                                        message["channel"],
                                        message.get("thread_ts"),
                                    )
                                    return
    # If the message doesn't mention the bot, it might be a threaded reply
    # If it's a reply to the bot, we treat it as if it were a question
    if message.get("thread_ts") is not None:
        if message.get("parent_user_id") == bot_user_id:
            query = message["text"]
            replies = get_slack_replies(message["channel"], message["thread_ts"])
            response = answer_question(query, message, replies)
            post_slack_message(str(response), message["channel"], message["thread_ts"])
            return

    # Otherwise, if it's not any kind of question, we store it in the index along with all relevant metadata
    user_name = get_user_name(message["user"])

    # Format timestamp as YYYY-MM-DD HH:MM:SS
    dt_object = datetime.datetime.fromtimestamp(float(message["ts"]))
    formatted_time = dt_object.strftime("%Y-%m-%d %H:%M:%S")

    # Format full message
    text = message["text"]

    # Store the message in LlamaIndex
    insert_node(text, user_name, formatted_time)
    DBOS.logger.info(f"Stored message: {text}")
```

Let's also define some helper functions to help the main workflow interact with Slack.
We annotate each of these with `@DBOS.communicator` so the workflow can durably call them.

```python
@DBOS.communicator()
def post_slack_message(
    message: str, channel: str, thread_ts: Optional[str] = None
) -> None:
    slackapp.client.chat_postMessage(channel=channel, text=message, thread_ts=thread_ts)


# Get all the replies in a Slack thread
@DBOS.communicator()
def get_slack_replies(channel: str, thread_ts: str) -> SlackResponse:
    return slackapp.client.conversations_replies(channel=channel, ts=thread_ts)


# Get a Slack user's username from their user id
@DBOS.communicator()
def get_user_name(user_id: str) -> str:
    user_info = slackapp.client.users_info(user=user_id)
    user_name: str = user_info["user"]["name"]
    return user_name
```

## Answering Questions and Embedding Messages

Finally, let's write the functions that answer questions and store chat histories.
We answer questions using LlamaIndex backed by GPT-3.5 Turbo:

```python
@DBOS.communicator()
def answer_question(
    query: str, message: Dict[str, Any], replies: Optional[SlackResponse] = None
) -> Any:
    who_is_asking = get_user_name(message["user"])
    replies_stanza = ""
    if replies is not None:
        replies_stanza = "In addition to the context above, the question you're about to answer has been discussed in the following chain of replies:\n"
        for reply in replies["messages"]:
            replies_stanza += get_user_name(reply["user"]) + ": " + reply["text"] + "\n"
    template = (
        "Your context is a series of chat messages. Each one is tagged with 'who:' \n"
        "indicating who was speaking and 'when:' indicating when they said it, \n"
        "followed by a line break and then what they said. There can be up to 20 chat messages.\n"
        "The messages are sorted by recency, so the most recent one is first in the list.\n"
        "The most recent messages should take precedence over older ones.\n"
        "---------------------\n"
        "{context_str}"
        "\n---------------------\n"
        "The person who is asking the question is called '"
        + who_is_asking
        + "'.\n"
        + replies_stanza
        + "\n"
        "You are a helpful AI assistant who has been listening to everything everyone has been saying. \n"
        "Given the most relevant chat messages above, please answer this question: {query_str}\n"
    )
    qa_template = PromptTemplate(template)
    postprocessor = FixedRecencyPostprocessor(
        top_k=20,
        date_key="when",  # the key in the metadata to find the date
    )
    query_engine = index.as_query_engine(
        similarity_top_k=20, node_postprocessors=[postprocessor]
    )
    query_engine.update_prompts({"response_synthesizer:text_qa_template": qa_template})
    return query_engine.query(query)
```

To aid in answering questions, we embed all Slack messages and store them in an index in Postgres:

```python
@DBOS.communicator()
def insert_node(text: str, user_name: str, formatted_time: str) -> None:
    # create a node and apply metadata
    node = TextNode(
        text=text,
        id_=str(uuid.uuid4()),
        metadata={"who": user_name, "when": formatted_time},  # type: ignore
    )
    index.insert_nodes([node])
```

## Try it Yourself!

First, clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/earthquake-tracker
```

Next, you need to configure the bot in your Slack workspace.
You must also supply Slack and OpenAI API keys.
See the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/llamabot) for a detailed walkthrough on how to do this.

After that, you can deploy it to the cloud with a single command:

```shell
dbos-cloud app deploy
```

Once deployed, you can use your bot from your Slack workspace.
Llamabot answers questions whenever you tag the bot (`@Llamabot`) in your message or reply to a bot's message, and it stores any other messages as a "fact" in its vector store.

An example conversation with the bot:

<img src="https://github.com/user-attachments/assets/1051ed46-ac6f-49bf-9109-449df9e4bca2" alt="Debug this workflow menu" width="400" />
