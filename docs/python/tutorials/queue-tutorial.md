---
sidebar_position: 4
title: Queues & Parallelism
---

Queues allow you to submit functions to run in the background with a controlled degree of concurrency.
They are useful for running many operations in parallel.

To create a queue, specify its name and the maximum number of operations that it may run concurrently:

```python
from dbos import Queue

queue = Queue("example_queue", concurrency=10)
```

You can then enqueue any DBOS-annotated function.
Enqueuing a function submits it for execution and returns a [handle](../reference/workflow_handles.md) to it.
Enqueued tasks are executed in first-in, first-out (FIFO) order.

```python
queue = Queue("example_queue")

@DBOS.step()
def process_task(task):
  ...

task = ...
handle = queue.enqueue(process_task, task)
```

### Queue Example

Here's an example of a workflow using a queue to process many tasks in parallel:

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

### Managing Concurrency

You can specify the _concurrency_ of a queue, the maximum number of operations from this queue that may run concurrently.
Concurrency limits are global across all DBOS processes using this queue.
If no limit is provided, any number of operations may run concurrently.
For example, this queue has a maximum concurrency of 10, so at most 10 operations submitted to it may run at once:

```python
from dbos import Queue

queue = Queue("example_queue", concurrency=10)
```

You may want to specify a maximum concurrency if operations in your queue submit work to an external process or call a rate-limited API.
The concurrency limit guarantees that even if many operations are submitted at once, they won't overwhelm the worker process or trigger the API's rate limit.

 ### In-Order Processing

 You can use a queue with `concurrency=1` to guarantee sequential, in-order processing of events.
 Only a single event will be processed at a time.
 For example, this app processes events sequentially in the order of their arrival:

 ```python
from fastapi import FastAPI
from dbos import DBOS, Queue

app = FastAPI()
DBOS(fastapi=app)

queue = Queue("in_order_queue", concurrency=1)

@DBOS.step()
def process_event(event: str):
    ...

@app.post("/events/{event}")
def event_endpoint(event: str):
    queue.enqueue(process_event, event)
 ```