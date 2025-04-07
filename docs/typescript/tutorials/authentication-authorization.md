---
sidebar_position: 60
title: Authentication & Authorization
---

This section covers declarative authentication and authorization in DBOS.

DBOS supports modular, built-in declarative security: you can use the [`@Authentication`](./requestsandevents/http-serving-tutorial#authentication) class decorator to make user identities available to DBOS contexts. Further, you can associate operations with a list of permitted roles using the [`@DBOS.requiredRole`](../reference/transactapi/dbos-class.md#dbosrequiredrole) API.

:::info note
You can fully implement authentication and authorization using custom [HTTP middleware](./requestsandevents/http-serving-tutorial#middleware) which will run before the request reaches the handler. This section describes mechanisms DBOS provides to make it easier.
:::

## Authentication Middleware
To instruct DBOS to perform authentication for an HTTP endpoint, you can use the [`@Authentication`](./requestsandevents/http-serving-tutorial#authentication) class decorator to register HTTP middleware with your custom authentication logic (for example validating a [JSON Web Token](https://jwt.io/) and retrieving user credentials and permissions from the decoded token).
The decorator should return a structure containing identity and claimed roles:

```javascript
return {
    authenticatedUser: "Mary",
    authenticatedRoles: ["user", "admin"],
};
```

When serving a request from an HTTP endpoint, DBOS runs the authentication middleware before running the requested operation and makes this information available in the [context](../reference/transactapi/dbos-class#accessing-http-context).

## Authorization Decorators
To declare a list of roles that are authorized to run the methods in a class, use the [`@DBOS.defaultRequiredRole`](../reference/transactapi/dbos-class.md#dbosdefaultrequiredrole) class decorator:

```javascript
@DBOS.defaultRequiredRole(['user'])
class Operations
{
  // Most operations will be user-level
}
```

At runtime, before running an operation, DBOS verifies that the operation context contains an authenticated role listed in its required roles.
For exceptions, requiring more or less privilege than the default, you can specify [`@DBOS.requiredRole`](../reference/transactapi/dbos-class#dbosrequiredrole) at the method level

```javascript
@DBOS.defaultRequiredRole(['user'])
class Operations
{
  // Most operations will be user-level

  // Registering a new user doesn't require privilege
  @DBOS.requiredRole([])
  static async doRegister(firstName: string, lastName: string){}

  // Deleting a user requires escalated privilege
  @DBOS.requiredRole(['admin'])
  static async deleteOtherUser(otherUser: string){}
}
```

## Example
In this example, we demonstrate how to use DBOS declarative security:

```javascript
// Resolve request identity using HTTP headers.
// You can replace this logic with robust methods such as JWT.
const authenticationMiddleware = (ctx: MiddlewareContext) => {
  return {
    // Extract username from headers
    authenticatedUser: ctx.koaContext?.header.username,
    // Attribute role "appUser" to incoming requests
    authenticatedRoles: ["appUser"],
  };
};

@Authentication(authenticationMiddleware)
@DBOS.defaultRequiredRole("appUser")
export class Hello {
  ...
}
```

Here, we instruct the `Hello` class to run `authenticationMiddleware` on all incoming HTTP requests.
We require requests to authenticate with the `appUser` role to reach any HTTP handler declared in `Hello`.
The authentication function simply parses the username from the HTTP headers.
You can replace this with a more robust authentication method, such as [JSON Web Tokens](https://jwt.io/).

For applications that manage their own users, it is possible to access the database in a read-only way from the `MiddlewareContext` (Knex shown):

```typescript
  static async authMiddlware(ctx: MiddlewareContext) {
    if (!ctx.requiredRole || !ctx.requiredRole.length) {
      return;
    }
    const {user} = ctx.koaContext.query;
    if (!user) {
      throw new DBOSNotAuthorizedError("User not provided", 401);
    }
    const u = await ctx.query(
      (dbClient: Knex, uname: string) => {
        return dbClient<UserTable>(userTableName).select("username").where({ username: uname })
      }, user as string);

    if (!u || !u.length) {
      throw new DBOSNotAuthorizedError("User does not exist", 403);
    }

    // NOTE: Validate credentials against database

    ctx.logger.info(`Allowed in user: ${u[0].username}`);
    return {
      authenticatedUser: u[0].username!,
      authenticatedRoles: ["user"],
    };
  }

```

