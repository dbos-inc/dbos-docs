---
sidebar_position: 20
title: Workflows & Steps
---

### RegisterWorkflow

```go
func RegisterWorkflow[P any, R any](ctx Context, fn Workflow[P, R], opts ...WorkflowRegistrationOption)
```

Register a function as a DBOS workflow.
All workflows must be registered before the context is launched.

Workflow functions must be compatible with the following signature:

```go
type Workflow[P any, R any] func(ctx Context, input P) (R, error)
```

Returned errors are persisted with [gob](https://pkg.go.dev/encoding/gob), preserving their concrete type when read back (e.g., from a workflow handle in another process).
An error that cannot be gob-encoded—including those created by `errors.New` or `fmt.Errorf`, whose fields are unexported—is stored as its message string only, so `errors.Is` and `errors.As` will not match it after a database round-trip.
To preserve a custom error type, give it exported fields and register it with [`gob.Register`](https://pkg.go.dev/encoding/gob#Register).

**Parameters:**
- **ctx**: The Context.
- **fn**: The workflow function to register.
- **opts**: Functional options for workflow registration, documented below.

#### WithMaxRecoveryAttempts

```go
func WithMaxRecoveryAttempts(maxRetries int) WorkflowRegistrationOption
```

Configure the maximum number of times execution of a workflow may be attempted.
If `WithMaxRecoveryAttempts(n)` is set, the workflow may be attempted at most `n + 1` times (one initial execution plus `n` retries).
If this limit is exceeded, its status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED` and it will no longer be recovered automatically.
This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue), preventing a buggy workflow that crashes its application from doing so infinitely.
Use [`ResumeWorkflow`](./methods.md#resumeworkflow) to manually resume a workflow that has exceeded its limit after fixing the underlying issue.

```go
// Register a workflow that can be attempted at most 4 times (1 initial + 3 retries)
dbos.RegisterWorkflow(dbosContext, myWorkflow, dbos.WithMaxRecoveryAttempts(3))
```

:::info Workflow Attempts
The `Attempts` field in [`WorkflowStatus`](./methods.md#workflow-status) tracks how many times a workflow has been executed: `1` on first execution, `0` if enqueued but not yet dequeued, and incremented by `1` on each recovery or dequeue. The attempt count is incremented one last time before a workflow is placed in the DLQ&mdash;for example, a workflow with max retries of 1 that has been moved to the DLQ will show 3 attempts.
:::

#### WithWorkflowName

```go
func WithWorkflowName(name string) WorkflowRegistrationOption
```

Register a workflow with a custom name.
If not provided, the name of the workflow function is used.

#### WithInstance

```go
func WithInstance(instance ConfiguredInstance) WorkflowRegistrationOption
```

Register a workflow method bound to a specific configured instance.
Method values bound to different receivers (e.g. `a.Run` and `b.Run`) share a function name, so each instance's method must be registered under a per-instance key, derived from the instance's config name.

The instance must implement the `ConfiguredInstance` interface:

```go
type ConfiguredInstance interface {
    ConfigName() string
}
```

`ConfigName` must return a stable, unique name for the instance: it is durably recorded so recovery runs the workflow on the correct instance.
Instances must be registered with the same config name on every process start, before `Launch()`.

Run a workflow registered with `WithInstance` using the matching [`WithRunInstance`](#withruninstance) option.

**Example syntax:**

```go
type Messenger struct {
    name string
}

func (m *Messenger) ConfigName() string {
    return m.name
}

func (m *Messenger) Send(ctx dbos.Context, message string) (string, error) {
    // Workflow implementation using m...
    return "sent", nil
}

slack := &Messenger{name: "slack"}
email := &Messenger{name: "email"}

dbos.RegisterWorkflow(ctx, slack.Send, dbos.WithInstance(slack))
dbos.RegisterWorkflow(ctx, email.Send, dbos.WithInstance(email))
```

### RunWorkflow

```go
func RunWorkflow[P any, R any](ctx Context, fn Workflow[P, R], input P, opts ...WorkflowOption) (WorkflowHandle[R], error)
```

Execute a workflow function.
The workflow may execute immediately or be enqueued for later execution based on options.
Returns a [WorkflowHandle](#workflowhandle) that can be used to check the workflow's status or wait for its completion and retrieve its results.

**Parameters:**
- **ctx**: The Context.
- **fn**: The workflow function to execute.
- **input** The input to the workflow function.
- **opts**: Functional options for workflow execution, documented below.

**Example Syntax**:

```go
func workflow(ctx dbos.Context, input string) (string, error) {
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

#### WithRunInstance

```go
func WithRunInstance(instance ConfiguredInstance) WorkflowOption
```

Run a workflow method registered with [`WithInstance`](#withinstance).

```go
handle, err := dbos.RunWorkflow(ctx, slack.Send, input, dbos.WithRunInstance(slack))
```

#### WithQueue

```go
func WithQueue(queue Queue) WorkflowOption
```

Enqueue the workflow to the given queue instead of executing it immediately.
Queued workflows will be dequeued and executed according to the queue's configuration.
The queue must be a non-nil [`Queue`](./queues.md#queue-interface) handle returned by [`RegisterQueue`](./queues.md#registerqueue), [`RetrieveQueue`](./queues.md#retrievequeue), or [`ListQueues`](./queues.md#listqueues); passing `nil` makes the enclosing `RunWorkflow` call return an error.
To enqueue by name instead (for example, from a standalone client), use [`Enqueue`](./methods.md#enqueue).

#### WithDeduplicationID

```go
func WithDeduplicationID(id string) WorkflowOption
```

Set a deduplication ID for this workflow.
Should be used alongside `WithQueue`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in a given queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise an exception.
This behavior can be changed with [`WithDeduplicationPolicy`](#withdeduplicationpolicy).

#### WithDeduplicationPolicy

```go
func WithDeduplicationPolicy(policy DeduplicationPolicy) WorkflowOption
```

Set how a colliding deduplication ID is handled for a queued workflow.
Must be used alongside `WithQueue` and `WithDeduplicationID`.

```go
type DeduplicationPolicy int

const (
    // DeduplicationPolicyReject (default) returns a ErrorCodeQueueDeduplicated error if another workflow
    // already holds the deduplication ID on the queue.
    DeduplicationPolicyReject DeduplicationPolicy = iota
    // DeduplicationPolicyReturnExisting returns a handle to the existing workflow instead of an error.
    DeduplicationPolicyReturnExisting
)
```

```go
handle, err := dbos.RunWorkflow(ctx, taskWorkflow, task,
    dbos.WithQueue(queue),
    dbos.WithDeduplicationID("user_12345"),
    dbos.WithDeduplicationPolicy(dbos.DeduplicationPolicyReturnExisting),
)
```

#### WithPriority

```go
func WithPriority(priority uint) WorkflowOption
```

Set a queue priority for the workflow.
Should be used alongside `WithQueue`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order.
Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.

#### WithQueuePartitionKey

```go
func WithQueuePartitionKey(partitionKey string) WorkflowOption
```

Set a queue partition key for the workflow.
Use if and only if the queue is partitioned (created with [`WithPartitionQueue`](./queues.md#withpartitionqueue)).
In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.

**Example Syntax:**

```go
// Create a partitioned queue
partitionedQueue, err := dbos.RegisterQueue(ctx, "user-tasks",
    dbos.WithPartitionQueue(),
)

// Enqueue workflows with partition keys
// Each user's tasks run with separate concurrency limits
handle, err := dbos.RunWorkflow(ctx, ProcessUserTask, taskData,
    dbos.WithQueue(partitionedQueue),
    dbos.WithQueuePartitionKey(userID),
)
```

:::info
- Partition keys are required when enqueueing to a partitioned queue.
- Partition keys cannot be used with non-partitioned queues.
- Partition keys and deduplication IDs cannot be used together.
:::

#### WithDelay

```go
func WithDelay(delay time.Duration) WorkflowOption
```

Delay execution of a queued workflow by the specified duration.
Must be used together with [`WithQueue`](#withqueue).
The workflow is initially placed in `DELAYED` status and does not execute.
After the delay expires, it transitions to `ENQUEUED` status and may be dequeued and executed.
This is useful for scheduling a workflow to run at a future time.

You can dynamically update or shorten the delay of a `DELAYED` workflow with [`SetWorkflowDelay`](./methods.md#setworkflowdelay).

```go
remindersQueue, err := dbos.RegisterQueue(ctx, "reminders")

// Run the reminder workflow one hour from now.
handle, err := dbos.RunWorkflow(ctx, sendReminder, userID,
    dbos.WithQueue(remindersQueue),
    dbos.WithDelay(1 * time.Hour),
)
```

#### WithPortableWorkflow

```go
func WithPortableWorkflow() WorkflowOption
```

Mark the workflow to use the [portable JSON serialization format](../../explanations/portable-workflows.md) for cross-language interoperability.
When set, workflow inputs, outputs, and errors are serialized using portable JSON so they can be read by applications in other languages.
A DBOS Go portable workflow inputs will be type-asserted into the workflow input type.

```go
handle, err := dbos.RunWorkflow(dbosContext, processOrder, "order-123",
    dbos.WithPortableWorkflow(),
)
```

#### WithApplicationVersion

```go
func WithApplicationVersion(version string) WorkflowOption
```

Set the application version for this workflow, overriding the version in Context.

#### WithAuthenticatedUser

```go
func WithAuthenticatedUser(user string) WorkflowOption
```

Associate the workflow execution with a user name. Useful to define workflow identity.
Child workflows automatically inherit their parent's authentication information (authenticated user, assumed role, and authenticated roles) unless explicitly overridden.

#### WithAssumedRole

```go
func WithAssumedRole(role string) WorkflowOption
```

Set the assumed role recorded on the workflow.

#### WithAuthenticatedRoles

```go
func WithAuthenticatedRoles(roles ...string) WorkflowOption
```

Set the authenticated roles recorded on the workflow.

#### WithWorkflowAttributes

```go
func WithWorkflowAttributes(attributes map[string]any) WorkflowOption
```

Attach custom key-value attributes to the workflow.
Attributes are recorded in the [workflow status](./methods.md#workflow-status) at creation, must be JSON-serializable, and are not inherited by child workflows.
On Postgres they are stored as GIN-indexed JSONB and can be searched with [`WithFilterAttributes`](./methods.md#withfilterattributes).
Attributes can later be replaced with [`SetWorkflowAttributes`](./methods.md#setworkflowattributes).

```go
handle, err := dbos.RunWorkflow(ctx, processOrder, order,
    dbos.WithWorkflowAttributes(map[string]any{"customer": "acme", "region": "us-east"}),
)
```

### RunAsStep

```go
func RunAsStep[R any](ctx Context, fn Step[R], opts ...StepOption) (R, error)
```

Execute a function as a step in a durable workflow.

**Parameters:**
- **ctx**: The Context.
- **fn**: The step to execute, typically wrapped in an anonymous function. Syntax shown below.
- **opts**: Functional options for step execution, documented below.

**Example Syntax:**

Any Go function can be a step as long as it outputs one [json-encodable](https://pkg.go.dev/encoding/json) value and an error.
To pass inputs into a function being called as a step, wrap it in an anonymous function as shown below:

```go
func step(ctx context.Context, input string) (string, error) {
    output := ...
    return output
}

func workflow(ctx dbos.Context, input string) (string, error) {
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

Set the maximum number of times this step is automatically retried on failure.
A value of 0 (the default) indicates no retries.

#### WithStepMaxInterval

```go
func WithStepMaxInterval(interval time.Duration) StepOption
```

WithStepMaxInterval sets the maximum delay between retries. Default value is 5s.

#### WithStepBackoffFactor

```go
func WithStepBackoffFactor(factor float64) StepOption
```

WithStepBackoffFactor sets the exponential backoff multiplier between retries. Default value is 2.0. 

#### WithStepBaseInterval

```go
func WithStepBaseInterval(interval time.Duration) StepOption
```

WithStepBaseInterval sets the initial delay between retries. Default value is 100ms.

#### WithStepRetryPredicate

```go
func WithStepRetryPredicate(predicate func(error) bool) StepOption
```

Set a predicate deciding whether a step error is retried.
When set, a failed step is retried only if the predicate returns true for the error; otherwise the error is returned immediately, regardless of the remaining retry budget.

### Calling DBOS operations from steps

A step body is a strict scope: DBOS operations that write a checkpoint cannot run inside one.
Calling any of the following from inside a step returns an `ErrorCodeStepExecution` error: [`RunWorkflow`](#runworkflow) (spawning a child workflow), [`RunAsTransaction`](./datasources.md#runastransaction), [`Go`](#go), [`Enqueue`](./methods.md#enqueue), [`Send`](./methods.md#send), [`Recv`](./methods.md#recv), [`GetEvent`](./methods.md#getevent), [`Sleep`](./methods.md#sleep), [`CloseStream`](./methods.md#closestream), [`GetResult`](#workflowhandlegetresult) on a workflow handle, [`Patch`](#patch), [`DeprecatePatch`](#deprecatepatch), [`Debounce`](./queues.md#debouncerdebounce), workflow-management writes ([`CancelWorkflow(s)`](./methods.md#cancelworkflow), [`ResumeWorkflow(s)`](./methods.md#resumeworkflow), [`ForkWorkflow(s)`](./methods.md#forkworkflow), [`DeleteWorkflows`](./methods.md#deleteworkflows), [`SetWorkflowAttributes`](./methods.md#setworkflowattributes), [`SetWorkflowDelay`](./methods.md#setworkflowdelay)), and schedule writes ([`CreateSchedule`](./methods.md#createschedule), [`PauseSchedule`](./methods.md#pauseschedule), [`ResumeSchedule`](./methods.md#resumeschedule), [`DeleteSchedule`](./methods.md#deleteschedule)).

Allowed from inside a step:

- Calling another step function — it runs inline as part of the enclosing step, without its own checkpoint.
- [`SetEvent`](./methods.md#setevent) and [`WriteStream`](./methods.md#writestream) — at-least-once, attributed to the enclosing step.
- Read and list operations ([`ListWorkflows`](./methods.md#listworkflows), [`GetWorkflowSteps`](./methods.md#getworkflowsteps), [`RetrieveWorkflow`](./methods.md#retrieveworkflow), [`ReadStream`](./methods.md#readstream), [aggregates](./methods.md#getworkflowaggregates), [schedule](./methods.md#getschedule) and [queue](./queues.md#listqueues) reads) — they run within the enclosing step's durability scope, without their own checkpoint.

### Concurrent steps

#### Go

```go
func Go[R any](ctx Context, fn Step[R], opts ...StepOption) (<-chan StepOutcome[R], error)
```

Launch a step asynchronously and return a channel that will receive the result when the step completes.
This is a durable alternative to Go's native goroutines that checkpoints results to the database for deterministic replay.
Can only be called from within a workflow (not from inside a step).

**Parameters:**
- **ctx**: The Context.
- **fn**: The step function to execute asynchronously.
- **opts**: Functional options for step execution (same options as [`RunAsStep`](#runasstep)).

**Returns:**
- A receive-only channel of `StepOutcome[R]` that will receive exactly one value when the step completes, then close.
- An error if the step could not be launched (e.g., if called outside a workflow).

```go
type StepOutcome[R any] struct {
    Result R
    Err    error
}
```

**Example Syntax:**

```go
func workflow(ctx dbos.Context, _ string) (string, error) {
    // Launch step asynchronously
    resultChan, err := dbos.Go(ctx, func(ctx context.Context) (string, error) {
        return performWork(ctx)
    })
    if err != nil {
        return "", err
    }

    // Do other work...

    // Wait for result
    outcome := <-resultChan
    if outcome.Err != nil {
        return "", outcome.Err
    }
    return outcome.Result, nil
}
```

#### Select

```go
func Select[R any](ctx Context, channels []<-chan StepOutcome[R]) (R, error)
```

Wait for and return the first result from multiple channels obtained from [`Go`](#go).
This is a durable alternative to Go's native `select` statement that checkpoints the selected result for deterministic replay.
Can only be called from within a workflow.
All channels must be of the same type `R`.

**Parameters:**
- **ctx**: The Context.
- **channels**: A slice of receive-only channels from [`Go`](#go) calls.

**Returns:**
- The result value from the first channel to produce a value.
- An error if the selected step returned an error, if the context was cancelled, or if a channel was closed unexpectedly.

**Behavior:**
- If `channels` is empty, returns the zero value of type `R` with no error.
- If the context is cancelled while waiting, returns the context error.
- The selected channel index and value are checkpointed, so workflow recovery returns the same result.

**Example Syntax:**

```go
func workflow(ctx dbos.Context, _ string) (string, error) {
    ch1, _ := dbos.Go(ctx, func(ctx context.Context) (string, error) {
        return queryServiceA(ctx)
    })
    ch2, _ := dbos.Go(ctx, func(ctx context.Context) (string, error) {
        return queryServiceB(ctx)
    })

    // Wait for the first result
    result, err := dbos.Select(ctx, []<-chan dbos.StepOutcome[string]{ch1, ch2})
    if err != nil {
        return "", err
    }
    return result, nil
}
```

### WorkflowHandle

```go
type WorkflowHandle[R any] interface {
    GetResult(opts ...GetResultOption) (R, error)
    GetStatus() (WorkflowStatus, error)
    GetWorkflowID() string
}
```

WorkflowHandle provides methods to interact with a running or completed workflow.
The type parameter `R` represents the expected return type of the workflow.
Handles can be used to wait for workflow completion, check status, and retrieve results. 

#### WorkflowHandle.GetResult

```go
WorkflowHandle.GetResult(opts ...GetResultOption) (R, error)
```

Wait for the workflow to complete and return its result.

##### WithHandleTimeout

```go
func WithHandleTimeout(timeout time.Duration) GetResultOption
```

Specify a timeout for obtaining a workflow result.
On expiry, the error matches `context.DeadlineExceeded`.

##### WithHandlePollingInterval

```go
func WithHandlePollingInterval(interval time.Duration) GetResultOption
```

Set the polling interval for checking workflow completion status in the database.
Only positive interval values will be considered.

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

### Patching

#### Patch

```go
func Patch(ctx Context, patchName string) (bool, error)
```

Insert a patch marker at the current point in workflow history, returning `true` if it was successfully inserted and `false` if there is already a checkpoint present at this point in history indicating that the workflow should run unpatched.
Used to safely upgrade workflow code; see the [patching tutorial](../tutorials/upgrading-workflows.md#patching) for more detail.

**Parameters:**
- **ctx**: The Context.
- **patchName**: The name to give the patch marker that will be inserted into workflow history.

:::info
Patching must be enabled in your configuration by setting `EnablePatching: true`.
:::

#### DeprecatePatch

```go
func DeprecatePatch(ctx Context, patchName string) error
```

Safely bypass a patch marker at the current point in workflow history if present.
Used to safely deprecate patches; see the [patching tutorial](../tutorials/upgrading-workflows.md#patching) for more detail.

**Parameters:**
- **ctx**: The Context.
- **patchName**: The name of the patch marker to be bypassed.

:::info
Patching must be enabled in your configuration by setting `EnablePatching: true`.
:::
### Serialization

Workflow and step inputs, outputs, and errors are checkpointed in the system database.
By default they are encoded with a JSON serializer; you can supply a custom serializer via `Config.Serializer`:

```go
type Serializer[T any] interface {
    // Name returns the name of the serialization format (e.g., "DBOS_JSON", "DBOS_GOB").
    Name() string
    // Encode serializes a value to a string representation for database storage.
    Encode(data T) (*string, error)
    // Decode deserializes a string from the database back into a value.
    Decode(data *string) (T, error)
}
```

A built-in [gob](https://pkg.go.dev/encoding/gob) serializer is available with `dbos.NewGobSerializer()`, which handles arbitrary Go types (you must register your program's concrete types with `gob.Register`).

#### Custom serializers must be total

Every checkpoint written to the system database is encoded with the configured serializer — including engine-internal step outputs, not just your workflow inputs and outputs:

- the `int64` wake-up deadline recorded by durable [`Sleep`](./methods.md#sleep) (also written by `Recv` and `GetEvent` timeouts),
- the empty-string step output recorded by `WriteStream`,
- the `ScheduledWorkflowInput` struct recorded for database-backed schedule firings.

This keeps every row in the system database in one format, so it can be decoded uniformly by external tooling.
A `Serializer[any]` must therefore encode and decode *arbitrary* Go values, and decoding must preserve concrete types: decoded step results are type-asserted, so an `int64` must round-trip as `int64`, not `float64`.
See the [`protobuf-serializer` demo app](https://github.com/dbos-inc/dbos-demo-apps/tree/main/golang/protobuf-serializer) for a detailed example.

Additionally, every implementation must honor this contract:

1. `Decode` can be called with a nil `*string`: some checkpoints record an error and never write an output, so the stored value is SQL `NULL`. `Decode` must tolerate nil input (typically returning the zero value).
2. The nil round-trip must be lossless: `Decode(Encode(nil-value))` must yield that nil value back.
3. The literal string `__DBOS_NIL` is reserved by the engine — a custom `Encode` must never emit it for non-nil data.
4. `Encode` must not return a nil `*string`; to represent nil data, return a pointer to a sentinel string (the built-in gob serializer stores `__DBOS_NIL`; the portable JSON serializer stores `null`).

One deliberate exception: `Recv` and `GetEvent` checkpoint the *sender's* encoded payload verbatim, under the sender's recorded format. The receiver's serializer is never asked to re-encode a message or event it did not produce.

### Errors

Errors produced by DBOS APIs are of type `*dbos.Error`:

```go
type Error struct {
    Message string    // Human-readable error message
    Code    ErrorCode // Error type code for programmatic handling

    // Optional context fields — only set when relevant to the error
    WorkflowID      string // Associated workflow identifier
    DestinationID   string // Target workflow identifier (for communication errors)
    StepName        string // Step function name (for step errors)
    QueueName       string // Queue name (for queue-related errors)
    DeduplicationID string // Deduplication identifier
    StepID          int    // Step sequence number
    ExpectedName    string // Expected function name (for determinism errors)
    RecordedName    string // Actually recorded function name (for determinism errors)
    MaxRetries      int    // Maximum retry limit (for retry-related errors)
}
```

`Error` implements the standard error interface, formatting messages as `DBOS Error <Code>: <message>`.

#### Matching errors

Prefer matching with `errors.Is` against the package sentinels.
Matching is by error code — a sentinel matches any DBOS error carrying the same code, regardless of its other fields:

```go
handle, err := dbos.RunWorkflow(ctx, wf, input, dbos.WithWorkflowID(id))
if errors.Is(err, dbos.ErrConflictingWorkflowID) { ... }
```

To read the structured fields, use `errors.As`:

```go
var dbosErr *dbos.Error
if errors.As(err, &dbosErr) {
    logger.Error("workflow failed", "workflow_id", dbosErr.WorkflowID, "code", dbosErr.Code)
}
```

DBOS errors caused by context cancellation or an expired deadline also wrap the standard library cause, so `errors.Is(err, context.Canceled)` and `errors.Is(err, context.DeadlineExceeded)` match as well.
These causes survive serialization: they still match after the error is read back from the system database, for example when awaiting a workflow from another process.
Sentinel matching also survives the [portable JSON format](../../explanations/portable-workflows.md): a DBOS error recorded portably keeps its symbolic code, so `errors.Is` against the sentinels still holds when reading it from another process or language runtime.

#### Error codes

| Code | Sentinel | Meaning |
|---|---|---|
| `ErrorCodeConflictingID` | `ErrConflictingWorkflowID` | A concurrent execution of the same workflow recorded a conflicting step checkpoint, or an operation reused a workflow ID already in use. Never swallow this inside a workflow — return it so DBOS can resolve the conflict. See [Concurrent Execution Conflicts](../tutorials/step-tutorial.md#concurrent-execution-conflicts). |
| `ErrorCodeInitialization` | — | The DBOS context could not be initialized (invalid configuration, system database unreachable, or migrations failed). |
| `ErrorCodeNonExistentWorkflow` | `ErrNonExistentWorkflow` | The referenced workflow does not exist (e.g., `RetrieveWorkflow` or a management method with an unknown ID). |
| `ErrorCodeUnexpectedWorkflow` | `ErrUnexpectedWorkflow` | A workflow ID was reused by a different workflow function or on a different queue, indicating non-determinism or conflicting ID reuse. |
| `ErrorCodeWorkflowCancelled` | `ErrWorkflowCancelled` | This workflow was cancelled during execution. Propagate it out of your workflow function. Match it with `errors.Is` (step wrappers may enclose it). When the cancellation came from a cancelled context or expired durable timeout, the wrapped cause also matches `context.Canceled` / `context.DeadlineExceeded`; an API `CancelWorkflow` carries no stdlib cause. See [workflow cancellation](../tutorials/workflow-management.md#cancelling-workflows). |
| `ErrorCodeUnexpectedStep` | — | During replay, the step executing at a position differs from the step recorded there: the workflow function is non-deterministic or its code changed. See [Upgrading Workflow Code](../tutorials/upgrading-workflows.md). |
| `ErrorCodeAwaitedWorkflowCancelled` | `ErrAwaitedWorkflowCancelled` | A workflow you were awaiting (via a handle, `GetEvent`, or a child workflow) was cancelled. Unlike `ErrorCodeWorkflowCancelled`, this is the *awaiter's* error — the caller may handle it and continue. |
| `ErrorCodeConflictingRegistration` | — | A workflow, queue, or schedule was registered under a name that is already registered (or reserved). |
| `ErrorCodeWorkflowUnexpectedType` | — | A recorded input or output could not be decoded into the requested type parameter (e.g., `RetrieveWorkflow[R]` with the wrong `R`). |
| `ErrorCodeWorkflowExecution` | — | General workflow execution failure. |
| `ErrorCodeStepExecution` | — | General step execution failure. |
| `ErrorCodeDeadLetterQueue` | `ErrDeadLetterQueue` | The workflow exceeded its maximum recovery attempts (`WithMaxRecoveryAttempts`) and was dead-lettered. |
| `ErrorCodeMaxStepRetriesExceeded` | `ErrMaxStepRetriesExceeded` | A step exhausted its configured retries. The error wraps the joined errors of all attempts, so `errors.Is`/`errors.As` can reach the underlying failures. |
| `ErrorCodeQueueDeduplicated` | `ErrQueueDeduplicated` | An enqueue was rejected because another workflow with the same deduplication ID is already pending on the queue. |
| `ErrorCodePatchingNotEnabled` | — | `Patch` or `DeprecatePatch` was called but `Config.EnablePatching` is false. |
| `ErrorCodeTimeout` | `ErrTimeout` | A DBOS wait timed out (e.g., `Recv`, `GetEvent`, or an in-memory handle's `GetResult`). Deadline-driven timeouts also match `context.DeadlineExceeded`; for handle waits, prefer matching `context.DeadlineExceeded`, which covers all handle flavors. |
| `ErrorCodeNoApplicationVersions` | `ErrNoApplicationVersions` | An operation required a registered application version, but none exists in the system database. |
| `ErrorCodeQueueNotFound` | `ErrQueueNotFound` | The referenced queue does not exist (e.g., `RetrieveQueue`). |
| `ErrorCodeScheduleNotFound` | `ErrScheduleNotFound` | The referenced schedule does not exist (e.g., `GetSchedule`). |
| `ErrorCodeInvalidOption` | `ErrInvalidOption` | Invalid or inconsistent options were passed to a DBOS API. |