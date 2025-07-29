---
sidebar_position: 10
title: DBOS Class
pagination_prev: null
---

The DBOS class is a singleton&mdash;it must be configured and launched exactly once in a program's lifetime, before running any DBOS workflows.
Here, we document its lifecycle.
Other methods and variables are documented here.

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
  // Start an app server
  const PORT = 3000; // Must be 3000 in DBOS Cloud, can use environment variable locally
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

**Parameters:**
- **conductor_key**: An API key for [DBOS Conductor](../../production/self-hosting/conductor.md). If provided, application is connected to Conductor. API keys can be created from the [DBOS console](https://console.dbos.dev).

### DBOS.shutdown

```typescript
DBOS.shutdown(
): Promise<void>
```

Shut down DBOS, terminating all active workflows and closing database disconnections.
After this completes, DBOS can be re-configured and re-launched.
Useful for testing.
