---
displayed_sidebar: examplesSidebar
sidebar_position: 3
title: Stocks Tracker
---

In this example, we use DBOS to build and deploy an app that tracks stock prices and send SMS alerts when the price of a stock crosses a certain threshold. We certainly don't want to miss a good opportunity to trade, so it's important this workflow is punctual and reliable!

You can see the application live [here](https://max-stock-prices.cloud.dbos.dev/). All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/stock-prices).

## Import and Initialize the App

Let's start off by importing the necessary libraries and initializing the app.

```python
import os
import datetime
import threading
import yfinance as yf
from twilio.rest import Client
from dbos import DBOS
from schema import stock_prices, alerts

DBOS()
```

## Stock Prices Watcher as an online cron job

We'll use a [DBOS Scheduled Workflow](../tutorials/scheduled-workflows) to make this job punctual and reliable.
Under the hood, DBOS leverages Postgres to store the job's execution status and schedule, ensuring that the job is executed even if the server is restarted.

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

We'll use the `yfinance` library to fetch stock prices and write a DBOS [step](../tutorials/step-tutorial) to make it durable.

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

We'll use the Twilio API to send SMS alerts and write a DBOS [step](../tutorials/step-tutorial) to make it durable. You can sign up for a free Twilio account at https://www.twilio.com/try-twilio. We'll need a few environment variables to store our Twilio account SID, auth token and phone number. The alerts themselves are configured on the app's streamlit frontend.

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
We'll use DBOS [Transactions](../tutorials/transaction-tutorial) to make these steps durable and ensure they happen exactly once.

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

Finally, let's initialize the app. We'll launch DBOS and have the main thread sleep forever while the background threads run.
```python
if __name__ == "__main__":
    DBOS.launch()
    threading.Event().wait()
```
