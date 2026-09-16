# DBOS Lifecycle

> The DBOS class is a singleton&mdash;it must be configured and launched exactly once in a program's lifetime, before running any DBOS workflows.
> Here, we document its lifecycle.
> Other methods and variables are documented [here](./methods.md).

### DBOS.setConfig

```typescript
DBOS.setConfig(
    config: DBOSConfig
)
```

Configure DBOS.
Must be called before [`DBOS.launch`](#dboslaunch), which throws a `DBOSInitializationError` if no configuration, or no application `name`, was provided.
Configuration is documented [here](./configuration.md).

**Parameters:**
- **config**: Configuration parameters for DBOS. See the [configuration docs](./configuration.md).

### DBOS.launch

```typescript
DBOS.launch(
    options?: DBOSLaunchOptions
): Promise<void>
```

```typescript
interface DBOSLaunchOptions {
  conductorKey?: string;
  conductorURL?: string;
  conductorExecutorMetadata?: Record<string, unknown>;
}
```

Launch DBOS, initializing database connections and starting queues and scheduled workflows.
Should be called after all workflows and steps are registered.
**You should not call a DBOS function until after DBOS is launched.**

For example, here is one way to launch DBOS in an app:

```typescript
async function main() {
  // Configure DBOS
  DBOS.setConfig({
    "name": "dbos-node-toolbox",
    "applicationVersion": "0.1.0",
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  });
  // Launch DBOS
  await DBOS.launch();
}

main().catch(console.log);
```

**Parameters:**
- **conductorKey**: An API key for [DBOS Conductor](../../production/conductor.md). If provided, application connects to Conductor. API keys can be created from the [DBOS console](https://console.dbos.dev).
- **conductorURL**: The URL of the Conductor service to connect to. Only set if you are self-hosting Conductor.
- **conductorExecutorMetadata**: A JSON-serializable dictionary of metadata to associate with this executor. This metadata is sent to Conductor and displayed on the dashboard, making it easier to identify executors (e.g., by region, instance type, or deployment environment).

### DBOS.shutdown

```typescript
DBOS.shutdown(
  options?: {
    deregister?: boolean;
    workflowCompletionTimeoutMS?: number;
  }
): Promise<void>
```

Shut down DBOS, stopping background processing (such as queue dispatch, schedules, and event receivers) and closing database connections.
Shutdown does not wait for workflows still running in this process to complete unless `workflowCompletionTimeoutMS` is set.
A workflow still running when database connections close fails in this process at its next database operation, but it remains `PENDING` in the system database so it can be recovered later.

In a test environment, after this completes DBOS can be re-configured and `launch()` can be called again.
[`DBOS.applicationVersion`](./methods.md#dbosapplicationversion) and [`DBOS.executorID`](./methods.md#dbosexecutorid) keep their values from the last launch until DBOS is launched again.

**Parameters:**
- **deregister**: If true, all current function, instance, data source, event receiver, and any other in-process registrations will be cleared, allowing a full set of replacement registrations to be made prior to the next `launch()`. Queues and schedules persisted in the system database are not affected. Useful for testing.
- **workflowCompletionTimeoutMS**: Wait this many milliseconds for workflows running in this process to complete before shutting down. Defaults to not waiting.

### DBOS.logRegisteredEndpoints

```typescript
DBOS.logRegisteredEndpoints(): void
```

Logs all DBOS functions that are bound to endpoints, such as Kafka consumers and any other library event receivers.  This can be a useful diagnostic to call after DBOS is launched.
