---
sidebar_position: 45
title: Queues & Parallelism
toc_max_heading_level: 3
---

Queues allow you to run functions with managed concurrency.
They are useful for controlling the number of functions run in parallel, or the rate at which functions are started.

To create a queue, specify its name:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue");
```

You can then enqueue any workflow by passing the queue as an argument to `DBOS.startWorkflow`.
Enqueuing a function submits it for execution and returns a [handle](../reference/transactapi/workflow-handles.md) to it.
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
const taskWorkflow = DBOS.registerWorkflow(taskFunction, "taskWorkflow");

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
const queueWorkflow = DBOS.registerWorkflow(queueFunction, "queueWorkflow")
```

### Enqueue with DBOSClient

[`DBOSClient`](../reference/client.md) provides a way to programmatically interact with your DBOS application from external code.
Among other things, this allows you to enqueue workflows from outside your DBOS application.

Since `DBOSClient` is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

Example: 

```ts
import { DBOSClient } from "@dbos-inc/dbos-sdk";

const client = await DBOSClient.create(process.env.DBOS_DATABASE_URL);

type ProcessTask = typeof Tasks.processTask;
await client.enqueue<ProcessTask>(
    {
        workflowName: 'processTask',
        workflowClassName: 'Tasks',
        queueName: 'example_queue',
    }, 
    task);
```


### Reliability Guarantees

Because queues use DBOS [workflows](./workflow-tutorial.md), they provide the following reliability guarantees for enqueued functions.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Enqueued functions always run to completion.  If a DBOS process crashes and is restarted at any point after a function is enqueued, it resumes the enqueued function from the last completed step.
2.  [Steps](./step-tutorial.md) called from enqueued workflows are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed, it will never be re-executed.
3.  [Transactions](./transaction-tutorial.md) called from enqueued workflows commit _exactly once_.

### Managing Concurrency

You can specify the _concurrency_ of a queue, the maximum number of functions from this queue that may run concurrently, at two scopes: global and per process.
Global concurrency limits are applied across all DBOS processes using this queue.
Per process concurrency limits are applied to each DBOS process using this queue.
If no limit is provided, any number of functions may run concurrently.
For example, this queue has a maximum global concurrency of 10 and a per process maximum concurrency of 5, so at most 10 functions submitted to it may run at once, up to 5 per process:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue", { concurrency: 10, workerConcurrency: 5 });
```

You may want to specify a maximum concurrency if functions in your queue submit work to an external process with limited resources.
The concurrency limit guarantees that even if many functions are submitted at once, they won't overwhelm the process.

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
const taskWorkflow = DBOS.registerWorkflow(taskFunction, "taskWorkflow");

async function main() {
  const task = ...
  const timeout = ... // Timeout in milliseconds
  const handle = await DBOS.startWorkflow(taskWorkflow, {queueName: queue.name, timeoutMS: timeout})(task);
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
const taskWorkflow = DBOS.registerWorkflow(taskFunction, "taskWorkflow");

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
const taskWorkflow = DBOS.registerWorkflow(taskFunction, "taskWorkflow");

async function main() {
  const task = ...
  const priority: number = ...
  const handle = await DBOS.startWorkflow(taskWorkflow, {queueName: queue.name, enqueueOptions: {priority: priority}})(task);
}
```

### In-Order Processing

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

// Launch DBOS and start the Express.js server
async function main() {
  await DBOS.launch({ expressApp: app });
  app.listen(3000, () => {});
}

main().catch(console.log);
```
