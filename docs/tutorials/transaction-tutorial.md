---
sidebar_position: 2
title: Transactions
description: Learn how to perform database operations
---

To perform operations on your application database in DBOS, you use _transaction functions_.
As their name implies, these functions execute as [database transactions](https://en.wikipedia.org/wiki/Database_transaction).

Transaction functions must be annotated with the [`@Transaction`](../api-reference/decorators#transaction) decorator and must have a [`TransactionContext`](../api-reference/contexts#transactioncontextt) as their first argument.
As with other DBOS functions, inputs and outputs must be serializable to JSON.

The [`TransactionContext`](../api-reference/contexts#transactioncontextt) provides a `.client` field you can use to transactionally interact with the database, so you don't need to worry about managing database connections.
By default, this is a [Knex.js](./using-knex.md) client backed by a connection pool.
We like Knex because it's lightweight and helps us write fast and type-safe queries.
However, if you prefer a traditional ORM, we also support [TypeORM](./using-typeorm.md) and [Prisma](./using-prisma.md).

Here's an example of a transaction function written using raw SQL (with [knex.raw](https://knexjs.org/guide/raw.html)):

```javascript
export class Greetings {
  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {
    await ctxt.client.raw('INSERT INTO greetings (name, note) VALUES (?, ?)', [friend, note]);
  }
}
```

Here's the same function written using the Knex query builder:

```javascript
export class Greetings {
  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {
    await ctxt.client('greetings').insert({
      name: friend,
      note: note
    });
  }
}
```
DBOS supports the full [Knex Postgres API](https://knexjs.org/guide/query-builder.html), but doesn't allow manually committing or aborting transactions.
Instead, transactions automatically commit when the function successfully returns and abort and roll back if the function throws an exception.
If you need to orchestrate multiple transactions, use a [workflow](./workflow-tutorial).

Assuming you are not using database transactions, as seen in the [puppeteer example](https://github.com/qianl15/dbos-puppeteer/tree/main), switch your migrations settings in dbos.config.yml  (found in the original setup) from this: 

``` 
  migrate:
    - npx knex migrate:latest
``` 

to this:

```
migrate:
    - echo 'no migrations'`  
```

and delete the migrations folder or else you will get an error re: running a migration.
