---
sidebar_position: 90
title: Spring Boot Integration
description: Add DBOS durable workflows to a Spring Boot application.
---

The `transact-spring-boot-starter` integrates DBOS into a Spring Boot application with zero boilerplate: add the dependency, configure a datasource, annotate your beans, and DBOS launches automatically alongside the Spring context.

## Adding the Dependency

<Tabs groupId="build-tool">
<TabItem value="gradle" label="Gradle">
```kotlin
dependencies {
  implementation("dev.dbos:transact-spring-boot-starter:0.8.0")
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

Set your application name and database connection in `application.yaml` (or `application.properties`):

```yml
dbos:
  application:
    name: "my-app"
  # DBOS system database 
  datasource:
    url: "jdbc:postgresql://localhost:5432/my_app_db"
    username: "postgres"
    password: "${PGPASSWORD}"
```

If `dbos.application.name` or `dbos.datasource` properties are not set, `spring.application.name` and `spring.datasource` are used as a fallback.

```yml
spring:
  application:
    name: "widget-store"
  datasource:
    url: "jdbc:postgresql://localhost:5432/widget_store_java"
    username: "postgres"
    password: "${PGPASSWORD}"
    driver-class-name: "org.postgresql.Driver"
```

:::danger
DBOS only supports PostgreSQL today. Attempting to use a non PostgreSQL database driver will throw an exception.
:::


## Defining Workflows and Steps

Annotate methods on any Spring-managed singleton bean (`@Service`, `@Component`, etc.) with `@Workflow` and `@Step`.
Note, `transact-spring-boot-starter` uses [Spring AOP](https://docs.spring.io/spring-framework/reference/core/aop.html) which does not require defining a separate interface.
You do however still need a proxy instance for invocating `@Workflow` and `@Step` methods on the same instance.
This proxy reference can be self injected via an [`@Autowired`](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html) setter.

```java
@Service
public class OrderService {

  private OrderService self;

  @Autowired 
  @Lazy
  public void setSelf(WidgetStoreService self) {
    this.self = self;
  }

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
