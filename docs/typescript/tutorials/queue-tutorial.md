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
const queue = new WorkflowQueue("example_queue");

class Tasks {
  @DBOS.workflow()
  static async processTask(task) {
    // ...
  }

  @DBOS.workflow()
  static async processTasks(tasks) {
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

### Queue Management

Because DBOS manages queues in Postgres, you can view and manage queued functions from the command line.
These commands are also available for applications deployed to DBOS Cloud using the [cloud CLI](../../cloud-tutorials/cloud-cli.md).

#### Listing Queued Functions

You can list all currently enqueued functions with:

```shell
npx dbos workflow list
```

By default, this lists all currently enqueued functions, including queued functions that are currently executing, but not completed functions
You can parameterize this command for advanced search, see full documentation [here](../reference/tools/cli.md#dbos-workflow-queue-list).

#### Removing Queued Functions

You can remove a function from a queue with:

```shell
npx dbos workflow cancel <workflow-id>
```

This removes the function from its queue and transitions it to a `CANCELLED` state, so it will not run unless manually resumed.

#### Resuming Workflows

You can start execution of an enqueued function with:

```shell
npx dbos workflow resume <workflow-id>
```

This starts execution immediately, bypassing the queue and transitioning the function to a `PENDING` state.
It also removes the function from its queue.
