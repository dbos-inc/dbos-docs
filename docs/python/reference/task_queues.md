---
sidebar_position: 4
title: Task Queues
---

Task queues allows you to submit tasks to run in the background with a controlled degree of parallelism.
They are useful for orchestration of parallel events.

### class dbos.Queue

```python
Queue(
    name: str = None,
    concurrency: Optional[int] = None,
)
```

**Parameters:**
- `name`: The name of the queue. Must be unique among all your queues.
- `concurrency`: The maximum number of tasks from this queue that may run concurrently.
This concurrency limit is global across all DBOS processes using this queue.


### enqueue

```python
queue.enqueue(
    func: Workflow[P, R],
    *args: P.args,
    **kwargs: P.kwargs,
) -> WorkflowHandle[R]
```

Enqueue a task for processing and return a [handle](./workflow_handles.md) to it.
The `enqueue` method resolves after the task is is durably enqueued; at this point the task is guaranteed to later execute even if the app is interrupted.

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
  for task in tasks:
    handle = queue.enqueue(process_task, task)
    task_handles.append(handle)
  return [handle.get_result() for handle in task_handles]
```