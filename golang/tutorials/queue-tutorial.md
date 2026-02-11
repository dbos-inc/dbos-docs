---
sidebar_position: 45
title: Queues & Concurrency
toc_max_heading_level: 3
---

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

To create a queue, use [`NewWorkflowQueue`](../reference/queues#newworkflowqueue)

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue")
```

You can then enqueue any workflow using [`WithQueue`](../reference/workflows-steps#withqueue) when calling `RunWorkflow`.
Enqueuing a function submits it for execution and returns a [handle](../reference/workflows-steps#workflowhandle) to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```go
func processTask(ctx dbos.DBOSContext, task string) (string, error) {
    // Process the task...
    return fmt.Sprintf("Processed: %s", task), nil
}

func example(dbosContext dbos.DBOSContext, queue dbos.WorkflowQueue) error {
    // Enqueue a workflow
    task := "example_task"
    handle, err := dbos.RunWorkflow(dbosContext, processTask, task, dbos.WithQueue(queue.Name))
    if err != nil {
        return err
    }
    
    // Get the result
    result, err := handle.GetResult()
    if err != nil {
        return err
    }
    fmt.Println("Task result:", result)
    return nil
}
```

### Queue Example

Here's an example of a workflow using a queue to process tasks concurrently:

```go
func taskWorkflow(ctx dbos.DBOSContext, task string) (string, error) {
    // Process the task...
    return fmt.Sprintf("Processed: %s", task), nil
}

func queueWorkflow(ctx dbos.DBOSContext, queue dbos.WorkflowQueue) ([]string, error) {
    // Enqueue each task so all tasks are processed concurrently
    tasks := []string{"task1", "task2", "task3", "task4", "task5"}

    var handles []dbos.WorkflowHandle[string]
    for _, task := range tasks {
        handle, err := dbos.RunWorkflow(ctx, taskWorkflow, task, dbos.WithQueue(queue.Name))
        if err != nil {
            return nil, fmt.Errorf("failed to enqueue task %s: %w", task, err)
        }
        handles = append(handles, handle)
    }

    // Wait for each task to complete and retrieve its result
    var results []string
    for i, handle := range handles {
        result, err := handle.GetResult()
        if err != nil {
            return nil, fmt.Errorf("task %d failed: %w", i, err)
        }
        results = append(results, result)
    }

    return results, nil
}

func example(dbosContext dbos.DBOSContext, queue dbos.WorkflowQueue) error {
    handle, err := dbos.RunWorkflow(dbosContext, queueWorkflow, queue)
    if err != nil {
        return err
    }

    results, err := handle.GetResult()
    if err != nil {
        return err
    }

    for _, result := range results {
        fmt.Println(result)
    }
    return nil
}
```

Sometimes, you may wish to receive the result of each task as soon as it's ready instead of waiting for all tasks to complete.
You can do this using [`Send` and `Recv`](./workflow-communication.md#workflow-messaging-and-notifications).
Each enqueued workflow sends a message to the main workflow when it's done processing its task.
The main workflow awaits those messages, retrieving the result of each task as soon as the task completes.

```go
const TaskCompleteTopic = "task_complete"

type TaskInput struct {
    ParentWorkflowID string
    TaskID           int
    Task             string
}

func processTask(ctx dbos.DBOSContext, input TaskInput) (string, error) {
    result := ... // Process the task

    // Notify the main workflow this task is complete
    err := dbos.Send(ctx, input.ParentWorkflowID, input.TaskID, TaskCompleteTopic)
    if err != nil {
        return "", fmt.Errorf("failed to send completion notification: %w", err)
    }
    return result, nil
}

func processTasks(ctx dbos.DBOSContext, tasks []string) ([]string, error) {
    parentWorkflowID, err := dbos.GetWorkflowID(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to get workflow ID: %w", err)
    }

    var handles []dbos.WorkflowHandle[string]
    for i, task := range tasks {
        handle, err := dbos.RunWorkflow(ctx, processTask,
            TaskInput{ParentWorkflowID: parentWorkflowID, TaskID: i, Task: task},
            dbos.WithQueue(queue.Name),
        )
        if err != nil {
            return nil, fmt.Errorf("failed to enqueue task %d: %w", i, err)
        }
        handles = append(handles, handle)
    }

    var results []string
    for len(results) < len(tasks) {
        // Wait for a notification that a task is complete
        completedTaskID, err := dbos.Recv[int](ctx, TaskCompleteTopic, 5*time.Minute)
        if err != nil {
            return nil, fmt.Errorf("timeout waiting for task completion: %w", err)
        }
        // Retrieve result of the completed task
        completedTaskHandle := handles[completedTaskID]
        result, err := completedTaskHandle.GetResult()
        if err != nil {
            return nil, fmt.Errorf("task %d failed: %w", completedTaskID, err)
        }
        fmt.Printf("Task %d completed. Result: %s\n", completedTaskID, result)
        results = append(results, result)
    }
    return results, nil
}
```

### Enqueueing from Another Application

Often, you want to enqueue a workflow from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

You can use the [DBOS Client](../reference/client.md) to enqueue workflows from outside your DBOS application by connecting directly to your DBOS application's system database.
Since the DBOS Client is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

For example, this code enqueues the `dataPipeline` workflow on the `pipelineQueue` queue with a `ProcessInput` argument:

```go
type ProcessInput struct {
    TaskID string
    Data   string
}

type ProcessOutput struct {
    Result string
    Status string
}

config := dbos.ClientConfig{
    DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
}
client, err := dbos.NewClient(context.Background(), config)
if err != nil {
    log.Fatal(err)
}
defer client.Shutdown(5 * time.Second)

handle, err := dbos.Enqueue[ProcessInput, ProcessOutput](
    client, 
    "pipelineQueue",
    "dataPipeline",
    ProcessInput{TaskID: "task-123", Data: "data"},
)
if err != nil {
    log.Fatal(err)
}
```


### Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

#### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue",  dbos.WithWorkerConcurrency(5))
```

#### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions
:::

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue", dbos.WithGlobalConcurrency(10))
```

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 100 workflows with a period of 60 seconds, so it may not start more than 100 workflows in 60 seconds:

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue", 
    dbos.WithRateLimiter(&dbos.RateLimiter{
        Limit:  100,
        Period: 60.0, // 60 seconds
    }))
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.


### Deduplication

You can set a deduplication ID for an enqueued workflow using [`WithDeduplicationID`](../reference/workflows-steps#withdeduplicationid) when calling `RunWorkflow`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will return an error.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

**Example syntax:**

```go
func taskWorkflow(ctx dbos.DBOSContext, task string) (string, error) {
    // Process the task...
    return "completed", nil
}

func example(dbosContext dbos.DBOSContext, queue dbos.WorkflowQueue) error {
    task := "example_task"
    deduplicationID := "user_12345" // Use user ID for deduplication
    
    handle, err := dbos.RunWorkflow(
        dbosContext, taskWorkflow, task,
        dbos.WithQueue(queue.Name),
        dbos.WithDeduplicationID(deduplicationID))
    if err != nil {
        // Handle deduplication error or other failures
        return fmt.Errorf("failed to enqueue workflow: %w", err)
    }
    
    result, err := handle.GetResult()
    if err != nil {
        return fmt.Errorf("workflow failed: %w", err)
    }
    
    fmt.Printf("Workflow completed: %s\n", result)
    return nil
}
```

### Priority

You can set a priority for an enqueued workflow using [`WithPriority`](../reference/workflows-steps#withpriority) when calling `RunWorkflow`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
If using priority, you must set [`WithPriorityEnabled`](../reference/queues#withpriorityenabled) on your queue.

:::tip
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
:::

To use priorities in a queue, you must enable it when creating the queue:

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue", dbos.WithPriorityEnabled())
```

**Example syntax:**

```go
func taskWorkflow(ctx dbos.DBOSContext, task string) (string, error) {
    // Process the task...
    return "completed", nil
}

func example(dbosContext dbos.DBOSContext, queue dbos.WorkflowQueue) error {
    task := "example_task"
    priority := uint(10) // Lower number = higher priority
    
    handle, err := dbos.RunWorkflow(dbosContext, taskWorkflow, task,
        dbos.WithQueue(queue.Name),
        dbos.WithPriority(priority))
    if err != nil {
        return err
    }
    
    result, err := handle.GetResult()
    if err != nil {
        return fmt.Errorf("workflow failed: %w", err)
    }
    
    fmt.Printf("Workflow completed: %s\n", result)
    return nil
}
```

### Partitioning Queues

You can **partition** queues to distribute work across dynamically created queue partitions.
When you enqueue a workflow on a partitioned queue, you must supply a queue partition key.
Partitioned queues dequeue workflows and apply flow control limits for individual partitions, not for the entire queue.
Essentially, you can think of each partition as a "subqueue" you dynamically create by enqueueing a workflow with a partition key.

For example, suppose you want your users to each be able to run at most one task at a time.
You can do this with a partitioned queue with a maximum concurrency limit of 1 where the partition key is user ID.

**Example Syntax:**

```go
// Create a partitioned queue with a global concurrency limit of 1
partitionedQueue := dbos.NewWorkflowQueue(dbosContext, "user-tasks",
    dbos.WithPartitionQueue(),
    dbos.WithGlobalConcurrency(1),
)

type Task struct {
    TaskID string
    Data   string
}

func processTask(ctx dbos.DBOSContext, task Task) (string, error) {
    // Process the task...
    return fmt.Sprintf("Processed task %s", task.TaskID), nil
}

func onUserTaskSubmission(dbosContext dbos.DBOSContext, userID string, task Task) error {
    // Partition the task queue by user ID. As the queue has a
    // maximum concurrency of 1, this means that at most one
    // task can run at once per user (but tasks from different
    // users can run concurrently).
    handle, err := dbos.RunWorkflow(dbosContext, processTask, task,
        dbos.WithQueue("user-tasks"),
        dbos.WithQueuePartitionKey(userID),
    )
    if err != nil {
        return fmt.Errorf("failed to enqueue task: %w", err)
    }

    result, err := handle.GetResult()
    if err != nil {
        return fmt.Errorf("task failed: %w", err)
    }

    fmt.Printf("Task completed: %s\n", result)
    return nil
}
```

:::info
- Partition keys are required when enqueueing to a partitioned queue.
- Partition keys cannot be used with non-partitioned queues.
- Partition keys and deduplication IDs cannot be used together.
:::

### Listening to Specific Queues

By default, every DBOS process listens to all registered queues.
You can use [`ListenQueues`](../reference/queues.md#listenqueues) to configure a process to listen to only a subset of queues.
This is useful when you have multiple DBOS processes and want each one to handle different types of work.

```go
emailQueue := dbos.NewWorkflowQueue(dbosContext, "email-queue")
dataQueue := dbos.NewWorkflowQueue(dbosContext, "data-queue")

// This process will only dequeue workflows from the email queue
dbos.ListenQueues(dbosContext, emailQueue)

dbos.Launch(dbosContext)
```

:::warning
`ListenQueues` must be called before `Launch()`.
:::
