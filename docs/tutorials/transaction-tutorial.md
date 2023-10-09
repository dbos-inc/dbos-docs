---
sidebar_position: 3
title: Transactions
description: Write transactional code
---

An operon transaction is a function decorated with `@OperonTransaction` and taking a `TransactionContext` as a first argument. In this example, we will extend the `greetingEndpoint` to record greetings in the database.

First, let's add a new static function in the `Hello` class:
```tsx
@OperonTransaction()
static async hello(txnCtxt: TransactionContext, name: string) {
  const greeting = `Hello, ${name}!`
  const { rows } = await txnCtxt.pgClient.query<{ greeting_id: number }>("INSERT INTO OperonHello(greeting) VALUES ($1) RETURNING greeting_id", [greeting])
  return `Greeting ${rows[0].greeting_id}: ${greeting}`;
}
```

The function is annotated with the [OperonTransaction decoratator](../api-reference/decorators#OperonTransaction).
It takes as parameters a [`TransactionContext`](../api-reference/contexts#transactioncontext) and the `name` to greet. It uses the transaction context to insert a record in your database using a postgres client. Finally, it returns the greeting.

now, let's modify the `greetingEndpoint` to invoke the transaction:
```tsx
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, name: string) {
  return await ctx.invoke(Hello).hello(name);
}
```
- `ctx.invoke(Hello)` returns a proxy object containing all Operon operations registered with the `Hello` class
- `.hello(name)` calls the `hello` transaction with the `name` received in the HTTP request and returns a promise

Note Operon will automatically pass a `TransactionContext` to your registered transactions under the hood.

## Full code

```tsx
import { HandlerContext, OperonTransaction, TransactionContext, GetApi } from '@dbos-inc/operon'

export class Hello {
  @OperonTransaction()
  static async hello(txnCtxt: TransactionContext, name: string) {
	const greeting = `Hello, ${name}!`
	const { rows } = await txnCtxt.pgClient.query<{ greeting_id: number }>("INSERT INTO OperonHello(greeting) VALUES ($1) RETURNING greeting_id", [greeting])
	return `Greeting ${rows[0].greeting_id}: ${greeting}`;
  }

  @GetApi('/greeting/:name')
  static async greetingEndpoint(ctx: HandlerContext, name: string) {
    return await ctx.invoke(Hello).hello(name);
  }
}
```