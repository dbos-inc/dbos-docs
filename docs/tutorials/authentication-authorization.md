---
sidebar_position: 1
title: Authentication and Authorization
description: Use declarative security and middleware in Operon
---

# Authentication and Authorization

This section covers two aspects of declarative security in Operon: authentication and authorization.

-   [Background Information](#background-information)
    -   [Users And Roles](#users-and-roles)
    -   [Declarative Security](#declarative-security)
-   [Authorization Decorators](#authorization-decorators)
-   [Authentication Middleware](#authentication-middleware)
    -   [HTTP Registration](#http-registration)
    -   [Other Entry Points](#other-entry-points)
-   [Example Code](#example-code)
        -   [Bank](#bank)
        -   [Shop](#shop)
        -   [Social](#social)

## Background Information
Operon APIs make it easy to add role-based security to a backend application, and to automatically make a map of functions and their required roles for security auditing purposes.

### Users And Roles
In Operon, it is the job of a "middleware" to establish and authenticate the user associated with each inbound request.  The request should also be associated with the roles assigned to the user.  This authenticated user and roles are then passed around to each Operon function.

Before entry to any Operon function, the list of roles assigned to the current user is compared to the list of roles required to execute the function.  If the user has any of the required roles, execution proceeds; if not, an error is returned.

### Declarative Security
Programmers writing Operon functions list out the default roles required to execute functions in a class, and list required roles for any class methods that are exceptions from the class-level defaults.  Operon, with help from the authentication middleware, does the work of enforcing the declared authorization policy.

## Authorization Decorators
A list of authorized roles is first provided at the class level with [`@DefaultRequiredRole`](../api-reference/decorators.md/#defaultrequiredrole):
```typescript
@DefaultRequiredRole(['user'])
class Operations
{
  // Most operations will be user-level
}
```

For exceptions, requiring more or less privilege than the default,  [`@RequiredRole`](../api-reference/decorators.md/#requiredrole) is specified at the method level
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

## Authentication Middleware
The procedural details of identifying the user associated with an inbound request and validating any credentials varies from application to application.  A username+password may need to be checked against a database, a token or certificate may need to be decrypted and validated, etc.  This information may also be received in different ways.

For these reasons, Operon allows user-specified middleware functions to extract authentication information from requests.

### HTTP Registration
Operon can automatically register HTTP handlers based on endpoint decorators.  For this case, the [`@Authentication`](../api-reference/decorators.md/#authentication) class decorator is used to provide the middleware function to validate the HTTP request and extract the user and roles.

### Other Entry Points
For other Operon entrypoints, the authorized user and role should be placed in the `parentCtx` before invoking Operon:
```typescript
    operon.workflow(Operations.doOperation, {parentCtx: ctx}, "arg1", "arg2");
```

## Example Code
Each of the large Operon sample applications uses a different approach to authentication.  All of them use declarative role-based authorization.

### Bank
In Bank, authentication is performed in the front end via an external service, and passed to the back end via JWT tokens and HTTP headers.

### Shop
(Shop passes a cookie from the frontend as the authenticated user.  Perhaps this isn't secure and needs work?)

### Social
YKY Social uses its own backend database table to create and manage users.
