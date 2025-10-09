---
sidebar_position: 4
title: Queues
---

Queues allow you to ensure that functions will be run, without starting them immediately.
Queues are useful for controlling the number of functions run in parallel, or the rate at which functions are started.

### class dbos.Queue

```python
Queue(
    name: str = None,
    concurrency: Optional[int] = None,
    limiter: Optional[Limiter] = None
    *,
    worker_concurrency: Optional[int] = None,
    priority_enabled: bool = False,
    partition_queue: bool = False,
)

class Limiter(TypedDict):
    limit: int
    period: float # In seconds
```

**Parameters:**
- `name`: The name of the queue. Must be unique among all queues in the application.
- `concurrency`: The maximum number of functions from this queue that may run concurrently.
This concurrency limit is global across all DBOS processes using this queue.
If not provided, any number of functions may run concurrently.
- `limiter`: A limit on the maximum number of functions which may be started in a given period.
- `worker_concurrency`: The maximum number of functions from this queue that may run concurrently on a given DBOS process. Must be less than or equal to `concurrency`.
- `priority_enabled`: Enable setting priority for workflows on this queue.
- `partition_queue`: Enable partitioning for this queue.

**Example syntax:**

This queue may run no more than 10 functions concurrently and may not start more than 50 functions per 30 seconds:

```python
queue = Queue("example_queue", concurrency=10, limiter={"limit": 50, "period": 30})
```


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

**Example syntax:**

```python
from dbos import DBOS, Queue

queue = Queue("example_queue")

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
from dbos import DBOS, Queue

queue = Queue("example_queue")

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


### SetEnqueueOptions

```python
SetEnqueueOptions(
    *,
    deduplication_id: Optional[str] = None,
    priority: Optional[int] = None,
    app_version: Optional[str] = None,
    queue_partition_key: Optional[str] = None,
)
```

Set options for enclosed workflow enqueue operations.
These options are **not propagated** to child workflows.

**Parameters:**

- `deduplication_id`: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDeduplicatedError` exception. Defaults to `None`.
- `priority`: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Defaults to `None`. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
- `app_version`: The application version of the workflow to enqueue. The workflow may only be dequeued by processes running that version. Defaults to the current application version.
- `queue_partition_key`: The queue partition in which to enqueue this workflow. Use if and only if the queue is partitioned (`partition_queue=True`). In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.


**Deduplication Example**

```python
queue = Queue("example_queue")

with SetEnqueueOptions(deduplication_id="my_dedup_id"):
    try:
        handle = queue.enqueue(example_workflow, ...)
    except DBOSQueueDeduplicatedError as e:
        # Handle deduplication error
```

**Priority Example**

```python
queue = Queue("example_queue", priority_enabled=True)

with SetEnqueueOptions(priority=10):
    # All workflows are enqueued with priority set to 10
    # They will be dequeued in FIFO order
    for task in tasks:
        queue.enqueue(task_workflow, task)

# first_workflow (priority=1) will be dequeued before all task_workflows (priority=10)
with SetEnqueueOptions(priority=1):
    queue.enqueue(first_workflow)

```

**Partitioned Queue Example**

```python
queue = Queue("queue", partition_queue=True, concurrency=1)

@DBOS.workflow()
def process_task(task: Task):
  ...


def on_user_task_submission(user_id: str, task: Task):
    # Partition the task queue by user ID. As the queue has a
    # maximum concurrency of 1, this means that at most one
    # task can run at once per user (but tasks from different)
    # users can run concurrently.
    with SetEnqueueOptions(queue_partition_key=user_id):
        queue.enqueue(process_task, task)
```