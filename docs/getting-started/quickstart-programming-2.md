---
sidebar_position: 2
---

# Programming Quickstart: Part 2

Now that we've written our first few functions, let's see how to stitch them into powerful and reliable programs.
If you've been following along, here's the code you should have so far (in `src/userFunctions.ts`):

```javascript
import { TransactionContext, OperonTransaction, GetApi, HandlerContext, PostApi } from '@dbos-inc/operon'
import { Knex } from 'knex';

type KnexTransactionContext = TransactionContext<Knex>;

interface operon_hello {
  name: string;
  greet_count: number;
}
export class Hello {

  @OperonTransaction()
  static async helloTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Increment greet_count.
    await txnCtxt.client<operon_hello>("operon_hello")
      .insert({name: name, greet_count: 1})
      .onConflict('name')
      .merge({ greet_count: txnCtxt.client.raw('operon_hello.greet_count + 1') });
    // Retrieve greet_count.
    const greet_count = await txnCtxt.client<operon_hello>("operon_hello")
      .select("greet_count")
      .where({name:name})
      .first()
      .then(row => row?.greet_count);
    return `Hello, ${name}! You have been greeted ${greet_count} times.\n`;
  }

  @GetApi('/greeting/:name')
  static async helloHandler(handlerCtxt: HandlerContext, name: string) {
    return handlerCtxt.invoke(Hello).helloTransaction(name);
  }

  @OperonTransaction()
  static async clearTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Delete a users's entry.
    await txnCtxt.client<operon_hello>("operon_hello")
      .where({name: name})
      .delete()
    return `Cleared greet_count for ${name}!\n`
  }

  @PostApi('/clear/:name')
  static async clearHandler(handlerCtxt: HandlerContext, name: string) {
    return handlerCtxt.invoke(Hello).clearTransaction(name);
  }
}
```

To make this more interesting, let's say that when we greet someone, we also want to send the greeting to a third party, like the [Postman Echo](https://postman-echo.com/) testing service.
To do this, let's write a new function:

```javascript
  @OperonCommunicator()
  static async postmanFunction(_commCtxt: CommunicatorContext, greeting: string) {
    try {
      await axios.get("https://postman-echo.com/get", {
        params: {
          greeting: greeting
        }
      });
      console.log(`Greeting sent to postman!`)
      return true;
    } catch (e) {
      console.warn("Error sending request:", e);
      return false;
    }
  }
```

This function forwards the greeting to the Postman Echo server, returning whether or not the request succeeded.
The `@OperonCommunicator` decorator tells Operon that this function has external side-effects.
Communicators have useful built-in features such as configurable automatic retries.
Learn more about communication with third-party services [here](..).

Now, let's update our `greeting` handler to call this new function:

```javascript
  @GetApi('/greeting/:name')
  static async helloHandler(handlerCtxt: HandlerContext, name: string) {
    const greeting = await handlerCtxt.invoke(Hello).helloTransaction(name);
    handlerCtxt.invoke(Hello).postmanFunction(greeting);
    return greeting;
  }
```

Try it out:

```bash
curl http://localhost:3000/greeting/operon
```

Every time you send a request, the server should print that it was forwarded to Postman.

Now, let's say that we're concerned about the _reliability_ of our simple application.
We want to keep the `greet_count` in the database synchronized with the number of requests successfully sent to Postman.
To do this, let's write a rollback transaction that decrements `greet_count` if the Postman request fails, then update our handler logic:

```javascript
  @OperonTransaction()
  static async rollbackHelloTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Decrement greet_count.
    await txnCtxt.client<operon_hello>("operon_hello")
      .where({ name: name })
      .decrement('greet_count', 1);
  }

  @GetApi('/greeting/:name')
  static async helloHandler(handlerCtxt: HandlerContext, name: string) {
    const greeting = await handlerCtxt.invoke(Hello).helloTransaction(name);
    if (await handlerCtxt.invoke(Hello).postmanFunction(greeting)) {
      return greeting;
    } else {
      await handlerCtxt.invoke(Hello).rollbackHelloTransaction(name);
      return `Greeting failed for ${name}\n`
    }
  }
```

