---
sidebar_position: 2
title: Neon
hide_table_of_contents: true
---

Here's how to connect your DBOS application running on your computer or cloud environment to your Neon database.

### 1. Set up a Local Application

If you haven't already, follow the [quickstart](../quickstart.md) to set up a DBOS application locally.
The rest of this guide will assume you have a local application.

### 2. Connect to Your Neon Database

Next, open your Neon dashboard at [`console.neon.tech`](https://console.neon.tech), select a project, and click "Connect" to retrieve connection information for your Neon database.
You should see a screen that looks like this:

<img src={require('@site/static/img/neon/neon-connect.png').default} alt="Neon Connection Information" width="800" className="custom-img"/>

This page shows the connection string for your database.
There are a few settings you may wish to alter before retrieving this connection string:

1. Make sure you are viewing your "Connection string" from the dropdown.
2. We recommend disabling connection pooling when connecting from DBOS.
3. By default, you will use the `neondb` database. If you want to use a different database, create it from the dropdown.

When you are ready, copy the connection string (including the password) from the dashboard and set the `DBOS_SYSTEM_DATABASE_URL` environment variable to it:

```
export DBOS_SYSTEM_DATABASE_URL="<your connection string>"
```

### 3. Launch Your Application

Now, launch your DBOS application.
It should successfully connect to your Neon database, printing your masked Neon database URL on startup.

After connecting your DBOS application to Neon, you can use the Neon console to view your DBOS system tables.
Open the "Tables" tab in the Neon console.
For your database, select the database to which you connected your DBOS application (default `neondb`).
For your schema, select "dbos". 
You can now see DBOS durably checkpoint your workflows to your Neon database:

<img src={require('@site/static/img/neon/neon-tables.png').default} alt="Neon Tables Dashboard" width="800" className="custom-img"/>
