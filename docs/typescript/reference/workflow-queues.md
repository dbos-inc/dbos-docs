---
sidebar_position: 17
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

class WorkflowQueue {
    constructor(
        readonly name: string,
        readonly concurrency?: number,
        readonly rateLimit?: QueueRateLimit
    );
}
```

**Parameters:**
- `name`: The name of the queue.  Must be unique among all queues in the application.
- `concurrency`: The maximum number of workflows from this queue that may run concurrently.
This concurrency limit is global across all DBOS processes using this queue.
If not provided, any number of functions may run concurrently.
- `rateLimit`: A limit on the maximum number of functions which may be started in a given period.
- `rateLimit.limitPerPeriod`: The number of workflows that may be started within the specified time period.
- `rateLimit.periodSec`: The time period across which `limitPerPeriod` applies.

**Example syntax:**

This queue may run no more than 10 functions concurrently and may not start more than 50 functions per 30 seconds:

```typescript
const queue = new WorkflowQueue("example_queue", 10, {limitPerPeriod: 50, periodSec: 30});
```


### Enqueueing Workflows

Workflows are enqueued with the `startWorkflow` family of functions, with an additional `queue` argument:
- [HandlerContext.startWorkflow](../reference/contexts.md#handlerctxtstartworkflow)
- [WorkflowContext.startWorkflow](../reference/contexts.md#workflowctxtstartworkflow)
- [TestingRuntime.startWorkflow](../reference/testing-runtime.md#runtimestartworkflowtarget-workflowuuid-params)

Enqueue a function for processing and return a [handle](../reference/workflow-handles.md) to it.
The `startWorkflow` method durably enqueues your function; after it returns, your function is guaranteed to eventually execute even if your app is interrupted.

**Example syntax:**

```python
await ctx.startWorkflow(TestChildWFs, undefined, childqueue).testChildWF(var1)
from dbos import DBOS, Queue

queue = Queue("example_queue")

@DBOS.step()
def process_task(task):
  ...

@DBOS.workflow()
def process_tasks(tasks):
  task_handles = []
  # Enqueue each task so all tasks are processed concurrently.
  for task in tasks:
    handle = queue.enqueue(process_task, task)
    task_handles.append(handle)
  # Wait for each task to complete and retrieve its result.
  # Return the results of all tasks.
  return [handle.get_result() for handle in task_handles]
```