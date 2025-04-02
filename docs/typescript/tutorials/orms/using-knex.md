---
sidebar_position: 12
title: Using Knex
description: Learn how to build applications with Knex and DBOS
---

## Knex Overview
[Knex](https://knexjs.org/) is a popular TypeScript query builder.
It allows developers to construct SQL queries in native TypeScript.
It also supports querying the database with [raw SQL](https://knexjs.org/guide/raw.html).

### Configuring Knex

To enable Knex, you must set the `userDbclient` field in your [DBOS configuration](../../reference/configuration.md) to `knex`.
For example:

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  userDbclient: 'knex',
});
await DBOS.launch();
```


### Using Knex

When using DBOS, database operations are performed in [transaction functions](../transaction-tutorial). Transaction functions must be annotated with the [`@DBOS.transaction`](../../reference/transactapi/dbos-class#dbostransaction) decorator.

Within the transaction function, access your [Knex client](https://knexjs.org/guide/query-builder.html) from `DBOS.knexClient`.
For example, this function inserts a new row into the `greetings` table:

```javascript
export class Greetings {
  @DBOS.transaction()
  static async InsertGreeting(friend: string, note: string) {
    await DBOS.knexClient('greetings').insert({
      name: friend,
      note: note
    });
  }
}
```

DBOS supports the full [Knex Postgres API](https://knexjs.org/guide/query-builder.html), but doesn't allow manually committing or aborting transactions.
Instead, transactions automatically commit when the function successfully returns and abort and roll back if the function throws an exception.
