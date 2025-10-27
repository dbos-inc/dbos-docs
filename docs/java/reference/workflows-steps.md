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
}
```

An annotation that can be applied to a class method to mark it as a durable workflow.

**Parameters:**
- **name**: The workflow name. Must be unique.
- **maxRecoveryAttempts**: Optionally configure the maximum number of times execution of a workflow may be attempted.
This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue) so that a buggy workflow that crashes its application (for example, by running it out of memory) does not do so infinitely.
If a workflow exceeds this limit, its status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED` and it may no longer be executed.

### @Scheduled

```java
public @interface Scheduled {
  String cron();
}
```

An annotation that can be applied to a workflow to schedule it on a cron schedule.

**Parameters:**
- **cron**: The schedule, expressed in [Spring 5.3+ CronExpression](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/CronExpression.html) syntax.

## Methods

### registerWorkflows

```java
static <T> T registerWorkflows(Class<T> interfaceClass, T implementation)
static <T> T registerWorkflows(Class<T> interfaceClass, T implementation, String instanceName)
```

Register the workflows in a class, returning a proxy object from which the class methods may be invoked as durable workflows.
All workflows must be registered before DBOS is launched.

**Example Syntax:**

```java
interface Example {
    public void workflow();
}

class ExampleImpl implements Example {
    @Workflow(name="workflow")
    public void workflow() {
        return;
    }
}

Example proxy = DBOS.registerWorkflows(Example.class, new ExampleImpl());
proxy.workflow();
```

**Parameters:**
- **interfaceClass**: The interface class whose workflows are to be registered.
- **implementation**: An instance of the class whose workflows to register.
- **instanceName**: A unique name for this class instance. Use only when you are creating multiple instances of a class and your workflow depends on class instance variables. When DBOS needs to recover a workflow belonging to that class, it looks up the class instance using `instanceName` so it can recover the workflow using the right instance of its class.


### startWorkflow

```java
static <T, E extends Exception> WorkflowHandle<T, E> startWorkflow(
    ThrowingSupplier<T, E> workflow, 
    StartWorkflowOptions options
)
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
    @Workflow(name="workflow")
    public void workflow() {
        return;
    }
}

Example proxy = DBOS.registerWorkflows(Example.class, new ExampleImpl());
DBOS.startWorkflow(() -> proxy.workflow(), new StartWorkflowOptions());
```

#### StartWorkflowOptions

`StartWorkflowOptions` is a with-based configuration record for parameterizing `DBOS.startWorkflow`. All fields are optional.

**Constructors:**
```java
new StartWorkflowOptions()
```
Create workflow options with all fields set to their defaults.

**Methods:**
- **`withWorkflowId(String workflowId)`** - Set the workflow ID of this workflow.

- **`withQueue(Queue queue)`** - Instead of starting the workflow directly, enqueue it on this queue.

- **`withTimeout(Duration timeout)`** / **`withTimeout(long value, TimeUnit unit)`** - Set a timeout for this workflow. When the timeout expires, the workflow **and all its children** are cancelled. Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

  Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

  Timeout deadlines are propagated to child workflows by default, so when a workflow's deadline expires all of its child workflows (and their children, and so on) are also cancelled. If you want to detach a child workflow from its parent's timeout, you can start it with `SetWorkflowTimeout(custom_timeout)` to override the propagated timeout. You can use `SetWorkflowTimeout(None)` to start a child workflow with no timeout.

- **`withDeduplicationId(String deduplicationId)`** - May only be used when enqueuing. At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will raise an exception.

- **`withPriority(int priority)`** - May only be used when enqueuing. The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in FIFO (first in, first out) order. Priority values can range from `1` to `2,147,483,647`, where a low number indicates a higher priority. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.

### runStep

```java
static <T, E extends Exception> T runStep(
    ThrowingSupplier<T, E> stepfunc, 
    StepOptions opts
) throws E

static <T, E extends Exception> T runStep(
    ThrowingSupplier<T, E> stepfunc, 
    String stepName
) throws E

static <E extends Exception> void runStep(
    ThrowingRunnable<E> stepfunc, 
    StepOptions opts
) throws E

static <E extends Exception> runStep(
    ThrowingRunnable<E> stepfunc, 
    String stepName
) throws E
```

Run a function as a step.  If called from within a workflow, the result is durably stored.
Returns the output of the step.

**Example Syntax:**

```java
class ExampleImpl implements Example {

    private void stepOne() {
        System.out.println("Step one completed!");
    }

    private void stepTwo() {
        System.out.println("Step two completed!");
    }

    @Workflow(name="workflow")
    public void workflow() throws InterruptedException {
        DBOS.runStep(() -> stepOne(), "stepOne");
        DBOS.runStep(() -> stepTwo(), new StepOptions("stepTwo").withRetriesAllowed(false));
    }
}
```

#### StepOptions

`StepOptions` is a with-based configuration record for parameterizing `DBOS.runStep`. All fields except step name are optional.

**Constructors:**
```java
new StepOptions(String name)
```
Create step options and provide a name for this step.

**Methods:**
- **`withRetriesAllowed(boolean b)`** - Whether to retry the step if it throws an exception. Defaults to false.

- **`withMaxAttempts(int n)`** - How many times to retry a step that is throwing exceptions.

- **`withIntervalSeconds(double t)`** - How long to wait before the initial retry.

- **`withBackoffRate(double t)`** - How much to multiplicatively increase `intervalSeconds` between retries.

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