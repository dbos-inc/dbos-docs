---
displayed_sidebar: examplesSidebar
sidebar_position: 9
title: Earthquake Tracker
---

In this example, we use DBOS to build and deploy a real-time earthquake dashboard.
It works by streaming earthquake data from the USGS into Postgres, then displaying it using [Streamlit](https://streamlit.io/).

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/earthquake-tracker).

You can see the dashboard live [here](https://demo-earthquake-tracker.cloud.dbos.dev/).

## Import and Initialize the App

In our main file (`earthquake_tracker/main.py`) let's start off with imports and initializing the DBOS app.


```python
import sys
import signal
import threading
from datetime import datetime, timedelta
from typing import TypedDict

import requests
from dbos import DBOS, DBOSConfig
from schema import earthquake_tracker
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert

config: DBOSConfig = {
    "name": "earthquake-tracker",
    "database_url": os.environ.get('DBOS_DATABASE_URL'),
}
DBOS(config=config)
```

## Retrieving Earthquake Data

Now, let's write a function that queries the USGS for data on recent earthquakes.
Our function will take in a time range and return the id, place, magnitude, and timestamp of all earthquakes that occured in that time range.
We annotate the function with [`@DBOS.step`](../tutorials/step-tutorial.md) so we can call it from a durable workflow later on.

```python
@DBOS.step()
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

Finally, in our main function, let's launch DBOS, then sleep the main thread forever while the scheduled job runs in the background:

```python
def signal_handler(sig, frame):
    DBOS.destroy()
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    try:
        DBOS.launch()
        while True:
            threading.Event().wait(1)
    finally:
        DBOS.destroy()
```

## Visualizing the Data with Streamlit

Now, in a separate script (`earthquake_tracker/streamlit.py`), let's use Streamlit to create a real-time dashboard from the data in Postgres.
We use a separate script because Streamlit re-runs its entire script each time it's viewed.

First, let's do imports and configure Streamlit with a title and some custom CSS.

```python
import dbos
import pandas as pd
import plotly.express as px
import streamlit as st
from schema import earthquake_tracker
from sqlalchemy import create_engine, desc, select

st.set_page_config(page_title="DBOS Earthquake Tracker", layout="wide")
st.markdown(
    """
        <style>
            #MainMenu {visibility: hidden;}
            header {visibility: hidden;}
        </style>
        """,
    unsafe_allow_html=True,
)
st.title("🌎 Earthquake Tracker")
st.markdown(
    "This app uses DBOS to stream earthquake data from the USGS into Postgres and displays it using Streamlit."
)
```

Next, let's read the most recent 10000 earthquakes in Postgres into a pandas dataframe.
We'll also do some transformations to the dataframe to make it more human-readable, such as transforming UNIX epoch timestamps into Python datetimes.

```python
def load_data():
    database_url = dbos.get_dbos_database_url()
    engine = create_engine(database_url)
    query = (
        select(earthquake_tracker)
        .order_by(desc(earthquake_tracker.c.timestamp))
        .limit(10000)
    )
    df = pd.read_sql(query, engine)
    df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce")
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df = df.rename(
        columns={
            "timestamp": "UTC Timestamp",
            "magnitude": "Magnitude",
            "place": "Place",
        }
    )
    return df.drop(columns=["id"])


df = load_data()
```

Now, let's display our data using Streamlit.
We'll add a magnitude selector slider in a sidebar:

```python
with st.sidebar:
    st.header("Filters")
    min_magnitude = st.slider(
        "Minimum Magnitude",
        float(df["Magnitude"].min()),
        float(df["Magnitude"].max()),
        float(df["Magnitude"].min()),
    )
filtered_df = df[(df["Magnitude"] >= min_magnitude)]
```

In side-by-side columns, let's display the magnitude distribution and summary statistics of the earthquakes:

```python
col1, col2 = st.columns([2, 1])
with col1:
    st.subheader("📊 Magnitude Distribution")
    fig = px.histogram(
        filtered_df, x="Magnitude", nbins=20, color_discrete_sequence=["#4CAF50"]
    )
    fig.update_layout(xaxis_title="Magnitude", yaxis_title="Count", bargap=0.1)
    st.plotly_chart(fig, use_container_width=True)
with col2:
    st.subheader("📈 Summary Statistics")
    total_earthquakes = len(filtered_df)
    avg_magnitude = filtered_df["Magnitude"].mean()
    max_magnitude = filtered_df["Magnitude"].max()

    st.metric("Total Earthquakes", f"{total_earthquakes:,}")
    st.metric("Average Magnitude", f"{avg_magnitude:.2f}")
    st.metric("Max Magnitude", f"{max_magnitude:.2f}")
```

Finally, let's add a sortable data table with all the raw earthquake data:

```python
st.dataframe(filtered_df, use_container_width=True)
```

## Try it Yourself!

### Deploying to the Cloud

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
You can also visit the [DBOS Cloud Console](https://console.dbos.dev/login-redirect) to see your app's status and logs.

### Running Locally

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

Then start your app:

```shell
pip install -r requirements.txt
dbos migrate
dbos start
```

Visit [http://localhost:8000](http://localhost:8000) to see some earthquakes! 
