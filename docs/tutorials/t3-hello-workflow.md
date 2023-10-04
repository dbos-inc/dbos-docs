---
sidebar_position: 4
title: Workflows
description: Compose transactions within a workflow
---

An operon workflow composes transactions in a single unit of work with Oncce-And-Only-Once-Execution guarantees.
You can register a new workflow by annotating a function with the [`@OperonWorkflow()` decorator](../api-reference/decorators#operonworkflow):

```tsx
  @OperonWorkflow()
  static async helloWorkflow(wfCtxt: WorkflowContext, name: string) {
	return await wfCtxt.invoke(Hello).helloTxn(name);
  }
```

The first argument of the workflow is a [`WorkflowContext`](../api-reference/contexts#workflowcontext). We can use this context to invoke transactions, here `hello`, using `wfCtxt.invoke(Hello).helloTxn(name)`

## Full code

```tsx
import { HandlerContext, GetApi, OperonTransaction, OperonWorkflow, WorkflowContext, TransactionContext } from '@dbos-inc/operon'

export class Hello {
  @OperonTransaction()
  static async helloTxn(txnCtxt: TransactionContext, name: string) {
	const greeting = `Hello, ${name}!`
	const { rows } = await txnCtxt.pgClient.query<{ greeting_id: number }>("INSERT INTO OperonHello(greeting) VALUES ($1) RETURNING greeting_id", [greeting])
	return `Greeting ${rows[0].greeting_id}: ${greeting}`;
  }

  @OperonWorkflow()
  static async helloWorkflow(wfCtxt: WorkflowContext, name: string) {
	return await wfCtxt.invoke(Hello).helloTxn(name);
  }

  @GetApi('/greeting/:name')
  static async greetingEndpoint(ctx: HandlerContext, name: string) {
    return await ctx.invoke(Hello).helloWorkflow(name).then(x => x.getResult());
  }
}
```
