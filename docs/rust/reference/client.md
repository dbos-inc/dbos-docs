---
sidebar_position: 60
title: DBOS Client
---

A [`Client`](https://docs.rs/dbos/latest/dbos/struct.Client.html) connects to a DBOS application's system database from outside the application: an API server that enqueues work, an operator's tool, or an application in another process.
It runs no workflows of its own.

```rust
let client = dbos::Client::connect(dbos::ClientConfig::from_env()).await?;
let handle: dbos::WorkflowHandle<String> =
    client.enqueue("process_order", "orders", "order-123").await?;
let result = handle.result().await?;
client.close().await;
```

A client has no registered workflows, so the type parameters of the handles it returns state what the workflow returns; nothing checks them until the result is decoded.
See [`ClientConfig`](./configuration.md#clientconfig) for its configuration.

| Method | Description |
|---|---|
| [`Client::connect(config)`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.connect) | Connects to the system database. |
| [`close()`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.close) | Closes the connection pool. |
| [`enqueue(workflow, queue, input)`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.enqueue), [`enqueue_with`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.enqueue_with) | Enqueues a workflow by name, with [`EnqueueOptions`](./queues.md#enqueueoptions). |
| [`enqueue_portable`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.enqueue_portable) | Enqueues a workflow in another language with named arguments. |
| [`retrieve_workflow(id)`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.retrieve_workflow) | A handle to a workflow by ID. |
| [`workflow_status(id)`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.workflow_status) | A workflow's status, or `None` if there's no such workflow. |
| [`send`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.send), [`send_with`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.send_with), [`send_bulk`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.send_bulk), [`send_bulk_with`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.send_bulk_with) | Sends messages to workflows. |
| [`get_event`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.get_event) | Waits for a workflow's event. |
| [`read_stream`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.read_stream), [`read_stream_from`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.read_stream_from), [`read_stream_value`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.read_stream_value) | Reads a workflow's stream. |
| [`select_workflow`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.select_workflow), [`join_workflows`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.join_workflows) | Waits for the first, or all, of several workflows. |
| [`list_workflows`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.list_workflows), [`list_workflow_steps`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.list_workflow_steps) | Lists workflows and their steps. |
| [`cancel`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.cancel), [`resume`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.resume), [`fork`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.fork), [`rewind`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.rewind), [`delete`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.delete), and their `_with` and `_all` forms | Manages workflows, as the [`DBOS` methods](./methods.md#workflow-management) do. |
| [`set_workflow_delay`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.set_workflow_delay), [`update_workflow_attributes`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.update_workflow_attributes), [`merge_workflow_attributes`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.merge_workflow_attributes) | Changes a workflow's delay or attributes. |
| [`register_queue`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.register_queue), [`queue`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.queue), [`list_queues`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.list_queues), [`update_queue`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.update_queue), [`delete_queue`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.delete_queue) | Manages queues. `register_queue` can't use `UpdateIfLatestVersion`, since a client has no version. |
| [`create_schedule`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.create_schedule), [`apply_schedules`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.apply_schedules), [`list_schedules`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.list_schedules), [`get_schedule`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.get_schedule), [`update_schedule`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.update_schedule), [`pause_schedule`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.pause_schedule), [`resume_schedule`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.resume_schedule), [`delete_schedule`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.delete_schedule), [`backfill_schedule`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.backfill_schedule), [`trigger_schedule`](https://docs.rs/dbos/latest/dbos/struct.Client.html#method.trigger_schedule) | Manages schedules. Build a spec with [`ScheduleSpec::for_workflow`](https://docs.rs/dbos/latest/dbos/struct.ScheduleSpec.html#method.for_workflow), which names the workflow. |

[`DebouncerClient`](https://docs.rs/dbos/latest/dbos/struct.DebouncerClient.html) debounces a workflow from a client.
