---
sidebar_position: 2
title: Programming Quickstart - Part 2
---

In this guide, we'll learn how to build powerful and reliable programs with DBOS.
If you've been following along, here's the code you should have so far (in `src/operations.ts`):

```javascript
import { TransactionContext, Transaction, GetApi, PostApi, HandlerContext } from '@dbos-inc/dbos-sdk'
import { Knex } from 'knex';

// The schema of the database table used in this example.
export interface dbos_hello {
  name: string;
  greet_count: number;
}

export class Hello {

  @GetApi('/greeting/:user') // Serve this function from HTTP GET requests to the /greeting endpoint with 'user' as a path parameter
  @Transaction()  // Run this function as a database transaction
  static async helloTransaction(ctxt: TransactionContext<Knex>, @ArgSource(ArgSources.URL) user: string) {
    // Retrieve and increment the number of times this user has been greeted.
    const query = "INSERT INTO dbos_hello (name, greet_count) VALUES (?, 1) ON CONFLICT (name) DO UPDATE SET greet_count = dbos_hello.greet_count + 1 RETURNING greet_count;"
    const { rows } = await ctxt.client.raw(query, [user]) as { rows: dbos_hello[] };
    const greet_count = rows[0].greet_count;
    return `Hello, ${user}! You have been greeted ${greet_count} times.\n`;
  }

  @PostApi('/clear/:user') // Serve this function from HTTP POST requests to the /clear endpoint with 'user' as a path parameter
  @Transaction() // Run this function as a database transaction
  static async clearTransaction(ctxt: TransactionContext<Knex>, @ArgSource(ArgSources.URL) user: string) {
    // Delete the database entry for a user.
    await ctxt.client.raw("DELETE FROM dbos_hello WHERE NAME = ?", [user]);
    return `Cleared greet_count for ${user}!\n`
  }
}
```

### Talking to Other Services

Let's say that when we greet someone, we also want to send the greeting to a third party, like the [Postman Echo](https://postman-echo.com/) testing service.
To do this, we'll write a new function that forwards the greeting to the Postman Echo server:

```javascript
import { Communicator, CommunicatorContext } from '@dbos-inc/dbos-sdk' // Add these to your imports

@Communicator() // Tell DBOS this function accesses an external service or API.
static async greetPostman(ctxt: CommunicatorContext, greeting: string) {
  await fetch("https://postman-echo.com/get?greeting=" + encodeURIComponent(greeting));
  ctxt.logger.info(`Greeting sent to postman!`);
}
```

We annotate this function with a new decorator, `@Communicator`.
This decorator tells DBOS the function accesses an external service or API.
Communicators have useful built-in features such as configurable automatic retries.
Learn more about communicators and communication with external services and APIs [here](../tutorials/communicator-tutorial).

### Orchestrating Functions with Workflows

Now, let's create a _workflow_ that first calls `helloTransaction`, then calls `greetPostman` (with error handling).
Here's what our workflow looks like:

```javascript
import { Workflow, WorkflowContext } from '@dbos-inc/dbos-sdk' // Add these to your imports

@GetApi('/greeting/:user') // Moved here from helloTransaction
@Workflow() // Run this function as a reliable workflow.
static async helloWorkflow(ctxt: WorkflowContext, @ArgSource(ArgSources.URL) user: string) {
  const greeting = await ctxt.invoke(Hello).helloTransaction(user);
  try {
    await ctxt.invoke(Hello).greetPostman(greeting);
    return greeting;
  } catch (e) {
    ctxt.logger.error(e);
    return `Greeting failed for ${user}\n`;
  }
}
```

This function is annotated with another decorator, [`@Workflow`](../api-reference/decorators#workflow), which tells DBOS to run the function as a reliable workflow.
DBOS supplies workflows with a [`WorkflowContext`](../api-reference/contexts#workflowcontext), which exposes methods to invoke other functions.

Workflows are a powerful DBOS concept that helps you reliably orchestrate other functions.
When a workflow is interrupted (for example, because a server crashes and is restarted), DBOS automatically resumes it from where it left off without re-executing any operation (like a transaction or communicator function) that already completed.
Workflows make it easy to write reliable, fault-tolerant applications.
You can learn more about workflows and their guarantees [here](../tutorials/workflow-tutorial).

:::info

You might notice our workflow calls transactions and communicators through the [`ctxt.invoke()`](../api-reference/contexts#workflowctxtinvoketargetclass) method.
We do this for two reasons.
First, `invoke()` automatically supplies a context to the called function.
Second, `invoke()` wraps the called function to ensure fault tolerance.

:::

Now, try out your new workflow:

```bash
curl http://localhost:3000/greeting/dbos
```

Every time you send a request, the server should print that it was forwarded to Postman.

### Guaranteeing Consistency with Workflows

Let's say that we're concerned about the _consistency_ of our application.
We want to keep the `greet_count` in the database synchronized with the number of requests successfully sent to Postman.
To do this, let's write a compensating "undo" transaction that decrements `greet_count` if the Postman request fails, then call it from our workflow.
After adding this code, our app will undo the increment of `greet_count` if our Postman request fails.

```javascript
@Transaction()
static async undoHelloTransaction(ctxt: TransactionContext<Knex>, user: string) {
  // Decrement greet_count.
  await ctxt.client.raw("UPDATE dbos_hello SET greet_count = greet_count - 1 WHERE name = ?", [user]);
}

@GetApi('/greeting/:user')
@Workflow()
static async helloWorkflow(ctxt: WorkflowContext, @ArgSource(ArgSources.URL) user: string) {
  const greeting = await ctxt.invoke(Hello).helloTransaction(user);
  try {
    await ctxt.invoke(Hello).greetPostman(greeting);
    return greeting;
  } catch (e) {
    ctxt.logger.error(e);
    await ctxt.invoke(Hello).undoHelloTransaction(user);
    return `Greeting failed for ${user}\n`;
  }
}
```

Because DBOS workflows are reliable, this program maintains the consistency of `greet_count` even through serious failures like server crashes.
Ordinarily, if a server were to crash midway through sending a request to Postman, the undo code would never execute and a spurious greeting would be persisted to the database.
However, DBOS workflows automatically resume from where they left off when the server restarts, so our program would forward the greeting (or note the failure and undo the increment) as if nothing had happened.

### Next Steps

Congratulations on finishing the quickstart!  To learn more, check out our detailed [tutorials](../category/tutorials) or [API reference](../category/reference).
If you want to see more complex applications built with DBOS, check out [our demo apps](../tutorials/demo-apps).

Final code for the demo is available [here](https://github.com/dbos-inc/dbos-demo-apps/tree/main/hello-extended).
