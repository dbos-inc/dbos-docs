---
sidebar_position: 4
title: Queues
---

Queues allow you to submit functions to run in the background with a controlled degree of concurrency.
They are useful for running many operations in parallel.

### class dbos.Queue

```python
Queue(
    name: str = None,
    concurrency: Optional[int] = None,
)
```

**Parameters:**
- `name`: The name of the queue. Must be unique among all your queues.
- `concurrency`: The maximum number of operations from this queue that may run concurrently.
This concurrency limit is global across all DBOS processes using this queue.
If not provided, any number of operations may run concurrently.


### enqueue

```python
queue.enqueue(
    func: Callable[P, R],
    *args: P.args,
    **kwargs: P.kwargs,
) -> WorkflowHandle[R]
```

Enqueue a function for processing and return a [handle](./workflow_handles.md) to it.
You can enqueue any DBOS-annotated function.
The `enqueue` method durably enqueues your function; after it returns your function is guaranteed to later execute even if your app is interrupted.

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