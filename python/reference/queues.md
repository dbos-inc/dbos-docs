# Queues

> Queues let you submit functions for durable execution without starting them immediately.
> They are useful for controlling the number of functions run in parallel, or the rate at which functions are started.

Queues are persisted to the system database.
Register a queue with [`DBOS.register_queue`](./contexts.md#register_queue) and enqueue workflows on it with [`DBOS.enqueue_workflow`](./contexts.md#enqueue_workflow) or [`Queue.enqueue`](#enqueue).

```python
@DBOS.workflow()
def send_email(to: str) -> None:
    ...

DBOS.register_queue("email", global_concurrency=10, limiter={"limit": 100, "period": 60})
handle = DBOS.enqueue_workflow("email", send_email, "alice@example.com")
```

### class dbos.Queue

A `Queue` is returned by [`DBOS.register_queue`](./contexts.md#register_queue) and [`DBOS.retrieve_queue`](./contexts.md#retrieve_queue).
You can inspect and modify the queue's properties and [`enqueue`](#enqueue)/[`enqueue_async`](#enqueue_async) workflows.

```python
class QueueRateLimit(TypedDict):
    limit: int
    period: float  # In seconds
```

**Properties:**
- `name`: The name of the queue.
- `global_concurrency`: The maximum number of functions from this queue that may run concurrently across all DBOS processes. If `None`, any number of functions may run concurrently.
- `worker_concurrency`: The maximum number of functions from this queue that may run concurrently on a single DBOS process. DBOS uses `executor_id` to distinguish processes&mdash;this is set automatically by Conductor and Cloud, but if those are not used it must be set to a unique value for each process through [configuration](./configuration.md).
- `limiter`: A limit on the maximum number of functions which may be started in a given period.
- `partition_concurrency`: The maximum number of functions from any one [partition](../tutorials/queue-tutorial.md#partitioning-queues) of this queue that may run concurrently across all DBOS processes.
- `partition_worker_concurrency`: The maximum number of functions from any one partition of this queue that may run concurrently on a single DBOS process.
- `partition_limiter`: A limit on the maximum number of functions which may be started from any one partition in a given period.
- `polling_interval_sec`: The interval at which DBOS polls the database for new workflows on this queue.
- `application_name`: The application that owns this queue and dequeues workflows from it, or `None` if the queue is owned by no application. Unlike the other properties, ownership cannot be reconfigured.

A queue is [partitioned](../tutorials/queue-tutorial.md#partitioning-queues) if any of its `partition_*` limits is set.

Reading any property returns the latest value from the database, so changes made by other processes are reflected.

In `async` code, use the [async getters](#async-property-accessors) (`get_global_concurrency_async`, `get_worker_concurrency_async`, etc.) instead of property access. Property access performs a synchronous database round-trip that blocks the event loop; reading a property from a running event loop logs a warning.

### enqueue

```python
queue.enqueue(
    func: Callable[P, R],
    *args: P.args,
    **kwargs: P.kwargs,
) -> WorkflowHandle[R]
```

Enqueue a function for processing and return a [handle](./workflow_handles.md#workflowhandle) to it.
You can enqueue any DBOS-annotated function.
The `enqueue` method durably enqueues your function; after it returns your function is guaranteed to eventually execute even if your app is interrupted.

[`DBOS.enqueue_workflow`](./contexts.md#enqueue_workflow) is a convenience wrapper that enqueues by queue name.

**Example syntax:**

```python
from dbos import DBOS

queue = DBOS.register_queue("example_queue")

@DBOS.step()
def process_task(task):
  ...

@DBOS.workflow()
def process_tasks(tasks):
  task_handles = []
  # Enqueue each task so all tasks are processed concurrently.
  for task in tasks:
    handle = queue.enqueue(process_task, task)
    task_handles.append(handle)
  # Wait for each task to complete and retrieve its result.
  # Return the results of all tasks.
  return [handle.get_result() for handle in task_handles]
```

### enqueue_async

```python
queue.enqueue_async(
    func: Callable[P, Coroutine[Any, Any, R]],
    *args: P.args,
    **kwargs: P.kwargs,
) -> WorkflowHandle[R]
```

Asynchronously enqueue an async function for processing and return an [async handle](./workflow_handles.md#workflowhandleasync) to it.
You can enqueue any DBOS-annotated async function.
The `enqueue_async` method durably enqueues your function; after it returns your function is guaranteed to eventually execute even if your app is interrupted.
The enqueued function is launched into a different event loop as its caller.

**Example syntax:**

```python
from dbos import DBOS

queue = DBOS.register_queue("example_queue")

@DBOS.step()
async def process_task_async(task):
  ...

@DBOS.workflow()
async def process_tasks(tasks):
  task_handles = []
  # Enqueue each task so all tasks are processed concurrently.
  for task in tasks:
    handle = await queue.enqueue_async(process_task_async, task)
    task_handles.append(handle)
  # Wait for each task to complete and retrieve its result.
  # Return the results of all tasks.
  return [await handle.get_result() for handle in task_handles]
```

### Async Property Accessors

In `async` code, use these coroutine getters instead of reading the corresponding properties. Each one fetches the latest value from the database without blocking the event loop. Reading the synchronous property from a running event loop instead logs a warning.

```python
queue.get_global_concurrency_async() -> Coroutine[Any, Any, Optional[int]]
queue.get_worker_concurrency_async() -> Coroutine[Any, Any, Optional[int]]
queue.get_limiter_async() -> Coroutine[Any, Any, Optional[QueueRateLimit]]
queue.get_partition_concurrency_async() -> Coroutine[Any, Any, Optional[int]]
queue.get_partition_worker_concurrency_async() -> Coroutine[Any, Any, Optional[int]]
queue.get_partition_limiter_async() -> Coroutine[Any, Any, Optional[QueueRateLimit]]
queue.get_polling_interval_sec_async() -> Coroutine[Any, Any, float]
```

### Reconfiguring Queues

You can reconfigure a queue at runtime by calling its `set_*` methods.
Each setter writes the new value to the system database; workers pick up the new configuration on their next polling iteration without needing to restart.
In `async` code, use the [`set_*_async`](#async-reconfiguration) variants instead so the event loop is not blocked on the database write. Calling a synchronous setter from a running event loop logs a warning.

:::warning
If your application calls [`DBOS.register_queue`](./contexts.md#register_queue) on startup, the next process to start can overwrite settings you applied at runtime via `set_*` methods.
Either update the `register_queue` call to match the new configuration, or pass `on_conflict="never_update"` to preserve the runtime changes.
:::

#### set_global_concurrency

```python
queue.set_global_concurrency(value: Optional[int]) -> None
```

Update the queue's global concurrency limit.
Must be greater than or equal to the queue's `worker_concurrency`, `partition_concurrency`, and `partition_worker_concurrency`.
Pass `None` to remove the limit.

#### set_worker_concurrency

```python
queue.set_worker_concurrency(value: Optional[int]) -> None
```

Update the queue's per-worker concurrency limit.
Must be less than or equal to the queue's `global_concurrency`.
Pass `None` to remove the limit.

#### set_limiter

```python
queue.set_limiter(value: Optional[QueueRateLimit]) -> None
```

Update the queue's [rate limit](../tutorials/queue-tutorial.md#rate-limiting).
Pass `None` to remove the limit.

#### set_partition_concurrency

```python
queue.set_partition_concurrency(value: Optional[int]) -> None
```

Update the queue's per-partition concurrency limit.
Must be at least 1 and less than or equal to the queue's `global_concurrency`.
Pass `None` to remove the limit.

#### set_partition_worker_concurrency

```python
queue.set_partition_worker_concurrency(value: Optional[int]) -> None
```

Update the queue's per-partition, per-worker concurrency limit.
Must be at least 1 and less than or equal to the queue's `partition_concurrency`, `worker_concurrency`, and `global_concurrency`.
Pass `None` to remove the limit.

#### set_partition_limiter

```python
queue.set_partition_limiter(value: Optional[QueueRateLimit]) -> None
```

Update the [rate limit](../tutorials/queue-tutorial.md#rate-limiting) applied to each partition separately.
Pass `None` to remove the limit.

:::info
Setting any `partition_*` limit makes the queue [partitioned](../tutorials/queue-tutorial.md#partitioning-queues); clearing all of them makes it unpartitioned again.
Take care when partitioning a queue at runtime: workflows already enqueued on it have no partition key and will not be dequeued until the queue is unpartitioned.
:::

#### set_polling_interval_sec

```python
queue.set_polling_interval_sec(value: float) -> None
```

Update the queue's polling interval. Must be positive.

#### Async Reconfiguration

Each setter has an async counterpart with the same parameters and validation behavior. Use these from `async` code to write to the database without blocking the event loop.

```python
queue.set_global_concurrency_async(value: Optional[int]) -> Coroutine[Any, Any, None]
queue.set_worker_concurrency_async(value: Optional[int]) -> Coroutine[Any, Any, None]
queue.set_limiter_async(value: Optional[QueueRateLimit]) -> Coroutine[Any, Any, None]
queue.set_partition_concurrency_async(value: Optional[int]) -> Coroutine[Any, Any, None]
queue.set_partition_worker_concurrency_async(value: Optional[int]) -> Coroutine[Any, Any, None]
queue.set_partition_limiter_async(value: Optional[QueueRateLimit]) -> Coroutine[Any, Any, None]
queue.set_polling_interval_sec_async(value: float) -> Coroutine[Any, Any, None]
```

### SetEnqueueOptions

```python
SetEnqueueOptions(
    *,
    deduplication_id: Optional[str] = None,
    duplication_policy: Optional[DuplicationPolicy] = None,
    priority: Optional[int] = None,
    delay_seconds: Optional[float] = None,
    app_version: Optional[str] = None,
    queue_partition_key: Optional[str] = None,
)
```

Set options for enclosed workflow enqueue operations.
These options are **not propagated** to child workflows.

**Parameters:**

- `deduplication_id`: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDeduplicatedError` exception. Defaults to `None`.
- `duplication_policy`: How to handle a collision with another workflow that has the same `deduplication_id` on the same queue. Defaults to `"reject"`.
  - `"reject"`: raise `DBOSQueueDeduplicatedError`.
  - `"return-existing"`: return a handle to the existing workflow instead of raising. Requires a queue and a `deduplication_id`. Arguments passed by the colliding caller are discarded and the returned handle resolves with the original workflow's result. See [Singleton Workflows](../tutorials/queue-tutorial.md#singleton-workflows).
- `priority`: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Defaults to `None`. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
- `delay_seconds`: Delay the workflow by this many seconds before it becomes eligible for execution. The workflow is initially placed in `DELAYED` status and transitions to `ENQUEUED` after the delay expires. Defaults to `None` (no delay).
- `app_version`: The application version of the workflow to enqueue. The workflow may only be dequeued by processes running that version. Defaults to the current application version.
- `queue_partition_key`: The queue partition in which to enqueue this workflow. Use if and only if the queue is [partitioned](../tutorials/queue-tutorial.md#partitioning-queues) (registered with at least one `partition_*` limit). A partitioned queue applies its `partition_*` limits to each partition separately, while its `global_concurrency`, `worker_concurrency`, and `limiter` still apply across all partitions.

**Deduplication Example**

```python
from dbos import DBOS, SetEnqueueOptions
from dbos import error as dboserror

DBOS.register_queue("example_queue")

with SetEnqueueOptions(deduplication_id="my_dedup_id"):
    try:
        handle = DBOS.enqueue_workflow("example_queue", example_workflow, ...)
    except dboserror.DBOSQueueDeduplicatedError as e:
        # Handle deduplication error
```

**Singleton Workflow Example**

```python
from dbos import DBOS, SetEnqueueOptions

DBOS.register_queue("example_queue")

# Only one workflow with deduplication ID "singleton" can be active on this queue
# at a time. Subsequent callers attach to it and receive its result.
with SetEnqueueOptions(
    deduplication_id="singleton", duplication_policy="return-existing"
):
    handle = DBOS.enqueue_workflow("example_queue", example_workflow, ...)
result = handle.get_result()
```

**Priority Example**

```python
DBOS.register_queue("priority_queue")

with SetEnqueueOptions(priority=10):
    # All workflows are enqueued with priority set to 10
    # They will be dequeued in FIFO order
    for task in tasks:
        DBOS.enqueue_workflow("priority_queue", task_workflow, task)

# first_workflow (priority=1) will be dequeued before all task_workflows (priority=10)
with SetEnqueueOptions(priority=1):
    DBOS.enqueue_workflow("priority_queue", first_workflow)
```

**Partitioned Queue Example**

```python
DBOS.register_queue("partitioned_queue", partition_concurrency=1)

@DBOS.workflow()
def process_task(task: Task):
  ...

def on_user_task_submission(user_id: str, task: Task):
    # Partition the task queue by user ID. As the queue has a
    # per-partition concurrency of 1, this means that at most one
    # task can run at once per user (but tasks from different
    # users can run concurrently).
    with SetEnqueueOptions(queue_partition_key=user_id):
        DBOS.enqueue_workflow("partitioned_queue", process_task, task)
```

## Legacy: In-Memory Queues

:::warning Deprecated
The `Queue(...)` constructor registers a queue only in process memory and is **deprecated**.
Prefer [`DBOS.register_queue`](./contexts.md#register_queue), which persists the queue to the system database and makes it observable through the dashboard and [`DBOSClient`](./client.md).
:::

```python
Queue(
    name: str,
    *,
    global_concurrency: Optional[int] = None,
    worker_concurrency: Optional[int] = None,
    limiter: Optional[QueueRateLimit] = None,
    partition_concurrency: Optional[int] = None,
    partition_worker_concurrency: Optional[int] = None,
    partition_limiter: Optional[QueueRateLimit] = None,
    polling_interval_sec: float = 1.0,
)
```

Construct an in-memory queue at module load time.
The constructor takes the same parameters as [`DBOS.register_queue`](./contexts.md#register_queue) (other than `on_conflict`).
In-memory queues do not support runtime reconfiguration via the `set_*` methods.
