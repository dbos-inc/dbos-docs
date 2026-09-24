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
DBOSClient(String url, String user, String password, String schema, DBOSSerializer serializer,
           boolean useListenNotify)
DBOSClient(String url, String user, String password, String schema, DBOSSerializer serializer,
           boolean useListenNotify, String applicationName)

DBOSClient(DataSource dataSource)
DBOSClient(DataSource dataSource, String schema)
DBOSClient(DataSource dataSource, String schema, DBOSSerializer serializer)
DBOSClient(DataSource dataSource, String schema, DBOSSerializer serializer, String applicationName)
DBOSClient(DataSource dataSource, String schema, DBOSSerializer serializer, boolean useListenNotify)
DBOSClient(DataSource dataSource, String schema, DBOSSerializer serializer, boolean useListenNotify,
           String applicationName)
```

Construct the DBOSClient.
`DBOSClient` implements `AutoCloseable`; call `close()` to release its database resources.

:::danger
DBOSClient requires a PostgreSQL database. Providing a non-PostgreSQL `DataSource` will throw an exception.
:::

The client never creates or migrates the system database.
On construction, it checks that the system database schema has been migrated to a version compatible with this DBOS release, and throws `IllegalStateException` if the schema is missing or too old.
Launch a DBOS application (or run [`dbosctl sysdb migrate`](../../production/dbosctl.md#dbosctl-sysdb-migrate)) against the system database first.

**Parameters:**
- **url**: The JDBC URL for your system database.
- **user**: Your PostgreSQL username or role.
- **password**: The password for your PostgreSQL user or role.
- **schema**: The schema the DBOS System Database tables are stored in. Defaults to `dbos` if not provided.
- **dataSource**: System Database data source. A `HikariDataSource` is created if not provided.
- **serializer**: A custom [serializer](./lifecycle.md#custom-serialization) for workflow inputs and outputs. Must match the serializer used by the DBOS application.
- **useListenNotify**: If `true`, the client runs a listener thread so [`getEvent`](#getevent) and [`readStream`](#readstream) are woken by PostgreSQL `LISTEN`/`NOTIFY` notifications instead of polling the database. Defaults to `false` on the constructors that do not take it, because it costs a dedicated connection and thread that only those two methods benefit from. Leave it `false` if the system database was migrated with `LISTEN`/`NOTIFY` disabled.
- **applicationName**: The application on whose behalf this client acts. Workflows the client enqueues, and queues and schedules it registers, are owned by that application, and the client's listing operations default to that application's rows. Always set this if multiple applications [share a system database](../../explanations/sharing-a-system-database.md).

#### Named and unnamed clients

A client constructed with an `applicationName` is a **named** client: it acts as that application.
A client constructed without one is an **unnamed** client: the workflows, queues, and schedules it creates are owned by no application (so every application sharing the system database treats them as its own), and its listing operations return every application's rows.
Individual operations can still target a specific application, for example with [`EnqueueOptions.withApplicationName`](#enqueueoptions).

#### applicationName

```java
String applicationName()
```

Return the application this client acts on behalf of, or `null` for an unnamed client.

## Workflow Interaction Methods

### enqueueWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> enqueueWorkflow(
      EnqueueOptions options, Object[] args)
<T, E extends Exception> WorkflowHandle<T, E> enqueueWorkflow(
      EnqueueOptions options, Object[] positionalArgs, Map<String, Object> namedArgs)
```

Enqueue a workflow and return a handle to it.

**Parameters:**
- **options**: Configuration for the enqueued workflow, as defined below.
- **args** / **positionalArgs**: An array of the workflow's arguments. These will be serialized and passed into the workflow when it is dequeued.
- **namedArgs**: Named arguments, for targets that take them, such as a Python workflow with keyword arguments. Only portable serialization carries named arguments, so passing any requires `withSerialization(SerializationStrategy.PORTABLE)` on the options; otherwise the call throws `IllegalArgumentException`.

**Example Syntax:**

This code enqueues workflow `exampleWorkflow` in class `com.example.ExampleImpl` on queue `example-queue` with arguments `argumentOne` and `argumentTwo`.

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword);
var options = new EnqueueOptions(
    "exampleWorkflow", "com.example.ExampleImpl", QueueName.of("example-queue"));
