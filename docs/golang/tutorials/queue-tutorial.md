---
sidebar_position: 45
title: Queues & Concurrency
toc_max_heading_level: 3
---

You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

To create a queue, use [`NewWorkflowQueue`](../reference/queues.md#newworkflowqueue):

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue")
```

You can then enqueue any workflow using [`WithQueue`](../reference/workflows-steps.md#withqueue) when calling `RunAsWorkflow`.
Enqueuing a function submits it for execution and returns a [handle](../reference/workflows-steps.md#workflowhandle) to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```go
func processTask(ctx dbos.DBOSContext, task string) (string, error) {
    // Process the task...
	return fmt.Sprintf("Processed: %s", task), nil
}

func example(dbosContext dbos.DBOSContext, queue dbos.WorkflowQueue) error {
    // Enqueue a workflow
    task := "example_task"
    handle, err := dbos.RunAsWorkflow(dbosContext, processTask, task,
        dbos.WithQueue(queue.Name))
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

Here's an example of a workflow using a queue to process tasks in parallel:

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
		handle, err := dbos.RunAsWorkflow(ctx, taskWorkflow, task,
			dbos.WithQueue(queue.Name))
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
	handle, err := dbos.RunAsWorkflow(dbosContext, queueWorkflow, queue)
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


### Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

#### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue", 
    dbos.WithWorkerConcurrency(5))
```

#### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions
:::

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue", 
    dbos.WithGlobalConcurrency(10))
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

You can set a deduplication ID for an enqueued workflow using [`WithDeduplicationID`](../reference/workflows-steps.md#withdeduplicationid) when calling `RunAsWorkflow`.
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
    
    handle, err := dbos.RunAsWorkflow(dbosContext, taskWorkflow, task,
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

You can set a priority for an enqueued workflow using [`WithPriority`](../reference/workflows-steps.md#withpriority) when calling `RunAsWorkflow`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
If using priority, you must set `WithPriorityEnabled(true)` on your queue.

:::tip
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
:::

To use priorities in a queue, you must enable it when creating the queue:

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue",
    dbos.WithPriorityEnabled(true))
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
    
    handle, err := dbos.RunAsWorkflow(dbosContext, taskWorkflow, task,
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


