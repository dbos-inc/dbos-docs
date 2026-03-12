---
sidebar_position: 30
title: Migrating From Temporal
hide_table_of_contents: false
---

This guide explains how to migrate a Temporal application to DBOS, with a focus on how each major Temporal feature translates to DBOS.

:::info
For a high-level comparison of DBOS and Temporal's architectures, see [Comparing DBOS and Temporal](./comparing-temporal.md).
:::

## Workflows

The core feature of both DBOS and Temporal is durably executed workflows.
Both DBOS and Temporal automatically recover workflows from the last completed step (activity) after any failure.
Both DBOS and Temporal support extremely long-running workflows, including workflows that run for weeks or months.

**Temporal:**
```python
@workflow.defn
class OrderWorkflow:
    @workflow.run
    async def run(self, order: Order) -> str:
        result = await workflow.execute_activity(
            validate_order,
            order,
            start_to_close_timeout=timedelta(seconds=30),
        )
        confirmation = await workflow.execute_activity(
            process_payment,
            result,
            start_to_close_timeout=timedelta(seconds=60),
        )
        return confirmation
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
@DBOS.workflow()
def order_workflow(order: Order) -> str:
    result = validate_order(order)
    confirmation = process_payment(result)
    return confirmation
```

Learn more in the [workflows tutorial](../python/tutorials/workflow-tutorial.md).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
async function orderWorkflow(order: Order): Promise<string> {
    const result = await validateOrder(order);
    const confirmation = await processPayment(result);
    return confirmation;
}
const orderWorkflowFn = DBOS.registerWorkflow(orderWorkflow);
```

Learn more in the [workflows tutorial](../typescript/tutorials/workflow-tutorial.md).

</TabItem>
<TabItem value="go" label="Go">

```go
func OrderWorkflow(ctx dbos.DBOSContext, order Order) (string, error) {
    result, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return validateOrder(stepCtx, order)
    }, dbos.WithStepName("validateOrder"))
    if err != nil {
        return "", err
    }
    confirmation, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return processPayment(stepCtx, result)
    }, dbos.WithStepName("processPayment"))
    return confirmation, err
}
```

Learn more in the [workflows tutorial](../golang/tutorials/workflow-tutorial.md).

</TabItem>
<TabItem value="java" label="Java">

```java
@Workflow(name = "orderWorkflow")
public String orderWorkflow(Order order) {
    String result = DBOS.runStep(() -> validateOrder(order), "validateOrder");
    String confirmation = DBOS.runStep(() -> processPayment(result), "processPayment");
    return confirmation;
}
```

Learn more in the [workflows tutorial](../java/tutorials/workflow-tutorial.md).

</TabItem>
</Tabs>

### Starting Workflows

In Temporal, you start workflows through a client connected to the Temporal server.
In DBOS, you can either start a workflow in your application directly or enqueue workflows from a separate application using the DBOS Client, which connects directly to the DBOS system database:

**Temporal:**
```python
client = await Client.connect("localhost:7233")
handle = await client.start_workflow(
    OrderWorkflow.run,
    order,
    id="order-123",
    task_queue="orders",
)
result = await handle.result()
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
# Starting a workflow from in your application
with SetWorkflowID("order-123"):
    handle = DBOS.start_workflow(order_workflow, order)
result = handle.get_result()
```

```python
# Starting a workflow from another application using the DBOS Client
client = DBOSClient(system_database_url=os.environ["DBOS_SYSTEM_DATABASE_URL"])
handle = client.enqueue({"workflow_name": "order_workflow", "queue_name": "orders"}, order)
result = handle.get_result()
```

Learn more in the [workflows tutorial](../python/tutorials/workflow-tutorial.md).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
// Starting a workflow from in your application
const handle = await DBOS.startWorkflow(orderWorkflowFn, {workflowID: "order-123"})();
const result = await handle.getResult();
```

