---
sidebar_position: 2
---

# Programming Quickstart: Part 1

Now that we have an application up and running, let's learn how to program in Operon!

Let's look at the code we have so far (in `src/userFunctions.ts`):

```javascript
import { TransactionContext, OperonTransaction, GetApi, HandlerContext } from '@dbos-inc/operon'
import { Knex } from 'knex';

type KnexTransactionContext = TransactionContext<Knex>;

interface operon_hello {
  name: string;
  greet_count: number;
}

export class Hello {

  @OperonTransaction()
  static async helloTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Look up greet_count.
    let greet_count = await txnCtxt.client<operon_hello>("operon_hello")
      .select("greet_count")
      .where({ name: name })
      .first()
      .then(row => row?.greet_count);
    if (greet_count) {
      // If greet_count is set, increment it.
      greet_count++;
      await txnCtxt.client<operon_hello>("operon_hello")
        .where({ name: name })
        .increment('greet_count', 1);
    } else {
      // If greet_count is not set, set it to 1.
      greet_count = 1;
      await txnCtxt.client<operon_hello>("operon_hello")
        .insert({ name: name, greet_count: 1 })
    }
    return `Hello, ${name}! You have been greeted ${greet_count} times.\n`;
  }

  @GetApi('/greeting/:name')
  static async helloHandler(handlerCtxt: HandlerContext, name: string) {
    return handlerCtxt.invoke(Hello).helloTransaction(name);
  }
}
```

This simple program greets users and tracks the count of greetings per user.
The `helloTransaction` function transactionally fetches and updates a user's greeting count, while `helloHandler` serves the greeting via an HTTP request to the `greeting` endpoint.

Let's make this program more interesting by giving users the ability to clear their greeting count.
First, let's write a function that clears the greeting count for a user:

```javascript
  @OperonTransaction()
  static async clearTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Delete greet_count for a user.
    await txnCtxt.client<operon_hello>("operon_hello")
      .where({name: name})
      .delete()
    return `Cleared greet_count for ${name}!\n`
  }
```

Add this function as a method of the `Hello` class.
The `@OperonTransaction` decorator tells Operon this function should execute as a database transaction.
The database operations are written using [knex.js](https://knexjs.org/), a popular query builder, 
but Operon also supports raw SQL and several Typescript ORMs including [Prisma](https://www.prisma.io/) and [TypeORM](https://typeorm.io/).
To learn more about database operations and transactions in Operon, see [our guide](..).

Now, let's add an HTTP endpoint from which to serve this function.
We can do this by annotating the function with another decorator:

```javascript
  // highlight-next-line
  @PostApi('/clear/:name')
  @OperonTransaction()
  static async clearTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Delete greet_count for a user.
    await txnCtxt.client<operon_hello>("operon_hello")
      .where({name: name})
      .delete()
    return `Cleared greet_count for ${name}!\n`
  }
```

This `@PostApi` decorator tells Operon to execute this function in response to HTTP POST requests to the `clear` endpoint.
The `:name` syntax tells Operon to use the `name` path parameter from the URL as a parameter to the function.
To learn more about HTTP endpoints and handlers in Operon, see [our guide](..).

Now, let's test that this works!

First, run this command a few times to receive greetings:

```bash
curl http://localhost:3000/greeting/operon
```

You should see the greeting count increment with each greeting received.

Then, clear the greeting count, then ask for another greeting:

```bash
curl -X POST http://localhost:3000/clear/operon
curl http://localhost:3000/greeting/operon
```

The greeting count should reset back to 1.

If you've gotten this far, congratulations on writing your first few Operon functions!
Move on to the next part to learn how to use more complex Operon features, like reliable workflows.