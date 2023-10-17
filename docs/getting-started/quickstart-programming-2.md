---
sidebar_position: 2
title: Programming Quickstart - Part 2
---

In this guide, we'll learn how to build powerful and reliable programs with Operon.
If you've been following along, here's the code you should have so far (in `src/operations.ts`):

```javascript
import { TransactionContext, OperonTransaction, GetApi, HandlerContext } from '@dbos-inc/operon'
import { Knex } from 'knex';

// The schema of the database table used in this example.
export interface operon_hello {
  name: string;
  greet_count: number;
}

export class Hello {

  @GetApi('/greeting/:user') // Serve this function from HTTP GET requests to the /greeting endpoint with 'user' as a path parameter
  @OperonTransaction()  // Run this function as a database transaction
  static async helloTransaction(ctxt: TransactionContext<Knex>, user: string) {
    // Retrieve and increment the number of times this user has been greeted.
    const query = `INSERT INTO operon_hello (name, greet_count) VALUES (?, 1)
      ON CONFLICT (name) DO UPDATE SET greet_count = operon_hello.greet_count + 1 RETURNING greet_count;`
    const { rows } = await ctxt.client.raw(query, [user]) as { rows: operon_hello[] };
    const greet_count = rows[0].greet_count;
    return `Hello, ${user}! You have been greeted ${greet_count} times.\n`;
  }

  @PostApi('/clear/:user') // Serve this function from HTTP POST requests to the /clear endpoint with 'user' as a path parameter
  @OperonTransaction() // Run this function as a database transaction
  static async clearTransaction(ctxt: TransactionContext<Knex>, user: string) {
    // Delete the database entry for a user.
    await ctxt.client.raw("DELETE FROM operon_hello WHERE NAME = ?", [user]);
    return `Cleared greet_count for ${user}!\n`
  }
}
```

### Talking to Other Services

Let's say that when we greet someone, we also want to send the greeting to a third party, like the [Postman Echo](https://postman-echo.com/) testing service.
To do this, we'll write a new function that forwards the greeting to the Postman Echo server:

```javascript
import { OperonCommunicator, CommunicatorContext } from '@dbos-inc/operon' // Add these to your imports

  @OperonCommunicator() // Tell Operon this function accesses an external service or API.
  static async greetPostman(ctxt: CommunicatorContext, greeting: string) {
    await fetch("https://postman-echo.com/get?greeting=" + encodeURIComponent(greeting));
    ctxt.logger.info(`Greeting sent to postman!`);
  }
```

We annotate this function with a new decorator, `@OperonCommunicator`.
This decorator tells Operon the function accesses an external service or API.
Communicators have useful built-in features such as configurable automatic retries.
Learn more about communicators and communication with external services and APIs [here](../tutorials/communicator-tutorial).

### Orchestrating Functions with Workflows

Now, let's create a _workflow_ that first calls `helloTransaction`, then calls `greetPostman` (with error handling).
Here's what our workflow looks like:

```javascript
import { OperonWorkflow, WorkflowContext } from '@dbos-inc/operon' // Add these to your imports

  @GetApi('/greeting/:user')
  @OperonWorkflow() // Run this function as a reliable workflow.
  static async helloWorkflow(ctxt: WorkflowContext, user: string) {
    const greeting = await ctxt.invoke(Hello).helloTransaction(user);
    try {
      await ctxt.invoke(Hello).greetPostman(greeting);
      return greeting;
    } catch (e) {
      ctxt.logger.error(e);
      return `Greeting failed for ${user}\n`
    }
  }
```

This function is annotated with another decorator, [`@OperonWorkflow`](../api-reference/decorators#operonworkflow).
Workflows are a powerful Operon concept that helps you reliably orchestrate other functions.
When a workflow is interrupted (for example, because a server crashes and is restarted), Operon automatically resumes it from where it left off without re-executing any operation (like a transaction or communicator function) that already completed.
Workflows make it easy to write reliable, fault-tolerant applications.
You can learn more about workflows and their guarantees [here](../tutorials/workflow-tutorial).

Additionally, note that we moved the `GetApi` decorator from `helloTransaction` to `helloWorkflow`.

Now, try out your new workflow:

```bash
curl http://localhost:3000/greeting/operon
```

Every time you send a request, the server should print that it was forwarded to Postman.

### Guaranteeing Consistency with Workflows

Now, let's say that we're concerned about the _consistency_ of our simple application.
We want to keep the `greet_count` in the database synchronized with the number of requests successfully sent to Postman.
To do this, let's write a rollback transaction that decrements `greet_count` if the Postman request fails, then call it from our workflow.
After adding this code, our app will roll back the increment of `greet_count` if our Postman request fails.

```javascript
@OperonTransaction()
static async rollbackHelloTransaction(ctxt: TransactionContext<Knex>, user: string) {
  // Decrement greet_count.
  await ctxt.client.raw("UPDATE operon_hello SET greet_count = greet_count - 1 WHERE name = ?", [user]);
}

@GetApi('/greeting/:user')
@OperonWorkflow()
static async helloWorkflow(ctxt: WorkflowContext, user: string) {
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

Because Operon workflows are reliable, this program maintains the consistency of `greet_count` even through serious failures like server crashes.
Ordinarily, if a server were to crash midway through sending a request to Postman, the rollback code would never execute and a spurious greeting would be persisted to the database.
However, Operon workflows automatically resume from where they left off when the server restarts, so our program would forward the greeting (or note the failure and roll back) as if nothing had happened.

### Next Steps

Congratulations on finishing the quickstart!  To learn more, check out our detailed [tutorials](../category/tutorials) or [API reference](../category/api-reference).
If you want to see more complex applications built with Operon, check out [our demo apps](../tutorials/demo-apps).

Final code for the demo is available [here](https://github.com/dbos-inc/operon-demo-apps/tree/main/hello-extended).
