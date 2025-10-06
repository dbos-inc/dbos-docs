---
sidebar_position: 30
title: DBOS Methods & Variables
toc_max_heading_level: 3
---

## DBOS Methods

### getEvent

```java
Object getEvent(String workflowId, String key, float timeOut)
```

Retrieve the latest value of an event published by the workflow identified by `workflowId` to the key `key`.
If the event does not yet exist, wait for it to be published, an error if the wait times out.

**Parameters:**
- **workflowId**: The identifier of the workflow whose events to retrieve.
- **key**: The key of the event to retrieve.
- **timeout**: A timeout in seconds. If the wait times out, return null.

### setEvent

```java
void setEvent(String key, Object value)
```
Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
Can only be called from within a workflow.

**Parameters:**
- **key**: The key of the event.
- **message**: The value of the event. Must be serializable.

### send

```java
void send(String destinationId, Object message, String topic)
```

Send a message to the workflow identified by `destinationID`.
Messages can optionally be associated with a topic.

**Parameters:**
- **destinationId**: The workflow to which to send the message.
- **message**: The message to send. Must be serializable.
- **topic**: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.

### recv

```java
Object recv(String topic, float timeoutSeconds)
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning an error if the wait times out.

**Parameters:**
- **topic**: A topic queue on which to wait.
- **timeoutSeconds**: A timeout in seconds. If the wait times out, return null.

### sleep

```java
void sleep(float seconds)
```

Sleep for the given duration.
May only be called from within a workflow.
This sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.

**Parameters:**
- **seconds**: The duration to sleep in seconds.

### retrieveWorkflow

```go
WorkflowHandle<T, E> retrieveWorkflow(String workflowId)
```

Retrieve the [handle](./workflows-steps.md#workflowhandle) of a workflow.

**Parameters**:
- **workflowId**: The ID of the workflow whose handle to retrieve.

## Workflow Management Methods

### listWorkflows

```java
List<WorkflowStatus> listWorkflows(ListWorkflowsInput input)
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all workflows matching specified criteria.

#### ListWorkflowsInput

`ListWorkflowsInput` is a builder-based configuration record for filtering and customizing workflow queries. All fields are optional.

**Builder Methods:**

##### workflowID
```java
Builder workflowID(String workflowID)
```
Add a workflow ID to filter by.

##### workflowIDs
```java
Builder workflowIDs(List<String> workflowIDs)
```
Add multiple workflow IDs to filter by.

##### className
```java
Builder className(String className)
```
Filter workflows by the class name containing the workflow function.

##### instanceName
```java
Builder instanceName(String instanceName)
```
Filter workflows by the instance name of the class.

##### workflowName
```java
Builder workflowName(String workflowName)
```
Filter workflows by the workflow function name.

##### authenticatedUser
```java
Builder authenticatedUser(String authenticatedUser)
```
Filter workflows run by this authenticated user.

##### startTime
```java
Builder startTime(OffsetDateTime startTime)
```
Retrieve workflows started after this timestamp.

##### endTime
```java
Builder endTime(OffsetDateTime endTime)
```
Retrieve workflows started before this timestamp.

##### status
```java
Builder status(WorkflowState status)
Builder status(String status)
```
Filter workflows by status. Status must be one of: `ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`.

##### applicationVersion
```java
Builder applicationVersion(String applicationVersion)
```
Retrieve workflows tagged with this application version.

##### limit
```java
Builder limit(Integer limit)
```
Retrieve up to this many workflows.

##### offset
```java
Builder offset(Integer offset)
```
Skip this many workflows from the results returned (for pagination).

##### sortDesc
```java
Builder sortDesc(Boolean sortDesc)
```
Sort the results in descending (true) or ascending (false) order by workflow start time.

##### workflowIdPrefix
```java
Builder workflowIdPrefix(String workflowIdPrefix)
```
Filter workflows whose IDs start with the specified prefix.

##### loadInput
```java
Builder loadInput(Boolean value)
```
Controls whether to load workflow input data (default: true).

##### loadOutput
```java
Builder loadOutput(Boolean value)
```
Controls whether to load workflow output data (default: true).


### listWorkflowSteps

```java
List<StepInfo> listWorkflowSteps(String workflowId)
```

Retrieve the execution steps of a workflow.
This is a list of `StepInfo` objects, with the following structure:

```java
StepInfo(
    // The sequential ID of the step within the workflow
    int functionId,
    // The name of the step function
    String functionName,
    // The output returned by the step, if any
    Object output,
    // The error returned by the step, if any
    ErrorResult error,
    // If the step starts or retrieves the result of a workflow, its ID
    String childWorkflowId
)
```

### cancelWorkflow

```java
cancelWorkflow(String workflowId)
```

Cancel a workflow. This sets its status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step).

### resumeWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> resumeWorkflow(String workflowId)
```

Resume a workflow. This immediately starts it from its last completed step. You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts. You can also use this to start an enqueued workflow immediately, bypassing its queue.

### forkWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> forkWorkflow(
      String workflowId, 
      int startStep, 
      ForkOptions options
)
```

```java
public record ForkOptions(
    String forkedWorkflowId, 
    String applicationVersion, 
    Duration timeout
)
```

Start a new execution of a workflow from a specific step. The input step ID (`startStep`) must match the step number of the step returned by workflow introspection. The specified `startStep` is the step from which the new workflow will start, so any steps whose ID is less than `startStep` will not be re-executed.

**Parameters:**
- **workflowId**: The ID of the workflow to fork
- **startStep**: The step from which to fork the workflow
- **options**:
  - **forkedWorkflowId**: The workflow ID for the newly forked workflow (if not provided, generate a UUID)
  - **applicationVersion**: The application version for the forked workflow (inherited from the original if not provided)
  - **timeout**: A timeout for the forked workflow.

  ### WorkflowStatus

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```java
public record WorkflowStatus(
    // The workflow ID
    String workflowId,
    // The workflow status. Must be one of ENQUEUED, PENDING, SUCCESS, ERROR, CANCELLED, or MAX_RECOVERY_ATTEMPTS_EXCEEDED
    String status,
    // The name of the workflow function
    String name,
    // The class of the workflow function
    String className,
    // The name given to the class instance, if any
    String instanceName,
    // The deserialized workflow input object
    Object[] input,
    // The workflow's output, if any
    Object output,
    // The error the workflow threw, if any
    ErrorResult error,
    // Workflow start time, as a Unix epoch timestamp in ms
    Long createdAt,
    // The last time the workflow status was updated, as a Unix epoch timestamp in ms
    Long updatedAt,
    // If this workflow was enqueued, on which queue
    String queueName,
    // The ID of the executor (process) that most recently executed this workflow
    String executorId,
    // The application version on which this workflow was started
    String appVersion,
    // The workflow timeout, if any
    Long workflowTimeoutMs,
    // The Unix epoch timestamp at which this workflow will time out, if any
    Long workflowDeadlineEpochMs,
    // The number of times this workflow has been started
    Integer recoveryAttempts
)
```