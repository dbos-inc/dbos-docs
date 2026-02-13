---
sidebar_position: 70
title: CockroachDB
hide_table_of_contents: true
---

Here's how to connect your DBOS application running on your computer or cloud environment to your CockroachDB database.

<LargeTabs groupId="language"  queryString="language">
<LargeTabItem value="python" label="Python">

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

When you launch your application, it should connect to your CockroachDB database!

</LargeTabItem>
<LargeTabItem value="golang" label="Go">

### 1. Set up a Local Application

If you haven't already, follow the [quickstart](../quickstart.md) to set up a DBOS application locally.
The rest of this guide will assume you have a local application.

### 2. Connect to your CockroachDB Database

Retrieve your CockroachDB database connection information from your dashboard.
CockroachDB is PostgreSQL wire-compatible, so you can use a standard PostgreSQL connection string:

```
postgresql://user:password@host:port/database
```

Export this as an environment variable:

```
export DBOS_SYSTEM_DATABASE_URL="<your connection string>"
```

### 3. Configure Your DBOS Application

The Go SDK **automatically detects** CockroachDB when it connects to the database.
No special configuration or drivers are needed&mdash;just provide your CockroachDB connection URL as you would for PostgreSQL:

```go
dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
    AppName:     "dbos-app",
    DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
})
if err != nil {
    log.Fatal(err)
}
```

When you launch your application, DBOS will detect CockroachDB and automatically adjust its behavior:
- LISTEN/NOTIFY (not supported by CockroachDB) is replaced with polling-based notifications.
- Schema migrations are adapted for CockroachDB compatibility.

</LargeTabItem>
</LargeTabs>
