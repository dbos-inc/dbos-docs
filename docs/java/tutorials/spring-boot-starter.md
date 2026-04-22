---
sidebar_position: 80
title: Spring Boot Integration
description: Add DBOS durable workflows to a Spring Boot application.
---

The `transact-spring-boot-starter` integrates DBOS into a Spring Boot application with zero boilerplate: add the dependency, configure a datasource, annotate your beans, and DBOS launches automatically alongside the Spring context.

## Adding the Dependency

<Tabs groupId="build-tool">
<TabItem value="gradle" label="Gradle">
```groovy
dependencies {
    implementation 'dev.dbos:transact-spring-boot-starter:0.8.0'
}
```
</TabItem>
<TabItem value="maven" label="Maven">
```xml
<dependencies>
    <dependency>
        <groupId>dev.dbos</groupId>
        <artifactId>transact-spring-boot-starter</artifactId>
        <version>0.8.0</version>
    </dependency>
</dependencies>
```
</TabItem>
</Tabs>

## Configuration

Set your application name and database connection in `application.properties` (or `application.yml`):

```properties
spring.application.name=my-app

# DBOS system database (omit if DBOS should share the app's primary DataSource)
dbos.datasource.url=jdbc:postgresql://localhost:5432/mydb
dbos.datasource.username=myuser
dbos.datasource.password=secret
```

If `dbos.datasource.*` is not set and a `DataSource` bean exists in the Spring context, DBOS uses it automatically.

The application name can also be set via `dbos.application.name`; `spring.application.name` is used as a fallback.

## Defining Workflows and Steps

Annotate methods on any Spring-managed singleton bean (`@Service`, `@Component`, etc.) with `@Workflow` and `@Step` as usual:

```java
@Service
public class OrderService {

    @Autowired OrderService self;  // self-inject to go through the Spring proxy

    @Workflow
    public String processOrder(String orderId) {
        String result = self.chargeCard(orderId);   // durable step via self-proxy
        self.sendConfirmation(orderId, result);
        return result;
    }

    @Step
    public String chargeCard(String orderId) { /* ... */ return "charged"; }

    @Step
    public void sendConfirmation(String orderId, String result) { /* ... */ }
}
```

`DBOSWorkflowRegistrar` scans all singleton beans after initialization and registers those with `@Workflow` methods automatically — no manual `dbos.registerProxy(...)` call needed.

:::warning Self-injection is required for steps
Spring AOP only intercepts calls made **through the proxy**. A direct `this.chargeCard()` call inside a workflow body bypasses the aspect and runs outside DBOS, losing durability. Inject a self-reference with `@Autowired MyService self` and call through it.
:::

## Lifecycle

`DBOSLifecycle` is a `SmartLifecycle` bean that calls `dbos.launch()` after all singletons are initialized and `dbos.shutdown()` when the context closes. Schedules and queues registered in `@PostConstruct` methods or `ApplicationListener<ContextRefreshedEvent>` handlers are guaranteed to be in place before launch.

## Programmatic Configuration

Declare a `DBOSConfigCustomizer` bean to adjust the auto-configured `DBOSConfig` without replacing it:

```java
@Bean
public DBOSConfigCustomizer myCustomizer() {
    return config -> config
        .withAdminServer(true)
        .withAdminServerPort(8081)
        .withEnablePatching(true);
}
```

Multiple `DBOSConfigCustomizer` beans are applied in `@Order` / `Ordered` order. To replace the config entirely, declare your own `@Bean DBOSConfig`.

## Multiple Instances of the Same Class

When multiple beans of the same class exist, the `@Primary` one is registered under the default (empty) instance name; the rest are registered under their Spring bean name. Use `withInstanceName(String)` in `StartWorkflowOptions` or `EnqueueOptions` to target a specific instance.

## Using `dbos` Directly

The auto-configured `DBOS` bean is available for injection anywhere in the application:

```java
@Service
public class ScheduleSetup implements ApplicationListener<ContextRefreshedEvent> {

    @Autowired DBOS dbos;
    @Autowired OrderService orderServiceProxy;

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        dbos.applySchedules(
            new WorkflowSchedule("daily-orders", "processOrder",
                "com.example.OrderService", "0 0 9 * * *")
        );
    }
}
```
