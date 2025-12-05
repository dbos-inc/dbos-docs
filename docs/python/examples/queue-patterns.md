---
displayed_sidebar: examplesSidebar
sidebar_position: 36
title: Advanced Queue Patterns
---

This example demonstrates how to use several advanced queue patterns in DBOS.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/queue-patterns).

## Fair Queueing

Often, you have a queue with limited capacity and need to fairly divide that capacity among multiple tenants.
For example, your application can only process 5 items at a time, and you don't want a single user to consume all that capacity, so you limit each user to only be able to process one item at a time.

You can implement fair queueing in DBOS by combining a [**partitioned queue**](../tutorials/queue-tutorial.md#partitioning-queues) with a **regular (non-partitioned) queue**.
You enforce per-tenant limits on the partitioned queue and global limits on the non-partitioned queue.
To do that, first let's define our two queues and our workflow:

```python
concurrency_queue = Queue("concurrency-queue", concurrency=5)
partitioned_queue = Queue("partitioned-queue", partition_queue=True, concurrency=1)

# This workflow is fairly queued: at most five workflows can run concurrently,
# but no more than one per tenant.
@DBOS.workflow()
def fair_queue_workflow():
    time.sleep(5)
```

Next, let's create an endpoint to enqueue our workflow.
It does not enqueue the workflow directly, but instead enqueues a "concurrency manager" workflow to the partitioned queue to enforce per-tenant limits:

```python
@api.post("/workflows/fair_queue")
def submit_fair_queue(tenant_id: str):
    # Enqueue a "concurrency manager" workflow to the partitioned
    # queue to enforce per-partition limits.
    with SetEnqueueOptions(queue_partition_key=tenant_id):
        partitioned_queue.enqueue(fair_queue_concurrency_manager)
```

Then the "concurrency manager" workflow enqueues the workflow to the non-partitioned queue and awaits its results to enforce global flow control limits:

```python
@DBOS.workflow()
def fair_queue_concurrency_manager():
    # The "concurrency manager" workflow enqueues the
    # workflow on the non-partitioned queue and
    # awaits its results to enforce global flow control limits.
    return concurrency_queue.enqueue(fair_queue_workflow).get_result()
```

You can adapt this pattern to combine any per-tenant limits with any global limits.

## Rate Limiting

Sometimes, you need to **rate limit** a workflow, limiting the number of workflows that can start in a given period.
This is especially useful when using a rate-limited API, like many LLM APIs.
You can do this by applying a rate limit to a queue.
For example, here's a rate-limited queue and workflow:

```python
rate_limited_queue = Queue("rate-limited-queue", limiter={"limit": 2, "period": 10})

# This workflow is rate-limited: No more than two workflows can start per 10 seconds
@DBOS.workflow()
def rate_limited_queue_workflow():
    time.sleep(5)
```

If a rate-limit is defined with limit X and period Y, no more than X workflows can start per Y seconds.
Rate limits are global across all DBOS processes using a queue.

You can enqueue a workflow on a rate-limited queue like with any other queue:

```python
@api.post("/workflows/rate_limited_queue")
def submit_rate_limited_queue():
    rate_limited_queue.enqueue(rate_limited_queue_workflow)
```