```typescript
// Starting a workflow from another application using the DBOS Client
const client = await DBOSClient.create({systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL});
await client.enqueue<typeof orderWorkflow>(
    { workflowName: "orderWorkflow", queueName: "orders" },
    order,
);
```

Learn more in the [workflows tutorial](../typescript/tutorials/workflow-tutorial.md).

</TabItem>
<TabItem value="go" label="Go">

```go
// Starting a workflow from in your application
handle, err := dbos.RunWorkflow(dbosContext, OrderWorkflow, order, dbos.WithWorkflowID("order-123"))
result, err := handle.GetResult()
```

```go
// Starting a workflow from another application using the DBOS Client
client, err := dbos.NewClient(context.Background(), dbos.ClientConfig{
    DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
})
handle, err := dbos.Enqueue[Order, string](client, "orders", "OrderWorkflow", order)
result, err := handle.GetResult()
```

Learn more in the [workflows tutorial](../golang/tutorials/workflow-tutorial.md).

</TabItem>
<TabItem value="java" label="Java">

```java
// Starting a workflow from in your application
WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
    () -> proxy.orderWorkflow(order),
    new StartWorkflowOptions().withWorkflowId("order-123")
);
String result = handle.getResult();
```

```java
// Starting a workflow from another application using the DBOS Client
var client = new DBOSClient(dbUrl, dbUser, dbPassword);
var options = new DBOSClient.EnqueueOptions("OrderImpl", "orderWorkflow", "orders");
var handle = client.enqueueWorkflow(options, new Object[]{order});
Object result = handle.getResult();
```

Learn more in the [workflows tutorial](../java/tutorials/workflow-tutorial.md).

</TabItem>
</Tabs>

### Workflow IDs and Idempotency

Both systems support workflow IDs for idempotency. In Temporal, you pass the ID when starting a workflow. In DBOS, you set the workflow ID before calling the workflow. If a workflow with that ID has already run, it returns the previous result instead of re-executing.

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
with SetWorkflowID("payment-idempotency-key"):
    order_workflow(order)
```

Learn more in the [workflows tutorial](../python/tutorials/workflow-tutorial.md#workflow-ids-and-idempotency).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
const handle = await DBOS.startWorkflow(orderWorkflowFn, {workflowID: "payment-idempotency-key"})();
```

