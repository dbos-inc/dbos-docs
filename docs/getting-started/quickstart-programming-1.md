---
sidebar_position: 2
title: Programming Quickstart - Part 1
---

Now that we have an application up and running, let's learn how to program in DBOS!

### Hello, Database!

Let's look at the code we have so far (in `src/operations.ts`).
This "Hello, Database!" program greets users and tracks the count of greetings per user:

```javascript
import { TransactionContext, Transaction, GetApi, ArgSource, ArgSources } from '@dbos-inc/dbos-sdk'
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
}
```

This starter code has a single function, `helloTransaction`, which retrieves and updates a user's greeting count.
This function is annotated with three _decorators_: the method decorators [`@GetApi`](../api-reference/decorators#getapi) and  [`@Transaction`](../api-reference/decorators#transaction), and the parameter decorator [`@ArgSource(ArgSources.URL)`](../api-reference/decorators#argsource).
Decorators tell DBOS to give a function or parameter special properties:

- `@Transaction()` tells DBOS to run this function as a [database transaction](https://en.wikipedia.org/wiki/Database_transaction).
DBOS supplies transactions with a [`TransactionContext`](../api-reference/contexts#transactioncontextt), which exposes a database client.
To learn more about database operations and transactions in DBOS, see [our guide](../tutorials/transaction-tutorial).
- `@GetApi('/greeting/:user')` tells DBOS to serve this function from HTTP GET requests to the `/greeting` endpoint.
- `@ArgSource(ArgSources.URL)` tells DBOS to parse this function's `user` parameter from the `:user` path parameter in the URL.

To learn more about HTTP endpoints and handlers, see [our guide](../tutorials/http-serving-tutorial).

:::info

In this quickstart, we write our database operations in raw SQL (using [knex.raw](https://knexjs.org/guide/raw.html)) to make them easy to follow, but we also support [knex's query builder](https://knexjs.org/guide/query-builder.html) and the popular TypeScript ORMs [Prisma](https://www.prisma.io/) and [TypeORM](https://typeorm.io/).

:::

### Adding Another Function

Let's add a new function that lets users clear their greeting count.
We'll write another function and annotate it with decorators:

```javascript
import { PostApi } from '@dbos-inc/dbos-sdk' // Add this to your imports.

@PostApi('/clear/:user') // Serve this function from HTTP POST requests to the /clear endpoint with 'user' as a path parameter
@Transaction() // Run this function as a database transaction
static async clearTransaction(ctxt: TransactionContext<Knex>, @ArgSource(ArgSources.URL) user: string) {
  // Delete the database entry for a user.
  await ctxt.client.raw("DELETE FROM dbos_hello WHERE NAME = ?", [user]);
  return `Cleared greet_count for ${user}!\n`;
}
```

Add this function as a method of the `Hello` class.
This new function works similarly to `helloTransaction`.
The  [`@Transaction`](../api-reference/decorators#transaction) decorator tells DBOS to run it as a database transaction.
The [`@PostApi`](../api-reference/decorators#postapi) decorator tells DBOS to serve this function from HTTP POST requests to the `/clear` endpoint.

::::tip
It is not necessary to put all DBOS functions in one `operations.ts` file; it is also possible to export them:
```typescript
// Placed in operations.ts:
export { OperationClass1, OperationClass2 } from './FileA';
export { OperationClass3 } from './operations/FileB';
```
::::


### Trying it Out

Now, let's see if this works!
First, build and start the application:

```bash
npm run build
npx dbos-sdk start
```

With the application running, we can query it and observe the greeting count being incremented with each query:

```bash
curl http://localhost:3000/greeting/dbos
```

Then, clear the greeting count and ask for another greeting:

```bash
curl -X POST http://localhost:3000/clear/dbos
curl http://localhost:3000/greeting/dbos
```

The greeting count should reset back to 1.

If you've gotten this far, congratulations on writing your first DBOS function!
Move on to the next part to learn how to use more complex DBOS features, like reliable workflows.
