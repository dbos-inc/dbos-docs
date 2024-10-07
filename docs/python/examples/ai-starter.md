---
displayed_sidebar: examplesSidebar
sidebar_position: 2
title: OpenAI Quickstart
hide_table_of_contents: false
---
import InstallNode from '/docs/partials/_install_node.mdx';

In this tutorial, you'll learn how to build an interactive AI application and deploy it to the cloud in just **9 lines of code**.

### Preparation

<section className="row list">
<article className="col col--6">

First, create a folder for your app and activate a virtual environment.
</article>

<article className="col col--6">
<Tabs groupId="operating-systems" className="small-tabs">
<TabItem value="maclinux" label="macOS/Linux">
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
<Tabs groupId="operating-systems" className="small-tabs">
<TabItem value="maclinux" label="macOS/Linux">
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

Now, let's use LlamaIndex to write a simple AI application in just 5 lines of code.
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

Now, install the DBOS Cloud CLI if you haven't already (requires Node.js):


```shell
npm i -g @dbos-inc/dbos-cloud
```

<details>
<summary>Instructions to install Node.js</summary>

<InstallNode />

</details>


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

Congratulations, you've successfully deployed your first AI app to DBOS Cloud! You can see your deployed app in the [cloud console](https://console.dbos.dev/login-redirect).

### Next Steps

This is just the beginning of your DBOS journey. Next, check out how DBOS can make your AI applications more scalable and resilient:
- Use [durable execution](../programming-guide.md) to write crashproof workflows.
- Use [queues](../tutorials/queue-tutorial.md) to gracefully manage AI/LLM API rate limits.
- Want to build a more complex app? Check out the [AI-Powered Slackbot](./rag-slackbot.md).
