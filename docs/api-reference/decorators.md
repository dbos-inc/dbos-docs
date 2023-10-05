---
sidebar_position: 2
title: Decorator Reference
description: Usage of decorators in Operon, with exhaustive list
---

# Decorator Reference
-   [Background Information](#background-information)
    -   [Decorator Implementations](#decorator-implementations)
    -   [Typescript Compiler Flags](#typescript-compiler-flags)
-   [Decorator Locations](#decorator-locations)
    -   [Class Decorators](#class-decorators)
    -   [Method Decorators](#method-decorators)  
    -   [Parameter Decorators](#parameter-decorators)  
-   [Decorators Reference](#decorators-reference)
    -   [Operon Decorators](#operon-decorators)
        -   [`@OperonWorkflow`](#operonworkflow)
        -   [`@OperonTransaction`](#operontransaction)
        -   [`@OperonCommunicator`](#operoncommunicator)
    -   [HTTP API Registration Decorators](#http-api-registration-decorators)
        -   [`@GetApi`](#getapi)
        -   [`@PostApi`](#postapi)
        -   [`@ArgSource`](#argsource)
        -   [`@Authentication`](#authentication)
        -   [`@KoaMiddleware`](#koamiddleware)
    -   [Declarative Security Decorators](#declarative-security-decorators)
        -   [`@RequiredRoles`](#requiredroles)
        -   [`@DefaultRequiredRoles`](#defaultrequiredroles)
    -   [Input Validation Decorators](#input-validation-decorators)
        -   [`@Required`](#required)
        -   [`@ArgName`](#argname)
        -   [`@ArgDate`](#argdate)
        -   [`@ArgVarchar`](#argvarchar)
    -   [Logging and Tracing Decorators](#logging-and-tracing-decorators)
        -   [`@Debug`](#debug)
        -   [`@SkipLogging`](#skiplogging)
        -   [`@LogMask`](#logmask)
    -   [Other Decorators](#other-decorators)
        -   [TypeORM Decorators](#typeorm-decorators)
            -   [`@OrmEntities`](#ormentities)

## Background Information

TODO: Here is where we describe the nature of decorators - general appeal and use
TODO: Here is where we compare them to annotations
TODO: Here is where we say it doesn't matter what order you use them

### Decorator Implementations

TODO: Here is the sob story about Stage 2 vs 3

### Typescript Compiler Flags

TODO: Here is the emit metadata and experimental decorators compilers flags

## Decorator Locations

TODO: Here we describe class / method / parameter decorators

### Class Decorators

These go at the top of the class

### Method Decorators

These go right before the method

### Parameter Decorators

These go right before the arg: type

## Decorators Reference

### Operon Decorators

#### `@OperonWorkflow`
This decorator registers a method as an Operon workflow.

```typescript
@OperonWorkflow()
static async processWorkflow(wfCtxt: WorkflowContext, value: string) {
}
```

The first argument to an Operon workflow method must be a `WorkflowContext` (TODO add reference).  This context can be used to invoke transactions and communicators, send and receive messages, and get other contextual information such as the authenticated user.

`@OperonWorkflow()` takes an optional `WorkflowConfig` to configure the workflow, however there are currently no configuration items.

```typescript
interface WorkflowConfig {
}
```

#### `@OperonTransaction`
This decorator registers a method as an Operon transaction.

```typescript
@OperonTransaction({readOnly: true})
static async doLogin(ctx: TransactionContext, username: string, ) {
    ...
}
```

`@OperonTransaction()` takes an optional `TransactionConfig` to configure two aspects of the transaction: its isolation level and whether it is read only.

```typescript
interface TransactionConfig {
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
}
```

Operon supports declaration of the following values for `IsolationLevel`:
- `READ UNCOMMITTED`
- `READ COMMITTED`
- `REPEATABLE READ`
- `SERIALIZABLE`

The precise transaction semantics of these levels may vary with the capabilities of the Operon user database.  For example, see [isolation levels in PostgreSQL](https://www.postgresql.org/docs/current/transaction-iso.html).

#### `@OperonCommunicator`
This decorator registers a method as an Operon communicator.

```typescript
@OperonCommunicator()
static async doComms(commCtxt: CommunicatorContext) {
  ...
}
```

The first argument to an Operon communicator method must be a `CommunicatorContext` (TODO - reference).  This provides the communcator with information about the current authenticated user and execution state.

`@OperonCommunicator()` takes an optional `CommunicatorConfig`, which allows a number of communicator properties to be specified:

```typescript
export interface CommunicatorConfig {
  retriesAllowed?: boolean; // Should failures be retried? (default true)
  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).
  maxAttempts?: number; // Maximum number of retry attempts (default 3). If the error occurs more times than this, return null.
  backoffRate?: number; // The multiplier by which the retry interval increases after every retry attempt (default 2).
}
```

### HTTP API Registration Decorators

#### `@GetApi`
This decorator associates a method with an endpoint name, such as an HTTP URL accessed with GET.

```typescript
@GetApi("/hello")
static async hello(_ctx: HandlerContext) {
  return { message: "hello!" };
}
```

The first argument to a handler function must be an `OperonContext`, but may more specifically be a `HandlerContext` (TODO - reference), which contains more details about the incoming request, and provides the ability to invoke workflows and transactions.

The `@GetApi` decorator can be combined with `@OperonTransaction` or `@OperonWorkflow` to invoke transactions and workflows.

Registration endpoints may have placeholders, which are parts of the URL that are mapped to method arguments.  These are represented by a section of the endpoint name that is prefixed with a `:`, and which can be referred to by [`@ArgSource`](#argsource).

```typescript
@GetApi("/post/:id")
static async getPost(ctx: TransactionContext, @ArgSource(ArgSources.URL) id: string) {
  ...
}
```

#### `@PostApi`
This decorator associates a method with an endpoint name, such as an HTTP URL accessed with POST.

```typescript
@PostApi("/testpost")
  static async testpost(_ctx: HandlerContext, name: string) {
  return `hello ${name}`;
}
```

The first argument to a handler function must be an `OperonContext`, but may more specifically be a `HandlerContext` (TODO - reference), which contains more details about the incoming request, and provides the ability to invoke workflows and transactions.

The `@PostApi` decorator can be combined with `@OperonTransaction` or `@OperonWorkflow` to invoke transactions and workflows.

#### `@ArgSource`
The `@ArgSource` parameter decorator indicates where a method argument is to be sourced, when it could come from more than one place.

In the example below, `@ArgSource` is used to indicate that the `name` argument comes from the URL query string, rather than the posted message body.

```typescript
@PostApi("/workflow")
@OperonWorkflow()
static async testWorkflow(wfCtxt: WorkflowContext, @ArgSource(ArgSources.QUERY) name: string) {
  const res = await wfCtxt.invoke(TestEndpoints).testTranscation(name);
  return res;
}
```

The `@ArgSource` decorator takes one of the following values of `ArgSources`:
- `DEFAULT`: For GET requests, this comes from the query string; for POST requests it comes from the request body
- `BODY`: Indicates that the value is to be taken from the request body
- `QUERY`: Indicates that the value is to be taken from the URL query string
- `URL`: Indicates that the value is to be taken from a placeholder in the URL

#### `@Authentication`
The `@Authentication()` class decorator configures the Operon HTTP server to perform authentication.  All methods in the decorated class will use the provided function to act as an authentication middleware.

Example:
```typescript
async function exampleAuthMiddlware (ctx: MiddlewareContext) {
  if (ctx.requiredRole.length > 0) {
    const { userid } = ctx.koaContext.request.query;
    const uid = userid?.toString();

    if (!uid || uid.length === 0) {
      const err = new OperonNotAuthorizedError("Not logged in.", 401);
      throw err;
    }
    else {
      if (uid === 'bad_person') {
        throw new OperonNotAuthorizedError("Go away.", 401);
      }
      return {
        authenticatedUser: uid,
        authenticatedRoles: (uid === 'a_real_user' ? ['user'] : ['other'])
      };
    }
  }
  return;
}

@Authentication(exampleAuthMiddlware)
class OperationEndpoints {
  // eslint-disable-next-line @typescript-eslint/require-await
  @GetApi("/requireduser")
  @RequiredRole(['user'])
  static async checkAuth(_ctxt: HandlerContext, name: string) {
    return `Please say hello to ${name}`;
  }
}
```

The interface for the authentication middleware is:
```typescript
/**
 * Authentication middleware that executes before a request reaches a function.
 * This is expected to:
 *   - Validate the request found in the handler context and extract auth information from the request.
 *   - Map the HTTP request to the user identity and roles defined in Operon app.
 * If this succeeds, return the current authenticated user and a list of roles.
 * If any step fails, throw an error.
 */
export type OperonHttpAuthMiddleware = (ctx: MiddlewareContext) => Promise<OperonHttpAuthReturn | void>;

export interface OperonHttpAuthReturn {
  authenticatedUser: string;
  authenticatedRoles: string[];
}

export interface MiddlewareContext {
  koaContext: Koa.Context;
  name: string; // Method (handler, transaction, workflow) name
  requiredRole: string[]; // Role required for the invoked Operon operation, if empty perhaps auth is not required
}
```

#### `@KoaMiddleware`

### Declarative Security Decorators

#### `@RequiredRoles`
#### `@DefaultRequiredRoles`

### Input Validation Decorators

#### `@Required`
#### `@ArgName`
#### `@ArgDate`
#### `@ArgVarchar`

### Logging and Tracing Decorators

#### `@Debug`
Marks a method for debug tracing.

```typescript
export class Operations
{
  @Traced
  static async doOperation(ctx: OperonContext) {
    ...
  }
}
```

This decorator will ensure the method is registered and add it to tracing.

So that tracing can access the ongoing execution state, authenticated user, and so on, the first argument of the decorated method must be OperonContext or one of its subclasses.

Note: In the future, a different decorator may be suggested for the purpose of simply registering an Operon method, with separate control over which methods are traced.

#### `@SkipLogging`

This parameter decorator prevents a method argument from being recorded in traces.  This could be used if the argument is an opaque object, context, connection, or service.  This decorator could also be applied to arguments that are not to be recorded in logs due to their sensitive nature, but see also [`@LogMask`](#logmask).

```typescript
export class Operations
{
  @Traced
  static async doOperation(ctx: OperonContext, @SkipLogging notToBeRecorded: unknown) {
    ...
  }
}
```

#### `@LogMask`
This parameter decorator prevents a method argument from being recorded in traces in cleartext.  This could be used if the argument is sensitive in nature, but may be useful for debugging or tracing.   See also [`@SkipLogging`](#skiplogging).

```typescript
export class Operations
{
  @Traced
  static async doOperation(ctx: OperonContext, @LogMask(LogMasks.HASH) toBeHashed: string) {
    ...
  }
}
```

Values of `LogMasks`:
- `NONE`: No masking
- `HASH`: When logging the value, substitute its (not cryptographically secure) hash
- `SKIP`: Do not include the parameter in the log.  See [`@SkipLogging`](#skiplogging).

### Other Decorators

#### TypeORM Decorators

##### `@OrmEntities`
Marks a class as using ORM entity classes.   (Currently this is used for [TypeORM](https://typeorm.io) integration only.)

```typescript
@OrmEntities([OrmEntity1, OrmEntity2])
export class User {}
```

This code will ensure that the TypeORM entity manager and repository knows about the entities in the list.
