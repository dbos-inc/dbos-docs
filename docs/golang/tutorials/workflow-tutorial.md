---
sidebar_position: 10
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of [steps](./step-tutorial.md), which wrap ordinary Go functions.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

To write a workflow, register a Go function with [`RegisterWorkflow`](../reference/workflows-steps.md#dbosregisterworkflow).
The function's signature must match:

```go
type Workflow[P any, R any] func(ctx DBOSContext, input P) (R, error)
```

In other words, a workflow must take in a DBOS context and one other input of any serializable ([gob-encodable](https://pkg.go.dev/encoding/gob)) type and must return one output of any serializable type and error.

:::info
Workflows and queues registration must happen before launching the DBOS context with `DBOSContext.Launch()`
:::

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

Call workflows with [`RunWorkflow`](../reference/workflows-steps.md#dbosrunworkflow).
This starts the workflow in the background and returns a [workflow handle](../reference/workflows-steps.md#workflowhandle) from which you can access information about the workflow or wait for it to complete and return its result.

Here's an example:

```go
func example(dbosContext dbos.DBOSContext, input string) error {
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
You can access this ID through [`GetWorkflowID`](../reference/dbos-context.md), or from the handle's [`GetWorkflowID`](../reference/workflows-steps.md#workflowhandlegetworkflowid) method.
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

For example, **don't do this**:

```go
func exampleWorkflow(ctx dbos.DBOSContext, input string) (string, error) {
    // Don't make an HTTP request directly in a workflow function
    resp, err := http.Get("https://example.com")
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }
    // Process body...
    return string(body), nil
}
```

Instead, do this:

```go
func exampleWorkflow(ctx dbos.DBOSContext, input string) (string, error) {
    // Make HTTP requests in steps
    body, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        resp, err := http.Get("https://example.com")
        if err != nil {
            return "", err
        }
        defer resp.Body.Close()
        bodyBytes, err := io.ReadAll(resp.Body)
        if err != nil {
            return "", err
        }
        return string(bodyBytes), nil
    })
    if err != nil {
        return "", err
    }
    
    // Process the body in another step...
    return body, nil
}
```

:::warning
Go's goroutine scheduler and `select` operation are non-deterministic. You should use them inside a step.
We will be adding durable dbos.Go and dbos.Select methods in an upcoming release.
:::

## Workflow Timeouts

You can set a timeout for a workflow using its input [`DBOSContext`](../reference/dbos-context.md). Use [`WithTimeout`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#WithTimeout) to obtain a cancellable `DBOSContext`, as you would with a normal [`context.Context`](https://pkg.go.dev/context#Context).

When the timeout expires, the workflow and all its children are cancelled. Cancelling a workflow sets its status to CANCELLED and preempts its execution at the beginning of its next step. You can detach a child workflow by passing it an uncancellable context, which you can obtain with [`WithoutCancel`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#WithoutCancel).

Timeouts are **start-to-completion**: if a workflow is [enqueued](./queue-tutorial.md), the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are durable: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

```go
func exampleWorkflow(ctx dbos.DBOSContext, input string) (string, error) {}

timeoutCtx, cancelFunc := dbos.WithTimeout(dbosCtx, 12*time.Hour)
handle, err := RunWorkflow(timeoutCtx, exampleWorkflow, "wait-for-cancel")
```

You can also manually cancel the workflow by calling its `cancel` function (or calling [CancelWorkflow](./workflow-management.md#cancelling-workflows)).

To detach a child workflow from its parent timeout, you can use [`WithoutCancel`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#WithoutCancel) to obtain an uncancellable `DBOSContext` and pass it to  `dbos.RunWorkflow`.

## Durable Sleep

You can use [`Sleep`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#Sleep) to put your workflow to sleep for any period of time.
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
    result, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return runTask(ctx, input.Task)
    })
    if err != nil {
        return "", err
    }
    
    return result, nil
}
```

## Workflow Events

Workflows can emit _events_, which are key-value pairs associated with the workflow's ID.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### SetEvent

Any workflow can call [`SetEvent`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#SetEvent) to publish a key-value pair, or update its value if has already been published.

```go
func SetEvent[P any](ctx DBOSContext, key string, message P) error
```

#### GetEvent

You can call [`GetEvent`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#GetEvent) to retrieve the value published by a particular workflow ID for a particular key.
If the event does not yet exist, this call waits for it to be published, returning an error if the wait times out.

```go
func GetEvent[R any](ctx DBOSContext, targetWorkflowID, key string, timeout time.Duration) (R, error)
```

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in an e-commerce application, the checkout workflow, after validating an order, directs the customer to a secure payments service to handle credit card processing.
To communicate the payments URL to the customer, it uses events.

The checkout workflow emits the payments URL using `SetEvent`:

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

The HTTP handler that originally started the workflow uses `GetEvent` to await this URL, then redirects the customer to it:

```go
func webCheckoutHandler(dbosContext dbos.DBOSContext, w http.ResponseWriter, r *http.Request) {
    orderData := parseOrderData(r) // Parse order from request
    
    handle, err := dbos.RunWorkflow(dbosContext, checkoutWorkflow, orderData)
    if err != nil {
        http.Error(w, "Failed to start checkout", http.StatusInternalServerError)
        return
    }
    
    // Wait up to 30 seconds for the payment URL event
    url, err := dbos.GetEvent[string](dbosContext, handle.GetWorkflowID(), PaymentURLKey, 30*time.Second)
    if err != nil {
        // Handle a timeout
    }
    
    // Redirect the customer
}
```

#### Reliability Guarantees

All events are persisted to the database, so the latest version of an event is always retrievable.
Additionally, if `getEvent` is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated later.

## Workflow Messaging and Notifications
You can send messages to a specific workflow ID.
This is useful for sending notifications to an active workflow.

#### Send

You can call [`Send`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#Send) to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

```go
func Send[P any](ctx DBOSContext, destinationID string, message P, topic string) error
```

#### Recv

Workflows can call [`Recv`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#Recv) to receive messages sent to them, optionally for a particular topic.
Each call to `Recv` waits for and consumes the next message to arrive in the queue for the specified topic, returning an error if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

```go
func Recv[R any](ctx DBOSContext, topic string, timeout time.Duration) (R, error)
```

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in an e-commerce application, the checkout workflow, after redirecting customers to a secure payments service, must wait for a notification from that service that the payment has finished processing.

To wait for this notification, the payments workflow uses `Recv`, executing failure-handling code if the notification doesn't arrive in time:

```go
const PaymentStatusTopic = "payment_status"

func checkoutWorkflow(ctx dbos.DBOSContext, orderData OrderData) (string, error) {
    // Process initial checkout steps...
    
    // Wait for payment notification with a 5-minute timeout
    notification, err := dbos.Recv[PaymentNotification](ctx, PaymentStatusTopic, 5*time.Minute)
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

A webhook waits for the payment processor to send the notification, then uses `Send` to forward it to the workflow:

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

## Scheduled Workflows

You can schedule workflows to run automatically at specified times using cron syntax with seconds precision.
Scheduled workflows are useful for running recurring tasks like data backups, report generation, or cleanup operations.

To create a scheduled workflow, use [`WithSchedule`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#WithSchedule) when registering your workflow.
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
    err := dbosContext.Launch()
    if err != nil {
        log.Fatal(err)
    }
}
```
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

Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the application source code (this can be overridden through configuration).
All workflows are tagged with the application version on which they started.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
You cannot change the version of a workflow, but you can use [`ForkWorkflow`](./workflow-management.md#forking-workflows) to restart a workflow from a specific step on a specific code version.

For more information on managing workflow recovery when self-hosting production DBOS applications, check out [the guide](../../production/self-hosting/workflow-recovery.md).
