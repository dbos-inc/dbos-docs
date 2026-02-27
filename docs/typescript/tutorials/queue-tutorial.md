---
sidebar_position: 45
title: Queues & Concurrency
toc_max_heading_level: 3
---

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

To create a queue, specify its name:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue");
```

You can then enqueue any workflow by passing the queue as an argument to `DBOS.startWorkflow`.
Enqueuing a function submits it for execution and returns a [handle](../reference/methods.md#workflow-handles) to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```javascript
const queue = new WorkflowQueue("example_queue");

class Tasks {
  @DBOS.workflow()
  static async processTask(task) {
    // ...
  }
}

async function main() {
  const task = ...
  const handle = await DBOS.startWorkflow(Tasks, {queueName: queue.name}).processTask(task)
}
```

### Queue Example

Here's an example of a workflow using a queue to process tasks in parallel:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue");

async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction, {"name": "taskWorkflow"});

async function queueFunction(tasks) {
  const handles = []
  
  // Enqueue each task so all tasks are processed concurrently.
  for (const task of tasks) {
    handles.push(await DBOS.startWorkflow(taskWorkflow, { queueName: queue.name })(task))
  }

  // Wait for each task to complete and retrieve its result.
  // Return the results of all tasks.
  const results = []
  for (const h of handles) {
    results.push(await h.getResult())
  }
  return results
}
const queueWorkflow = DBOS.registerWorkflow(queueFunction, {"name": "queueWorkflow"})
```

Sometimes, you may wish to receive the result of each task as soon as it's ready instead of waiting for all tasks to complete.
You can do this using [`DBOS.waitFirst`](../reference/methods.md#dboswaitfirst), which waits for any one of a list of workflow handles to complete and returns the first completed handle.

```javascript
async function processTaskFunction(task: Task): Promise<string> {
    const result = ... // process the task
    return result;
}
const processTask = DBOS.registerWorkflow(processTaskFunction, { name: "processTask" });

async function processTasksFunction(tasks: Task[]) {
    const handles: WorkflowHandle<string>[] = [];
    for (const task of tasks) {
        const handle = await DBOS.startWorkflow(processTask, { queueName: queue.name })(task);
        handles.push(handle);
    }
    const results: string[] = [];
    let remaining = [...handles];
    while (remaining.length > 0) {
        // Wait for any task to complete
        const completed = await DBOS.waitFirst(remaining);
        const result = await completed.getResult() as string;
        console.log(`Task completed. Result: ${result}`);
        results.push(result);
        // Remove the completed handle
        remaining = remaining.filter(h => h.workflowID !== completed.workflowID);
    }
    return results;
}
const processTasks = DBOS.registerWorkflow(processTasksFunction, { name: "processTasks" });
```

### Enqueueing from Another Application

Often, you want to enqueue a workflow from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

You can use the [DBOS Client](../reference/client.md) to enqueue workflows from outside your DBOS application by connecting directly to your DBOS application's system database.
Since the DBOS Client is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

For example, this code enqueues the `dataPipeline` workflow on the `pipelineQueue` queue with `task` as an argument.

```ts
import { DBOSClient } from "@dbos-inc/dbos-sdk";

const client = await DBOSClient.create({systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL});

type ProcessTask = typeof Tasks.processTask;
await client.enqueue<ProcessTask>(
    {
        workflowName: 'dataPipeline',
        queueName: 'pipelineQueue',
    },
    task);
```

The [queue worker](../examples/queue-worker.md) example shows this design pattern in more detail.

### Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

#### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue", { workerConcurrency: 5 });
```

Note that DBOS uses `executorID` to distinguish processes&mdash;this is set automatically by Conductor and Cloud, but if those are not used it must be set to a unique value for each process through [configuration](../reference/configuration.md).

#### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions
:::

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue", { concurrency: 10 });
```

#### In-Order Processing

You can use a queue with `concurrency=1` to guarantee sequential, in-order processing of events.
Only a single event will be processed at a time.
For example, this app processes events sequentially in the order of their arrival:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";
import express from "express";

const serialQueue = new WorkflowQueue("in_order_queue", { concurrency: 1 });
const app = express();

class Tasks {
  @DBOS.workflow()
  static async processTask(task){
    // ... process task
  }
}

app.get("/events/:event", async (req, res) => {
  await DBOS.startWorkflow(Tasks, {queueName: serialQueue.name}).processTask(req.params);
  await res.send("Workflow Started!");
});

// Launch DBOS and start the server
async function main() {
  await DBOS.launch();
  app.listen(3000, () => {});
}

main().catch(console.log);
```


### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 50 with a period of 30 seconds, so it may not start more than 50 functions in 30 seconds:

```javascript
const queue = new WorkflowQueue("example_queue", { rateLimit: { limitPerPeriod: 50, periodSec: 30 } });
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

### Setting Timeouts

You can set a timeout for an enqueued workflow by passing a `timeoutMS` argument to `DBOS.startWorkflow`.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: a workflow's timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```javascript
const queue = new WorkflowQueue("example_queue");

async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction, {"name": "taskWorkflow"});

