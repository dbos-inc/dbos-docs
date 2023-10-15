---
sidebar_position: 1
title: HTTP Serving
description: Learn how to serve HTTP requests
---

In this guide, you'll learn how to serve HTTP requests with Operon.

Any Operon function can be made into an HTTP endpoint by annotating it with an [endpoint decorator](../api-reference/decorators#http-api-registration-decorators), causing Operon to use that function to serve that endpoint.
You can apply an endpoint decorator either to a new function without any other decorators or to an existing function with an [`@OperonTransaction`](../api-reference/decorators#operontransaction), [`@OperonWorkflow`](../api-reference/decorators#operonworkflow), or [`@OperonCommunicator`](../api-reference/decorators#operoncommunicator) decorator.
In the latter case, the order of the decorators doesn't matter.
Here's an example of a new function with an endpoint decorator:

```javascript
  @GetApi('/greeting/:name')
  static async greetingEndpoint(ctx: HandlerContext, @ArgSource(ArgSources.URL) name: string) {
	  return `Greeting, ${name}`;
  }
```
Here's an example applying an endpoint decorator to an existing transaction (from our [quickstart](../getting-started/quickstart-programming-1.md)):

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

Operon currently supports two endpoint decorators, [`GetApi`](../api-reference/decorators#getapi) (HTTP `GET`) and [`PostApi`](../api-reference/decorators#postapi) (HTTP `POST`).
Each associates a function with an HTTP URL.

:::info

You might be wondering why we don't talk about setting up an HTTP server.
That's because Operon is a _serverless_ framework: we launch and manage the server for you when you start your app with `npx operon start`, using the endpoints and configuration you specify with decorators.

:::

### Handlers

A function annotated with an endpoint decorator but no other decorators is called a _handler_ and must take a [`HandlerContext`](../api-reference/contexts#handlercontext) as its first argument, like in the first example above.
Handlers can [invoke](../api-reference/contexts#handlerctxtinvoketargetclass-workflowuuid) other functions and directly access HTTP requests and responses.
However, Operon makes no guarantees about handler execution: if a handler fails, it is not automatically retried.
You should use handlers when you need to access HTTP responses directly or when you are writing a lightweight task that does not need the strong guarantees of transactions and workflows.

### Inputs and HTTP Requests

Any Operon method invoked via HTTP request can access the raw request from its `context.request` field.

When a function has arguments other than its context (e.g., `name: String` in the snippets above), Operon automatically parses them from the HTTP request, and returns an error to the client if arguments were not provided.

Arguments are parsed from three places by default:

1. For GET requests, from a URL query string parameter.
2. For POST requests, from an HTTP body field.
3. From an URL path parameter, if there are placeholders specified in the decorated URL.

In all cases, the parameter name must match the function argument name (unless [`@ArgName`](../api-reference/decorators#argname) is specified). In the first snippet above, `/clear/:name` matches `name: String`.
Default input parsing behavior can be configured using the [`@ArgSource`](../api-reference/decorators#argsource) parameter decorator.

By default, Operon automatically validates parsed inputs, throwing an error if a function is missing required inputs or if the input received is of a different type than specified in the method signature. 
Validation can be turned off at the class level using [`@DefaultArgOptional`](../api-reference/decorators#defaultargoptional) or controlled at the parameter level using [`@ArgRequired`](../api-reference/decorators#argrequired) and [`@ArgOptional`](../api-reference/decorators#argoptional).

### Outputs and HTTP Responses

By default, if an Operon function invoked via HTTP request returns successfuly, its return value is sent in the HTTP response body with status code `200` (or `204` if nothing is returned).
If the function throws an exception, the error message is sent in the response body with a `400` or `500` status code.
If the error contains a `status` field, Operon uses that status code instead.

If you need custom HTTP response behavior, you can use a handler to access the HTTP response directly.
Operon uses [Koa](https://koajs.com/) for HTTP serving internally and the raw response can be accessed via the `.koaContext.response` field of [`HandlerContext`](../api-reference/contexts#handlercontext), which provides a [Koa response](https://koajs.com/#response).

### Middleware

Operon supports running custom [Koa](https://koajs.com/) middleware for serving HTTP requests.
Middlewares are configured at the class level through the [`@KoaMiddleware`](../api-reference/decorators#koamiddleware) decorator.
