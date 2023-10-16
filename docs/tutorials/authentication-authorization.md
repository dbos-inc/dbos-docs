---
sidebar_position: 9
title: Authentication and Authorization
description: Use declarative security and middleware in Operon
---

This section covers declarative authentication and authorization in Operon.

Operon supports modular, built-in declarative security: you can use the [`@Authentication`](../api-reference/decorators#authentication) class decorator to make user identities available to Operon contexts. Further, you can associate operations with a list of permitted roles using the [`@RequiredRole`](../api-reference/decorators#requiredrole) API.

:::info note
You can fully implement authentication and authorization using custom [HTTP middleware](../tutorials/http-serving-tutorial#middleware) which will run before the request reaches the handler. This section describes mechanisms Operon provides to make it easier.
:::

## Authentication Middleware
To instruct Operon to perform authentication for an HTTP endpoint, you can use the [`@Authentication`](../api-reference/decorators#authentication) class decorator to register HTTP middleware with your custom authentication logic (for example validating a [JSON Web Token](https://jwt.io/) and retrieving user credentials and permissions from the decoded token).
The decorator should return a structure containing identity and claimed roles:

```typescript
return {
    authenticatedUser: "Mary",
    authenticatedRoles: ["user", "admin"],
};
```

When serving a request from an HTTP endpoint, Operon runs the authentication middleware before running the requested operation and makes this information available in the operation's [context](../api-reference/contexts#operoncontext).

## Authorization Decorators
To declare a list of roles that are authorized to run the methods in a class, use the [`@DefaultRequiredRole`](../api-reference/decorators#defaultrequiredrole) class decorator:

```typescript
@DefaultRequiredRole(['user'])
class Operations
{
  // Most operations will be user-level
}
```

At runtime, before running an operation, Operon verifies that the operation context contains an authenticated role listed in its required roles.
For exceptions, requiring more or less privilege than the default, you can specify [`@RequiredRole`](../api-reference/decorators#requiredrole) at the method level

```typescript
@DefaultRequiredRole(['user'])
class Operations
{
  // Most operations will be user-level

  // Registering a new user doesn't require privilege
  @RequiredRole([])
  static async doRegister(ctx: OperonContext, firstName: string, lastName: string){}

  // Deleting a user requires escalated privilege
  @RequiredRole(['admin])
  static async deleteOtherUser(ctx: OperonContext, otherUser: string){}
}
```

## Example
In this example, we demonstrate how to use Operon declarative security:

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

