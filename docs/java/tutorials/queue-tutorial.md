---
sidebar_position: 30
title: Queues & Concurrency
toc_max_heading_level: 4
---

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

Register a queue with [`dbos.registerQueue`](../reference/queues.md#dbosregisterqueue), specifying its name and options.
Queues must be registered **after** [`dbos.launch()`](../reference/lifecycle.md).
Queue configuration is persisted to the system database, so queues are visible to every DBOS process connected to that database.

```java
dbos.launch();
dbos.registerQueue("example-queue", QueueOptions.empty());
```

You can then enqueue any workflow using [`withQueue`](../reference/workflows-steps.md#startworkflow) when calling `startWorkflow`.
Enqueuing a workflow submits it for execution and returns a [handle](../reference/workflows-steps.md#workflowhandle) to it.
Queued tasks are started in [priority](#priority) order, and in first-in, first-out (FIFO) order among tasks of the same priority.

```java
class ExampleImpl implements Example {
  @Workflow
  public String processTask(String task) {
    // Process the task...
    return "Processed: " + task;
  }
}

public String example(DBOS dbos, String queue, Example proxy, String task) 
    throws Exception {
  // Enqueue a workflow
  WorkflowHandle<String, RuntimeException> handle = dbos.startWorkflow(
    () -> proxy.processTask(task),
    new StartWorkflowOptions().withQueue(queue)
  );

  // Get the result
  String result = handle.getResult();
  System.out.println("Task result: " + result);
  return result;
}
```

:::tip
`new StartWorkflowOptions("example-queue")` sets the workflow **ID**, not the queue.
To name a queue in the constructor, pass a [`QueueName`](../reference/queues.md#queuename): `new StartWorkflowOptions(QueueName.of("example-queue"))`.
:::

### Queue Example

Here's an example of a workflow using a queue to process tasks concurrently:

```java
interface Example {
  public String taskWorkflow(String task);
  public List<String> queueWorkflow(String[] tasks) throws Exception;
}

class ExampleImpl implements Example {

  private final DBOS dbos;
  private String queueName;
  private Example self;

  public ExampleImpl(DBOS dbos) {
    this.dbos = dbos;
  }

  public void setQueueName(String queueName) {
    this.queueName = queueName;
  }

  public void setSelf(Example self) {
    this.self = self;
  }

  @Workflow
  public String taskWorkflow(String task) {
    // Process the task...
    return "Processed: " + task;
  }

  @Workflow
  public List<String> queueWorkflow(String[] tasks) throws Exception {
    // Enqueue each task so all tasks are processed concurrently
    List<WorkflowHandle<String, RuntimeException>> handles = new ArrayList<>();
    for (String task : tasks) {
      WorkflowHandle<String, RuntimeException> handle = dbos.startWorkflow(
        () -> self.taskWorkflow(task),
        new StartWorkflowOptions().withQueue(queueName)
      );
      handles.add(handle);
    }

    // Wait for each task to complete and retrieve its result
    List<String> results = new ArrayList<>();
    for (WorkflowHandle<String, RuntimeException> handle : handles) {
      String result = handle.getResult();
      results.add(result);
    }

    return results;
  }
}

public class App {
  public static void main(String[] args) throws Exception {
    DBOSConfig config = ...
    DBOS dbos = new DBOS(config);

    // Instantiate an Example and register its workflows
    ExampleImpl impl = new ExampleImpl(dbos);
    Example proxy = dbos.registerProxy(Example.class, impl);
    // Provide the workflow proxy to the class so its methods can invoke workflows
    impl.setSelf(proxy);

    dbos.launch();

    // Register the queue
    dbos.registerQueue("example-queue", QueueOptions.empty());
    impl.setQueueName("example-queue");

    // Run the queue workflow
    String[] tasks = {"task1", "task2", "task3", "task4", "task5"};
    List<String> results = proxy.queueWorkflow(tasks);
    for (String result : results) {
      System.out.println(result);
    }
  }
}
```

Sometimes, you may wish to receive the result of each task as soon as it's ready instead of waiting for all tasks to complete.
You can do this using [`send` and `recv`](./workflow-communication.md#workflow-messaging-and-notifications).
Each enqueued workflow sends a message to the main workflow when it's done processing its task.
The main workflow awaits those messages, retrieving the result of each task as soon as the task completes.

```java
interface Example {
  public String processTask(String parentWorkflowId, int taskId, String task);
  public List<String> processTasks(String[] tasks) throws Exception;
}

class ExampleImpl implements Example {
  private static final String TASK_COMPLETE_TOPIC = "task_complete";

  private final DBOS dbos;
  private final String queueName;
  private Example self;

  public ExampleImpl(DBOS dbos, String queueName) {
    this.dbos = dbos;
    this.queueName = queueName;
  }

  public void setSelf(Example self) {
    this.self = self;
  }

  @Workflow
  public String processTask(String parentWorkflowId, int taskId, String task) {
    String result = "Processed: " + task; // Process the task

    // Notify the main workflow this task is complete
    dbos.send(parentWorkflowId, taskId, TASK_COMPLETE_TOPIC, null);
    return result;
  }

  @Workflow
  public List<String> processTasks(String[] tasks) throws Exception {
    String parentWorkflowId = DBOS.workflowId();

    List<WorkflowHandle<String, Exception>> handles = new ArrayList<>();
      for (int i = 0; i < tasks.length; i++) {
        final int taskId = i;
        final String task = tasks[i];
        WorkflowHandle<String, Exception> handle = dbos.startWorkflow(
          () -> self.processTask(parentWorkflowId, taskId, task),
          new StartWorkflowOptions().withQueue(queueName)
        );
        handles.add(handle);
    }

    List<String> results = new ArrayList<>();
    while (results.size() < tasks.length) {
      // Wait for a notification that a task is complete
      Integer completedTaskId = dbos.<Integer>recv(TASK_COMPLETE_TOPIC, Duration.ofMinutes(5)).orElse(null);
      if (completedTaskId == null) {
        throw new RuntimeException("Timeout waiting for task completion");
      }
      // Retrieve result of the completed task
      WorkflowHandle<String, Exception> completedTaskHandle = handles.get(completedTaskId);
      String result = completedTaskHandle.getResult();
      System.out.println("Task " + completedTaskId + " completed. Result: " + result);
      results.add(result);
    }
    return results;
  }
}
```

#### Enqueueing from Another Application

Often, you want to enqueue a workflow from another DBOS application or from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

If both applications [share a system database](../../explanations/sharing-a-system-database.md), a DBOS application can enqueue another application's workflow with `dbos.enqueueWorkflow`.
Because the workflow is implemented elsewhere, workflow and queue metadata must be specified explicitly with [`EnqueueOptions`](../reference/client.md#enqueueoptions), and `withApplicationName` names the application that should run it:

```java
var options = new EnqueueOptions(
  "dataPipeline",                  // Workflow name
  "com.example.DataPipelineImpl",  // Class name
  QueueName.of("pipelineQueue")    // Queue name
).withApplicationName("data-processing-service");

WorkflowHandle<String, Exception> handle = dbos.enqueueWorkflow(
  options,
  new Object[]{"task-123", "data"}  // Workflow arguments
);
```

When the target takes named arguments, such as a Python workflow with keyword arguments, set `withSerialization(SerializationStrategy.PORTABLE)` on the options and call `dbos.enqueueWorkflow(options, positionalArgs, namedArgs)`.

From outside any DBOS application, use the [DBOS Client](../reference/client.md), which connects directly to the system database and takes the same `EnqueueOptions`:

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword);

var options = new EnqueueOptions(
  "dataPipeline",                  // Workflow name
  "com.example.DataPipelineImpl",  // Class name
  QueueName.of("pipelineQueue")    // Queue name
).withApplicationName("data-processing-service");

var handle = client.enqueueWorkflow(
  options,
  new Object[]{"task-123", "data"}  // Workflow arguments
);

// Optionally wait for the result
Object result = handle.getResult();
```

#### Enqueueing from PL/pgSQL

You can also enqueue a workflow from a PostgreSQL trigger or stored procedure.
The DBOS System Database includes an [`enqueue_workflow`](../../explanations/system-tables.md#dbosenqueue_workflow) method for this scenario.

For example, here is the previous example of enqueing the `dataPipeline` workflow on the `pipelineQueue` queue with arguments, but using PL/pgSQL.

```sql
DECLARE workflow_id text;
workflow_id := dbos.enqueue_workflow(
  workflow_name => 'dataPipeline',
  class_name => 'com.example.DataPipelineImpl',
  queue_name => 'pipelineQueue',
  positional_args => ARRAY[
    '"task-123"'::json,
    '"data"'::json
  ]
);
```

### Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

#### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```java
dbos.registerQueue("example-queue", QueueOptions.setWorkerConcurrency(5));
```

#### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions.
:::

```java
dbos.registerQueue("example-queue", QueueOptions.setConcurrency(10));
```

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of workflows that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 100 workflows with a period of 60 seconds, so it may not start more than 100 workflows in 60 seconds:

```java
dbos.registerQueue("example-queue", QueueOptions.setRateLimit(100, 60, TimeUnit.SECONDS));
```

Rate limits are especially useful when working with a rate-limited API.

### Reconfiguring Queues at Runtime

Because queue configuration lives in the system database, you can change a queue's configuration at runtime without redeploying or restarting your workers.
Use `dbos.updateQueue` to modify a queue's configuration. Workers pick up the new configuration on their next polling iteration.

```java
// Change the queue's concurrency
dbos.updateQueue("example-queue", QueueOptions.setConcurrency(20));

// Change its rate limit
dbos.updateQueue("example-queue", QueueOptions.setRateLimit(25, 30, TimeUnit.SECONDS));
```

:::warning
If your application calls `dbos.registerQueue` on startup, the next process to start can overwrite settings you applied at runtime via `updateQueue`.
Either update the `registerQueue` call to match the new configuration, or pass `QueueConflictResolution.NEVER_UPDATE` to preserve the runtime changes.
:::

You can also find, list, and delete queues:

```java
// Find a specific queue by name
Optional<Queue> queue = dbos.findQueue("example-queue");

// List all queues in the system database
List<Queue> queues = dbos.listQueues();

// Delete a queue
boolean deleted = dbos.deleteQueue("example-queue");
```

You can do all of this from a [`DBOSClient`](../reference/client.md#queue-management-methods) as well, which is useful for managing queues from an admin tool or another service.

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword);

// Register or update a queue
client.registerQueue("example-queue", QueueOptions.setConcurrency(10));

// Register only if it doesn't already exist
client.registerQueue("example-queue", QueueOptions.setConcurrency(10), QueueConflictResolution.NEVER_UPDATE);

// Update only the concurrency of an existing queue
client.updateQueue("example-queue", QueueOptions.setConcurrency(20));

// Find a queue by name
Optional<Queue> queue = client.findQueue("example-queue");

// List all queues
List<Queue> queues = client.listQueues();

// Delete a queue
boolean deleted = client.deleteQueue("example-queue");
```

### Setting Timeouts

You can set a timeout for an enqueued workflow via the `withTimeout` function on `StartWorkflowOptions`.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: a workflow's timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```java
// use StartWorkflowOptions.withTimeout with dbos.startWorkflow
var options = new StartWorkflowOptions().withQueue("example-queue").withTimeout(Duration.ofSeconds(10));
var handle = dbos.startWorkflow(() -> proxy.workflow(), options);
```

### Setting Deadlines

You can set a deadline for an enqueued workflow via the `withDeadline` function on `StartWorkflowOptions`.
A deadline is an **absolute point in time** by which the workflow must complete; if the deadline passes before the workflow finishes, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

:::warning
You cannot set both an explicit timeout and a deadline on the same workflow — use one or the other.
:::

Like timeouts, deadlines are **durable**: they are stored in the database and persist across restarts.

Example syntax:

```java
// Use StartWorkflowOptions.withDeadline with dbos.startWorkflow
Instant deadline = Instant.now().plus(Duration.ofHours(1));
var options = new StartWorkflowOptions().withQueue("example-queue").withDeadline(deadline);
var handle = dbos.startWorkflow(() -> proxy.workflow(), options);
```

### Delaying Execution

You can delay when an enqueued workflow starts executing via the `withDelay` function on `StartWorkflowOptions`.
The delay is a `Duration` that must be a positive, non-zero value.
The workflow remains `DELAYED` until the delay has elapsed, after which its status changes to `ENQUEUED` and it is eligible to be dequeued and started normally.

Example syntax:

```java
// Delay the workflow's execution by 30 seconds
var options = new StartWorkflowOptions().withQueue("example-queue").withDelay(Duration.ofSeconds(30));
var handle = dbos.startWorkflow(() -> proxy.workflow(), options);
```

### Partitioning Queues

You can **partition** queues to distribute work across dynamically created queue partitions.
A queue is partitioned if you register it with any per-partition flow control limit:

| Option | Meaning |
| --- | --- |
| `partitionConcurrency` | Maximum workflows from any one partition running at once across all processes. |
| `partitionWorkerConcurrency` | Maximum workflows from any one partition running at once on a single process. |
| `partitionRateLimit` | Maximum workflows that may be started from any one partition in a given period. |

When you enqueue a workflow on a partitioned queue, you must supply a queue partition key.
Essentially, you can think of each partition as a "subqueue" you dynamically create by enqueueing a workflow with a partition key.

For example, suppose you want your users to each be able to run at most one task at a time.
You can do this with a queue whose `partitionConcurrency` is 1, where the partition key is user ID.

**Example Syntax**

```java
dbos.registerQueue("example-queue", QueueOptions.setPartitionConcurrency(1));

void onUserTaskSubmission(String userID, Task task) {
    // Partition the task queue by user ID. As the queue has a
    // per-partition concurrency of 1, this means that at most one
    // task can run at once per user (but tasks from different
    // users can run concurrently).
    var options = new StartWorkflowOptions().withQueue("example-queue").withQueuePartitionKey(userID);
    dbos.startWorkflow(() -> proxy.taskWorkflow(task), options);
}
```

:::warning
Every enqueue on a partitioned queue must supply a partition key.
`dbos.startWorkflow` throws if you omit it, but a workflow enqueued without a partition key by other means (such as a [`DBOSClient`](../reference/client.md)) stays `ENQUEUED` and is never dequeued.
For the same reason, partitioning a queue that already has enqueued workflows strands them; drain the queue first.
Workflows stranded this way can be moved to a queue that is not partitioned with [`dbos.resumeWorkflow(workflowId, queueName)`](../reference/methods.md#resumeworkflow).
:::

#### Combining Queue-Wide and Per-Partition Limits

A partitioned queue enforces its per-partition limits **and** its queue-wide limits ([`concurrency`](#global-concurrency), [`workerConcurrency`](#worker-concurrency), and [`rateLimit`](#rate-limiting)) at the same time.
This lets you protect your workers from overload while still fairly distributing work between partitions.

For example, this "fair queue" runs at most one task per user, but no more than 10 tasks on any single process:

```java
dbos.registerQueue("fair-queue",
    QueueOptions.setPartitionConcurrency(1).andWorkerConcurrency(10));
```

Each queue-wide limit has a per-partition counterpart, so you can mix and match them freely:

```java
// At most 100 tasks running globally and 25 running per tenant,
// at most 10 tasks running per process and 2 per tenant per process,
// and at most 1000 tasks started per minute globally and 50 per tenant.
dbos.registerQueue("tenant-queue",
    QueueOptions.setConcurrency(100)
        .andWorkerConcurrency(10)
        .andRateLimit(1000, Duration.ofSeconds(60))
        .andPartitionConcurrency(25)
        .andPartitionWorkerConcurrency(2)
        .andPartitionRateLimit(50, Duration.ofSeconds(60)));
```

When both are set, each per-partition concurrency limit must be less than or equal to its queue-wide counterpart, and `partitionWorkerConcurrency` must be less than or equal to `partitionConcurrency`; limits that are not set are not compared.
See [`QueueOptions`](../reference/queues.md#queueoptions) for the full set of rules.

:::note
[Deduplication](#deduplication) is not supported on partitioned queues.
:::

:::info Deprecated `partitionQueue` option
Before 1.1, queues were partitioned with `QueueOptions.setPartitionQueue(true)` (or `andPartitionQueue(true)`), which applies the queue-wide limits to each partition instead of to the queue as a whole.
This option is deprecated since 1.1: set per-partition limits instead.
The limits of a queue registered with `partitionQueue` cannot be changed with `updateQueue`; re-register it with per-partition limits.
:::

### Deduplication

You can set a deduplication ID for an enqueued workflow using [`withQueue`](../reference/workflows-steps.md#startworkflow) when calling `startWorkflow`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `DELAYED`, `ENQUEUED`, or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will raise an exception.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

**Example syntax:**

```java
@Workflow
public String taskWorkflow(String task) {
    // Process the task...
    return "completed";
}

public void example(DBOS dbos, Example proxy, String task, String userID) throws Exception {
    // Use user ID for deduplication
    WorkflowHandle<String, Exception> handle = dbos.startWorkflow(
        () -> proxy.taskWorkflow(task),
        new StartWorkflowOptions().withQueue("example-queue").withDeduplicationId(userID)
    );

    String result = handle.getResult();
    System.out.println("Workflow completed: " + result);
}
```

### Priority

You can set a priority for an enqueued workflow using [`withQueue`](../reference/workflows-steps.md#startworkflow) when calling `startWorkflow`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `0` to `2,147,483,647`, where **a low number indicates a higher priority**. A negative priority throws `IllegalArgumentException`.
Priority is enabled on every queue; no extra configuration is needed.

:::tip
Workflows without assigned priorities have priority `0`, the highest priority.
:::

**Example syntax:**

```java
@Workflow
public String taskWorkflow(String task) {
    // Process the task...
    return "completed";
}

public void example(DBOS dbos, Example proxy, String task, int priority) throws Exception {
    WorkflowHandle<String, RuntimeException> handle = dbos.startWorkflow(
        () -> proxy.taskWorkflow(task),
        new StartWorkflowOptions().withQueue("example-queue").withPriority(priority)
    );

    String result = handle.getResult();
    System.out.println("Workflow completed: " + result);
}
```

### Explicit Queue Listening

By default, a process running DBOS listens to (dequeues workflows from) all queues registered in its system database.
However, sometimes you only want a process to listen to a specific list of queues.
You use the `withListenQueues` method on [DBOSConfig](../reference/lifecycle.md#dbosconfig) to explicitly tell a process running DBOS to only listen to a specific set of queues.

This is particularly useful when managing heterogeneous workers, where specific tasks should execute on specific physical servers.
For example, say you have a mix of CPU workers and GPU workers and you want CPU tasks to only execute on CPU workers and GPU tasks to only execute on GPU workers.
You can create separate queues for CPU and GPU tasks and configure each type of worker to only listen to the appropriate queue:

```java
var workerType = System.getenv("WORKER_TYPE"); // "cpu" or "gpu"
var config = DBOSConfig.defaults("my-dbos-app")
    .withAppVersion("0.1.0");
if (workerType.equals("gpu")) {
    config = config.withListenQueues("gpuQueue");
} else if (workerType.equals("cpu")) {
    config = config.withListenQueues("cpuQueue");
}
DBOS dbos = new DBOS(config);

// register workflows...
dbos.launch();

dbos.registerQueue("cpuQueue", QueueOptions.empty());
dbos.registerQueue("gpuQueue", QueueOptions.empty());
```

Note that `withListenQueues` only controls what workflows are dequeued, not what workflows can be enqueued, so you can freely enqueue tasks onto the GPU queue from a CPU worker for execution on a GPU worker, and vice versa.
