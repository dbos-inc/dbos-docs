---
displayed_sidebar: examplesSidebar
sidebar_position: 1
title: DBOS AI Quickstart
---

This is a "9 lines of code" DBOS AI starter example using OpenAI, built on top of the famous ["5 lines of code" starter](https://docs.llamaindex.ai/en/stable/getting_started/starter_example/) from LlamaIndex.

## Preparation

First, you need to create a folder for your app and activate a virtual environment.

<Tabs groupId="operating-systems">
<TabItem value="maclinux" label="macOS or Linux">
```shell
python3 -m venv ai-app/.venv
cd ai-app
source .venv/bin/activate
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
python3 -m venv ai-app/.venv
cd ai-app
.venv\Scripts\activate.ps1
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
python3 -m venv ai-app/.venv
cd ai-app
.venv\Scripts\activate.bat
```
</TabItem>
</Tabs>

Then, install dependencies and initialize a `dbos-config.yaml` file.
```shell
pip install dbos llama-index
dbos init --config
```

Next, to run this app, you need an OpenAI developer account. Obtain an API key [here](https://platform.openai.com/api-keys) and set up a payment method for your account [here](https://platform.openai.com/account/billing/overview). LlamaIndex uses the `gpt-3.5-turbo` model by default. Set the API as an environment variable:

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

Finally, let's download some data. This app uses the text from Paul Graham's ["What I Worked On"](http://paulgraham.com/worked.html). You can download the text from [this link](https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt) and save it under `data/paul_graham_essay.txt` of your app folder.

## Import and Initialize the App


## Try it Yourself!

First, clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/ai-storyteller/
```

Next, set up your OpenAI API key as mentioned [above](#import-and-initialize-the-app).

After that, you can deploy it to the cloud with a single command:

```shell
dbos-cloud app deploy
```

Once deployed, you can visit the app URL and generate stories!