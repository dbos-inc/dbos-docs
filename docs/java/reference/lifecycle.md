---
sidebar_position: 10
title: DBOS Lifecycle
---

The DBOS class is a singleton&mdash;you should configure and launch it exactly once in a program's lifetime.
You manage and access it through static methods (e.g., `DBOS.configure()`, `DBOS.launch()`).
Here, we document configuration and lifecycle methods.

### DBOS.configure

```java
static synchronized Instance configure(DBOSConfig config)
```

Configure the DBOS singleton.

**DBOSConfig**

`DBOSConfig` is a with-based configuration record for configuring DBOS.
The application name, database URL, database user, and database password are required.


**Constructor:**

```java
DBOSConfig.defaults(String appName)
```

Create a DBOSConfig object.  This configuration can be adjusted by using `with` methods that produce new configurations.

**With Methods:**

- **`withAppName(String appName)`**: Your application's name. Required.

- **`withDatabaseUrl(String databaseUrl)`**: The JDBC URL for your system database. Required. A valid JDBC URL is of the form `jdbc:postgresql://host:port/database`

- **`withDbUser(String dbUser)`**: Your Postgres username or role. Required.

- **`withDbPassword(String dbPassword)`**: The password for your Postgres user or role. Required.

- **`withMaximumPoolSize(int maximumPoolSize)`**: The maximum size for the system database connection pool created by DBOS.

- **`withConnectionTimeout(int connectionTimeout)`**: The connection timeout for the system database connection created by DBOS.

- **`withAdminServer(boolean enable)`**: Whether to run an [HTTP admin server](../../production/self-hosting/admin-api.md) for workflow management operations. Defaults to false.

- **`withAdminServerPort(int port)`**: The port on which the admin server runs. Defaults to 3001.

- **`withMigrate(boolean enable)`**: If true, attempt to apply migrations to the system database.  Defaults to true.

- **`withConductorKey(String key)`**: An API key for [DBOS Conductor](../../production/self-hosting/conductor.md). If provided, application is connected to Conductor. API keys can be created from the [DBOS console](https://console.dbos.dev).

- **`withAppVersion(String appVersion)`**: The code version for this application and its workflows. Workflow versioning is documented [here](../tutorials/workflow-tutorial.md#workflow-versioning-and-recovery).

### DBOS.launch

```java
static void launch()
```

Launch DBOS, initializing database connections and beginning workflow recovery and queue processing.
This should be called after all workflows and queues are registered.
**You should not call a DBOS workflow until after DBOS is launched.**

### DBOS.shutdown

```java
static void shutdown()
```

Destroy the DBOS singleton.
After DBOS is shut down, a new singleton can be configured and launched.
This may be useful for testing DBOS applications.