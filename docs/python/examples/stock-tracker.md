---
displayed_sidebar: examplesSidebar
sidebar_position: 3
title: Stock Tracker
---

In this example, we use DBOS to build and deploy an app that tracks stock prices and sends SMS alerts when the price of a stock crosses a certain threshold.
We don't want to miss a good opportunity to trade, so it's important this app is punctual and reliable!

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
We annotate it with [`DBOS.step`](../tutorials/step-tutorial.md) to call it from the durable workflow above.

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
We annotate these functions with [`@DBOS.transaction`](../tutorials/transaction-tutorial.md) to get access to a pre-configured database client (`DBOS.sql_session`) and to call them from the durable workflow above.

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

Finally, in our main function, let's launch DBOS, then sleep the main thread forever while the scheduled job runs in the background:

```python
if __name__ == "__main__":
    DBOS.launch()
    threading.Event().wait()
```
