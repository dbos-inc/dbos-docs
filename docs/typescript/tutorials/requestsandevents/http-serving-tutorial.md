---
sidebar_position: 10
title: HTTP Serving
description: Learn how to serve HTTP requests
---

In this guide, you'll learn how to make DBOS applications accessible through DBOS's built-in, [koa](https://koajs.com/)-based HTTP server.

:::note
There is no need to use the DBOS HTTP server.  DBOS functions can be embedded in other HTTP servers, and there is no need to use HTTP in DBOS applications at all.  However, the DBOS HTTP handler service is the simplest way to get started in a new HTTP application, offering simple route handling, parameter parsing and validation, security, logging, etc.
:::

Any function can be made into an HTTP endpoint by annotating it with an [endpoint decorator](../../reference/transactapi/dbos-class#http-handling), causing DBOS to use that function to serve that endpoint.

You can apply an endpoint decorator either to a new function without any other decorators or to an existing function with a [`@DBOS.transaction`](../../reference/transactapi/dbos-class#dbostransaction), [`@DBOS.workflow`](../../reference/transactapi/dbos-class#dbosworkflow), or [`DBOS.step`](../../reference/transactapi/dbos-class#dbosstep) decorator.

Here's an example of a new function with an endpoint decorator:

```javascript
@DBOS.getApi('/greeting/:name')
static async greetingEndpoint(name: string) {
  return `Greeting, ${name}`;
}
```
Here's an example applying an endpoint decorator to an existing transaction (the order of the decorators doesn't matter):

```javascript
@DBOS.postApi('/greeting/:friend')
@DBOS.transaction()
static async insertGreeting(friend: string, note: string) {
  await DBOS.knexClient.raw('INSERT INTO greetings (name, note) VALUES (?, ?)', [friend, note]);
}
```

DBOS provides endpoint decorators for all HTTP verbs used in APIs: [`@DBOS.getApi`](../../reference/transactapi/dbos-class#dbosgetapi), [`@DBOS.postApi`](../../reference/transactapi/dbos-class#dbospostapi), [`@DBOS.putApi`](../../reference/transactapi/dbos-class#dbosputapi), [`@DBOS.patchApi`](../../reference/transactapi/dbos-class#dbospatchapi), and [`@DBOS.deleteApi`](../../reference/transactapi/dbos-class#dbosdeleteapi).
Each associates a function with an HTTP URL.


### Inputs and HTTP Requests

When a function has arguments other than its context, DBOS automatically parses them from the HTTP request, and returns an error to the client if they are not found.

Arguments can be parsed from three places:

#### 1. URL Path Parameters

You can include a path parameter placeholder in a URL by prefixing it with a colon, like `name` in this example:

```javascript
@DBOS.getApi('/greeting/:name')
static async greetingEndpoint(name: string) {
  return `Greeting, ${name}`;
}
```

Then, give your method an argument with a matching name (such as `name: string` above) and it is automatically parsed from the path parameter.

For example, if we send our app this request, then our method is called with `name` set to `dbos`:

```
GET /greeting/dbos
```

#### 2. URL Query String Parameters

[`GET`](../../reference/transactapi/dbos-class#dbosgetapi) and [`DELETE`](../../reference/transactapi/dbos-class#dbosdeleteapi) endpoints automatically parse arguments from query strings.

For example, the following endpoint expects the `id` and `name` parameters to be passed through a query string:

```javascript
@DBOS.getApi('/example')
static async exampleGet(id: number, name: string) {
  return `${id} and ${name} are parsed from URL query string parameters`;
}
```

If we send our app this request, then our method is called with `id` set to `123` and `name` set to `dbos`:

```
GET /example?id=123&name=dbos
```

#### 3. HTTP Body Fields

[`POST`](../../reference/transactapi/dbos-class#dbospostapi), [`PATCH`](../../reference/transactapi/dbos-class#dbospatchapi), and [`PUT`](../../reference/transactapi/dbos-class#dbosputapi) endpoints automatically parse arguments from the HTTP request body.

For example, the following endpoint expects the `id` and `name` parameters to be passed through the HTTP request body:

```javascript
@DBOS.postApi('/example')
static async examplePost(id: number, name: string) {
  return `${id} and ${name} are parsed from the HTTP request body`;
}
```

If we send our app this request, then our method is called with `id` set to `123` and `name` set to `dbos`:


```javascript
POST /example
Content-Type: application/json

{
  "name": "dbos",
  "id": 123
}
```

:::tip
When sending an HTTP request with a JSON body, make sure you set the [`Content-Type`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) header to `application/json`.
:::

#### Raw Requests

If you need finer-grained request parsing, any DBOS method invoked via HTTP request can access raw request information from [`DBOS.request`](../../reference/transactapi/dbos-class#accessing-http-context). This returns the following information:

```typescript
interface HTTPRequest {
  readonly headers?: IncomingHttpHeaders;  // A node's http.IncomingHttpHeaders object.
  readonly rawHeaders?: string[];          // Raw headers.
  readonly params?: unknown;               // Parsed path parameters from the URL.
  readonly body?: unknown;                 // parsed HTTP body as an object.
  readonly rawBody?: string;               // Unparsed raw HTTP body string.
  readonly query?: ParsedUrlQuery;         // Parsed query string.
  readonly querystring?: string;           // Unparsed raw query string.
  readonly url?: string;                   // Request URL.
  readonly ip?: string;                    // Request remote address.
}
```

### Outputs and HTTP Responses

If a function invoked via HTTP request returns successfully, its return value is sent in the HTTP response body with status code `200` (or `204` if nothing is returned).

If the function throws an exception, the error message is sent in the response body with a `400` or `500` status code.
If the error contains a `status` field, the response uses that status code instead.

If you need custom HTTP response behavior, you can use a handler to access the HTTP response directly.
DBOS uses [Koa](https://koajs.com/) for HTTP serving internally and the raw response can be accessed via [`DBOS.koaContext.response`](../../reference/transactapi/dbos-class#accessing-http-context), which provides a [Koa response](https://koajs.com/#response).

### Handlers

A function annotated with an endpoint decorator but no other decorators is called a _handler_.
Handlers can call other DBOS functions and directly access HTTP requests and responses.
However, DBOS makes no guarantees about handler execution: if a handler fails, it is not automatically retried.
You should use handlers when you need to access HTTP requests or responses directly or when you are writing a lightweight task that does not need the [strong guarantees of transactions and workflows](../workflow-tutorial#reliability-guarantees).

### Body Parser
By default, DBOS uses [`@koa/bodyparser`](https://github.com/koajs/bodyparser) to support JSON in requests.  If this default behavior is not desired, you can configure a custom body parser with the `@KoaBodyParser` decorator.

```typescript
import { bodyParser } from "@koa/bodyparser";

@KoaBodyParser(bodyParser({
  extendTypes: {
    json: ["application/json", "application/custom-content-type"],
  },
  encoding: "utf-8"
}))
class OperationEndpoints {
}
```

### CORS

[Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is a security feature that controls access to resources from different domains. DBOS uses [`@koa/cors`](https://github.com/koajs/cors) with a permissive default configuration.

If more complex logic is needed, or if the CORS configuration differs between operation classes, the `@KoaCors` class-level decorator can be used to specify the CORS middleware in full.

```typescript
import cors from "@koa/cors";

@KoaCors(cors({
  credentials: true,
  origin:
    (o: Context)=>{
      const whitelist = ['https://us.com','https://partner.com'];
      const origin = o.request.header.origin ?? '*';
      return (whitelist.includes(origin) ? origin : '');
    }
}))
class EndpointsWithSpecialCORS {
}
```

### Middleware

DBOS supports running arbitrary [Koa](https://koajs.com/) middleware for serving HTTP requests.
Middlewares are configured at the class level through the `@KoaMiddleware` decorator.
Here is an example of a simple middleware checking an HTTP header:
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

### Global Middleware

The `@KoaMiddleware` decorator above only places middleware on registered routes within the decorated class.  It is sometimes desired to add middleware to all routes globally, including on routes that are not registered at all.

For example, to install logging that would pick up on 404 errors or other bad requests during development, `koa-logger` could be installed as a global middleware
```typescript
import logger from 'koa-logger';

@KoaGlobalMiddleware(logger())
class OperationEndpoints{
  ...
}
```

If more detail is required, or to ensure that logs go to the DBOS log, a custom logger can be implemented:
```typescript
// Logging middleware
const logAllRequests = () => {
    return async (ctx: Koa.Context, next: Koa.Next) => {
        const start = Date.now();

        // Log the request method and URL
        DBOS.logger.info(`[Request] ${ctx.method} ${ctx.url}`);

        let ok = false;
        try {
            await next();
            ok = true;
        }
        finally {
            const ms = Date.now() - start;
            if (ok) {
                // Log the response status and time taken
                DBOS.logger.info(`[Response] ${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
            }
            else {
                // Log error response
                DBOS.logger.warn(`[Exception] ${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
            }
        }
    };
};

@KoaGlobalMiddleware(logAllRequests())
class OperationEndpoints{
  ...
}
```

### `@Authentication`
Configures the DBOS HTTP server to perform authentication. All functions in the decorated class will use the provided function to act as an authentication middleware.
This middleware will make users' identity available to [DBOS functions](../../reference/transactapi/dbos-class#retrieving-the-authenticated-user-and-roles). Here is an example:

```typescript
async function exampleAuthMiddleware (ctx: MiddlewareContext) {
  if (ctx.requiredRole.length > 0) {
    const { userid } = ctx.koaContext.request.query;
    const uid = userid?.toString();

    if (!uid || uid.length === 0) {
      const err = new DBOSNotAuthorizedError("Not logged in.", 401);
      throw err;
    }
    else {
      if (uid === 'bad_person') {
        throw new DBOSNotAuthorizedError("Go away.", 401);
      }
      return {
        authenticatedUser: uid,
        authenticatedRoles: (uid === 'a_real_user' ? ['user'] : ['other'])
      };
    }
  }
}

@Authentication(exampleAuthMiddleware)
class OperationEndpoints {
  @DBOS.getApi("/requireduser")
  @DBOS.requiredRole(['user'])
  static async checkAuth() {
    return `Please say hello to ${DBOS.authenticatedUser}`;
  }
}
```

The interface for the authentication middleware is:
```typescript
/**
 * Authentication middleware executing before requests reach functions.
 * Can implement arbitrary authentication and authorization logic.
 * Should throw an error or return an instance of `DBOSHttpAuthReturn`
 */
export type DBOSHttpAuthMiddleware = (ctx: MiddlewareContext) => Promise<DBOSHttpAuthReturn | void>;

export interface DBOSHttpAuthReturn {
  authenticatedUser: string;
  authenticatedRoles: string[];
}
```

The authentication function is provided with a ['MiddlewareContext'](#middlewarecontext), which allows access to the request, system configuration, logging, and database access services.

### `MiddlewareContext`

`MiddlewareContext` is provided to functions that execute against a request before entry into handler, transaction, and workflow functions.  These middleware functions are generally executed before, or in the process of, user authentication, request validation, etc.  The context is intended to provide read-only database access, logging services, and configuration information.

#### Properties and Methods

- [logger](#middlewarecontextlogger)
- [span](#middlewarecontextspan)
- [koaContext](#middlewarecontextkoacontext)
- [name](#middlewarecontextname)
- [requiredRole](#middlewarecontextrequiredrole)
- [getConfig](#middlewarecontextgetconfig)
- [query](#middlewarecontextquery)

#### `MiddlewareContext.logger`

```typescript
readonly logger: DBOSLogger;
```

`logger` is available to record any interesting successes, failures, or diagnostic information that occur during middleware processing.

#### `MiddlewareContext.span`
```typescript
readonly span: Span;
```
`span` is the tracing span in which the middleware is being executed.

#### `MiddlewareContext.koaContext`

```typescript
readonly koaContext: Koa.Context;
```

`koaContext` is the Koa context, which contains the inbound HTTP request associated with the middleware invocation.

#### `MiddlewareContext.name`

```typescript
readonly name: string;
```

`name` contains the name of the function (handler, transaction, workflow) to be invoked after successful middleware processing.

#### `MiddlewareContext.requiredRole`

```typescript
readonly requiredRole: string[];
```

`requiredRole` contains the list of roles required for the invoked operation.  Access to the function will granted if the user has any role on the list.  If the list is empty, it means there are no authorization requirements and may indicate that authentication is not required.

#### `MiddlewareContext.getConfig`

```typescript
getConfig<T>(key: string, deflt: T | undefined) : T | undefined
```

`getConfig` retrieves configuration information (from .yaml config file / environment).  If `key` is not present in the configuration, `defaultValue` is returned.

#### `MiddlewareContext.query`

```typescript
  query<C extends UserDatabaseClient, R, T extends unknown[]>(qry: (dbclient: C, ...args: T) => Promise<R>, ...args: T): Promise<R>;
```

The `query` function provides read access to the database.
To provide a scoped database connection and to ensure cleanup, the `query` API works via a callback function.
The application is to pass in a `qry` function that will be executed in a context with access to the database client `dbclient`.
The provided `dbClient` will be a `Knex` or TypeORM `EntityManager` or `PrismaClient` depending on the application's choice of SQL access library.
This callback function may take arguments, and return a value.

Example, for Knex:
```typescript
  const u = await ctx.query(
    // The qry function that takes in a dbClient and a list of arguments (uname in this case)
    (dbClient: Knex, uname: string) => {
      return dbClient<UserTable>(userTableName).select("username").where({ username: uname })
    },
    userName // Input value for the uname argument
  );
```

### Serving Static Content

While it is generally advised to serve static content from a CDN, [S3 Bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html), or similar, sometimes it is desired to serve a few static files from DBOS.  This can be done easily with a package such as `koa-send`:

```typescript
export class Serve {
    @DBOS.getApi('/static/:item') // Adjust route, or recursive wildcard, to suit
    static async serve(item: string) {
        return send(DBOS.koaContext, item, {root: 'static'}); // Adjust root to point to directory w/ files
    }
}
```

To install `koa-send`:
```bash
npm install koa-send; npm install --save-dev @types/koa-send 
```