Learn more in the [workflows tutorial](../typescript/tutorials/workflow-tutorial.md#workflow-ids-and-idempotency).

</TabItem>
<TabItem value="go" label="Go">

```go
handle, err := dbos.RunWorkflow(dbosContext, OrderWorkflow, order, dbos.WithWorkflowID("payment-idempotency-key"))
```

Learn more in the [workflows tutorial](../golang/tutorials/workflow-tutorial.md#workflow-ids).

</TabItem>
<TabItem value="java" label="Java">

```java
DBOS.startWorkflow(
    () -> proxy.orderWorkflow(order),
    new StartWorkflowOptions().withWorkflowId("payment-idempotency-key")
);
```

Learn more in the [workflows tutorial](../java/tutorials/workflow-tutorial.md#workflow-ids-and-idempotency).

</TabItem>
</Tabs>

### Determinism

Both DBOS and Temporal require workflows to be deterministic. Non-deterministic operations (API calls, random numbers, current time) must happen inside activities/steps, not directly in the workflow function.

### Durable Timers

Temporal's `workflow.sleep()` maps directly to `DBOS.sleep()`. Both are durable and persist across restarts.

**Temporal:**
```python
await workflow.sleep(timedelta(hours=24))
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
DBOS.sleep(86400)  # seconds
```

Learn more in the [workflows tutorial](../python/tutorials/workflow-tutorial.md#durable-sleep).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
await DBOS.sleep(86400000);  // milliseconds
```

Learn more in the [workflows tutorial](../typescript/tutorials/workflow-tutorial.md#durable-sleep).

</TabItem>
<TabItem value="go" label="Go">

```go
dbos.Sleep(ctx, 24 * time.Hour)
```

Learn more in the [workflows tutorial](../golang/tutorials/workflow-tutorial.md#durable-sleep).

</TabItem>
<TabItem value="java" label="Java">

```java
DBOS.sleep(Duration.ofHours(24));
```

Learn more in the [workflows tutorial](../java/tutorials/workflow-tutorial.md#durable-sleep).

</TabItem>
</Tabs>

### Continue-as-New

A common pattern in Temporal is to use an extremely long-running workflow as a durable object, interacting with it via signals and queries and periodically refreshing its state with `continue_as_new` to avoid Temporal's workflow size limits.
In DBOS, we recommend instead storing long-lived objects in your database and interacting with them through shorter-lived workflows.
You can use durable queues (in particular, partitioned queues) to manage the concurrency of those interactions, providing the same guarantees without the complexity of managing an extremely long-lived workflow.

## Activities &rarr; Steps

Temporal activities map to DBOS steps. Both are where side effects and non-deterministic operations happen.

The key architectural difference is how they're called. In Temporal, activities are dispatched to workers through the Temporal server. In DBOS, steps are called as regular functions; DBOS checkpoints their results to Postgres automatically.

**Temporal:**
```python
@activity.defn
async def send_email(to: str, body: str) -> bool:
    response = requests.post(EMAIL_API, json={"to": to, "body": body})
    return response.ok
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
@DBOS.step()
def send_email(to: str, body: str) -> bool:
    response = requests.post(EMAIL_API, json={"to": to, "body": body})
    return response.ok
```

Learn more in the [steps tutorial](../python/tutorials/step-tutorial.md).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
const sendEmail = DBOS.registerStep(async (to: string, body: string): Promise<boolean> => {
    const response = await fetch(EMAIL_API, {
        method: "POST",
        body: JSON.stringify({ to, body }),
    });
    return response.ok;
});
```

Learn more in the [steps tutorial](../typescript/tutorials/step-tutorial.md).

</TabItem>
<TabItem value="go" label="Go">

```go
// Steps are called inline using RunAsStep
result, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (bool, error) {
    return sendEmail(stepCtx, to, body)
}, dbos.WithStepName("sendEmail"))
```

Learn more in the [steps tutorial](../golang/tutorials/step-tutorial.md).

</TabItem>
<TabItem value="java" label="Java">

```java
// Steps are called inline using DBOS.runStep
boolean result = DBOS.runStep(() -> sendEmail(to, body), "sendEmail");
```

Learn more in the [steps tutorial](../java/tutorials/step-tutorial.md).

</TabItem>
</Tabs>

### Retries

Both systems support configurable retries with exponential backoff. 

**Temporal**:
```python
result = await workflow.execute_activity(
    send_email,
    args=[to, body],
    start_to_close_timeout=timedelta(seconds=30),
    retry_policy=RetryPolicy(
        initial_interval=timedelta(seconds=1),
        backoff_coefficient=2.0,
        maximum_attempts=5,
    ),
)
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
@DBOS.step(retries_allowed=True, max_attempts=5, interval_seconds=1.0, backoff_rate=2.0)
def send_email(to: str, body: str) -> bool:
    response = requests.post(EMAIL_API, json={"to": to, "body": body})
    return response.ok
```

Learn more in the [steps tutorial](../python/tutorials/step-tutorial.md#configurable-retries).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
const sendEmail = DBOS.registerStep(
    async (to: string, body: string): Promise<boolean> => {
        const response = await fetch(EMAIL_API, {
            method: "POST",
            body: JSON.stringify({ to, body }),
        });
        return response.ok;
    },
    { retriesAllowed: true, maxAttempts: 5, intervalSeconds: 1.0, backoffRate: 2.0 }
);
```

Learn more in the [steps tutorial](../typescript/tutorials/step-tutorial.md#configurable-retries).

</TabItem>
<TabItem value="go" label="Go">

```go
result, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (bool, error) {
    return sendEmail(stepCtx, to, body)
},
    dbos.WithStepName("sendEmail"),
    dbos.WithStepMaxRetries(5),
    dbos.WithBaseInterval(1 * time.Second),
    dbos.WithBackoffFactor(2.0),
)
```

Learn more in the [steps tutorial](../golang/tutorials/step-tutorial.md#configurable-retries).

</TabItem>
<TabItem value="java" label="Java">

```java
boolean result = DBOS.runStep(
    () -> sendEmail(to, body),
    new StepOptions("sendEmail")
        .withRetriesAllowed(true)
        .withMaxAttempts(5)
        .withIntervalSeconds(1.0)
        .withBackoffRate(2.0)
);
```

Learn more in the [steps tutorial](../java/tutorials/step-tutorial.md#configurable-retries).

</TabItem>
</Tabs>

### Heartbeats

Temporal activities support heartbeats for long-running operations so the server knows the activity is still alive. DBOS does not require heartbeats because there is no central orchestrator monitoring activity execution; instead, steps run directly in your application process.

### Database Operations

DBOS provides a special type of step called a transaction that executes database operations in a single database transaction, co-committed with the DBOS checkpoint.
This provides exactly-once semantics for database writes, which is stronger than the at-least-once semantics offered by Temporal.

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

Learn more in the [transactions tutorial](../python/tutorials/step-tutorial.md#transactions).

```python
@DBOS.transaction()
def update_order_status(order_id: str, status: str) -> None:
    DBOS.sql_session.execute(
        text("UPDATE orders SET status = :status WHERE id = :id"),
        {"status": status, "id": order_id}
    )
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Learn more in the [transactions tutorial](../typescript/tutorials/transaction-tutorial.md).

```typescript
const dataSource = new KnexDataSource('app-db', {
    client: 'pg', connection: process.env.DBOS_DATABASE_URL
});

async function updateOrderStatus(orderId: string, status: string) {
    await dataSource.client('orders')
        .where({ id: orderId })
        .update({ status });
}
const updateOrderStatusTx = dataSource.registerTransaction(updateOrderStatus);
```

</TabItem>
</Tabs>

## Signals &rarr; Messages

Temporal signals let you send data to a running workflow. The equivalent in DBOS is **messages**, using `send()` and `recv()`.

**Temporal:**
```python
# In the workflow
@workflow.defn
class OrderWorkflow:
    def __init__(self):
        self.payment_status = None

    @workflow.signal
    async def payment_received(self, status: str):
        self.payment_status = status

    @workflow.run
    async def run(self, order: Order):
        # ... start order processing ...
        await workflow.wait_condition(lambda: self.payment_status is not None)
        if self.payment_status == "paid":
            # handle success
        else:
            # handle failure

# Sending the signal
handle = client.get_workflow_handle("order-123")
await handle.signal(OrderWorkflow.payment_received, "paid")
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
# In the workflow
@DBOS.workflow()
def order_workflow(order: Order):
    # ... start order processing ...
    payment_status = DBOS.recv("payment_status", timeout_seconds=3600)
    if payment_status is not None and payment_status == "paid":
        # handle success
    else:
        # handle failure

# Sending the message
DBOS.send("order-123", "paid", topic="payment_status")
```

Learn more in the [workflow communication tutorial](../python/tutorials/workflow-communication.md#workflow-messaging-and-notifications).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
// In the workflow
async function orderWorkflow(order: Order) {
    // ... start order processing ...
    const paymentStatus = await DBOS.recv<string>("payment_status", 3600);
    if (paymentStatus !== null && paymentStatus === "paid") {
        // handle success
    } else {
        // handle failure
    }
}
const orderWorkflowFn = DBOS.registerWorkflow(orderWorkflow);

// Sending the message
await DBOS.send("order-123", "paid", "payment_status");
```

Learn more in the [workflow communication tutorial](../typescript/tutorials/workflow-communication.md#workflow-messaging-and-notifications).

</TabItem>
<TabItem value="go" label="Go">

```go
// In the workflow
func OrderWorkflow(ctx dbos.DBOSContext, order Order) (string, error) {
    // ... start order processing ...
    paymentStatus, err := dbos.Recv[string](ctx, "payment_status", 1*time.Hour)
    if err != nil {
        return "", err
    }
    if paymentStatus == "paid" {
        // handle success
    } else {
        // handle failure
    }
    // ...
}

// Sending the message
err := dbos.Send(dbosContext, "order-123", "paid", "payment_status")
```

Learn more in the [workflow communication tutorial](../golang/tutorials/workflow-communication.md#workflow-messaging-and-notifications).

</TabItem>
<TabItem value="java" label="Java">

```java
// In the workflow
@Workflow(name = "orderWorkflow")
public void orderWorkflow(Order order) {
    // ... start order processing ...
    String paymentStatus = (String) DBOS.recv("payment_status", Duration.ofHours(1));
    if (paymentStatus != null && paymentStatus.equals("paid")) {
        // handle success
    } else {
        // handle failure
    }
}

// Sending the message
DBOS.send("order-123", "paid", "payment_status");
```

Learn more in the [workflow communication tutorial](../java/tutorials/workflow-communication.md#workflow-messaging-and-notifications).

</TabItem>
</Tabs>

## Queries &rarr; Events

Temporal queries let external code read workflow state synchronously. The equivalent in DBOS is **events**, using `set_event()` and `get_event()`.

**Temporal:**
```python
@workflow.defn
class OrderWorkflow:
    def __init__(self):
        self.progress = 0

    @workflow.query
    def get_progress(self) -> int:
        return self.progress

    @workflow.run
    async def run(self, order: Order):
        self.progress = 25
        await workflow.execute_activity(validate_order, order, ...)
        self.progress = 50
        # ...

# Querying workflow state
handle = client.get_workflow_handle("order-123")
progress = await handle.query(OrderWorkflow.get_progress)
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
@DBOS.workflow()
def order_workflow(order: Order):
    DBOS.set_event("progress", 25)
    validate_order(order)
    DBOS.set_event("progress", 50)
    # ...

# Reading workflow state
progress = DBOS.get_event("order-123", "progress")
```

Learn more in the [workflow communication tutorial](../python/tutorials/workflow-communication.md#workflow-events).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
async function orderWorkflow(order: Order) {
    await DBOS.setEvent("progress", 25);
    await validateOrder(order);
    await DBOS.setEvent("progress", 50);
    // ...
}
const orderWorkflowFn = DBOS.registerWorkflow(orderWorkflow);

// Reading workflow state
const progress = await DBOS.getEvent<number>("order-123", "progress");
```

Learn more in the [workflow communication tutorial](../typescript/tutorials/workflow-communication.md#workflow-events).

</TabItem>
<TabItem value="go" label="Go">

```go
func OrderWorkflow(ctx dbos.DBOSContext, order Order) (string, error) {
    dbos.SetEvent(ctx, "progress", 25)
    // ... validate order ...
    dbos.SetEvent(ctx, "progress", 50)
    // ...
}

// Reading workflow state
progress, err := dbos.GetEvent[int](dbosContext, "order-123", "progress", 30*time.Second)
```

Learn more in the [workflow communication tutorial](../golang/tutorials/workflow-communication.md#workflow-events).

</TabItem>
<TabItem value="java" label="Java">

```java
@Workflow(name = "orderWorkflow")
public void orderWorkflow(Order order) {
    DBOS.setEvent("progress", 25);
    // ... validate order ...
    DBOS.setEvent("progress", 50);
    // ...
}

// Reading workflow state
int progress = (int) DBOS.getEvent("order-123", "progress", Duration.ofSeconds(30));
```

Learn more in the [workflow communication tutorial](../java/tutorials/workflow-communication.md#workflow-events).

</TabItem>
</Tabs>

Events are persisted to the database, so they remain available even after the workflow completes.

## Task Queues &rarr; Queues

Temporal task queues control which workers execute which workflows. DBOS queues serve a similar purpose but also provide built-in concurrency control and rate limiting.

**Temporal:**
```python
# Worker listens to a task queue
worker = Worker(
    client,
    task_queue="order-processing",
    workflows=[OrderWorkflow],
    activities=[validate_order, process_payment],
)
await worker.run()

# Start workflow on a specific queue
handle = await client.start_workflow(
    OrderWorkflow.run, order, id="order-123", task_queue="order-processing"
)
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
# Define a queue with concurrency limits
order_queue = Queue("order-processing", concurrency=10)

# Enqueue a workflow
handle = order_queue.enqueue(order_workflow, order)
result = handle.get_result()
```

Learn more in the [queues tutorial](../python/tutorials/queue-tutorial.md).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
// Define a queue with concurrency limits
const orderQueue = new WorkflowQueue("order-processing", { concurrency: 10 });

// Enqueue a workflow
const handle = await DBOS.startWorkflow(orderWorkflowFn, { queueName: orderQueue.name })(order);
const result = await handle.getResult();
```

Learn more in the [queues tutorial](../typescript/tutorials/queue-tutorial.md).

</TabItem>
<TabItem value="go" label="Go">

```go
// Define a queue with concurrency limits
queue := dbos.NewWorkflowQueue(dbosContext, "order-processing", dbos.WithGlobalConcurrency(10))

// Enqueue a workflow
handle, err := dbos.RunWorkflow(dbosContext, OrderWorkflow, order, dbos.WithQueue(queue.Name))
result, err := handle.GetResult()
```

Learn more in the [queues tutorial](../golang/tutorials/queue-tutorial.md).

</TabItem>
<TabItem value="java" label="Java">

```java
// Define a queue with concurrency limits
Queue orderQueue = new Queue("order-processing").withConcurrency(10);
DBOS.registerQueue(orderQueue);

// Enqueue a workflow
WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
    () -> proxy.orderWorkflow(order),
    new StartWorkflowOptions().withQueue(orderQueue)
);
String result = handle.getResult();
```

Learn more in the [queues tutorial](../java/tutorials/queue-tutorial.md).

</TabItem>
</Tabs>

DBOS queues provide features that Temporal task queues don't have out of the box:
- **Global concurrency limits**: Limit total concurrent executions across all workers.
- **Per-worker concurrency**: Limit concurrent executions per process.
- **Rate limiting**: Limit executions per time period.
- **Partitioned queues**: Create per-tenant sub-queues with independent concurrency limits.
- **Priority**: Process higher-priority workflows first.
- **Deduplication**: Prevent duplicate workflows in the queue.

## Scheduled Workflows

Both DBOS and Temporal let you run workflows on a cron schedule:

**Temporal:**
```python
await client.create_schedule(
    "daily-report",
    Schedule(
        action=ScheduleActionStartWorkflow(
            DailyReportWorkflow.run,
            id="daily-report",
            task_queue="reports",
        ),
        spec=ScheduleSpec(cron_expressions=["0 9 * * *"]),
    ),
)
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
DBOS.create_schedule("daily-report", daily_report_workflow, schedule="0 9 * * *")
```

DBOS schedules also support pausing, resuming, backfilling missed runs, and triggering immediate execution.
Learn more in the [scheduling tutorial](../python/tutorials/scheduled-workflows.md).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
await DBOS.createSchedule({
    scheduleName: "daily-report",
    workflowFn: dailyReportWorkflow,
    schedule: "0 9 * * *",
});
```

DBOS schedules also support pausing, resuming, backfilling missed runs, and triggering immediate execution.
Learn more in the [scheduling tutorial](../typescript/tutorials/scheduled-workflows.md).

</TabItem>
</Tabs>

## Child Workflows

Both Temporal and DBOS support calling a child workflow from within another workflow.

**Temporal:**
```python
@workflow.defn
class ParentWorkflow:
    @workflow.run
    async def run(self):
        result = await workflow.execute_child_workflow(
            ChildWorkflow.run, args=[data]
        )
```

**DBOS:**

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
@DBOS.workflow()
def parent_workflow():
    # Call directly (runs inline)
    result = child_workflow(data)

    # Or start in background
    handle = DBOS.start_workflow(child_workflow, data)
    result = handle.get_result()
```

Learn more in the [workflows tutorial](../python/tutorials/workflow-tutorial.md#starting-workflows-in-the-background).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
async function parentWorkflow() {
    // Call directly (runs inline)
    const result = await childWorkflowFn(data);

    // Or start in background
    const handle = await DBOS.startWorkflow(childWorkflowFn)(data);
    const result2 = await handle.getResult();
}
const parentWorkflowFn = DBOS.registerWorkflow(parentWorkflow);
```

Learn more in the [workflows tutorial](../typescript/tutorials/workflow-tutorial.md#starting-workflows-in-the-background).

</TabItem>
<TabItem value="go" label="Go">

```go
func ParentWorkflow(ctx dbos.DBOSContext, input string) (string, error) {
    // Start child workflow in background
    handle, err := dbos.RunWorkflow(ctx, ChildWorkflow, data)
    if err != nil {
        return "", err
    }
    result, err := handle.GetResult()
    return result, err
}
```

Learn more in the [workflows tutorial](../golang/tutorials/workflow-tutorial.md#starting-workflows).

</TabItem>
<TabItem value="java" label="Java">

```java
@Workflow(name = "parentWorkflow")
public String parentWorkflow() {
    // Call directly (runs inline)
    String result = proxy.childWorkflow(data);

    // Or start in background
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
        () -> proxy.childWorkflow(data),
        new StartWorkflowOptions()
    );
    return handle.getResult();
}
```

Learn more in the [workflows tutorial](../java/tutorials/workflow-tutorial.md#starting-workflows-in-the-background).

</TabItem>
</Tabs>

## What's Different in DBOS

### No Orchestration Server

DBOS has no central server to manage, operate, or scale. Your workflows run in your application process and checkpoint directly to Postgres. This eliminates a major source of operational complexity and latency.

### Fork

DBOS can [fork a workflow](../python/tutorials/workflow-management.md) from a specific step, re-executing it from that point. This is powerful for recovering from failures&mdash;for example, restarting thousands of failed billing workflows from the payment step after an outage is resolved.

### Workflow Streaming

DBOS provides [streaming](../python/tutorials/workflow-communication.md#workflow-streaming), an append-only stream that workflows can write to and clients can read from in real time. This is useful for streaming LLM outputs, progress updates, or real-time data from long-running workflows.

### SQL-Backed Introspection

Because all workflow state is stored in Postgres, you can query it with SQL. DBOS also provides programmatic APIs to [list, search, and manage workflows](../python/tutorials/workflow-management.md) by status, name, time, queue, or custom properties.

### Queue Flow Control

Using DBOS queues, you can manage how many workflows can execute concurrently (globally, per-worker, and per-tenant) as well as which workers can execute which workflows.
Temporal does not have comparable queueing or flow control abstractions, making it harder to control when and where workflows execute.

## Automating Temporal -> DBOS Migration

With coding agents, you can largely automate a migration from Temporal to DBOS.
To do this, we recommend using DBOS skills and prompts to give your coding agent access to the latest information on DBOS:

- [AI-assisted development in Python](../python/prompting.md)
- [AI-assisted development in TypeScript](../typescript/prompting.md)
- [AI-assisted development in Go](../golang/prompting.md)
- [AI-assisted development in Java](../java/prompting.md)
