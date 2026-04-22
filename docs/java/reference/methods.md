---
sidebar_position: 30
title: DBOS Methods & Variables
toc_max_heading_level: 3
---

## DBOS Methods

### getEvent

```java
<T> Optional<T> getEvent(String workflowId, String key, Duration timeout)
```

Retrieve the latest value of an event published by the workflow identified by `workflowId` to the key `key`.
If the event does not yet exist, wait for it to be published, an error if the wait times out.

**Parameters:**
- **workflowId**: The identifier of the workflow whose events to retrieve.
- **key**: The key of the event to retrieve.
- **timeout**: A timeout duration. If the wait times out, an empty Optional is returned.

### setEvent

```java
void setEvent(String key, Object value)
void setEvent(String key, Object value, SerializationStrategy serialization)
```
Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
`setEvent` can only be called from within a workflow.

**Parameters:**
- **key**: The key of the event.
- **value**: The value of the event. Must be serializable.
- **serialization**: The [serialization strategy](#serialization-strategy) to use for this event. Defaults to `SerializationStrategy.DEFAULT`.

### send

```java
void send(String destinationId, Object message, String topic)
void send(String destinationId, Object message, String topic, String idempotencyKey)
void send(String destinationId, Object message, String topic, String idempotencyKey, SerializationStrategy serialization)
```

Send a message to the workflow identified by `destinationID`.
Messages can optionally be associated with a topic.

**Parameters:**
- **destinationId**: The workflow to which to send the message.
- **message**: The message to send. Must be serializable.
- **topic**: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- **idempotencyKey**: If `dbos.send` is called from outside a workflow and an idempotency key is set, the message will only be sent once no matter how many times `dbos.send` is called with this key.
- **serialization**: The [serialization strategy](#serialization-strategy) to use for this message. Defaults to `SerializationStrategy.DEFAULT`.

### recv

```java
<T> Optional<T> recv(String topic, Duration timeout)
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning null if the wait times out.

**Parameters:**
- **topic**: A topic queue on which to wait.
- **timeout**: A timeout duration. If the wait times out, return an empty Optional.

### sleep

```java
void sleep(Duration sleepduration)
```

Sleep for the given duration.
If called from within a workflow, this sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.
If called from outside a workflow, or from within a step, it behaves like a regular sleep.

**Parameters:**
- **sleepduration**: The duration to sleep.

### retrieveWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> retrieveWorkflow(String workflowId)
```

Retrieve the [handle](./workflows-steps.md#workflowhandle) of a workflow.

**Parameters**:
- **workflowId**: The ID of the workflow whose handle to retrieve.

### patch

```java
boolean patch(String patchName)
```

Insert a patch marker at the current point in workflow history.
Returns `true` if it was successfully inserted or `false` if there is already a checkpoint present at this point in history. 
Used to safely upgrade workflow code, see the [patching tutorial](../tutorials/upgrading-workflows.md) for more detail.

### deprecatePatch

```java
boolean deprecatePatch(String patchName)
```
Safely bypass a patch marker at the current point in workflow history if present. 
Always returns `true`.
Used to safely deprecate patches, see the [patching tutorial](../tutorials/upgrading-workflows.md) for more detail.


## Workflow Management Methods

### listWorkflows

```java
List<WorkflowStatus> listWorkflows(ListWorkflowsInput input)
```

Retrieve a list of [`WorkflowStatus`](#workflowstatus) of all workflows matching specified criteria.

#### ListWorkflowsInput

`ListWorkflowsInput` is a with-based configuration record for filtering and customizing workflow queries.  All fields are optional.

**`with` Methods:**

Many filters accept either a single value or a list. Single-value overloads are provided for convenience.

##### withWorkflowIds
```java
ListWorkflowsInput withWorkflowIds(String workflowId)
ListWorkflowsInput withWorkflowIds(List<String> workflowIds)
```
Filter by one or more workflow IDs.

##### withClassName
```java
ListWorkflowsInput withClassName(String className)
```
Filter workflows by the class name containing the workflow function.

##### withInstanceName
```java
ListWorkflowsInput withInstanceName(String instanceName)
```
Filter workflows by the instance name of the class.

##### withWorkflowName
```java
ListWorkflowsInput withWorkflowName(String workflowName)
ListWorkflowsInput withWorkflowName(List<String> workflowNames)
```
Filter workflows by the workflow function name.

##### withAuthenticatedUser
```java
ListWorkflowsInput withAuthenticatedUser(String authenticatedUser)
ListWorkflowsInput withAuthenticatedUser(List<String> authenticatedUsers)
```
Filter workflows run by this authenticated user.

##### withStartTime
```java
ListWorkflowsInput withStartTime(Instant startTime)
```
Retrieve workflows created after this timestamp.

##### withEndTime
```java
ListWorkflowsInput withEndTime(Instant endTime)
```
Retrieve workflows created before this timestamp.

##### withStatus
```java
ListWorkflowsInput withStatus(WorkflowState status)
ListWorkflowsInput withStatus(List<WorkflowState> statuses)
```
Filter workflows by status. Status must be one of: `ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`.

##### withApplicationVersion
```java
ListWorkflowsInput withApplicationVersion(String applicationVersion)
ListWorkflowsInput withApplicationVersion(List<String> applicationVersions)
```
Retrieve workflows tagged with this application version.

##### withLimit
```java
ListWorkflowsInput withLimit(Integer limit)
```
Retrieve up to this many workflows.

##### withOffset
```java
ListWorkflowsInput withOffset(Integer offset)
```
Skip this many workflows from the results returned (for pagination).

##### withSortDesc
```java
ListWorkflowsInput withSortDesc(Boolean sortDesc)
```
Sort the results in descending (true) or ascending (false) order by workflow creation time.

##### withExecutorIds
```java
ListWorkflowsInput withExecutorIds(String executorId)
ListWorkflowsInput withExecutorIds(List<String> executorIds)
```
Retrieve workflows that ran on these executor processes.

##### withQueueName
```java
ListWorkflowsInput withQueueName(String queueName)
ListWorkflowsInput withQueueName(List<String> queueNames)
```
Retrieve workflows that were enqueued on these queues.

##### withWorkflowIdPrefix
```java
ListWorkflowsInput withWorkflowIdPrefix(String workflowIdPrefix)
ListWorkflowsInput withWorkflowIdPrefix(List<String> workflowIdPrefixes)
```
Filter workflows whose IDs start with the specified prefix.

##### withQueuesOnly
```java
ListWorkflowsInput withQueuesOnly(Boolean queuedOnly)
```
Select only workflows that were enqueued.

##### withLoadInput
```java
ListWorkflowsInput withLoadInput(Boolean value)
```
Controls whether to load workflow input data (default: true).

##### withLoadOutput
```java
ListWorkflowsInput withLoadOutput(Boolean value)
```
Controls whether to load workflow output data (results and errors) (default: true).

##### withForkedFrom
```java
ListWorkflowsInput withForkedFrom(String workflowId)
ListWorkflowsInput withForkedFrom(List<String> workflowIds)
```
Filter to workflows that were forked from the specified workflow(s).

##### withParentWorkflowId
```java
ListWorkflowsInput withParentWorkflowId(String parentWorkflowId)
ListWorkflowsInput withParentWorkflowId(List<String> parentWorkflowIds)
```
Filter to workflows that are children of the specified parent workflow(s).

##### withWasForkedFrom
```java
ListWorkflowsInput withWasForkedFrom(Boolean wasForkedFrom)
```
Filter to workflows from which another workflow was forked.

##### withHasParent
```java
ListWorkflowsInput withHasParent(Boolean hasParent)
```
Filter to workflows that have a parent workflow.


### listWorkflowSteps

```java
List<StepInfo> listWorkflowSteps(String workflowId)
List<StepInfo> listWorkflowSteps(String workflowId, Integer limit, Integer offset)
```

Retrieve the execution steps of a workflow.
The `limit` and `offset` parameters support pagination over large step lists.
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
    String childWorkflowId,
    // When the step started executing
    Instant startedAt,
    // When the step completed
    Instant completedAt,
    // The serialization format used for the step's output
    String serialization
)
```

### getWorkflowStatus

```java
Optional<WorkflowStatus> getWorkflowStatus(String workflowId)
```

Retrieve the [`WorkflowStatus`](#workflowstatus) of a single workflow by ID.

### cancelWorkflow

```java
void cancelWorkflow(String workflowId)
void cancelWorkflows(List<String> workflowIds)
```

Cancel one or more workflows. This sets their status to `CANCELLED`, removes them from their queue (if enqueued) and preempts execution (interrupting at the beginning of the next step).

### resumeWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> resumeWorkflow(String workflowId)
<T, E extends Exception> WorkflowHandle<T, E> resumeWorkflow(String workflowId, String queueName)
List<WorkflowHandle<Object, Exception>> resumeWorkflows(List<String> workflowIds)
List<WorkflowHandle<Object, Exception>> resumeWorkflows(List<String> workflowIds, String queueName)
```

Resume one or more workflows from their last completed step. You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts. You can also use this to start an enqueued workflow immediately, bypassing its queue.

**Parameters:**
- **queueName**: Optionally re-enqueue the resumed workflow on this queue instead of starting it immediately.

### deleteWorkflow

```java
void deleteWorkflow(String workflowId)
void deleteWorkflow(String workflowId, boolean deleteChildren)
void deleteWorkflows(List<String> workflowIds)
void deleteWorkflows(List<String> workflowIds, boolean deleteChildren)
```

Permanently delete one or more workflows and their recorded steps from the database.

**Parameters:**
- **deleteChildren**: If `true`, also delete all child workflows spawned by the deleted workflow(s). Defaults to `false`.

### setWorkflowDelay

```java
void setWorkflowDelay(String workflowId, Duration delay)
void setWorkflowDelay(String workflowId, Instant delayUntil)
```

Pause an enqueued or pending workflow so it will not be dequeued until after the specified duration or absolute time. The workflow's status changes to `DELAYED` while waiting.

**Parameters:**
- **workflowId**: The ID of the workflow to delay.
- **delay**: How long from now to delay the workflow.
- **delayUntil**: The absolute time until which to delay the workflow.

### listApplicationVersions

```java
List<VersionInfo> listApplicationVersions()
```

Return all registered application versions, ordered by timestamp descending.

```java
public record VersionInfo(
    // The generated version ID
    String versionId,
    // The human-readable version name (e.g., "v1.2.3")
    String versionName,
    // When this version was promoted
    Instant versionTimestamp,
    // When this version record was created
    Instant createdAt
)
```

### getLatestApplicationVersion

```java
VersionInfo getLatestApplicationVersion()
```

Return the most recently promoted application version.

### setLatestApplicationVersion

```java
void setLatestApplicationVersion(String versionName)
```

Promote a version by name to be the latest application version. Used during blue-green deployments to control which version new workflows are assigned to. See [upgrading workflows](../tutorials/upgrading-workflows.md) for more detail.

## Schedule Management Methods

These methods manage [`WorkflowSchedule`](./workflows-steps.md#workflowschedule) records that periodically invoke workflows on a cron schedule. All schedule methods require DBOS to be launched first.

### applySchedules

```java
void applySchedules(WorkflowSchedule... schedules)
void applySchedules(List<WorkflowSchedule> schedules)
```

Atomically create or replace a set of schedules in one transaction. Each named schedule is deleted (if it exists) and re-created. This is the recommended way to declare schedules at application startup — call it once after `dbos.launch()` and it will always reflect your current schedule definitions.

### createSchedule

```java
void createSchedule(WorkflowSchedule schedule)
```

Create a single schedule. Throws if a schedule with the same `scheduleName` already exists.

### getSchedule

```java
Optional<WorkflowSchedule> getSchedule(String name)
```

Retrieve a schedule by name. Returns empty if not found.

### listSchedules

```java
List<WorkflowSchedule> listSchedules(List<ScheduleStatus> status, List<String> workflowName, List<String> namePrefix)
```

List schedules with optional filters. Pass `null` for any filter to skip it.

**Parameters:**
- **status**: Filter by `ScheduleStatus.ACTIVE` or `ScheduleStatus.PAUSED`.
- **workflowName**: Filter by workflow function name.
- **namePrefix**: Filter by schedule name prefix.

### pauseSchedule

```java
void pauseSchedule(String name)
```

Pause a schedule. A paused schedule does not fire until resumed.

### resumeSchedule

```java
void resumeSchedule(String name)
```

Resume a paused schedule.

### deleteSchedule

```java
void deleteSchedule(String name)
```

Delete a schedule by name. No-op if the schedule does not exist.

### backfillSchedule

```java
List<WorkflowHandle<Object, Exception>> backfillSchedule(String scheduleName, Instant start, Instant end)
```

Manually enqueue all executions of a schedule that would have fired between `start` (exclusive) and `end` (exclusive). Uses the same deterministic workflow IDs as the live scheduler, so already-executed times are skipped. Useful for recovering from outages when automatic backfill is not enabled.

### triggerSchedule

```java
<T, E extends Exception> WorkflowHandle<T, E> triggerSchedule(String scheduleName)
```

Immediately fire a scheduled workflow outside its normal cron cadence. Returns a handle to the enqueued execution.

### forkWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> forkWorkflow(String workflowId, int startStep)
<T, E extends Exception> WorkflowHandle<T, E> forkWorkflow(String workflowId, int startStep, ForkOptions options)
```

```java
public record ForkOptions(
    String forkedWorkflowId,
    String applicationVersion,
    Timeout timeout,
    String queueName,
    String queuePartitionKey
) {
    ForkOptions withForkedWorkflowId(String forkedWorkflowId);
    ForkOptions withApplicationVersion(String applicationVersion);
    ForkOptions withTimeout(Duration timeout);
    ForkOptions withTimeout(long value, TimeUnit unit);
    ForkOptions withNoTimeout();
    ForkOptions withQueue(Queue queue);
    ForkOptions withQueue(String queueName);
    ForkOptions withQueuePartitionKey(String queuePartitionKey);
}
```

Start a new execution of a workflow from a specific step. The input step ID (`startStep`) must match the step number of the step returned by workflow introspection. The specified `startStep` is the step from which the new workflow will start, so any steps whose ID is less than `startStep` will not be re-executed.

**Parameters:**
- **workflowId**: The ID of the workflow to fork
- **startStep**: The step from which to fork the workflow
- **options**:
  - **forkedWorkflowId**: The workflow ID for the newly forked workflow (if not provided, generate a UUID)
  - **applicationVersion**: The application version for the forked workflow (inherited from the original if not provided)
  - **timeout**: A timeout for the forked workflow.
  - **queueName**: Enqueue the forked workflow on this queue instead of starting it immediately.
  - **queuePartitionKey**: Partition key for the queue (only for partitioned queues).

### WorkflowStatus

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```java
public record WorkflowStatus(
    // The workflow ID
    String workflowId,
    // The workflow status: ENQUEUED, PENDING, SUCCESS, ERROR, CANCELLED, or MAX_RECOVERY_ATTEMPTS_EXCEEDED
    WorkflowState status,
    // The name of the workflow function
    String workflowName,
    // The class of the workflow function
    String className,
    // The name given to the class instance, if any
    String instanceName,
    // The authenticated user who initiated the workflow, if any
    String authenticatedUser,
    // The assumed role for the workflow execution, if any
    String assumedRole,
    // Roles authenticated for the workflow
    String[] authenticatedRoles,
    // The deserialized workflow input
    Object[] input,
    // The workflow's output, if any
    Object output,
    // The error the workflow threw, if any
    ErrorResult error,
    // The ID of the executor (process) that most recently executed this workflow
    String executorId,
    // When the workflow was created
    Instant createdAt,
    // The last time the workflow status was updated
    Instant updatedAt,
    // The application version on which this workflow was started
    String appVersion,
    // The application identifier
    String appId,
    // The number of times this workflow has been started
    Integer recoveryAttempts,
    // If this workflow was enqueued, on which queue
    String queueName,
    // The workflow timeout duration, if any
    Duration timeout,
    // The absolute deadline for the workflow, if any
    Instant deadline,
    // When the workflow started executing (after being dequeued), if applicable
    Instant startedAt,
    // The deduplication ID assigned to this workflow, if any
    String deduplicationId,
    // The priority assigned to this workflow in its queue, if any
    Integer priority,
    // The queue partition key, if any
    String queuePartitionKey,
    // The ID of the workflow this was forked from, if any
    String forkedFrom,
    // The parent workflow ID if this is a child workflow, if any
    String parentWorkflowId,
    // Whether another workflow has been forked from this one
    Boolean wasForkedFrom,
    // Time until which the workflow is delayed before starting
    Instant delayUntil,
    // The serialization format used for the workflow's inputs/outputs
    String serialization
)
```

## DBOS Variables

### workflowId

```java
static String workflowId()
```

Retrieve the ID of the current workflow. Returns `null` if not called from a workflow or step.

### stepId

```java
static Integer stepId()
```

Returns the unique ID of the current step within its workflow. Returns `null` if not called from a step.

### inWorkflow

```java
static boolean inWorkflow();
```

Return `true` if the current calling context is executing a workflow, or `false` otherwise.

### inStep

```java
static boolean inStep();
```

Return `true` if the current calling context is executing a workflow step, or `false` otherwise.

## WorkflowOptions

When workflow functions are called directly, they take their options from the current DBOS context.  Setting options into the context can done with a `WorkflowOptions` object and a `setContext()` `try` block on the calling thread:

```java
    try (var _opts = new WorkflowOptions(wfId).setContext()) {
        // This workflow is within the `try` and will get `wfId` from the context
        result = workflowClass.workflowMethod(args);
    }
```

Workflow options will be restored to prior values at the end of the `try` block.

:::note
When using background execution or queues, workflow options should be passed as a `StartWorkflowOptions` argument to `startWorkflow`.
:::

`WorkflowOptions` is a record with the following fields:
- **workflowId**: The ID to be assigned to a workflow called within the `try` block
- **timeout**: The timeout to be assigned to all workflows called within the `try` block
- **deadline**: The deadline to be assigned to all workflows called within the `try` block

`WorkflowOptions` also supports `with` methods.

### WorkflowOptions.withWorkflowID
Creates a new WorkflowOptions with the workflow ID set. Other `WorkflowOptions` properties will be taken from the object on which `withWorkflowId` is called.

```java
    public WorkflowOptions withWorkflowId(String workflowId);
```

This will set the [workflow ID](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) of the next workflow run.

Example syntax:
```java
    // This is a more explicit version of new WorkflowOptions(wfId)
    var options = new WorkflowOptions().withWorkflowId(wfId);
    try (var _o = options.setContext()) {
      var result = inst.thisWorkflowGetsWfId();
    }
```

### WorkflowOptions.withTimeout
Creates a new WorkflowOptions with the timeout set.  Other `WorkflowOptions` properties will be taken from the object on which `withTimeout` is called.

```java
  public WorkflowOptions withTimeout(Timeout timeout);
  public WorkflowOptions withTimeout(Duration timeout);
  public WorkflowOptions withTimeout(long value, TimeUnit unit);
```

Set a timeout for all enclosed workflow invocations or enqueues.  When the timeout expires, the workflow **and all its children** are cancelled.

Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Timeout deadlines are propagated to child workflows by default, so when a workflow's deadline expires all of its child workflows (and their children, and so on) are also cancelled.

Example syntax:

```java
    // If the workflow does not complete within 10 seconds, it times out and is cancelled
    var options = new WorkflowOptions().withTimeout(Duration.ofSeconds(10));
    try (var _o = options.setContext()) {
      var result = inst.possiblySlowWorkflow();
    }
```

### WorkflowOptions.withDeadline
Creates a new WorkflowOptions with the deadline set.  Other `WorkflowOptions` properties will be taken from the object on which `withDeadline` is called.

```java
  public WorkflowOptions withDeadline(Instant deadline);
```

Set a deadline for all enclosed workflow invocations or enqueues.  At the deadline time, the workflow **and all its children** are cancelled.

Deadlines are propagated to child workflows by default, so when a workflow's deadline expires all of its child workflows (and their children, and so on) are also cancelled.

Example syntax:

```java
    // If the workflow does not complete by 10 seconds from now, it will be cancelled
    var options = new WorkflowOptions().withDeadline(Instant.ofEpochMilli(System.currentTimeMillis() + 10000));
    try (var _o = options.setContext()) {
      var result = inst.possiblySlowWorkflow();
    }
```

:::info
An explicit timeout and deadline cannot both be set.
:::

## Timeout

`Timeout` is a sealed interface used by `StartWorkflowOptions`, `WorkflowOptions`, and `ForkOptions` to control how inherited timeouts are handled.

```java
import dev.dbos.transact.workflow.Timeout;
```

**Factory methods:**

- **`Timeout.of(Duration duration)`** — Set an explicit timeout of the given duration.
- **`Timeout.of(long value, TimeUnit unit)`** — Set an explicit timeout.
- **`Timeout.none()`** — Opt out of any inherited timeout. The workflow will run without a timeout regardless of what the calling context specifies.
- **`Timeout.inherit()`** — Explicitly inherit the timeout from the calling context (the default behavior when no timeout is set).

**Example:**

```java
// Detach a child workflow from the parent's timeout
dbos.startWorkflow(() -> proxy.longRunningChild(),
    new StartWorkflowOptions().withTimeout(Timeout.none()));
```

## WorkflowState

`WorkflowState` is an enum representing the possible states of a workflow. It is used in [`WorkflowStatus`](#workflowstatus) and [`ListWorkflowsInput`](#listworkflowsinput).

```java
import dev.dbos.transact.workflow.WorkflowState;
```

```java
public enum WorkflowState {
    PENDING,    // Currently executing
    ENQUEUED,   // Waiting on a queue to be dequeued
    DELAYED,    // Waiting until a delay expires before being dequeued
    SUCCESS,    // Completed successfully
    ERROR,      // Threw an unhandled exception
    CANCELLED,  // Cancelled by cancelWorkflow()
    MAX_RECOVERY_ATTEMPTS_EXCEEDED  // Crashed too many times; requires manual intervention
}
```

`WorkflowState.isActive()` returns `true` for `PENDING`, `ENQUEUED`, and `DELAYED`.

## Serialization Strategy

Several DBOS methods accept an optional `SerializationStrategy` parameter that controls how data is serialized.
This is useful for cross-language interoperability&mdash;for example, if a TypeScript or Python DBOS application needs to read events or messages set by a Java application.

```java
import dev.dbos.transact.workflow.SerializationStrategy;
```

The available strategies are:

- **`SerializationStrategy.DEFAULT`**: Uses the serializer configured in [`DBOSConfig`](./lifecycle.md#custom-serialization) (defaults to Jackson).
- **`SerializationStrategy.PORTABLE`**: Uses a portable JSON format (`portable_json`) that can be deserialized by DBOS applications in any language.
- **`SerializationStrategy.NATIVE`**: Explicitly uses the native Java Jackson serializer (`java_jackson`).
