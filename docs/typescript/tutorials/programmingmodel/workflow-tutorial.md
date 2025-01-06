---
sidebar_position: 10
title: Workflows
description: Learn how to make applications reliable using workflows.
---

In this guide, you'll learn how to make your applications reliable using workflows.

Workflows orchestrate the execution of other functions, like transactions and steps.
Workflows are _reliable_: if their execution is interrupted for any reason (e.g., an executor is restarted or crashes), DBOS automatically resumes them from where they left off, running them to completion without re-executing any operation that already finished.
You can use workflows to coordinate multiple operations that must all complete for a program to be correct.
For example, in our [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/e-commerce), we use a workflow for payment processing.

Workflows must be annotated with the [`@DBOS.workflow`](../../reference/transactapi/oldapi/decorators#workflow) decorator.
Like for other functions, inputs and outputs must be serializable to JSON.
Additionally, workflows must be [deterministic](#determinism).

Here's an example workflow from the [programming guide](../../programming-guide.md). It signs an online guestbook then records the signature in the database.
By using a workflow, we guarantee that every guestbook signature is recorded in the database, even if execution is interrupted.

```javascript
class Greetings {

  // Other function implementations

    @DBOS.workflow()
    @DBOS.getApi("/greeting/:friend")
    static async Greeting(friend: string) {
      const noteContent = `Thank you for being awesome, ${friend}!`;
      await Greetings.signGuestbook(friend);
      await Greetings.insertGreeting(
        { name: friend, note: noteContent }
      );
      return noteContent;
    }

}
```

### Invoking Functions from Workflows

Workflows can invoke transactions and steps by calling them.
For example, this line from our above example invokes the transaction `InsertGreeting`:

```javascript
await Greetings.insertGreeting(friend, noteContent);
```

You can also call other workflows from a workflow.

```typescript
const result = await Cls.workflowFunction(arg);
```

When called directly, the behavior is synchronous.  To start a "parallel" workflow in the background and return its handle, see [Asynchronous Workflows](#asynchronous-workflows) below.

### Reliability Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process crashes while executing a workflow and is restarted, it resumes the workflow from where it left off.
2.  Transactions commit _exactly once_.  Once a workflow commits a transaction, it will never retry that transaction.
3.  Steps are tried _at least once_ but are never re-executed after they successfully complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed, it will never be re-executed.

For safety, DBOS automatically attempts to recover a workflow a set number of times.
If a workflow exceeds this limit, its status is set to `RETRIES_EXCEEDED` and it is no longer retried automatically, though it may be [retried manually](#workflow-management).
This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue) so that a buggy workflow that crashes its application (for example, by running it out of memory) is not retried infinitely.
The maximum number of retries is by default 50, but this may be configured through arguments to the [`DBOS.workflow`](../../reference/transactapi/dbos-class#dbosworkflow) decorator.

### Determinism

A workflow implementation must be deterministic: if called multiple times with the same inputs, it should invoke the same transactions and steps with the same inputs in the same order.
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in [transactions](./transaction-tutorial) and all other non-deterministic operations in [steps](./step-tutorial).
You can then call these methods from a workflow.

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

Do this instead:

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

### Workflow Identity

Every time you execute a workflow, that execution is assigned a unique identity, represented as a string such as a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this identifier through the `DBOS.workflowID` field.
Workflow identities are important for communicating with workflows and developing interactive workflows.
For more information on workflow communication, see [our guide](./workflow-communication-tutorial.md).

### Asynchronous Workflows

Because workflows are often long-running, DBOS supports starting workflows asynchronously without waiting for them to complete.
When you start a workflow with [`DBOS.startWorkflow`](../../reference/transactapi/dbos-class#starting-background-workflows), the invocation returns a [workflow handle](../../reference/transactapi/workflow-handles):

```javascript
  @DBOS.getApi(...)
  static async exampleHandler(...) {
    const handle = await DBOS.startWorkflow(Class).workflow(...);
  }
```

Calls to start a workflow resolve as soon as the handle is safely created; at this point the workflow is guaranteed to [run to completion](./workflow-tutorial.md#reliability-guarantees).
This behavior is useful if you need to quickly acknowledge receipt of an event then process it asynchronously (for example, in a webhook).

You can also retrieve another workflow's handle using its identity:

```javascript
  @DBOS.getApi(...)
  static async exampleHandler(workflowIdentity: string, ...) {
    const handle = await DBOS.retrieveWorkflow(workflowIdentity);
  }
```

To wait for a workflow to complete and retrieve its result, await `handle.getResult()`:

```javascript
const handle = await DBOS.retrieveWorkflow(workflowIdentity)
const result = await handle.getResult();
```

For more information on workflow handles, see [their reference page](../../reference/transactapi/workflow-handles).

### Workflow Queues

By default, the `startWorkflow` methods [described above](#asynchronous-workflows) always start the target workflow immediately.  If it is desired to control the concurrency or rate of workflow invocations, a [`queue`](../../reference/transactapi/workflow-queues.md) can be provided to `startWorkflow`.

In the example below, the workflows started on `example_queue` will have the following restrictions:
- No more than 10 will be executing concurrently across all DBOS instances
- No more than 50 will be started in any 30-second period

```typescript
const example_queue = new WorkflowQueue("example_queue", 10, {limitPerPeriod: 50, periodSec: 30});

// ...

  @DBOS.getApi(...)
  static async exampleHandler(...) {
    const handle = await DBOS.startWorkflow(Class, {queueNam: example_queue.name}).workflow(...);
  }

```

### Workflow Management

You can use the [DBOS Transact CLI](../../reference/tools/cli.md) to manage your application's workflows.
It provides the following commands:

- [`npx dbos workflow list`](../../reference/tools/cli.md#npx-dbos-workflow-list): List workflows run by your application. Takes in parameters to filter on time, status, user, etc.
- [`npx dbos workflow get <uuid>`](../../reference/tools/cli.md#npx-dbos-workflow-get): Retrieve the status of a workflow.
- [`npx dbos workflow cancel <uuid>`](../../reference/tools/cli.md#npx-dbos-workflow-cancel): Cancel a workflow so it is no longer automatically retried or restarted. Active executions are not halted and the workflow can still be manually retried or restarted.
- [`npx dbos workflow resume <uuid>`](../../reference/tools/cli.md#npx-dbos-workflow-resume): Resume a workflow from the last step it executed, keeping its [identity UUID](#workflow-identity).
- [`npx dbos workflow restart <uuid>`](../../reference/tools/cli.md#npx-dbos-workflow-restart): Resubmit a workflow, restarting it from the beginning with the same arguments but a new [identity UUID](#workflow-identity).

### Further Reading

To learn how to make workflows (or other functions) idempotent, see [our idempotency guide](./idempotency-tutorial).

To learn how to make workflows interactive (for example, to handle user input), see our [workflow communication guide](./workflow-communication-tutorial).
