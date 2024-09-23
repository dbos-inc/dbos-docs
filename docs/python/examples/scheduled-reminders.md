---
displayed_sidebar: examplesSidebar
sidebar_position: 5
title: Scheduled Reminders
---

In this example, we use DBOS to build and deploy an app that schedules reminder emails for any day in the future.

You can see the application live [here](https://demo-scheduled-reminders.cloud.dbos.dev/).
Enter your email address and it will send you a reminder email one minute, one day, one week, and one month from now!

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/scheduled-reminders).

## Import and Initialize the App

Let's start off with imports and initializing the DBOS and FastAPI apps.

```python
import os

from dbos import DBOS, SetWorkflowID
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, EmailStr
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

app = FastAPI()
DBOS(fastapi=app)
```

## Scheduling Emails

Next, let's write the workflow that sends emails.
We'll send a quick confirmation email, then wait until the scheduled day, then send the reminder email.

Because we use a DBOS [durably executed workflow](../tutorials/workflow-tutorial.md), waiting until the scheduled day is easy, no matter how far away that day is: **just sleep!**

Under the hood, this works because when you first call [`DBOS.sleep`](../reference/contexts.md#sleep), it records its wakeup time in the database.
That way, even if your program is interrupted or restarted multiple times during a days-long sleep, it still wakes up on schedule and sends the reminder email.

Note that if you need to schedule regular events instead of a one-off email, we recommend using [scheduled workflows](../tutorials/scheduled-workflows.md).

```python
@DBOS.workflow()
def reminder_workflow(to_email: str, send_date: datetime, start_date: datetime):
    send_email(
        to_email,
        subject="DBOS Reminder Confirmation",
        message=f"Thank you for signing up for DBOS reminders! You will receive a reminder on {send_date}.",
    )
    days_to_wait = (send_date - start_date).days
    seconds_to_wait = days_to_wait * 24 * 60 * 60
    DBOS.sleep(seconds_to_wait)
    send_email(
        to_email,
        subject="DBOS Reminder",
        message=f"This is a reminder from DBOS! You requested this reminder on {start_date}.",
    )
```

## Sending Emails

Next, let's write the actual email-sending code using [SendGrid](https://sendgrid.com).
This requires a couple environment variables:

```python
api_key = os.environ.get("SENDGRID_API_KEY", None)
if api_key is None:
    raise Exception("Error: SENDGRID_API_KEY is not set")

from_email = os.environ.get("SENDGRID_FROM_EMAIL", None)
if from_email is None:
    raise Exception("Error: SENDGRID_FROM_EMAIL is not set")
```

Then, we implement the `send_email` function using Sendgrid's Python API.
We annotate this function with [`@DBOS.step`](../tutorials/step-tutorial.md) so the reminder workflow calls it durably and doesn't re-execute it if restarted.

```python
@DBOS.step()
def send_email(to_email: str, subject: str, message: str):
    message = Mail(
        from_email=from_email, to_emails=to_email, subject=subject, html_content=message
    )
    email_client = SendGridAPIClient(api_key)
    email_client.send(message)
    DBOS.logger.info(f"Email sent to {to_email}")
```


## Serving the App

Next, let's use FastAPI to write an HTTP endpoint for scheduling reminder emails.
The endpoint takes in an email address and a scheduled date and starts a reminder workflow in the background.

As a basic anti-spam measure, we'll use the supplied email address and date as an [idempotency key](../tutorials/idempotency-tutorial.md).
That way, you can only send one reminder to any email address per day.

```python
class EmailSchema(BaseModel):
    email: EmailStr


@app.post("/email")
def email_endpoint(email: EmailSchema):
    with SetWorkflowID(email.email):
        DBOS.start_workflow(reminder_workflow, email.email)
```

Finally, let's serve the app's frontend from an HTML file using FastAPI.
In production, we recommend using DBOS primarily for the backend, with your frontend deployed elsewhere.

```python
@app.get("/")
def frontend():
    with open(os.path.join("html", "app.html")) as file:
        html = file.read()
    return HTMLResponse(html)
```

## Try it Yourself!

### Setting Up Slack

This app uses [SendGrid](https://sendgrid.com/en-us) to send reminder emails.
Create a SendGrid account, verify an email for sending, and generate an API key.
Then, set the API key and sender email as environment variables:

```shell
export SENDGRID_API_KEY=<your key>
export SENDGRID_FROM_EMAIL=<your email>
```

### Deploying to the Cloud

To deploy this app to DBOS Cloud, first install the DBOS Cloud CLI (requires Node):

```shell
npm i -g @dbos-inc/dbos-cloud
```

Then clone the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository and deploy:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/scheduled-reminders
dbos-cloud app deploy
```
This command outputs a URL&mdash;visit it to schedule a reminder!
You can also visit the [DBOS Cloud Console](https://console.dbos.dev/) to see your app's status and logs.

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

Visit [`http://localhost:8000`](http://localhost:8000) to schedule a reminder!