---
sidebar_position: 30
title: AI Model Prompting
---

You may want assistance from an AI model in building a DBOS application.
To make sure your model has the latest information on how to use DBOS, provide it with this prompt.

## How To Use

First, use the click-to-copy button in the top right of the code block to copy the full prompt to your clipboard.
Then, paste into your AI tool of choice (for example OpenAI's ChatGPT or Anthropic's Claude).
This adds the prompt to your AI model's context, giving it up-to-date instructions on how to build an application with DBOS.

If you are using an AI-powered IDE, you can add this prompt to your project's context.
For example:

- Claude Code: Add the prompt, or a link to it, to your CLAUDE.md file.
- Cursor: Add the prompt to [your project rules](https://docs.cursor.com/context/rules-for-ai).
- Zed: Copy the prompt to a file in your project, then use the [`/file`](https://zed.dev/docs/assistant/commands?highlight=%2Ffile#file) command to add the file to your context.
- GitHub Copilot: Create a [`.github/copilot-instructions.md`](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) file in your repository and add the prompt to it.

## Prompt

````markdown
# Build Reliable Applications With DBOS

## Guidelines

- Respond in a friendly and concise manner
- Ask clarifying questions when requirements are ambiguous
- Generate code in Golang using the DBOS library.
- You MUST import everything used in the code you generate
- You SHALL keep all code in a single file unless otherwise specified.
- DBOS does NOT stand for anything.

## Workflow Guidelines

Workflows provide durable execution so you can write programs that are resilient to any failure.
Workflows are comprised of steps, which are ordinary Golang functions called with dbos.RunAsStep.
When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a step using dbos.RunAsStep.

If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

- If asked to add DBOS to existing code, you MUST ask which function to make a workflow. Do NOT recommend any changes until they have told you what function to make a workflow. Do NOT make a function a workflow unless SPECIFICALLY requested.
- When making a function a workflow, you should make all functions it calls steps. Do NOT change the functions in any way.
- Do NOT make functions steps unless they are DIRECTLY called by a workflow.
- If the workflow function performs a non-deterministic action, you MUST move that action to its own function and make that function a step. Examples of non-deterministic actions include accessing an external API or service, accessing files on disk, generating a random number, of getting the current time.
- Do NOT start goroutines from workflows or use select in workflows. For any complex parallel execution, you should instead use DBOS.RunWorkflow and DBOS queues to achieve the parallelism.
- DBOS workflows and steps should NOT have side effects in memory outside of their own scope. They can access global variables, but they should NOT create or update global variables or variables outside their scope.
- Do NOT call any DBOS context method (DBOS.send, DBOS.recv, DBOS.startWorkflow, DBOS.sleep, DBOS.setEvent, DBOS.getEvent) from a step.
- Do NOT call recv or RunWorkflow or RunAsStep form a step

## DBOS Lifecycle Guidelines

DBOS should be installed and imported from the `github.com/dbos-inc/dbos-transact-golang/dbos` package.

DBOS programs MUST have a main file (typically 'main.go') that creates all objects and workflow functions during startup.

Any DBOS program MUST create and launch a DBOS context in their main function.
All workflows must be registered and queues created BEFORE DBOS is launched
You MUST use this default configuration (changing the name as appropriate) unless otherwise specified.

```go
func main() {
    dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
        AppName:     "dbos-starter",
        DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    })
    if err != nil {
        panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
    }

    dbos.RegisterWorkflow(dbosContext, workflow)

    err = dbos.Launch(dbosContext)
    if err != nil {
        panic(fmt.Sprintf("Launching DBOS failed: %v", err))
    }
    defer dbos.Shutdown(dbosContext, 5 * time.Second)
}
```

Here is an example main function using Gin:

```javascript
import (
    "context"
    "fmt"
    "net/http"
    "os"
    "time"

    "github.com/dbos-inc/dbos-transact-golang/dbos"
    "github.com/gin-gonic/gin"
)

func main() {
    dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
        AppName:     "dbos-starter",
        DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    })
    if err != nil {
        panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
    }

    dbos.RegisterWorkflow(dbosContext, workflow)

    err = dbos.Launch(dbosContext)
    if err != nil {
        panic(fmt.Sprintf("Launching DBOS failed: %v", err))
    }
    defer dbos.Shutdown(dbosContext, 5 * time.Second)

    r := gin.Default()

    r.GET("/", func(c *gin.Context) {
        dbos.RunWorkflow(dbosContext, workflow, "")
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error in DBOS workflow: %v", err)})
            return
        }
        c.Status(http.StatusOK)
    })

    r.Run(":8080")
}
```

## Workflow and Steps Examples

Simple example:

```go showLineNumbers title="main.go"
package main

import (
    "context"
    "fmt"
    "os"
    "time"

    "github.com/dbos-inc/dbos-transact-golang/dbos"
)

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

func stepOne(ctx context.Context) (string, error) {
    fmt.Println("Step one completed")
    return "success", nil
}

func stepTwo(ctx context.Context) (string, error) {
    fmt.Println("Step two completed")
    return "success", nil
}

func main() {
    dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
        AppName:     "dbos-starter",
        DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    })
    if err != nil {
        panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
    }

    dbos.RegisterWorkflow(dbosContext, workflow)

    err = dbos.Launch(dbosContext)
    if err != nil {
        panic(fmt.Sprintf("Launching DBOS failed: %v", err))
    }
    defer dbos.Shutdown(dbosContext, 5 * time.Second)

    handle, err := dbos.RunWorkflow(dbosContext, workflow, "")
    if err != nil {
        panic(fmt.Sprintf("Error in DBOS workflow: %v", err))
    }
    result, err := handle.GetResult()
    if err != nil {
        panic(fmt.Sprintf("Error in DBOS workflow: %v", err))
    }
    fmt.Println("Workflow result:", result)
}
```

Example with Gin:

```go showLineNumbers title="main.go"
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "time"

    "github.com/dbos-inc/dbos-transact-golang/dbos"
    "github.com/gin-gonic/gin"
)

func workflow(ctx dbos.DBOSContext, _ string) (string, error) {
    _, err := dbos.RunAsStep(ctx, stepOne)
    if err != nil {
        return "failure", err
    }
    for range 5 {
        fmt.Println("Press Control + C to stop the app...")
        dbos.Sleep(ctx, time.Second)
    }
    _, err = dbos.RunAsStep(ctx, stepTwo)
    if err != nil {
        return "failure", err
    }
    return "success", err
}

func stepOne(ctx context.Context) (string, error) {
    fmt.Println("Step one completed")
    return "success", nil
}

func stepTwo(ctx context.Context) (string, error) {
    fmt.Println("Step two completed")
    return "success", nil
}

func main() {
    dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
        AppName:     "dbos-starter",
        DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    })
    if err != nil {
        panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
    }

    dbos.RegisterWorkflow(dbosContext, workflow)

    err = dbos.Launch(dbosContext)
    if err != nil {
        panic(fmt.Sprintf("Launching DBOS failed: %v", err))
    }
    defer dbos.Shutdown(dbosContext, 5 * time.Second)

    r := gin.Default()

    r.GET("/", func(c *gin.Context) {
        dbos.RunWorkflow(dbosContext, workflow, "")
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error in DBOS workflow: %v", err)})
            return
        }
        c.Status(http.StatusOK)
    })

    r.Run(":8080")
}
```

Example with queues:

```go showLineNumbers title="main.go"
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "time"

    "github.com/dbos-inc/dbos-transact-golang/dbos"
    "github.com/gin-gonic/gin"
)

func taskWorkflow(ctx dbos.DBOSContext, i int) (int, error) {
    dbos.Sleep(ctx, 5*time.Second)
    fmt.Printf("Task %d completed\n", i)
    return i, nil
}

func queueWorkflow(ctx dbos.DBOSContext, queue dbos.WorkflowQueue) (int, error) {
    fmt.Println("Enqueuing tasks")
    handles := make([]dbos.WorkflowHandle[int], 10)
    for i := range 10 {
        handle, err := dbos.RunWorkflow(ctx, taskWorkflow, i, dbos.WithQueue(queue.Name))
        if err != nil {
            return 0, err
        }
        handles[i] = handle
    }
    results := make([]int, 10)
    for i, handle := range handles {
        result, err := handle.GetResult()
        if err != nil {
            return 0, err
        }
        results[i] = result
    }
    fmt.Printf("Successfully completed %d tasks\n", len(results))
    return len(results), nil
}

func main() {
    dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
        AppName:     "dbos-starter",
        DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    })
    if err != nil {
        panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
    }

    queue := dbos.NewWorkflowQueue(dbosContext, "queue")
    dbos.RegisterWorkflow(dbosContext, queueWorkflow)
    dbos.RegisterWorkflow(dbosContext, taskWorkflow)

    err = dbos.Launch(dbosContext)
    if err != nil {
        panic(fmt.Sprintf("Launching DBOS failed: %v", err))
    }
    defer dbos.Shutdown(dbosContext, 5 * time.Second)

    r := gin.Default()

    r.GET("/", func(c *gin.Context) {
        dbos.RunWorkflow(dbosContext, queueWorkflow, queue)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error in DBOS workflow: %v", err)})
            return
        }
        c.Status(http.StatusOK)
    })

    r.Run(":8080")
}
```

## Workflow Documentation

---
sidebar_position: 10
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of steps, which wrap ordinary Go functions.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

To write a workflow, register a Go function with `RegisterWorkflow`.
Workflow registration must happen before launching the DBOS context with `dbos.Launch()`
The function's signature must match:

```go
type Workflow[P any, R any] func(ctx DBOSContext, input P) (R, error)
```

In other words, a workflow must take in a DBOS context and one other input of any serializable (gob-encodable) type and must return one output of any serializable type and error.

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

Call workflows with `RunWorkflow`.
This starts the workflow in the background and returns a workflow handle from which you can access information about the workflow or wait for it to complete and return its result.

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

Every time you execute a workflow, that execution is assigned a unique ID, by default a UUID.
You can access this ID through `GetWorkflowID`, or from the handle's `GetWorkflowID` method.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow using `WithWorkflowID` when calling `RunWorkflow`.
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
Instead, you should do all database operations in non-deterministic operations in steps.

:::warning
Go's goroutine scheduler and `select` operation are non-deterministic. You should use them only inside steps.
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

You can set a timeout for a workflow using its input `DBOSContext`. Use `WithTimeout` to obtain a cancellable `DBOSContext`, as you would with a normal `context.Context`.

When the timeout expires, the workflow and all its children are cancelled. Cancelling a workflow sets its status to CANCELLED and preempts its execution at the beginning of its next step. You can detach a child workflow by passing it an uncancellable context, which you can obtain with `WithoutCancel`.

Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are durable: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

```go
func exampleWorkflow(ctx dbos.DBOSContext, input string) (string, error) {}

timeoutCtx, cancelFunc := dbos.WithTimeout(dbosCtx, 12*time.Hour)
handle, err := RunWorkflow(timeoutCtx, exampleWorkflow, "wait-for-cancel")
```

You can also manually cancel the workflow by calling its `cancel` function (or calling CancelWorkflow).


## Durable Sleep

You can use `Sleep` to put your workflow to sleep for any period of time.
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

To create a scheduled workflow, use `WithSchedule` when registering your workflow.
The workflow must have a single `time.Time` input parameter, representing the scheduled execution time.

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

## Workflow Versioning and Recovery

Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the application source code (this can be overridden through configuration).
All workflows are tagged with the application version on which they started.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
You cannot change the version of a workflow, but you can use `ForkWorkflow` to restart a workflow from a specific step on a specific code version.

For more information on managing workflow recovery when self-hosting production DBOS applications, check out the guide.
