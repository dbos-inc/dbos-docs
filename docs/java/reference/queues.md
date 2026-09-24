---
sidebar_position: 40
title: Queues
---

Workflow queues ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

Queue configuration is persisted to the system database, so any DBOS process or [`DBOSClient`](./client.md) connected to the same system database can register, retrieve, and reconfigure queues.
All queue management methods below are instance methods on your `DBOS` object and require `dbos.launch()` to have been called.

## Queue Management

### dbos.registerQueue

```java
void registerQueue(String name, QueueOptions options)
void registerQueue(String name, QueueOptions options, QueueConflictResolution onConflict)
```

Register a queue and persist its configuration to the system database.
The queue is owned by, and polled only by, this application.
If the queue already exists in the database, the `onConflict` parameter controls whether its configuration is overwritten; it defaults to [`QueueConflictResolution.UPDATE_IF_LATEST_VERSION`](#queueconflictresolution).

**Parameters:**
- **name**: The name of the queue. Queue names are unique across every application that shares the system database: registering a queue whose name is already owned by a different application throws `DBOSApplicationNameConflictException`. See [Sharing a System Database](../../explanations/sharing-a-system-database.md).
- **options**: Initial configuration; see [`QueueOptions`](#queueoptions).
- **onConflict**: How to behave when a queue with this name already exists in the system database; see [`QueueConflictResolution`](#queueconflictresolution).

**Example syntax:**

```java
dbos.registerQueue("email",
    QueueOptions.setConcurrency(10)
        .andRateLimit(100, Duration.ofSeconds(60)));
```

### dbos.updateQueue

```java
void updateQueue(String name, QueueOptions options)
```

Update the configuration of an existing queue. Only fields set on `options` are modified; absent fields are left unchanged (see [`QueueOptions`](#queueoptions) and [`Field<T>`](#fieldt)).

**Example syntax:**

```java
// Change only the concurrency — rate limit and other fields are untouched
dbos.updateQueue("email", QueueOptions.setConcurrency(20));
```

The updated configuration is validated as a whole (see [`QueueOptions`](#queueoptions)), and an update that would produce an invalid queue throws `IllegalArgumentException`.
The limits of a queue registered with the deprecated `partitionQueue` option cannot be updated; re-register the queue with per-partition limits instead.

### dbos.findQueue

```java
Optional<Queue> findQueue(String name)
```

Retrieve a queue by name from the system database. Returns empty if no queue with that name has been registered.

### dbos.listQueues

```java
List<Queue> listQueues()
List<Queue> listQueues(List<String> applicationName)
```

Return this application's queues, plus queues no application owns.
The second overload returns the queues owned by the named applications, plus queues no application owns; pass `null` for this application's queues, or an empty list for every application's queues.

### dbos.deleteQueue

```java
boolean deleteQueue(String name)
```

Delete a queue from the system database. Returns `true` if the queue was deleted, `false` if it did not exist.

:::warning
Workflows already enqueued on a deleted queue can no longer be dequeued, executed, or recovered.
However, if a queue with the same name is later registered, it will dequeue the leftover workflows.
Do not rely on this: stale workflows unexpectedly resuming on a future queue is rarely the intended behavior.
Instead, cancel or drain pending workflows on the queue before deleting it.
Workflows already stuck on a deleted queue can be moved to a registered queue with [`dbos.resumeWorkflow(workflowId, queueName)`](./methods.md#resumeworkflow).
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
QueueOptions.setPartitionConcurrency(Integer value)
QueueOptions.setPartitionWorkerConcurrency(Integer value)
QueueOptions.setPartitionRateLimit(Integer max, Duration period)
QueueOptions.setPartitionRateLimit(int max, long period, TimeUnit unit)
QueueOptions.setPollingInterval(Duration value)

// Chainable setters — start from any factory and chain additional fields
QueueOptions andConcurrency(Integer value)
QueueOptions andWorkerConcurrency(Integer value)
QueueOptions andRateLimit(Integer max, Duration period)
QueueOptions andRateLimit(int max, long period, TimeUnit unit)
QueueOptions andPartitionConcurrency(Integer value)
QueueOptions andPartitionWorkerConcurrency(Integer value)
QueueOptions andPartitionRateLimit(Integer max, Duration period)
QueueOptions andPartitionRateLimit(int max, long period, TimeUnit unit)
QueueOptions andPollingInterval(Duration value)

// Deprecated since 1.1: set a per-partition limit instead
QueueOptions.setPartitionQueue(boolean value)
QueueOptions andPartitionQueue(boolean value)

// Deprecated since 1.1: every queue is a priority queue
QueueOptions.setPriorityEnabled(boolean value)
QueueOptions andPriorityEnabled(boolean value)
```

**Parameters:**
- **concurrency**: The maximum number of workflows from this queue that may run concurrently across all DBOS processes. Pass `null` to remove the limit.
- **workerConcurrency**: The maximum number of workflows from this queue that may run concurrently within a single DBOS process. Pass `null` to remove the limit.
- **rateLimit**: A limit on the maximum number of workflows (`max`) that may be started in a given `period`. Pass `null` for both to remove the limit.
- **partitionConcurrency**: The maximum number of workflows from any one partition of this queue that may run concurrently across all DBOS processes. Pass `null` to remove the limit.
- **partitionWorkerConcurrency**: The maximum number of workflows from any one partition of this queue that may run concurrently within a single DBOS process. Pass `null` to remove the limit.
- **partitionRateLimit**: A limit on the maximum number of workflows (`max`) that may be started from any one partition in a given `period`. Pass `null` for both to remove the limit.
- **priorityEnabled** *(deprecated since 1.1)*: Ignored. Every queue dequeues workflows in priority order, so priority needs no queue configuration, and the queue is always stored as a priority queue.
- **pollingInterval**: How often DBOS polls the database for new workflows to dequeue. Defaults to 1 second.
- **partitionQueue** *(deprecated since 1.1)*: Enable [partitioning](../tutorials/queue-tutorial.md#partitioning-queues) with the queue-wide limits (`concurrency`, `workerConcurrency`, `rateLimit`) enforced per partition rather than across the queue. Set a per-partition limit instead. If a per-partition limit is also set at registration, this flag has no effect.

Setting any per-partition limit [partitions](../tutorials/queue-tutorial.md#partitioning-queues) the queue: every workflow enqueued on it must supply a partition key, and the per-partition limits are enforced for each partition key alongside the queue-wide limits.
Partitioning a queue that already has enqueued workflows strands them: they have no partition key, so they are never dequeued. Drain a queue before partitioning it.
Workflows stranded this way can be moved to a queue that is not partitioned with [`dbos.resumeWorkflow(workflowId, queueName)`](./methods.md#resumeworkflow).

The limits are validated when a queue is registered or updated, and an invalid combination throws `IllegalArgumentException`:
- Every concurrency limit, rate-limit `max`, rate-limit `period`, and `pollingInterval` must be greater than zero.
- A rate limit's `max` and `period` go together: registering a queue with only one of them set, or an update that would leave only one set, throws. Pass `null` for both to register without a limit or to clear one.
- A concurrency limit must be less than or equal to any wider limit that is also set; limits that are not set are not compared:
  - `workerConcurrency` and `partitionConcurrency` must each be less than or equal to `concurrency`.
  - `partitionWorkerConcurrency` must be less than or equal to `partitionConcurrency`, `workerConcurrency`, and `concurrency`.

## QueueConflictResolution

```java
public enum QueueConflictResolution {
    ALWAYS_UPDATE,
    NEVER_UPDATE,
    UPDATE_IF_LATEST_VERSION
}
```

Controls how `dbos.registerQueue` behaves when a queue with the same name already exists in the database:

- **`ALWAYS_UPDATE`** — overwrite the existing configuration unconditionally. Default for [`DBOSClient.registerQueue`](./client.md#registerqueue).
- **`NEVER_UPDATE`** — leave the existing configuration unchanged; no-op if the queue already exists.
- **`UPDATE_IF_LATEST_VERSION`** — overwrite the existing configuration only if the current application version is the latest registered version. Default for `dbos.registerQueue`. Not available on `DBOSClient`.

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

## Queue

```java
public record Queue(
    String name,
    Integer concurrency,
    Integer workerConcurrency,
    boolean priorityEnabled,
    boolean partitioningEnabled,
    RateLimit rateLimit,
    Integer partitionConcurrency,
    Integer partitionWorkerConcurrency,
    RateLimit partitionRateLimit,
    Duration pollingInterval,
    String applicationName
) {
    public QueueName queueName();         // the name as a QueueName
    public boolean hasLimiter();          // a queue-wide rate limit is set
    public boolean hasPartitionLimits();  // any per-partition limit is set
    public boolean isPartitioned();       // the queue dequeues per partition key
    public boolean isLegacyPartitioned(); // partitioned by the deprecated partitionQueue option
}

// Queue.RateLimit
public record RateLimit(int limit, Duration period) {}
```

A queue's configuration as stored in the system database, returned by [`dbos.findQueue`](#dbosfindqueue) and [`dbos.listQueues`](#dboslistqueues).
Nullable fields are `null` when the corresponding limit is not set.
`applicationName` is the application that owns the queue, or `null` if no application owns it.
`priorityEnabled` and `partitioningEnabled` are deprecated since 1.1: `priorityEnabled` is always `true`, and `isPartitioned()` / `isLegacyPartitioned()` replace `partitioningEnabled`.

## QueueName

```java
public record QueueName(String value) {
    public static QueueName of(String value)
}
```

A typed wrapper for a queue name, which must not be null or blank.
Several APIs take both a workflow ID and a queue name as a `String`, which makes them easy to confuse.
In particular, `new StartWorkflowOptions("example-queue")` sets the **workflow ID** to `"example-queue"`; it does not enqueue the workflow.
Pass a `QueueName` to say unambiguously that a string names a queue:

```java
// Enqueue on "example-queue"
var options = new StartWorkflowOptions(QueueName.of("example-queue"));
// Equivalent
var options2 = new StartWorkflowOptions().withQueue("example-queue");
```

`QueueName` is accepted by the `StartWorkflowOptions(QueueName)` constructor, `StartWorkflowOptions.withQueue`, `ForkOptions.withQueue`, `Debouncer.withQueue`, `DebouncerClient.withQueue`, and `DBOSConfig.withListenQueue(s)`.
The `String` overloads remain available; `QueueName` replaces the deprecated overloads that take a `Queue` object.

## Legacy: In-Memory Queues

:::warning Deprecated
In-memory queues are deprecated since 1.1 and will be removed in a future release.
This covers the `Queue` constructors and `with*` methods, [`dbos.registerQueue(Queue)` and `dbos.registerQueues`](#dbosregisterqueue-legacy), [`dbos.getQueue`](./lifecycle.md#getqueue), and the overloads that take a `Queue` object (`StartWorkflowOptions(Queue)`, `StartWorkflowOptions.withQueue(Queue)`, `ForkOptions.withQueue(Queue)`, `DBOSConfig.withListenQueue(Queue)` / `withListenQueues(Queue...)`, `Debouncer.withQueue(Queue)`, and `DebouncerClient.withQueue(Queue)`).
Register database-backed queues with [`dbos.registerQueue(String, QueueOptions)`](#dbosregisterqueue) after launch, look them up with [`dbos.findQueue`](#dbosfindqueue) (the replacement for `getQueue`), and refer to them by name or [`QueueName`](#queuename).
:::

### Queue constructors and `with*` methods

```java
new Queue(String name)

public Queue withName(String name);
public Queue withConcurrency(Integer concurrency);
public Queue withWorkerConcurrency(Integer workerConcurrency);
public Queue withRateLimit(RateLimit rateLimit);
public Queue withRateLimit(int limit, Duration period);
public Queue withRateLimit(int limit, long period, TimeUnit unit);
public Queue withPriorityEnabled(boolean priorityEnabled);
public Queue withPartitioningEnabled(boolean partitioningEnabled);
public Queue withPollingInterval(Duration pollingInterval);
```

Construct an in-memory queue at configuration time.
In-memory queues must be registered with [`dbos.registerQueue(Queue)`](#dbosregisterqueue-legacy) before `dbos.launch()`.
`withPartitioningEnabled` is the in-memory equivalent of the deprecated [`partitionQueue`](#queueoptions) option.

**Example Syntax:**

```java
// Deprecated
Queue queue = new Queue("example-queue").withWorkerConcurrency(5);

// Replacement, after dbos.launch()
dbos.registerQueue("example-queue", QueueOptions.setWorkerConcurrency(5));
```

### dbos.registerQueue {#dbosregisterqueue-legacy}

```java
void registerQueue(Queue queue)
void registerQueues(Queue... queues)
```

Register one or more in-memory queues. Must be called before `dbos.launch()`.
Replaced by [`dbos.registerQueue(String, QueueOptions)`](#dbosregisterqueue).
