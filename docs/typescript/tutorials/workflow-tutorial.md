---
sidebar_position: 10
title: Workflows
description: Learn how to make applications reliable using workflows.
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of [steps](./step-tutorial.md), which are ordinary TypeScript functions annotated with `@DBOS.step()`.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

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

## Reliability Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process crashes while executing a workflow and is restarted, it resumes the workflow from the last completed step.
2.  [Steps](./step-tutorial.md) are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed, it will never be re-executed.
3.  [Transactions](./transaction-tutorial.md) commit _exactly once_.  Once a workflow commits a transaction, it will never retry that transaction.

### Determinism

Workflows are in most respects normal TypeScript functions.
They can have loops, branches, conditionals, and so on.
However, workflow functions must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order.
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

## Workflow IDs

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this ID through the `DBOS.workflowID` context variable.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

### Asynchronous Workflows

You can use [`DBOS.startWorkflow`](../reference/transactapi/dbos-class.md#starting-background-workflows) to start a workflow in the background without waiting for it to complete.
This is useful for long-running or interactive workflows.

`DBOS.startWorkflow` returns a [workflow handle](../reference/transactapi/workflow-handles.md), from which you can access information about the workflow or wait for it to complete and retrieve its result.
The `DBOS.startWorkflow` method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

Here's an example:

```javascript
class Example {
    @DBOS.workflow()
    static async exampleWorkflow(var1: str, var2: str) {
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

To wait for a workflow to complete and retrieve its result, await `handle.getResult()`:

```javascript
const handle = await DBOS.retrieveWorkflow(workflowIdentity)
const result = await handle.getResult();
```

You can also use [`DBOS.retrieve_workflow`](../reference/transactapi/dbos-class.md#dbosretrieveworkflow) to retrieve a workflow's handle from its ID.

