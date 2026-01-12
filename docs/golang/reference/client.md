---
sidebar_position: 50
title: DBOS Client
---

`Client` provides a programmatic way to interact with your DBOS application from external code.
`Client` includes methods similar to [`DBOSContext`](./dbos-context.md) that can be used outside of a DBOS application.

:::note 
`Client` is included in the `dbos` package, the same package that is used by DBOS applications.
Where DBOS applications use the [`DBOSContext` methods](./dbos-context.md),
external applications use `Client` methods instead.
:::

```go
type Client interface {
    Enqueue(queueName, workflowName string, input any, opts ...EnqueueOption) (WorkflowHandle[any], error)
    ListWorkflows(opts ...ListWorkflowsOption) ([]WorkflowStatus, error)
    Send(destinationID string, message any, topic string) error
    GetEvent(targetWorkflowID, key string, timeout time.Duration) (any, error)
    RetrieveWorkflow(workflowID string) (WorkflowHandle[any], error)
    CancelWorkflow(workflowID string) error
    ResumeWorkflow(workflowID string) (WorkflowHandle[any], error)
    ForkWorkflow(input ForkWorkflowInput) (WorkflowHandle[any], error)
    GetWorkflowSteps(workflowID string) ([]StepInfo, error)
    Shutdown(timeout time.Duration)
}
```

### Constructor

```go
func NewClient(ctx context.Context, config ClientConfig) (Client, error)
```

**Parameters:**
- `ctx`: A context for initialization operations
- `config`: A `ClientConfig` object with connection and application settings

```go
type ClientConfig struct {
    DatabaseURL        string        // DatabaseURL is a PostgreSQL connection string. Either this or SystemDBPool is required.
    SystemDBPool       *pgxpool.Pool // SystemDBPool is a custom System Database Pool. It's optional and takes precedence over DatabaseURL if both are provided.
    DatabaseSchema string            // Database schema name (defaults to "dbos")
    Logger             *slog.Logger  // Optional custom logger
}
```

**Returns:**
- A new `Client` instance or an error if initialization fails

**Example syntax:**

This DBOS client connects to the system database specified in the configuration:

```go
config := dbos.ClientConfig{
    DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
}
client, err := dbos.NewClient(context.Background(), config)
if err != nil {
    log.Fatal(err)
}
defer client.Shutdown(5 * time.Second)
```

A client manages a connection pool to the [DBOS system database](../../explanations/system-tables.md). Calling `Shutdown` on a client will release the connection pool.


### Shutdown

```go
Shutdown(timeout time.Duration)
```

Gracefully shuts down the client and releases the system database connection pool.

**Parameters:**
- `timeout`: Maximum time to wait for graceful shutdown

## Workflow Interaction Methods

### Enqueue

```go
func Enqueue[P any, R any](
    c Client, 
    queueName string,
    workflowName string, 
    input P, 
    opts ...EnqueueOption
) (WorkflowHandle[R], error)
```

