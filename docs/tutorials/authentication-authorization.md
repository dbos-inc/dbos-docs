---
sidebar_position: 1
title: Authentication and Authorization
description: Use declarative security and middleware in Operon
---

# Authentication and Authorization

This section covers two aspects of declarative security in Operon: authentication and authorization.

-   [Background Information](#background-information)
    -   [Declarative Security](#declarative-security)
    -   [Users And Roles](#users-and-roles)
-   [Authorization Decorators](#authorization-decorators)
    -   [Method Decorators](#method-decorators)
    -   [Class Decorators](#class-decorators)
-   [Authentication Middleware](#authentication-middleware)
    -   [HTTP Registration](#http-registration)
    -   [Other Entry Points](#other-entry-points)
-   [Example Code](#example code)
        -   [Bank](#bank)
        -   [Shop](#shop)
        -   [Social](#social)

## Background Information

### Declarative Security

### Users And Roles

## Authorization Decorators

### Method Decorators

### Class Decorators

## Authentication Middleware

### HTTP Registration

### Other Entry Points

## Example Code
Each of the large Operon sample applications uses a different approach to authentication.  All of them use declarative role-based authorization.

### Bank
In Bank, authentication is performed in the front end via an external service, and passed to the back end via JWT tokens and HTTP headers.

### Shop
Shop isn't secure and needs work.

### Social
YKY Social uses its own backend database table to create and manage users.
