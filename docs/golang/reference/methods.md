---
sidebar_position: 30
title: DBOS Methods & Variables
toc_max_heading_level: 3
---

## DBOS Methods

### GetEvent

```go
func GetEvent[R any](ctx DBOSContext, targetWorkflowID, key string, timeout time.Duration) (R, error)
```

Retrieve the latest value of an event published by the workflow identified by `targetWorkflowID` to the key `key`.
If the event does not yet exist, wait for it to be published, an error if the wait times out.

**Parameters:**
- `ctx`: The DBOS context.
- `targetWorkflowID`: The identifier of the workflow whose events to retrieve.
- `key`: The key of the event to retrieve.
- `timeout`: A timeout. If the wait times out, return an error.


### SetEvent

```go
func SetEvent[P any](ctx DBOSContext, key string, message P) error
```
Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
Can only be called from within a workflow.

**Parameters:**
- **ctx**: The DBOS context.
- **key**: The key of the event.
- **message**: The value of the event. Must be serializable.


### Send

```go
func Send[P any](ctx DBOSContext, destinationID string, message P, topic string) error
```
Send a message to the workflow identified by `destinationID`.
Messages can optionally be associated with a topic.

**Parameters:**
- **ctx**: The DBOS context.
- **destinationID**: The workflow to which to send the message.
- **message**: The message to send. Must be serializable.
- **topic**: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.

### Recv

```go
func Recv[R any](ctx DBOSContext, topic string, timeout time.Duration) (R, error)
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning an error if the wait times out.

**Parameters:**
- **ctx**: The DBOS context.
- **topic**: A topic queue on which to wait.
- **timeoutSeconds**: A timeout in seconds. If the wait times out, return an error.

### Sleep

```go
func Sleep(ctx DBOSContext, duration time.Duration) (time.Duration, error)
```

Sleep for the given duration.
May only be called from within a workflow.
This sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.

**Parameters:**
- **ctx**: The DBOS context.
- **duration**: The duration to sleep.

### RetrieveWorkflow

```go
func RetrieveWorkflow[R any](ctx DBOSContext, workflowID string) (*workflowPollingHandle[R], error)
```

Retrieve the [handle](./workflows-steps.md#workflowhandle) of a workflow.

**Parameters**:
- **ctx**: The DBOS context.
- **workflowID**: The ID of the workflow whose handle to retrieve.

## Workflow Management Methods

### ListWorkflows

```go
func ListWorkflows(ctx DBOSContext, opts ...ListWorkflowsOption) ([]WorkflowStatus, error)
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all workflows matching specified criteria.

**Example usage:**

```go
// List all successful workflows from the last 24 hours
workflows, err := dbos.ListWorkflows(ctx,
    dbos.WithStatus([]dbos.WorkflowStatusType{dbos.WorkflowStatusSuccess}),
    dbos.WithStartTime(time.Now().Add(-24*time.Hour)),
    dbos.WithLimit(100))
if err != nil {
    log.Fatal(err)
}

// List workflows by specific IDs without loading input/output data
workflows, err := dbos.ListWorkflows(ctx,
    dbos.WithWorkflowIDs([]string{"workflow1", "workflow2"}),
    dbos.WithLoadInput(false),
    dbos.WithLoadOutput(false))
if err != nil {
    log.Fatal(err)
}
```

#### WithAppVersion

```go
func WithAppVersion(appVersion string) ListWorkflowsOption
```

Retrieve workflows tagged with this application version.


#### WithEndTime

```go
func WithEndTime(endTime time.Time) ListWorkflowsOption
```

Retrieve workflows started before this timestamp.

#### WithLimit

```go
func WithLimit(limit int) ListWorkflowsOption
```

Retrieve up to this many workflows.

#### WithLoadInput

```go
func WithLoadInput(loadInput bool) ListWorkflowsOption
```

WithLoadInput controls whether to load workflow input data (default: true).

#### WithLoadOutput

```go
func WithLoadOutput(loadOutput bool) ListWorkflowsOption
```

WithLoadOutput controls whether to load workflow output data (default: true). 

#### WithName

```go
func WithName(name string) ListWorkflowsOption
```

WithName filters workflows by the specified workflow function name.

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```go
type WorkflowStatus struct {
	ID                 string             `json:"workflow_uuid"`       // Unique identifier for the workflow
	Status             WorkflowStatusType `json:"status"`              // Current execution status
	Name               string             `json:"name"`                // Function name of the workflow
	AuthenticatedUser  *string            `json:"authenticated_user"`  // User who initiated the workflow (if applicable)
	AssumedRole        *string            `json:"assumed_role"`        // Role assumed during execution (if applicable)
	AuthenticatedRoles *string            `json:"authenticated_roles"` // Roles available to the user (if applicable)
	Output             any                `json:"output"`              // Workflow output (available after completion)
	Error              error              `json:"error"`               // Error information (if status is ERROR)
	ExecutorID         string             `json:"executor_id"`         // ID of the executor running this workflow
	CreatedAt          time.Time          `json:"created_at"`          // When the workflow was created
	UpdatedAt          time.Time          `json:"updated_at"`          // When the workflow status was last updated
	ApplicationVersion string             `json:"application_version"` // Version of the application that created this workflow
	ApplicationID      string             `json:"application_id"`      // Application identifier
	Attempts           int                `json:"attempts"`            // Number of execution attempts
	QueueName          string             `json:"queue_name"`          // Queue name (if workflow was enqueued)
	Timeout            time.Duration      `json:"timeout"`             // Workflow timeout duration
	Deadline           time.Time          `json:"deadline"`            // Absolute deadline for workflow completion
	StartedAt          time.Time          `json:"started_at"`          // When the workflow execution actually started
	DeduplicationID    string             `json:"deduplication_id"`    // Deduplication identifier (if applicable)
	Input              any                `json:"input"`               // Input parameters passed to the workflow
	Priority           int                `json:"priority"`            // Execution priority (lower numbers have higher priority)
}
```