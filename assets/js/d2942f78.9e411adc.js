"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[9059],{3593:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>h,frontMatter:()=>r,metadata:()=>s,toc:()=>c});const s=JSON.parse('{"id":"python/examples/stock-tracker","title":"Stock Tracker","description":"In this example, we use DBOS to build and deploy an app that tracks stock prices and sends SMS alerts when the price of a stock crosses a certain threshold.","source":"@site/docs/python/examples/stock-tracker.md","sourceDirName":"python/examples","slug":"/python/examples/stock-tracker","permalink":"/python/examples/stock-tracker","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":3,"frontMatter":{"displayed_sidebar":"examplesSidebar","sidebar_position":3,"title":"Stock Tracker"},"sidebar":"examplesSidebar","previous":{"title":"Document Ingestion Pipeline","permalink":"/python/examples/document-detective"},"next":{"title":"Scheduled Reminders","permalink":"/python/examples/scheduled-reminders"}}');var i=n(4848),o=n(8453);const r={displayed_sidebar:"examplesSidebar",sidebar_position:3,title:"Stock Tracker"},a=void 0,l={},c=[{value:"Import and Initialize the App",id:"import-and-initialize-the-app",level:2},{value:"Stock Prices Watcher as an online cron job",id:"stock-prices-watcher-as-an-online-cron-job",level:2},{value:"Fetching stock prices",id:"fetching-stock-prices",level:2},{value:"Sending SMS alerts",id:"sending-sms-alerts",level:2},{value:"Saving stock prices to the database and fetching registered alerts",id:"saving-stock-prices-to-the-database-and-fetching-registered-alerts",level:2},{value:"Initializing the app",id:"initializing-the-app",level:2},{value:"Visualizing with Streamlit",id:"visualizing-with-streamlit",level:2}];function d(e){const t={a:"a",code:"code",h2:"h2",p:"p",pre:"pre",...(0,o.R)(),...e.components},{Details:n}=t;return n||function(e,t){throw new Error("Expected "+(t?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("Details",!0),(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.p,{children:"In this example, we use DBOS to build and deploy an app that tracks stock prices and sends SMS alerts when the price of a stock crosses a certain threshold.\nWe don't want to miss a good opportunity to trade, so it's important this app is punctual and reliable!"}),"\n",(0,i.jsxs)(t.p,{children:["You can see the application live ",(0,i.jsx)(t.a,{href:"https://max-stock-prices.cloud.dbos.dev/",children:"here"}),". All source code is ",(0,i.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/stock-prices",children:"available on GitHub"}),"."]}),"\n",(0,i.jsx)(t.h2,{id:"import-and-initialize-the-app",children:"Import and Initialize the App"}),"\n",(0,i.jsx)(t.p,{children:"Let's start off by importing the necessary libraries and initializing the app."}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-python",children:'import os\nimport datetime\nimport threading\nimport yfinance as yf\nfrom twilio.rest import Client\nfrom dbos import DBOS, DBOSConfig\nfrom schema import stock_prices, alerts\n\nconfig: DBOSConfig = {\n    "name": "stock-prices",\n    "database_url": os.environ.get(\'DBOS_DATABASE_URL\'),\n}\nDBOS(config=config)\n'})}),"\n",(0,i.jsx)(t.h2,{id:"stock-prices-watcher-as-an-online-cron-job",children:"Stock Prices Watcher as an online cron job"}),"\n",(0,i.jsxs)(t.p,{children:["Next, let's configure a DBOS ",(0,i.jsx)(t.a,{href:"/python/tutorials/scheduled-workflows",children:"scheduled workflow"})," to check stock prices every minute and send alerts if stock prices are above a configured threshold.\nThe ",(0,i.jsx)(t.a,{href:"/python/tutorials/scheduled-workflows",children:(0,i.jsx)(t.code,{children:"@DBOS.scheduled"})})," decorator tells DBOS to run this function on a schedule defined in ",(0,i.jsx)(t.a,{href:"https://en.wikipedia.org/wiki/Cron",children:"crontab syntax"}),", in this case once per minute.\nThe ",(0,i.jsx)(t.a,{href:"/python/tutorials/workflow-tutorial",children:(0,i.jsx)(t.code,{children:"@DBOS.workflow"})})," decorator tells DBOS to durably execute this function, so it runs exactly-once per minute and you'll never miss a stock price update or record a duplicate."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-python",children:"@DBOS.scheduled('* * * * *')\n@DBOS.workflow()\ndef fetch_stock_prices_workflow(scheduled_time: datetime, actual_time: datetime):\n    # For simplicity, let's declare inline a list of stock symbols to track\n    symbols = ['AAPL', 'GOOGL', 'AMZN', 'MSFT', 'TSLA', 'NVDA']\n    # Fetch registered alerts\n    registered_alerts = fetch_alerts()\n    # Fetch stock prices for each symbol\n    for symbol in symbols:\n        price = fetch_stock_price(symbol)\n        save_to_db(symbol, price)\n        # If there is a registered alert for that symbol, send a SMS if the price is above the alert threshold\n        if registered_alerts and symbol in registered_alerts:\n            if price > registered_alerts[symbol].price_threshold:\n                send_sms_alert(symbol, price, registered_alerts[symbol].phone_number)\n"})}),"\n",(0,i.jsx)(t.h2,{id:"fetching-stock-prices",children:"Fetching stock prices"}),"\n",(0,i.jsxs)(t.p,{children:["Let's write a function that fetches stock prices using the ",(0,i.jsx)(t.code,{children:"yfinance"})," library.\nWe annotate it with ",(0,i.jsx)(t.a,{href:"/python/tutorials/step-tutorial",children:(0,i.jsx)(t.code,{children:"DBOS.step"})})," to durably call it from the workflow above."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-python",children:'@DBOS.step()\ndef fetch_stock_price(symbol):\n    stock = yf.Ticker(symbol)\n    data = stock.history(period="1d")\n    if data.empty:\n        raise ValueError("No stock data found for the symbol.")\n    DBOS.logger.info(f"Stock price for {symbol} is {data[\'Close\'].iloc[0]}")\n    return data[\'Close\'].iloc[0]\n'})}),"\n",(0,i.jsx)(t.h2,{id:"sending-sms-alerts",children:"Sending SMS alerts"}),"\n",(0,i.jsxs)(t.p,{children:["Now, we'll use the Twilio API to send SMS alerts and write a DBOS ",(0,i.jsx)(t.a,{href:"../tutorials/step-tutorial",children:"step"})," to make it durable. You can sign up for a free Twilio account at ",(0,i.jsx)(t.a,{href:"https://www.twilio.com/try-twilio",children:"https://www.twilio.com/try-twilio"}),". We'll need a few environment variables to store our Twilio account SID, auth token and phone number."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-python",children:"twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')\ntwilio_auth_token = os.environ.get('TWILIO_AUTH_TOKEN')\ntwilio_phone_number = os.environ.get('TWILIO_PHONE_NUMBER')\n@DBOS.step()\ndef send_sms_alert(symbol, price, to_phone_number):\n    client = Client(twilio_account_sid, twilio_auth_token)\n    message = client.messages.create(\n        body=f\"{symbol} stock price is {price}.\",\n        from_=twilio_phone_number,\n        to=to_phone_number\n    )\n    DBOS.logger.info(f\"SMS sent: {message.sid}\")\n"})}),"\n",(0,i.jsx)(t.h2,{id:"saving-stock-prices-to-the-database-and-fetching-registered-alerts",children:"Saving stock prices to the database and fetching registered alerts"}),"\n",(0,i.jsxs)(t.p,{children:["Let's write two small functions to retrieve registered alerts and save stock prices to the database.\nWe annotate these functions with ",(0,i.jsx)(t.a,{href:"/python/tutorials/transaction-tutorial",children:(0,i.jsx)(t.code,{children:"@DBOS.transaction"})})," to get access to a pre-configured database client (",(0,i.jsx)(t.code,{children:"DBOS.sql_session"}),") and to durably call them from the workflow above."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-python",children:"@DBOS.transaction()\ndef save_to_db(symbol, price):\n    DBOS.sql_session.execute(stock_prices.insert().values(stock_symbol=symbol, stock_price=price))\n\n@DBOS.transaction()\ndef fetch_alerts():\n    query = alerts.select()\n    return {alert.stock_symbol:alert for alert in DBOS.sql_session.execute(query).fetchall()}\n"})}),"\n",(0,i.jsx)(t.h2,{id:"initializing-the-app",children:"Initializing the app"}),"\n",(0,i.jsx)(t.p,{children:"In our main function, let's launch DBOS, then sleep the main thread forever while the scheduled job runs in the background:"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-python",children:'if __name__ == "__main__":\n    DBOS.launch()\n    threading.Event().wait()\n'})}),"\n",(0,i.jsx)(t.h2,{id:"visualizing-with-streamlit",children:"Visualizing with Streamlit"}),"\n",(0,i.jsx)(t.p,{children:"Finally, let's configure a small frontend using Streamlit to visualize stock prices and provide a UI for configuring alerts."}),"\n",(0,i.jsxs)(n,{children:[(0,i.jsx)("summary",{children:"Visualizing with Streamlit"}),(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-python",metastring:'showLineNumbers title="streamlit.py"',children:'# This part of the app uses Streamlit for data visualization.\n# We separate the Streamlit script from the DBOS ingestion code\n# because Streamlit re-runs the entire script every time it\'s viewed.\n\n# First, let\'s do imports and configure Streamlit with a title and some custom CSS.\n\nimport os\n\nimport dbos\nimport pandas as pd\nimport plotly.express as px\nimport streamlit as st\nfrom schema import alerts, stock_prices\nfrom sqlalchemy import create_engine, delete, desc, insert, select\n\nst.set_page_config(page_title="Stock Prices", page_icon=":chart_with_upwards_trend:")\n\nst.markdown(\n    """\n        <style>\n            #MainMenu {visibility: hidden;}\n            header {visibility: hidden;}\n        </style>\n        """,\n    unsafe_allow_html=True,\n)\nst.title("Stock Watcher")\nst.markdown(\n    "This app uses DBOS to fetch stock prices from Yahoo Finance, store them into Postgres, and display them using Streamlit."\n)\n\n# Then, let\'s load database connection information from dbos-config.yaml\n# and use it to create a database connection using sqlalchemy.\ndatabase_url = dbos.get_dbos_database_url()\nengine = create_engine(database_url)\n\n\n# We will use this connection to load stock prices data from the database.\ndef load_stocks_data():\n    query = select(stock_prices).order_by(desc(stock_prices.c.timestamp)).limit(10000)\n    df = pd.read_sql(query, engine)\n    df["timestamp"] = pd.to_datetime(df["timestamp"])\n    df["rate_of_change"] = df.groupby("stock_symbol")["stock_price"].pct_change() * 100\n    return df\n\n\nstocks_prices_df = load_stocks_data()\n\n# Create a sidebar with a dropdown filter for stock symbols\nwith st.sidebar:\n    st.header("Filters")\n    stock_symbols = ["All"] + stocks_prices_df["stock_symbol"].unique().tolist()\n    stock_symbol_filter = st.selectbox(\n        "Select Stock Symbol", options=stock_symbols, index=0  # Select "All" by default\n    )\n    st.header("Display")\n    display_mode = st.selectbox(\n        "Select Display Mode",\n        options=["Stock Prices", "Rate of Change"],\n        index=0,  # Select "Stock Prices" by default\n    )\n\nif stock_symbol_filter == "All":\n    filtered_df = stocks_prices_df\nelse:\n    filtered_df = stocks_prices_df[\n        stocks_prices_df["stock_symbol"] == stock_symbol_filter\n    ]\nif display_mode == "Stock Prices":\n    y_label = "Stock Price ($)"\n    y_column = "stock_price"\nelse:\n    y_label = "Rate of Change (%)"\n    y_column = "rate_of_change"\n\n# Now let\'s group the stock prices by stock symbol and plot them using Plotly Express.\nfig = px.line(\n    filtered_df,\n    x="timestamp",\n    y=y_column,\n    color="stock_symbol",\n    markers=True,\n    title="Stocks Values Over Time",\n)\n# Set the x-axis title\nfig.update_xaxes(title_text="Timestamp")\n# Set the y-axis title\nfig.update_yaxes(title_text=y_label)\n\n# Display the plot in Streamlit\nst.plotly_chart(fig)\n\n\n# Now, let\'s add a table to manage alerts\n# First let\'s load the alerts data from the database\ndef load_alerts_data():\n    query = select(alerts)\n    df = pd.read_sql(query, engine)\n    return df.drop(columns=["phone_number"])\n\n\nalerts_df = load_alerts_data()\n\n# Now let\'s display the alerts data in a table\nst.header("Manage SMS Alerts")\n\n# Input fields for adding a new alert\nalert_stock_symbol = st.selectbox(\n    "Select Stock Symbol",\n    key="alert_stock_symbol",\n    options=stocks_prices_df["stock_symbol"].unique().tolist(),\n    index=0,  # Select the first stock symbol by default\n)\nprice_threshold = st.text_input("Price Threshold")\nphone_number = os.environ.get("MY_PHONE_NUMBER")\n\nif st.button("Create Alert"):\n    if alert_stock_symbol and price_threshold and phone_number:\n        with engine.connect() as conn:\n            stmt = insert(alerts).values(\n                stock_symbol=alert_stock_symbol,\n                price_threshold=price_threshold,\n                phone_number=phone_number,\n            )\n            conn.execute(stmt)\n            conn.commit()\n            st.success("Alert created successfully.")\n            st.rerun()\n    else:\n        st.error("Please fill in all the fields.")\n\nalert_to_delete = st.selectbox(\n    "Select Alert to delete",\n    options=alerts_df["stock_symbol"].tolist(),\n    index=0,  # Select the first alert by default\n)\n\nif st.button("Delete an alert"):\n    if alert_to_delete:\n        with engine.connect() as conn:\n            stmt = delete(alerts).where(alerts.c.stock_symbol == alert_to_delete)\n            conn.execute(stmt)\n            conn.commit()\n            st.success("Alert deleted successfully.")\n            st.rerun()\n    else:\n        st.error("Please fill in the symbol name.")\n\nst.dataframe(alerts_df)\n'})})]})]})}function h(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>r,x:()=>a});var s=n(6540);const i={},o=s.createContext(i);function r(e){const t=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),s.createElement(o.Provider,{value:t},e.children)}}}]);