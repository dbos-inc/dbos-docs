---
sidebar_position: 200
title: Upgrading
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
Register a queue after `dbos.launch()` using `DBOS.registerQueue`:

```java
DBOS.registerQueue("pipeline-queue",
    QueueOptions.setConcurrency(10).andRateLimit(100, Duration.ofSeconds(60)));
```

Update configuration at runtime with `DBOS.updateQueue` — only the fields you specify are changed:

```java
DBOS.updateQueue("pipeline-queue", QueueOptions.setConcurrency(20));
```

Additional methods — `DBOS.findQueue`, `DBOS.listQueues`, and `DBOS.deleteQueue` — let you inspect and manage queues at runtime.
[`DBOSClient`](./reference/client.md#queue-management-methods) exposes the same operations for managing queues from outside your application.

See [Queues & Concurrency](./tutorials/queue-tutorial.md) for a full guide and [Queues reference](./reference/queues.md) for the complete API.

#### CockroachDB support

CockroachDB is now a supported system database backend alongside PostgreSQL.
No configuration changes are required; DBOS auto-detects CockroachDB and adjusts its behaviour accordingly (for example, `useListenNotify` is automatically set to `false`).

### Deprecations

#### Admin server

The built-in admin server is deprecated and will be removed before v1.0.
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
DBOSConfig dbosConfig = DBOSConfig.defaultsFromEnv("my-app");
DBOS.configure(dbosConfig);
```

Now, you pass the DBOSConfig instance to directly to the DBOS constructor:

```java
DBOSConfig dbosConfig = DBOSConfig.defaultsFromEnv("my-app");
DBOS dbos = new DBOS(dbosConfig);
```

`DBOS` implements the [AutoClosable](https://docs.oracle.com/javase/8/docs/api/java/lang/AutoCloseable.html) interface.
This allows `DBOS` to work with the [try-with-resources](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html) statement
or with JUnit's [@AutoClose annotation](https://docs.junit.org/6.0.3/api/org.junit.jupiter.api/org/junit/jupiter/api/AutoClose.html).

```java
var dbosConfig = DBOSConfig.defaultsFromEnv("my-app");
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





