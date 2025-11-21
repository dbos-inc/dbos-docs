---
sidebar_position: 200
title: DBOS Plugin Architecture
---

# DBOS Plugin Architecture

:::tip
Unless you intend to extend the DBOS Transact library, you can ignore this topic.
:::

DBOS Transact for Java currently provides extension mechanisms to integrate message receivers with the DBOS lifecycle, and initiate workflow functions upon receiving events.

## Event Receivers
Event receivers are a broad category of extensions that run in a DBOS app and handle requests or other outside events.  Examples include:
 - Kafka message consumers
 - SQS/JMS message receivers
 - Clock-based schedulers
 
What event receivers have in common is that they run in the background and execute DBOS functions in response to externally-triggered circumstances.

### Event Receiver Architecture

During program initialization, event receivers are constructed and registered with the DBOS lifecycle.  Configuration may be collected during initialization, but no actions are taken until `DBOS.launch()` is called.  Upon `launch`, event receivers should review their registrations and connect to any outside resources and report clear error messages if this fails.  After any initialization is complete, event receivers should commence processing events and initiating DBOS workflow method calls in response.  Event receivers are also told to deinitialize when DBOS shuts down.

### Lifecycle

DBOS event receiver objects should implement the `DBOSLifecycleListener` interface:
```java
/**
 * For registering callbacks that hear about `DBOS.launch()` and `DBOS.shutdown()`. At this point,
 * DBOS is ready to run workflows, and no additional registrations are allowed.
 */
public interface DBOSLifecycleListener {
  /** Called from within DBOS.launch, after workflow processing is allowed */
  void dbosLaunched();

  /** Called from within DBOS.shutdown, before workflow processing is stopped */
  void dbosShutDown();
}
```

Upon construction, event receivers should register themselves via `DBOS.registerLifecycleListener`.  Upon `DBOS.launch()`, all registered `dbosLaunched()` methods will be called.  Upon `DBOS.shutdown()`, all registered `dbosShutDown()` methods will be called.

### Finding Instances And Invoking Registered Workflows
At the time its `dbosLaunched` method is called, an listener can retrieve all classes and workflows with `DBOS.getRegisteredWorkflowInstances` and `DBOS.getRegisteredWorkflows`:

```java
  /**
   * Get all workflows registered with DBOS.
   *
   * @return list of all registered workflow methods
   */
  public static Collection<RegisteredWorkflow> getRegisteredWorkflows();

  /**
   * Get all workflow class instances registered with DBOS.
   *
   * @return list of all class instances containing registered workflow methods
   */
  public static Collection<RegisteredWorkflowInstance> getRegisteredWorkflowInstances();
```

Plugins should use Java annotations or other mechanisms to further identify which workflow methods are of interest to the plugin and to get configuration information.

### Calling Workflows From Plugins
DBOS `RegisteredWorkflow` functions should be invoked with a variant of `DBOS.startWorkflow` that accepts the `RegisteredWorkflow` argument:
```java
  /**
   * Execute a workflow based on registration and arguments. This is expected to be used by generic
   * callers, not app code.
   *
   * @param regWorkflow Registration of the workflow. @see getRegisteredWorkflows
   * @param args Workflow function arguments
   * @param options Execution options, such as ID, queue, and timeout/deadline
   * @return WorkflowHandle to the executed workflow
   */
  public static WorkflowHandle<?, ?> startWorkflow(
      RegisteredWorkflow regWorkflow, Object[] args, StartWorkflowOptions options);
```

### Keeping State In The System Database
An event receiver may keep state in the DBOS system database.  This state may be helpful for optimizing event dispatch, or backfilling events that came in while the event receiver was not running.  This state uses a key/value store design, where the event receiver may use [`DBOS.upsertExternalState`](#dbosupsertexternalstate) to insert/update the value associated with a key, and [`getExternalState`](#dbosgetexternalstate) to retrieve the value associated with a key.  This implementation also supports an update time or update sequence; updates made with lower sequence numbers or times are discared if the existing entry is marked with a later sequence / time.

Stored state follows the `DBOSExternalState` interface:
```java
/**
 * Represents a piece of state associated with an external service such as an event dispatcher.
 *
 * @param service The name of the external service that owns or stores the state.
 * @param workflowName The fully qualified function name of the workflow that this state belongs to.
 * @param key The key under which the external state is stored, allowing multiple values per service
 *     and workflow combination.
 * @param value The current value associated with the key.
 * @param updateTime The timestamp of the last update, represented as a decimal (e.g., UNIX epoch
 *     seconds), or {@code null} if unused.
 * @param updateSeq A monotonic sequence number for updates, used to detect the latest version, or
 *     {@code null} if not applicable.
 */
public record ExternalState(
    String service,
    String workflowName,
    String key,
    String value,
    BigDecimal updateTime,
    BigInteger updateSeq) {}
```

The key consists of:
* `service`: `service` should be unique to the event receiver keeping state, to separate from other table users
* `workflowName`: `workflowName` workflow function name should be the fully qualified / unique function name dispatched, to keep state separate by event function
* `key`: The `key` field allows multiple records per service / workflow function

The value stored for each `service`/`workflowFnName`/`key` combination includes:
* `value`: `value` is a string value.  JSON can be used to encode more complex values.
* `updateTime`: The time `value` was set.  Upserts of records with an earlier `updateTime` will have no effect on the stored state.
* `updateSeq`: An integer number indicating when the value was set.  Upserts of records with a smaller `updateSeq` will have no effect on the stored state.

#### `DBOS.upsertExternalState`
`upsertExternalState` inserts a value associated with a key.  If a value is already associated with the specified key, the stored value will be updated, unless `updateTime` or `updateSeq` is provided and is less that what is already stored in the system database.

```java
  /**
   * @param state ExternalState containing the service, workflow, key, and value to store
   * @return Value associated with the service+workflow+key combination, in case the stored value
   *     already had a higher version or timestamp
   */
  public static ExternalState upsertExternalState(ExternalState state);
```

The function return value indicates the contents of the system database for the specified key.  This is useful to detect if a more recent record is already stored in the database.

#### `DBOS.getExternalState`
Get a system database record stored by an external service.  A unique value is stored per combination of service, workflowName, and key.
```java
  /**
   * @param service Identity of the service maintaining the record
   * @param workflowName Fully qualified name of the workflow
   * @param key Key assigned within the service+workflow
   * @return ExternalState value and timestamps associated with the service+workflow+key combination
   */
  public static Optional<ExternalState> getExternalState(
      String service, String workflowName, String key) 
```
