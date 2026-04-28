---
sidebar_position: 200
title: DBOS Plugin Architecture
toc_max_heading_level: 3
---

# DBOS Plugin Architecture

:::tip
Unless you intend to extend the DBOS Transact library, you can ignore this topic.
:::

DBOS Transact for Java provides extension mechanisms for integrating with Java frameworks and external event sources.

**Framework integrations** — If you are using a supported framework, use its dedicated integration instead of building on this API directly:
- **Spring Boot**: Use the [`transact-spring-boot-starter`](./spring-boot-starter.md), which auto-configures DBOS, registers workflows from Spring beans, and manages the DBOS lifecycle alongside the Spring application context.

**Custom integrations** — If you are building a new framework integration or event receiver (Kafka, SQS, a custom scheduler, etc.), this page documents the lower-level extension points: lifecycle listeners, workflow registration, and external state storage.

## Lifecycle Listeners

Lifecycle listeners are a broad category of extensions that need to be notified when DBOS launches or shuts down.
Often, these listeners are connecting to extenal systems to integrate outside events into DBOS.
Examples include:

 - Kafka message consumers
 - SQS/JMS message receivers
 - Clock-based schedulers
 
What event receivers have in common is that they run in the background and execute DBOS functions in response to externally-triggered circumstances.

### Lifecycle Listener Architecture

During program initialization, event receivers are constructed and registered with the DBOS lifecycle.  Configuration may be collected during initialization, but no actions are taken until `dbos.launch()` is called.  Upon `launch`, event receivers should review their registrations and connect to any outside resources and report clear error messages if this fails.  After any initialization is complete, event receivers should commence processing events and initiating DBOS workflow method calls in response.  Event receivers are also told to deinitialize when DBOS shuts down.

### Listener Lifecycle

DBOS event receiver objects should implement the `DBOSLifecycleListener` interface:

```java
/**
 * For registering callbacks that hear about `dbos.launch()` and `dbos.shutdown()`. At this point,
 * DBOS is ready to run workflows, and no additional registrations are allowed.
 */
public interface DBOSLifecycleListener {
  /** Called from within dbos.launch, after workflow processing is allowed */
  void dbosLaunched(DBOS dbos);

  /** Called from within dbos.shutdown, before workflow processing is stopped */
  void dbosShutDown();
}
```

Upon construction, event receivers should register themselves via `dbos.integration().registerLifecycleListener(listener)`. Upon `dbos.launch()`, all registered `dbosLaunched()` methods will be called. Upon `dbos.shutdown()`, all registered `dbosShutDown()` methods will be called.

## DBOSIntegration

`DBOSIntegration` is the interface for framework integrators, AOP aspects, and event listeners. Obtain it via:

```java
DBOSIntegration integration = dbos.integration();
```

:::warning
`DBOSIntegration` is not part of the primary public API and may change without notice. Application code should use methods on `DBOS` directly.
:::

### registerLifecycleListener

```java
void registerLifecycleListener(DBOSLifecycleListener listener)
```

Register a lifecycle listener. Must be called before `dbos.launch()`. See [Listener Lifecycle](#listener-lifecycle) for the `DBOSLifecycleListener` interface.

### getRegisteredWorkflows

```java
Collection<RegisteredWorkflow> getRegisteredWorkflows()
```

Return all workflow methods registered with DBOS. Must be called after `dbos.launch()`.

### getRegisteredWorkflowInstances

```java
Collection<RegisteredWorkflowInstance> getRegisteredWorkflowInstances()
```

Return all class instances containing registered workflow methods. Must be called after `dbos.launch()`.

### getRegisteredWorkflow

```java
Optional<RegisteredWorkflow> getRegisteredWorkflow(String workflowName, String className)
Optional<RegisteredWorkflow> getRegisteredWorkflow(String workflowName, String className, String instanceName)
```

Find a specific registered workflow by its workflow name, class name, and optional instance name. Returns empty if no matching workflow is found. Must be called after `dbos.launch()`.

**Parameters:**
- **workflowName**: The name of the workflow function.
- **className**: The name of the class containing the workflow.
- **instanceName**: The instance name of the class (defaults to `""` if omitted).

### startRegisteredWorkflow

```java
WorkflowHandle<?, ?> startRegisteredWorkflow(
    RegisteredWorkflow regWorkflow, Object[] args, StartWorkflowOptions options)
```

Start or enqueue a workflow by its `RegisteredWorkflow` registration. Use this when dispatching workflows by registration rather than by direct invocation (e.g., from an event listener). Must be called after `dbos.launch()`.

**Parameters:**
- **regWorkflow**: The registered workflow to start. Obtain via `getRegisteredWorkflows()` or `getRegisteredWorkflow(...)`.
- **args**: Arguments to pass to the workflow function.
- **options**: Execution options such as workflow ID, queue, and timeout. Pass `null` to use defaults.

### runWorkflow

```java
Object runWorkflow(Object target, String instanceName, Method method, Object[] args, Workflow wfTag)
    throws Exception
```

Execute a workflow method via its reflective `Method` handle. Intended for use by AOP interceptors that capture workflow invocations at the proxy boundary. Must be called after `dbos.launch()`.

**Parameters:**
- **target**: The object instance on which the workflow method is declared.
- **instanceName**: The DBOS instance name for `target`, or `null` for the default.
- **method**: The workflow `Method` to invoke.
- **args**: Arguments to pass to the workflow method.
- **wfTag**: The `@Workflow` annotation present on `method`.

### registerWorkflow

```java
void registerWorkflow(Workflow wfTag, Object target, Method method, String instanceName)
```

Register a single workflow method via reflection. Must be called before `dbos.launch()`. Intended for framework integrators (e.g., AOP-based integrations) that construct proxies themselves.

**Parameters:**
- **wfTag**: The `@Workflow` annotation instance from the method.
- **target**: The object instance that owns the method.
- **method**: The `java.lang.reflect.Method` to register as a workflow.
- **instanceName**: Optional instance name (can be null).

### upsertExternalState

```java
ExternalState upsertExternalState(ExternalState state)
```

Insert or update a value in the DBOS system database for the given key. If a value already exists, it is updated unless `updateTime` or `updateSeq` on the new value is less than what is already stored. Returns the current stored state (which may have a higher version than what was submitted).

### getExternalState

```java
Optional<ExternalState> getExternalState(String service, String workflowName, String key)
```

Retrieve a value stored by an external service. Returns empty if no value exists for the key.

#### ExternalState

```java
public record ExternalState(
    String service,
    String workflowName,
    String key,
    String value,
    BigDecimal updateTime,
    BigInteger updateSeq) {}
```

Key fields — together these form a unique record per plugin entry:
- **service**: Unique identifier for the event receiver; separates entries from different plugins.
- **workflowName**: Fully qualified workflow function name; separates entries by workflow.
- **key**: Allows multiple records per service/workflow combination.

Value fields:
- **value**: A string value. Use JSON for structured data.
- **updateTime**: Timestamp when the value was set. Upserts with an earlier `updateTime` have no effect.
- **updateSeq**: Monotonic sequence number. Upserts with a smaller `updateSeq` have no effect.
