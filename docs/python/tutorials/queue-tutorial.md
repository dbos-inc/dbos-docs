---
sidebar_position: 40
title: Queues & Concurrency
toc_max_heading_level: 3
---

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

Register a queue with [`DBOS.register_queue`](../reference/contexts.md#register_queue), specifying its name:

```python
from dbos import DBOS

DBOS.register_queue("example_queue")
```

Queues are persisted to the system database, so they are visible to every DBOS process and [client](../reference/client.md) connected to that database.
Register your queues after [`DBOS.launch()`](../reference/dbos-class.md#launch).

You can then enqueue any DBOS workflow or step.
Enqueuing a function submits it for execution and returns a [handle](../reference/workflow_handles.md) to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```python
DBOS.register_queue("example_queue")

@DBOS.workflow()
def process_task(task):
  ...

task = ...
handle = DBOS.enqueue_workflow("example_queue", process_task, task)
```

### Queue Example

Here's an example of a workflow using a queue to process tasks concurrently:

```python
from dbos import DBOS

DBOS.register_queue("example_queue")

@DBOS.workflow()
def process_task(task):
  ...

@DBOS.workflow()
def process_tasks(tasks):
  task_handles = []
  # Enqueue each task so all tasks are processed concurrently.
  for task in tasks:
    handle = DBOS.enqueue_workflow("example_queue", process_task, task)
    task_handles.append(handle)
  # Wait for each task to complete and retrieve its result.
  # Return the results of all tasks.
  return [handle.get_result() for handle in task_handles]
```

Sometimes, you may wish to receive the result of each task as soon as it's ready instead of waiting for all tasks to complete.
You can do this using [`DBOS.wait_first`](../reference/contexts.md#wait_first), which waits for any one of a list of workflow handles to complete and returns the first completed handle.

```python
@DBOS.workflow()
def process_task(task: Task):
    result = ...  # Process the task
    return result

@DBOS.workflow()
def process_tasks(tasks: List[Task]):
    handles = [DBOS.enqueue_workflow("example_queue", process_task, task) for task in tasks]
    results = []
    remaining = list(handles)
    while remaining:
        # Wait for any task to complete
        completed = DBOS.wait_first(remaining)
        result = completed.get_result()
        print(f"Task completed. Result: {result}")
        results.append(result)
        # Remove the completed handle
        remaining = [h for h in remaining if h.workflow_id != completed.workflow_id]
    return results
```

### Enqueueing from Another Application

Often, you want to enqueue a workflow from another DBOS application or from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

You can use the [DBOS Client](../reference/client.md) to register queues and enqueue workflows from outside your DBOS application by connecting directly to your system database.
Since the DBOS Client is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

```python
from dbos import DBOSClient, EnqueueOptions

client = DBOSClient(system_database_url=os.environ["DBOS_SYSTEM_DATABASE_URL"])

# Register the queue from the client.
client.register_queue("pipeline_queue")

options: EnqueueOptions = {
  "queue_name": "pipeline_queue",
  "workflow_name": "data_pipeline",
}
handle = client.enqueue(options, task)
result = handle.get_result()
```

The [queue worker](../examples/queue-worker.md) example shows this design pattern in more detail.


### Enqueueing from PL/pgSQL

You can also enqueue a workflow from a Postgres trigger or stored procedure.
The DBOS System Database includes an [`enqueue_workflow`](../../explanations/system-tables.md#dbosenqueue_workflow) method for this scenario.

For example, here is the previous example of enqueing the `dataPipeline` workflow on the `pipelineQueue` queue with arguments, but using PL/pgSQL.

```sql
DECLARE workflow_id text;
workflow_id := dbos.enqueue_workflow(
    workflow_name => 'data_pipeline', 
    queue_name => 'pipeline_queue', 
    positional_args => ARRAY[
        '"task-123"'::json, 
        '"data"'::json]
    )
```

### Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

#### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```python
DBOS.register_queue("example_queue", worker_concurrency=5)
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
DBOS.register_queue("example_queue", concurrency=10)
```

#### In-Order Processing

You can use a queue with `concurrency=1` to guarantee sequential, in-order processing of events.
Only a single event will be processed at a time.
For example, this app processes events sequentially in the order of their arrival:

 ```python
from fastapi import FastAPI
from dbos import DBOS

DBOS.register_queue("in_order_queue", concurrency=1)

@DBOS.step()
def process_event(event: str):
    ...

def event_endpoint(event: str):
    DBOS.enqueue_workflow("in_order_queue", process_event, event)
 ```

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 50 with a period of 30 seconds, so it may not start more than 50 functions in 30 seconds:

```python
DBOS.register_queue("example_queue", limiter={"limit": 50, "period": 30})
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

### Reconfiguring Queues at Runtime

Because queue configuration lives in the system database, you can change a queue's configuration at runtime without redeploying or restarting your workers.
Use [`DBOS.retrieve_queue`](../reference/contexts.md#retrieve_queue) to fetch a queue, then call its [`set_*`](../reference/queues.md#reconfiguring-queues) methods.
Workers pick up the new configuration on their next polling iteration.

```python
queue = DBOS.retrieve_queue("example_queue")

# Change the queue's concurrency.
queue.set_concurrency(20)

# Change its rate limit.
queue.set_limiter({"limit": 25, "period": 30})
```

You can also do this from a [`DBOSClient`](../reference/client.md), which is useful for managing queues from an admin tool or another service.

#### Rolling Deployments

When `register_queue` runs in a process whose application version is **not** the latest registered version, it leaves the existing configuration unchanged by default.
This prevents older workers from overwriting a newer configuration during a rolling deploy.
You can override this behavior with the `on_conflict` parameter; see [`DBOS.register_queue`](../reference/contexts.md#register_queue) for details.

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

DBOS.register_queue("example-queue")

# If the workflow does not complete within 10 seconds after being dequeued, it times out and is cancelled
with SetWorkflowTimeout(10):
    DBOS.enqueue_workflow("example-queue", example_workflow)
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
DBOS.register_queue("partitioned_queue", partition_queue=True, concurrency=1)

@DBOS.workflow()
def process_task(task: Task):
  ...


def on_user_task_submission(user_id: str, task: Task):
    # Partition the task queue by user ID. As the queue has a
    # maximum concurrency of 1, this means that at most one
    # task can run at once per user (but tasks from different
    # users can run concurrently).
    with SetEnqueueOptions(queue_partition_key=user_id):
        DBOS.enqueue_workflow("partitioned_queue", process_task, task)
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
DBOS.register_queue("concurrency-queue", concurrency=5)
DBOS.register_queue("partitioned-queue", partition_queue=True, concurrency=1)

def on_user_task_submission(user_id: str, task: Task):
    # First, enqueue a "concurrency manager" workflow to the partitioned
    # queue to enforce per-partition limits.
    with SetEnqueueOptions(queue_partition_key=user_id):
        DBOS.enqueue_workflow("partitioned-queue", concurrency_manager, task)

@DBOS.workflow()
def concurrency_manager(task):
    # The "concurrency manager" workflow enqueues the process_task
    # workflow on the non-partitioned queue and awaits its results
    # to enforce global flow control limits.
    return DBOS.enqueue_workflow("concurrency-queue", process_task, task).get_result()

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
from dbos import DBOS, SetEnqueueOptions
from dbos import error as dboserror

DBOS.register_queue("example_queue")

with SetEnqueueOptions(deduplication_id="my_dedup_id"):
    try:
        handle = DBOS.enqueue_workflow("example_queue", example_workflow, ...)
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
DBOS.register_queue("priority_queue", priority_enabled=True)

with SetEnqueueOptions(priority=10):
    # All workflows are enqueued with priority set to 10
    # They will be dequeued in FIFO order
    for task in tasks:
        DBOS.enqueue_workflow("priority_queue", task_workflow, task)

# first_workflow (priority=1) will be dequeued before all task_workflows (priority=10)
with SetEnqueueOptions(priority=1):
    DBOS.enqueue_workflow("priority_queue", first_workflow)
```


## Delayed Execution

You can delay an enqueued workflow by a specified number of seconds using [`SetEnqueueOptions`](../reference/queues.md#setenqueueoptions).
The workflow is initially placed in `DELAYED` status and does not execute.
After the delay expires, it transitions to `ENQUEUED` status and may be dequeued and executed.
This is useful for scheduling workflows to run at a future time.

Example syntax:

```python
from dbos import DBOS, SetEnqueueOptions

DBOS.register_queue("example_queue")

@DBOS.workflow()
def send_reminder(user_id: str):
    ...

# Send a reminder in one hour
with SetEnqueueOptions(delay_seconds=3600):
    handle = DBOS.enqueue_workflow("example_queue", send_reminder, user_id)
```

You can also dynamically update the delay of a `DELAYED` workflow using [`DBOS.set_workflow_delay`](../reference/contexts.md#set_workflow_delay):

```python
# Shorten the delay to 10 seconds from now
DBOS.set_workflow_delay(handle.workflow_id, delay_seconds=10)

# Or set an absolute deadline
DBOS.set_workflow_delay(handle.workflow_id, delay_until_epoch_ms=int((time.time() + 60) * 1000))
```

## Explicit Queue Listening

By default, a process running DBOS listens to (dequeues workflows from) all queues registered in its system database.
However, sometimes you only want a process to listen to a specific list of queues.
You can use [`DBOS.listen_queues`](../reference/dbos-class.md#listen_queues) to explicitly tell a process running DBOS to only listen to a specific set of queues.
You must call `DBOS.listen_queues` before DBOS is launched.

This is particularly useful when managing heterogeneous workers, where specific tasks should execute on specific physical servers.
For example, say you have a mix of CPU workers and GPU workers and you want CPU tasks to only execute on CPU workers and GPU tasks to only execute on GPU workers.
You can configure each type of worker to only listen to the appropriate queue:

```python
if __name__ == "__main__":
    worker_type = ... # "cpu' or 'gpu'
    config: DBOSConfig = ...
    DBOS(config=config)
    if worker_type == "gpu":
        # GPU workers will only dequeue and execute workflows from the GPU queue
        DBOS.listen_queues(["gpu_queue"])
    elif worker_type == "cpu":
        # CPU workers will only dequeue and execute workflows from the CPU queue
        DBOS.listen_queues(["cpu_queue"])
    DBOS.launch()
    DBOS.register_queue("cpu_queue")
    DBOS.register_queue("gpu_queue")
```

Note that `DBOS.listen_queues` only controls what workflows are dequeued, not what workflows can be enqueued, so you can freely enqueue tasks onto the GPU queue from a CPU worker for execution on a GPU worker, and vice versa.
