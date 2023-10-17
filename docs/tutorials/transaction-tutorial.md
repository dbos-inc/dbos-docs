---
sidebar_position: 2
title: Transactions
description: Learn how to perform database operations
---

In this guide, you'll learn how to perform database operations in Operon.

To perform operations on your application database in Operon, you use a _transaction_ function.
As their name implies, these functions execute as [database transactions](https://en.wikipedia.org/wiki/Database_transaction).

Transaction functions must be annotated with the [`@OperonTransaction`](../api-reference/decorators#operontransaction) decorator and must have a [`TransactionContext`](../api-reference/contexts#transactioncontextt) as their first argument.
Like for other Operon functions, inputs and outputs must be serializable to JSON.
The [`TransactionContext`](../api-reference/contexts#transactioncontextt) provides a `.client` field you can use to transactionally interact with the database, so you don't need to worry about managing database connections.
By default, this is a [Knex.js](https://knexjs.org/) client.

We like Knex because it's lightweight and helps us write fast and type-safe queries.
However, if you prefer a traditional ORM, we also support [Prisma](./using-prisma.md) and [TypeORM](./using-typeorm.md).

Here's an example of a transaction function (from the [quickstart](../getting-started/quickstart)) written using Knex.
This function uses the Knex client to retrieve and increment `greet_count` for an input username:

```javascript

export interface operon_hello {
  name: string;
  greet_count: number;
}

export class Hello {

  @OperonTransaction()  // Declare this function to be a transaction.
  static async helloTransaction(ctxt: TransactionContext<Knex>, user: string) {
    // Retrieve and increment the number of times this user has been greeted.
    const rows = await ctxt.client<operon_hello>("operon_hello")
      .insert({ name: user, greet_count: 1 })
      .onConflict("name") // If user is already present, increment greet_count.
        .merge({ greet_count: ctxt.client.raw('operon_hello.greet_count + 1') })
      .returning("greet_count");
    const greet_count = rows[0].greet_count;
    return `Hello, ${user}! You have been greeted ${greet_count} times.\n`;
  }
}
```
Operon supports the full Knex Postgres API, but doesn't allow manually committing or aborting transactions.
Instead, transactions automatically commit when the function successfully returns and abort and roll back if the function throws an exception.
If you need to orchestrate multiple transactions, use a [workflow](./workflow-tutorial).
