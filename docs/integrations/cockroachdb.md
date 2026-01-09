---
sidebar_position: 70
title: CockroachDB
hide_table_of_contents: true
---

:::info
Currently, CockroachDB is only compatible with DBOS Python and requires version >=2.8.0.
:::

Here's how to connect your DBOS application running on your computer or cloud environment to your CockroachDB database.

### 1. Set up a Local Application

If you haven't already, follow the [quickstart](../quickstart.md) to set up a DBOS application locally.
The rest of this guide will assume you have a local application.

### 2. Install the CockroachDB driver

Install a CockroachDB-compatible PostgreSQL driver:

```python
pip install psycopg2-binary sqlalchemy-cockroachdb
```

### 3. Connect to your CockroachDB Database

Retrieve your CockroachDB database connection information from your dashboard.
Then create a connection string with the following format:

```
cockroachdb://user:password@host:port/database
```

Be sure to specify the `cockroachdb://` driver!

Export this as an environment variable:


```
export DBOS_COCKROACHDB_URL="<your connection string>"
```

### 4. Configure Your DBOS Application

Now, configure your DBOS application to connect to CockroachDB as follows:

```python
from sqlalchemy import create_engine
from dbos import DBOS, DBOSConfig

database_url = os.environ.get("DBOS_COCKROACHDB_URL")
engine = create_engine(database_url)
config: DBOSConfig = {
    "name": "dbos-app",
    "system_database_url": database_url,
    # Create a custom SQLAlchemy engine to utilize the CockroachDB drivers
    "system_database_engine": engine,
    # CockroachDB does not support LISTEN/NOTIFY
    "use_listen_notify": False,
}
DBOS(config=config)
DBOS.launch()
```

When your launch your application, it should connect to your CockroachDB database!