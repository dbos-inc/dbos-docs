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

**Options:**

```java
public record DBOSConfig(
    String appName,
    String databaseUrl,
    String dbUser,
    String dbPassword,
    int maximumPoolSize,
    int connectionTimeout,
    boolean adminServer,
    int adminServerPort,
    String conductorKey,
    String appVersion
)
```

**Constructors:**

```java
new DBOSConfig.Builder()
```

Create a DBOSConfig object.

**Methods:**

- **`appName(String appName)`**: Your application's name. Required.

- **`databaseUrl(String databaseUrl)`**: The JDBC URL for your system database. Required. A valid JDBC URL is of the form `jdbc:postgresql://host:port/database`

- **`dbUser(String dbUser)`**: Your Postgres username or role. Required.

- **`dbPassword(String dbPassword)`**: The password for your Postgres user or role. Required.

- **`maximumPoolSize(int maximumPoolSize)`**: The maximum size for the system database connection pool created by DBOS.

- **`connectionTimeout(int connectionTimeout)`**: The connection timeout for the system database connection created by DBOS.

- **`runAdminServer()`**: Whether to run an [HTTP admin server](../../production/self-hosting/admin-api.md) for workflow management operations. Defaults to true.

- **`adminServerPort(int port)`**: The port on which the admin server runs. Defaults to 3001.

- **`conductorKey(String key)`**: An API key for [DBOS Conductor](../../production/self-hosting/conductor.md). If provided, application is connected to Conductor. API keys can be created from the [DBOS console](https://console.dbos.dev).

- **`appVersion(String appVersion)`**: The code version for this application and its workflows. Workflow versioning is documented [here](../tutorials/workflow-tutorial.md#workflow-versioning-and-recovery).

- **`build()`**: Build the configuration object. Must be called after all parameters are set.

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