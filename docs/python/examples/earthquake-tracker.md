---
displayed_sidebar: examplesSidebar
sidebar_position: 2
title: Earthquake Tracker
---

In this example, we use DBOS to build a real-time earthquake dashboard by streaming earthquake data from the USGS into Postgres, then displaying it using [Streamlit](https://streamlit.io/).

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/earthquake-tracker).

You can see the dashboard live [here](https://demo-earthquake-tracker.cloud.dbos.dev/).

## Import and Initialize the App

Let's start off with imports and initializing the DBOS app.


```python
from datetime import datetime, timedelta
from typing import TypedDict

import requests
from dbos import DBOS
from schema import earthquake_tracker
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert

DBOS()
```

## Retrieving Earthquake Data

Now, let's write a function that queries the USGS for data on recent earthquakes.
Our function will take in a time range and return the id, place, magnitude, and timestamp of all earthquakes that occured in that time range.
We annotate the function with [`@DBOS.communicator`](../tutorials/communicator-tutorial.md) so we can call it from a durable workflow later on.

```python
@DBOS.communicator()
def get_earthquake_data(
    start_time: datetime, end_time: datetime
) -> list[EarthquakeData]:
    # USGS API endpoint for earthquake data
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"

    # Format parameters for the API request
    end_time_str = end_time.strftime("%Y-%m-%dT%H:%M:%S")
    start_time_str = start_time.strftime("%Y-%m-%dT%H:%M:%S")
    params = {
        "format": "geojson",
        "starttime": start_time_str,
        "endtime": end_time_str,
        "minmagnitude": 1.0,
    }

    # Make the API request and return its output
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        earthquakes = []
        for item in data["features"]:
            earthquake: EarthquakeData = {
                "id": item["id"],
                "place": item["properties"]["place"],
                "magnitude": item["properties"]["mag"],
                "timestamp": item["properties"]["time"],
            }
            earthquakes.append(earthquake)
        return earthquakes
    else:
        raise Exception(
            f"Error fetching data from USGS: {response.status_code} {response.text}"
        )
```

## Storing Earthquake Data in Postgres

Next, let's write a function that records earthquakes in Postgres.
Because earthquake data is sometimes updated later, this function should try to insert a new earthquake record, but if the earthquake is already in the database, update its record with new data.
We'll make it return true if we inserted a new earthquake and false if we updated an existing one.
To get access to a pre-configured database client (`DBOS.sql_session`), we annotate this function with [`@DBOS.transaction`](../tutorials/transaction-tutorial.md).


```python
@DBOS.transaction()
def record_earthquake_data(data: EarthquakeData) -> bool:
    return DBOS.sql_session.execute(
        insert(earthquake_tracker)
        .values(**data)
        .on_conflict_do_update(index_elements=["id"], set_=data)
        .returning(text("xmax = 0 AS inserted"))
    ).scalar_one()
```

## Scheduling Earthquake Data Downloads

Now, let's write a [scheduled job](../tutorials/scheduled-workflows.md) that records earthquakes every minute.
Because earthquake data is sometimes updated later, this job queries the USGS for the last hour of data, recording new earthquakes and updating records of existing earthquakes.

The [`@DBOS.scheduled`](../tutorials/scheduled-workflows.md) decorator tells DBOS to run this function on a schedule defined in [crontab syntax](https://en.wikipedia.org/wiki/Cron), in this case once per minute.
The [`@DBOS.workflow`](../tutorials/workflow-tutorial.md) decorator tells DBOS to durably execute this function, so it runs exactly-once per minute and you'll never miss an earthquake or record a duplicate.

```python
@DBOS.scheduled("* * * * *")
@DBOS.workflow()
def run_every_minute(scheduled_time: datetime, actual_time: datetime):
    end_time = scheduled_time
    start_time = scheduled_time - timedelta(hours=1)
    earthquakes = get_earthquake_data(start_time, end_time)
    if len(earthquakes) == 0:
        DBOS.logger.info(f"No earthquakes found between {start_time} and {end_time}")
    for earthquake in earthquakes:
        new_earthquake = record_earthquake_data(earthquake)
        if new_earthquake:
            DBOS.logger.info(f"Recorded earthquake: {earthquake}")
```


## Visualizing the Data with Streamlit

We'll use Streamlit to create a real-time dashboard from the data in Postgres.
We write the visualization code in a separate script because Streamlit re-runs its entire script each time it's viewed.

First, let's do imports, load database connection information, and create a SQLAlchemy database connection:

```python
import dbos
import pandas as pd
import streamlit as st
from schema import earthquake_tracker
from sqlalchemy import create_engine, desc, select

database_url = dbos.get_dbos_database_url()
engine = create_engine(database_url)
```

Next, let's read the most recent 1000 earthquakes in Postgres into a pandas dataframe.
We'll also do some transformations to the dataframe to make it more human-readable, such as transforming UNIX epoch timestamps into Python datetimes.

```python
query = (
    select(earthquake_tracker)
    .order_by(desc(earthquake_tracker.c.timestamp))
    .limit(1000)
)
df = pd.read_sql(query, engine)
df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce")
df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
df = df.rename(
    columns={"timestamp": "UTC Timestamp", "magnitude": "Magnitude", "place": "Place"}
)
df = df.drop(columns=["id"])
```

Finally, let's display our dataframe using Streamlit!

```python
st.set_page_config(page_title="DBOS Earthquake Tracker")
st.title("Earthquake Tracker")
st.table(df)
```

## Deploying to the Cloud

To deploy this example to DBOS Cloud, first install the Cloud CLI (requires Node):

```shell
npm i -g @dbos-inc/dbos-cloud
```

Then clone the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository and deploy:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/earthquake-tracker
dbos-cloud app deploy
```

This command outputs a URL&mdash;visit it to see some earthquakes!
You can also visit the [DBOS Cloud Console](https://console.dbos.dev/) to see your app's status and logs.

## Running Locally

First, clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/earthquake-tracker
```

Then create a virtual environment:

```shell
python3 -m venv .venv
source .venv/bin/activate
```

This demo requires a Postgres database.
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

Visit [http://localhost:8000](http://localhost:8000) to see some earthquakes! 
