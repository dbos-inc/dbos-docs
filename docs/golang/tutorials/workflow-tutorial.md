---
sidebar_position: 10
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of [steps](./step-tutorial.md), which wrap ordinary Go functions.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

To write a workflow, register a Go function with [`RegisterWorkflow`](../reference/workflows-steps.md#registerworkflow).
Workflow registration must happen before launching the DBOS context with `dbos.Launch()`
The function's signature must match:

```go
type Workflow[P any, R any] func(ctx DBOSContext, input P) (R, error)
```

In other words, a workflow must take in a DBOS context and one other input of any serializable ([json-encodable](https://pkg.go.dev/encoding/json)) type and must return one output of any serializable type and error.

For example:

```go
func stepOne(ctx context.Context) (string, error) {
    fmt.Println("Step one completed")
    return "success", nil
}

func stepTwo(ctx context.Context) (string, error) {
    fmt.Println("Step two completed")
    return "success", nil
}

func workflow(ctx dbos.DBOSContext, _ string) (string, error) {
    _, err := dbos.RunAsStep(ctx, stepOne)
    if err != nil {
        return "failure", err
    }
    _, err = dbos.RunAsStep(ctx, stepTwo)
    if err != nil {
        return "failure", err
    }
    return "success", err
}

func main() {
    ... // Create the DBOS context
    dbos.RegisterWorkflow(dbosContext, workflow)
    ... // Launch DBOS after registering all workflows
}
```

Call workflows with [`RunWorkflow`](../reference/workflows-steps.md#runworkflow).
This starts the workflow in the background and returns a [workflow handle](../reference/workflows-steps.md#workflowhandle) from which you can access information about the workflow or wait for it to complete and return its result.

Here's an example:

```go
func runWorkflowExample(dbosContext dbos.DBOSContext, input string) error {
    handle, err := dbos.RunWorkflow(dbosContext, workflow, input)
    if err != nil {
        return err
    }
    result, err := handle.GetResult()
    if err != nil {
        return err
    }
    fmt.Println("Workflow result:", result)
    return nil
}
```

## Workflow IDs and Idempotency

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this ID through [`GetWorkflowID`](../reference/methods.md#getworkflowid), or from the handle's [`GetWorkflowID`](../reference/workflows-steps.md#workflowhandlegetworkflowid) method.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow using [`WithWorkflowID`](../reference/workflows-steps.md#withworkflowid) when calling `RunWorkflow`.
Workflow IDs must be **globally unique** for your application.
An assigned workflow ID acts as an idempotency key: if a workflow is called multiple times with the same ID, it executes only once.
This is useful if your operations have side effects like making a payment or sending an email.
For example:

```go
func exampleWorkflow(ctx dbos.DBOSContext, input string) (string, error) {
    workflowID, err := dbos.GetWorkflowID(ctx)
    if err != nil {
        return "", err
    }
    fmt.Printf("Running workflow with ID: %s\n", workflowID)
    // ...
    return "success", nil
}

func example(dbosContext dbos.DBOSContext, input string) error {    
    myID := "unique-workflow-id-123"
    handle, err := dbos.RunWorkflow(dbosContext, exampleWorkflow, input, dbos.WithWorkflowID(myID))
    if err != nil {
        log.Fatal(err)
    }
    result, err := handle.GetResult()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Result:", result)
    return nil
}
```

## Determinism

Workflows are in most respects normal Go functions.
They can have loops, branches, conditionals, and so on.
However, a workflow function must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order (given the same return values from those steps).
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in non-deterministic operations in [steps](./step-tutorial.md).

:::warning
Go's goroutine scheduler and `select` operation are non-deterministic. You should use them only inside steps, or use the durable [`Go`](#concurrent-steps) and [`Select`](#selecting-the-first-result) functions instead.
:::

For example, **don't do this**:

```go
func exampleWorkflow(ctx dbos.DBOSContext, input string) (string, error) {
    randomChoice := rand.Intn(2)
    if randomChoice == 0 {
        return dbos.RunAsStep(ctx, stepOne)
    } else {
        return dbos.RunAsStep(ctx, stepTwo)
    }
}
```

Instead, do this:

```go
func generateChoice(ctx context.Context) (int, error) {
    return rand.Intn(2), nil
}

func exampleWorkflow(ctx dbos.DBOSContext, input string) (string, error) {
    randomChoice, err := dbos.RunAsStep(ctx, generateChoice)
    if err != nil {
        return "", err
    }
    if randomChoice == 0 {
        return dbos.RunAsStep(ctx, stepOne)
    } else {
        return dbos.RunAsStep(ctx, stepTwo)
    }
}
```

## Workflow Timeouts

You can set a timeout for a workflow using its input [`DBOSContext`](../reference/dbos-context.md). Use [`WithTimeout`](../reference/dbos-context#withtimeout) to obtain a cancellable `DBOSContext`, as you would with a normal [`context.Context`](https://pkg.go.dev/context#Context).

When the timeout expires, the workflow and all its children are cancelled. Cancelling a workflow sets its status to CANCELLED and preempts its execution at the beginning of its next step. You can detach a child workflow by passing it an uncancellable context, which you can obtain with [`WithoutCancel`](../reference/dbos-context#withoutcancel).

Timeouts are **start-to-completion**: if a workflow is [enqueued](./queue-tutorial.md), the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are durable: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

```go
func exampleWorkflow(ctx dbos.DBOSContext, input string) (string, error) {}

timeoutCtx, cancelFunc := dbos.WithTimeout(dbosCtx, 12*time.Hour)
handle, err := RunWorkflow(timeoutCtx, exampleWorkflow, "wait-for-cancel")
```

You can also manually cancel the workflow by calling its `cancel` function (or calling [CancelWorkflow](./workflow-management.md#cancelling-workflows)).


## Durable Sleep

You can use [`Sleep`](../reference/methods#sleep) to put your workflow to sleep for any period of time.
This sleep is **durable**&mdash;DBOS saves the wakeup time in the database so that even if the workflow is interrupted and restarted multiple times while sleeping, it still wakes up on schedule.

Sleeping is useful for scheduling a workflow to run in the future (even days, weeks, or months from now).
For example:

```go
func runTask(ctx dbos.DBOSContext, task string) (string, error) {
	// Execute the task...
	return "task completed", nil
}

func exampleWorkflow(ctx dbos.DBOSContext, input struct {
	TimeToSleep time.Duration
	Task        string
}) (string, error) {
	// Sleep for the specified duration
	_, err := dbos.Sleep(ctx, input.TimeToSleep)
	if err != nil {
		return "", err
	}

	// Execute the task after sleeping
	result, err := dbos.RunAsStep(
		ctx,
		func(stepCtx context.Context) (string, error) {
			return runTask(ctx, input.Task)
		},
	)
	if err != nil {
		return "", err
	}

	return result, nil
}

```

## Scheduled Workflows

You can schedule workflows to run automatically at specified times using cron syntax with seconds precision.
Scheduled workflows are useful for running recurring tasks like data backups, report generation, or cleanup operations.

To create a scheduled workflow, use [`WithSchedule`](../reference/workflows-steps#withschedule) when registering your workflow.
The workflow must have a single [`time.Time`](https://pkg.go.dev/time#Time) input parameter, representing the scheduled execution time.

**Example syntax:**

```go
func frequentTask(ctx dbos.DBOSContext, scheduledTime time.Time) (string, error) {
    fmt.Printf("Performing a scheduled task at: %s\n", scheduledTime.Format(time.RFC3339))
    ... // Perform a scheduled task operations
    return result, nil
}

func dailyBackup(ctx dbos.DBOSContext, scheduledTime time.Time) (string, error) {
    fmt.Printf("Running daily backup at: %s\n", scheduledTime.Format(time.RFC3339))
    ... // Perform daily backup operations
    return result, nil
}

func main() {
    dbosContext := ... // Initialize DBOS

    // Register a workflow to run daily at 2:00 AM
    dbos.RegisterWorkflow(dbosContext, dailyBackup, 
        dbos.WithSchedule("0 0 2 * * *")) // Cron: daily at 2:00 AM
    
    // Register a workflow to run every 15 minutes
    dbos.RegisterWorkflow(dbosContext, frequentTask,
        dbos.WithSchedule("0 */15 * * * * ")) // Cron: every 15 minutes
    
    // Launch DBOS - scheduled workflows will start automatically
    err := dbos.Launch(dbosContext)
    if err != nil {
        log.Fatal(err)
    }
}
```

## Debouncing

**Debouncing** delays a workflow's execution until some time has passed since it was last called.
This is useful when rapid successive triggers should be coalesced into a single workflow execution.
For example, if a user is editing a text field, you may want to start a processing workflow only after the user stops typing.

To debounce a workflow, define the workflow and queue, then create a [`Debouncer`](../reference/queues.md#debouncer) for it:

```go
func processInput(ctx dbos.DBOSContext, input string) (string, error) {
    fmt.Printf("Processing input: %s\n", input)
    return "processed", nil
}

func main() {
    dbosContext, _ := dbos.NewDBOSContext(context.Background(), dbos.Config{
        AppName:     "debounce-example",
        DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    })

    dbos.RegisterWorkflow(dbosContext, processInput)

    // Create a debouncer with a maximum timeout of 30 seconds
    debouncer := dbos.NewDebouncer(dbosContext, processInput,
        dbos.WithDebouncerTimeout(30*time.Second))

    dbos.Launch(dbosContext)
    defer dbos.Shutdown(dbosContext, 5*time.Second)

    // Each call to Debounce pushes back the workflow start time by the delay.
    // The workflow runs with the most recent input once the delay expires.
    handle, err := debouncer.Debounce(dbosContext, "user-123", 5*time.Second, "first input")
    if err != nil {
        log.Fatal(err)
    }
    // If this call arrives within 5 seconds, the delay resets and the input updates
    handle, err = debouncer.Debounce(dbosContext, "user-123", 5*time.Second, "updated input")
    if err != nil {
        log.Fatal(err)
    }

    result, err := handle.GetResult()
    fmt.Println("Result:", result) // Processed with "updated input"
}
```

Key behaviors:
- Each call to `Debounce` with the same key pushes back the workflow start time by the specified delay.
- When the delay expires without another call, the workflow executes with the most recent input.
- The optional [`WithDebouncerTimeout`](../reference/queues.md#withdebouncertimeout) caps the maximum wait time from the first call. If the timeout is zero (the default), the delay can be pushed back indefinitely.
- Different keys debounce independently, so you can debounce per-user, per-tenant, or per-resource.
- You can create multiple debouncers per workflow, with different timeouts.
- Debouncers must be created before `Launch()`.

### Debouncing from an External Application

You can also debounce workflows from outside your DBOS application using a [`DebouncerClient`](../reference/client.md#newdebouncerclient):

```go
config := dbos.ClientConfig{
    DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
}
client, err := dbos.NewClient(context.Background(), config)
if err != nil {
    log.Fatal(err)
}
defer client.Shutdown(5 * time.Second)

dc := dbos.NewDebouncerClient[string, string]("processInput", client,
    dbos.WithDebouncerTimeout(30*time.Second))

handle, err := dc.Debounce("user-123", 5*time.Second, "some input")
if err != nil {
    log.Fatal(err)
}
```

## Concurrent Steps

Golang offers two building blocks to execute work concurrently: `go` and `select`. `go` starts a new goroutine and `select` allows to poll from a list of channels.
Unfortunately these primitive are non-deterministic: the Golang scheduler does not guarantee the order in which goroutines are scheduled, nor does it guarantee that the same channel will, out of a set of ready channels, will be selected, when the same code runs multiple time.
This is a challenge for durable execution frameworks that require code to be deterministic.

To make these building blocks available to your workflows, DBOS provides durable [`Go`](../reference/workflows-steps.md#go) and [`Select`](../reference/workflows-steps.md#select) functions to run multiple steps concurrently within a workflow while preserving durability guarantees.

- **`Go`** launches a step asynchronously and returns a channel for retrieving the result later.
- **`Select`** waits for the first result from multiple concurrent steps.

### Running Concurrent Steps with Go

Use [`Go`](../reference/workflows-steps.md#go) to launch a step that runs in the background while your workflow continues.
The function returns immediately with a channel that will receive the step's result when it completes.

```go
func workflow(ctx dbos.DBOSContext, _ string) (string, error) {
    // Launch a step asynchronously
    resultChan, err := dbos.Go(ctx, func(ctx context.Context) (string, error) {
        // Perform some work...
        return "step completed", nil
    })
    if err != nil {
        return "", err
    }

    // Do other work while the step runs...

    // Wait for the result
    outcome := <-resultChan
    if outcome.Err != nil {
        return "", outcome.Err
    }
    return outcome.Result, nil
}
```

You can launch multiple steps concurrently:

```go
func workflow(ctx dbos.DBOSContext, urls []string) ([]string, error) {
    // Launch multiple steps concurrently
    var channels []<-chan dbos.StepOutcome[string]
    for _, url := range urls {
        url := url // Capture loop variable
        ch, err := dbos.Go(ctx, func(ctx context.Context) (string, error) {
            return fetchURL(ctx, url)
        })
        if err != nil {
            return nil, err
        }
        channels = append(channels, ch)
    }

    // Collect all results
    var results []string
    for _, ch := range channels {
        outcome := <-ch
        if outcome.Err != nil {
            return nil, outcome.Err
        }
        results = append(results, outcome.Result)
    }
    return results, nil
}
```

### Selecting the First Result

Use [`Select`](../reference/workflows-steps.md#select) to wait for the first result from multiple concurrent steps.
This is useful for racing multiple operations or implementing timeout patterns.

```go
func workflow(ctx dbos.DBOSContext, _ string) (string, error) {
    // Launch two concurrent steps
    ch1, err := dbos.Go(ctx, func(ctx context.Context) (string, error) {
        // Query primary database
        return queryPrimaryDB(ctx)
    })
    if err != nil {
        return "", err
    }

    ch2, err := dbos.Go(ctx, func(ctx context.Context) (string, error) {
        // Query replica database
        return queryReplicaDB(ctx)
    })
    if err != nil {
        return "", err
    }

    // Wait for the first result
    result, err := dbos.Select(ctx, []<-chan dbos.StepOutcome[string]{ch1, ch2})
    if err != nil {
        return "", err
    }
    return result, nil
}
```

### Determinism and Recovery

`Go` and `Select` maintain workflow determinism by checkpointing:
- Each `Go` call is assigned a deterministic step ID, ensuring steps execute in the same order during recovery.
- `Select` checkpoints which channel was selected and its value, so replays return the same result regardless of actual execution timing.

This means you can safely use `Go` and `Select` for concurrent operations without worrying about non-deterministic behavior during workflow recovery.

## Workflow Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process is interrupted while executing a workflow and restarts, it resumes the workflow from the last completed step.
2.  [Steps](./step-tutorial.md) are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed (returned a value or thrown an exception to the calling workflow), it will never be re-executed.

If an exception is thrown from a workflow, the workflow **terminates**&mdash;DBOS records the exception, sets the workflow status to `ERROR`, and **does not recover the workflow**.
This is because uncaught exceptions are assumed to be nonrecoverable.
If your workflow performs operations that may transiently fail (for example, sending HTTP requests to unreliable services), those should be performed in [steps with configured retries](./step-tutorial.md#configurable-retries).
DBOS provides [tooling](./workflow-management.md) to help you identify failed workflows and examine the specific uncaught exceptions.

## Workflow Versioning and Recovery

DBOS **versions** applications and workflows.
All workflows are tagged with the application version on which they started.
By default, application version is automatically computed from a hash of workflow source code.
However, you can set your own version through configuration.

```go
dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
    AppName:            "dbos-app",
    DatabaseURL:        os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    ApplicationVersion: "1.0.0",
})
```

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.

When using versioning, we recommend **blue-green** code upgrades.
When deploying a new version of your code, launch new processes running your new code version, but retain some processes running your old code version.
Direct new traffic to your new processes while your old processes "drain" and complete all workflows of the old code version.
Then, once all workflows of the old version are complete (you can use [`ListWorkflows`](../reference/methods.md#listworkflows) to check), you can retire the old code version.

## Workflow Attempts and Recovery

The `Attempts` field in [`WorkflowStatus`](../reference/methods.md#workflow-status) tracks how many times a workflow has been executed.

- On first execution, `Attempts` is set to `1`.
- If the workflow is enqueued but not yet dequeued, `Attempts` is `0`.
- Each time the workflow is recovered (e.g., after a crash) or dequeued for execution, `Attempts` is incremented by `1`.

You can limit the number of attempts using [`WithMaxRetries`](../reference/workflows-steps.md#withmaxretries) when registering a workflow.
If `WithMaxRetries(n)` is set, the workflow may be attempted at most `n + 1` times (one initial execution plus `n` retries).
If this limit is exceeded, the workflow's status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED` and it will no longer be recovered automatically.

This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue), preventing a buggy workflow that crashes its application from doing so infinitely.
You can use [`ResumeWorkflow`](../reference/methods.md#resumeworkflow) to manually resume a workflow that has exceeded its maximum attempts after fixing the underlying issue.

:::tip
The number of attempts will be increased one last time before the workflow is placed in the DLQ.
For example a workflow with max retries of 1 that has been moved to the DLQ will show 3 attempts.
:::

```go
// Register a workflow that can be attempted at most 4 times (1 initial + 3 retries)
dbos.RegisterWorkflow(dbosContext, myWorkflow, dbos.WithMaxRetries(3))
```

You can inspect the current attempt count of a workflow via its status:

```go
handle, _ := dbos.RunWorkflow(dbosContext, myWorkflow, input)
status, _ := handle.GetStatus()
fmt.Printf("Attempt #%d\n", status.Attempts)
```