---
sidebar_position: 10
title: DBOS Lifecycle
toc_max_heading_level: 3
---

You create a `DBOS` instance exactly once in a program's lifetime, register your workflows, then launch it.
Queues are stored in the system database and are registered after launch; see [Queues](./queues.md).
Here, we document the constructor, configuration, and lifecycle methods.

### DBOSConfig

`DBOSConfig` is a with-based configuration record for configuring DBOS.
The application name, and a system db datasource - specified either as database URL, user and password  or as a preconstructed `DataSource` are required.

:::danger
DBOS requires a PostgreSQL-compatible database. PostgreSQL and CockroachDB are supported. Creating a `DBOSConfig` with any other `DataSource` will throw an exception.
:::


**Constructors:**

```java
DBOSConfig.defaults(String appName)
DBOSConfig.defaultsFromEnv(String appName)
```

Create a DBOSConfig object.
The `defaults` static method only sets the application name and sets all other config fields to their default values.
The `defaultsFromEnv` static method reads database connection information from environment variables.

- **`DBOS_SYSTEM_JDBC_URL`**: the JDBC URL for your system database
- **`PGUSER`**: the PostgreSQL username or role. Defaults to `postgres` if `PGUSER` environment variable is missing or empty.
- **`PGPASSWORD`**: The password for your PostgreSQL user or role.

This configuration can be adjusted by using `with` methods that produce new configurations.

**With Methods:**

- **`withAppName(String appName)`**: Your application's name. Required.

- **`withDatabaseUrl(String databaseUrl)`**: The JDBC URL for your system database. A valid JDBC URL is of the form `jdbc:postgresql://host:port/database`. Required unless valid DataSource is provided.

- **`withDbUser(String dbUser)`**: Your PostgreSQL username or role. Required unless valid DataSource is provided.

- **`withDbPassword(String dbPassword)`**: The password for your PostgreSQL user or role. Required unless valid DataSource is provided.

- **`withDataSource(DataSource v)`**: Instead of providing DBOS with the JDBC URL, username and password, you can provide a configured DataSource for DBOS to use. DBOS uses `HikariDataSource` if a data source is not provided.

:::warning
Using a data source that doesn't support connection pooling like `PGSimpleDataSource` is not recommended. 
:::

- **`withDatabaseSchema(String schema)`**: PostgreSQL database schema for system database tables. Defaults to `dbos`.

- **`withMigrate(boolean enable)`**: If true, attempt to apply migrations to the system database.  Defaults to true.

