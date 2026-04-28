---
sidebar_position: 50
title: DBOS Client
toc_max_heading_level: 3
---

`DBOSClient` provides a programmatic way to interact with your DBOS application from external code.

## DBOSClient

```java
DBOSClient(String url, String user, String password)
DBOSClient(String url, String user, String password, String schema)
DBOSClient(String url, String user, String password, String schema, DBOSSerializer serializer)
DBOSClient(DataSource dataSource)
DBOSClient(DataSource dataSource, String schema)
DBOSClient(DataSource dataSource, String schema, DBOSSerializer serializer)
```

Construct the DBOSClient.

:::danger
DBOSClient requires a PostgreSQL database. Providing a non-PostgreSQL `DataSource` will throw an exception.
:::

**Parameters:**
- **url**: The JDBC URL for your system database.
- **user**: Your PostgreSQL username or role.
- **password**: The password for your PostgreSQL user or role.
- **schema**: The schema the DBOS System Database tables are stored in. Defaults to `dbos` if not provided.
- **dataSource**: System Database data source. A `HikariDataSource` is created if not provided.
- **serializer**: A custom [serializer](./lifecycle.md#custom-serialization) for workflow inputs and outputs. Must match the serializer used by the DBOS application.

## Workflow Interaction Methods

### enqueueWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> enqueueWorkflow(
      EnqueueOptions options, Object[] args)
```

Enqueue a workflow and return a handle to it.

**Parameters:**
- **options**: Configuration for the enqueued workflow, as defined below.
- **args**: An array of the workflow's arguments. These will be serialized and passed into the workflow when it is dequeued.

**Example Syntax:**

This code enqueues workflow `exampleWorkflow` in class `com.example.ExampleImpl` on queue `example-queue` with arguments `argumentOne` and `argumentTwo`.

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword);
var options =
    new DBOSClient.EnqueueOptions("exampleWorkflow", "com.example.ExampleImpl", "example-queue");
var handle = client.enqueueWorkflow(options, new Object[]{"argumentOne", "argumentTwo"});
```

#### EnqueueOptions

`EnqueueOptions` is a with-based configuration record for parameterizing `client.enqueueWorkflow`.

**Constructors:**

```java
public EnqueueOptions(String workflowName, String queueName)
```

Specify the name of the workflow to enqueue and the queue. The class name defaults to `null` — DBOS searches all registered classes for a matching workflow name.

```java
public EnqueueOptions(String workflowName, String className, String queueName)
```

Specify the workflow name, class name, and queue name.

**Methods:**

- **`withClassName(String className)`**: The class containing the workflow method. Use when multiple classes have a workflow with the same name.
- **`withInstanceName(String name)`**: The enqueued workflow should run on this particular named class instance.
- **`withWorkflowId(String workflowId)`**: Specify the idempotency ID to assign to the enqueued workflow.
- **`withAppVersion(String appVersion)`**: The version of your application that should process this workflow. 
If left undefined, it will be updated to the current version when the workflow is first dequeued.
- **`withTimeout(Duration timeout)`**:  Set a timeout for the enqueued workflow. When the timeout expires, the workflow and all its children are cancelled. The timeout does not begin until the workflow is dequeued and starts execution.
- **`withDeadline(Instant deadline)`**:  Set a deadline for the enqueued workflow. If the workflow is executing when the deadline arrives, the workflow and all its children are cancelled.

:::info
Timeout and deadline cannot both be set
:::

- **`withDelay(Duration delay)`**: Delay the start of the workflow by the specified duration after it is dequeued.
- **`withDeduplicationId(String deduplicationId)`**: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED`, `PENDING`, or `DELAYED`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise an exception.
- **`withPriority(Integer priority)`**: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in FIFO (first in, first out) order. Priority values can range from `1` to `2,147,483,647`, where a low number indicates a higher priority. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
- **`withSerialization(SerializationStrategy serialization)`**: Specify the [serialization strategy](./lifecycle.md#custom-serialization) for the workflow arguments. Options are `SerializationStrategy.DEFAULT`, `SerializationStrategy.PORTABLE`, or `SerializationStrategy.NATIVE`.
- **`withQueuePartitionKey(String partitionKey)`**: Set a queue partition key for the workflow. Use if and only if the queue is partitioned (created with `withPartitioningEnabled`). In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.

:::info
- Partition keys are required when enqueueing to a partitioned queue.
- Partition keys cannot be used with non-partitioned queues.
- Partition keys and deduplication IDs cannot be used together.
:::

### enqueuePortableWorkflow

```java
<T> WorkflowHandle<T, PortableWorkflowException> enqueuePortableWorkflow(
      EnqueueOptions options, Object[] positionalArgs, Map<String, Object> namedArgs)
