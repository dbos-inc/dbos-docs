---
sidebar_position: 10
title: DBOS Lifecycle
pagination_prev: null
---

The DBOS class is a singleton&mdash;it must be configured and launched exactly once in a program's lifetime, before running any DBOS workflows.
Here, we document its lifecycle.
Other methods and variables are documented [here](./methods.md).

### DBOS.setConfig

```typescript
DBOS.setConfig(
    config: DBOSConfig
)
```

Configure DBOS.
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

### DBOS.shutdown

```typescript
DBOS.shutdown(
  options?: { deregister?: boolean }
): Promise<void>
```

Shut down DBOS, terminating all active workflows and closing database disconnections.

In a test environment, after this completes DBOS can be re-configured and `launch()` can be called again.  If `options.deregister` is set, all current function, queue, instance, data source, event receiver, and any other registrations will be cleared, allowing a full set of replacement registrations to be made prior to the next `launch()`.

### DBOS.logRegisteredEndpoints

```typescript
DBOS.logRegisteredEndpoints(): void
```

Logs all DBOS functions that are bound to endpoints, including scheduled workflows, kafka consumers, and any other library event receivers.  This can be a useful diagnostic to call at DBOS launch.