Enqueue a workflow for processing and return a handle to it, similar to [RunWorkflow with the WithQueue option](./workflows-steps.md#withqueue).
Returns a [WorkflowHandle](./workflows-steps.md#workflowhandle).

When enqueuing a workflow from the DBOS client, you must specify the name of the workflow to enqueue (rather than passing a workflow function as with `RunWorkflow`.)

Required parameters:

* `c`: The DBOS client instance
* `queueName`: The name of the [queue](./queues.md) on which to enqueue the workflow
* `workflowName`: The name of the workflow function being enqueued
* `input`: The input to pass to the workflow

Optional configuration via `EnqueueOption`:

* `WithEnqueueWorkflowID(id string)`: The unique ID for the enqueued workflow. 
If left undefined, DBOS Client will generate a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier). 
Please see [Workflow IDs and Idempotency](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) for more information.
* `WithEnqueueApplicationVersion(version string)`: The version of your application that should process this workflow. 
If left undefined, it will use the current application version.
* `WithEnqueueTimeout(timeout time.Duration)`: Set a timeout for the enqueued workflow. When the timeout expires, the workflow **and all its children** are cancelled (except if the child's context has been made uncancellable using [`WithoutCancel`](./dbos-context.md#withoutcancel)). The timeout does not begin until the workflow is dequeued and starts execution.
* `WithEnqueueDeduplicationID(id string)`: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will fail.
* `WithEnqueuePriority(priority uint)`: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.

**Example syntax:**

```go
type ProcessInput struct {
    TaskID string
    Data   string
}

type ProcessOutput struct {
    Result string
    Status string
}

handle, err := dbos.Enqueue[ProcessInput, ProcessOutput](
    client, 
    "process_queue",
    "ProcessWorkflow",
    ProcessInput{TaskID: "task-123", Data: "data"},
    dbos.WithEnqueueTimeout(30 * time.Minute),
    dbos.WithEnqueuePriority(5),
)
if err != nil {
    log.Fatal(err)
}

result, err := handle.GetResult()
if err != nil {
    log.Printf("Workflow failed: %v", err)
} else {
    log.Printf("Result: %+v", result)
}
```

### RetrieveWorkflow

```go
RetrieveWorkflow(workflowID string) (WorkflowHandle[any], error)
```

Retrieve the [handle](./workflows-steps.md#workflowhandle) of a workflow with identity `workflowID`.
Similar to [`RetrieveWorkflow`](./methods.md#retrieveworkflow).

**Parameters:**
- `workflowID`: The identifier of the workflow whose handle to retrieve

**Returns:**
- The [WorkflowHandle](./workflows-steps.md#workflowhandle) of the workflow whose ID is `workflowID`

### Send

```go
Send(destinationID string, message any, topic string) error
```

Sends a message to a specified workflow. Similar to [`Send`](../tutorials/workflow-communication.md#send).

**Parameters:**
- `destinationID`: The workflow to which to send the message
- `message`: The message to send. Must be serializable
- `topic`: A topic with which to associate the message. Messages are enqueued per-topic on the receiver

### GetEvent

```go
GetEvent(targetWorkflowID, key string, timeout time.Duration) (any, error)
```

Retrieve the latest value of an event published by the workflow identified by `targetWorkflowID` to the key `key`.
If the event does not yet exist, wait for it to be published, returning an empty string if the wait times out.
Similar to [`GetEvent`](../tutorials/workflow-communication.md#getevent).

**Parameters:**
- `targetWorkflowID`: The identifier of the workflow whose events to retrieve
- `key`: The key of the event to retrieve
- `timeout`: A timeout duration. If the wait times out, return an empty string

**Returns:**
- The value of the event published by `targetWorkflowID` with name `key`, or an empty string if the wait times out

## Workflow Management Methods

### ListWorkflows

```go
ListWorkflows(opts ...ListWorkflowsOption) ([]WorkflowStatus, error)
```

Retrieve a list of [`WorkflowStatus`](./methods.md#workflow-status) of all workflows matching specified criteria.
Similar to [`ListWorkflows`](./methods.md#listworkflows).

**Options:**
Options are provided via `ListWorkflowsOption` functions. See [`ListWorkflows`](./methods.md#listworkflows) for available options.

:::warning
The client `ListWorkflows` method does not include workflow inputs and outputs in its results.
:::

### GetWorkflowSteps

```go
GetWorkflowSteps(workflowID string) ([]StepInfo, error)
```

List the steps of a given workflow. Returned entries do not include step outputs.


### CancelWorkflow

```go
CancelWorkflow(workflowID string) error
```

Cancel a workflow.
This sets its status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step).
Similar to [`CancelWorkflow`](./methods.md#cancelworkflow).

### ResumeWorkflow

```go
ResumeWorkflow(workflowID string) (WorkflowHandle[any], error)
```

Resume a workflow.
This immediately starts it from its last completed step.
You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.
Similar to [`ResumeWorkflow`](./methods.md#resumeworkflow).

### ForkWorkflow

```go
ForkWorkflow(input ForkWorkflowInput) (WorkflowHandle[any], error)
```

Similar to [`ForkWorkflow`](./methods.md#forkworkflow).