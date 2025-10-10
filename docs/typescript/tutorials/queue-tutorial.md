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
