---
sidebar_position: 9
title: Authentication and Authorization
description: Use declarative security and middleware in Operon
---

This section covers declarative authentication and authorization in Operon.

Operon supports modular, built-in declarative security: you can use the [`@Authentication`](../api-reference/decorators#authentication) class decorator to expose users' identity to Operon contexts. Further, you can associate operations with a list of permitted roles using the [`@RequiredRole`](../api-reference/decorators#requiredrole) API.

:::info note
You can fully implement authentication and authorization using custom [HTTP middleware](../tutorials/http-serving-tutorial#middleware) which will run before the request reaches the handler. This section describes mechanisms Operon provides to make it easier.
:::

## Authentication Middleware
The [`@Authentication`](../api-reference/decorators#authentication) class decorator lets you register an HTTP middleware with your custom authentication and authorization logic (for example validating a [JSON Web Token](https://jwt.io/), retrieving user credentials from the decoded token and validated claimed permissions.) The decorator should return a structure containing identity and claimed roles:

```typescript
return {
    authenticatedUser: "Mary",
    authenticatedRoles: ["user", "admin"],
};
```

This information will be made available to the operation context when a request enters the system, before the operation is run.

## Authorization Decorators
You can declare a list of authorized roles at the class level with [`@DefaultRequiredRole`](../api-reference/decorators#defaultrequiredrole):

```typescript
@DefaultRequiredRole(['user'])
class Operations
{
  // Most operations will be user-level
}
```

If roles have been declared, at runtime, Operon will verify that the operation context contains an `authenticatedUser` listed in the required roles.
For exceptions, requiring more or less privilege than the default, [`@RequiredRole`](../api-reference/decorators#requiredrole) is specified at the method level

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
We demonstrate how to use Operon built-in declarative security:

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

In this example, we instruct the `Hello` class to interpose `authenticationMiddleware` between incoming requests and registered HTTP handlers. We also require users to have the role `admin` to reach any HTTP handler declared in `Hello`.
The authentication function simply parse the username from the HTTP headers.
You can replace this schema by robust ones, such as [JSON Web Token](https://jwt.io/).
After having identified the user, you can return this information to Operon.

