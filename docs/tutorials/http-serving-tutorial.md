---
sidebar_position: 1
title: HTTP Serving
description: Learn how to serve HTTP requests
---

In this guide, you'll learn how to make DBOS applications accessible through HTTP.

Any function can be made into an HTTP endpoint by annotating it with an [endpoint decorator](../api-reference/decorators#http-api-registration-decorators), causing DBOS to use that function to serve that endpoint.
You can apply an endpoint decorator either to a new function without any other decorators or to an existing function with an [`@Transaction`](../api-reference/decorators#transaction), [`@Workflow`](../api-reference/decorators#workflow), or [`@Communicator`](../api-reference/decorators#communicator) decorator.
In the latter case, the order of the decorators doesn't matter.
Here's an example of a new function with an endpoint decorator:

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, @ArgSource(ArgSources.URL) name: string) {
  return `Greeting, ${name}`;
}
```
Here's an example applying an endpoint decorator to an existing transaction:

```javascript
@PostApi('/clear/:user')
@Transaction()
static async clearTransaction(ctxt: TransactionContext<Knex>, @ArgSource(ArgSources.URL) user: string) {
  await ctxt.client.raw("DELETE FROM dbos_hello WHERE NAME = ?", [user]);
  return `Cleared greet_count for ${user}!\n`;
}
```

DBOS currently supports two endpoint decorators, [`GetApi`](../api-reference/decorators#getapi) (HTTP `GET`) and [`PostApi`](../api-reference/decorators#postapi) (HTTP `POST`).
Each associates a function with an HTTP URL.

:::info

You might be wondering why we don't talk about setting up an HTTP server.
It's because DBOS is _serverless_.
When you run an locally app with `npx dbos start`, we manage the HTTP server for you, using the endpoints and configuration you specify with decorators.

:::

### Handlers

A function annotated with an endpoint decorator but no other decorators is called a _handler_ and must take a [`HandlerContext`](../api-reference/contexts#handlercontext) as its first argument, like in the first example above.
Handlers can [invoke](../api-reference/contexts#handlerctxtinvoketargetclass-workflowuuid) other functions and directly access HTTP requests and responses.
However, DBOS makes no guarantees about handler execution: if a handler fails, it is not automatically retried.
You should use handlers when you need to access HTTP responses directly or when you are writing a lightweight task that does not need the strong guarantees of transactions and workflows.

### Inputs and HTTP Requests

Any DBOS method invoked via HTTP request can access the raw request from its `context.request` field.

When a function has arguments other than its context (e.g., `name: String` in the snippets above), DBOS automatically parses them from the HTTP request, and returns an error to the client if arguments were not provided.

Arguments are parsed from three places by default:

1. For GET requests, from a URL query string parameter.
2. For POST requests, from an HTTP body field.
3. From a URL path parameter, if there are placeholders specified in the decorated URL.

In all cases, the parameter name must match the function argument name (unless [`@ArgName`](../api-reference/decorators#argname) is specified). In the first snippet above, `/clear/:name` matches `name: string`.
Default input parsing behavior can be configured using the [`@ArgSource`](../api-reference/decorators#argsource) parameter decorator.
For example, in the `greetingEndpoint` snippet above the `@ArgSource(ArgSources.URL)` decorator configures the function to parse its `user` argument from the endpoint URL's `:user` path parameter.

By default, DBOS automatically validates parsed inputs, throwing an error if a function is missing required inputs or if the input received is of a different type than specified in the method signature. 
Validation can be turned off at the class level using [`@DefaultArgOptional`](../api-reference/decorators#defaultargoptional) or controlled at the parameter level using [`@ArgRequired`](../api-reference/decorators#argrequired) and [`@ArgOptional`](../api-reference/decorators#argoptional).

### Outputs and HTTP Responses

By default, if a function invoked via HTTP request returns successfuly, its return value is sent in the HTTP response body with status code `200` (or `204` if nothing is returned).
If the function throws an exception, the error message is sent in the response body with a `400` or `500` status code.
If the error contains a `status` field, the handler uses that status code instead.

If you need custom HTTP response behavior, you can use a handler to access the HTTP response directly.
DBOS uses [Koa](https://koajs.com/) for HTTP serving internally and the raw response can be accessed via the `.koaContext.response` field of [`HandlerContext`](../api-reference/contexts#handlercontext), which provides a [Koa response](https://koajs.com/#response).

### Middleware

DBOS supports running custom [Koa](https://koajs.com/) middleware for serving HTTP requests.
Middlewares are configured at the class level through the [`@KoaMiddleware`](../api-reference/decorators#koamiddleware) decorator.
Here is an example of a simple middleware looking for an HTTP header:
```javascript
import { Middleware } from "koa";

const middleware: Middleware = async (ctx, next) => {
  const contentType = ctx.request.headers["content-type"];
  await next();
};

@KoaMiddleware(middleware)
class Hello {
  ...
}
```
