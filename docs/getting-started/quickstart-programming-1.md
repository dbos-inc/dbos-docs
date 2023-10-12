---
sidebar_position: 2
title: Programming Quickstart - Part 1
---

Now that we have an application up and running, let's learn how to program in Operon!

Let's look at the Hello world example, a simple program greeting users and tracking how many times it greet them.
Operon functions must be exported from a file named `src/operations.ts`. Here is its content for this example:

```javascript
import { TransactionContext, OperonTransaction, GetApi, HandlerContext } from '@dbos-inc/operon'
import { Knex } from 'knex';

type KnexTransactionContext = TransactionContext<Knex>;

interface operon_hello {
  name: string;
  greet_count: number;
}

export class Hello {
  // Register an HTTP handler
  @GetApi('/greeting/:name')
  static async helloHandler(handlerCtxt: HandlerContext, name: string) {
    return handlerCtxt.invoke(Hello).helloTransaction(name);
  }

  // Register an Operon database transaction
  @OperonTransaction()
  static async helloTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Look up greet_count for user `name`
    let greet_count = await txnCtxt.client<operon_hello>("operon_hello")
      .select("greet_count").where({ name: name }).first()
      .then(row => row?.greet_count);
    // Increment the counter for existing users, insert a new record for new users
    if (greet_count) {
      greet_count++;
      await txnCtxt.client<operon_hello>("operon_hello")
        .where({ name: name })
        .increment('greet_count', 1);
    } else {
      greet_count = 1;
      await txnCtxt.client<operon_hello>("operon_hello")
        .insert({ name: name, greet_count: 1 })
    }
    return `Hello, ${name}! You have been greeted ${greet_count} times.\n`;
  }
}
```

The `helloHandler` function serves the greeting via an HTTP request to the `greeting` endpoint.
The `helloTransaction` function transactionally fetches and updates a user's greeting count.
Note both are registered with Operon using our provided decorators, `@GetApi` and `@OperonTransaction`, respectively.
We use [knexjs](https://knexjs.org/) for database operations. Operon also supports raw SQL, [Prisma](https://www.prisma.io/) and [TypeORM](https://typeorm.io/).

Let's make this program more interesting by giving users the ability to clear their greeting count.
First, we will register a transaction clearing the greeting count for a user:

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

Note this function has to be added to the `Hello` class.
To learn more about database operations and transactions in Operon, see [our guide](..).
Now, let's add an HTTP endpoint from which to serve this function:

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

`@PostApi` register with Operon an HTTP endpoint handling `POST` requests aimed at `/clear/:name`, where `:name` is a route parameter.
To learn more about HTTP endpoints and handlers in Operon, see [our guide](..).

Now, let's see if this works!
After adding the new code to the `Hello` class and importing `PostApi` from `@dbos-inc/operon`, in `src/operations.ts`, let's run `npm run build` and `npx operon start`.
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
