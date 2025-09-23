---
sidebar_position: 10
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of [steps](./step-tutorial.md), which wrap ordinary TypeScript (or JavaScript) functions.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

To write a workflow, register a TypeScript function with `DBOS.registerWorkflow`.
The function's inputs and outputs must be serializable to JSON.
For example:

```typescript
async function stepOne() {
  DBOS.logger.info("Step one completed!");
}

async function stepTwo() {
  DBOS.logger.info("Step two completed!");
}

async function workflowFunction() {
  await DBOS.runStep(() => stepOne(), {name: "stepOne"});
  await DBOS.runStep(() => stepTwo(), {name: "stepTwo"});
}
const workflow = DBOS.registerWorkflow(workflowFunction)

await workflow();
```

Alternatively, you can register workflows and steps with decorators:

```typescript
export class Example {
  @DBOS.step()
  static async stepOne() {
    DBOS.logger.info("Step one completed!");
  }

  @DBOS.step()
  static async stepTwo() {
    DBOS.logger.info("Step two completed!");
  }

  // Call steps from workflows
  @DBOS.workflow()
  static async exampleWorkflow() {
    await Toolbox.stepOne();
    await Toolbox.stepTwo();
  }
}

await Example.exampleWorkflow();
```

## Starting Workflows In The Background

