---
sidebar_position: 20
title: Workflows & Steps
---

### RegisterWorkflow

```go
func RegisterWorkflow[P any, R any](ctx DBOSContext, fn Workflow[P, R], opts ...WorkflowRegistrationOption)
```

Register a function as a DBOS workflow.
All workflows must be registered before the context is launched.

Workflow functions must be compatible with the following signature:

```go
type Workflow[P any, R any] func(ctx DBOSContext, input P) (R, error)
```

**Parameters:**
- **ctx**: The DBOSContext.
- **fn**: The workflow function to register.
- **opts**: Functional options for workflow registration, documented below.

#### WithMaxRetries

```go
func WithMaxRetries(maxRetries int) WorkflowRegistrationOption
```

Configure the maximum number of times execution of a workflow may be attempted.
This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue) so that a buggy workflow that crashes its application (for example, by running it out of memory) does not do so infinitely.
If a workflow exceeds this limit, its status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED` and it may no longer be executed.

#### WithSchedule

```go
func WithSchedule(schedule string) WorkflowRegistrationOption
```

Registers the workflow as a scheduled workflow using cron syntax.
The schedule string follows standard cron format with second precision.
Scheduled workflows automatically receive a `time.Time` input parameter. 

#### WithWorkflowName

```go
func WithWorkflowName(name string) WorkflowRegistrationOption
```

Register a workflow with a custom name.
If not provided, the name of the workflow function is used.

### RunWorkflow

```go
func RunWorkflow[P any, R any](ctx DBOSContext, fn Workflow[P, R], input P, opts ...WorkflowOption) (WorkflowHandle[R], error)
```

Execute a workflow function.
The workflow may execute immediately or be enqueued for later execution based on options.
Returns a [WorkflowHandle](#workflowhandle) that can be used to check the workflow's status or wait for its completion and retrieve its results.

**Parameters:**
- **ctx**: The DBOSContext.
- **fn**: The workflow function to execute.
- **input** The input to the workflow function.
- **opts**: Functional options for workflow execution, documented below.

**Example Syntax**:

```go
func workflow(ctx dbos.DBOSContext, input string) (string, error) {
    return "success", err
}

func example(input string) error {
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

#### WithWorkflowID

```go
func WithWorkflowID(id string) WorkflowOption
```

Run the workflow with a custom workflow ID.
If not specified, a UUID workflow ID is generated.

#### WithQueue

```go
func WithQueue(queueName string) WorkflowOption
```

Enqueue the workflow to the specified queue instead of executing it immediately.
Queued workflows will be dequeued and executed according to the queue's configuration.

#### WithDeduplicationID

```go
func WithDeduplicationID(id string) WorkflowOption
```

Set a deduplication ID for this workflow.
Should be used alongside `WithQueue`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in a given queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise an exception.

#### WithPriority

```go
func WithPriority(priority uint) WorkflowOption
```

Set a queue priority for the workflow.
Should be used alongside `WithQueue`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order.
Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. 
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.

#### WithApplicationVersion

```go
func WithApplicationVersion(version string) WorkflowOption
```

Set the application version for this workflow, overriding the version in DBOSContext.

#### WithAuthenticatedUser

```go
func WithAuthenticatedUser(user string) WorkflowOption
```

Associate the workflow execution with a user name. Useful to define workflow identity.

### RunAsStep

```go
func RunAsStep[R any](ctx DBOSContext, fn Step[R], opts ...StepOption) (R, error)
```

Execute a function as a step in a durable workflow.

**Parameters:**
- **ctx**: The DBOSContext.
- **fn**: The step to execute, typically wrapped in an anonymous function. Syntax shown below.
- **opts**: Functional options for step execution, documented below.

**Example Syntax:**

Any Go function can be a step as long as it outputs one value and an error.
To pass inputs into a function being called as a step, wrap it in an anonymous function as shown below:

```go
func step(ctx context.Context, input string) (string, error) {
    output := ...
    return output
}

func workflow(ctx dbos.DBOSContext, input string) (string, error) {
    output, err := dbos.RunAsStep(
        ctx, 
        func(stepCtx context.Context) (string, error) {
            return step(stepCtx, input)
        }
    )
}
```

#### WithStepName

```go
func WithStepName(name string) StepOption
```

Set a custom name for a step.

#### WithStepMaxRetries

```go
func WithStepMaxRetries(maxRetries int) StepOption
```

Set the maximum number of times this step is automatically retired on failure.
A value of 0 (the default) indicates no retries.

#### WithMaxInterval

```go
func WithMaxInterval(interval time.Duration) StepOption
```

WithMaxInterval sets the maximum delay between retries. Default value is 5s.

#### WithBackoffFactor

```go
func WithBackoffFactor(factor float64) StepOption
```

WithBackoffFactor sets the exponential backoff multiplier between retries. Default value is 2.0. 

#### WithBaseInterval

```go
func WithBaseInterval(interval time.Duration) StepOption
```

WithBaseInterval sets the initial delay between retries. Default value is 100ms. 

### WorkflowHandle

```go
type WorkflowHandle[R any] interface {
    GetResult() (R, error)
    GetStatus() (WorkflowStatus, error)
    GetWorkflowID() string
}
```

WorkflowHandle provides methods to interact with a running or completed workflow.
The type parameter `R` represents the expected return type of the workflow.
Handles can be used to wait for workflow completion, check status, and retrieve results. 

#### WorkflowHandle.GetResult

```go
WorkflowHandle.GetResult() (R, error)  
```

Wait for the workflow to complete and return its result.

#### WorkflowHandle.GetStatus

```go
WorkflowHandle.GetStatus() (WorkflowStatus, error)
```

Retrieve the WorkflowStatus of the workflow.

#### WorkflowHandle.GetWorkflowID

```go
WorkflowHandle.GetWorkflowID() string
```

Retrieve the ID of the workflow.