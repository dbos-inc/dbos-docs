---
sidebar_position: 25
title: Transactional Steps
toc_max_heading_level: 4
---

Regular DBOS steps checkpoint their output _after_ the step body completes.
If the application crashes after your database write but before the checkpoint is saved, the step runs again on recovery — potentially writing to the database twice.

**Transactional step factories** solve this by committing the step output and your database work in the **same transaction**.
On retry, DBOS finds the recorded output and returns it without re-executing, making the step exactly-once even for database writes.

:::info
Transactional step factories require the `tx_step_outputs` table in your application database.
This table is created automatically at startup, but your database user must have `CREATE TABLE` privileges in the configured schema.
If you use a restricted database role in production, grant the necessary privileges or create the table manually before deploying.
:::

## Choosing an approach

| Situation | Recommendation |
|-----------|----------------|
| Plain JDBC / `DataSource` | [`JdbcStepFactory`](#jdbcstepfactory) from the `transact` module |
| JDBI 3 | [`JdbiStepFactory`](#jdbistepfactory) from `transact-jdbi-step-factory` |
| jOOQ | [`JooqStepFactory`](#jooqstepfactory) from `transact-jooq-step-factory` |
| Spring Boot app | [`@TransactionalStep`](#spring-boot-transactionalstep) from `transact-spring-txstep-starter` |

---

## JdbcStepFactory

`JdbcStepFactory` is included in the core `transact` module — no extra dependency needed.

Construct it once (before `dbos.launch()`) and call `txStep` inside any `@Workflow` method:

```java
JdbcStepFactory factory = new JdbcStepFactory(dbos, dataSource);
```

Inside a workflow, pass a lambda that receives an open `Connection`.
Do **not** call `commit` or `close` on the connection — the factory manages the transaction.

```java
class OrderWorkflowImpl implements OrderWorkflow {
    private final JdbcStepFactory factory;

    public OrderWorkflowImpl(DBOS dbos, DataSource dataSource) {
        this.factory = new JdbcStepFactory(dbos, dataSource);
    }

    @Workflow
    public String processOrder(String orderId) throws Exception {
        return factory.txStep(conn -> {
            try (var stmt = conn.prepareStatement(
                    "INSERT INTO orders(id) VALUES (?)")) {
                stmt.setString(1, orderId);
                stmt.executeUpdate();
            }
            return orderId;
        }, "insertOrder");
    }
}
```

Use the void overload when the step doesn't need to return a value:

```java
factory.txStep(conn -> {
    conn.prepareStatement("DELETE FROM staging WHERE id = ?")
        .setString(1, id)
        .executeUpdate();
}, "deleteStaging");
```

---

## JdbiStepFactory

Add the dependency:

```kotlin title="build.gradle.kts"
implementation("dev.dbos:transact-jdbi-step-factory:<version>")
```

```xml title="pom.xml"
<dependency>
  <groupId>dev.dbos</groupId>
  <artifactId>transact-jdbi-step-factory</artifactId>
  <version>VERSION</version>
</dependency>
```

Construct with a `Jdbi` instance and call `inStep` (with return value) or `useStep` (void) inside workflows.
The lambda receives an open `Handle` — do **not** call `commit` or `close` on it.

```java
JdbiStepFactory factory = new JdbiStepFactory(dbos, jdbi);

@Workflow
public String processOrder(String orderId) {
    return factory.inStep(handle -> {
        handle.createUpdate("INSERT INTO orders(id) VALUES (:id)")
            .bind("id", orderId)
            .execute();
        return orderId;
    }, "insertOrder");
}
```

Void variant:

```java
factory.useStep(handle -> {
    handle.createUpdate("DELETE FROM staging WHERE id = :id")
        .bind("id", id)
        .execute();
}, "deleteStaging");
```

---

## JooqStepFactory

Add the dependency:

```kotlin title="build.gradle.kts"
implementation("dev.dbos:transact-jooq-step-factory:<version>")
```

```xml title="pom.xml"
<dependency>
  <groupId>dev.dbos</groupId>
  <artifactId>transact-jooq-step-factory</artifactId>
  <version>VERSION</version>
</dependency>
```

Construct with a `DSLContext` and call `txStepResult` (with return value) or `txStep` (void) inside workflows.
The lambda receives a jOOQ `Configuration` with an open transaction — do **not** commit or close the connection.

```java
JooqStepFactory factory = new JooqStepFactory(dbos, dslContext);

@Workflow
public String processOrder(String orderId) {
    return factory.txStepResult(trx -> {
        trx.dsl().execute("INSERT INTO orders(id) VALUES (?)", orderId);
        return orderId;
    }, "insertOrder");
}
```

Void variant:

```java
factory.txStep(trx -> {
    trx.dsl().execute("DELETE FROM staging WHERE id = ?", id);
}, "deleteStaging");
```

---

## `@TransactionalStep`

If you are using Spring Boot, the `transact-spring-txstep-starter` module provides `@TransactionalStep` — an annotation that turns any Spring-managed method into a step factory step with no lambda wrapping required.

### Installation

Add both the DBOS Spring Boot starter and this module:

```kotlin title="build.gradle.kts"
implementation("dev.dbos:transact-spring-boot-starter:<version>")
implementation("dev.dbos:transact-spring-txstep-starter:<version>")
```

```xml title="pom.xml"
<dependency>
  <groupId>dev.dbos</groupId>
  <artifactId>transact-spring-boot-starter</artifactId>
  <version>VERSION</version>
</dependency>
<dependency>
  <groupId>dev.dbos</groupId>
  <artifactId>transact-spring-txstep-starter</artifactId>
  <version>VERSION</version>
</dependency>
```

### Usage

Annotate any Spring-managed method with `@TransactionalStep`.
The method must be called through a Spring proxy — inject the bean into a `@Workflow`-annotated method in another Spring bean.

When called from inside a `@Workflow` (and not already inside a step), the full step factory behaviour applies: the method runs in a `REQUIRES_NEW` transaction and the output is checkpointed atomically.
When called from outside a workflow, or from inside any step (including another `@TransactionalStep`), it behaves like `@Transactional` — the transaction runs normally with `PROPAGATION_REQUIRED` but no DBOS checkpoint is recorded. This makes `@TransactionalStep` methods safe to call from any context.

#### JdbcTemplate

No extra dependencies needed. Spring Boot auto-configures `DataSourceTransactionManager` and `JdbcTemplate`.

```java
@Service
public class OrderStepService {
    @Autowired JdbcTemplate jdbc;

    @TransactionalStep
    public Order saveOrder(Order order) {
        jdbc.update("INSERT INTO orders(id, item, qty) VALUES (?, ?, ?)",
            order.id(), order.item(), order.qty());
        return order;
    }
}

@Service
public class OrderWorkflowService {
    @Autowired OrderStepService steps;

    @Workflow
    public Order processOrder(Order order) {
        return steps.saveOrder(order);
    }
}
```

#### JDBI

Add `jdbi3-spring` so JDBI's `SpringTransactionHandler` reuses the active Spring transaction:

```kotlin
implementation("org.jdbi:jdbi3-spring:<version>")
```

Configure JDBI as a Spring bean:

```java
@Configuration
public class JdbiConfig {
    @Bean
    public Jdbi jdbi(DataSource dataSource) throws Exception {
        var factory = new JdbiFactoryBean(dataSource);
        factory.afterPropertiesSet();
        return factory.getObject();
    }
}
```

Then annotate your step method as usual:

```java
@Service
public class OrderStepService {
    @Autowired Jdbi jdbi;

    @TransactionalStep
    public Order saveOrder(Order order) {
        jdbi.withHandle(h ->
            h.execute("INSERT INTO orders(id, item, qty) VALUES (?, ?, ?)",
                order.id(), order.item(), order.qty()));
        return order;
    }
}
```

#### jOOQ

Spring Boot auto-configures `DSLContext` with `SpringTransactionProvider` when you add `spring-boot-starter-jooq`:

```kotlin
implementation("org.springframework.boot:spring-boot-starter-jooq")
```

Set `spring.jooq.sql-dialect=POSTGRES` in your `application.properties`, then inject `DSLContext` directly:

```java
@Service
public class OrderStepService {
    @Autowired DSLContext dsl;

    @TransactionalStep
    public Order saveOrder(Order order) {
        dsl.execute("INSERT INTO orders(id, item, qty) VALUES (?, ?, ?)",
            order.id(), order.item(), order.qty());
        return order;
    }
}
```

#### JPA / Hibernate

Spring Boot auto-configures `JpaTransactionManager` when `spring-boot-starter-data-jpa` is present:

```kotlin
implementation("org.springframework.boot:spring-boot-starter-data-jpa")
```

```java
@Service
public class OrderStepService {
    @Autowired OrderRepository repo;  // Spring Data JPA repository

    @TransactionalStep
    public Order saveOrder(Order order) {
        return repo.save(order);
    }
}
```

### Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `dbos.txstep.schema` | DBOS system schema | PostgreSQL schema for the `tx_step_outputs` table. Defaults to `DBOSConfig.databaseSchema` if unspecified. |

The `tx_step_outputs` table is created lazily on startup — only if at least one `@TransactionalStep` method is found in the Spring context.
Applications that never use the annotation incur no database contact.

### How it works

1. `TransactionalStepAspect` intercepts every `@TransactionalStep` call and delegates to `TransactionalStepFactory`.
2. The factory calls `DBOS.runStep()`, which checks `tx_step_outputs` for a prior result. If one exists, it is returned immediately (idempotent replay).
3. Otherwise, a `REQUIRES_NEW` Spring transaction is started. The method body runs, and the result is written to `tx_step_outputs` using `DataSourceUtils.getConnection()` — the same connection the transaction holds.
4. The transaction commits, making the user's write and the step output record atomic. If the method throws, the transaction rolls back and the error is recorded separately so retries can replay it.
