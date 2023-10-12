---
sidebar_position: 3
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
        -   [`@RequiredRole`](#requiredrole)
        -   [`@DefaultRequiredRole`](#defaultrequiredrole)
    -   [Input Validation Decorators](#input-validation-decorators)
        -   [`@ArgRequired`](#argrequired)
        -   [`@DefaultArgRequired`](#defaultargrequired)
        -   [`@ArgOptional`](#argoptional)
        -   [`@DefaultArgOptional`](#defaultargoptional)
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

[Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) in TypeScript are a way to declaratively alter classes, methods, and parameters.  Decorators precede the decorated class, method, or parameter, and begin with '@':
```typescript
  @Decorated
  class decorated {
  }
```
Decorators may or may not take arguments in parenthesis `()`.  However, each specific decorator either requires parenthesis, or requires their absence.  In the following, adding `()` after `@Required` will lead to an error, as will omitting the `()` after `@LogMask`.
```
@Required @LogMask(LogMasks.HASH) password: string
```

This concept is not new to TypeScript.  Python is another popular language with decorators prefixed with `@`.  In other languages, such as Java, similar declarations are called "annotations".
 
While, in general, the order in which decorators are listed can affect the behavior, all decorators in the Operon API are order-independent.  So this:
```typescript
  @OperonTransaction()
  @PostApi("/follow")
  static async doFollow(ctx: TransactionContext, followUid: string) {
  }
```

is the same as this:
```typescript
  @PostApi("/follow")
  @OperonTransaction()
  static async doFollow(ctx: TransactionContext, followUid: string) {
  }
```

### Decorator Implementations

Work to add decorators to the TypeScript language and standards is currently ongoing, leaving things in a state of flux.

Whereas the most useful version of decorators implemented in the TypeScript compiler is "experimental" or "Stage 2" decorators, the language specifications have not caught up.  "Stage 3" decorators, which are specified and implemented, are missing two key features used in Operon:
- Parameter decorators
- Metadata about method argument types

It is expected that Operon will be moved from "experimental"/"Stage 2" decorators to a standards-based implementation once the standards have caught up.  It is hoped that user code would not be affected in this transition.

### Typescript Compiler Flags

In order to use the "Stage 2" experimental decorators implemented by Operon, the following configuration needs to be given to the TypeScript compiler (usually via the file `tsconfig.json`):

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  }
}
```

## Decorator Locations

Operon currently uses decorators at the class, method, or method parameter level.  (The language also supports decorators at the property or accessor level, but Operon currently doesn't use them.)

### Class Decorators

Class decorators are affixed to a class, just before the keyword `class`.  Operon decorators will be applied to all Operon methods in the class.
-   [`@Authentication`](#authentication)
-   [`@DefaultRequiredRole`](#defaultrequiredrole)

### Method Decorators

Method decorators are affixed to a method, just before its name and modifiers (such as `async` or `static`).  Operon method decorators apply to the decorated method and its parameters.  Examples of method-level decorators:
-   [`@OperonWorkflow`](#operonworkflow)
-   [`@OperonTransaction`](#operontransaction)
-   [`@OperonCommunicator`](#operoncommunicator)
-   [`@RequiredRole`](#requiredrole)
-   [`@GetApi`](#getapi)
-   [`@PostApi`](#postapi)

### Parameter Decorators

Parameter decorators are affixed to a method parameter, just before its name.  Operon parameter decorators apply to the treatment of the parameter, and may affect how values are validated or logged.  Examples of parameter-level decorators:
-   [`@ArgName`](#argname)
-   [`@ArgDate`](#argdate)
-   [`@SkipLogging`](#skiplogging)
-   [`@LogMask`](#logmask)

## Decorators Reference

### Operon Decorators

#### `@OperonWorkflow`
This decorator registers a method as an Operon workflow.

```typescript
@OperonWorkflow()
static async processWorkflow(wfCtxt: WorkflowContext, value: string) {
}
```

The first argument to an Operon workflow method must be a [`WorkflowContext`](contexts.md#workflowcontext).  This context can be used to invoke transactions and communicators, send and receive messages, and get other contextual information such as the authenticated user.

`@OperonWorkflow()` takes an optional `WorkflowConfig` to configure the workflow, however there are currently no configuration items.

```typescript
interface WorkflowConfig {
}
```

#### `@OperonTransaction`
This decorator registers a method as an Operon transaction.

The first argument of the decorated method must be a [`TransactionContext`](contexts.md#transactioncontext), which provides access to the database transaction.

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

The first argument to an Operon communicator method must be a [`CommunicatorContext`](contexts.md#communicatorcontext).  This provides the communcator with information about the current authenticated user and execution state.

`@OperonCommunicator()` takes an optional `CommunicatorConfig`, which allows a number of communicator properties to be specified:

```typescript
export interface CommunicatorConfig {
  retriesAllowed?: boolean; // Should failures be retried? (default true)
  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).
  maxAttempts?: number; // Maximum number of retry attempts (default 3). If errors occur more times than this, throw an exception.
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

The first argument to a handler function must be an [`OperonContext`](contexts.md#operoncontext), but may more specifically be a [`HandlerContext`](contexts.md#handlercontext), which contains more details about the incoming request, and provides the ability to invoke workflows and transactions.

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

The first argument to a handler function must be an [`OperonContext`](contexts.md#operoncontext), but may more specifically be a [`HandlerContext`](contexts.md#handlercontext), which contains more details about the incoming request, and provides the ability to invoke workflows and transactions.

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

Arguments sourced from an HTTP request generally get the name given in the code for the method.  However, if the name in the HTTP query string or body is different, [`@ArgName`](#argname) may be used.

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
The `@KoaMiddleware()` class decorator configures the Operon HTTP server allow insertion of arbirtrary Koa middleware.  All methods in the decorated class will use the provided middleware list.

```typescript
const exampleMiddleware: Koa.Middleware = async (ctx, next) => {
  await next();
};  

@KoaMiddleware(exampleMiddleware)
class OperationEndpoints{
  ...
}
```

### Declarative Security Decorators

Operon supports declarative, role-based security.  Methods are decorated with a list of roles (as strings), and access to the method is not authorized unless the authenticated user has at least one role on the list.  A role list can also be provided as a class-level default with `@DefaultRequiredRole()`, in which case it applies to any Operon method in the class that does not override the defaults with its own `@RequiredRole()` list.

#### `@RequiredRole`
Specifies the list of required roles for the decorated method.  In order to execute the method, the authenticated user must have at least one role on the specified list.

```typescript
@RequiredRole(['user','guest'])
@GetApi("/hello")
static async helloUser(_ctx: HandlerContext) {
  return { message: "hello registered user or guest!" };
}
```

#### `@DefaultRequiredRole`

This class decorator specifies the list of required roles to be applied as a default to all Operon methods in the class.  This can be overridden at the method level with `@RequiredRole`.

```typescript
@DefaultRequiredRole(['user'])
class OperationEndpoints {
  ...
  // Authentication / authorization not required for this function
  @RequiredRole([])
  @GetApi("/hello")
  static async hello(_ctx: HandlerContext) {
    return { message: "hello!" };
  }

  // Role with elevated permissions required for this function
  @RequiredRole(['admin'])
  @GetApi("/hello")
  static async administrate(_ctx: HandlerContext) {
    return { message: "hello admin!" };
  }
}
```

### Input Validation Decorators

A combination of Operon method and parameter decorators automatically provide rudimentary argument validation.

While the typescript compiler does some compile-time checks, it is possible (and likely) for programmers to pass user input directly through their code through the `any` type or a series of poorly-validated casts.  The Operon method argument validation logic is able to check that the arguments exist, and are the right data types (or are close enough to be coerced through reasonable means).

Note that this validation is basic, and is not a substitute for the kind of input validation that conforms to your business logic.  For example, a policy that user passwords should be 8 characters, and contain at least an uppercase, lowercase, and numeric character should be implemented in the web UI (for immediate feedback) and double-checked in your backend code (for security), whereas the Operon decorators will simply ensure that a password string was provided prior to method entry.

These decorators also serve a second purpose, which is to make the type information available to Operon.  Uses of this include creating a per-method schema for tracing logs, or automatically producing a description of the method for integration purposes.

In simple cases (such as `string` or `number` arguments), the programmer need not do any decorating to get the functionality.  However, where the data types have some options, such as maximum length, precision, etc., there are decorators to control the behavior.

#### `@ArgRequired`
Ensures that the decorated method argument has a suitable value.  This is generally a default behavior, but see [`@DefaultArgRequired`](#defaultargrequired) and [`@DefaultArgOptional`](#defaultargoptional).
```typescript
@GetApi("/string")
static async checkStringG(_ctx: HandlerContext, @ArgRequired v: string) {
  ...
}
```

#### `@DefaultArgRequired`
Sets as the default policy that each argument of each registered method in the decorated class has a suitable value.  This is generally a default behavior, but see [`@ArgRequired`](#argrequired), [`@ArgOptional`](#argoptional) and [`@DefaultArgOptional`](#defaultargoptional).
```typescript
@DefaultArgRequired
export class User {}
```

#### `@ArgOptional`
Allows the argument to have an undefined value.  See also [`@DefaultArgRequired`](#defaultargrequired) and [`@DefaultArgOptional`](#defaultargoptional).

_Note:_ TypeScript makes a distinction between `undefined` and `null`.  Databases and serializers often support only one way to represent an undefined/unknown value.  For this reason, Operon converts all `null` values to `undefined` prior to entry to the user function.  (`undefined` was chosen over `null` because it is much easier to work with in the TypeScript language.)

```typescript
@GetApi("/string")
static async checkStringG(_ctx: HandlerContext, @ArgOptional v?: string) {
  ...
}
```

#### `@DefaultArgOptional`
Sets as the default policy that each argument of each registered method in the decorated class may have undefined value.  See also [`@ArgRequired`](#argrequired), [`@ArgOptional`](#argoptional) and [`@DefaultArgRequired`](#defaultargrequired).
```typescript
@DefaultArgOptional
export class User {}
```

#### `@ArgName`
Assigns a name to the decorated parameter.  The name of an argument is, by default, taken from the code, but if there is a reason for a disparity (perhaps the method was refactored but the external name used in HTTP requests is to be kept consistent), the name can be overriden with this parameter decorator.

```typescript
@GetApi("/string")
static async checkStringG(_ctx: HandlerContext, @ArgName('call_me_maybe') internal_name: string) {
  ...
}
```

#### `@ArgDate`
Ensures that a Date argument has a suitable value.  This decorator currently accepts no configuration, but may be altered in the future to indicate whether it is a timestamp or plain date.

```typescript
@GetApi("/date")
static async checkDateG(_ctx: HandlerContext, @ArgDate() v: Date) {
  ...
}
```

#### `@ArgVarchar`
Ensures that a string argument has a suitable length.  This decorator requires a length parameter.

```typescript
@GetApi("/string")
static async checkStringG(_ctx: HandlerContext, @ArgVarchar(10) v: string) {
  ...
}
```

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
