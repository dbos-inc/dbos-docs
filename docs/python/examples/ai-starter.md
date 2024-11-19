---
displayed_sidebar: examplesSidebar
sidebar_position: 2
title: OpenAI Quickstart
hide_table_of_contents: false
---
import InstallNode from '/docs/partials/_install_node.mdx';

In this tutorial, you'll learn how to build an interactive AI application and deploy it to the cloud in just **9 lines of code**.

### Tutorial

#### 1. Select the DBOS AI Starter
Visit [https://console.dbos.dev/launch](https://console.dbos.dev/launch) and select the DBOS AI Starter.
When prompted, create a database for your app with default settings.

<img src={require('@site/static/img/ai-starter/1-pick-template.png').default} alt="Cloud Console Templates" width="800" className="custom-img"/>

#### 2. Connect to GitHub and Deploy to DBOS Cloud

To ensure you can easily update your project after deploying it, DBOS will create a GitHub repository for you.
You can deploy directly from that GitHub repository to DBOS Cloud.

First, sign in to your GitHub account.
Then, enter your OpenAI API key as an application secret.
You can obtain an API key [here](https://platform.openai.com/api-keys).
This key is securely stored and used by your app to make requests on your behalf to the OpenAI API.
Then, set your repository name and whether it should be public or private.

Next, click "Create GitHub Repo and Deploy" and DBOS will clone a copy of the source code into your GitHub account, then deploy your project to DBOS Cloud.
In less than a minute, your app should deploy successfully.

<img src={require('@site/static/img/ai-starter/2-ready-deploy.png').default} alt="Deploy with GitHub" width="1000" className="custom-img" />

#### 3. View Your Application

At this point, your new AI application is running in the cloud.

To see its code, visit your new GitHub repository and open `app/main.py`.
This app ingests a document (Paul Graham's essay ["What I Worked On"](https://paulgraham.com/worked.html)) and answers questions about it using RAG.
Click on the URL to see it answer a question!

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from fastapi import FastAPI
from dbos import DBOS

app = FastAPI()
DBOS(fastapi=app)

documents = SimpleDirectoryReader("data").load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()

@app.get("/")
def get_answer():
    response = query_engine.query("What did the author do growing up?")
    return str(response)
```


#### 4. Start Building

To start building, edit your application on GitHub (source code is in `app/main.py`), commit your changes, then press "Deploy From GitHub" on your [applications page](https://console.dbos.dev/applications) to see your changes reflected in the live application.

Not sure where to start?
Try changing the question the app asks and see it give new answers!
Or, if you're feeling adventerous, build an interface to ask your own questions.

<img src={require('@site/static/img/ai-starter/4-app-page.png').default} alt="Deploy with GitHub" width="800" className="custom-img" />

### Next Steps

This is just the beginning of your DBOS journey. Next, check out how DBOS can make your AI applications more scalable and resilient:
- Use [durable execution](../programming-guide.md) to write crashproof workflows.
- Use [queues](../tutorials/queue-tutorial.md) to gracefully manage AI/LLM API rate limits.
- Want to build a more complex app? Check out the [AI-Powered Slackbot](./rag-slackbot.md).
