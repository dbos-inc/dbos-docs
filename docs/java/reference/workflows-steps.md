---
sidebar_position: 20
title: Workflows & Steps
toc_max_heading_level: 3
---

## Annotations

### @Workflow

```java
public @interface Workflow {
  String name();

  int maxRecoveryAttempts();

  SerializationStrategy serializationStrategy();
}
```

An annotation that can be applied to a class method to mark it as a durable workflow.

:::info
Workflow methods must be invoked via the proxy object returned by [`registerProxy`](#registerproxy) in order to be durable.
:::

**Parameters:**
- **name**: The workflow name. Must be unique within the class. Defaults to method name if not provided.
- **maxRecoveryAttempts**: Optionally configure the maximum number of times execution of a workflow may be attempted.
This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue) so that a buggy workflow that crashes its application (for example, by running it out of memory) does not do so infinitely.
If a workflow exceeds this limit, its status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED` and it may no longer be executed.
- **serializationStrategy**: The default [serialization strategy](../reference/methods.md#serialization-strategy) to use for local invocations of this workflow. Set to `SerializationStrategy.PORTABLE` to test [cross-language interoperability](../../explanations/portable-workflows.md). Defaults to `SerializationStrategy.DEFAULT`.

:::tip
When a workflow uses portable serialization, Java automatically coerces JSON arguments to match the method's parameter types. For example, JSON integers are widened to `long`, and ISO-8601 date strings are parsed to `Instant` or `OffsetDateTime`. See [Input Validation and Coercion](#input-validation-and-coercion) below for details.
:::

### @Step
```java
public @interface Step {
  String name();
  int maxAttempts();
  double intervalSeconds();
  double backOffRate();
}
```

An annotation that can be applied to a class method to mark it as a step in a durable workflow.

:::info
Reminder, step methods must be invoked via the proxy object returned by [`registerProxy`](#registerproxy) in order to be durable.
:::

**Parameters:**
- **name**: The step name. Must be unique within the class. Defaults to method name if not provided.
- **maxAttempts**: Maximum number of times this step is retried on failure. Must be greater than zero. Defaults to one.
- **intervalSeconds**: Initial delay between retries in seconds. Must be positive. Defaults to one second.
- **backOffRate**: Exponential backoff multiplier between retries. Must be greater than or equal to one. Defaults to two.

### @Scheduled

```java
public @interface Scheduled {
  String cron();
  String queue();
  boolean automaticBackfill();
}
```

An annotation that can be applied to a workflow to schedule it on a cron schedule.

**Parameters:**
- **cron**: The schedule, expressed in [Spring 5.3+ CronExpression](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/CronExpression.html) syntax.
- **queue**: Queue to enqueue scheduled workflows to. Defaults to DBOS's internal queue if not specified.
- **automaticBackfill**: Whether or not to retroactively start workflows that were scheduled during times when the app was not running. Set `automaticBackfill` to `true` to enable backfill. Defaults to `false`.

:::tip
For more control over scheduling — including runtime management, pausing, backfill, and timezone support — use the [`WorkflowSchedule`](./methods.md#workflowschedule) API with [`dbos.applySchedules`](./methods.md#applyschedules).
:::

### @WorkflowClassName

```java
public @interface WorkflowClassName {
  String value();
}
```

An annotation applied to a workflow **implementation class** (not the interface) to assign it a stable, portable class name for workflow registration.

Without this annotation, workflows are registered under their fully-qualified Java class name (e.g., `com.example.MyServiceImpl`). Using `@WorkflowClassName` replaces that with a shorter, language-agnostic name that survives refactoring and enables cross-language interoperability.

**Example:**

```java
@WorkflowClassName("MyService")
public class MyServiceImpl implements MyService {
    @Workflow
    public String processOrder(String orderId) { ... }
}
```

This workflow is registered as `processOrder/MyService/` instead of `processOrder/com.example.MyServiceImpl/`.

:::tip
Use `@WorkflowClassName` whenever a workflow may be invoked from another language (Python, TypeScript) or when you want workflow IDs to remain stable across package renames.
:::

## Input Validation and Coercion

Java automatically coerces portable JSON arguments to match the workflow method's parameter types.
No opt-in is required&mdash;this happens transparently for all portable workflows.

Common coercions include:

| JSON Type | Java Method Parameter | Coercion |
|-----------|----------------------|----------|
| Integer (`30000`) | `long` | Integer &rarr; long |
| Double (`1.01`) | `double` | Double &rarr; double |
| String (`"2025-06-15T10:30:00Z"`) | `Instant` | ISO-8601 parsing |
| String (`"2025-06-15T10:30:00+02:00"`) | `OffsetDateTime` | ISO-8601 parsing |
| JSON array | `ArrayList<T>` | Element-wise coercion |
| JSON object | `Map<String, Object>` | LinkedHashMap &rarr; Map |

If coercion fails (for example, a JSON object where a `String` is expected), the workflow is marked as `ERROR` with a descriptive message.

```java
// This workflow expects (String, long), but portable JSON delivers (String, Integer).
// Java coerces the Integer to long automatically.
@Workflow
public String processOrder(String orderId, long quantity) {
    return "order:" + orderId + " qty:" + quantity;
}
```

For more context on why input coercion matters for cross-language workflows, see [Input Validation and Coercion](../../explanations/portable-workflows.md#input-validation-and-coercion).

## Methods

### registerProxy

```java
<T> T registerProxy(Class<T> interfaceClass, T implementation)
<T> T registerProxy(Class<T> interfaceClass, T implementation, String instanceName)
```

Register the workflows in a class, returning a proxy object from which the class methods may be invoked as durable workflows.
All workflows must be registered before DBOS is launched.

:::info
`transact-spring-boot-starter` handles proxy creation and workflow registration automatically. 
If you're using `transact-spring-boot-starter`, you _don't_ need to call registerProxy manually.
:::

**Example Syntax:**

```java
interface Example {
    public void workflow();
}

