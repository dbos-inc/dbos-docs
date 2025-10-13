---
sidebar_position: 30
title: Queues & Concurrency
toc_max_heading_level: 3
---

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

To create a queue, use [`Queue`](../reference/queues.md#queue).
All queues should be created before DBOS is launched.

```java
Queue queue = DBOS.Queue("example-queue").build();
```

You can then enqueue any workflow using [`withQueue`](../reference/workflows-steps.md#startworkflow) when calling `startWorkflow`.
Enqueuing a workflow submits it for execution and returns a [handle](../reference/workflows-steps.md#workflowhandle) to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```java
class ExampleImpl implements Example {
    @Workflow(name = "processTask")
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

    @Workflow(name = "taskWorkflow")
    public String taskWorkflow(String task) {
        // Process the task...
        return "Processed: " + task;
    }

    @Workflow(name = "queueWorkflow")
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

        Queue queue = DBOS.Queue("example-queue").build();
        ExampleImpl impl = new ExampleImpl(queue);
        Example proxy = dbos.<Example>registerWorkflows(Example.class, impl);
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
Queue queue = DBOS.Queue("example-queue")
    .workerConcurrency(5)
    .build();
```

### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions.
:::

```java
Queue queue = DBOS.Queue("example-queue")
    .concurrency(10)
    .build();
```

## Rate Limiting

You can set _rate limits_ for a queue, limiting the number of workflows that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 100 workflows with a period of 60 seconds, so it may not start more than 100 workflows in 60 seconds:

```java
Queue queue = DBOS.Queue("example-queue")
    .limit(100, 60.0)  // 100 workflows per 60 seconds
    .build();
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

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
Queue queue = DBOS.Queue("example-queue")
    .priorityEnabled(true)
    .build();
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
