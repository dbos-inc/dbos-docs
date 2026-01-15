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


**Constructors:**

```java
DBOSConfig.defaults(String appName)
DBOSConfig.defaultsFromEnv(String appName)
```

Create a DBOSConfig object.
The `defaults` static method only sets the application name and sets all other config fields to their default values.
The `defaultsFromEnv` static method reads database connection information from environment variables.

- **`DBOS_SYSTEM_JDBC_URL`**: the JDBC URL for your system database
- **`PGUSER`**: the Postgres username or role. Defaults to `postgres` if `PGUSER` environment variable is missing or empty.
- **`PGPASSWORD`**: The password for your Postgres user or role.

This configuration can be adjusted by using `with` methods that produce new configurations.

**With Methods:**

- **`withAppName(String appName)`**: Your application's name. Required.

- **`withDatabaseUrl(String databaseUrl)`**: The JDBC URL for your system database. A valid JDBC URL is of the form `jdbc:postgresql://host:port/database`. Required unless valid DataSource is provided.

- **`withDbUser(String dbUser)`**: Your Postgres username or role. Required unless valid DataSource is provided.

- **`withDbPassword(String dbPassword)`**: The password for your Postgres user or role. Required unless valid DataSource is provided.

- **`withDataSource(DataSource v)`**: Instead of providing DBOS with the JDBC URL, username and password, you can provide a configured DataSource for DBOS to use. DBOS uses `HikariDataSource` if a data source is not provided.

:::warning
Using a data source that doesn't support connection pooling like `PGSimpleDataSource` is not recommended. 
:::

- **`withAdminServer(boolean enable)`**: Whether to run an HTTP admin server for workflow management operations. Defaults to false.

- **`withAdminServerPort(int port)`**: The port on which the admin server runs. Defaults to 3001.

- **`withMigrate(boolean enable)`**: If true, attempt to apply migrations to the system database.  Defaults to true.

- **`withConductorKey(String key)`**: An API key for [DBOS Conductor](../../production/conductor.md). If provided, application is connected to Conductor. API keys can be created from the [DBOS console](https://console.dbos.dev).

- **`withAppVersion(String appVersion)`**: The code version for this application and its workflows. Workflow versioning is documented [here](../tutorials/workflow-tutorial.md#workflow-versioning-and-recovery).

- **`withExecutorId(String executorId)`**:

- **`withDatabaseSchema(String schema)`**: Postgres database schema for system database tables. Defaults to `dbos`.

- **`withEnablePatching(boolean patchEnabled)`**: Enable workflow patching. Defaults to false.

- **`withListenQueues(Queue... queues)`**: Specify the queues this DBOS process should dequeue and execute workflows from. Defaults to dequeuing from all registered queues.

- **`withListenQueues(String... queues)`**: Specify the queues by name this DBOS process should dequeue and execute workflows from.

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