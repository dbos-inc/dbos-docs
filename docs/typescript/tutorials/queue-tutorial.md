---
sidebar_position: 45
title: Queues & Parallelism
---

Queues allow you to ensure that functions will be run, without starting them immediately.
Queues are useful for controlling the number of functions run in parallel, or the rate at which functions are started.

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
const queue = new WorkflowQueue("example_queue");

class Tasks {
  @DBOS.workflow()
  static async processTask(task) {
    // ...
  }

  @DBOS.workflow()
  async function processTasks(tasks) {
    const handles = []

    // Enqueue each task so all tasks are processed concurrently.
    for (const task of tasks) {
      handles.push(await DBOS.startWorkflow(Tasks, {queueName: queue.name}).processTask(task));
    }

    // Wait for each task to complete and retrieve its result.
    // Return the results of all tasks.
    const results = [];
    for (const h of handles) {
      results.push(await h.getResult());
    }
    return results;
  }
}
```

### Managing Concurrency

You can specify the _concurrency_ of a queue, the maximum number of functions from this queue that may run concurrently.
Concurrency limits are global across all DBOS processes using this queue.
If no limit is provided, any number of functions may run concurrently.
For example, this queue has a maximum concurrency of 10, so at most 10 functions submitted to it may run at once:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue", 10);
```

You may want to specify a maximum concurrency if functions in your queue submit work to an external process with limited resources.
The concurrency limit guarantees that even if many functions are submitted at once, they won't overwhelm the process.

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 50 with a period of 30 seconds, so it may not start more than 50 functions in 30 seconds:

```javascript
const queue = new WorkflowQueue("example_queue", 10, {limitPerPeriod: 50, periodSec: 30});
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

### In-Order Processing

You can use a queue with `concurrency=1` to guarantee sequential, in-order processing of events.
Only a single event will be processed at a time.
For example, this app processes events sequentially in the order of their arrival:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";
import express from "express";

const serialQueue = new WorkflowQueue("in_order_queue", 1);
const app = express();

class Tasks {
  @DBOS.workflow()
  static async processTask(task){
    // ...
  }
}

app.get("/events/:event", async (req, res) => {
  await DBOS.startWorkflow(Tasks, {queueName: serialQueue.name}).processTask(req.params);
});

// Launch DBOS and start the Express.js server
async function main() {
  await DBOS.launch({ expressApp: app });
  app.listen(3000, () => {});
}

main().catch(console.log);
```