class ExampleImpl implements Example {
    @Workflow
    public void workflow() {
        return;
    }
}

DBOS dbos = new DBOS(config);
Example proxy = dbos.registerProxy(Example.class, new ExampleImpl());
dbos.launch();
proxy.workflow();
```

**Parameters:**
- **interfaceClass**: The interface class whose workflows are to be registered.
- **implementation**: An instance of the class whose workflows to register.
- **instanceName**: A unique name for this class instance. Use only when you are creating multiple instances of a class and your workflow depends on class instance variables. When DBOS needs to recover a workflow belonging to that class, it looks up the class instance using `instanceName` so it can recover the workflow using the right instance of its class.


### startWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> startWorkflow(ThrowingSupplier<T, E> workflow)
<T, E extends Exception> WorkflowHandle<T, E> startWorkflow(ThrowingSupplier<T, E> workflow, StartWorkflowOptions options)
<E extends Exception> WorkflowHandle<Void, E> startWorkflow(ThrowingRunnable<E> workflow)
<E extends Exception> WorkflowHandle<Void, E> startWorkflow(ThrowingRunnable<E> workflow, StartWorkflowOptions options)
```

Start a workflow in the background and return a handle to it.
Optionally enqueue it on a DBOS queue.
The `startWorkflow` method resolves after the workflow is durably started; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

**Example Syntax**:

```java
interface Example {
    public void workflow();
}

class ExampleImpl implements Example {
    @Workflow
    public void workflow() {
        return;
    }
}

DBOS dbos = new DBOS(config);
Example proxy = dbos.registerProxy(Example.class, new ExampleImpl());
dbos.launch();
dbos.startWorkflow(() -> proxy.workflow(), new StartWorkflowOptions());
```

### StartWorkflowOptions

`StartWorkflowOptions` is a with-based configuration record for parameterizing `dbos.startWorkflow`. All fields are optional.

