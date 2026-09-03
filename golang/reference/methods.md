# DBOS Methods & Variables

> This page documents the package-level functions for interacting with workflows: communication, streams, management, schedules, and application versions.

The first parameter of each function tells you who can call it — see [Who can do what](./dbos-context.md#who-can-do-what):
- A function taking a **`Client`** accepts a [standalone client](./dbos-context.md#newclient) or any [`Context`](./dbos-context.md#context) (launched or not).
- A function taking a **`Context`** requires a DBOS context; some (like [`Recv`](#recv) or [`SetEvent`](#setevent)) can only be called within a workflow.

## Enqueueing Workflows

### Enqueue

```go
func Enqueue[R any, P any](
    ctx Client,
    queueName string,
    workflowName string,
    input P,
    opts ...EnqueueOption
) (WorkflowHandle[R], error)
```

Enqueue a workflow for processing and return a [WorkflowHandle](./workflows-steps.md#workflowhandle) to it, similar to [RunWorkflow with the WithQueue option](./workflows-steps.md#withqueue).

The workflow is identified by **name** rather than by function reference, so the enqueueing process does not need to have the workflow registered — this is how you enqueue workflows from a [standalone client](./dbos-context.md#newclient).

Required parameters:

* `ctx`: The DBOS client or context
* `queueName`: The name of the [queue](./queues.md) on which to enqueue the workflow
* `workflowName`: The name of the workflow function being enqueued
* `input`: The input to pass to the workflow

Optional configuration via `EnqueueOption`, documented below.

:::tip Cross-Language Enqueue
To enqueue a workflow on a target application written in another language, pass a [`PortableWorkflowArgs`](#portableworkflowargs) as the input.
This automatically uses portable JSON serialization.
See [Cross-Language Interaction](../../explanations/portable-workflows.md) for details.
:::

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

handle, err := dbos.Enqueue[ProcessOutput](
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

#### WithEnqueueWorkflowID

```go
func WithEnqueueWorkflowID(id string) EnqueueOption
```

The unique ID for the enqueued workflow.
If left undefined, DBOS will generate a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
Please see [Workflow IDs and Idempotency](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) for more information.

#### WithEnqueueApplicationVersion

```go
func WithEnqueueApplicationVersion(version string) EnqueueOption
```

The version of your application that should process this workflow.
If left undefined, a `Context` enqueueing to its own application uses its current application version; otherwise (from a [standalone client](./dbos-context.md#newclient), or when enqueueing to another application with [`WithEnqueueApplicationName`](#withenqueueapplicationname)) the version is left unset and the workflow is dequeued at the owning application's latest registered version.

#### WithEnqueueApplicationName

```go
func WithEnqueueApplicationName(name string) EnqueueOption
```

The application that owns the enqueued workflow, which dequeues and runs it.
Defaults to the enqueueing context's own application.
Use this to run another application's workflows when multiple applications [share a system database](../../explanations/sharing-a-system-database.md); if the applications are written in different languages, also pass a [`PortableWorkflowArgs`](#portableworkflowargs) as the input so the target application can read the arguments.

#### WithEnqueueTimeout

```go
func WithEnqueueTimeout(timeout time.Duration) EnqueueOption
```

Set a timeout for the enqueued workflow.
When the timeout expires, the workflow **and all its children** are cancelled (except if the child's context has been made uncancellable using [`WithoutCancel`](./dbos-context.md#withoutcancel)).
The timeout does not begin until the workflow is dequeued and starts execution.

#### WithEnqueueDeduplicationID

```go
func WithEnqueueDeduplicationID(id string) EnqueueOption
```

At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will fail.
This behavior can be changed with [`WithEnqueueDeduplicationPolicy`](#withenqueuededuplicationpolicy).

#### WithEnqueueDeduplicationPolicy

```go
func WithEnqueueDeduplicationPolicy(policy DeduplicationPolicy) EnqueueOption
```

Set how a colliding deduplication ID is handled.
Requires [`WithEnqueueDeduplicationID`](#withenqueuededuplicationid).
With the default `DeduplicationPolicyReject`, a colliding enqueue fails with a `ErrorCodeQueueDeduplicated` error; with `DeduplicationPolicyReturnExisting`, it instead returns a handle to the existing workflow.
See [`WithDeduplicationPolicy`](./workflows-steps.md#withdeduplicationpolicy).

#### WithEnqueuePriority

```go
func WithEnqueuePriority(priority uint) EnqueueOption
```

The priority of the enqueued workflow in the specified queue.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order.
Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.

#### WithEnqueueClassName

```go
func WithEnqueueClassName(className string) EnqueueOption
```

The class/namespace name for the target workflow.
Required when enqueueing to Python, TypeScript, or Java targets, which dispatch workflows by (class_name, workflow_name) pair.

#### WithEnqueueConfigName

```go
func WithEnqueueConfigName(configName string) EnqueueOption
```

The config/instance name for the target workflow.
Required when enqueueing to a workflow registered on a configured instance: a Go workflow registered with [`WithInstance`](./workflows-steps.md#withinstance), or a Python, TypeScript, or Java class instance workflow (e.g., Python's [`DBOSConfiguredInstance`](../../python/tutorials/classes.md), TypeScript's [`ConfiguredInstance`](../../typescript/tutorials/instantiated-objects.md)).
The value must match the instance name used by the target application.

#### WithEnqueueDelay

```go
func WithEnqueueDelay(delay time.Duration) EnqueueOption
```

Delay execution of the enqueued workflow by the specified duration.
The workflow is initially placed in `DELAYED` status and transitions to `ENQUEUED` after the delay expires.
The delay can later be updated via [`SetWorkflowDelay`](#setworkflowdelay).

#### WithEnqueueQueuePartitionKey

```go
func WithEnqueueQueuePartitionKey(partitionKey string) EnqueueOption
```

The partition key to enqueue under when the target queue is a [partitioned queue](../tutorials/queue-tutorial.md#partitioning-queues).
Each partition has its own concurrency limits.

#### WithEnqueueAttributes

```go
func WithEnqueueAttributes(attributes map[string]any) EnqueueOption
```

Attach custom key-value [attributes](./workflows-steps.md#withworkflowattributes) to the enqueued workflow.
Attributes are recorded in the workflow status at creation, must be JSON-serializable, and can be searched with [`WithFilterAttributes`](#withfilterattributes) on Postgres.

#### WithEnqueueAuthenticatedUser

```go
func WithEnqueueAuthenticatedUser(user string) EnqueueOption
```

Associate the enqueued workflow with a user name.

#### WithEnqueueAssumedRole

```go
func WithEnqueueAssumedRole(role string) EnqueueOption
```

Set the assumed role for the enqueued workflow.

#### WithEnqueueAuthenticatedRoles

```go
func WithEnqueueAuthenticatedRoles(roles ...string) EnqueueOption
```

Set the authenticated roles for the enqueued workflow.

#### WithEnqueueTransaction

```go
func WithEnqueueTransaction(tx any) EnqueueOption
```

Enqueue the workflow on a transaction you own instead of one DBOS opens, so the enqueue commits **atomically** with your own database writes: either both are committed or both are rolled back.
`tx` must be a `pgx.Tx`, a `*sql.Tx`, or a [`Tx`](./datasources.md#the-tx-interface), and must run against your DBOS system database.

You own the transaction: `Enqueue` does not begin, commit, or roll back it, and does not retry on database errors.
The returned [`WorkflowHandle`](./workflows-steps.md#workflowhandle) is created immediately, but the workflow is not enqueued until you commit, so do not call `GetResult` on the handle until after the transaction commits.
If the enqueue fails, the transaction is left in an aborted state: roll it back rather than retrying the call on it.

This option is available from a [standalone client](./dbos-context.md#newclient) or a context outside a workflow.
It cannot be used inside a workflow, where an enqueue is checkpointed as a step, nor together with [`WithEnqueueDeduplicationPolicy`](#withenqueuededuplicationpolicy) set to `DeduplicationPolicyReturnExisting`, which retries the insert on collision and so would abort your transaction.

```go
tx, err := pool.Begin(ctx)
if err != nil {
    return err
}
defer tx.Rollback(ctx)

// Perform your own writes on tx here, in the same transaction...
_, err = tx.Exec(ctx, "INSERT INTO orders (id) VALUES ($1)", orderID)
if err != nil {
    return err
}
handle, err := dbos.Enqueue[ProcessOutput](client, "process_queue", "ProcessWorkflow", orderID,
    dbos.WithEnqueueTransaction(tx))
if err != nil {
    return err
}
// Until this commits, the workflow does not exist. If you roll back instead, it never does.
if err := tx.Commit(ctx); err != nil {
    return err
}
result, err := handle.GetResult()
```

## Workflow Communication

### GetEvent

```go
func GetEvent[R any](ctx Client, targetWorkflowID, key string, timeout time.Duration) (R, error)
```

Retrieve the latest value of an event published by the workflow identified by `targetWorkflowID` to the key `key`.
If the event does not yet exist, wait for it to be published, returning an error if the wait times out.

**Parameters:**
- **ctx**: The DBOS client or context.
- **targetWorkflowID**: The identifier of the workflow whose events to retrieve.
- **key**: The key of the event to retrieve.
- **timeout**: A timeout. If the wait times out, return an error.

### SetEvent

```go
func SetEvent[P any](ctx Context, key string, message P, opts ...SetEventOption) error
```
Create and associate with this workflow an event with key `key` and value `value`.
If the event already exists, update its value.
May only be called from within a workflow or step.
Writes from a workflow are exactly-once; writes from a step are at-least-once, attributed to the enclosing step.

**Parameters:**
- **ctx**: The DBOS context.
- **key**: The key of the event.
- **message**: The value of the event. Must be serializable.
- **opts**: Optional [SetEventOption](#withportablesetevent) functions.

### Send

```go
func Send[P any](ctx Client, destinationID string, message P, topic string, opts ...SendOption) error
```
Send a message to the workflow identified by `destinationID`.
Messages can optionally be associated with a topic.

**Parameters:**
- **ctx**: The DBOS client or context.
- **destinationID**: The workflow to which to send the message.
- **message**: The message to send. Must be serializable.
- **topic**: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- **opts**: Optional `SendOption` functions ([`WithIdempotencyKey`](#withidempotencykey), [`WithSendTransaction`](#withsendtransaction), [`WithPortableSend`](#withportablesend)).

#### WithIdempotencyKey

```go
func WithIdempotencyKey(key string) SendOption
```

Make a `Send` deliver at most once.
The key is combined with the destination workflow ID to form the message's primary key, so retrying a `Send` with the same key (after a crash, timeout, or network failure) inserts the message only once.
Keys are scoped per destination.
Without a key, every `Send` delivers a new message.

```go
err := dbos.Send(ctx, destinationID, payload, "payments", dbos.WithIdempotencyKey("payment-123"))
```

#### WithSendTransaction

```go
func WithSendTransaction(tx any) SendOption
```

Send the message on a transaction you own instead of one DBOS opens, so the message commits **atomically** with your own database writes.
`tx` must be a `pgx.Tx`, a `*sql.Tx`, or a [`Tx`](./datasources.md#the-tx-interface), and must run against your DBOS system database.

You own the transaction: `Send` does not begin, commit, or roll back it, and does not retry on database errors.
The message is not visible to the destination workflow until you commit.
If the send fails, the transaction is left in an aborted state: roll it back rather than retrying the call on it.

This option is available from a [standalone client](./dbos-context.md#newclient) or a context outside a workflow.
It cannot be used inside a workflow, where a send is checkpointed as a step.

```go
tx, err := pool.Begin(ctx)
if err != nil {
    return err
}
defer tx.Rollback(ctx)

_, err = tx.Exec(ctx, "INSERT INTO orders (id) VALUES ($1)", orderID)
if err != nil {
    return err
}
err = dbos.Send(client, workflowID, orderID, "orders", dbos.WithSendTransaction(tx))
if err != nil {
    return err
}
return tx.Commit(ctx)
```

### Recv

```go
func Recv[R any](ctx Context, topic string, timeout time.Duration) (R, error)
```

Receive and return a message sent to this workflow.
Can only be called from within a workflow.
Messages are dequeued first-in, first-out from a queue associated with the topic.
Calls to `recv` wait for the next message in the queue, returning an error if the wait times out.

**Parameters:**
- **ctx**: The DBOS context.
- **topic**: A topic queue on which to wait.
- **timeout**: A `time.Duration` to wait. If the wait times out, return an error.

## Streams

Workflows can stream data to clients in real time.
Streams are durable, append-only, and ordered by offset.
See the [streaming tutorial](../tutorials/workflow-communication.md#workflow-streaming) for usage examples.

### WriteStream

```go
func WriteStream[P any](ctx Context, key string, value P, opts ...WriteStreamOption) error
```

Write a value to a durable stream.
May only be called from within a workflow or step.
Writes from a workflow are exactly-once; writes from a step are at-least-once.

**Parameters:**
- **ctx**: The DBOS context.
- **key**: The stream key. A workflow can have multiple streams, each identified by a unique key.
- **value**: The value to write. Must be serializable (json-encodable).
- **opts**: Optional [WriteStreamOption](#withportablewritestream) functions.

### CloseStream

```go
func CloseStream(ctx Context, key string) error
```

Close a durable stream.
May only be called from within a workflow (not from inside a step).
After closing, no more values can be written to the stream.
Streams are also automatically closed when the workflow terminates.

**Parameters:**
- **ctx**: The DBOS context.
- **key**: The stream key to close.

### ReadStream

```go
func ReadStream[R any](ctx Client, workflowID string, key string, opts ...ReadStreamOption) ([]R, bool, error)
```

Read all values from a durable stream.
By default, blocks until the stream is closed or the workflow becomes inactive (status is not `PENDING` or `ENQUEUED`).
Pass [`WithReadStreamSnapshot`](#withreadstreamsnapshot) to instead return immediately once all currently-available values have been drained.

**Parameters:**
- **ctx**: The DBOS client or context.
- **workflowID**: The ID of the workflow whose stream to read.
- **key**: The stream key to read.
- **opts**: Optional [ReadStreamOption](#withreadstreamsnapshot) functions.

**Returns:**
- The values read from the stream.
- Whether the stream is closed.
- Any error that occurred.

### ReadStreamAsync

```go
func ReadStreamAsync[R any](ctx Client, workflowID string, key string) (<-chan StreamValue[R], error)
```

Read values from a durable stream asynchronously.
Returns immediately with a channel that receives values as they are written to the stream.
The channel is closed when the stream is closed or an error occurs.

**Parameters:**
- **ctx**: The DBOS client or context.
- **workflowID**: The ID of the workflow whose stream to read.
- **key**: The stream key to read.

**Returns:**
- A receive-only channel of [`StreamValue[R]`](#streamvalue).
- Any error that occurred during setup.

### StreamValue

```go
type StreamValue[R any] struct {
    Value  R     // The stream value (zero value if error/closed)
    Err    error // Error if one occurred (nil otherwise)
    Closed bool  // Whether the stream is closed
}
```

`StreamValue` holds a value, error, or closed status from an async stream read operation.
When reading from the channel returned by `ReadStreamAsync`, check `Err` and `Closed` before using `Value`.

## Sleep

### Sleep

```go
func Sleep(ctx Context, duration time.Duration) (time.Duration, error)
```

Sleep for the given duration.
May only be called from within a workflow.
This sleep is durable&mdash;it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.
If the workflow's context is cancelled (e.g., its [durable timeout](../tutorials/workflow-tutorial.md#workflow-timeouts) expires), the sleep wakes immediately, returning the elapsed duration and the context's error.

**Parameters:**
- **ctx**: The DBOS context.
- **duration**: The duration to sleep.

## Workflow Management Methods

### RetrieveWorkflow

```go
func RetrieveWorkflow[R any](ctx Client, workflowID string) (WorkflowHandle[R], error)
```

Retrieve the [handle](./workflows-steps.md#workflowhandle) of a workflow.
The generic `RetrieveWorkflow` returns a typed handle whose `GetResult` decodes the workflow output into type `R`.

**Parameters**:
- **ctx**: The DBOS client or context.
- **workflowID**: The ID of the workflow whose handle to retrieve.

### ListWorkflows

```go
func ListWorkflows(ctx Client, opts ...ListWorkflowsOption) ([]WorkflowStatus, error)
```

Retrieve a list of [`WorkflowStatus`](#workflow-status) of all workflows matching specified criteria.

If multiple applications [share a system database](../../explanations/sharing-a-system-database.md), only workflows owned by the calling context's application (plus workflows owned by no application) are listed by default; use [`WithFilterApplicationName`](#withfilterapplicationname) to list other applications' workflows.
A [standalone client](./dbos-context.md#newclient) with no `AppName` lists every application's workflows.

**Example usage:**

```go
// List all successful workflows from the last 24 hours
workflows, err := dbos.ListWorkflows(ctx,
    dbos.WithFilterStatus(dbos.WorkflowStatusSuccess),
    dbos.WithFilterCreatedAfter(time.Now().Add(-24*time.Hour)),
    dbos.WithFilterLimit(100))
if err != nil {
    log.Fatal(err)
}

// List workflows by specific IDs without loading input/output data
workflows, err := dbos.ListWorkflows(ctx,
    dbos.WithFilterWorkflowIDs("workflow1", "workflow2"),
    dbos.WithFilterLoadInput(false),
    dbos.WithFilterLoadOutput(false))
if err != nil {
    log.Fatal(err)
}
```

#### WithFilterApplicationName

```go
func WithFilterApplicationName(applicationName ...string) ListWorkflowsOption
```

List workflows owned by these applications (workflows owned by no application are always included).

#### WithFilterAppVersion

```go
func WithFilterAppVersion(appVersion ...string) ListWorkflowsOption
```

Retrieve workflows tagged with any of these application versions.

#### WithFilterCreatedBefore

```go
func WithFilterCreatedBefore(endTime time.Time) ListWorkflowsOption
```

Retrieve workflows started before this timestamp.

#### WithFilterAttributes

```go
func WithFilterAttributes(attributes map[string]any) ListWorkflowsOption
```

Retrieve workflows whose [attributes](./workflows-steps.md#withworkflowattributes) contain all the given key-value pairs (JSONB containment).
Requires a Postgres system database; listing fails with an error on SQLite.

#### WithFilterLimit

```go
func WithFilterLimit(limit int) ListWorkflowsOption
```

Retrieve up to this many workflows.

#### WithFilterLoadInput

```go
func WithFilterLoadInput(loadInput bool) ListWorkflowsOption
```

WithFilterLoadInput controls whether to load workflow input data (default: true on a launched `Context`, false on an unlaunched context or standalone client).

#### WithFilterLoadOutput

```go
func WithFilterLoadOutput(loadOutput bool) ListWorkflowsOption
```

WithFilterLoadOutput controls whether to load workflow output data (default: true on a launched `Context`, false on an unlaunched context or standalone client).

#### WithFilterName

```go
func WithFilterName(names ...string) ListWorkflowsOption
```

Filter workflows by the specified workflow function name.

#### WithFilterOffset

```go
func WithFilterOffset(offset int) ListWorkflowsOption
```

Skip this many workflows from the results returned (for pagination).

#### WithFilterSortDesc

```go
func WithFilterSortDesc() ListWorkflowsOption
```

Sort the results in descending order by workflow start time (ascending is the default).

#### WithFilterCreatedAfter

```go
func WithFilterCreatedAfter(startTime time.Time) ListWorkflowsOption
```

Retrieve workflows started after this timestamp.

#### WithFilterStatus

```go
func WithFilterStatus(status ...WorkflowStatusType) ListWorkflowsOption
```

Filter workflows by [status](#workflowstatustype). Multiple statuses can be specified.

#### WithFilterUser

```go
func WithFilterUser(user ...string) ListWorkflowsOption
```

Filter workflows run by any of these authenticated users.

#### WithFilterWorkflowIDs

```go
func WithFilterWorkflowIDs(workflowIDs ...string) ListWorkflowsOption
```

Filter workflows by specific workflow IDs.

#### WithFilterWorkflowIDPrefix

```go
func WithFilterWorkflowIDPrefix(prefix ...string) ListWorkflowsOption
```

Filter workflows whose IDs start with any of the specified prefixes.

#### WithFilterQueuesOnly

```go
func WithFilterQueuesOnly() ListWorkflowsOption
```

Return only workflows that are currently in a queue (queue name is not null, status is `ENQUEUED`, `PENDING`, or `DELAYED`).

#### WithFilterQueueName

```go
func WithFilterQueueName(queueName ...string) ListWorkflowsOption
```

Filter workflows enqueued on any of these queues.

#### WithFilterExecutorIDs

```go
func WithFilterExecutorIDs(executorIDs ...string) ListWorkflowsOption
```

Filter workflows by the executor IDs that ran them.

#### WithFilterForkedFrom

```go
func WithFilterForkedFrom(forkedFrom ...string) ListWorkflowsOption
```

Filter workflows forked from any of these workflow IDs.

#### WithFilterParentWorkflowID

```go
func WithFilterParentWorkflowID(parentWorkflowID ...string) ListWorkflowsOption
```

Filter child workflows spawned by any of these parent workflow IDs.

#### WithFilterDeduplicationID

```go
func WithFilterDeduplicationID(deduplicationID ...string) ListWorkflowsOption
```

Filter workflows by their queue deduplication IDs.

#### WithFilterCompletedAfter

```go
func WithFilterCompletedAfter(completedAfter time.Time) ListWorkflowsOption
```

Retrieve workflows that reached a terminal state (`SUCCESS`, `ERROR`, or `CANCELLED`) at or after this timestamp.

#### WithFilterCompletedBefore

```go
func WithFilterCompletedBefore(completedBefore time.Time) ListWorkflowsOption
```

Retrieve workflows that reached a terminal state (`SUCCESS`, `ERROR`, or `CANCELLED`) at or before this timestamp.

#### WithFilterDequeuedAfter

```go
func WithFilterDequeuedAfter(dequeuedAfter time.Time) ListWorkflowsOption
```

Retrieve workflows that started executing at or after this timestamp.

#### WithFilterDequeuedBefore

```go
func WithFilterDequeuedBefore(dequeuedBefore time.Time) ListWorkflowsOption
```

Retrieve workflows that started executing at or before this timestamp.

#### WithFilterWasForkedFrom

```go
func WithFilterWasForkedFrom(wasForkedFrom bool) ListWorkflowsOption
```

Filter workflows by whether they have been forked from (true) or not (false).

#### WithFilterHasParent

```go
func WithFilterHasParent(hasParent bool) ListWorkflowsOption
```

Filter workflows by whether they have a parent workflow (true) or not (false).

#### WithFilterIsDebounced

```go
func WithFilterIsDebounced(isDebounced bool) ListWorkflowsOption
```

Filter workflows by whether they are pending [debounced](./queues.md#debouncer) invocations (true) or not (false).

#### WithFilterScheduleName

```go
func WithFilterScheduleName(scheduleName ...string) ListWorkflowsOption
```

Filter workflows by the name(s) of the [schedule](#workflow-schedules) that enqueued them.
Only workflows enqueued by a named schedule match.

### GetWorkflowSteps

```go
func GetWorkflowSteps(ctx Client, workflowID string, opts ...GetWorkflowStepsOption) ([]StepInfo, error)
```

GetWorkflowSteps retrieves the execution steps of a workflow.
This is a list of `StepInfo` objects, with the following structure:

```go
type StepInfo struct {
    StepID          int       // The sequential ID of the step within the workflow
    StepName        string    // The name of the step function
    Output          any       // The output returned by the step (if any)
    Error           error     // The error returned by the step (if any)
    ChildWorkflowID string    // If the step starts or retrieves the result of a workflow, its ID
    StartedAt       time.Time // When the step execution started
    CompletedAt     time.Time // When the step execution completed
}
```

**Parameters:**
- **ctx**: The DBOS client or context.
- **workflowID**: The ID of the workflow whose steps to retrieve.
- **opts**: Optional configuration, documented below.

#### WithStepsLoadOutput

```go
func WithStepsLoadOutput(loadOutput bool) GetWorkflowStepsOption
```

Control whether to load step output data.
When unset, output is loaded only if the DBOS context has been launched.

#### WithStepsLimit

```go
func WithStepsLimit(limit int) GetWorkflowStepsOption
```

Limit the number of steps returned, ordered by step ID ascending.

#### WithStepsOffset

```go
func WithStepsOffset(offset int) GetWorkflowStepsOption
```

Skip the given number of steps before returning results. Combine with `WithStepsLimit` to paginate through a workflow's steps.

### GetWorkflowAggregates

```go
func GetWorkflowAggregates(ctx Client, input GetWorkflowAggregatesInput) ([]WorkflowAggregateRow, error)
```

Return aggregates of workflows grouped by one or more columns and/or by `created_at` time bucket.
At least one `GroupBy*` flag must be set, or `TimeBucketSize` must be greater than zero.
At least one `Select*` flag must be set.
Filter fields narrow which workflows are aggregated before grouping.

```go
type GetWorkflowAggregatesInput struct {
    GroupByStatus             bool
    GroupByName               bool
    GroupByQueueName          bool
    GroupByExecutorID         bool
    GroupByApplicationVersion bool
    GroupByApplicationName    bool

    // Select* flags choose which aggregates to compute. At least one must be true.
    SelectCount             bool
    SelectMinCreatedAt      bool
    SelectMaxQueueWaitMs    bool
    SelectMaxTotalLatencyMs bool

    // When non-zero, groups results by created_at time bucket of this size.
    TimeBucketSize time.Duration

    // Filters
    Status             []WorkflowStatusType
    StartTime          time.Time
    EndTime            time.Time
    CompletedAfter     time.Time
    CompletedBefore    time.Time
    DequeuedAfter      time.Time
    DequeuedBefore     time.Time
    Name               []string
    ApplicationVersion []string
    ExecutorID         []string
    QueueName          []string
    WorkflowIDPrefix   []string
    WorkflowIDs        []string
    AuthenticatedUser  []string
    ForkedFrom         []string
    ParentWorkflowID   []string
    ApplicationName    []string
    WasForkedFrom      *bool
    HasParent          *bool
    Attributes         map[string]any
}
```

The result is one [`WorkflowAggregateRow`](#workflowaggregaterow) per non-empty group.
The `Group` map contains an entry per enabled grouping column (`"status"`, `"name"`, `"queue_name"`, `"executor_id"`, `"application_version"`, `"application_name"`, `"time_bucket"`).
Like [`ListWorkflows`](#listworkflows), when the `ApplicationName` filter is unset, only workflows owned by the calling context's application (plus workflows owned by no application) are aggregated.
`Count`, `MinCreatedAt`, `MaxQueueWaitMs`, and `MaxTotalLatencyMs` are populated only for the corresponding enabled `Select*` flag.

**Parameters:**
- **ctx**: The DBOS client or context.
- **input**: A `GetWorkflowAggregatesInput` describing the grouping columns, aggregates, time bucket, and filters.

**Example:**

```go
rows, err := dbos.GetWorkflowAggregates(ctx, dbos.GetWorkflowAggregatesInput{
    GroupByStatus: true,
    SelectCount:   true,
    StartTime:     time.Now().Add(-24 * time.Hour),
})
if err != nil {
    log.Fatal(err)
}
for _, r := range rows {
    fmt.Printf("status=%s count=%d\n", *r.Group["status"], *r.Count)
}
```

#### WorkflowAggregateRow

```go
type WorkflowAggregateRow struct {
    Group             map[string]*string // One entry per enabled grouping column; nil values represent NULL
    Count             *int64             // Number of workflows in this group (nil if SelectCount is false)
    MinCreatedAt      *int64             // Earliest created_at in this group, as an epoch-ms timestamp (nil if SelectMinCreatedAt is false)
    MaxQueueWaitMs    *int64             // Max time workflows in this group spent enqueued, in milliseconds (nil if SelectMaxQueueWaitMs is false)
    MaxTotalLatencyMs *int64             // Max total latency in this group, in milliseconds (nil if SelectMaxTotalLatencyMs is false)
}
```

### GetStepAggregates

```go
func GetStepAggregates(ctx Client, input GetStepAggregatesInput) ([]StepAggregateRow, error)
```

Return aggregate counts and/or max durations of steps grouped by function name and/or status, optionally bucketed by `completed_at` time.
At least one `GroupBy*` flag must be set, or `TimeBucketSize` must be greater than zero.
At least one `Select*` flag must be set.
Step status is derived from the step's recorded outcome: steps with no recorded error are `SUCCESS`, otherwise `ERROR`.

```go
type GetStepAggregatesInput struct {
    GroupByFunctionName bool
    GroupByStatus       bool

    SelectCount         bool
    SelectMaxDurationMs bool

    // When non-zero, groups results by completed_at time bucket of this size.
    TimeBucketSize time.Duration

    // Filters
    Status           []string
    FunctionName     []string
    WorkflowIDPrefix []string
    CompletedAfter   time.Time
    CompletedBefore  time.Time
    ApplicationName  []string
}
```

The result is one [`StepAggregateRow`](#stepaggregaterow) per non-empty group.
The `Group` map contains an entry per enabled grouping column (`"function_name"`, `"status"`, `"time_bucket"`).
Like [`ListWorkflows`](#listworkflows), when the `ApplicationName` filter is unset, only steps owned by the calling context's application (plus steps owned by no application) are aggregated.
`Count` and `MaxDurationMs` are populated only for the corresponding enabled `Select*` flag.

**Parameters:**
- **ctx**: The DBOS client or context.
- **input**: A `GetStepAggregatesInput` describing the grouping columns, aggregates, time bucket, and filters.

**Example:**

```go
rows, err := dbos.GetStepAggregates(ctx, dbos.GetStepAggregatesInput{
    GroupByFunctionName: true,
    SelectCount:         true,
    SelectMaxDurationMs: true,
    CompletedAfter:      time.Now().Add(-24 * time.Hour),
})
if err != nil {
    log.Fatal(err)
}
for _, r := range rows {
    fmt.Printf("step=%s count=%d max_duration_ms=%d\n", *r.Group["function_name"], *r.Count, *r.MaxDurationMs)
}
```

#### StepAggregateRow

```go
type StepAggregateRow struct {
    Group         map[string]*string // One entry per enabled grouping column; nil values represent NULL
    Count         *int64             // Number of steps in this group (nil if SelectCount is false)
    MaxDurationMs *int64             // Max step duration in this group (nil if SelectMaxDurationMs is false)
}
```

### CancelWorkflow

```go
func CancelWorkflow(ctx Client, workflowID string, opts ...CancelWorkflowOption) error
```

Cancel a workflow. This sets its status to `CANCELLED` and removes it from its queue (if it is enqueued).
A running execution is not interrupted mid-step: it stops at the start of its next durable operation (step, sleep, `Send`/`Recv`, child workflow, …), which returns an error matching `dbos.ErrWorkflowCancelled`.

You can also cancel a running workflow directly by cancelling its context: start it under [`WithCancel`](./dbos-context.md#withcancel) (or [`WithTimeout`](./dbos-context.md#withtimeout)) and call the returned cancel function.
Calling this cancel function will trigger a durable cancel and enable cooperative cancellation: an executing step receives the cancellation through its `context.Context` and can select on `ctx.Done()` to return early instead of running to completion.

See [cancellation behavior](../tutorials/workflow-management.md#cancelling-workflows) for how cancellation interacts with executing steps, durable sleeps, and awaiting workflows.

**Parameters:**
- **ctx**: The DBOS client or context.
- **workflowID**: The ID of the workflow to cancel.
- **opts**: Optional configuration, documented below.

#### WithCancelChildren

```go
func WithCancelChildren() CancelWorkflowOption
```

Also cancel all the workflow's child workflows, recursively.

```go
err := dbos.CancelWorkflow(ctx, workflowID, dbos.WithCancelChildren())
```

### CancelWorkflows

```go
func CancelWorkflows(ctx Client, workflowIDs []string, opts ...CancelWorkflowOption) error
```

Cancel multiple workflows in a single database round-trip.
Each workflow that exists and is not already in a terminal state (`SUCCESS`, `ERROR`, `CANCELLED`) is moved to `CANCELLED` and removed from its queue.
Unlike [`CancelWorkflow`](#cancelworkflow), this function does not return an error when some IDs are missing.

Accepts the same options as [`CancelWorkflow`](#cancelworkflow) (e.g., [`WithCancelChildren`](#withcancelchildren)).

**Parameters:**
- **ctx**: The DBOS client or context.
- **workflowIDs**: The IDs of the workflows to cancel.
- **opts**: Optional configuration.

### ResumeWorkflow

```go
func ResumeWorkflow[R any](ctx Client, workflowID string, opts ...ResumeWorkflowOption) (WorkflowHandle[R], error)
```

Resume a workflow. This immediately starts it from its last completed step. You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts. You can also use this to start an enqueued workflow immediately, bypassing its queue.

**Parameters:**
- **ctx**: The DBOS client or context.
- **workflowID**: The ID of the workflow to resume.
- **opts**: Optional configuration, documented below.

#### WithResumeQueue

```go
func WithResumeQueue(queueName string) ResumeWorkflowOption
```

Re-enqueue the resumed workflow on the specified queue instead of starting it immediately.

### ResumeWorkflows

```go
func ResumeWorkflows[R any](ctx Client, workflowIDs []string, opts ...ResumeWorkflowOption) ([]WorkflowHandle[R], error)
```

Resume multiple workflows in a single database round-trip.
Each workflow that exists and is not in a terminal state is re-enqueued; completed or missing workflows are skipped.
Unlike [`ResumeWorkflow`](#resumeworkflow), this function does not return an error when some IDs are missing.

Accepts the same options as [`ResumeWorkflow`](#resumeworkflow) (e.g., [`WithResumeQueue`](#withresumequeue)).

**Parameters:**
- **ctx**: The DBOS client or context.
- **workflowIDs**: The IDs of the workflows to resume.
- **opts**: Optional configuration.

### ForkWorkflow

```go
func ForkWorkflow[R any](ctx Client, input ForkWorkflowInput) (WorkflowHandle[R], error)
```

Start a new execution of a workflow from a specific step. The input step ID (`startStep`) must match the step number of the step returned by workflow introspection. The specified `startStep` is the step from which the new workflow will start, so any steps whose ID is less than `startStep` will not be re-executed.

**Parameters:**
- **ctx**: The DBOS client or context.
- **input**: A `ForkWorkflowInput` struct where `OriginalWorkflowID` is mandatory.

```go
type ForkWorkflowInput struct {
    OriginalWorkflowID  string            // Required: The UUID of the original workflow to fork from
    ForkedWorkflowID    string            // Optional: Custom workflow ID for the forked workflow (auto-generated if empty)
    StartStep           uint              // Optional: Step to start the forked workflow from (default: 0)
    ApplicationVersion  string            // Optional: Application version for the forked workflow (inherits from original if empty)
    QueueName           string            // Optional: Queue to enqueue the forked workflow on (defaults to starting immediately)
    QueuePartitionKey   string            // Optional: Partition key when enqueueing onto a partitioned queue (requires QueueName)
    Timeout             time.Duration     // Optional: Maximum execution time for the forked workflow (default: no timeout)
    ReplacementChildren map[string]string // Optional: Maps original child workflow IDs to replacement child workflow IDs
}
```

If `QueueName` is set, the forked workflow is enqueued on the specified queue instead of starting immediately.
Set `QueuePartitionKey` together with `QueueName` to enqueue the forked workflow onto a specific partition of a [partitioned queue](../tutorials/queue-tutorial.md#partitioning-queues).

If `Timeout` is set, the forked workflow is cancelled if it runs longer than that duration; the clock starts when the fork begins executing (when it is dequeued, if enqueued).
The original workflow's timeout is not inherited.

If `ReplacementChildren` is set, it maps original child workflow IDs to replacement child workflow IDs.
When the forked workflow encounters a copied step that started a child workflow matching an original ID, it substitutes the replacement ID instead.
This is useful when you need to fork a parent workflow that depends on the results of child workflows that have also been forked:

```go
// Fork the child first, then fork the parent so its checkpoints point at the new child.
childHandle, err := dbos.ForkWorkflow[ChildResult](ctx, dbos.ForkWorkflowInput{
    OriginalWorkflowID: "old-child-id",
    ForkedWorkflowID:   "new-child-id",
    StartStep:          2,
})
parentHandle, err := dbos.ForkWorkflow[ParentResult](ctx, dbos.ForkWorkflowInput{
    OriginalWorkflowID:  "parent-workflow-id",
    StartStep:           6,
    ReplacementChildren: map[string]string{"old-child-id": "new-child-id"},
})
```

### ForkWorkflows

```go
func ForkWorkflows[R any](ctx Client, input ForkWorkflowsInput) ([]WorkflowHandle[R], error)
```

Fork a batch of workflows in a single database round-trip.
Each forked workflow gets a new UUID (unless a custom `ForkedWorkflowID` is provided) and executes from its specified `StartStep`, reusing the operation outputs of steps `0` to `StartStep-1` copied from the original workflow.
The returned handles are in the same order as `input.Workflows`.

**Parameters:**
- **ctx**: The DBOS client or context.
- **input**: A `ForkWorkflowsInput` struct where `Workflows` is mandatory.

```go
type ForkWorkflowsInput struct {
    Workflows           []ForkWorkflowSpec // Required: The workflows to fork
    ApplicationVersion  string             // Optional: Application version for the forked workflows (inherits from originals if empty)
    QueueName           string             // Optional: Queue to enqueue the forked workflows on (defaults to the internal queue)
    QueuePartitionKey   string             // Optional: Partition key when enqueueing the forked workflows onto a partitioned queue
    Timeout             time.Duration      // Optional: Maximum execution time for each forked workflow (default: no timeout)
    ReplacementChildren map[string]string  // Optional: Maps original child workflow IDs to replacement child workflow IDs
}

type ForkWorkflowSpec struct {
    OriginalWorkflowID string // Required: The UUID of the original workflow to fork from
    ForkedWorkflowID   string // Optional: Custom workflow ID for the forked workflow (auto-generated if empty)
    StartStep          uint   // Optional: Step to start the forked workflow from (default: 0)
}
```

The `ApplicationVersion`, `QueueName`, `QueuePartitionKey`, `Timeout`, and `ReplacementChildren` settings apply to every forked workflow in the batch; they have the same meaning as in [`ForkWorkflow`](#forkworkflow).

**Example:**

```go
handles, err := dbos.ForkWorkflows[any](ctx, dbos.ForkWorkflowsInput{
    Workflows: []dbos.ForkWorkflowSpec{
        {OriginalWorkflowID: "wf-1", StartStep: 2},
        {OriginalWorkflowID: "wf-2"},
    },
    QueueName: "fork_queue",
})
```

### SetWorkflowDelay

```go
func SetWorkflowDelay(ctx Client, workflowID string, opts ...SetWorkflowDelayOption) error
```

Set or update the delay on a [`DELAYED`](#workflowstatustype) workflow.
Provide exactly one of [`WithDelayDuration`](#withdelayduration) (relative) or [`WithDelayUntil`](#withdelayuntil) (absolute).
Only affects workflows currently in the `DELAYED` status.

**Parameters:**
- **ctx**: The DBOS client or context.
- **workflowID**: The ID of the workflow whose delay to update.
- **opts**: Exactly one of `WithDelayDuration` or `WithDelayUntil`.

**Example:**

```go
// Shorten the delay to 10 seconds from now
err := dbos.SetWorkflowDelay(ctx, workflowID, dbos.WithDelayDuration(10*time.Second))

// Or set an absolute deadline
err = dbos.SetWorkflowDelay(ctx, workflowID, dbos.WithDelayUntil(time.Now().Add(time.Hour)))
```

#### WithDelayDuration

```go
func WithDelayDuration(d time.Duration) SetWorkflowDelayOption
```

Set a relative delay measured from now.

#### WithDelayUntil

```go
func WithDelayUntil(t time.Time) SetWorkflowDelayOption
```

Set an absolute time until which the workflow should remain delayed.

### SetWorkflowAttributes

```go
func SetWorkflowAttributes(ctx Client, workflowID string, attributes map[string]any) error
```

Replace the custom [attributes](./workflows-steps.md#withworkflowattributes) attached to an existing workflow.
Pass a `nil` attributes map to clear all attributes.
Attributes must be JSON-serializable.
Returns an error if the workflow does not exist.

**Example:**

```go
err := dbos.SetWorkflowAttributes(ctx, "my-workflow-id", map[string]any{"customer": "acme"})
```

### DeleteWorkflows

```go
func DeleteWorkflows(ctx Client, workflowIDs []string, opts ...DeleteWorkflowOption) error
```

Permanently delete one or more workflows and all their associated data (status, step outputs, events, messages, and streams) from the system database, regardless of their current status, including active (`PENDING`, `ENQUEUED`) workflows.

:::warning
This operation is irreversible.
:::

**Parameters:**
- **ctx**: The DBOS client or context.
- **workflowIDs**: The IDs of the workflows to delete.
- **opts**: Optional configuration, documented below.

#### WithDeleteChildren

```go
func WithDeleteChildren() DeleteWorkflowOption
```

Also delete all child workflows, recursively.

```go
err := dbos.DeleteWorkflows(ctx, []string{"wf-1", "wf-2"}, dbos.WithDeleteChildren())
```

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```go
type WorkflowStatus struct {
    ID                 string             `json:"workflow_uuid"`        // Unique identifier for the workflow
    Status             WorkflowStatusType `json:"status"`               // Current execution status
    Name               string             `json:"name"`                 // Function name of the workflow
    AuthenticatedUser  string             `json:"authenticated_user"`   // User who initiated the workflow (if applicable)
    AssumedRole        string             `json:"assumed_role"`         // Role assumed during execution (if applicable)
    AuthenticatedRoles []string           `json:"authenticated_roles"`  // Roles available to the user (if applicable)
    Output             any                `json:"output"`               // Workflow output (available after completion)
    Error              error              `json:"error"`                // Error information (if status is ERROR)
    ExecutorID         string             `json:"executor_id"`          // ID of the executor running this workflow
    CreatedAt          time.Time          `json:"created_at"`           // When the workflow was created
    UpdatedAt          time.Time          `json:"updated_at"`           // When the workflow status was last updated
    ApplicationVersion string             `json:"application_version"`  // Version of the application that created this workflow
    ApplicationID      string             `json:"application_id"`       // Application identifier
    ApplicationName    string             `json:"application_name"`     // Owning application; empty if the workflow is owned by no application
    Attempts           int                `json:"attempts"`             // Number of execution attempts
    QueueName          string             `json:"queue_name"`           // Queue name (if workflow was enqueued)
    Timeout            time.Duration      `json:"-"`                    // Workflow timeout duration; rendered as timeout_ms (integer milliseconds) in JSON
    Deadline           time.Time          `json:"deadline"`             // Absolute deadline for workflow completion
    StartedAt          time.Time          `json:"started_at"`           // When the workflow execution actually started
    CompletedAt        time.Time          `json:"completed_at"`         // When the workflow reached a terminal state (SUCCESS, ERROR, or CANCELLED)
    ForkedFrom         string             `json:"forked_from"`          // ID of the original workflow if this is a fork
    WasForkedFrom      bool               `json:"was_forked_from"`      // Whether this workflow has been forked from
    ParentWorkflowID   string             `json:"parent_workflow_id"`   // ID of the parent workflow if this is a child
    DeduplicationID    string             `json:"deduplication_id"`     // Queue deduplication identifier (if applicable)
    Input              any                `json:"input"`                // Input parameters passed to the workflow
    Priority           int                `json:"priority"`             // Execution priority (lower numbers have higher priority)
    QueuePartitionKey  string             `json:"queue_partition_key"`  // Queue partition key for partitioned queues
    ClassName          string             `json:"class_name"`           // Class/namespace name for cross-language dispatch
    ConfigName         *string            `json:"config_name"`          // Instance/config name for cross-language dispatch
    Serialization      string             `json:"serialization"`        // Serialization format used for inputs/outputs (e.g., "portable_json")
    DelayUntil         time.Time          `json:"delay_until"`          // Time before which a DELAYED workflow should not be dequeued
    Attributes         map[string]any     `json:"attributes"`           // Custom key-value attributes attached to the workflow
    ScheduleName       string             `json:"schedule_name"`        // Name of the schedule that enqueued this workflow (if any)
    DebounceDeadline   time.Time          `json:"debounce_deadline"`    // Absolute cap beyond which debounce calls may not extend the delay
    IsDebounced        bool               `json:"is_debounced"`         // Whether this workflow was created by a debouncer
}
```

#### WorkflowStatusType

The `WorkflowStatusType` represents the execution status of a workflow:

```go
type WorkflowStatusType string

const (
    WorkflowStatusPending                     WorkflowStatusType = "PENDING"                        // Workflow is running or ready to run
    WorkflowStatusEnqueued                    WorkflowStatusType = "ENQUEUED"                       // Workflow is queued and waiting for execution
    WorkflowStatusDelayed                     WorkflowStatusType = "DELAYED"                        // Workflow is delayed and will transition to ENQUEUED after the delay expires
    WorkflowStatusSuccess                     WorkflowStatusType = "SUCCESS"                        // Workflow completed successfully
    WorkflowStatusError                       WorkflowStatusType = "ERROR"                          // Workflow completed with an error
    WorkflowStatusCancelled                   WorkflowStatusType = "CANCELLED"                      // Workflow was cancelled (manually or due to timeout)
    WorkflowStatusMaxRecoveryAttemptsExceeded WorkflowStatusType = "MAX_RECOVERY_ATTEMPTS_EXCEEDED" // Workflow exceeded maximum retry attempts
)
```

## Workflow Schedules

DBOS lets you schedule workflows to run on a cron expression.
Schedules are stored in the database and can be created, paused, resumed, and deleted at runtime.
See the [scheduled workflows tutorial](../tutorials/scheduled-workflows.md) for an overview.

Scheduled workflows must accept a [`ScheduledWorkflowInput`](#scheduledworkflowinput) as their input parameter.

### ScheduledWorkflowInput

```go
type ScheduledWorkflowInput struct {
    ScheduledTime time.Time       // The cron tick time
    Context       json.RawMessage // The user-defined context attached to the schedule, as raw JSON (nil if none)
}
```

The input type of a scheduled workflow function. `Context` carries the value set as [`ScheduleSpec.Context`](#schedulespec) when the schedule was created, as raw JSON; decode it with [`DecodeScheduleContext`](#decodeschedulecontext).

### DecodeScheduleContext

```go
func DecodeScheduleContext[T any](input ScheduledWorkflowInput) (T, error)
```

Decode the schedule's user-defined context carried by a `ScheduledWorkflowInput` into `T` — typically the same type that was set as `ScheduleSpec.Context` when the schedule was created.
Returns the zero value of `T` if the schedule has no context.

```go
type ReportConfig struct {
    Region    string `json:"region"`
    BatchSize int    `json:"batch_size"`
}

func reportWorkflow(ctx dbos.Context, input dbos.ScheduledWorkflowInput) (any, error) {
    cfg, err := dbos.DecodeScheduleContext[ReportConfig](input)
    // ...
}
```

### WorkflowSchedule

```go
type WorkflowSchedule struct {
    ScheduleID        string          // Unique ID assigned to this schedule revision
    ScheduleName      string          // User-supplied unique name
    WorkflowName      string          // Fully-qualified or custom name of the workflow
    WorkflowClassName string          // Class/namespace (used for cross-language dispatch)
    Schedule          string          // Cron expression
    Status            ScheduleStatus  // ACTIVE or PAUSED
    Context           json.RawMessage // User-defined context attached to the schedule, as raw JSON
    LastFiredAt       *time.Time      // Last time the schedule fired (nil if never)
    AutomaticBackfill bool            // Whether to backfill missed ticks on application start
    CronTimezone      string          // IANA timezone name (empty for UTC)
    QueueName         string          // Queue on which scheduled workflows are enqueued
    ApplicationName   string          // Owning application; empty if the schedule is owned by no application
}
```

#### ScheduleStatus

```go
type ScheduleStatus string

const (
    ScheduleStatusActive ScheduleStatus = "ACTIVE" // Schedule is firing
    ScheduleStatusPaused ScheduleStatus = "PAUSED" // Schedule is paused
)
```

### ScheduleSpec

Schedules are described by a `ScheduleSpec`:

```go
type ScheduleSpec struct {
    ScheduleName      string // Required: unique name of the schedule
    Schedule          string // Required: cron expression driving the schedule
    WorkflowName      string // Name of the target workflow (required unless Workflow is set)
    Workflow          any    // Registered scheduled workflow function (Context only; takes precedence over WorkflowName)
    WorkflowClassName string // Optional class/namespace name for cross-language dispatch
    Context           any    // Optional user-defined context (serialized as JSON) passed to each scheduled invocation; decode with DecodeScheduleContext
    AutomaticBackfill bool   // Backfill missed ticks when the schedule is reloaded after downtime
    CronTimezone      string // Optional IANA timezone used to interpret the cron expression
    QueueName         string // Optional queue to route scheduled invocations to (defaults to the internal queue)
    ApplicationName   string // Optional application that owns the schedule and runs its workflows (defaults to the caller's application)
}
```

Field notes:

- **Workflow vs. WorkflowName**: from a `Context`, set `Workflow` to a scheduled workflow function already registered via [`RegisterWorkflow`](./workflows-steps.md#registerworkflow). From a [standalone client](./dbos-context.md#newclient) (or to target a workflow owned by another process or language), set `WorkflowName` instead. If both are set, `Workflow` wins.
- **WorkflowClassName**: set when the target workflow is owned by a runtime that dispatches by class name (e.g. a Python class-based workflow).
- **Context**: an arbitrary value serialized as JSON and passed to each scheduled invocation as [`ScheduledWorkflowInput.Context`](#scheduledworkflowinput); decode it in the workflow with [`DecodeScheduleContext`](#decodeschedulecontext).
- **AutomaticBackfill**: backfill missed ticks whenever the schedule is reloaded after downtime, or when a paused schedule is resumed. Missed ticks are computed with the schedule's **current** cron expression, over the window from the last fire to now. If you change a schedule's cron expression (e.g. with [`ApplySchedules`](#applyschedules)) while it is not running, the backfill generates one execution per tick of the *new* expression across that entire window—including times the old expression would never have matched.
- **CronTimezone**: an [IANA timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) name (e.g. `"America/New_York"`) in which to interpret the cron expression. Defaults to UTC.
- **QueueName**: route each scheduled invocation to the named [queue](./queues.md) instead of the default internal queue.
- **ApplicationName**: the application that owns this schedule and runs its workflows. Defaults to the creating context's own application (for a [standalone client](./dbos-context.md#newclient), its `AppName`). Always set an application name either here or in the client's configuration if multiple applications [share a system database](../../explanations/sharing-a-system-database.md).

The workflow function must conform to:

```go
type ScheduledWorkflowFunc func(ctx Context, input ScheduledWorkflowInput) (any, error)
```

### CreateSchedule

```go
func CreateSchedule(ctx Client, spec ScheduleSpec) error
```

Create a new schedule.
Fails if a schedule with the same name already exists.
The reconciler loop picks the new schedule up on its next tick and installs it in the cron scheduler.

**Parameters:**
- **ctx**: The DBOS client or context.
- **spec**: A [`ScheduleSpec`](#schedulespec) describing the schedule.

**Example:**

```go
// From a Context, with a registered workflow function:
err := dbos.CreateSchedule(ctx, dbos.ScheduleSpec{
    ScheduleName:      "my-schedule",
    Workflow:          myPeriodicTask,
    Schedule:          "0 */5 * * * *",
    Context:           "my context",
    AutomaticBackfill: true,
})

// From a standalone client, by workflow name:
err = dbos.CreateSchedule(client, dbos.ScheduleSpec{
    ScheduleName: "my-schedule",
    WorkflowName: "myPeriodicTask",
    Schedule:     "0 */5 * * * *",
})
```

### ApplySchedules

```go
func ApplySchedules(ctx Client, schedules []ScheduleSpec) error
```

Atomically create or update a list of schedules in a single transaction.
Existing schedules are upserted by name: all definition fields (workflow name and class, cron expression, context, timezone, queue, and backfill flag) are replaced with the new entry's values, while the schedule's ID, status, and last-fired time are preserved.
Useful for defining a fixed set of static schedules on application start.

`ApplySchedules` cannot be called from within a workflow.

:::warning
Because every definition field is replaced, omitting an optional field on re-apply clears it.
In particular, a schedule previously routed to a named queue reverts to the internal queue if the new entry does not set `QueueName`.
:::

**Example:**

```go
err := dbos.ApplySchedules(ctx, []dbos.ScheduleSpec{
    {ScheduleName: "a", Workflow: workflowA, Schedule: "0 */10 * * * *"},
    {ScheduleName: "b", Workflow: workflowB, Schedule: "0 0 0 * * *"},
})
```

### GetSchedule

```go
func GetSchedule(ctx Client, scheduleName string) (WorkflowSchedule, error)
```

Retrieve a [`WorkflowSchedule`](#workflowschedule) by name. If no schedule with that name exists, the returned error matches `dbos.ErrScheduleNotFound`.

### ListSchedules

```go
func ListSchedules(ctx Client, opts ...ListSchedulesOption) ([]WorkflowSchedule, error)
```

List schedules, optionally filtered.
By default, only schedules owned by the calling context's application (plus schedules owned by no application) are listed; a [standalone client](./dbos-context.md#newclient) with no `AppName` lists every application's schedules.

#### WithScheduleStatuses

```go
func WithScheduleStatuses(statuses ...ScheduleStatus) ListSchedulesOption
```

Filter by one or more [`ScheduleStatus`](#schedulestatus) values.

#### WithScheduleWorkflowNames

```go
func WithScheduleWorkflowNames(names ...string) ListSchedulesOption
```

Filter by workflow name(s). Use the fully qualified name or the custom name registered via [`WithWorkflowName`](./workflows-steps.md#withworkflowname).

#### WithScheduleNamePrefixes

```go
func WithScheduleNamePrefixes(prefixes ...string) ListSchedulesOption
```

Filter by schedule name prefix(es).

#### WithScheduleNames

```go
func WithScheduleNames(names ...string) ListSchedulesOption
```

Filter by exact schedule name(s).

#### WithScheduleApplicationNames

```go
func WithScheduleApplicationNames(names ...string) ListSchedulesOption
```

List schedules owned by these applications (schedules owned by no application are always included).

### PauseSchedule

```go
func PauseSchedule(ctx Client, scheduleName string) error
```

Pause a schedule so it stops firing. The schedule's cron entry is removed on the next reconciler tick.

### ResumeSchedule

```go
func ResumeSchedule(ctx Client, scheduleName string) error
```

Resume a paused schedule. If the schedule was created with `AutomaticBackfill: true` (see [`ScheduleSpec`](#schedulespec)), missed ticks during the pause are backfilled.

### DeleteSchedule

```go
func DeleteSchedule(ctx Client, scheduleName string) error
```

Delete a schedule. The schedule's cron entry is removed on the next reconciler tick.

### BackfillSchedule

```go
func BackfillSchedule(ctx Client, scheduleName string, start, end time.Time) ([]string, error)
```

Backfill missed executions for the range `[start, end]`, returning the IDs of the enqueued workflows.
Already-executed ticks are automatically skipped, so it is safe to overlap ranges.
Cannot be called from within a workflow.

**Example:**

```go
ids, err := dbos.BackfillSchedule(ctx, "my-schedule",
    time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
    time.Date(2025, 1, 2, 0, 0, 0, 0, time.UTC),
)
```

### TriggerSchedule

```go
func TriggerSchedule[R any](ctx Client, scheduleName string) (WorkflowHandle[R], error)
```

Trigger a schedule to fire immediately and return a [`WorkflowHandle`](./workflows-steps.md#workflowhandle) for the enqueued workflow.
The generic `TriggerSchedule` returns a typed handle whose `GetResult` decodes the triggered workflow's output into type `R`.
Cannot be called from within a workflow.

## Application Versions

DBOS tracks each application version that has launched against the system database.
You can use these methods to inspect the registered versions and control which one is treated as latest&mdash;for example, to recover workflows onto a specific version after a rollout.

Versions are tracked per application: if multiple applications [share a system database](../../explanations/sharing-a-system-database.md), these methods only see versions registered by the calling handle's application (plus versions owned by no application), so one application's deployments do not affect which version its peers consider latest.
A [standalone client](./dbos-context.md#newclient) with no `AppName` sees every application's versions.

### VersionInfo

```go
type VersionInfo struct {
    ID              string // Internal version ID
    Name            string // Application version name
    Timestamp       int64  // Epoch milliseconds; the most recent timestamp identifies the latest version
    CreatedAt       int64  // Epoch milliseconds at which the version was first registered
    ApplicationName string // Owning application; empty if the version is owned by no application
}
```

### ListApplicationVersions

```go
func ListApplicationVersions(ctx Client) ([]VersionInfo, error)
```

Return every application version registered in the system database, ordered by timestamp (newest first).

**Parameters:**
- **ctx**: The DBOS client or context.

### GetLatestApplicationVersion

```go
func GetLatestApplicationVersion(ctx Client) (VersionInfo, error)
```

Return the application version with the most recent timestamp.
If no versions are registered, the returned error matches `dbos.ErrNoApplicationVersions`.

**Parameters:**
- **ctx**: The DBOS client or context.

### SetLatestApplicationVersion

```go
func SetLatestApplicationVersion(ctx Client, versionName string) error
```

Mark the named application version as latest by updating its timestamp to the current time.
Promoting a version registered by a different application returns an error.

**Parameters:**
- **ctx**: The DBOS client or context.
- **versionName**: The name of the registered application version to mark as latest.

## Application Rename

### RenameApplication

```go
func RenameApplication(ctx Client, input RenameApplicationInput) (ApplicationRowCounts, error)
```

```go
type RenameApplicationInput struct {
    OldName            string // The application's previous name. Empty moves nothing but the unclaimed rows, so it requires AdoptUnclaimedRows.
    NewName            string // The application that ends up owning the rows. Required.
    BatchSize          int    // Completed workflows and steps re-owned per transaction. Zero defaults to DefaultRenameBatchSize (10,000).
    AdoptUnclaimedRows bool   // Also transfer rows no application owns.
}

type ApplicationRowCounts struct {
    Queues    int64 `json:"queues"`
    Schedules int64 `json:"schedules"`
    Versions  int64 `json:"versions"`
    Workflows int64 `json:"workflows"`
    Steps     int64 `json:"steps"`
}
```

Every workflow, step, queue, schedule, and application version is owned by the application (identified by its configured [`AppName`](./configuration.md)) that created it.
After renaming an application, use this method (or the `dbos rename-application` [CLI command](./cli.md)) to transfer everything owned by the old name to the new name.
Returns the number of rows transferred, by table.

Queues, schedules, versions, and in-flight workflows are transferred in a single transaction; completed workflows and their steps are then transferred in batches of `BatchSize`.
The operation is idempotent: if interrupted, running it again resumes where it left off.

Set `AdoptUnclaimedRows` to also transfer rows owned by no application, such as rows created before upgrading to a DBOS version supporting application ownership.

:::warning
Stop the application being renamed before running this.
A running application would race the rename, creating new work under its old name.
:::

## DBOS Variables

### GetWorkflowID

```go
func GetWorkflowID(ctx Context) (string, error)
```

Return the ID of the current workflow, if in a workflow. Returns an error if not called from within a workflow context.

**Parameters:**
- **ctx**: The DBOS context.

### GetStepID

```go
func GetStepID(ctx Context) (int, error)
```

Return the current value of the step counter within a workflow (the ID of the most recently started step). Returns an error if not called from within a workflow context.

**Parameters:**
- **ctx**: The DBOS context.

## Portable Serialization Options and Types

These options enable [cross-language interoperability](../../explanations/portable-workflows.md) by using the portable JSON serialization format.

### WithPortableSend

```go
func WithPortableSend() SendOption
```

Configure [`Send`](#send) to use the portable JSON serializer, enabling cross-language message passing.

### WithPortableSetEvent

```go
func WithPortableSetEvent() SetEventOption
```

Configure [`SetEvent`](#setevent) to use the portable JSON serializer, enabling cross-language event consumption.

### WithPortableWriteStream

```go
func WithPortableWriteStream() WriteStreamOption
```

Configure [`WriteStream`](#writestream) to use the portable JSON serializer, enabling cross-language stream reading.

### WithReadStreamSnapshot

```go
func WithReadStreamSnapshot() ReadStreamOption
```

Configure [`ReadStream`](#readstream) to return as soon as all currently-available values have been drained, instead of blocking until the stream is closed or the workflow becomes inactive.

### WithReadStreamFromOffset

```go
func WithReadStreamFromOffset(offset int) ReadStreamOption
```

Configure [`ReadStream`](#readstream) to start reading from the given base offset (zero-indexed). Combined with [`WithReadStreamSnapshot`](#withreadstreamsnapshot), this allows you to poll a stream incrementally.

### PortableWorkflowError

```go
type PortableWorkflowError struct {
    Name    string // The error type/class name
    Message string // Human-readable error message
    Code    any    // Optional application-specific error code
    Data    any    // Optional structured error details
}
```

A structured error type for workflows using portable serialization.
Portable workflows automatically serialize errors in this format.

```go
return nil, &dbos.PortableWorkflowError{
    Name:    "ValidationError",
    Message: "invalid input",
    Code:    400,
}
```

### PortableWorkflowArgs

```go
type PortableWorkflowArgs struct {
    PositionalArgs []any          `json:"positionalArgs"`
    NamedArgs      map[string]any `json:"namedArgs"`
}
```

The cross-language envelope for workflow inputs.
When passed as the input to [`Enqueue`](#enqueue), portable JSON serialization is used automatically.
Further, a portable workflow ran with [`RunWorkflow`](workflows-steps.md#runworkflow) will serialize its input in this format automatically.

```go
args := dbos.PortableWorkflowArgs{
    PositionalArgs: []any{"order-123", 42},
}
handle, err := dbos.Enqueue[any](
    client, "queue", "target_workflow", args,
)
```

## Alerting

### SetAlertHandler

```go
func SetAlertHandler(ctx Context, handler AlertHandler)
```

```go
type AlertHandler func(name string, message string, metadata map[string]string)
```

Register a handler to receive [alerts](../../production/alerting.md) from Conductor.
The handler function is called with three arguments:

- **name**: The type of alert rule. One of `WorkflowFailure`, `SlowQueue`, or `UnresponsiveApplication`.
- **message**: The alert message.
- **metadata**: A map of string key-value pairs with additional alert information.

Only one alert handler may be registered per application, and it must be registered before [`Launch`](./dbos-context.md#launch) is called.
If no handler is registered, alerts are logged automatically.

**Example syntax:**

```go
dbos.SetAlertHandler(dbosContext, func(ruleType string, message string, metadata map[string]string) {
    slog.Warn(fmt.Sprintf("Alert received: %s - %s", ruleType, message))
    for key, value := range metadata {
        slog.Warn(fmt.Sprintf("  %s: %s", key, value))
    }
})
```
