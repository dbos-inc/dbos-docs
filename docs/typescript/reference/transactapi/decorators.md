---
sidebar_position: 40
title: Decorators
description: API reference for DBOS decorators.
---

# DBOS Decorators

## Background

[Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) in TypeScript are a way to declaratively alter classes, functions, and parameters. Decorators precede the decorated class, function, or parameter, and begin with `@`:
```typescript
  @Decorated
  class decorated {
  ...
  }
```
Decorators may or may not take arguments in parentheses `()`.  However, each specific decorator either requires or refuses parentheses. In the following, adding `()` after `@Required` will lead to an error, as will omitting `()` after `@LogMask`.
```
@Required @LogMask(LogMasks.HASH) password: string
```

While, in general, the order in which decorators are listed can affect the behavior, all decorators in the DBOS API are order-independent.  So this:
```typescript
  @DBOS.transaction()
  @DBOS.postApi("/follow")
  static async hello() {
  ...
  }
```

is the same as this:
```typescript
  @DBOS.postApi("/follow")
  @DBOS.transaction()
  static async hello() {
  ...
  }
```

### Enabling Decorators

DBOS uses [TypeScript "Stage 2" decorators](https://www.typescriptlang.org/docs/handbook/decorators.html).
If you initialize your project with [`npx -y @dbos-inc/create`](../tools/cli.md#npx-dbos-inccreate), these are automatically enabled.
Otherwise, you must enable them by supplying the following configuration to the TypeScript compiler (usually via the file `tsconfig.json`):

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  }
}
```

## `@DBOSInitializer`
This decorator is used to specify functions to be run at application instance initialization time.
`@DBOSInitializer` is intended for uses such as validating configuration, establishing connections to external (non-database) services, and so on.
It is not a good place for database schema migration, for that see our [migration commands](../tools/cli.md#npx-dbos-migrate).

The argument to `@DBOSInitializer` should be of type [`InitContext`](#initcontext).

```typescript
  @DBOSInitializer()
  static async init(ctx: InitContext) {
     // Use functions and config from ctx, report anything interesting with ctx.log
  }
```

### `InitContext`

[Class initialization functions](#dbosinitializer) and instance `initialize()` methods are provided with an `InitContext`, which provides access to configuration information, database access, and a logging facility.

#### Properties and Methods

- [logger](#initcontextlogger)
- [queryuserdb](#initcontextqueryuserdb)
- [getconfig](#initcontextgetconfig)

#### `InitContext.logger`

```typescript
readonly logger: Logger;
```

`logger` is available to record any interesting successes, failures, or diagnostic information that occur during initialization.

#### `InitContext.queryUserDB`

```typescript
queryUserDB<R>(sql: string, ...params: unknown[]): Promise<R[]>;
```

Accesses the user database directly with SQL.  This approach is to be used with caution, as using a string to represent SQL is not fully database independent and careless formation of the string can lead to SQL injection vulnerabilities.

#### `InitContext.getConfig`

```typescript
getConfig<T>(key: string, defaultValue?: T): T | undefined;
```
 
`getConfig` retrieves configuration information (from .yaml config file / environment).  If `key` is not present in the configuration, `defaultValue` is returned.


## HTTP Middleware Decorators

### `@Authentication`
Configures the DBOS HTTP server to perform authentication. All functions in the decorated class will use the provided function to act as an authentication middleware.
This middleware will make users' identity available to [DBOS functions](./dbos-class.md#retrieving-the-authenticated-user-and-roles). Here is an example:

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

### `@KoaBodyParser`
By default, the DBOS HTTP server uses a [`@koa/bodyparser`](https://github.com/koajs/bodyparser) middleware for parsing JSON message bodies.
To specify a different middleware for the body parser, use the `@KoaBodyParser` decorator at the class level.

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

### `@KoaCors`
[Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is an integral part of security in web browsers and similar clients.

By default, DBOS uses [`@koa/cors`](https://github.com/koajs/cors) middleware with a configuration from [`dbos-config.yaml`](../configuration#http).  (The defaults in this file are, in turn, extremely permissive, allowing all cross-origin requests, including those with credentials.)  If your application needs only a coarse configuration of CORS, such as disabling CORS, or enabling CORS only on whitelisted origins, the config file offers a simple option.

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

### `@KoaMiddleware`
Configures the DBOS HTTP server allow insertion of arbitrary Koa middlewares. All handler functions in the decorated class will use the provided middleware list.

```typescript
const exampleMiddleware: Koa.Middleware = async (ctx, next) => {
  await next();
};

@KoaMiddleware(exampleMiddleware)
class OperationEndpoints{
  ...
}
```

### `@KoaGlobalMiddleware`
Configures the DBOS HTTP server to add arbitrary Koa middleware for all requests.  Unlike [`@KoaMiddleware`](#koamiddleware), this also includes any requests made to URLs that are registered in other classes, or are not registered to any handlers at all, and may therefore be useful for debugging.

```typescript
import logger from 'koa-logger';

@KoaGlobalMiddleware(logger())
class OperationEndpoints{
  ...
}
```

Note that the `koa-logger` logs are not collected in DBOS Cloud, but will be useful if you are running in development / locally.  If you want to log Koa requests to the DBOS log, you may expand on something like the following:
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

## TypeORM Decorators

### `@OrmEntities`
Marks a class as using ORM entity classes.   (Currently this is used for [TypeORM](https://typeorm.io) integration only.)

```typescript
@OrmEntities([OrmEntity1, OrmEntity2])
export class User {}
```

This code will ensure that the TypeORM entity manager and repository knows about the entities in the list.