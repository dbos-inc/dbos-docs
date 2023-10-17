---
sidebar_position: 2
title: Programming Quickstart - Part 2
---

Now that we've written our first few functions, let's learn how to stitch them into powerful and reliable programs.
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

  @GetApi('/greeting/:user') // Serve this function from the /greeting endpoint with 'user' as a path parameter
  static async helloHandler(ctxt: HandlerContext, user: string) {
    // Invoke helloTransaction to greet the user and track how many times they've been greeted.
    return ctxt.invoke(Hello).helloTransaction(user);
  }

  @OperonTransaction()  // Declare this function to be a transaction.
  static async helloTransaction(ctxt: TransactionContext<Knex>, user: string) {
    // Retrieve and increment the number of times this user has been greeted.
    const rows = await ctxt.client<operon_hello>("operon_hello")
      // Insert greet_count for this user.
      .insert({ name: user, greet_count: 1 })
      // If already present, increment it instead.
      .onConflict("name").merge({ greet_count: ctxt.client.raw('operon_hello.greet_count + 1') })
      // Return the inserted or incremented value.
      .returning("greet_count");               
    const greet_count = rows[0].greet_count;
    return `Hello, ${user}! You have been greeted ${greet_count} times.\n`;
  }
}

```

### Talking to Other Services

To make this more interesting, let's say that when we greet someone, we also want to send the greeting to a third party, like the [Postman Echo](https://postman-echo.com/) testing service.
To do this, let's write a new function that forwards the greeting to the Postman Echo server:

```javascript
import { OperonCommunicator, CommunicatorContext } from '@dbos-inc/operon' // Add these to your imports

@OperonCommunicator()
static async greetPostman(ctxt: CommunicatorContext, greeting: string) {
  await axios.get("https://postman-echo.com/get", {
    params: {
      greeting: greeting
    }
  });
  ctxt.logger.info(`Greeting sent to postman!`);
}
```

The `@OperonCommunicator` decorator registers this function so that Operon can manage its execution.
Communicators have useful built-in features such as configurable automatic retries.
Learn more about communicators and communication with external services and APIs [here](../tutorials/communicator-tutorial).

Now, let's update `helloHandler` to call this new function with some error handling:

```javascript
@GetApi('/greeting/:user')
static async helloHandler(ctxt: HandlerContext, user: string) {
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

Try it out:

```bash
curl http://localhost:3000/greeting/operon
```

Every time you send a request, the server should print that it was forwarded to Postman.

### Making it Consistent

Now, let's say that we're concerned about the _consistency_ of our simple application.
We want to keep the `greet_count` in the database synchronized with the number of requests successfully sent to Postman.
To do this, let's write a rollback transaction that decrements `greet_count` if the Postman request fails, then call it from our handler.
After adding this code, our app will roll back the increment of `greet_count` if our Postman request fails.

```javascript
@OperonTransaction()
static async rollbackHelloTransaction(ctxt: TransactionContext<Knex>, user: string) {
  // Decrement greet_count.
  await ctxt.client<operon_hello>("operon_hello")
    .where({ name: user })
    .decrement('greet_count', 1);
}

@GetApi('/greeting/:user')
static async helloHandler(ctxt: HandlerContext, user: string) {
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

### Making it Reliable with Workflows

One issue with this solution is that it isn't reliable: if our server crashes midway through sending a request to Postman, the rollback code never executes and a spurious greeting is persisted to the database.
Luckily, Operon solves this problem with _workflows_, orchestration functions guaranteed to run to completion.
Here's how we can use a workflow in our example:

```javascript
import { OperonWorkflow, WorkflowContext } from '@dbos-inc/operon' // Add these to your imports

@GetApi('/greeting/:user')
// highlight-next-line
@OperonWorkflow()
// highlight-next-line
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

You can see that we've transformed the handler into a workflow by adding the `@OperonWorkflow` decorator.
When a workflow is interrupted and has to be restarted, Operon automatically resumes it from where it left off without re-executing any registered operation (like a transaction or communicator function) that already happened.
Using workflows, we've made our little application resilient to failures: it never records a greeting unless it completed successfully.
You can learn more about workflows and their guarantees [here](../tutorials/workflow-tutorial).

### Final Code

Final code for the demo is available [here](https://github.com/dbos-inc/operon-demo-apps/tree/main/hello-world-extended).
