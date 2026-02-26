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

- **`withAppVersion(String appVersion)`**: The code version for this application and its workflows. Workflow versioning is documented [here](../tutorials/upgrading-workflows.md#versioning).

- **`withExecutorId(String executorId)`**:

- **`withDatabaseSchema(String schema)`**: Postgres database schema for system database tables. Defaults to `dbos`.

- **`withEnablePatching(boolean patchEnabled)`**: Enable workflow patching. Defaults to false.

- **`withListenQueues(Queue... queues)`**: Specify the queues this DBOS process should dequeue and execute workflows from. Defaults to dequeuing from all registered queues.

- **`withListenQueues(String... queues)`**: Specify the queues by name this DBOS process should dequeue and execute workflows from.

- **`withSerializer(DBOSSerializer serializer)`**: A custom serializer for the system database. See the [custom serialization section](#custom-serialization) for details.

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

## Custom Serialization

DBOS must serialize data such as workflow inputs and outputs and step return values to store it in the system database.
By default, data is serialized with Jackson (format name `java_jackson`), but you can optionally supply a custom serializer through DBOS configuration.
A custom serializer must implement the `DBOSSerializer` interface:

```java
import dev.dbos.transact.json.DBOSSerializer;

public interface DBOSSerializer {
  /**
   * Return a name for the serialization format.
   * This name is stored in the database to identify how data was serialized.
   */
  String name();

  /** Serialize a value to a string. */
  String stringify(Object value, boolean noHistoricalWrapper);

  /** Deserialize a string back to a value, or return null if the input is null. */
  Object parse(String text, boolean noHistoricalWrapper);

  /** Serialize a Throwable to a string. */
  String stringifyThrowable(Throwable throwable);

  /** Deserialize a string back to a Throwable, or return null if the input is null. */
  Throwable parseThrowable(String text);
}
```

The `name()` method must return a unique identifier for the serialization format.
This name is stored alongside serialized values in the database so that the correct deserializer is used when reading data back.

The `noHistoricalWrapper` parameter indicates whether the value is wrapped in an enclosing array.
When `noHistoricalWrapper` is `true`, the value is a raw `Object[]` array and should be serialized directly.
When it is `false`, the value is a single object.

For example, here is a skeleton custom serializer:

```java
import dev.dbos.transact.json.DBOSSerializer;

public class MyCustomSerializer implements DBOSSerializer {
    @Override
    public String name() { return "my_custom"; }

    @Override
    public String stringify(Object value, boolean noHistoricalWrapper) {
        // Serialize value to a string
    }

    @Override
    public Object parse(String text, boolean noHistoricalWrapper) {
        if (text == null) return null;
        // Deserialize string back to a value
    }

    @Override
    public String stringifyThrowable(Throwable throwable) {
        if (throwable == null) return null;
        // Serialize throwable to a string
    }

    @Override
    public Throwable parseThrowable(String text) {
        if (text == null) return null;
        // Deserialize string back to a Throwable
    }
}
```

Configure DBOS to use a custom serializer:

```java
DBOSConfig config = DBOSConfig.defaultsFromEnv("myApp")
    .withSerializer(new MyCustomSerializer());
DBOS.configure(config);
DBOS.launch();
```

If you use a custom serializer in your DBOS application, you must provide the same serializer to any [`DBOSClient`](./client.md) that interacts with the application:

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword, null, new MyCustomSerializer());
```