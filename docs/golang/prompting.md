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
- Cursor: Add the prompt to your project rules.
- Zed: Copy the prompt to a file in your project, then use the `/file` command to add the file to your context.
- GitHub Copilot: Create a `.github/copilot-instructions.md` file in your repository and add the prompt to it.

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


## Steps

When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

You can use `RunAsStep` to call a function as a step.
For a function to be used as a step, it should return a serializable (gob-encodable) value and an error and have this signature:

```go
type Step[R any] func(ctx context.Context) (R, error)
```

Here's a simple example:

```go
func generateRandomNumber(ctx context.Context) (int, error) {
    return rand.Int(), nil
}

func workflowFunction(ctx dbos.DBOSContext, n int) (int, error) {
    randomNumber, err := dbos.RunAsStep(
        ctx,
        generateRandomNumber,
        dbos.WithStepName("generateRandomNumber"),
    )
    if err != nil {
        return 0, err
    }
    return randomNumber, nil
}
```

You can pass arguments into a step by wrapping it in an anonymous function, like this:

```go
func generateRandomNumber(ctx context.Context, n int) (int, error) {
    return rand.IntN(n), nil
}

func workflowFunction(ctx dbos.DBOSContext, n int) (int, error) {
    randomNumber, err := dbos.RunAsStep(
        ctx,
        func(stepCtx context.Context) (int, error) {
            return generateRandomNumber(stepCtx, n)
        },
        dbos.WithStepName("generateRandomNumber")
    )
    if err != nil {
        return 0, err
    }
    return randomNumber, nil
}
```

You should make a function a step if you're using it in a DBOS workflow and it performs a **nondeterministic** operation.
A nondeterministic operation is one that may return different outputs given the same inputs.
Common nondeterministic operations include:

- Accessing an external API or service, like serving a file from AWS S3, calling an external API like Stripe, or accessing an external data store like Elasticsearch.
- Accessing files on disk.
- Generating a random number.
- Getting the current time.

You **cannot** call, start, or enqueue workflows from within steps.
You also cannot call DBOS methods like `Send` or `SetEvent` from within steps.
These operations should be performed from workflow functions.
You can call one step from another step, but the called step becomes part of the calling step's execution rather than functioning as a separate step.

### Configurable Retries

You can optionally configure a step to automatically retry any error a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
Retries are configurable through step options that can be passed to `RunAsStep`.

Available retry configuration options include:
- `WithStepName` - Custom name for the step (default to the Go runtime reflection value)
- `WithStepMaxRetries` - Maximum number of times this step is automatically retried on failure (default 0)
- `WithMaxInterval` - Maximum delay between retries (default 5s)
- `WithBackoffFactor` - Exponential backoff multiplier between retries (default 2.0)
- `WithBaseInterval` - Initial delay between retries (default 100ms)

For example, let's configure this step to retry failures (such as if the site to be fetched is temporarily down) up to 10 times:

```go
func fetchStep(ctx context.Context, url string) (string, error) {
    resp, err := http.Get(url)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }

    return string(body), nil
}

func fetchWorkflow(ctx dbos.DBOSContext, inputURL string) (string, error) {
    return dbos.RunAsStep(
        ctx,
        func(stepCtx context.Context) (string, error) {
            return fetchStep(stepCtx, inputURL)
        },
        dbos.WithStepName("fetchFunction"),
        dbos.WithStepMaxRetries(10),
        dbos.WithMaxInterval(30*time.Second),
        dbos.WithBackoffFactor(2.0),
        dbos.WithBaseInterval(500*time.Millisecond),
    )
}
```

If a step exhausts all retry attempts, it returns an error to the calling workflow.

## Workflow Communication

DBOS provides a few different ways to communicate with your workflows.
You can:

- Send messages to workflows
- Publish events from workflows for clients to read


## Workflow Messaging and Notifications
You can send messages to a specific workflow.
This is useful for signaling a workflow or sending notifications to it while it's running.