- **`withConductorKey(String key)`**: An API key for [DBOS Conductor](../../production/conductor.md). If provided, application is connected to Conductor. API keys can be created from the [DBOS console](https://console.dbos.dev).

- **`withConductorDomain(String domain)`**: The domain of the DBOS Conductor instance to connect to. Only needed when using a self-hosted Conductor.

- **`withConductorExecutorMetadata(Map<String, Object> metadata)`**: Arbitrary key-value metadata attached to this executor and reported to Conductor.

- **`withAdminServer(boolean enable)`** *(deprecated since 0.9)*: Whether to run the built-in HTTP admin server. Use [DBOS Conductor](../../production/conductor.md) for remote administration instead.

- **`enableAdminServer()`** / **`disableAdminServer()`** *(deprecated since 0.9)*: Convenience methods equivalent to `withAdminServer(true)` and `withAdminServer(false)`.

- **`withAdminServerPort(int port)`** *(deprecated since 0.9)*: The port on which the admin server runs. Defaults to 3001.

- **`withAppVersion(String appVersion)`**: The code version for this application and its workflows. We recommend always setting it; if it is not set, DBOS computes a version from a hash of your workflow methods, which is only a fallback. Workflow versioning is documented [here](../tutorials/upgrading-workflows.md#versioning).

- **`withExecutorId(String executorId)`**: A unique process ID used to identify this application instance in distributed environments. If using DBOS Conductor or Cloud, this is set automatically.

- **`withEnablePatching(boolean patchEnabled)`**: Enable workflow patching. Defaults to false.

- **`withEnablePatching()`** / **`withDisablePatching()`**: Convenience methods equivalent to `withEnablePatching(true)` and `withEnablePatching(false)`.

- **`withListenQueue(String queueName)`** / **`withListenQueue(QueueName queue)`**: Add a single queue to the set of queues this DBOS process listens to. [`QueueName`](./queues.md#queuename) is a typed wrapper for a queue name.

- **`withListenQueues(String... queues)`** / **`withListenQueues(QueueName... queues)`**: Add multiple queues this DBOS process should dequeue and execute workflows from. Defaults to dequeuing from all registered queues.

- **`withListenQueue(Queue queue)`** / **`withListenQueues(Queue... queues)`** *(deprecated since 1.1)*: Equivalent to the `QueueName` overloads, taking the name of each `Queue`.

- **`withSchedulerPollingInterval(Duration interval)`**: How frequently the scheduler polls the database for new scheduled workflow firings. Defaults to 30 seconds.

- **`withUseListenNotify(boolean enable)`**: Whether to use PostgreSQL `LISTEN`/`NOTIFY` for real-time event delivery (e.g. `recv`, `getEvent`). Defaults to `true`. Automatically set to `false` when CockroachDB is detected, since CockroachDB does not support `LISTEN`/`NOTIFY`. Set this to `false` explicitly if your PostgreSQL configuration does not support it.

- **`withSerializer(DBOSSerializer serializer)`**: A custom serializer for the system database. See the [custom serialization section](#custom-serialization) for details.

- **`withNotificationCoalesceInterval(Duration interval)`**: Interval at which DBOS batches and sends the notifications that wake processes waiting on [events](./methods.md#getevent) and [streams](./methods.md#readstream) written by this process. Rather than one notifying transaction per write, pending wake-ups are sent once per interval. A shorter interval lowers wake-up latency in other processes; a longer one lowers the rate of notifying commits, each of which takes a global lock in PostgreSQL. Waiters in the same process are woken immediately either way. Defaults to 10 milliseconds; the minimum is 1 millisecond.

- **`withDatabasePollingConcurrency(Integer limit)`**: The maximum number of database-backed polling reads from wait operations (such as awaiting a workflow result, [`recv`](./methods.md#recv), [`getEvent`](./methods.md#getevent), and [`readStream`](./methods.md#readstream)) that may run concurrently against the system database connection pool. This prevents many waiters from checking out every connection in the pool and starving control-plane operations such as enqueue and dequeue, status writes, recovery, and cancellation. Defaults to half the pool size (minimum 1); the pool DBOS creates has 10 connections. Set to a non-positive value to remove the limit.


### Cloud Environment Variables

When deploying to DBOS Cloud, several environment variables are automatically set and override `DBOSConfig` values:

| Variable | Description |
|----------|-------------|
| `DBOS__CLOUD` | Set to `true` by DBOS Cloud. Enables cloud mode: `DBOS_APP_NAME` becomes required and the admin server is forced to port 3001. |
| `DBOS_APP_NAME` | Overrides `DBOSConfig.appName()`. Required when `DBOS__CLOUD=true`; `launch()` throws if absent. |
| `DBOS__CONDUCTOR_URL` | URL of the DBOS Cloud Conductor. Overrides `withConductorDomain(...)`. |
| `DBOS__CONDUCTOR_APP_NAME` | Application name used to identify this executor with Conductor. |
| `DBOS__CONDUCTOR_KEY` | API key for DBOS Cloud Conductor. Overrides `withConductorKey(...)`. Set by the cloud platform; avoids putting credentials in `DBOSConfig`. |
| `DBOS__VMID` | The executor ID of this process. Overrides `withExecutorId(...)` when `DBOS__CLOUD=true`. |

These variables take precedence over any values set in `DBOSConfig`. In local development you do not need to set them.

### DBOS Constructor

```java
new DBOS(DBOSConfig config)
```

Create and configure a DBOS instance.

### DBOS.version

```java
static String version()
```

Return the DBOS library version string.

### registerQueue / registerQueues *(deprecated since 1.1)* {#registerqueue--registerqueues}

```java
void registerQueue(Queue queue)
void registerQueues(Queue... queues)
```

Register one or more in-memory queues before `dbos.launch()`.
In-memory queues are deprecated for removal: register database-backed queues after launch with [`dbos.registerQueue(String, QueueOptions)`](./queues.md#dbosregisterqueue) instead.

### dbos.launch

```java
void launch()
```

Launch DBOS, initializing database connections and beginning workflow recovery and queue processing.
This should be called after all workflows are registered; queues are registered after launch.
Launch-time recovery returns this executor's `PENDING` workflows from the current application version to their queues (workflows that were not enqueued go to an internal queue), from which they are dequeued and run again; it is skipped when a Conductor key is configured or on DBOS Cloud, where Conductor manages recovery.
**You should not call a DBOS workflow until after DBOS is launched.**

### dbos.shutdown

```java
void shutdown()
```

Shut down the DBOS instance, releasing database connections and stopping workflow processing.
`DBOS` also implements `AutoCloseable`, so it can be used in a try-with-resources block.
This may be useful for testing DBOS applications.

### getQueue *(deprecated since 1.1)* {#getqueue}

```java
Optional<Queue> getQueue(String queueName)
```

Return the in-memory `Queue` registered before launch with the given name, or empty if no such queue is registered. Must be called after `dbos.launch()`.
Deprecated for removal: use [`dbos.findQueue`](./queues.md#dbosfindqueue), which reads the queue from the system database.

### Custom Serialization

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
  String serialize(Object value);

  /** Deserialize a string back to a value, or return null if the input is null. */
  Object deserialize(String text);

  /** Serialize a Throwable to a string. */
  String serializeThrowable(Throwable throwable);

  /** Deserialize a string back to a Throwable, or return null if the input is null. */
  Throwable deserializeThrowable(String text);
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
    .withAppVersion("0.1.0")
    .withSerializer(new MyCustomSerializer());
DBOS dbos = new DBOS(config);
// register workflows and queues...
dbos.launch();
```

If you use a custom serializer in your DBOS application, you must provide the same serializer to any [`DBOSClient`](./client.md) that interacts with the application:

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword, null, new MyCustomSerializer());
```