---
sidebar_position: 2
---

# Programming in Operon

Now that we have an application up and running, let's learn how to program in Operon!

Let's look at the code we have so far:

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
}
```

This simple program greets users and tracks the count of greetings per user.
The `helloTransaction` function transactionally updates and fetches a user's greeting count, while `helloHandler` serves the greeting via an HTTP request to the `greeting` endpoint.

Let's make this program more interesting by giving users the ability to clear their greeting count.
First, let's write a function that clears the greeting count for a user:

```javascript
  @OperonTransaction()
  static async clearTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Delete a users's entry.
    await txnCtxt.client<operon_hello>("operon_hello")
      .where({name: name})
      .delete()
  }
```

Add this function as a method of the `Hello` class.
The `@OperonTransaction` decorator tells Operon this function should execute as a database transaction.
The database operation is written using [knex.js](https://knexjs.org/), a popular query builder, 
but Operon also supports raw SQL and several Typescript ORMs including [Primsa](https://www.prisma.io/) and TypeORM(https://typeorm.io/).
To learn more about database operations and transactions in Operon, see [our guide](../tutorials/).

Next, let's add an HTTP endpoint from which to call this function:

```javascript
  @PostApi('/clear/:name')
  static async clearHandler(handlerCtxt: HandlerContext, name: string) {
    return handlerCtxt.invoke(Hello).clearTransaction(name);
  }
```

Once again, add this function as a method of the `Hello` class.
The `@PostApi` decorator tells Operon this function should execute in response to HTTP POST requests to the `clear` endpoint.
The `:name` syntax tells Operon to use the `name` path parameter from the URL as a parameter to the function.
To learn more about HTTP endpoints and handlers in Operon, see [our guide](../tutorials/)

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
Move on to the next page to learn how to use more complex Operon features, like reliable workflows.