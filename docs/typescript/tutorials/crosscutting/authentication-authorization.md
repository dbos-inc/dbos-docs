---
sidebar_position: 9
title: Authentication and Authorization
description: Use declarative security and middleware in DBOS
---

This section covers declarative authentication and authorization in DBOS.

DBOS supports modular, built-in declarative security: you can use the [`@Authentication`](../../reference/transactapi/oldapi/decorators#authentication) class decorator to make user identities available to DBOS contexts. Further, you can associate operations with a list of permitted roles using the [`@RequiredRole`](../../reference/transactapi/oldapi/decorators#requiredrole) API.

:::info note
You can fully implement authentication and authorization using custom [HTTP middleware](../requestsandevents/http-serving-tutorial#middleware) which will run before the request reaches the handler. This section describes mechanisms DBOS provides to make it easier.
:::

:::tip
If you're generating an [OpenAPI interface definition](https://spec.openapis.org/oas/v3.0.3) for your DBOS application, 
you can specify security scheme information via the `@OpenApiSecurityScheme` decorator. 
Please see the [OpenAPI Tutorial](../development/openapi-tutorial.md#specify-openapi-security-scheme-and-requirements) for more information.
:::

## Authentication Middleware
To instruct DBOS to perform authentication for an HTTP endpoint, you can use the [`@Authentication`](../../reference/transactapi/oldapi/decorators#authentication) class decorator to register HTTP middleware with your custom authentication logic (for example validating a [JSON Web Token](https://jwt.io/) and retrieving user credentials and permissions from the decoded token).
The decorator should return a structure containing identity and claimed roles:

```javascript
return {
    authenticatedUser: "Mary",
    authenticatedRoles: ["user", "admin"],
};
```

When serving a request from an HTTP endpoint, DBOS runs the authentication middleware before running the requested operation and makes this information available in the operation's [context](../../reference/transactapi/oldapi/contexts#dboscontext).

## Authorization Decorators
To declare a list of roles that are authorized to run the methods in a class, use the [`@DefaultRequiredRole`](../../reference/transactapi/oldapi/decorators#defaultrequiredrole) class decorator:

```javascript
@DefaultRequiredRole(['user'])
class Operations
{
  // Most operations will be user-level
}
```

At runtime, before running an operation, DBOS verifies that the operation context contains an authenticated role listed in its required roles.
For exceptions, requiring more or less privilege than the default, you can specify [`@RequiredRole`](../../reference/transactapi/oldapi/decorators#requiredrole) at the method level

```javascript
@DefaultRequiredRole(['user'])
class Operations
{
  // Most operations will be user-level

  // Registering a new user doesn't require privilege
  @RequiredRole([])
  static async doRegister(ctx: DBOSContext, firstName: string, lastName: string){}

  // Deleting a user requires escalated privilege
  @RequiredRole(['admin'])
  static async deleteOtherUser(ctx: DBOSContext, otherUser: string){}
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
@DefaultRequiredRole("appUser")
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

