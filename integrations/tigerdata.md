---
sidebar_position: 25
title: Tiger Data
hide_table_of_contents: true
---

# Use DBOS With Tiger Data

Here's how to connect your DBOS application running on your computer or cloud environment to a Postgres or TimescaleDB database running in Tiger Cloud (the makers of TimescaleDB).

### 1. Set up a Local Application

If you haven't already, follow the [quickstart](../quickstart.md) to set up a DBOS application locally.
The rest of this guide will assume you have a local application.

### 2. Connect to Your Database

Next, open your [dashboard](https://console.cloud.timescale.com/dashboard/services) and select your service.
You should see a screen that looks like this:

<img src={require('@site/static/img/timescaledb/timescaledb-connect.png').default} alt="TimescaleDB Connection Information" width="1000" className="custom-img"/>

Copy the connection string that appears on the right and set the `DBOS_SYSTEM_DATABASE_URL` environment variable to it:

```
export DBOS_SYSTEM_DATABASE_URL="<your connection string>"
```

For security, the TimescaleDB connection string does not include your password, so also set the `PGPASSWORD` environment variable to your database password:

```
export PGPASSWORD="<your database password>"
```

### 3. Launch Your Application

Now, launch your DBOS application.
It should successfully connect to your database, printing your masked Tiger Cloud database URL on startup.

After connecting your DBOS application, you can use the console to view your DBOS system tables.
Open the "SQL editor" tab in the Tiger Cloud console.
Run the following query:

```sql
SELECT * FROM dbos.workflow_status;
```

You should see the durable checkpoints DBOS makes for your workflows:

<img src={require('@site/static/img/timescaledb/timescaledb-query.png').default} alt="TimescaleDB Tables Dashboard" width="1000" className="custom-img"/>
