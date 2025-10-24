---
sidebar_position: 10
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of [steps](./step-tutorial.md), which wrap ordinary Java methods.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

To write a workflow, annotate a method with [`@Workflow`](../reference/workflows-steps.md#workflow).
All workflow methods must be registered with DBOS by creating a proxy before DBOS is launched.
A workflow method can have any parameters and return type (including void), as long as they are serializable.

Here's an example of a workflow:

```java
interface Example {
    public String workflow();
}

class ExampleImpl implements Example {

    private String stepOne() {
        System.out.println("Step one completed");
        return "success";
    }

    private String stepTwo() {
        System.out.println("Step two completed");
        return "success";
    }

    @Workflow(name = "workflow")
    public String workflow() {
        DBOS.runStep(() -> stepOne(), "stepOne");
        DBOS.runStep(() -> stepTwo(), "stepTwo");
        return "success";
    }
}

public class App {
    public static void main(String[] args) throws Exception {
        // Configure DBOS
        DBOSConfig config = ...
        DBOS.configure(config);

        // Create the workflow proxy
        Example proxy = DBOS.registerWorkflows(Example.class, new ExampleImpl());

        // Launch DBOS after registering all workflows
        DBOS.launch();

        // Call the workflow
        String result = proxy.workflow();
        System.out.println("Workflow result: " + result);
    }
}
```

## Starting Workflows In The Background

One common use-case for workflows is building reliable background tasks that keep running even when your program is interrupted, restarted, or crashes.
You can use [`startWorkflow`](../reference/workflows-steps.md#startworkflow) to start a workflow in the background.
When you start a workflow this way, it returns a [workflow handle](../reference/workflows-steps.md#workflowhandle), from which you can access information about the workflow or wait for it to complete and retrieve its result.

Here's an example:

```java
class ExampleImpl implements Example {
    @Workflow(name = "backgroundTask")
    public String backgroundTask(String input) {
        // ...
        return output;
    }
}

public void runWorkflowExample(Example proxy) throws Exception {
    // Start the background task
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
        () -> proxy.backgroundTask("input"),
        new StartWorkflowOptions()
    );
    // Wait for the background task to complete and retrieve its result
    String result = handle.getResult();
    System.out.println("Workflow result: " + result);
}
```

After starting a workflow in the background, you can use [`retrieveWorkflow`](../reference/methods.md#retrieveworkflow) to retrieve a workflow's handle from its ID.
You can also retrieve a workflow's handle from outside of your DBOS application with [`DBOSClient.retrieveWorkflow`](../reference/client.md#retrieveworkflow).

If you need to run many workflows in the background and manage their concurrency or flow control, use [queues](./queue-tutorial.md).

## Workflow IDs and Idempotency

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this ID from the [`DBOS.workflowId`](../reference/methods.md#workflowid) method.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow using `withWorkflowId` when calling `startWorkflow`.
Workflow IDs are **globally unique** within your application.
An assigned workflow ID acts as an idempotency key: if a workflow is called multiple times with the same ID, it executes only once.
This is useful if your operations have side effects like making a payment or sending an email.
For example:

```java
class ExampleImpl implements Example {
    @Workflow(name = "exampleWorkflow")
    public String exampleWorkflow() {
        System.out.println("Running workflow with ID: " + DBOS.workflowId());
        // ...
        return "success";
    }
}

public void example(Example proxy) throws Exception {
    String myID = "unique-workflow-id-123";
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
        () -> proxy.exampleWorkflow(),
        new StartWorkflowOptions().withWorkflowId(myID)
    );
    String result = handle.getResult();
    System.out.println("Result: " + result);
}
```

## Determinism

Workflows are in most respects normal Java methods.
They can have loops, branches, conditionals, and so on.
However, a workflow method must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order (given the same return values from those steps).
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow method.
Instead, you should do all non-deterministic operations in [steps](./step-tutorial.md).

:::warning
Java's threading and concurrency APIs are non-deterministic. You should use them only inside steps.
:::

For example, **don't do this**:

```java
@Workflow(name = "exampleWorkflow")
public String exampleWorkflow() {
    int randomChoice = new Random().nextInt(2);
    if (randomChoice == 0) {
        return DBOS.runStep(() -> stepOne(), "stepOne");
    } else {
        return DBOS.runStep(() -> stepTwo(), "stepTwo");
    }
}
```

Instead, do this:

```java
private int generateChoice() {
    return new Random().nextInt(2);
}

@Workflow(name = "exampleWorkflow")
public String exampleWorkflow() {
    int randomChoice = DBOS.runStep(() -> generateChoice(), "generateChoice");
    if (randomChoice == 0) {
        return DBOS.runStep(() -> stepOne(), "stepOne");
    } else {
        return DBOS.runStep(() -> stepTwo(), "stepTwo");
    }
}
```

## Workflow Timeouts

You can set a timeout for a workflow using [`withTimeout`](../reference/workflows-steps.md#startworkflow) in `StartWorkflowOptions`.

When the timeout expires, the workflow and all its children are cancelled. Cancelling a workflow sets its status to CANCELLED and preempts its execution at the beginning of its next step. You can detach a child workflow from its parent's timeout by starting it with a custom timeout using `withTimeout`.

Timeouts are **start-to-completion**: if a workflow is [enqueued](./queue-tutorial.md), the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are durable: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

```java
@Workflow(name = "exampleWorkflow")
public void exampleWorkflow() throws InterruptedException {
    // Workflow implementation
}

WorkflowHandle<Void, InterruptedException> handle = DBOS.startWorkflow(
    () -> proxy.exampleWorkflow(),
    new StartWorkflowOptions().withTimeout(Duration.ofHours(12))
);
```

You can also manually cancel the workflow by calling [`cancelWorkflow`](../reference/methods.md#cancelworkflow).


## Durable Sleep

You can use [`sleep`](../reference/methods.md#sleep) to put your workflow to sleep for any period of time.
This sleep is **durable**&mdash;DBOS saves the wakeup time in the database so that even if the workflow is interrupted and restarted multiple times while sleeping, it still wakes up on schedule.

Sleeping is useful for scheduling work to run in the future (even days, weeks, or months from now).
For example:

```java
public String runTask(String task) {
    // Execute the task...
    return "task completed";
}

@Workflow(name = "exampleWorkflow")
public String exampleWorkflow(float timeToSleepSeconds, String task) throws InterruptedException {
    // Sleep for the specified duration
    DBOS.sleep(Duration.ofMillis((long)(timeToSleepSeconds*1000)));

    // Execute the task after sleeping
    String result = DBOS.runStep(
        () -> runTask(task),
        "runTask"
    );

    return result;
}
```

## Workflow Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process is interrupted while executing a workflow and restarts, it resumes the workflow from the last completed step.
2.  [Steps](./step-tutorial.md) are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed (returned a value or thrown an exception to the calling workflow), it will never be re-executed.

If an exception is thrown from a workflow, the workflow **terminates**&mdash;DBOS records the exception, sets the workflow status to `ERROR`, and **does not recover the workflow**.
This is because uncaught exceptions are assumed to be nonrecoverable.
If your workflow performs operations that may transiently fail (for example, sending HTTP requests to unreliable services), those should be performed in [steps with configured retries](./step-tutorial.md#configurable-retries).
DBOS provides [tooling](../reference/methods.md#workflow-management-methods) to help you identify failed workflows and examine the specific uncaught exceptions.

## Workflow Versioning and Recovery

Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the application source code (this can be overridden through [configuration](../reference/lifecycle.md)).
All workflows are tagged with the application version on which they started.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
You cannot change the version of a workflow, but you can use [`forkWorkflow`](../reference/methods.md#forkworkflow) to restart a workflow from a specific step on a specific code version.

For more information on managing workflow recovery when self-hosting production DBOS applications, check out [the guide](../../production/self-hosting/workflow-recovery.md).
