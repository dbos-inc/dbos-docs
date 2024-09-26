---
displayed_sidebar: examplesSidebar
sidebar_position: 2
title: AI-Powered Storyteller
hide_table_of_contents: false
---

In this tutorial, you'll learn how to build a reliable AI agent with DBOS from scratch.
In just **9 lines of code** build an interactive AI application with LlamaIndex and OpenAI and host it on the cloud.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/ai-storyteller).

### Preparation

<section className="row list">
<article className="col col--6">

First, you need to create a folder for your app and activate a virtual environment. You also want to create an empty file named `main.py` for your code.
</article>

<article className="col col--6">
<Tabs groupId="operating-systems">
<TabItem value="maclinux" label="macOS or Linux">
```shell
python3 -m venv ai-app/.venv
cd ai-app
source .venv/bin/activate
touch main.py
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
python3 -m venv ai-app/.venv
cd ai-app
.venv\Scripts\activate.ps1
New-Item main.py
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
python3 -m venv ai-app/.venv
cd ai-app
.venv\Scripts\activate.bat
TYPE nul > main.py
```
</TabItem>
</Tabs>
</article>

<article className="col col--6">
Then, install dependencies and initialize a DBOS config file.
</article>

<article className="col col--6">
```shell
pip install dbos llama-index
dbos init --config
```
</article>

