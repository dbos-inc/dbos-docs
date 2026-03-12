---
sidebar_position: 30
title: Migrating From Temporal
hide_table_of_contents: false
---

This guide explains how each major Temporal feature translates to DBOS.
For a high-level comparison of DBOS and Temporal's architectures, see [Comparing DBOS and Temporal](./comparing-temporal.md).

## Workflows

Both Temporal and DBOS are built around durably executed workflows, which are implemented as regular functions:

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
```python
@DBOS.workflow()
def order_workflow(order: Order) -> str:
    result = validate_order(order)
    confirmation = process_payment(result)
    return confirmation
```

### Starting Workflows

In Temporal, you start workflows through a client connected to the Temporal server. In DBOS, you can call `DBOS.start_workflow()` directly.

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
```python
with SetWorkflowID("order-123"):
    handle = DBOS.start_workflow(order_workflow, order)
result = handle.get_result()
```

### Workflow IDs and Idempotency

Both systems support workflow IDs for idempotency. In Temporal, you pass the ID when starting a workflow. In DBOS, you use the `SetWorkflowID` context manager:

```python
with SetWorkflowID("payment-idempotency-key"):
    order_workflow(order)
```

If a workflow with that ID has already run, it returns the previous result instead of re-executing.

### Determinism

Both DBOS and Temporal require workflows to be deterministic. Non-deterministic operations (API calls, random numbers, current time) must happen inside activities/steps, not directly in the workflow function.

### Durable Timers

Temporal's `workflow.sleep()` maps directly to `DBOS.sleep()`. Both are durable&mdash;they persist across restarts.

**Temporal:**
```python
await workflow.sleep(timedelta(hours=24))
```

**DBOS:**
```python
DBOS.sleep(86400)  # seconds
```

## Activities → Steps

Temporal activities map to DBOS steps. Both are where side effects and non-deterministic operations happen.

**Temporal:**
```python
@activity.defn
async def send_email(to: str, body: str) -> bool:
    response = requests.post(EMAIL_API, json={"to": to, "body": body})
    return response.ok
```

**DBOS:**
```python
@DBOS.step()
def send_email(to: str, body: str) -> bool:
    response = requests.post(EMAIL_API, json={"to": to, "body": body})
    return response.ok
```

The key architectural difference is how they're called. In Temporal, activities are dispatched to workers through the Temporal server. In DBOS, steps are called as regular Python functions&mdash;DBOS checkpoints their results to Postgres automatically.

### Retries

Both systems support configurable retries with exponential backoff. The configuration is similar but uses different syntax.

**Temporal** (configured at the call site):
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

**DBOS** (configured on the step decorator):
```python
@DBOS.step(retries_allowed=True, max_attempts=5, interval_seconds=1.0, backoff_rate=2.0)
def send_email(to: str, body: str) -> bool:
    response = requests.post(EMAIL_API, json={"to": to, "body": body})
    return response.ok
```

### Heartbeats

Temporal activities support heartbeats for long-running operations so the server knows the activity is still alive. DBOS does not require heartbeats because there is no central orchestrator monitoring activity execution&mdash;steps run directly in your application process.

### Database Operations

DBOS provides a special type of step called a [transaction](../python/tutorials/step-tutorial.md#transactions) (`@DBOS.transaction()`) that executes database operations in a single database transaction, co-committed with the DBOS checkpoint. This provides exactly-once semantics for database writes, which is stronger than what Temporal offers for database operations.

```python
@DBOS.transaction()
def update_order_status(order_id: str, status: str) -> None:
    DBOS.sql_session.execute(
        text("UPDATE orders SET status = :status WHERE id = :id"),
        {"status": status, "id": order_id}
    )
```

## Signals → Messages

Temporal signals let you send data to a running workflow. The equivalent in DBOS is **messages**, using `DBOS.send()` and `DBOS.recv()`.

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

Key differences:
- No need to define signal handler methods. `DBOS.recv()` waits inline for a message on a given topic.
- Messages are queued per-topic, so multiple messages can be sent before the workflow reads them.
- Messages sent from workflows are delivered exactly-once.

## Queries → Events

Temporal queries let external code read workflow state synchronously. The equivalent in DBOS is **events**, using `DBOS.set_event()` and `DBOS.get_event()`.

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

Events are persisted to the database, so they remain available even after the workflow completes.

## Task Queues → Queues

Temporal task queues control which workers execute which workflows. DBOS [queues](../python/tutorials/queue-tutorial.md) serve a similar purpose but also provide built-in concurrency control and rate limiting.

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
```python
# Define a queue with concurrency limits
order_queue = Queue("order-processing", concurrency=10)

# Enqueue a workflow
handle = order_queue.enqueue(order_workflow, order)
result = handle.get_result()
```

DBOS queues provide features that Temporal task queues don't have out of the box:
- **Global concurrency limits**: `concurrency=10` limits total concurrent executions across all workers.
- **Per-worker concurrency**: `worker_concurrency=5` limits concurrent executions per process.
- **Rate limiting**: `limiter={"limit": 100, "period": 60}` limits executions per time period.
- **Partitioned queues**: Create per-tenant sub-queues with independent concurrency limits.
- **Priority**: Process higher-priority workflows first.
- **Deduplication**: Prevent duplicate workflows in the queue.

## Scheduled Workflows

In Temporal, you use schedules to run workflows on a cron-like schedule. In DBOS, you use `DBOS.create_schedule()`.

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
```python
DBOS.create_schedule("daily-report", daily_report_workflow, schedule="0 9 * * *")
```

DBOS schedules also support pausing, resuming, backfilling missed runs, and triggering immediate execution.

## Child Workflows

In Temporal, you can start child workflows from within a parent workflow. In DBOS, you simply call another workflow function directly or start it in the background with `DBOS.start_workflow()`.

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
```python
@DBOS.workflow()
def parent_workflow():
    # Call directly (runs inline)
    result = child_workflow(data)

    # Or start in background
    handle = DBOS.start_workflow(child_workflow, data)
    result = handle.get_result()
```

## What's Different in DBOS

### No Orchestration Server

DBOS has no central server to manage, operate, or scale. Your workflows run in your application process and checkpoint directly to Postgres. This eliminates a major source of operational complexity and latency.

### Fork

DBOS can [fork a workflow](../python/tutorials/workflow-management.md) from a specific step, re-executing it from that point. This is powerful for recovering from failures&mdash;for example, restarting thousands of failed billing workflows from the payment step after an outage is resolved.

### Workflow Streaming

DBOS provides [streaming](../python/tutorials/workflow-communication.md#workflow-streaming), an append-only stream that workflows can write to and clients can read from in real time. This is useful for streaming LLM outputs, progress updates, or real-time data from long-running workflows.

### SQL-Backed Introspection

Because all workflow state is stored in Postgres, you can query it with SQL. DBOS also provides programmatic APIs to [list, search, and manage workflows](../python/tutorials/workflow-management.md) by status, name, time, queue, or custom properties.
