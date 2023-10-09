---
sidebar_position: 2
title: HTTP Serving
description: Learn how to serve HTTP requests
---

In this guide, you'll learn how to serve HTTP requests with Operon.
Any Operon function can be made into an HTTP endpoint by annotating it with an _endpoint decorator_.
For example:

```javascript
  @GetApi('/greeting/:name')
  static async greetingEndpoint(ctx: HandlerContext, name: string) {
	  return `Greeting, ${name}`;
  }
```

We currently support two endpoint decorators, [`GetApi`](../api-reference/decorators#getapi) (HTTP `GET`) and [`PostApi`](../api-reference/decorators#postapi) (HTTP `POST`).
Each associates a function with an HTTP URL.

### Handlers

A function annotated with an endpoint decorator but no other decorators like is called a _handler_ and must take a [`HandlerContext`](..) as its first argument, like in the example above.
Handlers can invoke other functions and directly access HTTP requests and responses.
However, Operon makes no guarantees about handler execution: if a handler fails, it is not automatically retried.
You should use handlers when you need to access HTTP responses directly or when you're doing a lightweight task that doesn't need the strong guarantees of transactions and workflows.

You don't need a handler to serve a transaction, workflow, or communicator from an HTTP URL.
You can also annotate your function with an endpoint decorator in addition to its [`@OperonTransaction`](../api-reference/decorators#operontransaction), [`@OperonWorkflow`](../api-reference/decorators#operonworkflow), or [`@OperonCommunicator`](../api-reference/decorators#operoncommunicator) decorator.
For example (from our [quickstart](..)):

```javascript
  @PostApi('/clear/:name')
  @OperonTransaction()
  static async clearTransaction(txnCtxt: KnexTransactionContext, name: string) {
    // Delete greet_count for a user.
    await txnCtxt.client<operon_hello>("operon_hello")
      .where({ name: name })
      .delete()
    return `Cleared greet_count for ${name}!\n`
  }
```

### Inputs and HTTP Requests

Any Operon method invoked via HTTP request can access the raw request from its `context.request` field.

If a function has arguments other than its context, Operon attempts to automatically parse them from the HTTP request.
Arguments can be parsed from three places:

1. From a URL query string parameter with the same name.
2. From an HTTP body field with the same name.
3. From an HTTP path parameter, if one is specified in the decorated URL.

Input parsing can be configured using the [`@ArgSource`](../api-reference/decorators#argsource) parameter decorator.

By default, Operon automatically validates parsed inputs, returning an error if a function is missing required inputs or if the input received is of a different type than specified in the method signature. 
Validation can be turned off at the class level using [`@DefaultArgOptional`](..) or controlled at the parameter level using [`@ArgRequired`](..) and [`@ArgOptional`](..).

### Outputs and HTTP Responses

By default, if an Operon function invoked via HTTP request returns successfuly, its return value is sent in the body of the HTTP response with status code `200`.
If the function throws an exception, the error message is sent in the response body with a `400` or `500` status code.

If you need custom HTTP response behavior, you can use a handler to access the HTTP response directly.
Operon uses [Koa](https://koajs.com/) for HTTP serving internally, so the raw response can be accessed via the `.koaContext.response` field of [`HandlerContext`](..), which returns a [Koa response](https://koajs.com/#response).

### Middleware

Operon supports running custom [Koa](https://koajs.com/) middleware for serving HTTP requests.
Middleware is configured at the class level through the [`@KoaMiddleware`](../api-reference/decorators@koamiddleware) decorator.