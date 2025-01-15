---
displayed_sidebar: examplesSidebar
sidebar_position: 11
title: Cloud Cron Quickstart
hide_table_of_contents: true
---
import InstallNode from '/docs/partials/_install_node.mdx';
import LocalPostgres from '/docs/partials/_local_postgres.mdx';

Let's say you want to run some code **on a schedule**.  For example, you want to:

- Record a stock's price once a minute.
- Migrate some data from one database to another once an hour.
- Send emails to inactive users once a week.

This kind of code isn't easy to manage because the server running it has to always be "on"&mdash;you can't just run it on your laptop.

In this tutorial, we'll show you how to use DBOS to **run code on a schedule in the cloud** so you don't have to worry about maintaining it.
You'll learn how to write a scheduled (cron) function in **just 11 lines of Python code** and deploy it to the cloud with **a single click**.

### Tutorial

#### 1. Select the Cloud Cron Starter
Visit [https://console.dbos.dev/launch](https://console.dbos.dev/launch) and select the DBOS Cron Starter.
When prompted, create a database for your app with default settings.

<img src={require('@site/static/img/cron-starter/1-pick-template.png').default} alt="Cloud Console Templates" width="800" className="custom-img"/>

#### 2. Connect to GitHub and Deploy to DBOS Cloud

To ensure you can easily update your project after deploying it, DBOS will create a GitHub repository for you.
You can deploy directly from that GitHub repository to DBOS Cloud.

First, sign in to your GitHub account.
Then, set your repository name and whether it should be public or private.

Next, click "Create GitHub Repo and Deploy" and DBOS will clone a copy of the source code into your GitHub account, then deploy your project to DBOS Cloud.
In less than a minute, your app should deploy successfully.

<img src={require('@site/static/img/cron-starter/2-ready-deploy.png').default} alt="Deploy with GitHub" width="1000" className="custom-img" />

#### 3. View Your Application

At this point, your app is running code on a schedule in the cloud!

To see its code, visit your new GitHub repository and open `app/main.py`.
The app schedules a function incrementing a counter to run once a minute (the cron syntax `* * * * *` means "once a minute").
You can visit your app's URL to see the current value of the counter.

```python
from dbos import DBOS
from fastapi import FastAPI

app = FastAPI()
DBOS(fastapi=app)
counter = 0

@DBOS.scheduled("* * * * *")
@DBOS.step()
def scheduled_function(scheduled_time, actual_time):
    global counter
    counter += 1

@app.get("/")
def endpoint():
    return f"The scheduled function has run {counter} times!"
```


#### 4. Start Building

To start building, edit your application on GitHub (source code is in `app/main.py`), commit your changes, then press "Deploy From GitHub" on your [applications page](https://console.dbos.dev/applications) to see your changes reflected in the live application.

Not sure where to start?
Try adding this line to the scheduled function so it logs each time it runs:

```python
DBOS.logger.info(f"I just ran at {scheduled_time}")
```

You can view your application's logs from your [applications page](https://console.dbos.dev/applications).

<img src={require('@site/static/img/cron-starter/4-app-page.png').default} alt="Deploy with GitHub" width="800" className="custom-img" />


### Next Steps

You can adapt this 6-line starter to implement your own scheduled job.
Replace `scheduled_function` with your own function to run it on a schedule!
Some useful implementation notes:

- Schedules are specified in crontab syntax.
For example, `* * * * *` means "run once a minute."
To learn more about crontab syntax, see [this guide](https://docs.gitlab.com/ee/topics/cron/).
- The two arguments passed into `scheduled_function` are the time the run was scheduled (as a `datetime`) and the time the run was actually started (as a `datetime`).
- For more information, see the [scheduling documentation](../tutorials/scheduled-workflows.md).

Here are two larger examples built with DBOS scheduling:

- [**Hacker News Slackbot**](../examples/hacker-news-bot.md): Periodically search Hacker News for people commenting about serverless computing and post the comments to Slack.
- [**Earthquake Tracker**](../examples/earthquake-tracker.md): Use a scheduled job to scrape earthquake data from the USGS, then build a real-time earthquake dashboard over it.

### Running It Locally

You can also run your application locally for development and testing.

#### 1. Git Clone Your Application
<section className="row list">
<article className="col col--6">
Clone your application from git and enter its directory.
</article>

<article className="col col--6">

```shell
git clone <your-git-url>
cd dbos-cron-starter
```

</article>
</section>

#### 2. Set up a virtual environment
<section className="row list">
<article className="col col--6">

Create a virtual environment and install dependencies.

</article>

<article className="col col--6">

<Tabs groupId="operating-systems" className="small-tabs">
<TabItem value="maclinux" label="macOS or Linux">
```shell
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
python3 -m venv .venv
.venv\Scripts\activate.ps1
pip install -r requirements.txt
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
python3 -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
```
</TabItem>
</Tabs>

</article>
</section>

#### 3. Start Your Appliation
<section className="row list">
<article className="col col--6">

Start your application with `dbos start`, then visit [`http://localhost:8000`](http://localhost:8000) to see it!

</article>

<article className="col col--6">
```shell
dbos start
```
</article>

</section>

