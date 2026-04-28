---
sidebar_position: 40
title: Queues
---

Workflow queues allow you to ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

Queue configuration is persisted to the system database, so any DBOS process or [`DBOSClient`](./client.md) connected to the same system database can register, retrieve, and reconfigure queues.

## Queue Management

### DBOS.registerQueue

```typescript
DBOS.registerQueue(
  name: string,
  options?: RegisterQueueOptions,
): Promise<WorkflowQueue>

interface RegisterQueueOptions {
  concurrency?: number;
  workerConcurrency?: number;
  rateLimit?: QueueRateLimit;
  priorityEnabled?: boolean;
  partitionQueue?: boolean;
  minPollingIntervalMs?: number;
  onConflict?: QueueConflictResolution;
}

interface QueueRateLimit {
  limitPerPeriod: number;
  periodSec: number;
}

type QueueConflictResolution =
  | 'update_if_latest_version'
  | 'always_update'
  | 'never_update';
```

Register a queue and persist its configuration to the system database, returning a [`WorkflowQueue`](#class-workflowqueue).
DBOS must be launched before calling `registerQueue`.
If the queue already exists in the database, the `onConflict` option controls whether its configuration is overwritten.

**Parameters:**
- **name**: The name of the queue. Must be unique among all queues in the application.
- **concurrency**: The maximum number of workflows from this queue that may run concurrently across all DBOS processes. Defaults to no limit.
- **workerConcurrency**: The maximum number of workflows from this queue that may run concurrently within a single DBOS process. Must be less than or equal to `concurrency`.
- **rateLimit**: A limit on the maximum number of functions which may be started in a given period.
  - **rateLimit.limitPerPeriod**: The number of workflows that may be started within the specified time period.
  - **rateLimit.periodSec**: The time period across which `limitPerPeriod` applies.
- **priorityEnabled**: Enable setting priority for workflows on this queue.
- **partitionQueue**: Enable [partitioning](../tutorials/queue-tutorial.md#partitioning-queues) for this queue.
- **minPollingIntervalMs**: The minimum interval, in milliseconds, between dequeue attempts for this queue. Defaults to 1000ms. The actual polling interval includes random jitter and increases with backoff under contention, then scales back down when contention clears.
- **onConflict**: How to behave when a queue with this name already exists in the system database:
  - `'update_if_latest_version'` (default): overwrite the existing configuration only if the running application is the latest registered [application version](./methods.md#version-management). This prevents older versions in a rolling deploy from overwriting a newer configuration.
  - `'always_update'`: always overwrite the existing configuration.
  - `'never_update'`: leave the existing configuration unchanged. The returned queue reflects the persisted configuration, not the supplied parameters.

**Example syntax:**

```typescript
const queue = await DBOS.registerQueue("email", {
  concurrency: 10,
  rateLimit: { limitPerPeriod: 100, periodSec: 60 },
});
```

### DBOS.retrieveQueue

```typescript
DBOS.retrieveQueue(name: string): Promise<WorkflowQueue | null>
```

Retrieve a queue by name from the system database, or `null` if no queue with that name has been registered.

**Example syntax:**

```typescript
const queue = await DBOS.retrieveQueue("email");
if (queue !== null) {
  console.log(await queue.getConcurrency());
}
```

### DBOS.deleteQueue

```typescript
DBOS.deleteQueue(name: string): Promise<void>
```

Delete a queue from the system database. No-op if no queue with that name exists.

:::warning
Workflows already enqueued on a deleted queue can no longer be dequeued, executed, or recovered.
Cancel or drain pending workflows on the queue before deleting it.
:::

## class WorkflowQueue

A `WorkflowQueue` is returned from [`DBOS.registerQueue`](#dbosregisterqueue) or [`DBOS.retrieveQueue`](#dbosretrievequeue).
Its cached fields reflect the queue's configuration as of the most recent read from the database; use the `getX` methods to refresh from the database, and the `setX` methods to update.

```typescript
class WorkflowQueue {
  readonly name: string;

  // Cached configuration. May be stale if another process has reconfigured
  // the queue. Use the getX methods below to refresh from the database.
  concurrency?: number;
  workerConcurrency?: number;
  rateLimit?: QueueRateLimit;
  priorityEnabled: boolean;
  partitionQueue: boolean;
  minPollingIntervalMs?: number;

  // Read the latest values from the database.
  getConcurrency(): Promise<number | undefined>;
  getWorkerConcurrency(): Promise<number | undefined>;
  getRateLimit(): Promise<QueueRateLimit | undefined>;
  getPriorityEnabled(): Promise<boolean>;
  getPartitionQueue(): Promise<boolean>;
  getMinPollingIntervalMs(): Promise<number | undefined>;

  // Update the configuration in the database.
  setConcurrency(value: number | undefined): Promise<void>;
  setWorkerConcurrency(value: number | undefined): Promise<void>;
  setRateLimit(value: QueueRateLimit | undefined): Promise<void>;
  setPriorityEnabled(value: boolean): Promise<void>;
  setPartitionQueue(value: boolean): Promise<void>;
  setMinPollingIntervalMs(value: number): Promise<void>;
}
```

### Reconfiguring Queues

Because queue configuration lives in the system database, you can change a queue's configuration at runtime without redeploying or restarting your workers.
Workers pick up the new configuration on their next polling iteration.

```typescript
const queue = await DBOS.retrieveQueue("email");
if (queue !== null) {
  await queue.setConcurrency(50);
  await queue.setRateLimit({ limitPerPeriod: 500, periodSec: 60 });
}
```

The `setX` methods may only be called on a queue returned from `DBOS.registerQueue`, `DBOS.retrieveQueue`, or the equivalent [`DBOSClient`](./client.md) methods.
Calling them on a queue created with the legacy `new WorkflowQueue(...)` constructor throws an error.

## Enqueueing Workflows

Workflows are enqueued by providing a `queueName` argument to [`DBOS.startWorkflow`](./methods.md#dbosstartworkflow).
This enqueues a function for processing and returns a [handle](./methods.md#workflow-handles) to it.
Through arguments to `DBOS.startWorkflow`, you can optionally provide a custom priority or deduplication ID to an enqueued workflow.

The `DBOS.startWorkflow` method durably enqueues your function; after it returns, your function is guaranteed to eventually execute even if your app is interrupted.

**Example syntax:**

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";

async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction, {"name": "taskWorkflow"});

async function queueFunction(tasks) {
  await DBOS.registerQueue("example_queue");
  const handles = []

  // Enqueue each task so all tasks are processed concurrently.
  for (const task of tasks) {
    handles.push(await DBOS.startWorkflow(taskWorkflow, { queueName: "example_queue" })(task))
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
import { DBOS } from "@dbos-inc/dbos-sdk";

class Tasks {
  @DBOS.workflow()
  static async processTask(task) {
    // ...
  }

  @DBOS.workflow()
  static async processTasks(tasks) {
    await DBOS.registerQueue("example_queue");
    const handles = []

    // Enqueue each task so all tasks are processed concurrently.
    for (const task of tasks) {
      handles.push(await DBOS.startWorkflow(Tasks, { queueName: "example_queue" }).processTask(task));
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

## Legacy: In-Memory Queues

```typescript
class WorkflowQueue {
  constructor(name: string, queueParameters?: QueueParameters);
}

interface QueueParameters {
  workerConcurrency?: number;
  concurrency?: number;
  rateLimit?: QueueRateLimit;
  priorityEnabled?: boolean;
  partitionQueue?: boolean;
  minPollingIntervalMs?: number;
}
```

The `new WorkflowQueue(...)` constructor declares an in-memory queue whose configuration is fixed at construction and lives only in process memory.
It must be called before `DBOS.launch()`, and the resulting queue cannot be reconfigured at runtime.

:::warning
This API is deprecated. Use [`DBOS.registerQueue`](#dbosregisterqueue) instead.
:::

```typescript
const queue = new WorkflowQueue(
    "example_queue",
    {
        workerConcurrency: 5,
        rateLimit: { limitPerPeriod: 50, periodSec: 30 }
    },
);
```