**Constructors:**
```java
new StartWorkflowOptions()
```
Create workflow options with all fields set to their defaults.

```java
new StartWorkflowOptions(String workflowId)
```
Shortcut for `new StartWorkflowOptions().withWorkflowId(workflowId)`

```java
new StartWorkflowOptions(Queue queue)
```
Shortcut for `new StartWorkflowOptions().withQueue(queue)`

**Methods:**
- **`withWorkflowId(String workflowId)`** - Set the workflow ID of this workflow.

- **`withQueue(Queue queue)`** / **`withQueue(String queueName)`** - Instead of starting the workflow directly, enqueue it on this queue.

- **`withTimeout(Timeout timeout)`** - Set a timeout using a [`Timeout`](./methods.md#timeout) object. Use this overload to pass `Timeout.none()` (opt out of any inherited timeout) or `Timeout.inherit()` (explicitly inherit from the calling context).

- **`withTimeout(Duration timeout)`** / **`withTimeout(long value, TimeUnit unit)`** - Set an explicit timeout duration for this workflow. When the timeout expires, the workflow **and all its children** are cancelled. Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

  Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

  Timeout deadlines are propagated to child workflows by default, so when a workflow's deadline expires all of its child workflows (and their children, and so on) are also cancelled. If you want to detach a child workflow from its parent's timeout, you can start it with its own explicit timeout (or `Timeout.none()`) to override the propagated timeout.

- **`withNoTimeout()`** - Explicitly remove any inherited timeout or deadline from this workflow.

- **`withDeadline(Instant deadline)`** - Set a deadline for this workflow. If the workflow is executing at the time of the deadline, the workflow **and all its children** are cancelled. Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

  Deadlines are **durable**: they are stored in the database and persist across restarts.

  Deadlines are propagated to child workflows by default, so when a workflow's deadline expires all of its child workflows (and their children, and so on) are also cancelled. If you want to detach a child workflow from its parent's deadline, you can start it with a different explicit deadline.

:::info
An explicit timeout and deadline cannot both be set.
:::

- **`withPriority(int priority)`** - May only be used when enqueuing. The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in FIFO (first in, first out) order. Priority values can range from `1` to `2,147,483,647`, where a low number indicates a higher priority. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.

- **`withDeduplicationId(String deduplicationId)`** - May only be used when enqueuing. At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will raise an exception.

- **`withQueuePartitionKey(String queuePartitionKey)`** - Set a queue partition key for the workflow. Use if and only if the queue is partitioned (created with `withPartitioningEnabled`). In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.

:::info
- Partition keys are required when enqueueing to a partitioned queue.
- Partition keys cannot be used with non-partitioned queues.
- Partition keys and deduplication IDs cannot be used together.
:::

- **`withDelay(Duration delay)`** - Delay the start of the workflow by the specified duration after it is dequeued. Only applicable when enqueuing.

- **`withAppVersion(String appVersion)`** - Tag the workflow with a specific application version, overriding the default version detected at runtime.

### WorkflowHandle

```java
public interface WorkflowHandle<T, E extends Exception> {

  String workflowId();

  T getResult() throws E;

  WorkflowStatus getStatus();
}
```

WorkflowHandle provides methods to interact with a running or completed workflow.
The type parameters `T` and `E` represents the expected return type of the workflow and the checked exceptions it may throw.
Handles can be used to wait for workflow completion, check status, and retrieve results. 

#### WorkflowHandle.getResult

```java
T getResult() throws E;
```

Wait for the workflow to complete and return its result.

#### WorkflowHandle.getStatus

```java
WorkflowStatus getStatus();
```

Retrieve the WorkflowStatus of the workflow.

#### WorkflowHandle.workflowId

```java
String workflowId();
```

Return the ID of the workflow underlying this handle.

### runStep

```java
<T, E extends Exception> T runStep(ThrowingSupplier<T, E> stepfunc, StepOptions opts) throws E
<T, E extends Exception> T runStep(ThrowingSupplier<T, E> stepfunc, String stepName) throws E
<E extends Exception> void runStep(ThrowingRunnable<E> stepfunc, StepOptions opts) throws E
<E extends Exception> void runStep(ThrowingRunnable<E> stepfunc, String stepName) throws E
```

Run a function as a step.  If called from within a workflow, the result is durably stored.
Returns the output of the step.

**Example Syntax:**

```java
class ExampleImpl implements Example {
    private final DBOS dbos;

    public ExampleImpl(DBOS dbos) {
        this.dbos = dbos;
    }

    private void stepOne() {
        System.out.println("Step one completed!");
    }

    private void stepTwo() {
        System.out.println("Step two completed!");
    }

    @Workflow
    public void workflow() throws InterruptedException {
        dbos.runStep(() -> stepOne(), "stepOne");
        dbos.runStep(() -> stepTwo(), new StepOptions("stepTwo").withMaxAttempts(3));
    }
}
```

### StepOptions

`StepOptions` is a with-based configuration record for parameterizing `dbos.runStep`. All fields except step name are optional.

**Constructors:**
```java
new StepOptions(String name)
```
Create step options and provide a name for this step. By default the step runs once (no retries).

**Methods:**
- **`withMaxAttempts(int n)`** - Maximum number of times to attempt the step. Must be greater than zero. Defaults to `1` (no retries). Set to a value greater than `1` to enable retries on exception.

- **`withRetryInterval(Duration interval)`** - How long to wait before the first retry. Must be positive. Defaults to 1 second.

- **`withBackoffRate(double rate)`** - Exponential backoff multiplier between retries. Must be greater than or equal to 1.0. Defaults to 2.0.


### WorkflowOptions

When workflow functions are called directly, they take their options from the current DBOS context. Setting options into the context is done with a `WorkflowOptions` object and a `setContext()` `try` block on the calling thread:

```java
try (var _opts = new WorkflowOptions(wfId).setContext()) {
    // This workflow is within the `try` and will get `wfId` from the context
    result = workflowClass.workflowMethod(args);
}
```

Workflow options will be restored to prior values at the end of the `try` block.

:::info
When using background execution or queues, workflow options are passed as a `StartWorkflowOptions` argument to `startWorkflow`. `WorkflowOptions` context does not affect `startWorkflow`.
:::

**Constructors:**
```java
new WorkflowOptions()
```
Create workflow options with no workflow ID and no timeout.

```java
new WorkflowOptions(String workflowId)
```
Shortcut for `new WorkflowOptions().withWorkflowId(workflowId)`.

**Fields:**
- **workflowId**: The ID to be assigned to a workflow called within the `try` block
- **timeout**: The timeout to be assigned to all workflows called within the `try` block
- **deadline**: The deadline to be assigned to all workflows called within the `try` block

**Methods:**

- **`withWorkflowId(String workflowId)`** - Set the [workflow ID](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) of the next workflow run.

- **`withTimeout(Timeout timeout)`** / **`withTimeout(Duration timeout)`** / **`withTimeout(long value, TimeUnit unit)`** - Set a timeout for all enclosed workflow invocations. When the timeout expires, the workflow **and all its children** are cancelled. Timeouts are **start-to-completion**: the timeout does not begin until the workflow starts execution. Timeouts are also **durable**: they persist across restarts. Timeout deadlines are propagated to child workflows by default.

- **`withNoTimeout()`** - Explicitly opt out of any inherited timeout. The workflow called within the `try` block will run without a timeout regardless of any timeout in the surrounding context.

- **`withDeadline(Instant deadline)`** - Set an absolute deadline for all enclosed workflow invocations. At the deadline time, the workflow **and all its children** are cancelled. Deadlines are propagated to child workflows by default.

:::info
An explicit timeout and deadline cannot both be set.
:::