This is better than before because we're robust to failures communicating with Postman.
However, we're still not robust to failures of our own servers: if our server crashed midway through sending a request to Postman, the rollback code would never execute.
Luckily, Operon solves this problem with _workflows_, orchestration functions that are guaranteed to run to completion.
Here's how we can use a workflow in our example:

```javascript
  @OperonWorkflow()
  static async helloWorkflow(wfCtxt: WorkflowContext, name: string) {
    const greeting = await wfCtxt.invoke(Hello).helloTransaction(name);
    if (await wfCtxt.invoke(Hello).postmanFunction(greeting)) {
      return greeting;
    } else {
      await wfCtxt.invoke(Hello).rollbackHelloTransaction(name);
      return `Greeting failed for ${name}\n`
    }
  }

  @GetApi('/greeting/:name')
  static async helloHandler(handlerCtxt: HandlerContext, name: string) {
    return await handlerCtxt.invoke(Hello).helloWorkflow(name).then(i => i.getResult());
  }
```

You can see that we've moved all the business logic from the handler to the workflow.
If a server executing a workflow fails and is restarted, Operon automatically resumes the workflow from where it left off, without re-executing any operation that already happened.
Using workflows, we've made our little application resilient to failures: it never records a greeting unless it completed successfully.
You can learn more about workflows and their guarantees [here](..).

One bonus tip before you're done!
You might have noticed that the handlers in this final example look superfluous because they directly call another function and return its result.
Luckily, Operon lets you simplify your code by applying endpoint decorators directly to transactions, communicators, and workflows, so you only need to explicitly write out a handler if you want to interact with the HTTP request or response directly.  Using this trick, here's our final, simplified code:


```javascript
import { TransactionContext, OperonTransaction, GetApi, HandlerContext, PostApi, CommunicatorContext, OperonCommunicator, OperonWorkflow, WorkflowContext } from '@dbos-inc/operon'
import { Knex } from 'knex';
import axios from 'axios';

type KnexTransactionContext = TransactionContext<Knex>;

interface operon_hello {
  name: string;
  greet_count: number;
}
export class Hello {

  @OperonTransaction()
  static async helloTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Increment greet_count.
    await txnCtxt.client<operon_hello>("operon_hello")
      .insert({ name: name, greet_count: 1 })
      .onConflict('name')
      .merge({ greet_count: txnCtxt.client.raw('operon_hello.greet_count + 1') });
    // Retrieve greet_count.
    const greet_count = await txnCtxt.client<operon_hello>("operon_hello")
      .select("greet_count")
      .where({ name: name })
      .first()
      .then(row => row?.greet_count);
    return `Hello, ${name}! You have been greeted ${greet_count} times.\n`;
  }

  @OperonTransaction()
  static async rollbackHelloTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Decrement greet_count.
    await txnCtxt.client<operon_hello>("operon_hello")
      .where({ name: name })
      .decrement('greet_count', 1);
  }

  @OperonCommunicator()
  static async postmanFunction(_commCtxt: CommunicatorContext, greeting: string) {
    try {
      await axios.get("https://postman-echo.com/get", {
        params: {
          greeting: greeting
        }
      });
      console.log(`Greeting sent to postman!`)
      return true;
    } catch (e) {
      console.warn("Error sending request:", e);
      return false;
    }
  }

  @GetApi('/greeting/:name')
  @OperonWorkflow()
  static async helloWorkflow(wfCtxt: WorkflowContext, name: string) {
    const greeting = await wfCtxt.invoke(Hello).helloTransaction(name);
    if (await wfCtxt.invoke(Hello).postmanFunction(greeting)) {
      return greeting;
    } else {
      await wfCtxt.invoke(Hello).rollbackHelloTransaction(name);
      return `Greeting failed for ${name}\n`
    }
  }

  @PostApi('/clear/:name')
  @OperonTransaction()
  static async clearTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Delete greet_count for a user.
    await txnCtxt.client<operon_hello>("operon_hello")
      .where({ name: name })
      .delete()
    return `Cleared greet_count for ${name}!\n`
  }
}
```