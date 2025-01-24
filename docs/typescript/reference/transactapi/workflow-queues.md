---
sidebar_position: 30
title: Workflow Queues
---

Workflow queues allow you to ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

Queues should be created when your application module is loaded.  This ensures that the queue information is available for the DBOS runtime when it is initialized, and begins handling the queued workflow records.

### class WorkflowQueue

```typescript
interface QueueRateLimit {
    limitPerPeriod: number;
    periodSec: number;
}

interface QueueParameters {
    workerConcurrency?: number;
    concurrency?: number;
    rateLimit?: QueueRateLimit;
}

class WorkflowQueue {
   constructor(name: string, queueParameters: QueueParameters);
}
```

**Parameters:**
- `name`: The name of the queue.  Must be unique among all queues in the application.
- `concurrency`: The maximum number of workflows from this queue that may run concurrently. Default to infinity.
This concurrency limit is global across all DBOS processes using this queue.
- `workerConcurrency`: The maximum number of workflows from this queue that may run concurrently within a single DBOS process. Must be less than or equal to `concurrency`.
- `rateLimit`: A limit on the maximum number of functions which may be started in a given period.
  - `rateLimit.limitPerPeriod`: The number of workflows that may be started within the specified time period.
  - `rateLimit.periodSec`: The time period across which `limitPerPeriod` applies.

**Example syntax:**

This queue may run no more than 10 functions concurrently and may not start more than 50 functions per 30 seconds:

```typescript
const queue = new WorkflowQueue(
    "example_queue",
    {
        concurrency: 10,
        workerConcurrency: 5,
        rateLimit: { limitPerPeriod: 50, periodSec: 30 }
    },
);
```


### Enqueueing Workflows

Workflows are enqueued with the [`DBOS.startWorkflow`](./dbos-class#starting-background-workflows) function, by providing a `queueName` argument.

This enqueues a function for processing and returns a [handle](./workflow-handles.md) to it.

The `DBOS.startWorkflow` method durably enqueues your function; after it returns, your function is guaranteed to eventually execute even if your app is interrupted.

**Example syntax:**

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

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
