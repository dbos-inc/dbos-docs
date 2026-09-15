---
sidebar_position: 200
title: Upgrading to 5.0
toc_max_heading_level: 3
---

DBOS TypeScript 5.0 removes features that were deprecated in DBOS TypeScript 4.x.
This guide describes each removed feature and what to replace it with, as well as how to safely upgrade a running application.
All the replacements described here are also available in DBOS 4.27, so you can migrate your code before you upgrade.

## Upgrading a Running Application

DBOS 5.0 changes the storage schema for workflow inputs and outputs to improve performance.
Therefore, DBOS 5.0 can process workflows created by DBOS 4.x, but **DBOS 4.x cannot process workflows created by DBOS 5.0**.
Therefore:

- **Don't run DBOS 4.x and 5.0 processes concurrently with the same application version.**
If you set `applicationVersion` yourself, change it when you upgrade.
If you use [patching](./tutorials/upgrading-workflows.md#patching), shut down all DBOS 4.x processes before launching DBOS 5.0 processes.
- **Upgrade applications that use [`DBOSClient`](./reference/client.md) along with your DBOS processes.**
A DBOS 4.x client cannot retrieve the inputs or results of workflows created by DBOS 5.0.
A DBOS 5.0 client requires the new schema, so launch a DBOS 5.0 process (or run [`npx dbos schema`](./reference/cli.md#npx-dbos-schema)) before using it.

## Removed Features

### In-Memory Queues

The `new WorkflowQueue(...)` constructor, which declared a queue in process memory, has been removed.
Instead, register queues in the system database with [`DBOS.registerQueue`](./reference/queues.md#dbosregisterqueue) after launching DBOS, then enqueue workflows by queue name.

**Before:**

```typescript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue", { workerConcurrency: 5 });

async function processTaskFunction(task: string) {
  // ...
}
const processTask = DBOS.registerWorkflow(processTaskFunction);

await DBOS.launch();
const handle = await DBOS.startWorkflow(processTask, { queueName: queue.name })(task);
```

**After:**

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";

async function processTaskFunction(task: string) {
  // ...
}
const processTask = DBOS.registerWorkflow(processTaskFunction);

await DBOS.launch();
await DBOS.registerQueue("example_queue", { workerConcurrency: 5 });
const handle = await DBOS.startWorkflow(processTask, { queueName: "example_queue" })(task);
```

When migrating your queues, note that:

- Register every queue your application previously declared in memory.
Workflows enqueued on a queue that isn't registered stay `ENQUEUED` until the queue is registered.
- The [`listenQueues`](./tutorials/queue-tutorial.md#explicit-queue-listening) configuration field now accepts only queue names, not `WorkflowQueue` objects.
- Queue names starting with `_dbos_` are reserved for DBOS.

For more on queues, see the [queues tutorial](./tutorials/queue-tutorial.md).

### Legacy Partitioned Queues

The `partitionQueue` option of `DBOS.registerQueue` and `DBOSClient.registerQueue` has been removed.
Instead, a queue is [partitioned](./tutorials/queue-tutorial.md#partitioning-queues) if you set any per-partition limit.
With `partitionQueue: true`, the `concurrency`, `workerConcurrency`, and `rateLimit` options applied to each partition.
Replace them with `partitionConcurrency`, `partitionWorkerConcurrency`, and `partitionRateLimit`.

**Before:**

```typescript
await DBOS.registerQueue("partitioned_queue", { partitionQueue: true, concurrency: 1 });
```

**After:**

```typescript
await DBOS.registerQueue("partitioned_queue", { partitionConcurrency: 1 });
```

Unlike legacy partitioned queues, a partitioned queue can also have queue-wide limits, as described in [Combining Queue-Wide and Per-Partition Limits](./tutorials/queue-tutorial.md#combining-queue-wide-and-per-partition-limits).

The `priorityEnabled` option has also been removed.
[Priority](./tutorials/queue-tutorial.md#priority) is now always enabled.

### Static Scheduling

The `@DBOS.scheduled` decorator and the `DBOS.registerScheduled` method have been removed.
Instead, create schedules in the system database with [`DBOS.applySchedules`](./reference/methods.md#dbosapplyschedules) or [`DBOS.createSchedule`](./reference/methods.md#dboscreateschedule).
The second argument of a scheduled workflow is now the schedule's `context` instead of the time at which the workflow actually started.
To run a workflow once for every interval, even ones that passed while your application was offline, set `automaticBackfill: true` instead of using `SchedulerMode.ExactlyOncePerInterval`.

**Before:**

```typescript
async function myPeriodicTaskFunction(scheduledTime: Date, startTime: Date) {
  // ...
}
const myPeriodicTask = DBOS.registerWorkflow(myPeriodicTaskFunction);
DBOS.registerScheduled(myPeriodicTask, { crontab: "*/5 * * * *" });
```

**After:**

```typescript
async function myPeriodicTaskFunction(scheduledTime: Date, context: unknown) {
  // ...
}
const myPeriodicTask = DBOS.registerWorkflow(myPeriodicTaskFunction);

await DBOS.launch();
await DBOS.applySchedules([
  {
    scheduleName: "my-periodic-task",
    workflowFn: myPeriodicTask,
    schedule: "*/5 * * * *",
  },
]);
```

Schedules persist in the system database, so a schedule you stop applying keeps running until you delete it with [`DBOS.deleteSchedule`](./reference/methods.md#dbosdeleteschedule).
To learn more, see the [scheduling tutorial](./tutorials/scheduled-workflows.md).

### Calling Steps Outside Workflows

In DBOS 4.x, calling a `@DBOS.step()` method outside a workflow, or starting or enqueuing it with `DBOS.startWorkflow`, ran it as its own durable workflow.
In DBOS 5.0, calling a step outside a workflow runs it as an ordinary function, without checkpoints or retries, and starting or enqueuing a step throws an error.
Instead, call the step from a [workflow](./tutorials/workflow-tutorial.md) and run that workflow.

**Before:**

```typescript
class Payments {
  @DBOS.step({ retriesAllowed: true, maxAttempts: 5 })
  static async chargeCard(orderId: string): Promise<string> {
    return await paymentApi.charge(orderId);
  }
}

await Payments.chargeCard(orderId);
```

**After:**

```typescript
class Payments {
  @DBOS.step({ retriesAllowed: true, maxAttempts: 5 })
  static async chargeCard(orderId: string): Promise<string> {
    return await paymentApi.charge(orderId);
  }

  @DBOS.workflow()
  static async chargeCardWorkflow(orderId: string): Promise<string> {
    return await Payments.chargeCard(orderId);
  }
}

await Payments.chargeCardWorkflow(orderId);
```

:::warning
DBOS 5.0 cannot recover these step workflows created by DBOS 4.x, whose names start with `temp_workflow-`.
Before upgrading, wait for any that are pending or enqueued to complete, or cancel them.
:::

### Configuration From `dbos-config.yaml`

DBOS no longer reads `dbos-config.yaml` when it launches.
Instead, configure DBOS with [`DBOS.setConfig`](./reference/dbos-class.md#dbossetconfig) before calling `DBOS.launch()`.
The `name` field is now required.

**Before:**

```yaml
# dbos-config.yaml
name: my-app
language: node
system_database_url: ${DBOS_SYSTEM_DATABASE_URL}
```

```typescript
await DBOS.launch();
```

**After:**

```typescript
DBOS.setConfig({
  name: "my-app",
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
});
await DBOS.launch();
```

The [DBOS CLI](./reference/cli.md) and [DBOS Cloud](../production/dbos-cloud/deploying-to-cloud.md) still use [`dbos-config.yaml`](./reference/configuration.md#dbos-configuration-file).

### HTTP Serving and Role-Based Authorization

The `@dbos-inc/koa-serve` package, `DBOS.request`, `DBOS.runWithContext`, and the `@DBOS.requiredRole` and `@DBOS.defaultRequiredRole` decorators have been removed.
Instead, serve requests with the web framework of your choice and call or start workflows from your request handlers, passing them any request data they need as arguments, as shown in [Add DBOS To Your App](./integrating-dbos.md#2-launch-dbos-in-your-app).

To associate an authenticated user and roles with a workflow, run it inside [`DBOS.withAuthedContext`](./reference/plugins.md#setting-authenticated-user-and-roles), then check `DBOS.authenticatedRoles` in your workflow.

**Before:**

```typescript
class Orders {
  @DBOS.requiredRole(["admin"])
  @DBOS.workflow()
  static async refundOrder(orderId: string): Promise<string> {
    // ...
  }
}
```

**After:**

```typescript
class Orders {
  @DBOS.workflow()
  static async refundOrder(orderId: string): Promise<string> {
    if (!DBOS.authenticatedRoles.includes("admin")) {
      throw new Error(`User ${DBOS.authenticatedUser} is not authorized to refund orders`);
    }
    // ...
  }
}

await DBOS.withAuthedContext(user, roles, () => Orders.refundOrder(orderId));
```

### Other Removed Packages

The following packages have been removed and will not be released for DBOS 5.0:

- **`@dbos-inc/sqs-receive`**: Instead, receive messages with the AWS SDK and start a workflow for each message, using the message ID as the [workflow ID](./tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) so each message is processed exactly once.
- **`@dbos-inc/pgnotifier-receiver`**: Instead, enqueue workflows directly from a Postgres trigger with [`dbos.enqueue_workflow`](./tutorials/queue-tutorial.md#enqueueing-from-plpgsql).
- **`@dbos-inc/aws-s3-workflows`**: Instead, call the AWS SDK from your own [steps](./tutorials/step-tutorial.md).
