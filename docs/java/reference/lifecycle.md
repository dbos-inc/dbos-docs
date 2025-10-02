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