One common use-case for workflows is building reliable background tasks that keep running even when your program is interrupted, restarted, or crashes.
You can use [`DBOS.startWorkflow`](../reference/methods.md#dbosstartworkflow) to start a workflow in the background.
If you start a workflow this way, it returns a [workflow handle](../reference/methods.md#workflow-handles), from which you can access information about the workflow or wait for it to complete and retrieve its result.

Here's an example:

```javascript
class Example {
    @DBOS.workflow()
    static async exampleWorkflow(var1: string, var2: string) {
        return var1 + var2;
    }
}

async function main() {
    // Start exampleWorkflow in the background
    const handle = await DBOS.startWorkflow(Example).exampleWorkflow("one", "two");
    // Wait for the workflow to complete and return its results
    const result = await handle.getResult();
}
```

After starting a workflow in the background, you can use [`DBOS.retrieveWorkflow`](../reference/methods.md#dbosretrieveworkflow) to retrieve a workflow's handle from its ID.
You can also retrieve a workflow's handle from outside of your DBOS application with ['DBOSClient.retrieveWorkflow`](../reference/client.md#retrieveworkflow).

If you need to run many workflows in the background and manage their concurrency or flow control, you can also use [DBOS queues](./queue-tutorial.md).

## Workflow IDs and Idempotency

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this ID through the `DBOS.workflowID` context variable.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow as an argument to `DBOS.startWorkflow()`.
Workflow IDs must be **globally unique** for your application.
An assigned workflow ID acts as an idempotency key: if a workflow is called multiple times with the same ID, it executes only once.
This is useful if your operations have side effects like making a payment or sending an email.
Workflow IDs are also useful for communicating with workflows and developing interactive workflows - see [Communicating with Workflows](./workflow-communication.md) for more details.

For example:

```javascript
class Example {
    @DBOS.workflow()
    static async exampleWorkflow(var1: string, var2: string) {
        // ...
    }
}

async function main() {
    const myID: string = ...
    const handle = await DBOS.startWorkflow(Example, {workflowID: myID}).exampleWorkflow("one", "two");
    const result = await handle.getResult();
}
```

## Determinism

Workflows are in most respects normal TypeScript functions.
They can have loops, branches, conditionals, and so on.
However, a workflow function must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order (given the same return values from those steps).
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in [transactions](./transaction-tutorial) and all other non-deterministic operations in [steps](./step-tutorial.md).

For example, **don't do this**:

```javascript
class Example {
    @DBOS.workflow()
    static async exampleWorkflow() {
        // Don't make an HTTP request in a workflow function
        const body = await fetch("https://example.com").then(r => r.text()); 
        await Example.exampleTransaction(body);
    }
}
```

Instead, do this:
```javascript
class Example {
    @DBOS.workflow()
    static async exampleWorkflow() {
        // Don't make an HTTP request in a workflow function
        const body = await DBOS.runStep(
          async ()=>{return await fetch("https://example.com").then(r => r.text())},
          {name: "fetchBody"}
        );
        await Example.exampleTransaction(body);
    }
}
```

Or this:
```javascript
class Example {
    @DBOS.step()
    static async fetchBody() {
      // Instead, make HTTP requests in steps
      return await fetch("https://example.com").then(r => r.text());
    }

    @DBOS.workflow()
    static async exampleWorkflow() {
        const body = await Example.fetchBody();
        await Example.exampleTransaction(body);
    }
}
```

### Running Steps In Parallel
Initiating several concurrent steps in a workflow, followed by awaiting them with `Promise.allSettled`, is valid as long as the steps are started in a deterministic order.  For example the following is allowed:
```typescript
const results = await Promise.allSettled([
  step1("arg1"),
  step2("arg2"),
  step3("arg3"),
  step4("arg4"),
])
```
This is allowed because each step is started in a well-defined sequence before awaiting.

By contrast, the following is not allowed:
```typescript
const results = await Promise.allSettled([
  async () => { await step1("arg1"); await step2("arg3"); },
  async () => { await step3("arg2"); await step4("arg4"); },
]);
```
Here, `step2` and `step4` may be started in either order since their execution depends on the relative time taken by `step1` and `step3`.

If you need to run sequences of operations concurrently, start child workflows with [`startWorkflow`](#starting-workflows-in-the-background) and await the results from their `WorkflowHandle`s.

Avoid using `Promise.all` because of how it handles errors and rejections.  When any promise rejects, `Promise.all` immediately fails, leaving the other promises unresolved.  If one of those later throws an unhandled exception, it can crash your Node.js process.  Instead, prefer `Promise.allSettled`, which safely waits for all promises to complete and reports their outcomes.

## Workflow Timeouts

You can set a timeout for a workflow by passing a `timeoutMS` argument to `DBOS.startWorkflow`.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: a workflow's timeout does not begin until the workflow starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```javascript
async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction);

async function main() {
  const task = ...
  const timeout = ... // Timeout in milliseconds
  const handle = await DBOS.startWorkflow(taskWorkflow, {timeoutMS: timeout})(task);
}
```

## Durable Sleep

You can use [`DBOS.sleep()`](../reference/methods.md#dbossleep) to put your workflow to sleep for any period of time.
This sleep is **durable**&mdash;DBOS saves the wakeup time in the database so that even if the workflow is interrupted and restarted multiple times while sleeping, it still wakes up on schedule.

Sleeping is useful for scheduling a workflow to run in the future (even days, weeks, or months from now).
For example:

```javascript
@DBOS.workflow()
static async exampleWorkflow(timeToSleep, task) {
    await DBOS.sleep(timeToSleep);
    await runTask(task);
}
```

## Debouncing Workflows

You can debounce workflows to delay their execution until some time has passed since the workflow has last been called.
This is useful for preventing wasted work when a workflow may be triggered multiple times in quick succession.
For example, if a user is editing an input field, you can debounce their changes to execute a processing workflow only after they haven't edited the field for some time:

```typescript
async function processInput(userInput: string) {
  ...
}
const processInputWorkflow = DBOS.registerWorkflow(processInput);

// Each time a user submits a new input, debounce the processInput workflow.
// The workflow will wait until 60 seconds after the user stops submitting new inputs,
// then process the last input submitted.
const debouncer = new Debouncer({
  workflow: processInputWorkflow,
});

async function onUserInputSubmit(userId: string, userInput: string) {
  const debounceKey = userId;
  const debouncePeriodMs = 60000; // 60 seconds
  await debouncer.debounce(debounceKey, debouncePeriodMs, userInput);
}
```

See the [debouncing reference](../reference/methods.md#debouncing) for more details.

## Workflow Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process is interrupted while executing a workflow and restarts, it resumes the workflow from the last completed step.
2.  [Steps](./step-tutorial.md) are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed (returned a value or thrown an exception to the calling workflow), it will never be re-executed.
3.  [Transactions](./transaction-tutorial.md) commit _exactly once_.  Once a workflow commits a transaction, it will never retry that transaction.

If an exception is thrown from a workflow, the workflow **terminates**&mdash;DBOS records the exception, sets the workflow status to `ERROR`, and **does not recover the workflow**.
This is because uncaught exceptions are assumed to be nonrecoverable.
If your workflow performs operations that may transiently fail (for example, sending HTTP requests to unreliable services), those should be performed in [steps with configured retries](./step-tutorial.md#configurable-retries).
DBOS provides [tooling](./workflow-management.md) to help you identify failed workflows and examine the specific uncaught exceptions.

## Workflow Versioning and Recovery

Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the source code of its workflows (this can be overridden through the [`applicationVersion`](../reference/configuration.md)) configuration parameter.
All workflows are tagged with the application version on which they started.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
You cannot change the version of a workflow, but you can use [`DBOS.forkWorkflow`](./workflow-management.md#forking-workflows) to restart a workflow from a specific step on a specific code version.

For more information on managing workflow recovery when self-hosting production DBOS applications, check out [the guide](../../production/self-hosting/workflow-recovery.md).
