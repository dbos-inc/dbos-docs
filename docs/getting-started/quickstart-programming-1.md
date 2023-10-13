---
sidebar_position: 2
title: Programming Quickstart - Part 1
---

Now that we have an application up and running, let's learn how to program in Operon!

Let's look at the code we have so far (in `src/operations.ts`).
This simple "Hello, World!" program greets users and tracks the count of greetings per user:

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

The `helloHandler` function serves the greeting via an HTTP request to the `greeting` endpoint.
It calls the `helloTransaction` function, which transactionally fetches and updates a user's greeting count.
Both are registered with Operon via _decorators_: `@GetApi` declares an HTTP endpoint and `@OperonTransaction` declares a transaction.
The database operations are written using [knex.js](https://knexjs.org/), a popular query builder, but Operon also supports raw SQL and the popular Typescript ORMs [Prisma](https://www.prisma.io/) and [TypeORM](https://typeorm.io/).

Let's make this program more interesting by giving users the ability to clear their greeting count.
First, let's write a function clearing the greeting count for a user:

```javascript
@OperonTransaction()
static async clearTransaction(ctxt: TransactionContext<Knex>, user: string) {
  // Delete greet_count for a user.
  await ctxt.client<operon_hello>("operon_hello")
    .where({ name: user })
    .delete()
  return `Cleared greet_count for ${user}!\n`
}
```

Add this function as a method of the `Hello` class.
Like before, this function is declared a transaction via the `@OperonTransaction` decorator and accesses the database using  [knex.js](https://knexjs.org/).
To learn more about database operations and transactions in Operon, see [our guide](../tutorials/transaction-tutorial).

Now, let's add an HTTP endpoint from which to serve this function:

```javascript
import { PostApi } from '@dbos-inc/operon' // Add this to your imports.

// highlight-next-line
@PostApi('/clear/:user')
@OperonTransaction()
static async clearTransaction(ctxt: TransactionContext<Knex>, user: string) {
  // Delete greet_count for a user.
  await ctxt.client<operon_hello>("operon_hello")
    .where({ name: user })
    .delete()
  return `Cleared greet_count for ${user}!\n`
}
```

The `@PostApi` decorator we added tells Operon to execute this function in response to HTTP POST requests to the `clear` endpoint.
The `:user` syntax tells Operon to use the `user` path parameter from the URL as a parameter to the function.
To learn more about HTTP endpoints and handlers in Operon, see [our guide](../tutorials/http-serving-tutorial).

Now, let's see if this works!
First, build and start the application:

```bash
npm run build
npx operon start
```

With the application running, we can query it and observe the greeting count being incremented with each query:

```bash
curl http://localhost:3000/greeting/operon
```

Then, clear the greeting count and ask for another greeting:

```bash
curl -X POST http://localhost:3000/clear/operon
curl http://localhost:3000/greeting/operon
```

The greeting count should reset back to 1.

If you've gotten this far, congratulations on writing your first few Operon functions!
Move on to the next part to learn how to use more complex Operon features, like reliable workflows.
