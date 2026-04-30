---
sidebar_position: 60
title: Spring Boot Starter
toc_max_heading_level: 3
---

The `transact-spring-boot-starter` provides Spring Boot auto-configuration for DBOS Transact.

:::danger
DBOS requires a PostgreSQL database. If a non-PostgreSQL `DataSource` is provided or auto-detected, startup will throw an `IllegalStateException`.
:::

## Auto-Configured Beans

| Bean | Description |
|------|-------------|
| `DBOSConfig` | Built from `dbos.*` properties. Declare your own to replace it; use `DBOSConfigCustomizer` to extend it. |
| `DBOS` | The main DBOS instance, injected from `DBOSConfig`. |
| `DBOSLifecycle` | `SmartLifecycle` that calls `dbos.launch()` on context start and `dbos.shutdown()` on context stop. Uses `DEFAULT_PHASE` (`Integer.MAX_VALUE`), so DBOS starts last (after all other beans) and stops first. |
| `DBOSAspect` | AOP aspect that intercepts `@Workflow` and `@Step` calls on Spring-managed beans. |
| `DBOSWorkflowRegistrar` | Scans all singleton beans after initialization and registers those with `@Workflow` methods. |

All beans are `@ConditionalOnMissingBean` — declare your own to replace any of them.

## Configuration Properties

All properties are in the `dbos.*` namespace.

### Application

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `dbos.application.name` | `String` | — | Application name. Falls back to `spring.application.name`. One of the two must be set. |
| `dbos.application.version` | `String` | — | Application version string used for version management. |

### Datasource

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `dbos.datasource.url` | `String` | — | JDBC URL for the DBOS system database. If unset, DBOS uses the application's primary `DataSource` bean. |
| `dbos.datasource.username` | `String` | — | Database username. |
| `dbos.datasource.password` | `String` | — | Database password. |
| `dbos.datasource.schema` | `String` | `dbos` | Schema for DBOS system tables. |
| `dbos.datasource.migrate` | `boolean` | `true` | Whether to run database migrations on startup. |

### DBOS Conductor

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `dbos.conductor.key` | `String` | — | DBOS Conductor API key. |
| `dbos.conductor.domain` | `String` | — | DBOS Conductor domain. |

### Admin Server

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `dbos.admin-server.enabled` | `boolean` | `false` | Whether to enable the admin HTTP server. |
| `dbos.admin-server.port` | `int` | `3001` | Port for the admin HTTP server. |

### Other

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `dbos.executor-id` | `String` | — | Unique executor ID for this instance. |
| `dbos.enable-patching` | `boolean` | `false` | Enable [workflow patching](./methods.md#patch). |
| `dbos.listen-queues` | `List<String>` | `[]` | Queues this executor should dequeue from. |
| `dbos.scheduler-polling-interval` | `Duration` | — | Override the default scheduler polling interval. |

## DBOSConfigCustomizer

```java
@FunctionalInterface
public interface DBOSConfigCustomizer {
    DBOSConfig customize(DBOSConfig config);
}
```

Declare one or more `DBOSConfigCustomizer` beans to modify the auto-configured `DBOSConfig` without replacing it. Customizers run in `@Order` / `Ordered` sequence after the base config is assembled from `dbos.*` properties.

```java
@Bean
@Order(1)
public DBOSConfigCustomizer myCustomizer() {
    return config -> config.withAdminServer(true).withAdminServerPort(8081);
}
```

## DBOSWorkflowRegistrar

Implements `SmartInitializingSingleton`. After all singletons are created, it scans every bean for methods annotated with `@Workflow` or `@Step`. Beans containing `@Workflow` methods are registered with DBOS for durable execution and recovery. `@Step` methods are not registered directly — they are intercepted at runtime by `DBOSAspect`.

**Requirements:**
- Beans with `@Workflow` or `@Step` methods must be **singletons**. Prototype-scoped beans throw `IllegalStateException`.
- DBOS registers the raw (unwrapped) bean target. Calls made via `this` inside a workflow body bypass the Spring proxy and are not intercepted by `DBOSAspect`. Use a self-injected proxy instead (see [Spring Boot Integration tutorial](../tutorials/spring-boot-integration.md#defining-workflows-and-steps))

**Multiple beans of the same class:**

| Situation | Instance name |
|-----------|---------------|
| Only one bean of the class | null string (default) |
| Multiple beans — the `@Primary` one | null string (default) |
| Multiple beans — non-primary | Spring bean name |

## DBOSAspect

An `@Aspect` that intercepts:

- **`@Workflow` methods** — routes the call through `dbos.integration().runWorkflow(...)` for durable execution and recovery.
- **`@Step` methods** — delegates to `dbos.runStep(...)` when called inside a workflow context; executes directly otherwise.

Spring AOP intercepts only calls that go through the Spring proxy. `this.someStep()` calls inside a workflow body are **not** intercepted. Inject a self-reference to ensure step calls are durable:

```java
@Service
public class MyService {
    @Autowired MyService self;

    @Workflow
    public String myWorkflow() {
        return self.myStep();  // intercepted — durable
        // this.myStep();      // NOT intercepted — runs outside DBOS
    }

    @Step
    public String myStep() { return "result"; }
}
```
