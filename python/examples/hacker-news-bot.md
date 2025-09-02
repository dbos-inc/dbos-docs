---
displayed_sidebar: examplesSidebar
sidebar_position: 90
title: Hacker News Slackbot
---

In this example, we use DBOS to build and deploy a scheduled job that periodically searches Hacker News for people commenting about serverless computing and posts the comments to Slack.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/hackernews-alerts).

## Import and Initialize the App

Let's start off with imports and initializing the DBOS app.

```python
import html
import os
import re
import threading
from datetime import UTC, datetime, timedelta

import requests
import slack_sdk
from dbos import DBOS, DBOSConfig

config: DBOSConfig = {
    "name": "hackernews-alerts",
}
DBOS(config=config)
```

## Searching Hacker News

Next, let's write a function that searches Hacker News.
This function uses Algolia's Hacker News Search API to find all comments in the last _N_ hours containing a search term.
It returns matching comments and links to them.
We annotate this function with `@DBOS.step` so later we can durably call it from our scheduled workflow.

```python
@DBOS.step()
def search_hackernews(query: str, window_size_hours: int):
    threshold = datetime.now(UTC) - timedelta(hours=window_size_hours)

    params = {
        "tags": "comment",
        "query": query,
        "numericFilters": f"created_at_i>{threshold.timestamp()}",
    }

    response = requests.get("http://hn.algolia.com/api/v1/search", params).json()

    hits = []
    for hit in response["hits"]:
        # Reformat the comment by unescaping HTML, adding newlines, and removing HTML tags
        comment = hit["comment_text"]
        comment = re.sub("<p>", "\n", html.unescape(comment))
        comment = re.sub("<[^<]+?>", "", comment)
        url = f"https://news.ycombinator.com/item?id={hit['objectID']}"
        hits.append((comment, url))
    return hits
```

## Posting to Slack

Next, let's write a function that posts a Hacker News comment and its URL to Slack.
This function requires a Slack bot token supplied through an environment variable.
We'll explain later how to generate one.
Again, we annotate this function with `@DBOS.step` so later we can durably call it from our scheduled workflow.

```python
@DBOS.step()
def post_to_slack(comment: str, url: str):
    message = f"{comment}\n\n{url}"
    client = slack_sdk.WebClient(token=os.environ["SLACK_HN_BOT_OAUTH_TOKEN"])
    client.chat_postMessage(
        channel="hacker-news-alerts",
        text=message,
        unfurl_links=False,
        unfurl_media=False,
    )
```

## Scheduling the Search

Next, let's write a scheduled job that runs the search every hour and posts its findings to Slack.
The [`@DBOS.scheduled`](../tutorials/scheduled-workflows.md) decorator tells DBOS to run this function on a schedule defined in [crontab syntax](https://en.wikipedia.org/wiki/Cron), in this case once per hour.
The [`@DBOS.workflow`](../tutorials/workflow-tutorial.md) decorator tells DBOS to durably execute this function, so it runs exactly-once per hour and you'll never miss a Hacker News comment or record a duplicate.

```python
@DBOS.scheduled("0 * * * *")
@DBOS.workflow()
def run_hourly(scheduled_time: datetime, actual_time: datetime):
    results = search_hackernews("serverless", window_size_hours=1)
    for comment, url in results:
        post_to_slack(comment, url)
    DBOS.logger.info(f"Found {len(results)} comments at {str(actual_time)}")
```

Finally, in our main function, let's launch DBOS, then sleep the main thread forever while the scheduled job runs in the background:

```python
if __name__ == "__main__":
    DBOS.launch()
    threading.Event().wait()
```

## Try it Yourself!

Clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/hackernews-alerts
```

Then follow the instructions in the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/hackernews-alerts) to run the app.