```

Enqueue a workflow using portable JSON serialization for cross-language workflow initiation. Use this when the workflow function definition is not available in Java (e.g., calling a Python or TypeScript workflow from Java).

**Parameters:**
- **options**: Configuration for the enqueued workflow, as defined in [`EnqueueOptions`](#enqueueoptions).
- **positionalArgs**: Positional arguments to pass to the workflow function.
- **namedArgs**: Optional named arguments (for workflows that support them, e.g., Python kwargs).

### send

```java
send(String destinationId, Object message, String topic, String idempotencyKey)
send(String destinationId, Object message, String topic, String idempotencyKey, SendOptions options)
```

Similar to [`dbos.send`](./methods.md#send).

The optional `SendOptions` parameter controls serialization:
- **`SendOptions.defaults()`**: Uses the default serialization strategy.
- **`SendOptions.portable()`**: Uses portable JSON serialization for cross-language interoperability.

### getEvent

```java
Optional<Object> getEvent(String targetId, String key, Duration timeout)
```

Similar to [`dbos.getEvent`](./methods.md#getevent).

### readStream

```java
Iterator<Object> readStream(String workflowId, String key)
```

Similar to [`dbos.readStream`](./methods.md#readstream). Use this from external code that does not have access to a `DBOS` instance.

## Workflow Management Methods

### retrieveWorkflow

```java
WorkflowHandle<T, E> retrieveWorkflow(String workflowId)
```

Similar to [`dbos.retrieveWorkflow`](./methods.md#retrieveworkflow).

### getWorkflowStatus

```java
Optional<WorkflowStatus> getWorkflowStatus(String workflowId)
```

Retrieve the [`WorkflowStatus`](./methods.md#workflowstatus) of a workflow.

### listWorkflows

```java
List<WorkflowStatus> listWorkflows(ListWorkflowsInput input)
```

Similar to [`dbos.listWorkflows`](./methods.md#listworkflows).

### listWorkflowSteps

```java
List<StepInfo> listWorkflowSteps(String workflowId)
List<StepInfo> listWorkflowSteps(String workflowId, Integer limit, Integer offset)
```

Similar to [`dbos.listWorkflowSteps`](./methods.md#listworkflowsteps).

### cancelWorkflow

```java
void cancelWorkflow(String workflowId)
void cancelWorkflows(List<String> workflowIds)
```

Similar to [`dbos.cancelWorkflow`](./methods.md#cancelworkflow).

### resumeWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> resumeWorkflow(String workflowId)
<T, E extends Exception> WorkflowHandle<T, E> resumeWorkflow(String workflowId, String queueName)
List<WorkflowHandle<Object, Exception>> resumeWorkflows(List<String> workflowIds)
List<WorkflowHandle<Object, Exception>> resumeWorkflows(List<String> workflowIds, String queueName)
```

Similar to [`dbos.resumeWorkflow`](./methods.md#resumeworkflow).

### deleteWorkflow

```java
void deleteWorkflow(String workflowId)
void deleteWorkflow(String workflowId, boolean deleteChildren)
void deleteWorkflows(List<String> workflowIds)
void deleteWorkflows(List<String> workflowIds, boolean deleteChildren)
```

Similar to [`dbos.deleteWorkflow`](./methods.md#deleteworkflow).

### forkWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> forkWorkflow(
      String originalWorkflowId, int startStep, ForkOptions options)
```

Similar to [`dbos.forkWorkflow`](./methods.md#forkworkflow).

### setWorkflowDelay

```java
void setWorkflowDelay(String workflowId, Duration delay)
void setWorkflowDelay(String workflowId, Instant delayUntil)
```

Pause a workflow until a delay elapses or a specific time is reached. The workflow will resume from where it left off after the delay.

**Parameters:**
- **workflowId**: The ID of the workflow to delay.
- **delay**: The duration to delay the workflow from now.
- **delayUntil**: The absolute time until which to delay the workflow.

## Schedule Management Methods

### createSchedule

```java
void createSchedule(WorkflowSchedule schedule)
```

Create a cron schedule. See [`WorkflowSchedule`](./methods.md#workflowschedule) for the schedule configuration.

### getSchedule

```java
Optional<WorkflowSchedule> getSchedule(String name)
```

Get a schedule by name. Returns empty if the schedule does not exist.

### listSchedules

```java
List<WorkflowSchedule> listSchedules(
      List<ScheduleStatus> status,
      List<String> workflowName,
      List<String> namePrefix)
```

List schedules with optional filters. Pass `null` for any parameter to skip that filter.

**Parameters:**
- **status**: Filter by [`ScheduleStatus`](./methods.md#workflowschedule). Pass `null` for no status filter.
- **workflowName**: Filter by workflow name. Pass `null` for no workflow name filter.
- **namePrefix**: Filter by schedule name prefix. Pass `null` for no prefix filter.

### deleteSchedule

```java
void deleteSchedule(String name)
```

Delete a schedule by name. No-op if the schedule does not exist.

### pauseSchedule

```java
void pauseSchedule(String name)
```

Pause a schedule. A paused schedule does not fire.

### resumeSchedule

```java
void resumeSchedule(String name)
```

Resume a paused schedule so it begins firing again.

### applySchedules

```java
void applySchedules(List<WorkflowSchedule> schedules)
void applySchedules(WorkflowSchedule... schedules)
```

Atomically create or replace a set of schedules.

### backfillSchedule

```java
List<WorkflowHandle<Object, Exception>> backfillSchedule(
      String scheduleName, Instant start, Instant end)
```

Enqueue all executions of a schedule that would have run between `start` (exclusive) and `end` (exclusive).

**Parameters:**
- **scheduleName**: Name of an existing schedule.
- **start**: Start of the backfill window (exclusive).
- **end**: End of the backfill window (exclusive).

### triggerSchedule

```java
<T, E extends Exception> WorkflowHandle<T, E> triggerSchedule(String scheduleName)
```

Immediately enqueue the scheduled workflow at the current time.

**Parameters:**
- **scheduleName**: Name of an existing schedule.

## Application Version Methods

### listApplicationVersions

```java
List<VersionInfo> listApplicationVersions()
```

List all registered application versions, ordered by timestamp descending.

### getLatestApplicationVersion

```java
VersionInfo getLatestApplicationVersion()
```

Get the most recently promoted application version.

### setLatestApplicationVersion

```java
void setLatestApplicationVersion(String versionName)
```

Promote an existing version to be the latest application version by updating its timestamp. The version must already exist.