<article className="col col--6">
Next, to run this app, you need an OpenAI developer account. Obtain an API key [here](https://platform.openai.com/api-keys). Set the API key as an environment variable.
</article>

<article className="col col--6">
<Tabs groupId="operating-systems">
<TabItem value="maclinux" label="macOS or Linux">
```shell
export OPENAI_API_KEY=XXXXX
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
set OPENAI_API_KEY=XXXXX
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
set OPENAI_API_KEY=XXXXX
```
</TabItem>
</Tabs>
</article>

<article className="col col--6">
Declare the environment variable in `dbos-config.yaml`:
</article>

<article className="col col--6">
```yaml title="dbos-config.yaml"
env:
  OPENAI_API_KEY: ${OPENAI_API_KEY}
```
</article>

<article className="col col--6">
Finally, let's download some data. This app uses the text from Paul Graham's ["What I Worked On"](http://paulgraham.com/worked.html). You can download the text from [this link](https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt) and save it under `data/paul_graham_essay.txt` of your app folder.

Now, your app folder structure should look like this:
</article>

<article className="col col--6">
```shell
ai-app/
├── dbos-config.yaml
├── main.py
└── data/
    └── paul_graham_essay.txt
```
</article>
</section>

### Load Data and Build a Q&A Engine

Let's start with a 5 line-of-code LlamaIndex starter.
Add the following code to your `main.py`:

```python showLineNumbers title="main.py"
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

documents = SimpleDirectoryReader("data").load_data()
index = VectorStoreIndex.from_documents(documents)

query_engine = index.as_query_engine()
response = query_engine.query("What did the author do growing up?")
print(response)
```

This script loads data and builds an index over the documents under the `data/` folder, and it generates an answer by querying the index. You can run this script and it should give you a response, for example:
```bash
$ python3 main.py

The author worked on writing short stories and programming...
```

### HTTP Serving

Now, let's add a FastAPI endpoint to serve responses through HTTP. Modify your `main.py` as follows:

```python showLineNumbers title="main.py"
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
#highlight-next-line
from fastapi import FastAPI

#highlight-next-line
app = FastAPI()

documents = SimpleDirectoryReader("data").load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()

#highlight-start
@app.get("/")
def get_answer():
#highlight-end
    response = query_engine.query("What did the author do growing up?")
#highlight-next-line
    return str(response)
```

Now you can start your app with `fastapi run main.py`. To see that it's working, visit this URL: [http://localhost:8000](http://localhost:8000) 
<BrowserWindow url="http://localhost:8000">
"The author worked on writing short stories and programming..."
</BrowserWindow>

The result may be slightly different every time you refresh your browser window!

### Hosting on DBOS Cloud

To deploy your app to DBOS Cloud, you only need to add two lines to `main.py`:

```python showLineNumbers title="main.py"
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from fastapi import FastAPI
#highlight-next-line
from dbos import DBOS

app = FastAPI()
#highlight-next-line
DBOS(fastapi=app)

documents = SimpleDirectoryReader("data").load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()

@app.get("/")
def get_answer():
    response = query_engine.query("What did the author do growing up?")
    return str(response)
```

Now, install the DBOS Cloud CLI if you haven't already (requires Node):

```shell
npm i -g @dbos-inc/dbos-cloud
```

Then freeze dependencies to `requirements.txt` and deploy to DBOS Cloud:

```shell
pip freeze > requirements.txt
dbos-cloud app deploy
```

In less than a minute, it should print `Access your application at <URL>`.
To see that your app is working, visit `<URL>` in your browser.
<BrowserWindow url="https://<username>-ai-app.cloud.dbos.dev">
"The author worked on writing short stories and programming..."
</BrowserWindow>

Congratulations, you've successfully deployed your first AI app to DBOS Cloud! You can see your deployed app in the [cloud console](https://console.dbos.dev/).

### Building a Reliable AI Agent

Want to have some fun?
Let's add multiple steps and turn this simple Q&A app into a more complex AI agent -- a storyteller Slackbot! Add the following lines to `main.py`.
Note that this is normal Python code, with DBOS-specific lines highlighted.

```python showLineNumbers title="main.py"
#highlight-next-line
from dbos import SetWorkflowID
import os
import requests

slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")

#highlight-next-line
@DBOS.step()
def get_growup():
    response = query_engine.query("What did the author do growing up?")
    return str(response)

#highlight-next-line
@DBOS.step()
def get_start_yc():
    response = query_engine.query("How did the author start YC?")
    return str(response)

#highlight-next-line
@DBOS.step()
def get_after_yc():
    response = query_engine.query("What happened after YC?")
    return str(response)

#highlight-next-line
@DBOS.step()
def post_to_slack(message: str):
    requests.post(slack_webhook_url, headers={"Content-Type": "application/json"}, json={"text": message})
    DBOS.logger.info(f"Sent story version {DBOS.workflow_id} to Slack!")

# This workflow invokes the above three steps to tell a whole story.
# Then, optionally send the story to a Slack channel.
#highlight-next-line
@DBOS.workflow()
def story_workflow():
    res1 = get_growup()
    res2 = get_start_yc()
    res3 = get_after_yc()
    story = f"Story Version {DBOS.workflow_id}: First, {res1} Then, {res2} Finally, {res3}"
    if slack_webhook_url:
        post_to_slack(story)
    return story

# Let's define a route that generates a version of the story.
# Every time you visit the same version, you get the same story.
@app.get("/story/{version}")
def get_story(version: str):
    #highlight-next-line
    with SetWorkflowID(version):
        return story_workflow()
```

<details>
<summary>(Optional) Setting up a Slack webhook </summary>

Optionally, you can create an [incoming webhook](https://api.slack.com/messaging/webhooks) to post stories from your app to your Slack workspace.
It should look something like this:

```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

Set it as an environment variable:

<Tabs groupId="operating-systems">
<TabItem value="maclinux" label="macOS or Linux">
```shell
export SLACK_WEBHOOK_URL=XXXXX
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
set SLACK_WEBHOOK_URL=XXXXX
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
set SLACK_WEBHOOK_URL=XXXXX
```
</TabItem>
</Tabs>


Declare the environment variable in `dbos-config.yaml`:


```yaml title="dbos-config.yaml"
env:
  SLACK_WEBHOOK_URL: ${SLACK_WEBHOOK_URL}
```

</details>


Deploy it to DBOS Cloud again (or [run it locally](../../quickstart#run-your-app-locally)). Visit `<URL>/story/<version>` in your browser. For example:
<BrowserWindow url="https://<username>-ai-app.cloud.dbos.dev/story/v1">
"First, The author worked on writing short stories and programming... Then, The author started Y Combinator (YC) by organizing a summer program called the Summer Founders Program... Finally, After YC, the individual decided to pursue painting as a new endeavor..."
</BrowserWindow>

If you configured a Slack webhook, you should be able to see a copy of this story in your Slack channel!

To tell a slightly different version of the story, visit another version. For example:
<BrowserWindow url="https://<username>-ai-app.cloud.dbos.dev/story/v2">
"First, The author wrote short stories and tried programming on the IBM 1401 in 9th grade using an early version of Fortran... Then, The author started YC by deciding to create an investment firm with Jessica after facing delays from VCs... Finally, Paul Graham decided to hand over Y Combinator (YC) to someone else after his mother had a stroke in 2012..."
</BrowserWindow>

Because this app uses a DBOS workflow, it _executes durably_: if it is ever interrupted, it automatically resumes from the last completed step, completing the story and posting it to Slack.
It is also _idempotent_, using the version number you provide as an idempotency key (through `SetWorkflowID`).
That way, if you submit multiple requests for the same version, the workflow only executes once and subsequent re-executions with the same version number return the same story and don't re-post to Slack.

Now you know how to build a reliable AI app! This is just the beginning of your DBOS journey. Check out the [Python guide](../programming-guide.md) to learn more or try out more [examples](../../examples) of apps you can build with DBOS.