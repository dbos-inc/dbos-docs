---
sidebar_position: 5
title: Idempotency
description: Learn how to make operations idempotent.
---

In this guide, you'll learn how to make operations idempotent.

Operon allows users to send any request with an _idempotency key_ to guarantee it only executes once, even if the request is sent multiple times.
This is especially useful if your operation have side effects like mutating database tables or creating resources in external APIs.

### Setting Idempotency Keys

Operon idempotency keys are 128-bit [UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier).
Idempotency keys are required to be globally unique for your application.
There are many popular libraries for generating UUIDs in Typescript, such as [uuid.js](https://www.npmjs.com/package/uuid).

To make a request idempotent, generate a UUID and set the request's `operon-workflowuuid` header field to that UUID.
No matter how many times you send that request, as long as each request has the idempotency key set, the operation will only execute once.

### Manually Setting Idempotency Keys

Idempotency keys are not automatically used for [handlers](./http-serving-tutorial#handlers).
Instead, if you invoke an operation from a handler, you can manually pass in an idempotency key as an argument to [`context.invoke`](..).
The syntax for invoking `Class.operation` with an idempotecy key is:

```javascript
  @GetApi(...)
  static async helloHandler(handlerCtxt: HandlerContext, ...) {
    const idempotencyKey = ...;
    handlerCtxt.invoke(Class, idempotencyKey).operation(...);
  }
```

### Idempotency Example

Let's look at this workflow endpoint from the final step of our [quickstart guide](../getting-started/quickstart-programming-2):

```javascript
  @GetApi('/greeting/:name')
  @OperonWorkflow()
  static async helloWorkflow(wfCtxt: WorkflowContext, name: string) {
    const greeting = await wfCtxt.invoke(Hello).helloTransaction(name);
    try {
      await wfCtxt.invoke(Hello).postmanFunction(greeting);
      return greeting;
    } catch (e) {
      console.warn("Error sending request:", e);
      await wfCtxt.invoke(Hello).rollbackHelloTransaction(name);
      return `Greeting failed for ${name}\n`
    }
  }
```

Each request to this endpoint has the side effect of incrementing a database counter.
However, if we set the idempotency key, we can make many requests without side effects.

If we `curl` this endpoint normally multiple times, each request increments the counter:

```bash
curl http://localhost:3000/greeting/operon
```

However, if we set the idempotency key and send the request many times, each request returns the same response and the workflow only executes once:

```bash
curl -H "operon-workflowuuid: 123e4567-e89b-12d3-a456-426614174000" http://localhost:3000/greeting/operon
```