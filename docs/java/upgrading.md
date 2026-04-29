---
sidebar_position: 200
title: Upgrading to v0.8
---

DBOS Transact Java v0.8 contains several breaking changes.
These changes were made to improve the developer experience as well as how DBOS Transact Java integrates into the larger Java ecosystem.
This document explains how to update your existing DBOS Java app to v0.8.

:::info
Although we cannot guarantee that v0.8 will be the final release with breaking changes, our intention is to minimize or eliminate further breaking changes in DBOS Transact Java after v0.8.
:::

## DBOS Instance API
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

## DBOS API Changes

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

## Strongly Typed Fields

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

## @Step / StepOptions Changes

In previous versions, both `@Step` and `StepOptions` had a boolean `retriesAllowed` field. 
This field has been removed.
Additionally, the default `maxAttempts` field of both `@Step` and `StepOptions` has been changed to 1.
To enable retries, simply set `maxAttempts` to a value greater than `.

:::info
Note, as covered above, the `StepOptions.intervalSeconds` field was renamed to `retryInterval` and the type was changed to `Duration`.
Annotations cannot use reference types like `Duration` so `@Step` still has an `intervalSeconds` field of type `double`.
:::

## @Scheduled Changes

The `@Scheduled.ignoreMissed` field was changed to `@Scheduled.automaticBackfill` for compatibility with [Schedule Management Methods](./reference/methods.md#schedule-management-methods).
The default was flipped from `true` to `false` to match the implied semantics of the new field name.

## DBOSClient Changes

`DBOSClient.EnqueueOptions` changed the order of the parameters for the three string constructor.
Previously, the className parameter was first and the workflowName was second.
For consistency with other DBOS APIs, these two parameters have swapped position.
Across the code base, when specifying the workflow name, class name, instance name of a registered workflow, we have the parameters in that order.

Additionally, similar to DBOS changes detailed above, `DBOSClient.getWorkflowStatus` and `DBOS.getEvent` now return `Optional` instead of a `@Nullable` value;





