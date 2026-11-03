---
sidebar_position: 50
title: Queues
toc_max_heading_level: 3
---

See the [queues tutorial](../tutorials/queue-tutorial.md) for how to use these.

## Registering and Managing Queues

A queue's configuration is stored in the system database, so these are methods of a launched [`DBOS`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html) (and of [`Client`](./client.md)).

| Method | Description |
|---|---|
| [`register_queue(name, options, on_conflict)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.register_queue) | Creates a queue, or reports the existing one. [`QueueConflict`](https://docs.rs/dbos/latest/dbos/enum.QueueConflict.html) says what to do if it exists: `UpdateIfLatestVersion`, `AlwaysUpdate` or `NeverUpdate`. After `launch` only. |
| [`queue(name)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.queue) | The stored configuration of one queue, as a [`Queue`](https://docs.rs/dbos/latest/dbos/struct.Queue.html). |
| [`list_queues()`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.list_queues) | Every queue this application owns. |
| [`update_queue(name, change)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.update_queue) | Changes some of a queue's limits with a [`QueueChange`](https://docs.rs/dbos/latest/dbos/struct.QueueChange.html), whose fields are each `Change::Leave` or `Change::Set(value)`. Workers pick the change up on their next poll. |
| [`delete_queue(name)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.delete_queue) | Removes a queue's configuration. |

### QueueOptions

| Field | Default | Description |
|---|---|---|
| [`worker_concurrency`](https://docs.rs/dbos/latest/dbos/struct.QueueOptions.html#structfield.worker_concurrency) | `None` | The most of the queue's workflows one process runs at once. `Some(0)` pauses the queue. |
| [`concurrency`](https://docs.rs/dbos/latest/dbos/struct.QueueOptions.html#structfield.concurrency) | `None` | The most that run at once across every process. Every `PENDING` workflow on the queue counts, including those of older versions. `Some(0)` pauses the queue. |
| [`rate_limit`](https://docs.rs/dbos/latest/dbos/struct.QueueOptions.html#structfield.rate_limit) | `None` | A [`RateLimit`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.RateLimit.html): at most `limit` starts per `period`, across every process. |
| [`partition_concurrency`](https://docs.rs/dbos/latest/dbos/struct.QueueOptions.html#structfield.partition_concurrency) | `None` | Like `concurrency`, per partition key. Setting any partition limit partitions the queue. |
| [`partition_worker_concurrency`](https://docs.rs/dbos/latest/dbos/struct.QueueOptions.html#structfield.partition_worker_concurrency) | `None` | Like `worker_concurrency`, per partition key. |
| [`partition_rate_limit`](https://docs.rs/dbos/latest/dbos/struct.QueueOptions.html#structfield.partition_rate_limit) | `None` | Like `rate_limit`, per partition key. |
| [`polling_interval`](https://docs.rs/dbos/latest/dbos/struct.QueueOptions.html#structfield.polling_interval) | 1 second | How often a quiet queue is polled. |

## Enqueueing

A workflow this process registered is enqueued by starting it with a [`QueueRequest`](#queuerequest) in its [`StartOptions`](./workflows-steps.md#startoptions).
A workflow it doesn't have is enqueued by name with [`DBOS::enqueue`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.enqueue) or [`enqueue_with`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.enqueue_with) and [`EnqueueOptions`](#enqueueoptions), or from another application with a [`Client`](./client.md).
Enqueued from a workflow, either way, the enqueued workflow is a child, recorded in the parent.

### QueueRequest

[`QueueRequest::new(name)`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html#method.new) names the queue; set the other fields with struct update syntax.

| Field | Default | Description |
|---|---|---|
| [`name`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html#structfield.name) | *(required)* | The queue. |
| [`deduplication_id`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html#structfield.deduplication_id) | `None` | At most one workflow with this ID may be enqueued or running on the queue at once. |
| [`duplication_policy`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html#structfield.duplication_policy) | `Reject` | A [`DuplicationPolicy`](https://docs.rs/dbos/latest/dbos/enum.DuplicationPolicy.html): `Reject` fails with `QueueDeduplicated`; `ReturnExisting` hands back the workflow holding the ID. |
| [`priority`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html#structfield.priority) | `None` | From 1 to 2,147,483,647; lower runs first. Workflows with no priority run before any with one. |
| [`partition_key`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html#structfield.partition_key) | `None` | The partition, on a partitioned queue. A workflow enqueued on a partitioned queue without one is never dequeued; on any other queue the key is ignored. |
| [`delay`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html#structfield.delay) | `None` | How long the workflow waits, `DELAYED`, before it can be dequeued. |
| [`serialization`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html#structfield.serialization) | `Default` | A [`SerializationFormat`](https://docs.rs/dbos/latest/dbos/enum.SerializationFormat.html) for the workflow's input and output. |

### EnqueueOptions

[`EnqueueOptions::new(queue_name)`](https://docs.rs/dbos/latest/dbos/struct.EnqueueOptions.html#method.new) carries a `QueueRequest`'s fields, plus:

| Field | Default | Description |
|---|---|---|
| [`workflow_id`](https://docs.rs/dbos/latest/dbos/struct.EnqueueOptions.html#structfield.workflow_id) | a UUID | The workflow's ID. |
| [`workflow_id_reuse_policy`](https://docs.rs/dbos/latest/dbos/struct.EnqueueOptions.html#structfield.workflow_id_reuse_policy) | `ReturnExisting` | As for a start. |
| [`app_name`](https://docs.rs/dbos/latest/dbos/struct.EnqueueOptions.html#structfield.app_name) | this application (`DBOS`), the client's (`Client`) | The [application](../../explanations/sharing-a-system-database.md) that implements the workflow. |
| [`app_version`](https://docs.rs/dbos/latest/dbos/struct.EnqueueOptions.html#structfield.app_version) | `None` | The version that runs it; `None` is that application's latest. |
| [`timeout`](https://docs.rs/dbos/latest/dbos/struct.EnqueueOptions.html#structfield.timeout) | `Inherit` | The workflow's [`Timeout`](https://docs.rs/dbos/latest/dbos/enum.Timeout.html). |
| [`attributes`](https://docs.rs/dbos/latest/dbos/struct.EnqueueOptions.html#structfield.attributes) | `None` | Attributes recorded with the workflow. |

[`enqueue_portable`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.enqueue_portable) enqueues a workflow in another language that takes named arguments, from a [`PortableWorkflowArgs`](https://docs.rs/dbos/latest/dbos/struct.PortableWorkflowArgs.html).
