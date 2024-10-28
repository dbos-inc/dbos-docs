---
displayed_sidebar: examplesSidebar
sidebar_position: 11
title: Cloud Cron Quickstart
hide_table_of_contents: false
---
import InstallNode from '/docs/partials/_install_node.mdx';
import LocalPostgres from '/docs/partials/_local_postgres.mdx';

Let's say you want to run some code **on a schedule**.  For example, you want to:

- Record a stock's price once a minute.
- Migrate some data from one database to another once an hour.
- Send emails to inactive users once a week.

This kind of code isn't easy to manage because the server running it has to always be "on"&mdash;you can't just run it on your laptop.

In this tutorial, we'll show you how to use DBOS to **host scheduled jobs on the cloud** so you don't have to worry about maintaining them.
You'll learn how to write a scheduled (cron) job in **just 6 lines of Python code** and deploy it to the cloud with **a single command**.

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

### Scheduling Your Code

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

This code runs `scheduled_function` once a minute, every minute (the cron syntax `* * * * *` means "run every minute").

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

### Next Steps

You can easily adapt this 6-line starter to implement your own scheduled job.
Simply replace `scheduled_function` with your own function to run it on a schedule!
Some useful implementation notes:

- Schedules are specified in crontab syntax.
For example, `* * * * *` means "run once a minute."
To learn more about crontab syntax, see [this guide](https://docs.gitlab.com/ee/topics/cron/).
- The two arguments passed into `scheduled_function` are the time the run was scheduled (as a `datetime`) and the time the run was actually started (as a `datetime`).
- For more information, see our [scheduling documentation](../tutorials/scheduled-workflows.md).

Here are two larger examples built with DBOS scheduling:

- [**Hacker News Slackbot**](../examples/hacker-news-bot.md): Periodically search Hacker News for people commenting about serverless computing and post the comments to Slack.
- [**Earthquake Tracker**](../examples/earthquake-tracker.md): Use a scheduled job to scrape earthquake data from the USGS, then build a real-time earthquake dashboard over it.

### Running It Locally

Of course, you can also run your application locally for development and testing.
Under the hood, DBOS uses Postgres for scheduling, so you need to connect your app to a Postgres database&mdash;you can use a DBOS Cloud database, a Docker container, or a local Postgres installation:

<details>
<summary>Instructions to set up Postgres</summary>

<LocalPostgres cmd={'python3 start_postgres_docker.py'} />
</details>

Once your app is connected, you can start it with:

```
dbos start
```
