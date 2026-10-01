---
sidebar_position: 200
title: Upgrading
---

## Upgrading a Running Application

For every DBOS upgrade, migrate the system database before anything that needs the new schema runs.
With `withMigrate(true)` (the default), `dbos.launch()` migrates the system database.
If you run with `withMigrate(false)`, run [`dbosctl sysdb migrate`](../conductor/reference/dbosctl.md#dbosctl-sysdb-migrate) before deploying the upgrade.
[`DBOSClient`](./reference/client.md) never migrates, so upgrade clients only after an upgraded application has launched or you have run `dbosctl sysdb migrate`.
An application or client that needs a newer schema than the system database has throws `IllegalStateException` at launch or construction.

## Upgrading to v1.2

Most code written against DBOS Transact Java 1.1 compiles and runs unchanged on 1.2; the exceptions are listed below.
1.2 deprecates the old `QueueOptions` builders and absolute workflow deadlines, which will be removed in a future release.
This section covers what might require a change to your code, configuration, or operations, and what to replace deprecated APIs with.
For new features, see the [release notes](https://github.com/dbos-inc/dbos-transact-java/releases).

### Upgrade to 1.1 First

Every server must run 1.1 before any server runs 1.2. Don't run 1.0 and 1.2 servers against the same system database, and don't roll a 1.2 deployment back to 1.0.
1.1 and 1.2 servers can share a system database, and you can roll 1.2 back to 1.1.
See [1.1 Is Required Before 1.2](#11-is-required-before-12) for why.

1.2 migrates the system database to version 114. Migration 113 changes the `enqueue_workflow` SQL function to write inputs to `workflow_input`, and migration 114 drops a duplicate index on `notifications`.
The minimum schema version is still 111, so 1.1 servers and clients keep working against a migrated database.

### Changes That May Require Action

#### Workflow Inputs and Outputs Have Moved

1.2 writes workflow inputs to [`dbos.workflow_input`](../explanations/system-tables.md#dbosworkflow_input), and outputs and errors to [`dbos.workflow_output`](../explanations/system-tables.md#dbosworkflow_output).
For workflows started by 1.2, the `inputs`, `output`, and `error` columns of `dbos.workflow_status` are `NULL`.
DBOS still reads those columns for workflows written by earlier releases, but if you query them directly, for example from a dashboard or a script, read the new tables instead.

#### Debouncing

The debouncer no longer starts a separate debouncer workflow.
The first `debounce` call on a key enqueues your workflow itself in the `DELAYED` state on its queue, with `workflowName-debounceKey` as its deduplication ID, and each later call resets its start to one debounce period after that call and replaces its arguments.
Without `withQueue`, it goes on the DBOS internal queue instead of being started directly.
While it waits, the workflow appears in `listWorkflows` as `DELAYED`, with `isDebounced()` set to `true`.

- `withDeduplicationId` on `Debouncer` and `DebouncerClient` is now ignored.
- A negative `withPriority` or a zero or negative `withTimeout` now throws `IllegalArgumentException` when set, not at `debounce`.
- Outside a workflow, a timeout set with `WorkflowOptions` around `debounce` now limits your workflow, not an internal debouncer workflow. The new [`Debouncer.withTimeout`](./reference/methods.md#debouncer) sets it on the debouncer instead.
- A 1.1 debouncer workflow that still holds a key is taken over by the next 1.2 `debounce` call on that key, after about 5 seconds: 1.2 cancels it and creates the workflow it promised. If your application version changes with the upgrade, 1.2 servers don't run 1.1 debouncer workflows, so cancel any leftover `debouncerWorkflow` workflows whose keys will never be debounced again.

#### Child Workflow Timeouts

A child workflow started without a timeout of its own now inherits its parent's **deadline**, not its timeout.
In 1.1, a queued child copied its parent's timeout and started a fresh copy of it when dequeued, so it could outlive its parent.
Now a child's bound is the first of these that is set:

1. the timeout, `Timeout.none()`, `Timeout.inherit()`, or deadline given in the call's `StartWorkflowOptions` or `EnqueueOptions`;
2. the timeout or deadline set by an enclosing `WorkflowOptions` block;
3. the parent's deadline.

A queued child that is dequeued after its inherited deadline is cancelled. Other effects:

- Options given for a call replace the whole bound set by `WorkflowOptions`. In 1.1, the timeout and deadline merged field by field, so a deadline from `WorkflowOptions` could override a timeout given for the call.
- An inner `WorkflowOptions` block that sets a timeout, deadline, or `Timeout.none()` replaces the outer block's timeout and deadline together.
- A child that inherited its bound has no `workflow_timeout_ms`, so `WorkflowStatus.timeout()` is `null` for it.
- Resuming a child that inherited only a deadline leaves it without a bound, because resume clears the deadline and keeps the timeout.
- Building a `StartWorkflowOptions` with both an explicit timeout and a deadline now throws `IllegalArgumentException` immediately, as `EnqueueOptions` already did.

#### Exporting and Importing Workflows

A workflow exported from 1.2 carries its stored payloads unchanged, so its inputs, output, error, and step outputs keep their Java types when imported.
Import a 1.2 export only into 1.1.1 or later.
Imported into 1.1.0 or 1.0, it is accepted without any error, but its inputs, output, error, and step outputs import as `NULL`.
Exports from 1.1.0 and earlier still import correctly into 1.2.

#### New Record Components

These public records gained components. Code that calls their canonical constructors directly must pass the new values, and code compiled against 1.1 that calls them fails with `NoSuchMethodError`:

- [`WorkflowStatus`](./reference/methods.md#workflowstatus) gains `isDebounced` and `debounceDeadline`, after `applicationName`. Its `equals` and `hashCode` now also compare `applicationName`.
- `ListWorkflowsInput` gains `isFork`, after `wasForkedFrom`. Code that starts from `new ListWorkflowsInput()` and uses the `with...` methods is unaffected.
- `ExportedWorkflow` gains `payloads`. Pass `null` when there are no stored payloads.

#### Other Behavior Changes

- Workflow and queue timestamps in the system database (`created_at`, `updated_at`, `completed_at`, `started_at_epoch_ms`, and rate-limit windows) now come from the database's clock instead of each server's clock, as in the other DBOS SDKs. Delays, deadlines, and durable sleeps still use the server's clock.
- A workflow enqueued without a class name, such as one meant for a Python application, now fails on a Java server with `DBOSWorkflowFunctionNotFoundException` and stays `PENDING`, instead of throwing `NullPointerException`. To target a Java workflow, always pass its class name to `EnqueueOptions`.

### Deprecations

The following APIs are deprecated in 1.2 and will be removed in a future release.

| Deprecated | Replacement |
|---|---|
| `QueueOptions.empty()` | `new QueueOptions()` |
| The static `QueueOptions.setConcurrency`, `setWorkerConcurrency`, `setRateLimit`, `setPartitionConcurrency`, `setPartitionWorkerConcurrency`, `setPartitionRateLimit`, and `setPollingInterval` factories, and their `and...` counterparts | `new QueueOptions()` and the matching [`with...` builder](./reference/queues.md#queueoptions), such as `new QueueOptions().withConcurrency(10)` |
| The `QueueOptions.with...` overloads that take a `Field` or an `Optional` | The plain-value overloads. To clear a limit on `updateQueue`, pass a cast `null`, such as `withConcurrency((Integer) null)`. |
| `withDeadline` and `deadline()` on `StartWorkflowOptions`, `EnqueueOptions`, and `WorkflowOptions` | `withTimeout`. For a workflow that starts right away, a timeout of `Duration.between(Instant.now(), deadline)` is the same bound while the deadline is in the future. A deadline that is now or past gives a zero or negative timeout, which throws `IllegalArgumentException`. |

To move to the new `QueueOptions` builders:

```java
// Before
dbos.registerQueue("email", QueueOptions.setConcurrency(10).andRateLimit(100, Duration.ofSeconds(60)));

// After
dbos.registerQueue("email", new QueueOptions().withConcurrency(10).withRateLimit(100, Duration.ofSeconds(60)));
```

---

## Upgrading to v1.1

Most code written against DBOS Transact Java 1.0 compiles and runs unchanged on 1.1; the exceptions are listed below.
1.1 deprecates in-memory queues and a few other APIs, which will be removed in a future release, and validates some inputs that 1.0 accepted.
This section covers what might require a change to your code or configuration, and what to replace deprecated APIs with.
For new features, see the [release notes](https://github.com/dbos-inc/dbos-transact-java/releases).

### 1.1 Is Required Before 1.2

If your application servers run 1.0, upgrade all of them to 1.1 before any server runs 1.2 or later, and don't run 1.0 servers against the same system database as servers on 1.2 or later.
1.2 changes how two things are stored in the system database, and 1.1 is the release that understands both the old and the new formats:

- **Debouncing.** 1.2 debounces by delaying the workflow itself on its queue, instead of through a separate debouncer workflow. 1.1 still debounces through a debouncer workflow, but when a workflow debounced by 1.2 already holds the key, 1.1 extends that workflow's delay and replaces its arguments, as 1.2 does. 1.0 doesn't recognize such a workflow: a 1.0 server debouncing the same key can wait on a workflow that never answers it and then run the work a second time.
- **Workflow inputs and outputs.** 1.2 writes them to new tables. 1.1 reads both the new tables and the old columns, but 1.0 reads only the old columns, so it can't recover or return the result of a workflow started by 1.2.

### Changes That May Require Action

#### Java CLI Removed

The Java `dbos` CLI (the `transact-cli` module and its native binaries) has been removed.
Use [`dbosctl`](../conductor/reference/dbosctl.md#system-database-commands) instead:

| Before (1.0) | After (1.1) |
|---|---|
| `dbos migrate` | [`dbosctl sysdb migrate`](../conductor/reference/dbosctl.md#dbosctl-sysdb-migrate) |
| `dbos reset` | [`dbosctl sysdb reset`](../conductor/reference/dbosctl.md#dbosctl-sysdb-reset) |

#### Application Names

If you use [Conductor](../conductor/overview.md) or DBOS Cloud, `dbos.launch()` now throws `IllegalArgumentException` if your application name doesn't follow the [naming rule](./reference/lifecycle.md#dbosconfig): 3–256 lowercase letters, numbers, dashes, and underscores.
Self-hosted applications only log a warning.
To fix a name, change the name passed to `DBOSConfig.defaults(...)` or `withAppName`. In Spring Boot, set `dbos.application.name`; without it, DBOS uses `spring.application.name`, which often contains uppercase letters or dots.
Rows created before 1.1 aren't owned by any application, so changing the name as part of this upgrade doesn't require transferring ownership.

#### Stricter Validation

These inputs used to be accepted and now throw `IllegalArgumentException`:

- A queue configuration, from `registerQueue` or `updateQueue`, whose `workerConcurrency` exceeds `concurrency`, or whose rate limit sets only one of `max` and `period`. See the [queues reference](./reference/queues.md#queueoptions) for all the rules. A queue already stored with an invalid configuration keeps running.
- A negative priority, from `withPriority` on `StartWorkflowOptions` or `EnqueueOptions`, or on a debouncer.
- A priority on a debouncer that has no queue.

Iterating `readStream` for a workflow ID that doesn't exist now throws `DBOSNonExistentWorkflowException` instead of ending as an empty stream.

#### Workflows Enqueued Without a Version

A workflow enqueued by [`DBOSClient`](./reference/client.md) without `withAppVersion` is now dequeued only by executors running the latest application version; in 1.0, any executor dequeued it.
During a blue-green upgrade, such workflows therefore run on the new executors once they launch.
If executors on an older version must run a workflow, set `withAppVersion` when enqueuing it.

#### Event Waits During a Rolling Upgrade from 1.0

1.1 sends event notifications from the application instead of from database triggers, and its migration removes the triggers.
While 1.0 executors are still running, events they set don't wake `getEvent` calls in 1.1 processes, which then see the event only at their next re-check, up to a minute later.
If your 1.1 servers wait on events from workflows still running on 1.0 executors, for example to answer a request, set `withUseListenNotify(false)` on them until the last 1.0 executor has stopped; `getEvent` then checks every second.

#### Several Applications Sharing a System Database

Every workflow, queue, schedule, and application version is now owned by the application that created it, and listing operations return only the calling application's objects, plus those no application owns (such as everything created before 1.1).
If several applications share one system database, give each [`DBOSClient`](./reference/client.md#named-and-unnamed-clients) the `applicationName` it acts for; a client without one sees every application's rows.

Rows created before 1.1 are owned by no application, and every application treats them as its own: any application may dequeue an unowned workflow, and every application polls unowned queues and fires unowned schedules.
Before adding a second application to a system database, transfer the unowned rows to the application that created them:

```shell
dbosctl sysdb rename-application --to my-app --adopt-unclaimed-rows
```

[`DBOSClient.renameApplication`](./reference/client.md#renameapplication) does the same from code.
See [Unowned Rows](../explanations/sharing-a-system-database.md#unowned-rows).

#### Constructors

`DBOSConfig` and `ListWorkflowsInput` gained fields, so calls to their all-arguments constructors no longer compile.
Neither of these types is designed to be constructed via its all-arguments constructor.
Build a base `DBOSConfig` with `DBOSConfig.defaults(...)` or `DBOSConfig.defaultsFromEnv(...)` and customize with its `with` methods.
Build a base `ListWorkflowsInput` with its default constructor and customize with its `with` methods.

`WorkflowStatus`, `StepInfo`, and `VersionInfo` also gained fields.
DBOS returns these types rather than applications building them, so this should only affect test code that constructs them, for example to stub `listWorkflows` or `listWorkflowSteps` in a mock.

The `DBOSSystemDatabaseException` constructor takes a `SQLException` instead of a `Throwable`.
Code that constructs it must be updated and recompiled.

### Database-Backed Queues

In-memory queues, declared with `new Queue(...)` and registered with `dbos.registerQueue(Queue)` before launch, are deprecated.
They exist only in the process that declares them: Conductor can't list them, and no other executor can see or poll them.
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
- Pass the queue name as a `QueueName`. `new StartWorkflowOptions(String)` takes a *workflow ID*, so `new StartWorkflowOptions("example-queue")` starts an unqueued workflow.
- Replace `dbos.getQueue(name)` with `dbos.findQueue(name)`. `getQueue` reads only in-memory queues.
- By default, `registerQueue` overwrites an existing queue's configuration only if this executor runs the latest application version. Pass a [`QueueConflictResolution`](./reference/queues.md#queueconflictresolution) to change that.

### Moving Off Legacy Partitioned Queues

The `partitionQueue` option (`QueueOptions.setPartitionQueue`, and `Queue.withPartitioningEnabled` for in-memory queues) is deprecated.
Under it, the queue-wide `concurrency`, `workerConcurrency`, and rate limit applied to each partition.
Replace them with the per-partition limits, `partitionConcurrency`, `partitionWorkerConcurrency`, and `partitionRateLimit`; setting any of them partitions the queue.

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

`dbos.updateQueue` can't change the limits of a queue registered with `partitionQueue`.
To move a queue across, re-register it with `dbos.registerQueue`, which replaces its whole configuration.

:::warning
Partitioning a queue that wasn't partitioned before strands the workflows already on it.
Workflows enqueued without a partition key are never dequeued from a partitioned queue.
Drain the queue before giving it its first per-partition limit, or re-enqueue its workflows with a partition key.
Workflows already stranded this way can be moved to a queue that is not partitioned with [`dbos.resumeWorkflow(workflowId, queueName)`](./reference/methods.md#resumeworkflow).
:::

### Deprecations

The following APIs are deprecated in 1.1 and will be removed in a future release.

| Deprecated | Replacement |
|---|---|
| `new Queue(...)` constructors and `Queue.withName`, `withConcurrency`, `withWorkerConcurrency`, `withPriorityEnabled`, `withPartitioningEnabled`, `withRateLimit` (all overloads), `withPollingInterval` | `dbos.registerQueue(String, QueueOptions)` after launch |
| `Queue.partitioningEnabled()` | `Queue.isPartitioned()`, or `Queue.isLegacyPartitioned()` to detect a queue partitioned with the deprecated flag |
| `dbos.registerQueue(Queue)`, `dbos.registerQueues(Queue...)` | `dbos.registerQueue(String, QueueOptions)` after launch |
| `dbos.getQueue(String)` | `dbos.findQueue(String)` |
| `Queue`-typed overloads: `new StartWorkflowOptions(Queue)`, `StartWorkflowOptions.withQueue(Queue)`, `ForkOptions.withQueue(Queue)`, `Debouncer.withQueue(Queue)`, `DebouncerClient.withQueue(Queue)`, `DBOSConfig.withListenQueue(Queue)`, `DBOSConfig.withListenQueues(Queue...)` | The `QueueName` or `String` overloads |
| `QueueOptions.setPriorityEnabled`, `withPriorityEnabled`, `andPriorityEnabled`, the `QueueOptions.priorityEnabled()` accessor, and `Queue.priorityEnabled()` | None. Every queue dequeues in priority order; set a priority on the workflow instead. |
| `QueueOptions.setPartitionQueue`, `withPartitionQueue`, `andPartitionQueue`, and the `partitionQueue()` accessor | `setPartitionConcurrency`, `setPartitionWorkerConcurrency`, `setPartitionRateLimit` (and their `and`/`with` forms); from 1.2, `new QueueOptions().withPartitionConcurrency(...)` and the other `with...` builders |
| The seven-argument `QueueOptions` constructor (without per-partition limits) | The static `QueueOptions.set...` factories; from 1.2, `new QueueOptions()` and the `with...` builders |
| `DBOSClient.EnqueueOptions`, and the `DBOSClient.enqueueWorkflow` / `enqueuePortableWorkflow` overloads that take it | The top-level [`dev.dbos.transact.EnqueueOptions`](./reference/client.md#enqueueoptions), whose constructors take the workflow name, optional class and instance names, and a `QueueName`. For portable enqueue, set `withSerialization(SerializationStrategy.PORTABLE)` and call `enqueueWorkflow(options, positionalArgs, namedArgs)`. |
| `Debouncer.withDeduplicationId`, `DebouncerClient.withDeduplicationId` | None. From 1.2 the debouncer sets the deduplication ID itself and ignores this setting. |
| `ExternalState`, `DBOSIntegration.getExternalState`, `DBOSIntegration.upsertExternalState` (the `event_dispatch_kv` API) | Store integration state in your own table. A shared system database migration will drop the `event_dispatch_kv` table sometime after this API is removed. |
| `DBOSSystemDatabaseException.databaseException()` | `getCause()` |

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

Use the [`DBOSClient`](./reference/client.md) API or the [DBOS Console](../conductor/workflow-management.md) to manage workflows programmatically.

Additionally, the CLI now ships as a pre-compiled native binary (via GraalVM AOT compilation) for Linux, macOS, and Windows. Download the appropriate binary from the GitHub Releases page — no JVM required.

:::note
The Java CLI was removed in v1.1 in favor of [`dbosctl`](../conductor/reference/dbosctl.md). See [Java CLI Removed](#java-cli-removed).
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





