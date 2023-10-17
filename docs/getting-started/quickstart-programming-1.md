---
sidebar_position: 2
title: Programming Quickstart - Part 1
---

Now that we have an application up and running, let's learn how to program in Operon!

### Hello, Database!

Let's look at the code we have so far (in `src/operations.ts`).
This "Hello, Database!" program greets users and tracks the count of greetings per user:

```javascript
import { TransactionContext, OperonTransaction, GetApi } from '@dbos-inc/operon'
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
    const query = "INSERT INTO operon_hello (name, greet_count) VALUES (?, 1) ON CONFLICT (name) DO UPDATE SET greet_count = operon_hello.greet_count + 1 RETURNING greet_count;"
    const { rows } = await ctxt.client.raw(query, [user]) as { rows: operon_hello[] };
    const greet_count = rows[0].greet_count;
    return `Hello, ${user}! You have been greeted ${greet_count} times.\n`;
  }
}
```

This starter code has a single function, `helloTransaction`, which retrieves and updates a user's greeting count.
This function is annotated with two _decorators_, [`@GetApi`](../api-reference/decorators#getapi) and [`@OperonTransaction`](../api-reference/decorators#operontransaction).
Decorators tell Operon to give a function special properties.

- `@OperonTransaction()` tells Operon to run this function as a [database transaction](https://en.wikipedia.org/wiki/Database_transaction).
Operon supplies transactions with a [`TransactionContext`](../api-reference/contexts#transactioncontextt), which exposes a database client.
To learn more about database operations and transactions in Operon, see [our guide](../tutorials/transaction-tutorial).
- `@GetApi('/greeting/:user')` tells Operon to serve this function from HTTP GET requests to the `/greeting` endpoint.
The `:user` syntax tells Operon to use the `user` path parameter from the URL as a parameter to the function.
To learn more about HTTP endpoints and handlers in Operon, see [our guide](../tutorials/http-serving-tutorial).

:::info

In this quickstart, we write our database operations in raw SQL (using [knex.raw](https://knexjs.org/guide/raw.html)) to make them easy to follow, but we also support the query builder [knex.js](https://knexjs.org/) and the popular TypeScript ORMs [Prisma](https://www.prisma.io/) and [TypeORM](https://typeorm.io/).

:::

### Adding Another Function

Let's add a new function that lets users clear their greeting count.
We'll write another function and annotate it with decorators:

```javascript
import { PostApi } from '@dbos-inc/operon' // Add this to your imports.

@PostApi('/clear/:user') // Serve this function from HTTP POST requests to the /clear endpoint with 'user' as a path parameter
@OperonTransaction() // Run this function as a database transaction
static async clearTransaction(ctxt: TransactionContext<Knex>, user: string) {
  // Delete the database entry for a user.
  await ctxt.client.raw("DELETE FROM operon_hello WHERE NAME = ?", [user]);
  return `Cleared greet_count for ${user}!\n`
}
```

Add this function as a method of the `Hello` class.
This new function works similarly to `helloTransaction`.
The  [`@OperonTransaction`](../api-reference/decorators#operontransaction) decorator tells Operon to run it as a database transaction.
The [`@PostApi`](../api-reference/decorators#postapi) decorator tells Operon to serve this function from HTTP POST requests to the `/clear` endpoint.

### Trying it Out

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

If you've gotten this far, congratulations on writing your first Operon function!
Move on to the next part to learn how to use more complex Operon features, like reliable workflows.
