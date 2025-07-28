---
sidebar_position: 40
title: Queues
---

Workflow queues allow you to ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

All queues should be created before `DBOS.launch()` is called.

### class WorkflowQueue

```typescript
class WorkflowQueue {
   constructor(name: string, queueParameters: QueueParameters);
}

interface QueueParameters {
  workerConcurrency?: number;
  concurrency?: number;
  rateLimit?: QueueRateLimit;
  priorityEnabled?: boolean;
}

interface QueueRateLimit {
  limitPerPeriod: number;
  periodSec: number;
}

```

**Parameters:**
- **name**: The name of the queue.  Must be unique among all queues in the application.
- **concurrency**: The maximum number of workflows from this queue that may run concurrently. Defaults to no limit.
This concurrency limit is global across all DBOS processes using this queue.
- **workerConcurrency**: The maximum number of workflows from this queue that may run concurrently within a single DBOS process. Must be less than or equal to `concurrency`.
- **rateLimit**: A limit on the maximum number of functions which may be started in a given period.
  - **rateLimit.limitPerPeriod**: The number of workflows that may be started within the specified time period.
  - **rateLimit.periodSec**: The time period across which `limitPerPeriod` applies.
- **priorityEnabled**: Enable setting priority for workflows on this queue.

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

Workflows are enqueued by providing a `queueName` argument to [`DBOS.startWorkflow`](./methods.md#dbosstartworkflow).
This enqueues a function for processing and returns a [handle](./methods.md#workflow-handles) to it.
Through arguments to `DBOS.startWorkflow`, you can optionally provide a custom priority or deduplication ID to an enqueued workflow.

The `DBOS.startWorkflow` method durably enqueues your function; after it returns, your function is guaranteed to eventually execute even if your app is interrupted.

**Example syntax using registered workflows:**

```typescript
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
const queueWorkflow = DBOS.registerWorkflow(queueFunction, {"name": "taskWorkflow"})
```

**Example syntax using decorated workflows:**

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