var handle = client.enqueueWorkflow(options, new Object[]{"argumentOne", "argumentTwo"});
```

#### EnqueueOptions

`EnqueueOptions` (`dev.dbos.transact.EnqueueOptions`) is a with-based configuration record for parameterizing `client.enqueueWorkflow`. The same record is used by [`dbos.enqueueWorkflow`](./methods.md#enqueueworkflow) inside a DBOS application.
The nested `DBOSClient.EnqueueOptions`, and the `DBOSClient` enqueue overloads that take it, are *(deprecated since 1.1)*.

**Constructors:**

```java
public EnqueueOptions(String workflowName, QueueName queue)
public EnqueueOptions(String workflowName, String className, QueueName queue)
public EnqueueOptions(String workflowName, String className, String instanceName, QueueName queue)
```

The constructors fix what to run and where: the workflow name, optionally the class that contains it and the [named instance](../tutorials/workflow-classes.md) to run it on, and the queue, as a [`QueueName`](./queues.md#queuename).
Without a class name, DBOS searches all registered classes for a matching workflow name; pass one when multiple classes have a workflow with the same name.
The workflow name and queue must not be null or empty.

**Methods:**

- **`withWorkflowId(String workflowId)`**: Specify the idempotency ID to assign to the enqueued workflow.
- **`withAppVersion(String appVersion)`**: The version of your application that should process this workflow.
If left undefined, the workflow is enqueued without a version and is only dequeued by an executor running the owning application's latest registered version, which sets the version when it first dequeues it.
- **`withTimeout(Duration timeout)`**, **`withTimeout(long value, TimeUnit unit)`**:  Set an explicit timeout for the enqueued workflow. When the timeout expires, the workflow and all its children are cancelled. The timeout does not begin until the workflow is dequeued and starts execution.
- **`withTimeout(Timeout timeout)`**, **`withNoTimeout()`**: Set the timeout as a [`Timeout`](./methods.md#timeout): explicit, none, or inherit. Inside a workflow, [`dbos.enqueueWorkflow`](./methods.md#enqueueworkflow) resolves it as `startWorkflow` does, so an unset timeout inherits the enqueuing workflow's and `withNoTimeout()` declines it. From a client there is nothing to inherit, so an unset or inherited timeout means no timeout.
- **`withDeadline(Instant deadline)`**:  Set a deadline for the enqueued workflow. If the workflow is executing when the deadline arrives, the workflow and all its children are cancelled.

:::info
An explicit timeout and a deadline cannot both be set.
:::

- **`withDelay(Duration delay)`**: Delay the start of the workflow by the specified duration after it is dequeued.
- **`withDeduplicationId(String deduplicationId)`**: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED`, `PENDING`, or `DELAYED`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise an exception.
- **`withPriority(Integer priority)`**: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in FIFO (first in, first out) order. Priority values can range from `0` to `2,147,483,647`, where a low number indicates a higher priority. A negative priority throws `IllegalArgumentException`. Workflows without assigned priorities have priority `0`, the highest priority.
- **`withSerialization(SerializationStrategy serialization)`**: Specify the [serialization strategy](./lifecycle.md#custom-serialization) for the workflow arguments. Options are `SerializationStrategy.DEFAULT`, `SerializationStrategy.PORTABLE`, or `SerializationStrategy.NATIVE`.
- **`withQueuePartitionKey(String partitionKey)`**: Set a queue partition key for the workflow. Use if and only if the queue is partitioned, which it is when any per-partition limit (`partitionConcurrency`, `partitionWorkerConcurrency`, or `partitionRateLimit`) is set, or when it was registered with the deprecated `partitionQueue` flag. Per-partition limits apply to each partition key separately; queue-wide limits still apply to the queue as a whole, except on a queue registered with the deprecated `partitionQueue` flag, where they apply to each partition instead. See [Partitioning Queues](../tutorials/queue-tutorial.md#partitioning-queues).

:::info
- Partition keys are required when enqueueing to a partitioned queue.
- Partition keys cannot be used with non-partitioned queues.
- Partition keys and deduplication IDs cannot be used together.
:::

- **`withAuthenticatedUser(String user)`**: Set the authenticated user for the enqueued workflow. Stored in the workflow record and accessible via `DBOS.authenticatedUser()` when the workflow executes.

- **`withAssumedRole(String role)`**: Set the assumed role for the workflow. Accessible via `DBOS.assumedRole()`.

- **`withAuthenticatedRoles(String... roles)`**: Set the list of authenticated roles. Accessible via `DBOS.authenticatedRoles()`.

- **`withAuthentication(String user, String... roles)`**: Convenience method to set both `authenticatedUser` and `authenticatedRoles` in one call.

- **`withAttributes(Map<String, Object> attributes)`**: Attach custom JSON-serializable key-value metadata to the workflow. Searchable via `ListWorkflowsInput.withAttributes(Map)`.

- **`withApplicationName(String applicationName)`**: The application that owns the enqueued workflow. Only executors running that application dequeue and run it, so this is how one application enqueues work for another application sharing its system database. Defaults to the client's own [`applicationName`](#applicationname); on an unnamed client, the workflow is owned by no application. See [Sharing a System Database](../../explanations/sharing-a-system-database.md).

### enqueuePortableWorkflow *(deprecated since 1.1)*

`enqueuePortableWorkflow` only takes the deprecated `DBOSClient.EnqueueOptions`.
To enqueue a workflow written in another language, set `withSerialization(SerializationStrategy.PORTABLE)` on [`EnqueueOptions`](#enqueueoptions) and call [`enqueueWorkflow`](#enqueueworkflow), passing named arguments if the target takes them.

### send

```java
send(String destinationId, Object message, String topic, String idempotencyKey)
send(String destinationId, Object message, String topic, String idempotencyKey, SendOptions options)
```

Similar to [`dbos.send`](./methods.md#send).

The optional `SendOptions` parameter controls serialization and fork delivery; see [`SendOptions`](#sendoptions) below.

### sendBulk

```java
void sendBulk(List<SendMessage> messages)
void sendBulk(List<SendMessage> messages, SendOptions options)
```

Send multiple messages to workflows in a single batch. Each message is delivered to its destination workflow independently; messages need not share the same destination.

**Parameters:**
- **messages**: A list of [`SendMessage`](./methods.md#sendmessage) records describing each message to send.
- **options**: Optional send options controlling serialization and fork delivery; see [`SendOptions`](#sendoptions) below.

### SendOptions

```java
SendOptions.defaults()
SendOptions.portable()
```

`SendOptions` controls serialization and fork delivery for [`send`](#send) and [`sendBulk`](#sendbulk).

**Factory methods:**
- **`SendOptions.defaults()`**: Uses the default serialization strategy.
- **`SendOptions.portable()`**: Uses portable JSON serialization for cross-language interoperability.

**Builder method:**
- **`withSendToForks(boolean)`**: Returns a new `SendOptions` with the `sendToForks` flag set. If `true`, the message is also delivered to any forked copies of the destination workflow.

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
If no workflow with the given ID exists, iterating throws `DBOSNonExistentWorkflowException`.

### findWorkflowIdByDeduplicationId

```java
String findWorkflowIdByDeduplicationId(String queueName, String deduplicationId)
```

Return the ID of the active (`ENQUEUED`, `PENDING`, or `DELAYED`) workflow holding the given deduplication ID on the given queue, or `null` if there is none.

### findDeduplicationHolder

```java
DeduplicationHolder findDeduplicationHolder(String queueName, String deduplicationId)

public record DeduplicationHolder(
    String workflowId,
    String applicationName,
    String workflowName,
    String className,
    String instanceName,
    WorkflowState status,
    boolean isDebounced)
```

Like [`findWorkflowIdByDeduplicationId`](#findworkflowidbydeduplicationid), but also returns the application that owns the holding workflow, along with its name and status.
Deduplication IDs are unique across all applications sharing a system database, so the holder may belong to another application.
Returns `null` if no active workflow holds the deduplication ID.

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
void cancelWorkflow(String workflowId, boolean cancelChildren)
void cancelWorkflows(List<String> workflowIds)
void cancelWorkflows(List<String> workflowIds, boolean cancelChildren)
```

Similar to [`dbos.cancelWorkflow`](./methods.md#cancelworkflow). When `cancelChildren` is `true`, also recursively cancels all descendant workflows.

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

### updateWorkflowAttributes

```java
void updateWorkflowAttributes(String workflowId, Map<String, Object> attributes)
```

Similar to [`dbos.updateWorkflowAttributes`](./methods.md#updateworkflowattributes).

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
The schedule is owned by, and its workflows run by, the application named by [`WorkflowSchedule.withApplicationName`](./methods.md#workflowschedule), defaulting to the client's own [`applicationName`](#applicationname).
A schedule created by an unnamed client without an application name is owned by no application, so every application sharing the system database runs it.

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
List<WorkflowSchedule> listSchedules(
      List<ScheduleStatus> status,
      List<String> workflowName,
      List<String> namePrefix,
      List<String> applicationName)
```

List schedules with optional filters. Pass `null` for any parameter to skip that filter.

**Parameters:**
- **status**: Filter by [`ScheduleStatus`](./methods.md#workflowschedule). Pass `null` for no status filter.
- **workflowName**: Filter by workflow name. Pass `null` for no workflow name filter.
- **namePrefix**: Filter by schedule name prefix. Pass `null` for no prefix filter.
- **applicationName**: List schedules owned by these applications, plus schedules no application owns. If `null` (or omitted), lists the client's own [`applicationName`](#applicationname)'s schedules; an unnamed client lists every application's schedules. Pass an empty list to list every application's schedules.

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

## Queue Management Methods

`DBOSClient` can manage queues directly in the system database without a running DBOS executor.
See [Queues & Concurrency](../tutorials/queue-tutorial.md) in the tutorial for usage examples.

### registerQueue

```java
void registerQueue(String name, QueueOptions options)
void registerQueue(String name, QueueOptions options, QueueConflictResolution onConflict)
void registerQueue(String name, QueueOptions options, QueueConflictResolution onConflict,
                   String applicationName)
```

Register or update a queue in the system database. The default conflict resolution is `ALWAYS_UPDATE`.

The queue is owned by, and polled only by, the application named by `applicationName`, defaulting to the client's own [`applicationName`](#applicationname) (or no application, for an unnamed client).
Registering a queue whose name is already owned by a different application throws [`DBOSApplicationNameConflictException`](./methods.md#dbosapplicationnameconflictexception).

:::info
`QueueConflictResolution.UPDATE_IF_LATEST_VERSION` is not supported for `DBOSClient` because clients are not associated with an application version. Use `ALWAYS_UPDATE` or `NEVER_UPDATE`.
:::

### updateQueue

```java
void updateQueue(String name, QueueOptions options)
```

Update the configuration of an existing queue. Only fields set on `options` are modified; absent fields are left unchanged (see [`QueueOptions`](./queues.md#queueoptions) and [`Field<T>`](./queues.md#fieldt)).

### findQueue

```java
Optional<Queue> findQueue(String name)
```

Look up a queue by name. Returns empty if no queue with that name exists.

### listQueues

```java
List<Queue> listQueues()
List<Queue> listQueues(List<String> applicationName)
```

Return the queues registered in the system database.
The queues listed are those owned by the given applications, plus queues no application owns.
If `applicationName` is `null` (or omitted), lists the client's own [`applicationName`](#applicationname)'s queues; an unnamed client lists every application's queues. Pass an empty list to list every application's queues.

### deleteQueue

```java
boolean deleteQueue(String name)
```

Delete a queue from the system database. Returns `true` if the queue was deleted, `false` if it did not exist.

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
void setLatestApplicationVersion(String versionName, String applicationName)
```

Promote an existing version to be the latest application version by updating its timestamp. The version must already exist.

**Parameters:**
- **versionName**: The name of the version to promote.
- **applicationName**: The application to act as. Defaults to the client's own [`applicationName`](#applicationname). Promoting a version registered by a different application throws [`DBOSApplicationNameConflictException`](./methods.md#dbosapplicationnameconflictexception). Promoting a version owned by no application claims it for this application.

## Application Rename

### renameApplication

```java
ApplicationRowCounts renameApplication(String oldName, String newName)
ApplicationRowCounts renameApplication(
      String oldName, String newName, Integer batchSize, boolean adoptUnclaimedRows)

public record ApplicationRowCounts(
      long queues, long schedules, long versions, long workflows, long steps)
```

Every workflow, step, queue, schedule, and application version is owned by the application that created it.
After renaming an application, use this method (or the [`dbosctl sysdb rename-application`](../../production/dbosctl.md#dbosctl-sysdb-rename-application) command) to transfer everything owned by the old name to the new name.
Returns the number of rows transferred, by table.
The operation is idempotent: if interrupted, running it again resumes where it left off.

:::warning
Stop the application being renamed before running this.
A running application would race the rename, creating new work under its old name.
:::

**Parameters:**
- **oldName**: The application's previous name. If `null`, nothing is transferred except rows owned by no application, so `adoptUnclaimedRows` must be `true`.
- **newName**: The application that ends up owning the rows.
- **batchSize**: The number of completed workflows and steps transferred per transaction; queues, schedules, versions, and active workflows are transferred together in a single transaction. The two-argument overload uses 10,000. Pass `null` to transfer everything in a single transaction.
- **adoptUnclaimedRows**: Also transfer rows owned by no application, such as rows created before upgrading to a DBOS version supporting application ownership. The two-argument overload passes `false`.

## Debouncing

Workflows can be debounced from external code using `DebouncerClient`.

### DBOSClient.debouncer

```java
<R> DebouncerClient<R> debouncer(String workflowName)
```

Create a `DebouncerClient` for the named workflow. Similar to [`dbos.debouncer()`](./methods.md#debouncer) but operates externally — no running DBOS executor is required on the caller's side.

`DebouncerClient<R>` is an immutable builder. Configure it with the following methods before calling `debounce`:

- **`withClassName(String className)`**: The fully-qualified Java class name of the workflow implementation. **Required** — must be set before calling `debounce`.
- **`withInstanceName(String instanceName)`**: The DBOS instance name of the target workflow implementation.
- **`withDebounceTimeout(Duration debounceTimeout)`**: Set an absolute cap on how long the debouncer may keep absorbing calls for a single key.
- **`withQueue(QueueName queue)`** / **`withQueue(String queueName)`**: Enqueue the user workflow on the specified queue when the debounce period elapses. `withQueue(Queue queue)` is *(deprecated since 1.1)*.
- **`withTimeout(Duration timeout)`**: Set a timeout for the user workflow.
- **`withAppVersion(String appVersion)`**: Target a specific application version.
- **`withPriority(Integer priority)`**: Set the priority for the user workflow. A priority requires a queue: if a priority is set without `withQueue`, `debounce` throws `IllegalArgumentException`.
- **`withAttributes(Map<String, Object> attributes)`**: Attach custom JSON-serializable key-value metadata to the user workflow.
- **`withSerialization(SerializationStrategy serialization)`**: The [serialization strategy](./methods.md#serialization-strategy) for the user workflow's arguments. It should match the strategy the workflow is registered with.
- **`withDeduplicationId(String deduplicationId)`** *(deprecated since 1.1)*: Set a deduplication ID forwarded to the user workflow. This will be ignored from the next release, where the debouncer sets the deduplication ID itself, and removed in 2.0.

### DebouncerClient.debounce

```java
WorkflowHandle<R, ?> debounce(String debounceKey, Duration debouncePeriod, Object... args)
```

Similar to [`debouncer.debounce`](./methods.md#debouncerdebounce) but takes positional arguments directly instead of a workflow proxy lambda.

**Parameters:**
- **debounceKey**: A key used to group workflow executions that will be debounced together.
- **debouncePeriod**: Inactivity window before the user workflow runs; each call resets it.
- **args**: Positional arguments to pass to the workflow when it runs.

**Example Syntax:**

```java
var client = new DBOSClient(url, user, password);

var debouncer = client.<String>debouncer("processInput")
    .withClassName(MyServiceImpl.class.getName())
    .withDebounceTimeout(Duration.ofMinutes(5));

// Each time a user submits input, debounce the processInput workflow.
// The workflow will run 60 seconds after the user stops submitting.
WorkflowHandle<String, ?> handle = debouncer.debounce(
    userId,
    Duration.ofSeconds(60),
    userInput);
String result = handle.getResult();
```