<img src={require('@site/static/img/workflow-communication/workflow-messages.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### Send

```go
func SendP any error
```

You can call `Send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

#### Recv

```go
func RecvR any (R, error)
```

Workflows can call `Recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `Recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning an error if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in an e-commerce application, the checkout workflow, after redirecting customers to a secure payments service, must wait for a notification from that service that the payment has finished processing.

To wait for this notification, the payments workflow uses `Recv()`, executing failure-handling code if the notification doesn't arrive in time:

```go
const PaymentStatusTopic = "payment_status"

func checkoutWorkflow(ctx dbos.DBOSContext, orderData OrderData) (string, error) {
    // Process initial checkout steps...

    // Wait for payment notification with a 5-minute timeout
    notification, err := dbos.RecvPaymentNotification
    if err != nil {
        ... // Handle timeout or other errors
    }

    // Handle the notification
    if notification.Status == "completed" {
      ... // Handle the notification.
    } else {
      ... // Handle a failure
    }
}
```

A webhook waits for the payment processor to send the notification, then uses `Send()` to forward it to the workflow:

```go
func paymentWebhookHandler(w http.ResponseWriter, r *http.Request) {
    // Parse the notification from the payment processor
    notification := ...
    // Retrieve the workflow ID from notification metadata
    workflowID := ...

    // Send the notification to the waiting workflow
    err := dbos.Send(dbosContext, workflowID, notification, PaymentStatusTopic)
    if err != nil {
        http.Error(w, "Failed to send notification", http.StatusInternalServerError)
        return
    }
}
```

#### Reliability Guarantees

All messages are persisted to the database, so if `Send` completes successfully, the destination workflow is guaranteed to be able to `Recv` it.
If you're sending a message from a workflow, DBOS guarantees exactly-once delivery.

## Workflow Events

Workflows can publish _events_, which are key-value pairs associated with the workflow.
They are useful for publishing information about the status of a workflow or to send a result to clients while the workflow is running.

<img src={require('@site/static/img/workflow-communication/workflow-events.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### SetEvent

```go
func SetEventP any error
```

Any workflow can call `SetEvent` to publish a key-value pair, or update its value if has already been published.

#### GetEvent

```go
func GetEventR any (R, error)
```

You can call `GetEvent` to retrieve the value published by a particular workflow ID for a particular key.
If the event does not yet exist, this call waits for it to be published, returning an error if the wait times out.

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in an e-commerce application, the checkout workflow, after validating an order, directs the customer to a secure payments service to handle credit card processing.
To communicate the payments URL to the customer, it uses events.

The checkout workflow emits the payments URL using `SetEvent()`:

```go
const PaymentURLKey = "payment_url"

func checkoutWorkflow(ctx dbos.DBOSContext, orderData OrderData) (string, error) {
    // Process order validation...

    paymentsURL := ...
    err := dbos.SetEvent(ctx, PaymentURLKey, paymentsURL)
    if err != nil {
        return "", fmt.Errorf("failed to set payment URL event: %w", err)
    }

    // Continue with checkout process...
}
```

The HTTP handler that originally started the workflow uses `GetEvent()` to await this URL, then redirects the customer to it:

```go
func webCheckoutHandler(dbosContext dbos.DBOSContext, w http.ResponseWriter, r *http.Request) {
    orderData := parseOrderData(r) // Parse order from request

    handle, err := dbos.RunWorkflow(dbosContext, checkoutWorkflow, orderData)
    if err != nil {
        http.Error(w, "Failed to start checkout", http.StatusInternalServerError)
        return
    }

    // Wait up to 30 seconds for the payment URL event
    url, err := dbos.GetEventstring, PaymentURLKey, 30*time.Second)
    if err != nil {
        // Handle a timeout
    }

    // Redirect the customer
}
```

#### Reliability Guarantees

All events are persisted to the database, so the latest version of an event is always retrievable.
Additionally, if `GetEvent` is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated.


## Queues


You can use queues to run many workflows at once with managed concurrency.
Queues provide _flow control_, letting you manage how many workflows run at once or how often workflows are started.

To create a queue, use `NewWorkflowQueue`

```go
queue := dbos.NewWorkflowQueue(dbosContext, "example_queue")
```

You can then enqueue any workflow using `WithQueue` when calling `RunWorkflow`.
Enqueuing a function submits it for execution and returns a handle to it.
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

### Enqueueing from Another Application

Often, you want to enqueue a workflow from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

You can use the DBOS Client to enqueue workflows from outside your DBOS application by connecting directly to your DBOS application's system database.
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

You can set a deduplication ID for an enqueued workflow using `WithDeduplicationID` when calling `RunWorkflow`.
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

You can set a priority for an enqueued workflow using `WithPriority` when calling `RunWorkflow`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
If using priority, you must set `WithPriorityEnabled` on your queue.

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


