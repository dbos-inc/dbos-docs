---
sidebar_position: 4
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
  @Transaction()
  @PostApi("/follow")
  static async hello(ctx: TransactionContext) {
  ...
  }
```

is the same as this:
```typescript
  @PostApi("/follow")
  @Transaction()
  static async hello(ctx: TransactionContext) {
  ...
  }
```

### Enabling Decorators

DBOS uses [Typescript "Stage 2" decorators](https://www.typescriptlang.org/docs/handbook/decorators.html).
If you initialize your project with [`npx -y @dbos-inc/create`](../api-reference/cli.md#npx-dbos-inccreate), these are automatically enabled.
Otherwise, you must enable them by supplying the following configuration to the Typescript compiler (usually via the file `tsconfig.json`):

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  }
}
```

## Decorator Locations

DBOS currently uses decorators at the class, function, or function parameter level.  (Typescript also supports decorators at the property or accessor level, but DBOS currently doesn't use them.)

### Class Decorators

Class decorators are affixed to a class, just before the keyword `class`.  Such decorators will be applied to all functions in the class.
-   [`@Authentication`](#authentication)
-   [`@DefaultRequiredRole`](#defaultrequiredrole)

### Function Decorators

Function decorators are affixed to a function, just before its name and modifiers (such as `async` or `static`).  Function decorators apply to the decorated function and its parameters.  Examples of function-level decorators:
-   [`@Workflow`](#workflow)
-   [`@Transaction`](#transaction)
-   [`@Communicator`](#communicator)
-   [`@RequiredRole`](#requiredrole)
-   [`@GetApi`](#getapi)
-   [`@PostApi`](#postapi)

### Parameter Decorators

Parameter decorators are affixed to a function parameter, just before its name.  Parameter decorators apply to the treatment of the parameter, and may affect how values are validated or logged.  Examples of parameter-level decorators:
-   [`@ArgName`](#argname)
-   [`@ArgDate`](#argdate)
-   [`@SkipLogging`](#skiplogging)
-   [`@LogMask`](#logmask)

## Decorators Reference

### DBOS Typescript Decorators

#### `@Workflow`
Registers a function as a DBOS workflow.

```typescript
@Workflow()
static async processWorkflow(wfCtxt: WorkflowContext, value: string) {
  ...
}
```

The first argument to a workflow function must be a [`WorkflowContext`](contexts.md#workflowcontext).  This context can be used to invoke transactions and communicators, send and receive messages, and get other contextual information such as the authenticated user.

#### `@Transaction`
Registers a function as a [DBOS transaction](../tutorials/transaction-tutorial.md).

The first argument of the decorated function must be a [`TransactionContext`](contexts.md#transactioncontextt), which provides access to the database transaction.

```typescript
@Transaction({readOnly: true})
static async doLogin(ctx: TransactionContext, username: string, ) {
  ...
}
```

`@Transaction()` takes an optional `TransactionConfig` object:

```typescript
interface TransactionConfig {
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
}
```

DBOS supports declaration of the following values for `IsolationLevel`:
- `READ UNCOMMITTED`
- `READ COMMITTED`
- `REPEATABLE READ`
- `SERIALIZABLE`

The transaction semantics of these levels are defined for PostgreSQL [here](https://www.postgresql.org/docs/current/transaction-iso.html).

#### `@Communicator`
Registers a function as a [DBOS communicator](../tutorials/communicator-tutorial.md).

```typescript
@Communicator()
static async doComms(commCtxt: CommunicatorContext) {
  ...
}
```

The first argument to a communicator function must be a [`CommunicatorContext`](contexts.md#communicatorcontext).

`@Communicator()` takes an optional `CommunicatorConfig`, which allows a number of communicator properties to be specified:

```typescript
export interface CommunicatorConfig {
  retriesAllowed?: boolean; // Should failures be retried? (default true)
  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).
  maxAttempts?: number;     // Maximum number of retry attempts (default 3). If errors occur more times than this, throw an exception.
  backoffRate?: number;     // Multiplier by which the retry interval increases after a retry attempt (default 2).
}
```

### HTTP API Registration Decorators

#### `@GetApi`
Associates a function with an HTTP URL accessed with GET.

```typescript
@GetApi("/hello")
static async hello(_ctx: HandlerContext) {
  return { message: "hello!" };
}
```

The `@GetApi` decorator can be combined with `@Transaction` or `@Workflow` to serve transactions and workflows via HTTP.
It can also be used by itself in a [DBOS handler function](../tutorials/http-serving-tutorial.md#handlers).
The first argument to a handler function must be a [`HandlerContext`](contexts.md#handlercontext), which contains more details about the incoming request, and provides the ability to invoke workflows and transactions.

Endpoint paths may have placeholders, which are parts of the URL mapped to function arguments.
These are represented by a section of the path prefixed with a `:`.

```typescript
@GetApi("/post/:id")
static async getPost(ctx: TransactionContext, @ArgSource(ArgSources.URL) id: string) {
  ...
}
```

#### `@PostApi`
Associates a function with an endpoint name, such as an HTTP URL accessed with POST.

```typescript
@PostApi("/testpost")
  static async testpost(_ctx: HandlerContext, name: string) {
  return `hello ${name}`;
}
```

The `@PostApi` decorator can be combined with `@Transaction` or `@Workflow` to serve transactions and workflows via HTTP.
It can also be used by itself in a [DBOS handler function](../tutorials/http-serving-tutorial.md#handlers).
The first argument to a handler function must be a [`HandlerContext`](contexts.md#handlercontext), which contains more details about the incoming request, and provides the ability to invoke workflows and transactions.

#### `@ArgSource`
Indicates where a function argument is to be sourced, when it could come from more than one place.

In the example below, `@ArgSource` is used to indicate that the `name` argument comes from the URL query string, rather than the posted message body.

```typescript
@PostApi("/workflow")
@Workflow()
static async testWorkflow(wfCtxt: WorkflowContext, @ArgSource(ArgSources.QUERY) name: string) {
  const res = await wfCtxt.invoke(TestEndpoints).testTranscation(name);
  return res;
}
```

The `@ArgSource` decorator takes one of the following values of `ArgSources`:
- `DEFAULT`: The default value. For GET requests, this means searching for query parameters; for POST requestsn, searching the request body.
- `BODY`: Indicates to search the parameter in the request body.
- `QUERY`: Indicates to search the parameter in the URL query string.
- `URL`: Indicates to search the parameter in the endpoint path (requires a path placeholder).

Arguments sourced from an HTTP request generally get the name given in the code for the function.  However, if the name in the HTTP query string or body is different, [`@ArgName`](#argname) may be used.

#### `@Authentication`
Configures the DBOS HTTP server to perform authentication. All functions in the decorated class will use the provided function to act as an authentication middleware.
This middleware will make users' identity available to [DBOS Contexts](./contexts.md). Here is an example:

```typescript
async function exampleAuthMiddlware (ctx: MiddlewareContext) {
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

@Authentication(exampleAuthMiddlware)
class OperationEndpoints {
  @GetApi("/requireduser")
  @RequiredRole(['user'])
  static async checkAuth(ctxt: HandlerContext) {
    return `Please say hello to ${ctxt.authenticatedUser}`;
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

The authentication function is provided with a ['MiddlewareContext'](contexts.md#middlewarecontext), which allows access to the request, system configuration, logging, and database access services.

#### `@KoaMiddleware`
Configures the DBOS HTTP server allow insertion of arbitrary Koa middlewares. All functions in the decorated class will use the provided middleware list.

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

DBOS supports declarative, role-based security. Functions can be decorated with a list of roles (as strings) and execution of the function is forbidden unless the authenticated user has at least one role in the list. A list of roles can also be provided as a class-level default with `@DefaultRequiredRole()`, in which case it applies to any DBOS function in the class. Functions can override the defaults with `@RequiredRole()`.

#### `@RequiredRole`
List the required roles for the decorated function. In order to execute the function, the authenticated user must have at least one role on the specified list.

```typescript
@RequiredRole(['user','guest'])
@GetApi("/hello")
static async helloUser(_ctx: HandlerContext) {
  return { message: "hello registered user or guest!" };
}
```

#### `@DefaultRequiredRole`

List default required roles for all functions in the class. This can be overridden at the function level with `@RequiredRole`.

```typescript
@DefaultRequiredRole(['user'])
class OperationEndpoints {

  // Authentication / authorization not required for this function
  @RequiredRole([])
  @GetApi("/hello")
  static async hello(_ctx: HandlerContext) {
    return { message: "hello!" };
  }

  // Role with elevated permissions required for this function
  @RequiredRole(['admin'])
  @GetApi("/helloadmin")
  static async helloadmin(_ctx: HandlerContext) {
    return { message: "hello admin!" };
  }
}
```

### Input Validation Decorators

A combination of function and parameter decorators automatically provides rudimentary argument validation.

While the typescript compiler does some compile-time checks, it is possible (and likely) for programmers to pass user input directly through their code through the `any` type or a series of poorly-validated casts.  The DBOS function argument validation logic is able to check arguments exist and are of the right data types (or are close enough to be coerced through reasonable means).

Note that this validation is basic, and is not a substitute for the kind of input validation that conforms to your business logic.  For example, a policy that user passwords should be 8 characters, and contain at least an uppercase, lowercase, and numeric character should be implemented in the web UI (for immediate feedback) and double-checked in your backend code (for security), whereas the DBOS decorators will simply ensure that a password string was provided prior to function entry.

These decorators also serve a second purpose, which is to make the type information available to DBOS.  Uses of this include creating a per-function schema for tracing logs, or automatically producing a description of the function for integration purposes.

In simple cases (such as `string` or `number` arguments), the programmer need not do any decorating to get the functionality.  However, where the data types have some options, such as maximum length, precision, etc., there are decorators to control the behavior.

#### `@ArgRequired`
Ensures that the decorated function argument has a suitable value.  This is generally a default behavior, but see [`@DefaultArgRequired`](#defaultargrequired) and [`@DefaultArgOptional`](#defaultargoptional).
```typescript
@GetApi("/string")
static async checkStringG(_ctx: HandlerContext, @ArgRequired v: string) {
  ...
}
```

#### `@DefaultArgRequired`
Sets as the default policy that each argument of each registered function in the decorated class has a suitable value.  This is generally a default behavior, but see [`@ArgRequired`](#argrequired), [`@ArgOptional`](#argoptional) and [`@DefaultArgOptional`](#defaultargoptional).
```typescript
@DefaultArgRequired
export class User {}
```

#### `@ArgOptional`
Allows the argument to have an undefined value.  See also [`@DefaultArgRequired`](#defaultargrequired) and [`@DefaultArgOptional`](#defaultargoptional).

:::info note
TypeScript/Javascript makes a distinction between `undefined` and `null`.  Databases and serializers often support only one way to represent an undefined/unknown value.  For this reason, DBOS converts all `null` values to `undefined` prior to entry to the user function.  (`undefined` was chosen over `null` because it is much easier to work with in TypeScript.)
:::

```typescript
@GetApi("/string")
static async checkStringG(_ctx: HandlerContext, @ArgOptional v?: string) {
  ...
}
```

#### `@DefaultArgOptional`
Sets as the default policy that each argument of each registered function in the decorated class may have undefined value.  See also [`@ArgRequired`](#argrequired), [`@ArgOptional`](#argoptional) and [`@DefaultArgRequired`](#defaultargrequired).
```typescript
@DefaultArgOptional
export class User {}
```

#### `@ArgName`
Assigns a name to the decorated parameter.  The name of an argument is, by default, taken from the code, but if there is a reason for a disparity (perhaps the function was refactored but the external name used in HTTP requests is to be kept consistent), the name can be overriden with this parameter decorator.

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
Marks a function for debug tracing.

```typescript
export class Operations
{
  @Debug
  static async doOperation(_ctx: DBOSContext) {
    ...
  }
}
```

This decorator will ensure the function is registered with DBOS and benefit from its [logging subsystem](../tutorials/logging).

:::info note
In the future, a different decorator may be suggested for the purpose of simply registering a function, with separate control over which functions are traced.
:::

#### `@SkipLogging`

Prevents a function argument from being recorded in traces. This could be used if the argument is an opaque object, context, connection, service, or of sensitive nature. See also [`@LogMask`](#logmask).

```typescript
export class Operations
{
  @Debug
  static async doOperation(_ctx: DBOSContext, @SkipLogging notToBeRecorded: unknown) {
    ...
  }
}
```

#### `@LogMask`
Prevents an argument from being recorded in traces in plain text. This could be used if the argument is sensitive in nature, but may be useful for debugging or tracing. See also [`@SkipLogging`](#skiplogging).

```typescript
export class Operations
{
  @Debug
  static async doOperation(_ctx: DBOSContext, @LogMask(LogMasks.HASH) toBeHashed: string) {
    ...
  }
}
```

Values of `LogMasks`:
- `NONE`: No masking.
- `HASH`: When logging the value, substitute its (not cryptographically secure) hash.
- `SKIP`: Do not include the parameter in the log.  See [`@SkipLogging`](#skiplogging).

### Hook Functions

DBOS allows applications to supply functions to be invoked at points in the application initialization process.

#### `@DBOSInitializer`
This decorator is used to specify functions to be run at application instance initialization time.
`@DBOSInitializer` is intended for uses such as validating configuration, establishing connections to external (non-database) services, and so on.
It is not a good place for database schema migration, for that see our [migration commands](cli.md#npx-dbos-sdk-migrate).

The argument to `@DBOSInitializer` should be of type [`InitContext`](contexts.md#initcontext).

```typescript

  @DBOSInitializer()
  static async init(ctx: InitContext) {
     // Use functions and config from ctx, report anything interesting with ctx.log
  }
```

### Kafka Integration Decorators

#### `@Kafka(kafkaConfig: KafkaConfig)` {#kafka}

Class-level decorator defining a Kafka configuration to use in all class methods.
Uses a [KafkaJS configuration object](https://kafka.js.org/docs/configuration).


#### `@KafkaConsume(topic: string, consumerConfig?: ConsumerConfig)` {#kafka-consume}
Executes a workflow or transaction exactly-once in response to Kafka messages.
Takes in a Kafka topic (required) and a [KafkaJS consumer configuration](https://kafka.js.org/docs/consuming#options) (optional).
Can only be used in a class decorated with [`@Kafka`](#kafka).
The decorated method must take as input a Kafka topic, partition, and message as in the example below.

```javascript
import { KafkaConfig, KafkaMessage} from "kafkajs";

const kafkaConfig: KafkaConfig = {
    brokers: ['localhost:9092']
}

@Kafka(kafkaConfig)
class KafkaExample{

  @KafkaConsume("example-topic")
  @Workflow()
  static async exampleWorkflow(ctxt: WorkflowContext, topic: string, partition: number, message: KafkaMessage) {
    // This workflow executes exactly once for each message sent to the topic.
    // All methods annotated with Kafka decorators must take in the topic, partition, and message as inputs just like this method.
  }
}
```

### OpenAPI Decorators

DBOS can generate an [OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3) interface description for an application.

#### `@OpenApiSecurityScheme`

This decorator is used to declare an [OpenAPI security scheme](https://spec.openapis.org/oas/v3.0.3#security-scheme-object) for the handler functions in a class.
This decorator takes a single parameter defining the security scheme as per the OpenAPI specification.
This decorator is purely declarative for the purpose of inclusion in the generated interface description.
You still need to implement authentication as per the [Authentication and Authorization tutorial](../tutorials/authentication-authorization).

::::info
DBOS does not support the `oauth2` OpenAPI security scheme at this time.
::::

```typescript
@OpenApiSecurityScheme({ type: 'http', scheme: 'bearer' })
@Authentication(authMiddleware)
export class Operations {
@GetApi("/post/:id")
  static async getPost(ctx: TransactionContext, @ArgSource(ArgSources.URL) id: string) {
    ...
  }
}
```

### Other Decorators

#### TypeORM Decorators

##### `@OrmEntities`
Marks a class as using ORM entity classes.   (Currently this is used for [TypeORM](https://typeorm.io) integration only.)

```typescript
@OrmEntities([OrmEntity1, OrmEntity2])
export class User {}
```

This code will ensure that the TypeORM entity manager and repository knows about the entities in the list.
