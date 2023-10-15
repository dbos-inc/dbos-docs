---
sidebar_position: 5
title: Idempotency
description: Learn how to make operations idempotent.
---

In this guide, you'll learn how to make operations idempotent.

Operon allows users to send any request with an _idempotency key_ to guarantee it only executes once, even if the request is sent multiple times.
This is especially useful if your operations have side effects like making a payment or sending an email.

### Setting Idempotency Keys

Operon idempotency keys are 128-bit [UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier).
Idempotency keys are required to be globally unique for your application.
There are many popular libraries for generating UUIDs in Typescript, such as [uuid.js](https://www.npmjs.com/package/uuid).

To make a request idempotent, generate a UUID and set the request's `operon-workflowuuid` header field to that UUID.
No matter how many times you send that request, as long as each request has the idempotency key set, the operation will only execute once.

:::info

It's not a coincidence that both idempotency keys and [workflow identities](./workflow-tutorial#workflow-identity) are UUIDs.
If you run a workflow with an idempotency key UUID, the identity of that execution is set to that UUID.

:::

### Manually Setting Idempotency Keys

Idempotency keys are not automatically used for [handlers](./http-serving-tutorial#handlers).
Instead, if you invoke an operation from a handler, you can manually pass in an idempotency key as an argument to [`context.invoke`](../api-reference/contexts#handlerctxtinvoketargetclass-workflowuuid).
The syntax for invoking `Class.operation` with an idempotency key is:

```javascript
  @GetApi(...)
  static async exampleHandler(ctxt: HandlerContext, ...) {
    const idempotencyKey = ...;
    await ctxt.invoke(Class, idempotencyKey).operation(...);
  }
```

### Idempotency Example

Let's look at this workflow endpoint from the final step of our [quickstart guide](../getting-started/quickstart-programming-2):

```javascript
  @GetApi('/greeting/:user')
  @OperonWorkflow()
  static async helloWorkflow(ctxt: WorkflowContext, user: string) {
    const greeting = await ctxt.invoke(Hello).helloTransaction(user);
    try {
      await ctxt.invoke(Hello).greetPostman(greeting);
      return greeting;
    } catch (e) {
      ctxt.logger.error(e);
      await ctxt.invoke(Hello).rollbackHelloTransaction(user);
      return `Greeting failed for ${user}\n`
    }
  }
```

Each request to this endpoint has the side effect of incrementing a database counter.
However, if we set the idempotency key, we can resend a request multiple times without side effects:

If we `curl` this endpoint normally multiple times, each request increments the counter:

```bash
curl http://localhost:3000/greeting/operon
```

However, if we set the idempotency key in the header and resend the request many times, each request returns the same response and the workflow only executes once:

```bash
curl -H "operon-workflowuuid: 123e4567-e89b-12d3-a456-426614174000" http://localhost:3000/greeting/operon
```