async function main() {
  const task = ...
  const timeout = ... // Timeout in milliseconds
  const handle = await DBOS.startWorkflow(taskWorkflow, {queueName: queue.name, timeoutMS: timeout})(task);
}
```

### Partitioning Queues

You can **partition** queues to distribute work across dynamically created queue partitions.
When you enqueue a workflow on a partitioned queue, you must supply a queue partition key.
Partitioned queues dequeue workflows and apply flow control limits for individual partitions, not for the entire queue.
Essentially, you can think of each partition as a "subqueue" you dynamically create by enqueueing a workflow with a partition key.

For example, suppose you want your users to each be able to run at most one task at a time.
You can do this with a partitioned queue with a maximum concurrency limit of 1 where the partition key is user ID.

**Example Syntax**

```ts
const queue = new WorkflowQueue("example_queue", { partitionQueue: true, concurrency: 1 });

async function onUserTaskSubmission(userID: string, task: Task) {
    // Partition the task queue by user ID. As the queue has a
    // maximum concurrency of 1, this means that at most one
    // task can run at once per user (but tasks from different
    // users can run concurrently).
    await DBOS.startWorkflow(taskWorkflow, {queueName: queue.name, enqueueOptions: {queuePartitionKey: userID}})(task);
}
```

Sometimes, you want to apply global or per-worker limits to a partitioned queue.
You can do this with **multiple levels of queueing**.
Create two queues: a partitioned queue with per-partition limits and a non-partitioned queue with global limits.
Enqueue a "concurrency manager" workflow to the partitioned queue, which then enqueues your actual workflow
to the non-partitioned queue and awaits its result.
This ensures both queues' flow control limits are enforced on your workflow.
For example:

```ts
// By using two levels of queueing, we enforce both a concurrency limit of 1 on each partition
// and a global concurrency limit of 5, meaning that no more than 5 tasks can run concurrently
// across all partitions (and at most one task per partition).
const concurrencyQueue = new WorkflowQueue("concurrency-queue", { concurrency: 5 });
const partitionedQueue = new WorkflowQueue("partitioned-queue", { partitionQueue: true, concurrency: 1 });

async function onUserTaskSubmission(userID: string, task: Task) {
    // First, enqueue a "concurrency manager" workflow to the partitioned
    // queue to enforce per-partition limits.
    await DBOS.startWorkflow(concurrencyManager, {
        queueName: partitionedQueue.name,
        enqueueOptions: { queuePartitionKey: userID }
    })(task);
}

async function concurrencyManagerFunc(task: Task) {
    // The "concurrency manager" workflow enqueues the processTask
    // workflow on the non-partitioned queue and awaits its results
    // to enforce global flow control limits.
    const handle = await DBOS.startWorkflow(processTask, { queueName: concurrencyQueue.name })(task);
    return await handle.getResult();
}
const concurrencyManager = DBOS.registerWorkflow(concurrencyManagerFunc, { name: "concurrencyManager" });

async function processTaskFunc(task: Task) {
    // ...
}
const processTask = DBOS.registerWorkflow(processTaskFunc, { name: "processTask" });
```

### Deduplication

You can set a deduplication ID for an enqueued workflow as an argument to `DBOS.startWorkflow`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDuplicatedError` exception.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

Example syntax:

```javascript
const queue = new WorkflowQueue("example_queue");

async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction, {"name": "taskWorkflow"});

async function main() {
  const task = ...
  const dedup: string = ...
  try {
    const handle = await DBOS.startWorkflow(taskWorkflow, {queueName: queue.name, enqueueOptions: {deduplicationID: dedup}})(task);
  } catch (e) {
    // Handle DBOSQueueDuplicatedError
  }
}
```

### Priority

You can set a priority for an enqueued workflow as an argument to `DBOS.startWorkflow`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
If using priority, you must set `usePriority: true` on your queue.

:::tip
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
:::

Example syntax:

```javascript
const queue = new WorkflowQueue("example_queue", {usePriority: true});

async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction, {"name": "taskWorkflow"});

async function main() {
  const task = ...
  const priority: number = ...
  const handle = await DBOS.startWorkflow(taskWorkflow, {queueName: queue.name, enqueueOptions: {priority: priority}})(task);
}
```

## Explicit Queue Listening

By default, a process running DBOS listens to (dequeues workflows from) all declared queues.
However, sometimes you only want a process to listen to a specific list of queues.
You can configure `listenQueues` in your [DBOS configuration](../reference/configuration.md) to explicitly tell a process running DBOS to only listen to a specific set of queues.

This is particularly useful when managing heterogeneous workers, where specific tasks should execute on specific physical servers.
For example, say you have a mix of CPU workers and GPU workers and you want CPU tasks to only execute on CPU workers and GPU tasks to only execute on GPU workers.
You can create separate queues for CPU and GPU tasks and configure each type of worker to only listen to the appropriate queue:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const cpuQueue = new WorkflowQueue("cpu_queue");
const gpuQueue = new WorkflowQueue("gpu_queue");

async function main() {
  const workerType = process.env.WORKER_TYPE; // "cpu" or "gpu"
  const config = // ...

  if (workerType === "gpu") {
    // GPU workers will only dequeue and execute workflows from the GPU queue
    config.listenQueues = [gpuQueue];
  } else if (workerType === "cpu") {
    // CPU workers will only dequeue and execute workflows from the CPU queue
    config.listenQueues = [cpuQueue];
  }

  DBOS.setConfig(config);
  await DBOS.launch();
}
```

Note that `listenQueues` only controls what workflows are dequeued, not what workflows can be enqueued, so you can freely enqueue tasks onto the GPU queue from a CPU worker for execution on a GPU worker, and vice versa.