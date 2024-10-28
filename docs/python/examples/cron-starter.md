---
displayed_sidebar: examplesSidebar
sidebar_position: 11
title: Cloud Cron Quickstart
hide_table_of_contents: false
---
import InstallNode from '/docs/partials/_install_node.mdx';

In this tutorial, you'll learn how to build a scheduled (cron) job in Python and deploy it to the cloud in just **6 lines of code**.

### Preparation

<section className="row list">
<article className="col col--6">

First, create a folder for your app and activate a virtual environment.
</article>

<article className="col col--6">
<Tabs groupId="operating-systems" className="small-tabs">
<TabItem value="maclinux" label="macOS/Linux">
```shell
python3 -m venv cron-app/.venv
cd cron-app
source .venv/bin/activate
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
pip install dbos
dbos init --config
```
</article>

<article className="col col--6">

Next, install the DBOS Cloud CLI.
It requires Node.js 20 or later.

</article>

<article className="col col--6">

<details>
<summary>Instructions to install Node.js</summary>
<InstallNode />
</details>

```shell
npm i -g @dbos-inc/dbos-cloud@latest
```
</article>


</section>

### Building a Cloud Cron Application

Now, let's build a scheduled job in just 6 lines of code.
Create a `main.py` file and copy the following code into it:

```python showLineNumbers title="main.py"
from dbos import DBOS
from fastapi import FastAPI

app = FastAPI()
DBOS(fastapi=app)

@DBOS.scheduled("* * * * *")
@DBOS.workflow()
def scheduled_function(scheduled_time, actual_time):
    DBOS.logger.info(f"I just ran at {scheduled_time}")
```

This code runs `scheduled_function` once a minute, every minute (the cron syntax `* * * * *` means "run every minute")

Now, let's deploy our application to the cloud.
Just run these two commands:

```shell
pip freeze > requirements.txt
dbos-cloud app deploy
```

Your app is now live in the cloud!
Every minute, it will run `scheduled_function`.
To view the app's logs, run:

```shell
dbos-cloud app logs
```

You should see one log entry for every minute your application has been alive.