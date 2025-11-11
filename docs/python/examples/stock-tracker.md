---
displayed_sidebar: examplesSidebar
sidebar_position: 40
title: Stock Tracker
---

In this example, we use DBOS to build and deploy an app that tracks stock prices and sends SMS alerts when the price of a stock crosses a certain threshold.
We don't want to miss a good opportunity to trade, so it's important this app is punctual and reliable!

You can see the application live [here](https://demo-stock-prices.cloud.dbos.dev/). All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/stock-prices).

## Import and Initialize the App

Let's start off by importing the necessary libraries and initializing the app.

```python
import os
import datetime
import threading
import yfinance as yf
from twilio.rest import Client
from dbos import DBOS, DBOSConfig
from schema import stock_prices, alerts

config: DBOSConfig = {
    "name": "stock-prices",
    "database_url": os.environ.get('DBOS_DATABASE_URL'),
}
DBOS(config=config)
```

## Stock Prices Watcher as an online cron job

Next, let's configure a DBOS [scheduled workflow](../tutorials/scheduled-workflows.md) to check stock prices every minute and send alerts if stock prices are above a configured threshold.
The [`@DBOS.scheduled`](../tutorials/scheduled-workflows.md) decorator tells DBOS to run this function on a schedule defined in [crontab syntax](https://en.wikipedia.org/wiki/Cron), in this case once per minute.
The [`@DBOS.workflow`](../tutorials/workflow-tutorial.md) decorator tells DBOS to durably execute this function, so it runs exactly-once per minute and you'll never miss a stock price update or record a duplicate.

```python
@DBOS.scheduled('* * * * *')
@DBOS.workflow()
def fetch_stock_prices_workflow(scheduled_time: datetime, actual_time: datetime):
    # For simplicity, let's declare inline a list of stock symbols to track
    symbols = ['AAPL', 'GOOGL', 'AMZN', 'MSFT', 'TSLA', 'NVDA']
    # Fetch registered alerts
    registered_alerts = fetch_alerts()
    # Fetch stock prices for each symbol
    for symbol in symbols:
        price = fetch_stock_price(symbol)
        save_to_db(symbol, price)
        # If there is a registered alert for that symbol, send a SMS if the price is above the alert threshold
        if registered_alerts and symbol in registered_alerts:
            if price > registered_alerts[symbol].price_threshold:
                send_sms_alert(symbol, price, registered_alerts[symbol].phone_number)
```

## Fetching stock prices

Let's write a function that fetches stock prices using the `yfinance` library.
We annotate it with [`DBOS.step`](../tutorials/step-tutorial.md) to durably call it from the workflow above.

```python
@DBOS.step()
def fetch_stock_price(symbol):
    stock = yf.Ticker(symbol)
    data = stock.history(period="1d")
    if data.empty:
        raise ValueError("No stock data found for the symbol.")
    DBOS.logger.info(f"Stock price for {symbol} is {data['Close'].iloc[0]}")
    return data['Close'].iloc[0]
```

## Sending SMS alerts

Now, we'll use the Twilio API to send SMS alerts and write a DBOS [step](../tutorials/step-tutorial) to make it durable. You can sign up for a free Twilio account at https://www.twilio.com/try-twilio. We'll need a few environment variables to store our Twilio account SID, auth token and phone number.

```python
twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
twilio_phone_number = os.environ.get('TWILIO_PHONE_NUMBER')
@DBOS.step()
def send_sms_alert(symbol, price, to_phone_number):
    client = Client(twilio_account_sid, twilio_auth_token)
    message = client.messages.create(
        body=f"{symbol} stock price is {price}.",
        from_=twilio_phone_number,
        to=to_phone_number
    )
    DBOS.logger.info(f"SMS sent: {message.sid}")
```

## Saving stock prices to the database and fetching registered alerts

Let's write two small functions to retrieve registered alerts and save stock prices to the database.
Because this is a workflow step that accesses the database, we annotate this function with [`@DBOS.transaction`](../tutorials/step-tutorial.md#transactions).

```python
@DBOS.transaction()
def save_to_db(symbol, price):
    DBOS.sql_session.execute(stock_prices.insert().values(stock_symbol=symbol, stock_price=price))

@DBOS.transaction()
def fetch_alerts():
    query = alerts.select()
    return {alert.stock_symbol:alert for alert in DBOS.sql_session.execute(query).fetchall()}
```


## Initializing the app

In our main function, let's launch DBOS, then sleep the main thread forever while the scheduled job runs in the background:

```python 
if __name__ == "__main__":
    DBOS.launch()
    threading.Event().wait()
```

## Visualizing with Streamlit

Finally, let's configure a small frontend using Streamlit to visualize stock prices and provide a UI for configuring alerts.

<details>
<summary>Visualizing with Streamlit</summary>

```python showLineNumbers title="streamlit.py"
# This part of the app uses Streamlit for data visualization.
# We separate the Streamlit script from the DBOS ingestion code
# because Streamlit re-runs the entire script every time it's viewed.

# First, let's do imports and configure Streamlit with a title and some custom CSS.

import os

import pandas as pd
import plotly.express as px
import streamlit as st
from schema import alerts, stock_prices
from sqlalchemy import create_engine, delete, desc, insert, select

st.set_page_config(page_title="Stock Prices", page_icon=":chart_with_upwards_trend:")

st.markdown(
    """
        <style>
            #MainMenu {visibility: hidden;}
            header {visibility: hidden;}
        </style>
        """,
    unsafe_allow_html=True,
)
st.title("Stock Watcher")
st.markdown(
    "This app uses DBOS to fetch stock prices from Yahoo Finance, store them into Postgres, and display them using Streamlit."
)

# Then, let's load database connection information from dbos-config.yaml
# and use it to create a database connection using sqlalchemy.
database_url = os.environ.get("DBOS_DATABASE_URL", "postgresql+psycopg://postgres:dbos@localhost:5432/stock_prices?connect_timeout=5")
engine = create_engine(database_url)


# We will use this connection to load stock prices data from the database.
def load_stocks_data():
    query = select(stock_prices).order_by(desc(stock_prices.c.timestamp)).limit(10000)
    df = pd.read_sql(query, engine)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["rate_of_change"] = df.groupby("stock_symbol")["stock_price"].pct_change() * 100
    return df


stocks_prices_df = load_stocks_data()

# Create a sidebar with a dropdown filter for stock symbols
with st.sidebar:
    st.header("Filters")
    stock_symbols = ["All"] + stocks_prices_df["stock_symbol"].unique().tolist()
    stock_symbol_filter = st.selectbox(
        "Select Stock Symbol", options=stock_symbols, index=0  # Select "All" by default
    )
    st.header("Display")
    display_mode = st.selectbox(
        "Select Display Mode",
        options=["Stock Prices", "Rate of Change"],
        index=0,  # Select "Stock Prices" by default
    )

if stock_symbol_filter == "All":
    filtered_df = stocks_prices_df
else:
    filtered_df = stocks_prices_df[
        stocks_prices_df["stock_symbol"] == stock_symbol_filter
    ]
if display_mode == "Stock Prices":
    y_label = "Stock Price ($)"
    y_column = "stock_price"
else:
    y_label = "Rate of Change (%)"
    y_column = "rate_of_change"

# Now let's group the stock prices by stock symbol and plot them using Plotly Express.
fig = px.line(
    filtered_df,
    x="timestamp",
    y=y_column,
    color="stock_symbol",
    markers=True,
    title="Stocks Values Over Time",
)
# Set the x-axis title
fig.update_xaxes(title_text="Timestamp")
# Set the y-axis title
fig.update_yaxes(title_text=y_label)

# Display the plot in Streamlit
st.plotly_chart(fig)


# Now, let's add a table to manage alerts
# First let's load the alerts data from the database
def load_alerts_data():
    query = select(alerts)
    df = pd.read_sql(query, engine)
    return df.drop(columns=["phone_number"])


alerts_df = load_alerts_data()

# Now let's display the alerts data in a table
st.header("Manage SMS Alerts")

# Input fields for adding a new alert
alert_stock_symbol = st.selectbox(
    "Select Stock Symbol",
    key="alert_stock_symbol",
    options=stocks_prices_df["stock_symbol"].unique().tolist(),
    index=0,  # Select the first stock symbol by default
)
price_threshold = st.text_input("Price Threshold")
phone_number = os.environ.get("MY_PHONE_NUMBER")

if st.button("Create Alert"):
    if not phone_number:
        st.error("Please set the MY_PHONE_NUMBER environment variable.")
    elif not alert_stock_symbol or not price_threshold:
        st.error("Please fill in all the fields.")
    else:
        with engine.connect() as conn:
            stmt = insert(alerts).values(
                stock_symbol=alert_stock_symbol,
                price_threshold=price_threshold,
                phone_number=phone_number,
            )
            conn.execute(stmt)
            conn.commit()
            st.success("Alert created successfully.")
            st.rerun()

alert_to_delete = st.selectbox(
    "Select Alert to delete",
    options=alerts_df["stock_symbol"].tolist(),
    index=0,  # Select the first alert by default
)

if st.button("Delete an alert"):
    if alert_to_delete:
        with engine.connect() as conn:
            stmt = delete(alerts).where(alerts.c.stock_symbol == alert_to_delete)
            conn.execute(stmt)
            conn.commit()
            st.success("Alert deleted successfully.")
            st.rerun()
    else:
        st.error("Please fill in the symbol name.")

st.dataframe(alerts_df)
```

</details>