"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6496],{1804:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>o,contentTitle:()=>i,default:()=>c,frontMatter:()=>s,metadata:()=>d,toc:()=>l});var n=a(4848),r=a(8453);const s={displayed_sidebar:"examplesSidebar",sidebar_position:8,title:"Earthquake Tracker"},i=void 0,d={id:"python/examples/earthquake-tracker",title:"Earthquake Tracker",description:"In this example, we use DBOS to build and deploy a real-time earthquake dashboard.",source:"@site/docs/python/examples/earthquake-tracker.md",sourceDirName:"python/examples",slug:"/python/examples/earthquake-tracker",permalink:"/python/examples/earthquake-tracker",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:8,frontMatter:{displayed_sidebar:"examplesSidebar",sidebar_position:8,title:"Earthquake Tracker"},sidebar:"examplesSidebar",previous:{title:"Scheduled Reminders",permalink:"/python/examples/scheduled-reminders"},next:{title:"Cloud Cron Quickstart",permalink:"/python/examples/cron-starter"}},o={},l=[{value:"Import and Initialize the App",id:"import-and-initialize-the-app",level:2},{value:"Retrieving Earthquake Data",id:"retrieving-earthquake-data",level:2},{value:"Storing Earthquake Data in Postgres",id:"storing-earthquake-data-in-postgres",level:2},{value:"Scheduling Earthquake Data Downloads",id:"scheduling-earthquake-data-downloads",level:2},{value:"Visualizing the Data with Streamlit",id:"visualizing-the-data-with-streamlit",level:2},{value:"Try it Yourself!",id:"try-it-yourself",level:2},{value:"Deploying to the Cloud",id:"deploying-to-the-cloud",level:3},{value:"Running Locally",id:"running-locally",level:3}];function h(e){const t={a:"a",code:"code",h2:"h2",h3:"h3",p:"p",pre:"pre",...(0,r.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(t.p,{children:["In this example, we use DBOS to build and deploy a real-time earthquake dashboard.\nIt works by streaming earthquake data from the USGS into Postgres, then displaying it using ",(0,n.jsx)(t.a,{href:"https://streamlit.io/",children:"Streamlit"}),"."]}),"\n",(0,n.jsxs)(t.p,{children:["All source code is ",(0,n.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/earthquake-tracker",children:"available on GitHub"}),"."]}),"\n",(0,n.jsxs)(t.p,{children:["You can see the dashboard live ",(0,n.jsx)(t.a,{href:"https://demo-earthquake-tracker.cloud.dbos.dev/",children:"here"}),"."]}),"\n",(0,n.jsx)(t.h2,{id:"import-and-initialize-the-app",children:"Import and Initialize the App"}),"\n",(0,n.jsxs)(t.p,{children:["In our main file (",(0,n.jsx)(t.code,{children:"earthquake_tracker/main.py"}),") let's start off with imports and initializing the DBOS app."]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:"import threading\nfrom datetime import datetime, timedelta\nfrom typing import TypedDict\n\nimport requests\nfrom dbos import DBOS\nfrom schema import earthquake_tracker\nfrom sqlalchemy import text\nfrom sqlalchemy.dialects.postgresql import insert\n\nDBOS()\n"})}),"\n",(0,n.jsx)(t.h2,{id:"retrieving-earthquake-data",children:"Retrieving Earthquake Data"}),"\n",(0,n.jsxs)(t.p,{children:["Now, let's write a function that queries the USGS for data on recent earthquakes.\nOur function will take in a time range and return the id, place, magnitude, and timestamp of all earthquakes that occured in that time range.\nWe annotate the function with ",(0,n.jsx)(t.a,{href:"/python/tutorials/step-tutorial",children:(0,n.jsx)(t.code,{children:"@DBOS.step"})})," so we can call it from a durable workflow later on."]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:'@DBOS.step()\ndef get_earthquake_data(\n    start_time: datetime, end_time: datetime\n) -> list[EarthquakeData]:\n    # USGS API endpoint for earthquake data\n    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"\n\n    # Format parameters for the API request\n    end_time_str = end_time.strftime("%Y-%m-%dT%H:%M:%S")\n    start_time_str = start_time.strftime("%Y-%m-%dT%H:%M:%S")\n    params = {\n        "format": "geojson",\n        "starttime": start_time_str,\n        "endtime": end_time_str,\n        "minmagnitude": 1.0,\n    }\n\n    # Make the API request and return its output\n    response = requests.get(url, params=params)\n    if response.status_code == 200:\n        data = response.json()\n        earthquakes = []\n        for item in data["features"]:\n            earthquake: EarthquakeData = {\n                "id": item["id"],\n                "place": item["properties"]["place"],\n                "magnitude": item["properties"]["mag"],\n                "timestamp": item["properties"]["time"],\n            }\n            earthquakes.append(earthquake)\n        return earthquakes\n    else:\n        raise Exception(\n            f"Error fetching data from USGS: {response.status_code} {response.text}"\n        )\n'})}),"\n",(0,n.jsx)(t.h2,{id:"storing-earthquake-data-in-postgres",children:"Storing Earthquake Data in Postgres"}),"\n",(0,n.jsxs)(t.p,{children:["Next, let's write a function that records earthquakes in Postgres.\nBecause earthquake data is sometimes updated later, this function should try to insert a new earthquake record, but if the earthquake is already in the database, update its record with new data.\nWe'll make it return true if we inserted a new earthquake and false if we updated an existing one.\nTo get access to a pre-configured database client (",(0,n.jsx)(t.code,{children:"DBOS.sql_session"}),"), we annotate this function with ",(0,n.jsx)(t.a,{href:"/python/tutorials/transaction-tutorial",children:(0,n.jsx)(t.code,{children:"@DBOS.transaction"})}),"."]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:'@DBOS.transaction()\ndef record_earthquake_data(data: EarthquakeData) -> bool:\n    return DBOS.sql_session.execute(\n        insert(earthquake_tracker)\n        .values(**data)\n        .on_conflict_do_update(index_elements=["id"], set_=data)\n        .returning(text("xmax = 0 AS inserted"))\n    ).scalar_one()\n'})}),"\n",(0,n.jsx)(t.h2,{id:"scheduling-earthquake-data-downloads",children:"Scheduling Earthquake Data Downloads"}),"\n",(0,n.jsxs)(t.p,{children:["Now, let's write a ",(0,n.jsx)(t.a,{href:"/python/tutorials/scheduled-workflows",children:"scheduled job"})," that records earthquakes every minute.\nBecause earthquake data is sometimes updated later, this job queries the USGS for the last hour of data, recording new earthquakes and updating records of existing earthquakes."]}),"\n",(0,n.jsxs)(t.p,{children:["The ",(0,n.jsx)(t.a,{href:"/python/tutorials/scheduled-workflows",children:(0,n.jsx)(t.code,{children:"@DBOS.scheduled"})})," decorator tells DBOS to run this function on a schedule defined in ",(0,n.jsx)(t.a,{href:"https://en.wikipedia.org/wiki/Cron",children:"crontab syntax"}),", in this case once per minute.\nThe ",(0,n.jsx)(t.a,{href:"/python/tutorials/workflow-tutorial",children:(0,n.jsx)(t.code,{children:"@DBOS.workflow"})})," decorator tells DBOS to durably execute this function, so it runs exactly-once per minute and you'll never miss an earthquake or record a duplicate."]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:'@DBOS.scheduled("* * * * *")\n@DBOS.workflow()\ndef run_every_minute(scheduled_time: datetime, actual_time: datetime):\n    end_time = scheduled_time\n    start_time = scheduled_time - timedelta(hours=1)\n    earthquakes = get_earthquake_data(start_time, end_time)\n    if len(earthquakes) == 0:\n        DBOS.logger.info(f"No earthquakes found between {start_time} and {end_time}")\n    for earthquake in earthquakes:\n        new_earthquake = record_earthquake_data(earthquake)\n        if new_earthquake:\n            DBOS.logger.info(f"Recorded earthquake: {earthquake}")\n'})}),"\n",(0,n.jsx)(t.p,{children:"Finally, in our main function, let's launch DBOS, then sleep the main thread forever while the scheduled job runs in the background:"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:'if __name__ == "__main__":\n    DBOS.launch()\n    threading.Event().wait()\n'})}),"\n",(0,n.jsx)(t.h2,{id:"visualizing-the-data-with-streamlit",children:"Visualizing the Data with Streamlit"}),"\n",(0,n.jsxs)(t.p,{children:["Now, in a separate script (",(0,n.jsx)(t.code,{children:"earthquake_tracker/streamlit.py"}),"), let's use Streamlit to create a real-time dashboard from the data in Postgres.\nWe use a separate script because Streamlit re-runs its entire script each time it's viewed."]}),"\n",(0,n.jsx)(t.p,{children:"First, let's do imports and configure Streamlit with a title and some custom CSS."}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:'import dbos\nimport pandas as pd\nimport plotly.express as px\nimport streamlit as st\nfrom schema import earthquake_tracker\nfrom sqlalchemy import create_engine, desc, select\n\nst.set_page_config(page_title="DBOS Earthquake Tracker", layout="wide")\nst.markdown(\n    """\n        <style>\n            #MainMenu {visibility: hidden;}\n            header {visibility: hidden;}\n        </style>\n        """,\n    unsafe_allow_html=True,\n)\nst.title("\ud83c\udf0e Earthquake Tracker")\nst.markdown(\n    "This app uses DBOS to stream earthquake data from the USGS into Postgres and displays it using Streamlit."\n)\n'})}),"\n",(0,n.jsx)(t.p,{children:"Next, let's read the most recent 10000 earthquakes in Postgres into a pandas dataframe.\nWe'll also do some transformations to the dataframe to make it more human-readable, such as transforming UNIX epoch timestamps into Python datetimes."}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:'def load_data():\n    database_url = dbos.get_dbos_database_url()\n    engine = create_engine(database_url)\n    query = (\n        select(earthquake_tracker)\n        .order_by(desc(earthquake_tracker.c.timestamp))\n        .limit(10000)\n    )\n    df = pd.read_sql(query, engine)\n    df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce")\n    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")\n    df = df.rename(\n        columns={\n            "timestamp": "UTC Timestamp",\n            "magnitude": "Magnitude",\n            "place": "Place",\n        }\n    )\n    return df.drop(columns=["id"])\n\n\ndf = load_data()\n'})}),"\n",(0,n.jsx)(t.p,{children:"Now, let's display our data using Streamlit.\nWe'll add a magnitude selector slider in a sidebar:"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:'with st.sidebar:\n    st.header("Filters")\n    min_magnitude = st.slider(\n        "Minimum Magnitude",\n        float(df["Magnitude"].min()),\n        float(df["Magnitude"].max()),\n        float(df["Magnitude"].min()),\n    )\nfiltered_df = df[(df["Magnitude"] >= min_magnitude)]\n'})}),"\n",(0,n.jsx)(t.p,{children:"In side-by-side columns, let's display the magnitude distribution and summary statistics of the earthquakes:"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:'col1, col2 = st.columns([2, 1])\nwith col1:\n    st.subheader("\ud83d\udcca Magnitude Distribution")\n    fig = px.histogram(\n        filtered_df, x="Magnitude", nbins=20, color_discrete_sequence=["#4CAF50"]\n    )\n    fig.update_layout(xaxis_title="Magnitude", yaxis_title="Count", bargap=0.1)\n    st.plotly_chart(fig, use_container_width=True)\nwith col2:\n    st.subheader("\ud83d\udcc8 Summary Statistics")\n    total_earthquakes = len(filtered_df)\n    avg_magnitude = filtered_df["Magnitude"].mean()\n    max_magnitude = filtered_df["Magnitude"].max()\n\n    st.metric("Total Earthquakes", f"{total_earthquakes:,}")\n    st.metric("Average Magnitude", f"{avg_magnitude:.2f}")\n    st.metric("Max Magnitude", f"{max_magnitude:.2f}")\n'})}),"\n",(0,n.jsx)(t.p,{children:"Finally, let's add a sortable data table with all the raw earthquake data:"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:"st.dataframe(filtered_df, use_container_width=True)\n"})}),"\n",(0,n.jsx)(t.h2,{id:"try-it-yourself",children:"Try it Yourself!"}),"\n",(0,n.jsx)(t.h3,{id:"deploying-to-the-cloud",children:"Deploying to the Cloud"}),"\n",(0,n.jsx)(t.p,{children:"To deploy this example to DBOS Cloud, first install the Cloud CLI (requires Node):"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-shell",children:"npm i -g @dbos-inc/dbos-cloud\n"})}),"\n",(0,n.jsxs)(t.p,{children:["Then clone the ",(0,n.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps",children:"dbos-demo-apps"})," repository and deploy:"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-shell",children:"git clone https://github.com/dbos-inc/dbos-demo-apps.git\ncd python/earthquake-tracker\ndbos-cloud app deploy\n"})}),"\n",(0,n.jsxs)(t.p,{children:["This command outputs a URL\u2014visit it to see some earthquakes!\nYou can also visit the ",(0,n.jsx)(t.a,{href:"https://console.dbos.dev/login-redirect",children:"DBOS Cloud Console"})," to see your app's status and logs."]}),"\n",(0,n.jsx)(t.h3,{id:"running-locally",children:"Running Locally"}),"\n",(0,n.jsxs)(t.p,{children:["First, clone and enter the ",(0,n.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps",children:"dbos-demo-apps"})," repository:"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-shell",children:"git clone https://github.com/dbos-inc/dbos-demo-apps.git\ncd python/earthquake-tracker\n"})}),"\n",(0,n.jsx)(t.p,{children:"Then create a virtual environment:"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-shell",children:"python3 -m venv .venv\nsource .venv/bin/activate\n"})}),"\n",(0,n.jsx)(t.p,{children:"This demo requires a Postgres database.\nIf you don't already have one, you can start one with Docker:"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-shell",children:"export PGPASSWORD=dbos\npython3 start_postgres_docker.py\n"})}),"\n",(0,n.jsx)(t.p,{children:"Then run the app in the virtual environment:"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-shell",children:"pip install -r requirements.txt\ndbos migrate\ndbos start\n"})}),"\n",(0,n.jsxs)(t.p,{children:["Visit ",(0,n.jsx)(t.a,{href:"http://localhost:8000",children:"http://localhost:8000"})," to see some earthquakes!"]})]})}function c(e={}){const{wrapper:t}={...(0,r.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(h,{...e})}):h(e)}},8453:(e,t,a)=>{a.d(t,{R:()=>i,x:()=>d});var n=a(6540);const r={},s=n.createContext(r);function i(e){const t=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function d(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),n.createElement(s.Provider,{value:t},e.children)}}}]);