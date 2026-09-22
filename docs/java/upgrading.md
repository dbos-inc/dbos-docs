---
sidebar_position: 200
title: Upgrading
---

## Upgrading to v1.1

DBOS Transact Java 1.1 has no source-breaking API changes for most applications, but it changes how the system database is migrated, how workflows are recovered, and how queues are declared.
Read [Upgrading a Running Application](#upgrading-a-running-application) before rolling 1.1 out to a fleet that is running 1.0.

### Upgrading a Running Application

- **Every deployment computes a new application version.**
The computed application version already hashed the SDK version in 1.0; 1.1 also hashes in the application name, so that two applications built from one jar and sharing a system database don't collide.
Either way, a 1.1 executor computes a different version than the 1.0 executor it replaces, and it only dequeues and recovers workflows for its own version.
If you set the version yourself with `.withAppVersion(...)`, change it when you upgrade, as you would for any code change.
See [upgrading workflows](./tutorials/upgrading-workflows.md) for versioning and patching strategies.
- **1.1 is a required waypoint for the debouncer.**
A future release moves the [debouncer](./reference/methods.md) onto a new storage shape that 1.0 executors mishandle.
1.1 still writes the old shape, and recognizes and extends the new one.
Upgrade every executor to 1.1 before any executor runs a later release: **don't run 1.0 and 1.2 (or later) executors against the same system database.**
- **Upgrade and migrate applications before clients.**
1.1 raises the minimum system database schema version, and [`DBOSClient`](./reference/client.md) never migrates (see [System Database Migrations](#system-database-migrations) below).
A 1.1 client connected to a system database that no 1.1 application (or `dbosctl sysdb migrate`) has migrated yet fails at construction.
- **1.0 executors keep running against the migrated schema.**
The migrations 1.1 applies are additive, with two exceptions that 1.0 executors notice:
  - They drop the foreign key that deleted a workflow's steps along with it. While 1.0 executors are still running, workflows they delete leave their step rows behind, as orphans that the 1.1 retention sweep can collect.
  - They drop the database triggers that sent a notification when a workflow event or stream value was written, because 1.1 executors send those notifications themselves. Events and stream values written by a 1.0 executor therefore no longer wake waiters in other processes; a waiter finds them at its next re-check instead. That is within about a second for a 1.0 waiter and for any stream read, but can take up to a minute for a 1.1 `getEvent` with LISTEN/NOTIFY enabled. Messages (`send`/`recv`) are unaffected.
- **Application names are validated when Conductor is in use.**
When a Conductor key is configured or the application runs on DBOS Cloud, `dbos.launch()` now throws `IllegalArgumentException` if the application name is not 3–256 characters of lowercase letters, digits, `-`, and `_`, since Conductor can't address it. Self-hosted applications only log a warning.

### Behavior Changes

#### System Database Migrations

The system database schema is extended to migration 112, and 1.1 requires a system database at version 111 or later.
Migrations 100–112 are shared with the other DBOS SDKs, so every SDK defines the same migration at the same index.

- With `withMigrate(true)` (the default), `dbos.launch()` applies the migrations, as before.
- With `withMigrate(false)`, `dbos.launch()` now validates the schema version and throws `IllegalStateException` if the schema is missing or older than 1.1 requires, instead of failing later with a raw "relation does not exist" error.
- `DBOSClient` never migrates. Every constructor now runs the same validation and throws if the schema is too old.

To migrate out-of-band, for example from a deployment pipeline where the application runs without schema privileges, use [`dbosctl sysdb migrate`](../production/dbosctl.md#dbosctl-sysdb-migrate).

#### Java CLI Removed

The Java `dbos` CLI (the `transact-cli` module and its GraalVM native binaries) has been removed.
Use [`dbosctl`](../production/dbosctl.md#system-database-commands) instead, which works on the system database of an application written in any DBOS SDK:

| Before (1.0) | After (1.1) |
|---|---|
| `dbos migrate` | [`dbosctl sysdb migrate`](../production/dbosctl.md#dbosctl-sysdb-migrate) |
| `dbos reset` | [`dbosctl sysdb reset`](../production/dbosctl.md#dbosctl-sysdb-reset) |

#### Recovery Re-enqueues Workflows

Java now recovers workflows the same way as the Python, TypeScript, and Go SDKs.
Instead of executing a recovered workflow in the process that found it, recovery moves each `PENDING` workflow back to `ENQUEUED` on its queue, or on the DBOS internal queue if it was never enqueued, and whichever executor next dequeues it runs it.
Recovered work is therefore spread across the executors polling that queue rather than landing on one process.

`dbos.launch()` also skips its own launch-time recovery sweep when a [Conductor](../production/conductor.md) key is configured or the application runs on DBOS Cloud, because Conductor decides which executors are gone and issues recovery itself.

#### No-Version Workflows Go to the Latest Version

A workflow enqueued without an application version (for example, by `DBOSClient` or by `dbos.enqueueWorkflow` without `withAppVersion`) is only dequeued by executors running the latest application version.

#### DBOSClient Convenience Constructors Don't Listen for Notifications

The URL-based `DBOSClient` constructors that don't take a `useListenNotify` argument now pass `false`, where they used to pass `true`.
In 1.0 the argument had no effect, because the client never started its listener, and the `DataSource` constructors had no such argument at all; 1.1 adds `useListenNotify` overloads for them too.
In 1.1 the client honors it: pass `useListenNotify = true` to one of the longer constructors to have `getEvent` and `readStream` woken by PostgreSQL notifications instead of polling.
Leave it off if the system database was migrated with LISTEN/NOTIFY disabled.

#### Negative Priorities Are Rejected

A negative priority now throws `IllegalArgumentException` as soon as it is set: from `StartWorkflowOptions.withPriority` or `EnqueueOptions.withPriority`, or from `debounce()` on a debouncer.
Workflows without a priority have priority `0`, so a negative value would have jumped ahead of all of them.

#### Queue Configuration Is Validated on Registration and Update

1.0 checked only that `concurrency`, `workerConcurrency`, and `pollingInterval` were positive, and only when a queue was registered; `updateQueue` wrote whatever it was given.
1.1 validates both registration and every update, and throws `IllegalArgumentException` for an invalid result:

- `workerConcurrency` may not exceed `concurrency`.
- A rate limit's `max` and `period` must both be positive, and must be set together. Registering with only one of them used to succeed and create a queue with no rate limit at all.
- The new per-partition limits follow the rules listed in the [queues reference](./reference/queues.md#queueoptions).
- A queue registered with the deprecated `partitionQueue` option can't have its limits updated (see [Moving Off Legacy Partitioned Queues](#moving-off-legacy-partitioned-queues)).

A queue already stored with an invalid configuration keeps loading and running; it is rejected only when something tries to write it again.

#### readStream on an Unknown Workflow

Iterating the result of `readStream` now throws `DBOSNonExistentWorkflowException` when no workflow with the given ID exists, instead of ending as an empty stream.

#### DBOSSystemDatabaseException

When a system database operation fails and DBOS won't retry it further, DBOS now throws `DBOSSystemDatabaseException` instead of a bare `RuntimeException`.
Code that catches `RuntimeException` is unaffected, because `DBOSSystemDatabaseException` extends it.

- The failing `SQLException` is now the exception's `getCause()`.
- The new `sqlState()` method returns the failure's SQLSTATE, searching both the cause chain and JDBC's `getNextException()` chain, or `null` if it carries none.
- The constructor now takes a `SQLException` instead of a `Throwable`. This is a binary-incompatible change: code compiled against 1.0 that constructs this exception fails with `NoSuchMethodError` against 1.1 and must be recompiled.
- `databaseException()` is deprecated; it returns the same object as `getCause()`.

#### Message Serialization Inside Workflows

`send` called from inside a workflow now uses the serialization format of the calling workflow, as `setEvent` and `writeStream` already did.
A workflow started with portable serialization therefore sends portable messages, which other languages can read.
Pass `SerializationStrategy.NATIVE` or `PORTABLE` to override this; passing `DEFAULT` still inherits the workflow's format.

Scheduled workflow runs always use the application's serializer, even when the workflow is declared with `@Workflow(serializationStrategy = ...)`, so cron-fired, triggered, and backfilled runs all record the same format.

#### Reading Workflows Written by Other SDKs

1.1 reads workflow inputs and outputs from the `workflow_input` and `workflow_output` tables, falling back to the columns of `workflow_status`.
DBOS Python 3.0 and DBOS TypeScript 5.0 write inputs and outputs to those tables, so a Java 1.1 executor or client can read workflows they create on a shared system database; Java 1.0 can't.
Java 1.1 itself still writes inputs and outputs to `workflow_status`.

### New Features

#### Sharing a System Database

Every object DBOS stores (workflows, steps, queues, schedules, and application versions) now records the application that owns it, taken from the name you pass to `DBOSConfig.defaults(...)`.
Several applications can share one system database, each seeing only its own objects, or call each other's workflows deliberately.

- `dbos.enqueueWorkflow(...)` and `dbos.enqueuePortableWorkflow(...)` take the same `EnqueueOptions` as [`DBOSClient`](./reference/client.md) and enqueue a workflow by name, so an application can enqueue a workflow implemented by another application, in any language, without a reference to its code.
- `EnqueueOptions.withApplicationName(...)` enqueues a workflow on behalf of another application.
- `DBOSClient` constructors take an optional `applicationName`. Without one, a client owns nothing and sees every application's rows.
- `ListWorkflowsInput.withApplicationName(...)`, `dbos.listQueues(List<String>)`, and `dbos.listSchedules` filter by owning application.

See [Sharing a System Database](../explanations/sharing-a-system-database.md) for details.

#### Per-Partition Queue Limits

A queue can now carry flow control at two scopes at once.
The queue-wide limits (`concurrency`, `workerConcurrency`, rate limit) bound the whole queue, while the new per-partition limits bound each partition key independently:

```java
dbos.registerQueue("per-customer-queue",
    QueueOptions.setConcurrency(20)
        .andPartitionConcurrency(1)
        .andPartitionRateLimit(10, Duration.ofMinutes(1)));
```

Setting any per-partition limit (`partitionConcurrency`, `partitionWorkerConcurrency`, or `partitionRateLimit`) partitions the queue; there is no separate switch.
Per-partition limits are available on database-backed queues only.
See the [queues tutorial](./tutorials/queue-tutorial.md) and the [queues reference](./reference/queues.md).

#### QueueName

`QueueName` is a small type for passing a queue's name where a bare `String` would be ambiguous.
In particular, `new StartWorkflowOptions(String)` takes a *workflow ID*, so `new StartWorkflowOptions("my-queue")` silently starts an unqueued workflow; `new StartWorkflowOptions(QueueName.of("my-queue"))` enqueues it.
`QueueName` overloads are accepted by `StartWorkflowOptions`, `ForkOptions.withQueue`, `ForkFromFailureOptions.withQueue`, `Debouncer.withQueue`, `DebouncerClient.withQueue`, and `DBOSConfig.withListenQueue`/`withListenQueues`.
The `String` overloads are unchanged.

#### Notification Coalescing and Polling Concurrency

Workflow event and stream notifications are now sent by the application, in batches, instead of by database triggers.
Two new `DBOSConfig` settings tune this and the polling that backs waits:

- `withNotificationCoalesceInterval(Duration)`: how often batched event and stream wake-ups are pushed to other processes. Defaults to 10ms; must be at least 1ms.
- `withDatabasePollingConcurrency(Integer)`: how many polling reads (from awaiting a result, `recv`, `getEvent`, or reading a stream) may run against the system database at once, so a burst of waiters can't starve the rest of the connection pool. Defaults to half the pool size (at least one); a non-positive value removes the cap.

See [`DBOSConfig`](./reference/lifecycle.md).

#### Schedule Name Filters

`ListWorkflowsInput.withScheduleName(...)` filters workflows by the schedule that started them, and export/import of workflows now preserves their schedule name, attributes, and fork origin.

#### Debouncer Changes

- `DebouncerClient.withSerialization(...)` lets a client debounce a workflow that uses portable serialization.
- A priority set without a queue is now rejected when `debounce()` is called, instead of being silently dropped.

### Database-Backed Queues

In-memory queues, declared with `new Queue(...)` and registered with `dbos.registerQueue(Queue)` before launch, are deprecated.
They exist only in the process that declares them: Conductor can't list them, and no other executor, in Java or any other language, can see or poll them.
Instead, register queues in the system database with `dbos.registerQueue(String, QueueOptions)` after `dbos.launch()`, and enqueue on them by name.

**Before:**

```java
Queue queue = new Queue("example-queue").withWorkerConcurrency(5);
dbos.registerQueue(queue);
dbos.launch();

dbos.startWorkflow(() -> proxy.processTask(task),
    new StartWorkflowOptions().withQueue(queue));
```

**After:**

```java
dbos.launch();
dbos.registerQueue("example-queue", QueueOptions.setWorkerConcurrency(5));

dbos.startWorkflow(() -> proxy.processTask(task),
    new StartWorkflowOptions(QueueName.of("example-queue")));
```

When migrating your queues, note that:

- Register every queue your application previously declared in memory. Starting a workflow on a queue that isn't registered throws.
- Replace `dbos.getQueue(name)` with `dbos.findQueue(name)`. `getQueue` reads only in-memory queues.
- `Queue` is still what `findQueue` and `listQueues` return; only building one yourself is deprecated.
- By default, `registerQueue` overwrites an existing queue's configuration only if this executor runs the latest application version. Pass a [`QueueConflictResolution`](./reference/queues.md) to change that.

For more on queues, see the [queues tutorial](./tutorials/queue-tutorial.md).

### Moving Off Legacy Partitioned Queues

The `partitionQueue` option (`QueueOptions.setPartitionQueue`, and `Queue.withPartitioningEnabled` for in-memory queues) is deprecated.
Under it, the queue-wide `concurrency`, `workerConcurrency`, and rate limit applied to each partition.
Replace them with the per-partition limits, `partitionConcurrency`, `partitionWorkerConcurrency`, and `partitionRateLimit`.

**Before:**

```java
dbos.registerQueue("partitioned-queue",
    QueueOptions.setPartitionQueue(true).andConcurrency(1));
```

**After:**

```java
dbos.registerQueue("partitioned-queue",
    QueueOptions.setPartitionConcurrency(1));
```

Legacy partitioned queues keep working, but their limits are frozen: `dbos.updateQueue` refuses to change any limit, queue-wide or per-partition, on a queue registered with `partitionQueue`, and refuses `partitionQueue` on a queue partitioned by its per-partition limits.
To move a queue across, re-register it with `dbos.registerQueue`, which replaces its whole configuration.
Unlike legacy partitioned queues, a partitioned queue can also have queue-wide limits, which bound the queue as a whole.

:::warning
Partitioning a queue that wasn't partitioned before strands the workflows already on it.
Workflows enqueued without a partition key are never dequeued from a partitioned queue.
Drain the queue before giving it its first per-partition limit, or re-enqueue its workflows with a partition key.
:::

### Deprecations

The following APIs are deprecated in 1.1. All except the seven-argument `QueueOptions` constructor are marked for removal in 2.0.

| Deprecated | Replacement |
|---|---|
| `new Queue(...)` constructors and `Queue.withName`, `withConcurrency`, `withWorkerConcurrency`, `withPriorityEnabled`, `withPartitioningEnabled`, `withRateLimit` (all overloads), `withPollingInterval` | `dbos.registerQueue(String, QueueOptions)` after launch |
| `Queue.partitioningEnabled()` | `Queue.isPartitioned()`, or `Queue.isLegacyPartitioned()` to detect a queue partitioned with the deprecated flag |
| `dbos.registerQueue(Queue)`, `dbos.registerQueues(Queue...)` | `dbos.registerQueue(String, QueueOptions)` after launch |
| `dbos.getQueue(String)` | `dbos.findQueue(String)` |
| `Queue`-typed overloads: `new StartWorkflowOptions(Queue)`, `StartWorkflowOptions.withQueue(Queue)`, `ForkOptions.withQueue(Queue)`, `ForkFromFailureOptions.withQueue(Queue)`, `Debouncer.withQueue(Queue)`, `DebouncerClient.withQueue(Queue)`, `DBOSConfig.withListenQueue(Queue)`, `DBOSConfig.withListenQueues(Queue...)` | The `QueueName` or `String` overloads |
| `QueueOptions.setPriorityEnabled`, `withPriorityEnabled`, `andPriorityEnabled`, the `QueueOptions.priorityEnabled()` accessor, and `Queue.priorityEnabled()` | None. Every queue dequeues in priority order; set a priority on the workflow instead. |
| `QueueOptions.setPartitionQueue`, `withPartitionQueue`, `andPartitionQueue`, and the `partitionQueue()` accessor | `setPartitionConcurrency`, `setPartitionWorkerConcurrency`, `setPartitionRateLimit` (and their `and`/`with` forms) |
| The seven-argument `QueueOptions` constructor (without per-partition limits) | The static `QueueOptions.set...` factories |
| `Debouncer.withDeduplicationId`, `DebouncerClient.withDeduplicationId` | None. From the next release the debouncer sets the deduplication ID itself and ignores this setting. |
| `ExternalState`, `DBOSIntegration.getExternalState`, `DBOSIntegration.upsertExternalState` (the `event_dispatch_kv` API) | Store integration state in your own table. A shared system database migration will drop the `event_dispatch_kv` table sometime after Java 2.0. |
| `DBOSSystemDatabaseException.databaseException()` | `getCause()` |

The [admin server](#admin-server), deprecated since 0.9, still ships in 1.1.

---

## Upgrading to v1.0

### Breaking Changes

#### ExternalState.updateTime: BigDecimal → Instant

The `updateTime` field on the `ExternalState` record changed from `BigDecimal` to `java.time.Instant`, and the `withUpdateTime` builder method updated accordingly.

This only affects custom plugin authors who directly construct or pattern-match on `ExternalState`.

```java
// Before
ExternalState state = new ExternalState(service, wfName, key, value,
    new BigDecimal(System.currentTimeMillis()), BigInteger.ZERO);

// After
ExternalState state = new ExternalState(service, wfName, key, value,
    Instant.now(), BigInteger.ZERO);
```

#### ForkOptions.timeout: Timeout → @Nullable Duration

The `timeout` field on `ForkOptions` changed from the `Timeout` sealed interface to `@Nullable Duration`. The `withTimeout(Timeout)` and `withNoTimeout()` methods were removed.

```java
// Before
new ForkOptions().withTimeout(Timeout.none());
new ForkOptions().withNoTimeout();

// After
new ForkOptions().withTimeout((Duration) null);  // no timeout
new ForkOptions().withTimeout(Duration.ofMinutes(5));  // explicit timeout
```

`Timeout.of(...)` usage can be replaced directly with the equivalent `Duration`:

```java
// Before
new ForkOptions().withTimeout(Timeout.of(Duration.ofMinutes(5)));

// After
new ForkOptions().withTimeout(Duration.ofMinutes(5));
```

Note: `Timeout` itself is still used by `StartWorkflowOptions` and `WorkflowOptions` — only `ForkOptions` changed.

#### CLI: postgres and workflow subcommands removed

The `dbos postgres` and `dbos workflow` subcommand groups have been removed from the CLI. The CLI now only supports `dbos migrate` and `dbos reset`.

Use the [`DBOSClient`](./reference/client.md) API or the [DBOS Console](../production/workflow-management.md) to manage workflows programmatically.

Additionally, the CLI now ships as a pre-compiled native binary (via GraalVM AOT compilation) for Linux, macOS, and Windows. Download the appropriate binary from the GitHub Releases page — no JVM required.

:::note
The Java CLI was removed in v1.1 in favor of [`dbosctl`](../production/dbosctl.md). See [Java CLI Removed](#java-cli-removed).
:::

#### Jackson upgraded to 3.1.x

The Jackson library dependency was upgraded from 2.x to 3.1.x. Jackson 3.x has breaking API changes relative to 2.x (notably, `JsonRuntimeException` was removed).

If your application has an explicit dependency on Jackson 2.x, you will need to upgrade it to 3.x. Jackson 3.x follows the same JSON format as 2.x, so no data migration is required.

#### Cancellation while waiting in recv() / getEvent()

`recv()` and `getEvent()` now throw `DBOSWorkflowCancelledException` when the calling workflow is cancelled while they are waiting for a message or event. Previously the behavior was inconsistent; this aligns Java with the TypeScript and Python behavior.

If your code catches `Exception` or `RuntimeException` around `recv`/`getEvent`, no change is needed. If you were relying on the previous behavior where cancellation during a wait would leave the workflow in a non-cancelled state, update accordingly.

---

## Upgrading to v0.9

### Breaking Changes

#### Queue.withRateLimit(int, double)

The `withRateLimit(int limit, double period)` overload on the `Queue` record has been removed.
Replace it with the new `withRateLimit(int limit, long period, TimeUnit unit)` overload:

```java
// Before
new Queue("example-queue").withRateLimit(100, 60.0);

// After
new Queue("example-queue").withRateLimit(100, 60, TimeUnit.SECONDS);
```

#### DBOS.registerWorkflow

The static `DBOS.registerWorkflow` method has been removed.
Call `DBOSIntegration.registerWorkflow` instead, which is accessible via `dbos.integration()`:

```java
// Before
DBOS.registerWorkflow(name, target, method);

// After
dbos.integration().registerWorkflow(name, target, method);
```

#### DBOSIntegration.registerWorkflow

`DBOSIntegration.registerWorkflow` now returns a `RegisteredWorkflow` instead of `void`.
Code that discards the return value continues to compile without changes.
Code that stores the result must update its declared type from `void` to `RegisteredWorkflow`.

### New Features

#### Step Factories

Two new mechanisms let you commit a step's database write and its DBOS checkpoint atomically, so a crash between the two can never leave them out of sync.

**Step factories** (non-Spring): construct a factory for your database library and pass it to `DBOS.runStep`:

```java
// Plain JDBC
var factory = new JdbcStepFactory(dataSource);
dbos.runStep(factory, conn -> {
    conn.prepareStatement("INSERT INTO orders ...").executeUpdate();
    return orderId;
});
```

`JdbcStepFactory`, `JdbiStepFactory`, and `JooqStepFactory` are available for JDBC, JDBI 3, and jOOQ respectively.

**`@TransactionalStep`** (Spring Boot): annotate any Spring-managed method with `@TransactionalStep` and the `transact-spring-txstep-starter` module handles the rest — no factory wiring required:

```java
@TransactionalStep
public Order createOrder(OrderRequest request) {
    // Spring transaction + DBOS checkpoint committed atomically
    return orderRepository.save(new Order(request));
}
```

See the [Step Factories tutorial](./tutorials/step-factory-tutorial.md) for setup instructions and per-library examples.

#### sendBulk

`DBOS.sendBulk` and `DBOSClient.sendBulk` let you send multiple workflow messages in a single batch:

```java
dbos.sendBulk(List.of(
    new SendMessage(workflowIdA, "hello", "topic"),
    new SendMessage(workflowIdB, "world", "topic")));
```

Each message in the batch is delivered independently; messages need not share the same destination.
`DBOSClient.sendBulk` accepts an optional `SendOptions` for serialization and fork-delivery control.

#### Debouncer

A new `Debouncer` class lets you coalesce repeated workflow invocations on the same key into a single execution that uses the most recently supplied arguments.
The workflow fires after `debouncePeriod` of inactivity, or after an absolute `debounceTimeout` cap regardless of ongoing calls:

```java
var debouncer = dbos.<String>debouncer()
    .withDebounceTimeout(Duration.ofMinutes(5));

WorkflowHandle<String, Exception> handle = debouncer.debounce(
    userId,
    Duration.ofSeconds(60),
    () -> svc.processInput(userInput));
```

`DebouncerClient` provides the same capability from external code without a running DBOS executor.
See the [Debouncing reference](./reference/methods.md#debouncing) for the full API.

#### Dynamic queue management

Queues can now be registered, updated, and deleted at runtime without restarting your application.
Queue configuration is persisted to the system database and survives restarts.
Register a queue after `dbos.launch()` using `dbos.registerQueue`:

```java
dbos.registerQueue("pipeline-queue",
    QueueOptions.setConcurrency(10).andRateLimit(100, Duration.ofSeconds(60)));
```

Update configuration at runtime with `dbos.updateQueue` — only the fields you specify are changed:

```java
dbos.updateQueue("pipeline-queue", QueueOptions.setConcurrency(20));
```

Additional methods — `dbos.findQueue`, `dbos.listQueues`, and `dbos.deleteQueue` — let you inspect and manage queues at runtime.
[`DBOSClient`](./reference/client.md#queue-management-methods) exposes the same operations for managing queues from outside your application.

See [Queues & Concurrency](./tutorials/queue-tutorial.md) for a full guide and [Queues reference](./reference/queues.md) for the complete API.

#### CockroachDB support

CockroachDB is now a supported system database backend alongside PostgreSQL.
No configuration changes are required; DBOS auto-detects CockroachDB and adjusts its behaviour accordingly (for example, `useListenNotify` is automatically set to `false`).

### Deprecations

#### Admin server

The built-in admin server is deprecated. It still ships, and will be removed in a future release.
Use [DBOS Conductor](https://docs.dbos.dev/conductor) instead.

The related configuration APIs — `withAdminServer()`, `disableAdminServer()`, `enableAdminServer()`, and `withAdminServerPort()` on `DBOSConfig`, and the `dbos.admin-server.*` properties in Spring Boot — are deprecated alongside it.


---

## Upgrading to v0.8

DBOS Transact Java v0.8 contains several breaking changes.
These changes were made to improve the developer experience as well as how DBOS Transact Java integrates into the larger Java ecosystem.
This document explains how to update your existing DBOS Java app to v0.8.

:::info
Although we cannot guarantee that v0.8 will be the final release with breaking changes, our intention is to minimize or eliminate further breaking changes in DBOS Transact Java after v0.8.
:::

### DBOS Instance API
`DBOS` is now an instance class instead of a static utility class.
While static methods were easier to access, they are harder to test and mock. 
Furthermore, a `DBOS` instance API fits better into Dependency Injection based Java frameworks like [Spring](https://spring.io/).

Prior to v0.8, you would configure DBOS via the static `configure` method:

```java
DBOSConfig dbosConfig = DBOSConfig.defaultsFromEnv("my-app")
    .withAppVersion("0.1.0");
DBOS.configure(dbosConfig);
```

Now, you pass the DBOSConfig instance to directly to the DBOS constructor:

```java
DBOSConfig dbosConfig = DBOSConfig.defaultsFromEnv("my-app")
    .withAppVersion("0.1.0");
DBOS dbos = new DBOS(dbosConfig);
```

`DBOS` implements the [AutoClosable](https://docs.oracle.com/javase/8/docs/api/java/lang/AutoCloseable.html) interface.
This allows `DBOS` to work with the [try-with-resources](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html) statement
or with JUnit's [@AutoClose annotation](https://docs.junit.org/6.0.3/api/org.junit.jupiter.api/org/junit/jupiter/api/AutoClose.html).

```java
var dbosConfig = DBOSConfig.defaultsFromEnv("my-app")
    .withAppVersion("0.1.0");
try (var dbos = new DBOS(dbosConfig)) {
  Example proxy = dbos.registerProxy(Example.class, new ExampleImpl(dbos));
  dbos.launch();
  proxy.workflow();
}
```

With this change, registering DBOS proxies becomes slightly more involved.
Previously, you could register a proxy object anytime prior to calling `DBOS.launch()`. 
Now, you must construct the `DBOS` instance before calling `registerProxy`.
Like prior releases, all proxies must be registered before calling `DBOS.launch()`.

:::info
`DBOS.registerWorkflows()` is now named [`DBOS.registerProxy`](./reference/workflows-steps.md#registerproxy).
:::

For [plugin](./reference/plugins.md) developers, the `DBOS` instance is now provided as a parameter on `dbosLaunched`.
For more information, see the [Lifecycle Listeners documentation](./reference/plugins.md#lifecycle-listeners)

### DBOS API Changes

Beyond the overarching change from static to instance methods, there were assorted other minor breaking changes to the DBOS API:

* `DBOS.registerWorkflows` was renamed to `DBOS.registerProxy`
* `DBOS.registerQueue` previously returned the `Queue` object, now it is void return
* Several methods with `@Nullable` return types have been changed to return `Optional`
  * `DBOS.getWorkflowStatus()`
  * `DBOS.recv()`
  * `DBOS.getEvent()`
* Several methods used by [plugins](./reference/plugins.md) were moved from `DBOS` to `DBOSIntegration`.
The `DBOSIntegration` instance can be accessed via `DBOS.integration()`.
  * `DBOSIntegration.registerLifecycleListener`
  * `DBOSIntegration.getRegisteredWorkflows`
  * `DBOSIntegration.getRegisteredWorkflowsInstances`
  * `DBOSIntegration.startRegisteredWorkflow`
  * `DBOSIntegration.getExternalState`
  * `DBOSIntegration.upsertExternalState`

:::info
`DBOSIntegration.startRegisteredWorkflow` was previously named `DBOS.startWorkflow`. 
There are several `DBOS.startWorkflow` overloads, only the one with a `RegisteredWorkflow` parameter was renamed and moved.
:::

### Strongly Typed Fields

In a variety of places across the public API surface area, fields have been changed to more semantically relevant types.
For example, previously we represented both timeout and deadline as `Long` with semantic information encoded in the field names - i.e. `timeoutMs` and `deadlineEpochMs`.
Now, we use the more semantically aligned types of [`Duration`](https://docs.oracle.com/javase/8/docs/api/java/time/Duration.html) for timeout and [`Instant`](https://docs.oracle.com/javase/8/docs/api/java/time/Instant.html) for deadline.
With the change in type, we also simplified the field names to drop the semantic type information.

WorkflowStatus
* `status` field was previously a `String`, now it's a `WorkflowState` enum value
* `name` field was renamed `workflowName`
* `createdAt` and `updatedAt` changed their type from `Long` to `Instant`
* `timeoutMs` was renamed `timeout` and the type changed from `Long` to `Duration`
* `deadlineEpochMs` was renamed `deadline` and the type changed from `Long` to `Instant` 
* `startedAtEpochMs` was renamed `startedAt` and the type changed from `Long` to `Instant` 

StepInfo
* `startedAtEpochMs` was renamed `startedAt` and the type was changed from `Long` to `Instant`
* `completedAtEpochMs` was renamed `completedAt` and the type was changed from `Long` to `Instant`

StepOptions
* `intervalSeconds` was renamed `retryInterval` and the type was changed from `Double` to `Duration`

ListWorkflowsInput
* `withStartTime` and `withEndTime` changed parameter type from `OffsetDateTime` to `Instant`
* `withStatuses` was renamed `withStatus` and the parameter type changed from `List<String>` to `List<WorkflowState>`
* `withWorkflowId` was renamed `withWorkflowIds`

### @Step / StepOptions Changes

In previous versions, both `@Step` and `StepOptions` had a boolean `retriesAllowed` field. 
This field has been removed.
Additionally, the default `maxAttempts` field of both `@Step` and `StepOptions` has been changed to 1.
To enable retries, simply set `maxAttempts` to a value greater than `.

:::info
Note, as covered above, the `StepOptions.intervalSeconds` field was renamed to `retryInterval` and the type was changed to `Duration`.
Annotations cannot use reference types like `Duration` so `@Step` still has an `intervalSeconds` field of type `double`.
:::

### @Scheduled Removed

The `@Scheduled` annotation has been removed. For durable scheduled code in your app, you can use the new [Schedule Management Methods](./reference/methods.md#schedule-management-methods).

### DBOSClient Changes

`DBOSClient.EnqueueOptions` changed the order of the parameters for the three string constructor.
Previously, the className parameter was first and the workflowName was second.
For consistency with other DBOS APIs, these two parameters have swapped position.
Across the code base, when specifying the workflow name, class name, instance name of a registered workflow, we have the parameters in that order.

Additionally, similar to DBOS changes detailed above, `DBOSClient.getWorkflowStatus` and `DBOS.getEvent` now return `Optional` instead of a `@Nullable` value;





