---
sidebar_position: 30
title: Queues & Concurrency
toc_max_heading_level: 3
---

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

To create a queue, instantiate and register a [`Queue`](../reference/queues.md#queue) object.
All queues must be created and registered before DBOS is launched.

```java
Queue queue = new Queue("example-queue");
DBOS.registerQueue(queue);
```

You can then enqueue any workflow using [`withQueue`](../reference/workflows-steps.md#startworkflow) when calling `startWorkflow`.
Enqueuing a workflow submits it for execution and returns a [handle](../reference/workflows-steps.md#workflowhandle) to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```java
class ExampleImpl implements Example {
    @Workflow
    public String processTask(String task) {
        // Process the task...
        return "Processed: " + task;
    }
}

public String example(Queue queue, Example proxy, String task) throws Exception {
    // Enqueue a workflow
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
        () -> proxy.processTask(task),
        new StartWorkflowOptions().withQueue(queue)
    );

    // Get the result
    String result = handle.getResult();
    System.out.println("Task result: " + result);
    return result;
}
```

## Queue Example

Here's an example of a workflow using a queue to process tasks concurrently:

```java
interface Example {
    public void setProxy(Example proxy);
    public String taskWorkflow(String task);
    public List<String> queueWorkflow(String[] tasks) throws Exception;
}

class ExampleImpl implements Example {

    private final Queue queue;
    private Example proxy;

    public ExampleImpl(Queue queue) {
        this.queue = queue;
    }

    public void setProxy(Example proxy) {
        this.proxy = proxy;
    }

    @Workflow
    public String taskWorkflow(String task) {
        // Process the task...
        return "Processed: " + task;
    }

    @Workflow
    public List<String> queueWorkflow(String[] tasks) throws Exception {
        // Enqueue each task so all tasks are processed concurrently
        List<WorkflowHandle<String, Exception>> handles = new ArrayList<>();
        for (String task : tasks) {
            WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
                () -> proxy.taskWorkflow(task),
                new StartWorkflowOptions().withQueue(queue)
            );
            handles.add(handle);
        }

        // Wait for each task to complete and retrieve its result
        List<String> results = new ArrayList<>();
        for (WorkflowHandle<String, Exception> handle : handles) {
            String result = handle.getResult();
            results.add(result);
        }

        return results;
    }
}

public class App {
    public static void main(String[] args) throws Exception {
        DBOSConfig config = ...
        DBOS.configure(config);

        // Create and register a queue
        Queue queue = new Queue("example-queue");
        DBOS.registerQueue(queue);
        // Instantiate an Example and register its workflows
        ExampleImpl impl = new ExampleImpl(queue);
        Example proxy = DBOS.registerWorkflows(Example.class, impl);
        // Provide the workflow proxy to the class so its methods can invoke workflows
        impl.setProxy(proxy);

        DBOS.launch();

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
    public void setProxy(Example proxy);
    public String processTask(String parentWorkflowId, int taskId, String task);
    public List<String> processTasks(String[] tasks) throws Exception;
}

class ExampleImpl implements Example {
    private static final String TASK_COMPLETE_TOPIC = "task_complete";

    private final Queue queue;
    private Example proxy;

    public ExampleImpl(Queue queue) {
        this.queue = queue;
    }

    public void setProxy(Example proxy) {
        this.proxy = proxy;
    }

    @Workflow(name = "processTask")
    public String processTask(String parentWorkflowId, int taskId, String task) {
        String result = "Processed: " + task; // Process the task

        // Notify the main workflow this task is complete
        DBOS.send(parentWorkflowId, taskId, TASK_COMPLETE_TOPIC);
        return result;
    }

    @Workflow(name = "processTasks")
    public List<String> processTasks(String[] tasks) throws Exception {
        String parentWorkflowId = DBOS.workflowId();

        List<WorkflowHandle<String, Exception>> handles = new ArrayList<>();
        for (int i = 0; i < tasks.length; i++) {
            final int taskId = i;
            final String task = tasks[i];
            WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
                () -> proxy.processTask(parentWorkflowId, taskId, task),
                new StartWorkflowOptions().withQueue(queue)
            );
            handles.add(handle);
        }

        List<String> results = new ArrayList<>();
        while (results.size() < tasks.length) {
            // Wait for a notification that a task is complete
            Integer completedTaskId = (Integer) DBOS.recv(TASK_COMPLETE_TOPIC, Duration.ofMinutes(5));
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

## Enqueueing from Another Application

Often, you want to enqueue a workflow from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

You can use the [DBOS Client](../reference/client.md) to enqueue workflows from outside your DBOS application by connecting directly to your DBOS application's system database.
Since the DBOS Client is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

For example, this code enqueues the `dataPipeline` workflow on the `pipelineQueue` queue with arguments:

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword);

var options = new DBOSClient.EnqueueOptions(
    "com.example.DataPipelineImpl",  // Class name
    "dataPipeline",                  // Workflow name
    "pipelineQueue"                  // Queue name
);

var handle = client.enqueueWorkflow(
    options,
    new Object[]{"task-123", "data"}  // Workflow arguments
);

// Optionally wait for the result
Object result = handle.getResult();
```

## Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```java
Queue queue = new Queue("example-queue")
    .withWorkerConcurrency(5);
DBOS.registerQueue(queue);
```

### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions.
:::

```java
Queue queue = new Queue("example-queue")
    .withConcurrency(10);
DBOS.registerQueue(queue);
```

## Rate Limiting

You can set _rate limits_ for a queue, limiting the number of workflows that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 100 workflows with a period of 60 seconds, so it may not start more than 100 workflows in 60 seconds:

```java
Queue queue = new Queue("example-queue")
    .withRateLimit(100, 60.0);  // 100 workflows per 60 seconds
DBOS.registerQueue(queue);
```

Rate limits are especially useful when working with a rate-limited API.

## Setting Timeouts

You can set a timeout for an enqueued workflow via the `withTimeout` function on `WorkflowOptions` and `StartWorkflowOptions`.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: a workflow's timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```java
Queue queue = new Queue("example-queue");
DBOS.registerQueue(queue);

// use StartWorkflowOptions.withTimeout with DBOS.startWorkflow
var options = new StartWorkflowOptions(queue).withTimeout(Duration.ofSeconds(10))
var handle = DBOS.startWorkflow(() -> proxy.workflow(), options);
```

## Partitioning Queues

You can **partition** queues to distribute work across dynamically created queue partitions.
When you enqueue a workflow on a partitioned queue, you must supply a queue partition key.
Partitioned queues dequeue workflows and apply flow control limits for individual partitions, not for the entire queue.
Essentially, you can think of each partition as a "subqueue" you dynamically create by enqueueing a workflow with a partition key.

For example, suppose you want your users to each be able to run at most one task at a time.
You can do this with a partitioned queue with a maximum concurrency limit of 1 where the partition key is user ID.

**Example Syntax**

```java
Queue queue = new Queue("example-queue").withConcurrency(1).withPartitionedEnabled(true);
DBOS.registerQueue(queue);

void onUserTaskSubmission(String userID, Task task) {
    // Partition the task queue by user ID. As the queue has a
    // maximum concurrency of 1, this means that at most one
    // task can run at once per user (but tasks from different
    // users can run concurrently).
    var options = new StartWorkflowOptions(queue).withQueuePartitionKey(userID);
    DBOS.startWorkflow(() -> taskWorkflow(task), options);
}
```

Sometimes, you want to apply global or per-worker limits to a partitioned queue.
You can do this with **multiple levels of queueing**.
Create two queues: a partitioned queue with per-partition limits and a non-partitioned queue with global limits.
Enqueue a "concurrency manager" workflow to the partitioned queue, which then enqueues your actual workflow
to the non-partitioned queue and awaits its result.
This ensures both queues' flow control limits are enforced on your workflow.
For example:

```java
// By using two levels of queueing, we enforce both a concurrency limit of 1 on each partition
// and a global concurrency limit of 5, meaning that no more than 5 tasks can run concurrently
// across all partitions (and at most one task per partition).
var partitionedQueue = new Queue("partitioned-queue").withConcurrency(1).withPartitionedEnabled(true);
var concurrencyQueue = new Queue("concurrency-queue").withConcurrency(5);

class UserTasksImpl implements UserTasks {

    // proxy object gets injected to implementation object to enable intra-workflow invocation  
    UserTasks proxy;

    @Workflow
    void onUserTaskSubmission(String userID, Task task) {
        // First, enqueue a "concurrency manager" workflow to the partitioned
        // queue to enforce per-partition limits.
        var options = new StartWorkflowOptions(partitionedQueue).withQueuePartitionKey(userID);
        DBOS.startWorkflow(() -> proxy.concurrencyManager(task), options);
    }

    @Workflow
    String concurrencyManager(Task task) {
        // The "concurrency manager" workflow enqueues the processTask
        // workflow on the non-partitioned queue and awaits its results
        // to enforce global flow control limits.
        var options = new StartWorkflowOptions(concurrencyQueue);
        var handle = DBOS.startWorkflow(() -> proxy.processTask(task), options);
        return handle.getResult();
    }

    @Workflow
    String processTask(Task task) {
        // task processing code
    }
```

## Deduplication

You can set a deduplication ID for an enqueued workflow using [`withQueue`](../reference/workflows-steps.md#startworkflow) when calling `startWorkflow`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will raise an exception.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

**Example syntax:**

```java
@Workflow(name = "taskWorkflow")
public String taskWorkflow(String task) {
    // Process the task...
    return "completed";
}

public void example(Example proxy, String task, String userID) throws Exception {
    // Use user ID for deduplication
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
        () -> proxy.taskWorkflow(task),
        new StartWorkflowOptions().withQueue(queue).withDeduplicationId(userID)
    );

    String result = handle.getResult();
    System.out.println("Workflow completed: " + result);
}
```

## Priority

You can set a priority for an enqueued workflow using [`withQueue`](../reference/workflows-steps.md#startworkflow) when calling `startWorkflow`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
If using priority, you must set [`priorityEnabled`](../reference/queues.md#queue) on your queue.

:::tip
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
:::

To use priorities in a queue, you must enable it when creating the queue:

```java
Queue queue = new Queue("example-queue")
    .withPriorityEnabled(true);
DBOS.registerQueue(queue);
```

**Example syntax:**

```java
@Workflow(name = "taskWorkflow")
public String taskWorkflow(String task) {
    // Process the task...
    return "completed";
}

public void example(Example proxy, String task, int priority) throws Exception {
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
        () -> proxy.taskWorkflow(task),
        new StartWorkflowOptions().withQueue(queue).withPriority(priority)
    );

    String result = handle.getResult();
    System.out.println("Workflow completed: " + result);
}
```

## Explicit Queue Listening

By default, a process running DBOS listens to (dequeues workflows from) all declared queues.
However, sometimes you only want a process to listen to a specific list of queues.
You use the `withListenQueues` method on [DBOSConfig](../reference/lifecycle.md#dbosconfigure) to explicitly tell a process running DBOS to only listen to a specific set of queues.

This is particularly useful when managing heterogeneous workers, where specific tasks should execute on specific physical servers.
For example, say you have a mix of CPU workers and GPU workers and you want CPU tasks to only execute on CPU workers and GPU tasks to only execute on GPU workers.
You can create separate queues for CPU and GPU tasks and configure each type of worker to only listen to the appropriate queue:

```java
public class DBOSLifecycle implements SmartLifecycle {

    @Override
    public void start() {

        var cpuQueue = new Queue("cpuQueue");
        DBOS.registerQueue(cpuQueue);
        var gpuQueue = new Queue("gpuQueue");
        DBOS.registerQueue(gpuQueue);

        var workerType = System.getenv("WORKER_TYPE"); // "cpu" or "gpu"
        var config = DBOSConfig.defaults("my-dbos-app");
        if (workerType.equals("gpu")) {
            config = config.withListenQueues(gpuQueue);
        } else if (workerType.equals("cpu")) {
            config = config.withListenQueues(cpuQueue);
        }
        DBOS.configure(config);
        DBOS.launch();
    }
```

Note that `withListenQueues` only controls what workflows are dequeued, not what workflows can be enqueued, so you can freely enqueue tasks onto the GPU queue from a CPU worker for execution on a GPU worker, and vice versa.