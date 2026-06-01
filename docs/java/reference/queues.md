---
sidebar_position: 40
title: Queues
---

Workflow queues ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

Queue configuration is persisted to the system database, so any DBOS process or [`DBOSClient`](./client.md) connected to the same system database can register, retrieve, and reconfigure queues.
All queue management methods below require `dbos.launch()` to have been called.

## Queue Management

### DBOS.registerQueue

```java
void registerQueue(String name, QueueOptions options)
void registerQueue(String name, QueueOptions options, QueueConflictResolution onConflict)
```

Register a queue and persist its configuration to the system database.
If the queue already exists in the database, the `onConflict` parameter controls whether its configuration is overwritten; it defaults to [`QueueConflictResolution.UPDATE_IF_LATEST_VERSION`](#queueconflictresolution).

**Parameters:**
- **name**: The name of the queue. Must be unique among all queues in the application.
- **options**: Initial configuration; see [`QueueOptions`](#queueoptions).
- **onConflict**: How to behave when a queue with this name already exists in the system database; see [`QueueConflictResolution`](#queueconflictresolution).

**Example syntax:**

```java
DBOS.registerQueue("email",
    QueueOptions.setConcurrency(10)
        .andRateLimit(100, Duration.ofSeconds(60)));
```

### DBOS.updateQueue

```java
void updateQueue(String name, QueueOptions options)
```

Update the configuration of an existing queue. Only fields set on `options` are modified; absent fields are left unchanged (see [`QueueOptions`](#queueoptions) and [`Field<T>`](#fieldt)).

**Example syntax:**

```java
// Change only the concurrency — rate limit and other fields are untouched
DBOS.updateQueue("email", QueueOptions.setConcurrency(20));
```

### DBOS.findQueue

```java
Optional<Queue> findQueue(String name)
```

Retrieve a queue by name from the system database. Returns empty if no queue with that name has been registered.

### DBOS.listQueues

```java
List<Queue> listQueues()
```

Return all queues registered in the system database.

### DBOS.deleteQueue

```java
boolean deleteQueue(String name)
```

Delete a queue from the system database. Returns `true` if the queue was deleted, `false` if it did not exist.

:::warning
Workflows already enqueued on a deleted queue can no longer be dequeued, executed, or recovered.
Cancel or drain pending workflows on the queue before deleting it.
:::

## QueueOptions

`QueueOptions` configures a queue for registration or partial update.
Each field uses [`Field<T>`](#fieldt) tri-state semantics: absent fields are ignored (leave the current database value unchanged), a present field with a value sets it, and a present field with `null` clears it.

```java
// Empty options (all fields absent)
QueueOptions.empty()

// Static factories — each creates options with a single field set
QueueOptions.setConcurrency(Integer value)
QueueOptions.setWorkerConcurrency(Integer value)
QueueOptions.setRateLimit(Integer max, Duration period)
QueueOptions.setRateLimit(int max, long period, TimeUnit unit)
QueueOptions.setPriorityEnabled(boolean value)
QueueOptions.setPartitionQueue(boolean value)
QueueOptions.setPollingInterval(Duration value)

// Chainable setters — start from any factory and chain additional fields
QueueOptions andConcurrency(Integer value)
QueueOptions andWorkerConcurrency(Integer value)
QueueOptions andRateLimit(Integer max, Duration period)
QueueOptions andRateLimit(int max, long period, TimeUnit unit)
QueueOptions andPriorityEnabled(boolean value)
QueueOptions andPartitionQueue(boolean value)
QueueOptions andPollingInterval(Duration value)
```

**Parameters:**
- **concurrency**: The maximum number of workflows from this queue that may run concurrently across all DBOS processes. Pass `null` to remove the limit.
- **workerConcurrency**: The maximum number of workflows from this queue that may run concurrently within a single DBOS process. Pass `null` to remove the limit.
- **rateLimit**: A limit on the maximum number of workflows (`max`) that may be started in a given `period`. Pass `null` for both to remove the limit.
- **priorityEnabled**: Enable setting priority for workflows on this queue.
- **partitionQueue**: Enable [partitioning](../tutorials/queue-tutorial.md#partitioning-queues) for this queue.
- **pollingInterval**: How often DBOS polls the database for new workflows to dequeue. Defaults to 1 second.

## QueueConflictResolution

```java
public enum QueueConflictResolution {
    ALWAYS_UPDATE,
    NEVER_UPDATE,
    UPDATE_IF_LATEST_VERSION
}
```

Controls how `DBOS.registerQueue` behaves when a queue with the same name already exists in the database:

- **`ALWAYS_UPDATE`** — overwrite the existing configuration unconditionally. Default for [`DBOSClient.registerQueue`](./client.md#registerqueue).
- **`NEVER_UPDATE`** — leave the existing configuration unchanged; no-op if the queue already exists.
- **`UPDATE_IF_LATEST_VERSION`** — overwrite the existing configuration only if the current application version is the latest registered version. Default for `DBOS.registerQueue`. Not available on `DBOSClient`.

## Field\<T\>

```java
public sealed interface Field<T> permits Field.Absent, Field.Present {
    record Absent<T>() implements Field<T> {}
    record Present<T>(T value) implements Field<T> {}

    static <T> Field<T> absent()           // field not specified
    static <T> Field<T> of(T value)        // field set to value (or null to clear)
    default boolean isPresent()
    default T get()
}
```

`Field<T>` is the tri-state wrapper used by each field of [`QueueOptions`](#queueoptions):

- `Field.Absent` — the field was not specified; the current database value is left unchanged.
- `Field.Present(value)` — the field was specified with a non-null value; the database value is set to `value`.
- `Field.Present(null)` — the field was specified with `null`; the database value is cleared (removed).

Use `Field.absent()` and `Field.of(value)` to construct values directly.
The `QueueOptions` convenience methods (`set*` / `and*`) call these automatically, so you rarely need to construct `Field` values by hand.

## Legacy: In-Memory Queues

:::warning Deprecated
The `Queue` record and pre-launch `dbos.registerQueue(Queue)` are deprecated in favour of [`DBOS.registerQueue`](#dbos-registerqueue), which persists queue configuration to the system database and supports runtime reconfiguration.
:::

### Queue

```java
new Queue(String name)
```

```java
public record Queue(
    String name,
    Integer concurrency,
    Integer workerConcurrency,
    boolean priorityEnabled,
    boolean partitioningEnabled,
    RateLimit rateLimit,
    Duration pollingInterval
) {
    public Queue withName(String name);
    public Queue withConcurrency(Integer concurrency);
    public Queue withWorkerConcurrency(Integer workerConcurrency);
    public Queue withRateLimit(RateLimit rateLimit);
    public Queue withRateLimit(int limit, Duration period);
    public Queue withRateLimit(int limit, long period, TimeUnit unit);
    public Queue withPriorityEnabled(boolean priorityEnabled);
    public Queue withPartitioningEnabled(boolean partitioningEnabled);
    public Queue withPollingInterval(Duration pollingInterval);
    public boolean hasLimiter();
}
```

```java
public static record RateLimit(int limit, Duration period) {}
```

Construct an in-memory queue at configuration time.
The constructor takes the same parameters as `QueueOptions` (other than `onConflict`).
In-memory queues must be registered with [`dbos.registerQueue(Queue)`](#dbosregisterqueue-legacy) before `dbos.launch()` and cannot be reconfigured at runtime.

**Example Syntax:**

```java
Queue queue = new Queue("example-queue").withWorkerConcurrency(5);
```

### dbos.registerQueue {#dbosregisterqueue-legacy}

```java
void registerQueue(Queue queue)
void registerQueues(Queue... queues)
```

Register one or more in-memory queues. Must be called before `dbos.launch()`.
