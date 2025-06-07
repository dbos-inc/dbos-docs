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
