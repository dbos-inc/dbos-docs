---
sidebar_position: 2
title: Transactions
description: Learn how to perform database operations
---

In this guide, you'll learn how to perform database operations in Operon.

In Operon, your application's database is a first-class citizen.
To perform operations on it, you use a _transaction_ function.
As their name implies, these functions execute as [database transactions](https://en.wikipedia.org/wiki/Database_transaction).

Transaction functions must be annotated with the [`@OperonTransaction`](../api-reference/decorators#operontransaction) decorator and must have a [`TransactionContext`](..) as their first argument.
Like for other Operon functions, inputs and outputs must be serializable to JSON.
The [`TransactionContext`](..) provides a `.client` field you can use to transactionally interact with the database, so you don't need to worry about managing database connections.
By default, this is a [Knex.js](https://knexjs.org/) client.
We like Knex because it's lightweight and helps us write fast but type-safe queries.
However, if you prefer a traditional ORM, we also support [Prisma](..) and [TypeORM](..).

Here's an example of a transaction function (from the [quickstart](../getting-started/quickstart)) written using Knex:

```javascript
import { TransactionContext, OperonTransaction, GetApi, HandlerContext } from '@dbos-inc/operon'
import { Knex } from 'knex';

type KnexTransactionContext = TransactionContext<Knex>;

export interface operon_hello {
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
}
```
This function uses the Knex client to first look up `greet_count` for an input `name`, then increment it if it's already set or set it to 1 otherwise.
Operon executes all these operations in a single transaction, so there's no need to worry about race conditions between concurrent updates.
Operon supports the full Knex Postgres API, but doesn't allow manually committing or aborting transactions.
Instead, transactions automatically commit when the function successfully returns and abort and roll back if the function throws an exception.
If you need to orchestrate multiple transactions, use a [workflow](./workflow-tutorial).