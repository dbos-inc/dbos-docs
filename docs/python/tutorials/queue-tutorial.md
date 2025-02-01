---
sidebar_position: 4
title: Queues & Parallelism
---

Queues allow you to run functions with managed concurrency.
They are useful for controlling the number of functions run in parallel, or the rate at which functions are started.

To create a queue, specify its name:

```python
from dbos import Queue

queue = Queue("example_queue")
```

You can then enqueue any DBOS workflow, step, or transaction.
Enqueuing a function submits it for execution and returns a [handle](../reference/workflow_handles.md) to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```python
queue = Queue("example_queue")

@DBOS.step()
def process_task(task):
  ...

task = ...
handle = queue.enqueue(process_task, task)
```

### Queue Example

Here's an example of a workflow using a queue to process tasks concurrently:

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

### Reliability Guarantees

Because queues use DBOS [workflows](./workflow-tutorial.md), they provide the following reliability guarantees for enqueued functions.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Enqueued functions always run to completion.  If a DBOS process crashes and is restarted at any point after a function is enqueued, it resumes the enqueued function from the last completed step.
2.  Enqueued [steps](./step-tutorial.md) (or steps called from enqueued workflows) are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed, it will never be re-executed.
3.  Enqueued [transactions](./transaction-tutorial.md) (or transactions called from enqueued workflows) commit _exactly once_.


### Managing Concurrency

You can specify the _concurrency_ of a queue, the maximum number of functions from this queue that may run concurrently, at two scopes: global and per process.
Global concurrency limits are applied across all DBOS processes using this queue.
Per process concurrency limits are applied to each DBOS process using this queue.
If no limit is provided, any number of functions may run concurrently.
For example, this queue has a maximum global concurrency of 10 and a per process maximum concurrency of 5, so at most 10 functions submitted to it may run at once, up to 5 per process:

```python
from dbos import Queue

queue = Queue("example_queue", concurrency=10, worker_concurrency=5)
```

You may want to specify a maximum concurrency if functions in your queue submit work to an external process with limited resources.
The concurrency limit guarantees that even if many functions are submitted at once, they won't overwhelm the process.

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 50 with a period of 30 seconds, so it may not start more than 50 functions in 30 seconds:

```python
queue = Queue("example_queue", limiter={"limit": 50, "period": 30})
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

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
