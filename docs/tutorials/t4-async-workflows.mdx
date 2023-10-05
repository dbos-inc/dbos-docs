---
sidebar_position: 5
title: Asynchronous workflows
description: Wait for a workflow to complete
---

Operon workflows are asynchronous by nature. Invoking a workflow returns a [Workflow Handle](../api-reference/workflow-handles) which you can use to inquire on a workflow status.

Let's assume our hello workflow became suddenly slow:

```tsx
@OperonWorkflow()
static async helloWorkflow(wfCtxt: WorkflowContext, name: string) {
  await sleep(1000);
  return await wfCtxt.invoke(Hello).helloTxn(name);
}
```

Our HTTP handler, knowing about this, can use the handle to determine whether the workflow is completed:

```tsx
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, name: string) {
  const wfHandle = await ctx.invoke(Hello).helloWorkflow(name);
  let wfStatus = await wfHandle.getStatus();
  while (wfStatus && wfStatus.status !== StatusString.SUCCESS) {
      ctx.log("Waiting for workflow to complete...");
      await sleep(100);
      wfStatus = await wfHandle.getStatus();
  }
  ctx.log(`Workflow completed with status ${wfStatus?.status}!`);
  return wfHandle.getResult();
}
```

Note:
- We can use `getStatus()` on a handle to retrieve a `WorkflowStatus` object. This object owns a `status` field which can take values `PENDING`, `SUCCESS`, `ERROR`
- if the workflow does not exist, `getStatus()` will return `null`, so you should check whether it is defined before using it
- We use Operon baked-in logger through the workflow context (`ctx.log()`)

## Full code


```tsx
import { HandlerContext, GetApi, OperonTransaction, OperonWorkflow, WorkflowContext, TransactionContext, StatusString } from '@dbos-inc/operon'

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Hello {
  @OperonTransaction()
  static async helloTxn(txnCtxt: TransactionContext, name: string) {
    const greeting = `Hello, ${name}!`
    const { rows } = await txnCtxt.pgClient.query<{ greeting_id: number }>("INSERT INTO OperonHello(greeting) VALUES ($1) RETURNING greeting_id", [greeting])
    return `Greeting ${rows[0].greeting_id}: ${greeting}`;
  }

  @OperonWorkflow()
  static async helloWorkflow(wfCtxt: WorkflowContext, name: string) {
    await sleep(1000);
    return await wfCtxt.invoke(Hello).helloTxn(name);
  }

  @GetApi('/greeting/:name')
  static async greetingEndpoint(ctx: HandlerContext, name: string) {
    const wfHandle = await ctx.invoke(Hello).helloWorkflow(name);
    let wfStatus = await wfHandle.getStatus();
    while (wfStatus && wfStatus.status !== StatusString.SUCCESS) {
        ctx.log("Waiting for workflow to complete...");
        await sleep(100);
        wfStatus = await wfHandle.getStatus();
    }
    ctx.log(`Workflow completed with status ${wfStatus?.status}!`);
    return wfHandle.getResult();
  }
}
```
