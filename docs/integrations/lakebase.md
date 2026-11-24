---
sidebar_position: 19
title: Lakebase
hide_table_of_contents: true
---

# Use DBOS With Lakebase

Here's how to connect your DBOS application running on your computer or cloud environment to your Databricks Lakebase Postgres database.

### 1. Set up a Local Application

If you haven't already, follow the [quickstart](../quickstart.md) to set up a DBOS application locally.
The rest of this guide will assume you have a local application.

### 2. Connect to Lakebase

<LargeTabs groupId="auth"  queryString="auth">
<LargeTabItem value="password" label="Native Postgres Password Authentication">

From the "Roles & Databases" tab of your Lakebase console, create a Postgres role that you will use to access your Lakebase database from your DBOS application.

<img src={require('@site/static/img/lakebase/create-role.png').default} alt="Create Role" width="800" className="custom-img"/>

Next, click "Connect" on your Lakebase console to retrieve connection information for your Lakebase database.
You should see a screen that looks like this:

<img src={require('@site/static/img/lakebase/connect.png').default} alt="Create Role" width="800" className="custom-img"/>

This page shows the connection string for your database.
There are a few settings you may wish to alter before retrieving this connection string:

1. Select the Postgres role you created from the dropdown.
2. Make sure you are viewing your "Connection string" from the dropdown.
3. By default, you will use the `databricks_postgres` database. If you want to use a different database, create it from the dropdown.

When you are ready, copy the connection string (including the password) from the dashboard and set the `DBOS_SYSTEM_DATABASE_URL` environment variable to it:

```
export DBOS_SYSTEM_DATABASE_URL="<your connection string>"
```

</LargeTabItem>
<LargeTabItem value="oauth" label="OAuth Token Authentication">

:::info
Programmatic OAuth token generation through the Databricks SDK is only available in Python.
:::

First, install the Databricks SDK into your application, then follow [this guide](https://docs.databricks.com/aws/en/dev-tools/sdk-python#authentication) to authenticate:

```shell
pip install databricks-sdk
```

Then, add this code to your application to configure DBOS to retrieve and use a Databricks OAuth token for authentication with your Lakebase database:

<details>
<summary><strong>Databricks OAuth Authentication</strong></summary>

```python
import os

import psycopg
import sqlalchemy as sa
from databricks.sdk import WorkspaceClient
from dbos import DBOS, DBOSConfig


def create_databricks_oauth_engine(database_url: str, lakebase_endpoint: str) -> sa.Engine:
    """
    Create a SQLAlchemy engine that uses Databricks OAuth tokens for authentication.

    Each new connection fetches a fresh OAuth token from Databricks.
    Connections are replaced after 45 minutes, before their one-hour token expires.
    """
    workspace_client = WorkspaceClient()

    def get_connection() -> psycopg.Connection:
        token = workspace_client.postgres.generate_database_credential(
            endpoint=lakebase_endpoint
        ).token
        return psycopg.connect(
            database_url,
            password=token,
            # Identify DBOS connections in Lakebase (the name in your connection string takes precedence)
            fallback_application_name="dbos_transact_lakebase",
            connect_timeout=10,
            # End transactions left idle for over 60 seconds, releasing their locks
            options="-c idle_in_transaction_session_timeout=60000",
        )

    # DBOS doesn't apply its default pool settings to an engine you provide, so set them here
    return sa.create_engine(
        "postgresql+psycopg://",
        creator=get_connection,
        pool_size=20,
        max_overflow=0,
        pool_timeout=30,
        pool_pre_ping=True,
        pool_recycle=2700,  # 45 minutes
    )


if __name__ == "__main__":
    engine = create_databricks_oauth_engine(
        os.environ["DBOS_SYSTEM_DATABASE_URL"],
        os.environ["DATABRICKS_LAKEBASE_ENDPOINT"],
    )
    config: DBOSConfig = {
        "name": "my-app",
        "application_version": "0.1.0",
        "system_database_engine": engine,
    }
    DBOS(config=config)
    DBOS.launch()
```

</details>

DBOS doesn't apply its usual connection settings to an engine you provide, so this engine sets them instead: a pool of 20 connections, a check that each connection is alive before use, and timeouts for connecting and for idle transactions.

Next, click "Connect" on your Lakebase console to retrieve connection information for your Lakebase database.
You should see a screen that looks like this:

<img src={require('@site/static/img/lakebase/oauth-connect.png').default} alt="Create Role" width="800" className="custom-img"/>

This page shows the connection string for your database.
There are a few settings you may wish to alter before retrieving this connection string:

1. Make sure you are viewing your "Connection string" from the dropdown.
2. By default, you will use the `databricks_postgres` database. If you want to use a different database, create it from the dropdown.

When you are ready, copy the connection string from the dashboard and set the `DBOS_SYSTEM_DATABASE_URL` environment variable to it:

```
export DBOS_SYSTEM_DATABASE_URL="<your connection string>"
```

Also, set the `DATABRICKS_LAKEBASE_ENDPOINT` environment variable to your Lakebase endpoint:

```
export DATABRICKS_LAKEBASE_ENDPOINT="projects/<project-id>/branches/<branch-id>/endpoints/<compute-id>"
```

:::tip
DBOS creates its system tables when it launches, so your Postgres role needs `CREATE` privileges on the database. It does not need to be a superuser.
To run your application with fewer privileges, create the tables ahead of time as described in [Managing Postgres](../production/checklist.md#managing-postgres).
For an OAuth role, use a freshly generated token as the password in the connection string you pass to the migration command.
:::

</LargeTabItem>
</LargeTabs>

### 3. Launch Your Application

Now, launch your DBOS application.
It should successfully connect to your Lakebase database, printing your masked Lakebase database URL on startup.

After connecting your DBOS application to Lakebase, you can use the Lakebase console to view your DBOS system tables.
Open the "Tables" tab in the Lakebase console.
For your database, select the database to which you connected your DBOS application (default `databricks_postgres`).
For your schema, select "dbos". 
You can now see DBOS durably checkpoint your workflows to your Lakebase database:

<img src={require('@site/static/img/lakebase/tables.png').default} alt="Lakebase Tables Dashboard" width="800" className="custom-img"/>
