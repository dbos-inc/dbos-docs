---
sidebar_position: 90
title: Spring Boot Integration
description: Add DBOS durable workflows to a Spring Boot application.
---

The `transact-spring-boot-starter` package integrates DBOS into a Spring Boot application with zero boilerplate: add the dependency, configure a datasource, annotate your beans, and DBOS launches automatically alongside the Spring context.

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

Instead of creating the [DBOSConfig](../reference/lifecycle.md#dbosconfig) for your app programmatically, 
the Spring Boot Starter package allows you to configure DBOS via Spring Boot 
[External Application Properties](https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.files). For example, you can set your application name and database connection in `application.yaml` (or `application.properties`):

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
    url: "jdbc:postgresql://localhost:5432/my_app_db"
    username: "postgres"
    password: "${PGPASSWORD}"
    driver-class-name: "org.postgresql.Driver"
```

:::danger
DBOS only supports PostgreSQL today. Attempting to use a non PostgreSQL database driver will throw an exception.
:::

For a full list of DBOSConfig fields you can set via application properties, please see the [reference documentation](../reference/spring-boot-starter.md#configuration-properties).

## Defining Workflows and Steps

In "vanilla" DBOS, you need to define an interface and a class in order use `@Workflow` and `@Step`.
With Spring Boot Starter, you can use the `@Workflow` and `@Step` annotations on methods on any Spring-managed singleton bean (`@Service`, `@Component`, etc.).
`transact-spring-boot-starter` uses [Spring AOP](https://docs.spring.io/spring-framework/reference/core/aop.html) instead of dynamic proxies, which do not require defining a separate interface. 

With Spring Boot Starter, you also don't need to manually register workflow and step proxies with 
[`dbos.registerProxy`](../reference/workflows-steps.md#registerproxy). 
The `DBOSWorkflowRegistrar` automatically scans all singleton beans after initialization and registers `@Workflow` methods automatically.

Note, that you do however still need a proxy instance for invocating `@Workflow` and `@Step` methods on the same instance.
This proxy reference can be self injected via an [`@Autowired`](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html) setter.

```java
@Service
public class OrderService {

  private OrderService self;

  // self reference is injected automatically by Spring Boot Dependency Injection
  @Autowired 
  @Lazy
  public void setSelf(WidgetStoreService self) {
    this.self = self;
  }

  @Workflow
  public String processOrder(String orderId) {
    // Invoke @Step via self reference to perform durable execution book keeping
    String result = self.chargeCard(orderId);   
    self.sendConfirmation(orderId, result);
    return result;
  }

  @Step
  public String chargeCard(String orderId) { /* ... */ return "charged"; }

  @Step
  public void sendConfirmation(String orderId, String result) { /* ... */ }
}
```

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

When multiple beans of the same class exist, the `@Primary` one is registered under the default (empty) instance name.
Additional beans of the same class are registered as [Workflow Class Instances](./workflow-classes.md) using their Spring bean name.
Use `withInstanceName(String)` in `StartWorkflowOptions` or `EnqueueOptions` to target a specific bean.

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
