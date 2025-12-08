---
sidebar_position: 40
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

### Enqueueing from Another Application

Often, you want to enqueue a workflow from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

You can use the [DBOS Client](../reference/client.md) to enqueue workflows from outside your DBOS application by connecting directly to your DBOS application's system database.
Since the DBOS Client is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

For example, this code enqueues the `data_pipeline` workflow on the `pipeline_queue` queue with `task` as an argument.

```python
from dbos import DBOSClient, EnqueueOptions

client = DBOSClient(system_database_url=os.environ["DBOS_SYSTEM_DATABASE_URL"])

options: EnqueueOptions = {
  "queue_name": "pipeline_queue",
  "workflow_name": "data_pipeline",
}
handle = client.enqueue(options, task)
result = handle.get_result()
```

The [queue worker](../examples/queue-worker.md) example shows this design pattern in more detail.

### Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

#### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```python
from dbos import Queue

queue = Queue("example_queue", worker_concurrency=5)
```

Note that DBOS uses `executor_id` to distinguish processes&mdash;this is set automatically by Conductor and Cloud, but if those are not used it must be set to a unique value for each process through [configuration](../reference/configuration.md).

#### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions
:::

```python
from dbos import Queue

queue = Queue("example_queue", concurrency=10)
```

#### In-Order Processing

You can use a queue with `concurrency=1` to guarantee sequential, in-order processing of events.
Only a single event will be processed at a time.
For example, this app processes events sequentially in the order of their arrival:

 ```python
from fastapi import FastAPI
from dbos import DBOS, Queue

queue = Queue("in_order_queue", concurrency=1)

@DBOS.step()
def process_event(event: str):
    ...

def event_endpoint(event: str):
    queue.enqueue(process_event, event)
 ```

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 50 with a period of 30 seconds, so it may not start more than 50 functions in 30 seconds:

```python
queue = Queue("example_queue", limiter={"limit": 50, "period": 30})
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.


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

## Partitioning Queues

You can **partition** queues to distribute work across dynamically created queue partitions.
When you enqueue a workflow on a partitioned queue, you must supply a queue partition key.
Partitioned queues dequeue workflows and apply flow control limits for individual partitions, not for the entire queue.
Essentially, you can think of each partition as a "subqueue" you dynamically create by enqueueing a workflow with a partition key.

For example, suppose you want your users to each be able to run at most one task at a time.
You can do this with a partitioned queue with a maximum concurrency limit of 1 where the partition key is user ID.

**Example Syntax**

```python
queue = Queue("partitioned_queue", partition_queue=True, concurrency=1)

@DBOS.workflow()
def process_task(task: Task):
  ...


def on_user_task_submission(user_id: str, task: Task):
    # Partition the task queue by user ID. As the queue has a
    # maximum concurrency of 1, this means that at most one
    # task can run at once per user (but tasks from different
    # users can run concurrently).
    with SetEnqueueOptions(queue_partition_key=user_id):
        queue.enqueue(process_task, task)
```

Sometimes, you want to apply global or per-worker limits to a partitioned queue.
You can do this with **multiple levels of queueing**.
Create two queues: a partitioned queue with per-partition limits and a non-partitioned queue with global limits.
Enqueue a "concurrency manager" workflow to the partitioned queue, which then enqueues your actual workflow
to the non-partitioned queue and awaits its result.
This ensures both queues' flow control limits are enforced on your workflow.
For example:

```python
# By using two levels of queueing, we enforce both a concurrency limit of 1 on each partition
# and a global concurrency limit of 5, meaning that no more than 5 tasks can run concurrently
# across all partitions (and at most one task per partition).
concurrency_queue = Queue("concurrency-queue", concurrency=5)
partitioned_queue = Queue("partitioned-queue", partition_queue=True, concurrency=1)

def on_user_task_submission(user_id: str, task: Task):
    # First, enqueue a "concurrency manager" workflow to the partitioned
    # queue to enforce per-partition limits.
    with SetEnqueueOptions(queue_partition_key=user_id):
        partitioned_queue.enqueue(concurrency_manager, task)

@DBOS.workflow()
def concurrency_manager(task):
    # The "concurrency manager" workflow enqueues the process_task
    # workflow on the non-partitioned queue and awaits its results
    # to enforce global flow control limits.
    return concurrency_queue.enqueue(process_task, task).get_result()

@DBOS.workflow()
def process_task(task):
    ...
```

## Deduplication

You can set a deduplication ID for an enqueued workflow with [`SetEnqueueOptions`](../reference/queues.md#setenqueueoptions).
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDeduplicatedError` exception.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

Example syntax:

```python
from dbos import DBOS, Queue, SetEnqueueOptions
from dbos import error as dboserror

queue = Queue("example_queue")

with SetEnqueueOptions(deduplication_id="my_dedup_id"):
    try:
        handle = queue.enqueue(example_workflow, ...)
    except dboserror.DBOSQueueDeduplicatedError as e:
        # Handle deduplication error
```

## Priority

You can set a priority for an enqueued workflow with [`SetEnqueueOptions`](../reference/queues.md#setenqueueoptions).
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

# first_workflow (priority=1) will be dequeued before all task_workflows (priority=10)
with SetEnqueueOptions(priority=1):
    queue.enqueue(first_workflow)
```
