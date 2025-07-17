---
sidebar_position: 4
title: Queues & Concurrency
toc_max_heading_level: 3
---

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

To create a queue, specify its name:

```python
from dbos import Queue

queue = Queue("example_queue")
```

You can then enqueue any DBOS workflow or step.
Enqueuing a function submits it for execution and returns a [handle](../reference/workflow_handles.md) to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```python
queue = Queue("example_queue")

@DBOS.workflow()
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

@DBOS.workflow()
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

You can specify the _worker concurrency_ of a queue, the maximum number of workflows from that queue that may run concurrently on a single process.
This is useful for workflows that consume significant resources (for example, a significant amount of memory) to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so at most 5 functions submitted to it may run concurrently on each process:

```python
from dbos import Queue

queue = Queue("example_queue", worker_concurrency=5)
```

You can also specify a global concurrency limit for a queue.
This limits the maximum number of functions from the queue that may run concurrently across all DBOS processes.
For example, this queue has a maximum global concurrency of 10:

:::warning
For most use-cases, a worker concurrency limit is more useful than a global concurrency limit.

Take care when specifying a global concurrency limit as any `PENDING` workflow on the queue, even a `PENDING` workflow from a previous application version, counts towards the limit.
:::

```python
from dbos import Queue

queue = Queue("example_queue", concurrency=10)
```

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


## Setting Timeouts

You can set a timeout for an enqueued workflow with [`SetWorkflowTimeout`](../reference/contexts.md#setworkflowtimeout).
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: a workflow's timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```python
@DBOS.workflow()
def example_workflow():
    ...

queue = Queue("example-queue")

# If the workflow does not complete within 10 seconds after being dequeued, it times out and is cancelled
with SetWorkflowTimeout(10):
    queue.enqueue(example_workflow)
```

## Deduplication

You can set a deduplication ID for an enqueued workflow with [`SetEnqueueOptions`](../reference/contexts.md#setenqueueoptions).
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDeduplicatedError` exception.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

Example syntax:

```python
with SetEnqueueOptions(deduplication_id="my_dedup_id"):
    try:
        handle = queue.enqueue(example_workflow, ...)
    except DBOSQueueDeduplicatedError as e:
        # Handle deduplication error
```

## Priority

You can set a priority for an enqueued workflow with [`SetEnqueueOptions`](../reference/contexts.md#setenqueueoptions).
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
If using priority, you must set `priority_enabled=True` on your queue.

:::tip
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
:::

Example syntax:

```python
queue = Queue("priority_queue", priority_enabled=True)

with SetEnqueueOptions(priority=10):
    # All workflows are enqueued with priority set to 10
    # They will be dequeued in FIFO order
    for task in tasks:
        queue.enqueue(task_workflow, task)

with SetEnqueueOptions(priority=1):
    queue.enqueue(first_workflow)

# first_workflow (priority=1) will be dequeued before all task_workflows (priority=10)
```

## Enqueueing with DBOS Client

You can use the [DBOS Client](../reference/client.md) to enqueue workflows from outside your DBOS application by connecting to Postgres directly.

Since the DBOS Client is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

Example: 

```python
from dbos import DBOSClient, EnqueueOptions

client = DBOSClient(os.environ["DBOS_DATABASE_URL"])

options: EnqueueOptions = {
  "queue_name": "process_task",
  "workflow_name": "example_queue",
}
handle = client.enqueue(options, task)
result = handle.get_result()
```