"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[5040],{7319:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>r,default:()=>h,frontMatter:()=>o,metadata:()=>i,toc:()=>d});var s=n(4848),a=n(8453);const o={displayed_sidebar:"examplesSidebar",sidebar_position:4,title:"AI-Powered Slackbot"},r=void 0,i={id:"python/examples/rag-slackbot",title:"AI-Powered Slackbot",description:"In this example, we use DBOS and LlamaIndex to build and deploy a Slackbot that uses retrieval-augmented generation (RAG) to answer questions about previous Slack conversations.",source:"@site/docs/python/examples/rag-slackbot.md",sourceDirName:"python/examples",slug:"/python/examples/rag-slackbot",permalink:"/python/examples/rag-slackbot",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:4,frontMatter:{displayed_sidebar:"examplesSidebar",sidebar_position:4,title:"AI-Powered Slackbot"},sidebar:"examplesSidebar",previous:{title:"LLM-Powered Chatbot",permalink:"/python/examples/chatbot"},next:{title:"Reliable Customer Service Agent",permalink:"/python/examples/reliable-ai-agent"}},l={},d=[{value:"Import and Initialize the App",id:"import-and-initialize-the-app",level:2},{value:"Dispatching Slack Messages",id:"dispatching-slack-messages",level:2},{value:"Processing Messages",id:"processing-messages",level:2},{value:"Answering Questions and Embedding Messages",id:"answering-questions-and-embedding-messages",level:2},{value:"Try it Yourself!",id:"try-it-yourself",level:2}];function c(e){const t={a:"a",code:"code",h2:"h2",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",...(0,a.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.p,{children:"In this example, we use DBOS and LlamaIndex to build and deploy a Slackbot that uses retrieval-augmented generation (RAG) to answer questions about previous Slack conversations.\nThe bot listens to conversations in a Slack channel, persists them in a Postgres vector index, and uses that knowledge to answer questions about what's going on in your Slack channel."}),"\n",(0,s.jsx)(t.p,{children:"Here's what the bot looks like in action:"}),"\n",(0,s.jsx)("img",{src:"https://github.com/user-attachments/assets/1051ed46-ac6f-49bf-9109-449df9e4bca2",alt:"example slack conversation",width:"400"}),"\n",(0,s.jsxs)(t.p,{children:["This example shows you how to build a ",(0,s.jsx)(t.strong,{children:"reliable, cloud-deployed"})," RAG application.\nAny AI-powered Slackbot or webhook has to deal with some basic reliability and cloud hosting issues.\nFor example:"]}),"\n",(0,s.jsxs)(t.ol,{children:["\n",(0,s.jsx)(t.li,{children:"You need a reliable hosting service for your app, and to listen to Slack events, you also need a public HTTPS URL."}),"\n",(0,s.jsxs)(t.li,{children:["Slack requires you to respond to events within ",(0,s.jsx)(t.a,{href:"https://api.slack.com/apis/events-api#retries",children:"3 seconds"}),", but AI models often take longer than this to generate responses."]}),"\n",(0,s.jsx)(t.li,{children:"Slack may send duplicate events, and you should handle these without sending duplicate Slack messages."}),"\n"]}),"\n",(0,s.jsx)(t.p,{children:"We'll durably orchestrate the RAG pipeline with DBOS to solve problems #2 and #3 and deploy to DBOS Cloud to solve problem #1."}),"\n",(0,s.jsxs)(t.p,{children:["All source code is ",(0,s.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/llamabot",children:"available on GitHub"}),".\nIt's adapted from LlamaIndex's ",(0,s.jsx)(t.a,{href:"https://github.com/run-llama/llamabot",children:"Llamabot"}),"."]}),"\n",(0,s.jsx)(t.h2,{id:"import-and-initialize-the-app",children:"Import and Initialize the App"}),"\n",(0,s.jsx)(t.p,{children:"Let's start off with imports and initializing DBOS and FastAPI."}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-python",children:"import datetime\nimport os\nimport uuid\nfrom typing import Any, Dict, Optional\n\nfrom dbos import DBOS, SetWorkflowID, load_config\nfrom fastapi import Body, FastAPI\nfrom fastapi import Request as FastAPIRequest\nfrom llama_index.core import StorageContext, VectorStoreIndex, set_global_handler\nfrom llama_index.core.postprocessor import FixedRecencyPostprocessor\nfrom llama_index.core.prompts import PromptTemplate\nfrom llama_index.core.schema import NodeRelationship, RelatedNodeInfo, TextNode\nfrom llama_index.vector_stores.postgres import PGVectorStore\nfrom slack_bolt import App, BoltRequest\nfrom slack_bolt.adapter.starlette.handler import to_bolt_request\nfrom slack_sdk.web import SlackResponse\n\napp = FastAPI()\nDBOS(fastapi=app)\n"})}),"\n",(0,s.jsx)(t.p,{children:"Next, let's initialize LlamaIndex to use the app's Postgres database as its vector store."}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-python",children:'set_global_handler("simple", logger=DBOS.logger)\ndbos_config = load_config()\nvector_store = PGVectorStore.from_params(\n    database=dbos_config["database"]["app_db_name"],\n    host=dbos_config["database"]["hostname"],\n    password=dbos_config["database"]["password"],\n    port=dbos_config["database"]["port"],\n    user=dbos_config["database"]["username"],\n    perform_setup=False,  # Set up during migration step\n)\nstorage_context = StorageContext.from_defaults(vector_store=vector_store)\nindex = VectorStoreIndex([], storage_context=storage_context)\n'})}),"\n",(0,s.jsx)(t.p,{children:"Then, let's initialize a Slack Bolt app that handles incoming events from Slack."}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-python",children:'slackapp = App(\n    token=os.environ.get("SLACK_BOT_TOKEN"),\n    signing_secret=os.environ.get("SLACK_SIGNING_SECRET"),\n    logger=DBOS.logger,\n)\nauth_response = slackapp.client.auth_test()\nbot_user_id = auth_response["user_id"]\n'})}),"\n",(0,s.jsx)(t.h2,{id:"dispatching-slack-messages",children:"Dispatching Slack Messages"}),"\n",(0,s.jsx)(t.p,{children:"Now, let's create a FastAPI HTTP endpoint that listens for messages on a Slack channel and dispatches them to Slack Bolt."}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-python",children:'@app.post("/")\ndef slack_challenge(request: FastAPIRequest, body: Dict[str, Any] = Body(...)):\n    if "challenge" in body:\n        # Respond to the Slack challenge request\n        DBOS.logger.info("Received challenge")\n        return {"challenge": body["challenge"]}\n    # Dispatch other incoming requests to the Slack Bolt app\n    return slackapp.dispatch(to_bolt_request(request, request._body))\n'})}),"\n",(0,s.jsx)(t.p,{children:"We'll then write a Slack Bolt endpoint to handle messages.\nWhenever this endpoint receives a message, it starts a DBOS workflow to durably process the message."}),"\n",(0,s.jsxs)(t.p,{children:["We start the workflow in the background so we can quickly respond to Slack, avoiding a timeout.\nThis is safe because DBOS durably executes workflows: once they're started, even asynchronously, they always run to completion.\nWe use the message's unique event ID as an ",(0,s.jsx)(t.a,{href:"/python/tutorials/idempotency-tutorial",children:"idempotency key"})," to guarantee that no matter how many times Slack calls this endpoint, the message is processed exactly-once."]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-python",children:'@slackapp.message()\ndef handle_message(request: BoltRequest) -> None:\n    DBOS.logger.info(f"Received message: {request.body}")\n    event_id = request.body["event_id"]\n    # Use the unique event_id as an idempotency key to guarantee each message is processed exactly-once\n    with SetWorkflowID(event_id):\n        # Start the event processing workflow in the background then respond to Slack.\n        # We can\'t wait for the workflow to finish because Slack expects the\n        # endpoint to reply within 3 seconds.\n        DBOS.start_workflow(message_workflow, request.body["event"])\n'})}),"\n",(0,s.jsx)(t.h2,{id:"processing-messages",children:"Processing Messages"}),"\n",(0,s.jsx)(t.p,{children:"Now, let's write the main workflow that durably processes Slack messages."}),"\n",(0,s.jsx)(t.p,{children:"This function parses each message to determine whether it's asking the bot a question.\nIf it is asking a question, it answers the question using a RAG-assisted LLM call, then posts the answer to the channel.\nOtherwise, it stores the message in a vector index to help answer future questions."}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-python",children:'@DBOS.workflow()\ndef message_workflow(message: Dict[str, Any]) -> None:\n    # Check if the message mentions the bot (@ the bot). If so, it is a question for the bot, and we answer the question and post the response back to the channel.\n    # If the message contains a "blocks" key\n    #   then look for a "block" with the type "rich text"\n    #       if you find it, then look inside that block for an "elements" key\n    #               then examine each one of those for an "elements" key\n    #                   then look inside each "element" for one with type "user"\n    #                   if that user matches the bot_user_id\n    #                   then it\'s a message for the bot\n    if message.get("blocks") is not None:\n        for block in message["blocks"]:\n            if block.get("type") == "rich_text":\n                for rich_text_section in block["elements"]:\n                    for element in rich_text_section["elements"]:\n                        if (\n                            element.get("type") == "user"\n                            and element.get("user_id") == bot_user_id\n                        ):\n                            for element in rich_text_section.get("elements"):\n                                if element.get("type") == "text":\n                                    # The user is asking the bot a question\n                                    query: str = element["text"]\n                                    response = answer_question(query, message)\n                                    post_slack_message(\n                                        str(response),\n                                        message["channel"],\n                                        message.get("thread_ts"),\n                                    )\n                                    return\n    # If the message doesn\'t mention the bot, it might be a threaded reply\n    # If it\'s a reply to the bot, we treat it as if it were a question\n    if message.get("thread_ts") is not None:\n        if message.get("parent_user_id") == bot_user_id:\n            query = message["text"]\n            replies = get_slack_replies(message["channel"], message["thread_ts"])\n            response = answer_question(query, message, replies)\n            post_slack_message(str(response), message["channel"], message["thread_ts"])\n            return\n\n    # Otherwise, if it\'s not any kind of question, we store it in the index along with all relevant metadata\n    user_name = get_user_name(message["user"])\n\n    # Format timestamp as YYYY-MM-DD HH:MM:SS\n    dt_object = datetime.datetime.fromtimestamp(float(message["ts"]))\n    formatted_time = dt_object.strftime("%Y-%m-%d %H:%M:%S")\n\n    # Format full message\n    text = message["text"]\n\n    # Store the message in LlamaIndex\n    insert_node(text, user_name, formatted_time)\n    DBOS.logger.info(f"Stored message: {text}")\n'})}),"\n",(0,s.jsxs)(t.p,{children:["Let's also define some helper functions to help the main workflow interact with Slack.\nWe annotate each of these with ",(0,s.jsx)(t.code,{children:"@DBOS.step"})," so the workflow can durably call them."]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-python",children:'@DBOS.step()\ndef post_slack_message(\n    message: str, channel: str, thread_ts: Optional[str] = None\n) -> None:\n    slackapp.client.chat_postMessage(channel=channel, text=message, thread_ts=thread_ts)\n\n\n# Get all the replies in a Slack thread\n@DBOS.step()\ndef get_slack_replies(channel: str, thread_ts: str) -> SlackResponse:\n    return slackapp.client.conversations_replies(channel=channel, ts=thread_ts)\n\n\n# Get a Slack user\'s username from their user id\n@DBOS.step()\ndef get_user_name(user_id: str) -> str:\n    user_info = slackapp.client.users_info(user=user_id)\n    user_name: str = user_info["user"]["name"]\n    return user_name\n'})}),"\n",(0,s.jsx)(t.h2,{id:"answering-questions-and-embedding-messages",children:"Answering Questions and Embedding Messages"}),"\n",(0,s.jsx)(t.p,{children:"Finally, let's write the functions that answer questions and store chat histories.\nWe answer questions using LlamaIndex backed by GPT-3.5 Turbo:"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-python",children:'@DBOS.step()\ndef answer_question(\n    query: str, message: Dict[str, Any], replies: Optional[SlackResponse] = None\n) -> Any:\n    who_is_asking = get_user_name(message["user"])\n    replies_stanza = ""\n    if replies is not None:\n        replies_stanza = "In addition to the context above, the question you\'re about to answer has been discussed in the following chain of replies:\\n"\n        for reply in replies["messages"]:\n            replies_stanza += get_user_name(reply["user"]) + ": " + reply["text"] + "\\n"\n    template = (\n        "Your context is a series of chat messages. Each one is tagged with \'who:\' \\n"\n        "indicating who was speaking and \'when:\' indicating when they said it, \\n"\n        "followed by a line break and then what they said. There can be up to 20 chat messages.\\n"\n        "The messages are sorted by recency, so the most recent one is first in the list.\\n"\n        "The most recent messages should take precedence over older ones.\\n"\n        "---------------------\\n"\n        "{context_str}"\n        "\\n---------------------\\n"\n        "The person who is asking the question is called \'"\n        + who_is_asking\n        + "\'.\\n"\n        + replies_stanza\n        + "\\n"\n        "You are a helpful AI assistant who has been listening to everything everyone has been saying. \\n"\n        "Given the most relevant chat messages above, please answer this question: {query_str}\\n"\n    )\n    qa_template = PromptTemplate(template)\n    postprocessor = FixedRecencyPostprocessor(\n        top_k=20,\n        date_key="when",  # the key in the metadata to find the date\n    )\n    query_engine = index.as_query_engine(\n        similarity_top_k=20, node_postprocessors=[postprocessor]\n    )\n    query_engine.update_prompts({"response_synthesizer:text_qa_template": qa_template})\n    return query_engine.query(query)\n'})}),"\n",(0,s.jsx)(t.p,{children:"To aid in answering questions, we embed all Slack messages and store them in an index in Postgres:"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-python",children:'@DBOS.step()\ndef insert_node(text: str, user_name: str, formatted_time: str) -> None:\n    # create a node and apply metadata\n    node = TextNode(\n        text=text,\n        id_=str(uuid.uuid4()),\n        metadata={"who": user_name, "when": formatted_time},  # type: ignore\n    )\n    index.insert_nodes([node])\n'})}),"\n",(0,s.jsx)(t.h2,{id:"try-it-yourself",children:"Try it Yourself!"}),"\n",(0,s.jsxs)(t.p,{children:["First, clone and enter the ",(0,s.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps",children:"dbos-demo-apps"})," repository:"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-shell",children:"git clone https://github.com/dbos-inc/dbos-demo-apps.git\ncd python/llamabot\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Next, you need to configure the bot in your Slack workspace.\nYou must also supply Slack and OpenAI API keys.\nSee the ",(0,s.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/llamabot",children:"README"})," for a detailed walkthrough on how to do this."]}),"\n",(0,s.jsx)(t.p,{children:"After that, you can deploy it to the cloud with a single command:"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-shell",children:"dbos-cloud app deploy\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Once deployed, you can use your bot from your Slack workspace.\nLlamabot answers questions whenever you tag the bot (",(0,s.jsx)(t.code,{children:"@Llamabot"}),') in your message or reply to a bot\'s message, and it stores any other messages as a "fact" in its vector store.']}),"\n",(0,s.jsx)(t.p,{children:"Have fun chatting with the bot!"})]})}function h(e={}){const{wrapper:t}={...(0,a.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>r,x:()=>i});var s=n(6540);const a={},o=s.createContext(a);function r(e){const t=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function i(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),s.createElement(o.Provider,{value:t},e.children)}}}]);