---
sidebar_position: 11
title: Using Drizzle
description: Learn how to build applications with Drizzle and DBOS
---

[Drizzle](https://orm.drizzle.team/) is a lightweight TypeScript ORM.
It allows developers to construct SQL queries in native TypeScript.
It also supports querying the database with [raw SQL](https://orm.drizzle.team/docs/sql).

### Configuring Drizzle

To enable Drizzle, you must set the `userDbclient` field in your [DBOS configuration](../../reference/configuration.md) to `drizzle`.
For example:

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  userDbclient: 'drizzle',
});
await DBOS.launch();
```


### Using Drizzle

When using DBOS, database operations are performed in [transaction functions](../transaction-tutorial). Transaction functions must be annotated with the [`@DBOS.transaction`](../../reference/transactapi/dbos-class#dbostransaction) decorator.

Within the transaction function, access your [Drizzle client](https://orm.drizzle.team/docs/overview) from `DBOS.sqlClient` or `DBOS.drizzleClient`.

For example, this function inserts a new row into the `greetings` table:

```javascript
export const greetings = pgTable('greetings', {
  name: text('name'),
  note: text('note')
});

function getClient() { return DBOS.drizzleClient as NodePgDatabase; }

export class DBOSGreetings {
  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    await getClient().insert(greetings).values({name: name, note: note});
  }
}
```
