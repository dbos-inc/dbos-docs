---
sidebar_position: 100
title: Using DBOS with Kotlin
description: Write DBOS workflows and steps in Kotlin using idiomatic trailing lambda syntax.
---

DBOS works with Kotlin out of the box — all Java APIs are accessible from Kotlin.
The `transact` artifact also ships Kotlin extension functions that make the most common calls idiomatic by placing the lambda last, enabling Kotlin's trailing lambda syntax.

## Dependency

The Kotlin extensions are included in the main `transact` artifact alongside the Java code; no extra dependency is needed.

<Tabs groupId="build-tool">
<TabItem value="gradle" label="Gradle">
```kotlin
dependencies {
    implementation("dev.dbos:transact:0.8.0")
}
```
</TabItem>
<TabItem value="maven" label="Maven">
```xml
<dependencies>
    <dependency>
        <groupId>dev.dbos</groupId>
        <artifactId>transact</artifactId>
        <version>0.8.0</version>
    </dependency>
</dependencies>
```
</TabItem>
</Tabs>

## Writing Workflows and Steps

Define your interface and implementation exactly as you would in Java, using the same `@Workflow` annotation:

```kotlin
interface OrderService {
    fun processOrder(orderId: String): String
}

class OrderServiceImpl(private val dbos: DBOS) : OrderService {

    private lateinit var self: OrderService

    fun setSelf(proxy: OrderService) { self = proxy }

    @Workflow
    override fun processOrder(orderId: String): String {
        val result = dbos.runStep("fetchOrder") {
            fetchFromApi(orderId)          // trailing lambda — idiomatic Kotlin
        }
        dbos.runStep("saveOrder") {
            saveToDatabase(result)
        }
        return result
    }
}
```

The `dbos.runStep(name) { ... }` form is a Kotlin extension function that puts the lambda last, avoiding the `ThrowingSupplier` wrapping you'd need in Java.

## Starting Workflows

Use `dbos.startWorkflow(options) { ... }` with trailing lambda syntax:

```kotlin
val dbos = DBOS(config)
val service = dbos.registerProxy(OrderService::class.java, OrderServiceImpl(dbos))

dbos.launch()

// Start a workflow in the background
val handle = dbos.startWorkflow(StartWorkflowOptions()) {
    service.processOrder("order-123")
}

// Or with a specific workflow ID
val handle = dbos.startWorkflow(StartWorkflowOptions("my-workflow-id")) {
    service.processOrder("order-456")
}

val result = handle.result
```

:::info
Kotlin's SAM conversion means a plain `dbos.startWorkflow { }` call (with no options argument) would be ambiguous with the Java overload.
Always pass `StartWorkflowOptions()` (or `null`) as the first argument when using the trailing lambda form.
:::

## Step Options

Pass a `StepOptions` object when you need retry configuration:

```kotlin
val result = dbos.runStep(StepOptions("fetchOrder").withMaxAttempts(3)) {
    fetchFromApi(orderId)
}
```

## Registration and Lifecycle

Registration and lifecycle are identical to Java:

```kotlin
val config = DBOSConfig.defaultsFromEnv("my-app")
val dbos = DBOS(config)

val service = dbos.registerProxy(OrderService::class.java, OrderServiceImpl(dbos).also {
    it.setSelf(/* proxy set below */)
})

dbos.launch()

// DBOS is AutoCloseable
dbos.use {
    service.processOrder("order-789")
}
```
