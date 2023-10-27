---
sidebar_position: 4
title: Workflows
description: Learn how to make applications reliable using workflows.
---

In this guide, you'll learn how to make your applications reliable using workflows.

Workflows orchestrate the execution of other functions, like transactions and communicators.
They're useful because they're _reliable_: if a server is interruped for any reason (for example, it crashes and restarts), it automatically resumes all incomplete workflows and runs them to completion without re-executing any operation that already completed.
You can use workflows when you need to coordinate multiple operations that all need to complete for a program to be correct.
For example, in our [e-commerce demo](https://github.com/dbos-inc/operon-demo-apps/tree/main/e-commerce), we use a workflow to do payment processing.
Workflow reliability guarantees are especially valuable when some operations are long-running, like waiting for user inputs.

Workflows must be annotated with the [`@OperonWorkflow`](../api-reference/decorators#operonworkflow) decorator and must have a [`WorkflowContext`](../api-reference/contexts#workflowcontext) as their first argument.
Like for other Operon functions, inputs and outputs must be serializable to JSON.
Additionally, workflows must be [deterministic](#determinism).

Here's an example workflow from our [quickstart](../getting-started/quickstart-programming-2).
It increments a counter in the database, then sends an HTTP request.
If the request fails, it rolls back the increment.
By making this a workflow, we guarantee that the rollback always happens if the request fails, even if the server is interrupted.

```javascript
class Hello {

  ... // Other function implementations

  @GetApi('/greeting/:user')
  @OperonWorkflow()
  static async helloWorkflow(ctxt: WorkflowContext, @ArgSource(ArgSources.URL) user: string) {
    const greeting = await ctxt.invoke(Hello).helloTransaction(user);
    try {
      await ctxt.invoke(Hello).greetPostman(greeting);
      return greeting;
    } catch (e) {
      ctxt.logger.error(e);
      await ctxt.invoke(Hello).rollbackHelloTransaction(user);
      return `Greeting failed for ${user}\n`
    }
  }
```

### Invoking Functions from Workflows

Workflows can invoke transactions and communicators using their [`ctxt.invoke()`](../api-reference/contexts#workflowctxtinvoketargetclass) method.
For example, this line from our above example invokes `helloTransaction`:

```javascript
const greeting = await ctxt.invoke(Hello).helloTransaction(user);
```

The syntax for invoking function `foo(args)` in class `Bar` is `ctxt.invoke(Bar).foo(args)`.

You can also invoke other workflows using the [ctxt.childWorkflow()](../api-reference/contexts#workflowctxtchildworkflowwf-args) method.

### Reliability Guarantees

Workflows provide the following reliability guaranteees:

1.  They always run to completion.  If a server executing a workflow fails and is restarted, it resumes all incomplete workflows from where they left off.
2.  Transactions execute _exactly once_.  Regardless of what failures occur during a workflow's execution, it executes each of its transactions once and only once.
3.  Communicators execute _at least once_ but are never re-executed after they successfully complete.  If a failure occurs inside a communicator, the communicator may be retried, but once a communicator has completed execution, Operon guarantees it will never be re-executed regardless of what failures happen afterwards.

### Determinism

For workflows to provide reliability guarantees, they must be deterministic.
In other words, a workflow function must always do the same thing given the same inputs.
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in [transactions](./transaction-tutorial) and all other non-deterministic operations in [communicators](./communicator-tutorial).

### Workflow Identity

Every time you execute a workflow, that execution is assigned a unique identity, represented as a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this UUID through the `context.workflowUUID` field.
Workflow identities are important for communicating with workflows and developing interactive workflows.
For more information on workflow communication, see [our guide](./workflow-communication-tutorial.md).

### Asynchronous Workflows

Because workflows are often long-running, Operon supports invoking workflows asynchronously.
When you invoke a workflow from a handler or from another workflow, the invocation returns a [workflow handle](../api-reference/workflow-handles):

```javascript
  @GetApi(...)
  static async exampleHandler(ctxt: HandlerContext, ...) {
    const handle = await ctxt.invoke(Class).workflow(...);
  }
```

You can also retrieve another workflow's handle if you know its identity:

```javascript
  @GetApi(...)
  static async exampleHandler(ctxt: HandlerContext, workflowIdentity: string, ...) {
    const handle = await ctxt.retrieveWorkflow(workflowIdentity);
  }
```

To wait for a workflow to complete and retrieve its result, await `handle.getResult()`:

```javascript
const handle = await ctxt.invoke(Class).workflow(...);
const result = await handle.getResult();
```

Or, more concisely:

```javascript
const result = await ctxt.invoke(Class).workflow(name).then(h => h.getResult());
```

For more information on workflow handles, see [their reference page](../api-reference/workflow-handles).

### Further Reading

To learn how to make workflows (or other functions) idempotent, see [our idempotency guide](./idempotency-tutorial).

To learn how to make workflows interactive (for example, to handle user input), see our [workflow communication guide](./workflow-communication-tutorial).
