---
sidebar_position: 10
title: DBOS Lifecycle
---

The DBOS class is a singleton&mdash;you should instantiate it (with `DBOS.initialize`) exactly once in a program's lifetime.
Here, we document its configuration and lifecycle methods.

### DBOS.initialize

```java
static DBOS initialize(DBOSConfig config)
```

Initialize the DBOS singleton from configuration.

### DBOSConfig

TODO: Will document this once it's cleaned up.

### DBOS.launch

```java
void launch()
```

Launch DBOS, initializing database connections and beginning workflow recovery and queue processing.
This should be called after all workflows and queues are registered.
**You should not call a DBOS workflow until after DBOS is launched.**

### DBOS.shutdown

```java
void shutdown()
```

Destroy the DBOS singleton.
After DBOS is shut down, a new singleton can be created with `initialize` and launched with `launch`.
This may be useful for testing DBOS applications.