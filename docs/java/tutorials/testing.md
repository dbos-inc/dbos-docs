---
sidebar_position: 77
title: Testing Workflows
description: Unit test DBOS workflows by mocking the DBOS instance.
---

Because `DBOS` is a regular Java object injected into your workflow classes — not a global static — it can be mocked with any standard Java mocking library such as [Mockito](https://site.mockito.org/).
This lets you test your workflow logic in complete isolation, without a Postgres database.

## Unit Testing

The key insight is that `dbos.runStep(lambda, name)` takes a lambda that is only executed by the real DBOS runtime.
When `DBOS` is mocked, the lambda is never called — you control what the mock returns.
This lets you test workflow branching logic (payment succeeds, inventory is low, etc.) by stubbing step outcomes directly.

### Setup

Construct your workflow class directly, passing a mock `DBOS`:

```java
import static org.mockito.Mockito.*;

class CheckoutWorkflowTest {

    // Mockito struggles with generic ThrowingSupplier/ThrowingRunnable types,
    // so define typed helpers to avoid unchecked-cast warnings.
    private static ThrowingRunnable<RuntimeException> anyRunnable() {
        return ArgumentMatchers.any();
    }

    private static <T> ThrowingSupplier<T, RuntimeException> anySupplier() {
        return ArgumentMatchers.any();
    }

    private DBOS mockDBOS;
    private WidgetStoreRepository mockRepo;
    private WidgetStoreService mockSelf;
    private WidgetStoreService service;

    @BeforeEach
    void setUp() {
        mockDBOS = mock(DBOS.class);
        mockRepo = mock(WidgetStoreRepository.class);
        mockSelf = mock(WidgetStoreService.class);
        service = new WidgetStoreService(mockDBOS, mockRepo);
        service.setSelf(mockSelf);  // inject the mocked self-proxy
    }
}
```

`mockRepo` and `mockSelf` are mocked separately.
Because the workflow body calls them only via `dbos.runStep(() -> repo.someMethod(), "name")`, the lambdas are never executed against the mocks — but you can verify that the steps were invoked in the right order with the right names.

### Writing Tests

Stub step return values and verify the workflow's sequence of DBOS calls:

```java
@Test
void checkoutWorkflow_paymentSuccessful_paysAndDispatchesOrder() throws Exception {
    int orderId = 42;
    when(mockDBOS.runStep(anySupplier(), eq("createOrder"))).thenReturn(orderId);
    when(mockDBOS.recv(eq(PAYMENT_STATUS), any())).thenReturn(Optional.of("paid"));

    service.checkoutWorkflow();

    InOrder inOrder = Mockito.inOrder(mockDBOS);
    inOrder.verify(mockDBOS).runStep(anyRunnable(), eq("subtractInventory"));
    inOrder.verify(mockDBOS).runStep(anySupplier(), eq("createOrder"));
    inOrder.verify(mockDBOS).setEvent(eq(PAYMENT_ID), any());
    inOrder.verify(mockDBOS).recv(eq(PAYMENT_STATUS), any());
    inOrder.verify(mockDBOS).runStep(anyRunnable(), eq("markOrderPaid"));
    inOrder.verify(mockDBOS).startWorkflow(anyRunnable());
    inOrder.verify(mockDBOS).setEvent(eq(ORDER_ID), eq(String.valueOf(orderId)));
}

@Test
void checkoutWorkflow_insufficientInventory_setsNullPaymentIdAndReturns() throws Exception {
    doThrow(new RuntimeException("Insufficient Inventory"))
        .when(mockDBOS)
        .runStep(anyRunnable(), eq("subtractInventory"));

    service.checkoutWorkflow();

    verify(mockDBOS).setEvent(eq(PAYMENT_ID), eq(null));
    verify(mockDBOS, never()).runStep(anySupplier(), eq("createOrder"));
}
```

:::tip
Add an `@AfterEach` assertion that `mockRepo` and `mockSelf` had no direct interactions.
This guards against workflow code accidentally calling them outside a `runStep` wrapper:

```java
@AfterEach
void verifyNoDirectCalls() {
    verifyNoInteractions(mockRepo, mockSelf);
}
```
:::

### Spring Boot

With the Spring Boot starter, `DBOS` is injected by Spring and the workflow class is a `@Service`.
You can test it the same way — construct the service directly with mocks rather than loading the Spring context:

```java
@BeforeEach
void setUp() {
    mockDBOS = mock(DBOS.class);
    service = new MyWorkflowService(mockDBOS, otherDependencies...);
}
```

This is faster than `@SpringBootTest` and keeps the test free of container overhead.

## Integration Testing

For tests that exercise real durable execution — recovery, exactly-once steps, queues — you need a live Postgres database and a real `DBOS` instance.

`DBOS` implements `AutoCloseable`, so use try-with-resources to guarantee shutdown:

```java
@Test
void workflow_resumesAfterInterruption() throws Exception {
    DBOSConfig config = DBOSConfig.defaults("test-app")
        .withDatabaseUrl(System.getenv("DBOS_TEST_JDBC_URL"))
        .withDbUser(System.getenv("PGUSER"))
        .withDbPassword(System.getenv("PGPASSWORD"));

    try (var dbos = new DBOS(config)) {
        var workflows = dbos.registerProxy(MyWorkflows.class, new MyWorkflowsImpl(dbos));
        dbos.launch();
        // exercise real durable behaviour
        workflows.myWorkflow("input");
    }
}
```

For test isolation, use a fresh database per test run. The easiest approach is [Testcontainers](https://testcontainers.com/) with the Postgres module, which spins up a throwaway Postgres container:

```java
@Testcontainers
class MyWorkflowIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:17");

    @Test
    void myWorkflow_completesSuccessfully() throws Exception {
        DBOSConfig config = DBOSConfig.defaults("test-app")
            .withDatabaseUrl(postgres.getJdbcUrl())
            .withDbUser(postgres.getUsername())
            .withDbPassword(postgres.getPassword());

        try (var dbos = new DBOS(config)) {
            var workflows = dbos.registerProxy(MyWorkflows.class, new MyWorkflowsImpl(dbos));
            dbos.launch();
            workflows.myWorkflow("input");
        }
    }
}
```

Alternatively, use the [`dbos reset`](../reference/cli.md) CLI command to wipe system database state between manual test runs against a local Postgres instance.
