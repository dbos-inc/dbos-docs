---
sidebar_position: 45
title: Queues & Concurrency
toc_max_heading_level: 3
---

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

To create a queue, register it with [`register_queue`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.register_queue):

```rust
async fn register_example_queue(dbos: &DBOS) -> dbos::Result<()> {
    // After dbos.launch().
    dbos.register_queue(
        "example_queue",
        QueueOptions::default(),
        QueueConflict::UpdateIfLatestVersion,
    )
    .await?;
    Ok(())
}
```

`register_queue` persists the queue's configuration to the system database, so it is called **after** [`launch`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.launch), and the queue's configuration can be [changed at runtime](#reconfiguring-queues).
Its last argument, a [`QueueConflict`](https://docs.rs/dbos/latest/dbos/enum.QueueConflict.html), says what to do when the queue already exists:

- `UpdateIfLatestVersion` overwrites the stored configuration only if this process runs the latest version of the application, so an old version still running during a rolling deploy doesn't revert the new version's settings. This is what an application usually means at startup.
- `AlwaysUpdate` always overwrites it.
- `NeverUpdate` keeps whatever is stored.

If multiple applications [share a system database](../../explanations/sharing-a-system-database.md), each queue is owned by the application that registers it, and only that application dequeues workflows from it.

To enqueue a workflow, start it with a [`QueueRequest`](https://docs.rs/dbos/latest/dbos/struct.QueueRequest.html) in the `queue` field of its [`StartOptions`](https://docs.rs/dbos/latest/dbos/struct.StartOptions.html).
Enqueuing a workflow submits it for execution and returns a [handle](https://docs.rs/dbos/latest/dbos/struct.WorkflowHandle.html) to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```rust
async fn process_task(task: String) -> dbos::Result<String> {
    // Process the task...
    Ok(format!("Processed: {task}"))
}

async fn enqueue_example(process_task: &WorkflowRef<String, String>) -> dbos::Result<()> {
    // Enqueue a workflow.
    let options = StartOptions {
        queue: Some(QueueRequest::new("example_queue")),
        ..StartOptions::default()
    };
    let handle = process_task
        .start_with("example_task".to_owned(), options)
        .await?;

    // Get the result.
    let result = handle.result().await?;
    println!("Task result: {result}");
    Ok(())
}
```

Enqueued from inside a workflow, the queued workflow is a child of the caller: DBOS records the enqueue, so a recovered parent gets the same child back.

To enqueue a workflow this process doesn't have the code for, enqueue it by name with [`DBOS::enqueue`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.enqueue), or from outside the application with a [client](#enqueueing-from-another-application).

## Enqueueing from Another Application

Often, you want to enqueue a workflow from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

You can use the DBOS [`Client`](https://docs.rs/dbos/latest/dbos/struct.Client.html) to enqueue workflows from outside your DBOS application by connecting directly to your DBOS application's system database.
Since the client is designed to be used from outside your DBOS application, workflow and queue names must be specified explicitly, and the handle's type parameters state what the workflow returns.
For example, this code enqueues the `data_pipeline` workflow on the `pipeline_queue` queue with a `ProcessInput` argument:

```rust
#[derive(Serialize, Deserialize)]
struct ProcessInput {
    task_id: String,
    data: String,
}

#[derive(Serialize, Deserialize)]
struct ProcessOutput {
    result: String,
    status: String,
}

async fn enqueue_from_client() -> dbos::Result<()> {
    let client = Client::connect(ClientConfig::new(
        "postgres://postgres:dbos@localhost:5432/dbos_starter_rust",
    ))
    .await?;

    let input = ProcessInput {
        task_id: "task-123".to_owned(),
        data: "data".to_owned(),
    };
    // The type parameters say what the workflow returns; nothing here can check it.
    let handle: WorkflowHandle<ProcessOutput> = client
        .enqueue("data_pipeline", "pipeline_queue", input)
        .await?;
    let output = handle.result().await?;
    println!("Pipeline finished: {}", output.status);

    client.close().await;
    Ok(())
}
```

`Client::enqueue_with` takes [`EnqueueOptions`](https://docs.rs/dbos/latest/dbos/struct.EnqueueOptions.html), which carry everything a `QueueRequest` does, plus the workflow ID, timeout and application version.
The workflow can be written in any DBOS language; to enqueue one written in another language, see [portable workflows](../../explanations/portable-workflows.md).

## Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```rust
async fn worker_concurrency(dbos: &DBOS) -> dbos::Result<()> {
    let options = QueueOptions {
        worker_concurrency: Some(5),
        ..QueueOptions::default()
    };
    dbos.register_queue(
        "example_queue",
        options,
        QueueConflict::UpdateIfLatestVersion,
    )
    .await?;
    Ok(())
}
```

### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions.
:::

```rust
async fn global_concurrency(dbos: &DBOS) -> dbos::Result<()> {
    let options = QueueOptions {
        concurrency: Some(10),
        ..QueueOptions::default()
    };
    dbos.register_queue(
        "example_queue",
        options,
        QueueConflict::UpdateIfLatestVersion,
    )
    .await?;
    Ok(())
}
```

Setting `worker_concurrency` to `Some(0)` pauses the queue: nothing is dequeued from it until the limit is raised. `concurrency` can't be set below `worker_concurrency` or a per-partition limit, so `concurrency: Some(0)` pauses the queue only when those are 0 or unset.

## Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 100 workflows with a period of 60 seconds, so it may not start more than 100 workflows in 60 seconds:

```rust
async fn rate_limit(dbos: &DBOS) -> dbos::Result<()> {
    let options = QueueOptions {
        rate_limit: Some(RateLimit {
            limit: 100,
            period: Duration::from_secs(60),
        }),
        ..QueueOptions::default()
    };
    dbos.register_queue(
        "example_queue",
        options,
        QueueConflict::UpdateIfLatestVersion,
    )
    .await?;
    Ok(())
}
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

## Reconfiguring Queues

Because queue configuration is persisted to the system database, you can change a queue's configuration at runtime without redeploying or restarting your workers.
Workers pick up the new configuration on their next polling iteration.
Use [`update_queue`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.update_queue) with a [`QueueChange`](https://docs.rs/dbos/latest/dbos/struct.QueueChange.html), in which each field is a `Change`: `Change::Set(value)` to store a new value, or `Change::Leave` (the default) to keep the stored one.

```rust
async fn reconfigure(dbos: &DBOS) -> dbos::Result<()> {
    let change = QueueChange {
        concurrency: Change::Set(Some(50)),
        ..QueueChange::default()
    };
    let queue = dbos.update_queue("example_queue", change).await?;
    println!("Concurrency is now {:?}", queue.concurrency());
    Ok(())
}
```

[`queue`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.queue) and [`list_queues`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.list_queues) read the stored configuration, and [`delete_queue`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.delete_queue) removes it.

:::warning
If your application calls `register_queue` with `UpdateIfLatestVersion` or `AlwaysUpdate` on startup, the next process to start on the latest version overwrites settings you applied at runtime.
Either update the `register_queue` call to match the new configuration, or register with `NeverUpdate` to preserve the runtime changes.
:::

## Deduplication

You can set a deduplication ID for an enqueued workflow with the `deduplication_id` field of its `QueueRequest`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent attempts to enqueue a workflow with the same deduplication ID in the same queue fail with `dbos::sysdb::Error::QueueDeduplicated`.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

```rust
async fn dedup_example(
    task_workflow: &WorkflowRef<String, String>,
    user_id: &str,
) -> dbos::Result<()> {
    let mut queue = QueueRequest::new("example_queue");
    queue.deduplication_id = Some(user_id);
    let options = StartOptions {
        queue: Some(queue),
        ..StartOptions::default()
    };
    match task_workflow.start_with("task".to_owned(), options).await {
        Ok(handle) => println!("Enqueued {}", handle.workflow_id()),
        Err(dbos::Error::SystemDatabase(dbos::sysdb::Error::QueueDeduplicated { .. })) => {
            // A workflow for this user is already enqueued or running.
        }
        Err(error) => return Err(error),
    }
    Ok(())
}
```

Alternatively, set `duplication_policy` to `DuplicationPolicy::ReturnExisting` to instead get back a handle to the workflow that holds the deduplication ID.
The first caller's workflow is the one that runs, and later callers' inputs are discarded:

```rust
fn singleton(user_id: &str) -> QueueRequest<'_> {
    QueueRequest {
        deduplication_id: Some(user_id),
        duplication_policy: DuplicationPolicy::ReturnExisting,
        ..QueueRequest::new("example_queue")
    }
}
```

## Priority

You can set a priority for an enqueued workflow with the `priority` field of its `QueueRequest`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.

:::tip
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
:::

```rust
async fn priority_example(task_workflow: &WorkflowRef<String, String>) -> dbos::Result<()> {
    let options = StartOptions {
        queue: Some(QueueRequest {
            priority: Some(10),
            ..QueueRequest::new("example_queue")
        }),
        ..StartOptions::default()
    };
    let handle = task_workflow.start_with("task".to_owned(), options).await?;
    Ok(())
}
```

## Partitioning Queues

You can **partition** a queue, applying its flow control limits to each partition separately.
For example, with a per-partition concurrency of 1, a queue runs at most one workflow at a time for each user, while workflows for different users run concurrently.

Setting any of the partition limits, `partition_concurrency`, `partition_worker_concurrency` or `partition_rate_limit`, is what makes a queue partitioned.
Each workflow you enqueue on a partitioned queue names its partition with the `partition_key` field of its `QueueRequest`:

```rust
async fn partition_example(
    dbos: &DBOS,
    process_task: &WorkflowRef<String, String>,
) -> dbos::Result<()> {
    // One workflow at a time per user.
    let options = QueueOptions {
        partition_concurrency: Some(1),
        ..QueueOptions::default()
    };
    dbos.register_queue(
        "per_user_queue",
        options,
        QueueConflict::UpdateIfLatestVersion,
    )
    .await?;

    let options = StartOptions {
        queue: Some(QueueRequest {
            partition_key: Some("user-123"),
            ..QueueRequest::new("per_user_queue")
        }),
        ..StartOptions::default()
    };
    let handle = process_task.start_with("task".to_owned(), options).await?;
    Ok(())
}
```

### Combining Queue-Wide and Per-Partition Limits

A partitioned queue can also carry queue-wide limits, and DBOS enforces both:

```rust
fn combined_limits() -> QueueOptions {
    QueueOptions {
        // At most 2 workflows per tenant at once...
        partition_concurrency: Some(2),
        // ...and at most 20 across all tenants.
        concurrency: Some(20),
        ..QueueOptions::default()
    }
}
```

## Delayed Execution

You can delay the start of an enqueued workflow with the `delay` field of its `QueueRequest`.
The workflow waits in the `DELAYED` state and becomes eligible to run once the delay has passed:

```rust
async fn delay_example(process_task: &WorkflowRef<String, String>) -> dbos::Result<()> {
    let options = StartOptions {
        queue: Some(QueueRequest {
            delay: Some(Duration::from_secs(60 * 60)),
            ..QueueRequest::new("example_queue")
        }),
        ..StartOptions::default()
    };
    let handle = process_task.start_with("task".to_owned(), options).await?;
    Ok(())
}
```

To change the delay of a workflow that is still waiting, use [`set_workflow_delay`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.set_workflow_delay):

```rust
async fn bring_forward(dbos: &DBOS, workflow_id: &str) -> dbos::Result<()> {
    // Start the delayed workflow now.
    dbos.set_workflow_delay(workflow_id, dbos::WorkflowDelay::For(Duration::ZERO))
        .await?;
    Ok(())
}
```

## Listening to Specific Queues

By default, a DBOS process dequeues workflows from every queue its application owns.
To have a process dequeue only from some queues (for example, to run GPU-heavy workflows only on GPU machines), set [`listen_queues`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.listen_queues) in its configuration:

```rust
fn listen_config() -> dbos::Config {
    let mut config = dbos::Config::from_env("dbos-starter");
    // This process dequeues only from these queues.
    config.listen_queues = Some(vec!["gpu_queue".to_owned()]);
    config
}
```

`Some(vec![])` listens to no queues, for a process that enqueues workflows but never runs them.
DBOS's internal queue, where resumed and forked workflows run, is always dequeued from.
