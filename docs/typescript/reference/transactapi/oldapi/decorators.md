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

DBOS uses [TypeScript "Stage 2" decorators](https://www.typescriptlang.org/docs/handbook/decorators.html).
If you initialize your project with [`npx -y @dbos-inc/create`](../../tools/cli.md#npx-dbos-inccreate), these are automatically enabled.
Otherwise, you must enable them by supplying the following configuration to the TypeScript compiler (usually via the file `tsconfig.json`):

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  }
}
```

## Decorator Locations

DBOS currently uses decorators at the class, function, or function parameter level.  (TypeScript also supports decorators at the property or accessor level, but DBOS currently doesn't use them.)

### Class Decorators

Class decorators are affixed to a class, just before the keyword `class`.  Such decorators will be applied to all functions in the class.
-   [`@Authentication`](#authentication)
-   [`@DefaultRequiredRole`](#defaultrequiredrole)
-   [`@KoaBodyParser`](#koabodyparser)
-   [`@KoaCors`](#koacors)
-   [`@KoaMiddleware`](#koamiddleware)
-   [`@KoaGlobalMiddleware`](#koaglobalmiddleware)

### Function Decorators

Function decorators are affixed to a function, just before its name and modifiers (such as `async` or `static`).  Function decorators apply to the decorated function and its parameters.  Examples of function-level decorators:
-   [`@Workflow`](#workflow)
-   [`@Transaction`](#transaction)
-   [`@Step`](#step)
-   [`@RequiredRole`](#requiredrole)
-   [`@GetApi`](#getapi)
-   [`@PostApi`](#postapi)
-   [`@PutApi`](#putapi)
-   [`@PatchApi`](#patchapi)
-   [`@DeleteApi`](#deleteapi)

### Parameter Decorators

Parameter decorators are affixed to a function parameter, just before its name.  Parameter decorators apply to the treatment of the parameter, and may affect how values are validated or logged.  Examples of parameter-level decorators:
-   [`@ArgName`](#argname)
-   [`@ArgDate`](#argdate)
-   [`@SkipLogging`](#skiplogging)
-   [`@LogMask`](#logmask)

## Decorators Reference

### DBOS TypeScript Decorators

#### `@Workflow`
Registers a function as a DBOS workflow.

```typescript
@Workflow()
static async processWorkflow(wfCtxt: WorkflowContext, value: string) {
  ...
}
```

The first argument to a workflow function must be a [`WorkflowContext`](contexts.md#workflowcontext).  This context can be used to invoke transactions and steps, send and receive messages, and get other contextual information such as the authenticated user.

`@Workflow()` takes an optional `WorkflowConfig` object:

```typescript
interface WorkflowConfig {
  maxRecoveryAttempts?: number; // The maximum number of times the workflow may be automatically recovered. Defaults to 50.
}
```

#### `@Transaction`
Registers a function as a [DBOS transaction](../../../tutorials/transaction-tutorial.md).

The first argument of the decorated function must be a [`TransactionContext`](contexts.md#transactioncontextt), which provides access to the database transaction.

```typescript
@Transaction({readOnly: true})
static async doLogin(ctx: TransactionContext, username: string) {
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

You should mark a transaction function as read-only if it doesn't contain any database writes.
A read-only transaction runs faster than a standard read-write transaction because it doesn't require synchronized disk writes.

If you mark a transaction function as `readOnly: true` but it contains database writes, it will throw an error (for example `ERROR:  cannot execute INSERT in a read-only transaction`).

#### `@StoredProcedure`
Registers a function as a [DBOS stored procedure](../../../tutorials/stored-proc-tutorial.md).

The first argument of the decorated function must be a [`StoredProcedureContext`](contexts#storedprocedurecontext), which provides access to the database.

```typescript
@StoredProcedure({readOnly: true})
static async doLogin(ctx: StoredProcedureContext, username: string) {
  ...
}
```

`@StoredProcedure()` takes an optional `StoredProcedureConfig` object:

```typescript
interface StoredProcedureConfig {
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
  executeLocally?: boolean
} 
```

The `readOnly` and `isolationLevel` config fields behave the same as their [TransactionConfig](#transaction) counterparts.

The `executeLocally` config field is used to control where the stored procedure logic is executed.
By default, stored procedures functions are executed by invoking the generated stored procedure that has been deployed to the database.
However, for debugging scenarios, it can be helpful to step through the procedure's logic like you can with the rest of your application code. 
When `executeLocally` is set to true, the stored procedure function gets executed locally on the application server, similar to transaction functions.

:::info
The `executeLocally` field can be changed without redeploying the application with the [DBOS Compiler](../../tools/dbos-compiler.md).
DBOS Compiler will deploy all `@StoredProcedure()` functions, even those marked with `executeLocally` set to true.
:::

:::warning
Note, when running locally, DBOS uses the [`node-postgres`](https://node-postgres.com/) package to connect to the application database.
There can be slight differences between the query results returned by PLV8 and `node-postgres`, in particular when querying for floating point values.
:::

#### `@Step`
Registers a function as a [DBOS step](../../../tutorials/step-tutorial.md).

```typescript
@Step()
static async doComms(commCtxt: StepContext) {
  ...
}
```

The first argument to a step function must be a [`StepContext`](contexts.md#stepcontext).

`@Step()` takes an optional `StepConfig`, which allows a number of step properties to be specified:

```typescript
export interface StepConfig {
  retriesAllowed?: boolean; // Should failures be retried? (default true)
  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).
  maxAttempts?: number;     // Maximum number of retry attempts (default 3). If errors occur more times than this, throw an exception.
  backoffRate?: number;     // Multiplier by which the retry interval increases after a retry attempt (default 2).
}
```

#### `@Communicator`
`Communicator` is a historical synonym for [`Step`](#step), as steps are frequently used to communicate with external systems.

### HTTP API Registration Decorators

#### `@GetApi`
Associates a function with an HTTP URL accessed via GET.

```typescript
@GetApi("/hello")
static async hello(_ctx: HandlerContext) {
  return { message: "hello!" };
}
```

The `@GetApi` decorator can be combined with [`@Transaction`](#transaction), [`@Workflow`](#workflow), or [`@Step`](#step) to serve those operations via HTTP.
It can also be used by itself in a [DBOS handler function](../../../tutorials/requestsandevents/http-serving-tutorial.md#handlers).
The first argument to a handler function must be a [`HandlerContext`](./contexts.md#handlercontext), which contains more details about the incoming request and allows invoking workflows, transactions, and steps.

Endpoint paths may have placeholders, which are parts of the URL mapped to function arguments.
These are represented by a section of the path prefixed with a `:`.

```typescript
@GetApi("/:id")
@Transaction()
static async exampleGet(ctxt: TransactionContext, id: string) {
  ctxt.logger.info(`${id} is parsed from the URL path parameter`);
  // ctxt can be used for database access, as this is also a @Transaction
}
```

#### `@PostApi`
Associates a function with an HTTP URL accessed via POST. Analogous to [`@GetApi`](#getapi), but may parse arguments from a request body.

```typescript
@PostApi("/:id")
  static async examplePost(ctxt: HandlerContext, id: string, name: string) {
  ctxt.logger.info(`${id} is parsed from the URL path parameter, ${name} is parsed from the request body`)
}
```

#### `@PutApi`
Associates a function with an HTTP URL accessed via PUT. Analogous to [`@GetApi`](#getapi), but may parse arguments from a request body.

```typescript
@PutApi("/:id")
  static async examplePut(ctxt: HandlerContext, id: string, name: string) {
  ctxt.logger.info(`${id} is parsed from the URL path parameter, ${name} is parsed from the request body`)
}
```

#### `@PatchApi`
Associates a function with an HTTP URL accessed via PATCH. Analogous to [`@GetApi`](#getapi), but may parse arguments from a request body.

```typescript
@PatchApi("/:id")
  static async examplePatch(ctxt: HandlerContext, id: string, name: string) {
  ctxt.logger.info(`${id} is parsed from the URL path parameter, ${name} is parsed from the request body`)
}
```

#### `@DeleteApi`
Associates a function with an HTTP URL accessed via DELETE. Analogous to [`@GetApi`](#getapi).

```typescript
@DeleteApi("/:id")
static async exampleDelete(ctxt: HandlerContext, id: string) {
  ctxt.logger.info(`${id} is parsed from the URL path parameter`)
}
```

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
- `DEFAULT`: The default value. For GET requests, this means searching for query parameters; for POST requests, searching the request body.
- `BODY`: Indicates to search the parameter in the request body.
- `QUERY`: Indicates to search the parameter in the URL query string.
- `URL`: Indicates to search the parameter in the endpoint path (requires a path placeholder).

Arguments sourced from an HTTP request generally get the name given in the code for the function.  However, if the name in the HTTP query string or body is different, [`@ArgName`](#argname) may be used.

#### `@Authentication`
Configures the DBOS HTTP server to perform authentication. All functions in the decorated class will use the provided function to act as an authentication middleware.
This middleware will make users' identity available to [DBOS Contexts](./contexts.md). Here is an example:

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

The authentication function is provided with a ['MiddlewareContext'](./contexts.md#middlewarecontext), which allows access to the request, system configuration, logging, and database access services.

#### `@KoaBodyParser`
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

#### `@KoaCors`
[Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is an integral part of security in web browsers and similar clients.

By default, DBOS uses [`@koa/cors`](https://github.com/koajs/cors) middleware with a configuration from `dbos-config.yaml`.  (The defaults in this file are, in turn, extremely permissive, allowing all cross-origin requests, including those with credentials.)  If your application needs only a coarse configuration of CORS, such as disabling CORS, or enabling CORS only on whitelisted origins, the config file offers a simple option.

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

#### `@KoaMiddleware`
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

#### `@KoaGlobalMiddleware`
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
        DBOS.globalLogger?.info(`[Request] ${ctx.method} ${ctx.url}`);

        let ok = false;
        try {
            await next();
            ok = true;
        }
        finally {
            const ms = Date.now() - start;
            if (ok) {
                // Log the response status and time taken
                DBOS.globalLogger?.info(`[Response] ${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
            }
            else {
                // Log error response
                DBOS.globalLogger?.warn(`[Exception] ${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
            }
        }
    };
};

@KoaGlobalMiddleware(logAllRequests())
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
TypeScript/JavaScript makes a distinction between `undefined` and `null`.  Databases and serializers often support only one way to represent an undefined/unknown value.  For this reason, DBOS converts all `null` values to `undefined` prior to entry to the user function.  (`undefined` was chosen over `null` because it is much easier to work with in TypeScript.)
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

#### `@SkipLogging`

Prevents a function argument from being recorded in traces. This could be used if the argument is an opaque object, context, connection, service, or of sensitive nature. See also [`@LogMask`](#logmask).

```typescript
export class Operations
{
  @Transaction()
  static async doOperation(ctx: TransactionContext, @SkipLogging notToBeRecorded: unknown) {
    ...
  }
}
```

#### `@LogMask`
Prevents an argument from being recorded in traces in plain text. This could be used if the argument is sensitive in nature, but may be useful for debugging or tracing. See also [`@SkipLogging`](#skiplogging).

```typescript
export class Operations
{
  @Transaction()
  static async doOperation(ctx: TransactionContext, @LogMask(LogMasks.HASH) toBeHashed: string) {
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
It is not a good place for database schema migration, for that see our [migration commands](../../tools/cli.md#npx-dbos-migrate).

The argument to `@DBOSInitializer` should be of type [`InitContext`](./contexts.md#initcontext).

```typescript

  @DBOSInitializer()
  static async init(ctx: InitContext) {
     // Use functions and config from ctx, report anything interesting with ctx.log
  }
```

### Kafka Integration Decorators

#### `@Kafka(kafkaConfig: KafkaConfig)` {#kafka}

Class-level decorator defining a Kafka configuration to use in all class methods.
Takes in a [KafkaJS configuration object](https://kafka.js.org/docs/configuration).


#### `@KafkaConsume(topic: string | RegExp | Array<string | RegExp>, consumerConfig?: ConsumerConfig, queueName?: string)` {#kafka-consume}
Runs a transaction or workflow exactly-once for each message received on the specified topic(s).
Takes in a Kafka topic or list of Kafka topics (required) and a [KafkaJS consumer configuration](https://kafka.js.org/docs/consuming#options) (optional).
Requires class to be decorated with [`@Kafka`](#kafka).
The decorated method must take as input a Kafka topic, partition, and message as in the example below:

```javascript
import { KafkaConfig, KafkaMessage} from "kafkajs";
import { Kafka, KafkaConsume, Workflow, WorkflowContext } from "@dbos-inc/dbos-sdk";

const kafkaConfig: KafkaConfig = {
    brokers: ['localhost:9092']
}

@Kafka(kafkaConfig)
class KafkaExample{

  @KafkaConsume("example-topic")
  @Workflow()
  static async kafkaWorkflow(ctxt: WorkflowContext, topic: string, partition: number, message: KafkaMessage) {
    // This workflow executes exactly once for each message sent to "example-topic".
    // All methods annotated with Kafka decorators must take in the topic, partition, and message as inputs just like this method.
  }
}
```

#### Concurrency and Rate Limiting
By default, `@KafkaConsume` workflows are started immediately upon receiving Kafka messages.  If `queueName` is provided to the `@KafkaConsume` decorator, then the workflows will be enqueued in a [workflow queue](../../transactapi/workflow-queues) and subject to rate limits.


### Scheduled Workflow Decorators

#### `@Scheduled(schedulerConfig: SchedulerConfig)` {#scheduled}

Runs a workflow function on a specified schedule, with guarantees such as executing exactly once per scheduled interval.

By default, the workflow is executed exactly once per scheduled interval.  This means executions might be started concurrently and can overlap, and that if the application is taken down and restarted, makeup work will be performed.  A workflow idempotency key (consisting of the workflow function name and scheduled time) is used to deduplicate any workflows that may inadvertently be initiated by the scheduler.

The schedule is specified in a format similar to a traditional [`crontab`](https://en.wikipedia.org/wiki/Cron), with the following notes:
. The 5\- and 6\-field versions are supported, if the optional 6th field is prepended it indicates second-level granularity, otherwise it is minute\-level.
. ',' is supported to indicate a list of values, so '0 0,12 \* \* \*' executes at midnight and noon every day.
. '/' is supported to indicate divisibility, so '\*/5 \* \* \* \*' indicates every 5 minutes.
. '\-' is supported to indicate ranges, so '0 9\-17 \* \* \*' indicates every hour (on the hour) from 9am to 5pm.
. Long and short month and weekday names are supported \(in English\).

Two scheduling modes are currently supported:
- *SchedulerMode.ExactlyOncePerInterval*: The workflow execution schedule begins when the decorated function is first deployed and activated.  If the application is deactivated, missed executions will be started when the application is reactivated, such that the workflow is executed exactly once per scheduled interval (starting from when the function is first deployed).
- *SchedulerMode.ExactlyOncePerIntervalWhenActive*: Similar to `ExactlyOncePerInterval`, except that any workflow executions that would have occurred when the application is inactive are not made up.

The `@Scheduled` decorator's configuration object is:
```typescript
export class SchedulerConfig {
    crontab : string = '* * * * *'; // Every minute by default
    mode ?: SchedulerMode = SchedulerMode.ExactlyOncePerInterval; // How to treat intervals
    queueName ?: string;
}
```

The decorated method must take a Workflow context argument, and the following additional parameters:
- The time that the run was scheduled (as a `Date`).
- The time that the run was actually started (as a `Date`).  This can be used to tell if an exactly-once workflow was started behind schedule.

Example:
```typescript
import { Scheduled } from "@dbos-inc/dbos-sdk";

class ScheduledExample{
  @Scheduled({crontab: '*/5 * * * * *', mode: SchedulerMode.ExactlyOncePerIntervalWhenActive})
  @Workflow()
  static async scheduledFunc(ctxt: WorkflowContext, schedTime: Date, startTime: Date) {
    ctxt.logger.info(`
        Running a workflow every 5 seconds -
          scheduled time: ${schedTime.toISOString()} /
          actual start time: ${startTime.toISOString()}
    `);
  }
}
```

### Concurrency and Rate Limiting
By default, `@Scheduled` workflows are started immediately, including any make-up work identified when a VM starts.  If `queueName` is specified in the `SchedulerConfig`, then the workflow will be enqueued in a [workflow queue](../../transactapi/workflow-queues) and subject to rate limits.

#### `crontab` Specification
The `crontab` format is based on the well-known format used in the [`cron`](https://en.wikipedia.org/wiki/Cron) scheduler.

The crontab field contains 5 or 6 items, separated by spaces:

```
 ┌────────────── second (optional)
 │ ┌──────────── minute
 │ │ ┌────────── hour
 │ │ │ ┌──────── day of month
 │ │ │ │ ┌────── month
 │ │ │ │ │ ┌──── day of week
 │ │ │ │ │ │
 │ │ │ │ │ │
 * * * * * *
```

#### Second Field Format
```
*|number[-number][,number[-number]...][/divisor]
```
Each 'number' is in the range [0-59].  The range of 'divisor' is [2-59].

`*` is interpreted as [0-59].

#### Minute Field Format:
```
*|number[-number][,number[-number]...][/divisor]
```

Each 'number' is in the range [0-59].  The range of 'divisor' is [2-59].

`*` is interpreted as [0-59].

#### Hour Field Format:
````
*|number[-number][,number[-number]...][/divisor]
````
Each 'number' is in the range [0-23].  The range of 'divisor' is [2-23].

`*` is interpreted as [0-23].

#### Day Of Month Field Format
```
*|number[-number][,number[-number]...][/divisor]
```
Each 'number' is in the range [1-31].  The range of 'divisor' is [2-31].

`*` is interpreted as [1-31].

#### Month Field Format
```
*|number[-number][,number[-number]...][/divisor]
```
Each 'number' is in the range [1-12].  The range of 'divisor' is [2-12].

`*` is interpreted as [1-12].

The following symbolic names can be placed instead of numbers, and are case-insensitive:
```
'january',   'jan' -> 1
'february',  'feb' -> 2
'march',     'mar' -> 3
'april',     'apr' -> 4
'may',       'may' -> 5
'june',      'jun' -> 6
'july',      'jul' -> 7
'august',    'aug' -> 8
'september', 'sep' -> 9
'october',   'oct' -> 10
'november',  'nov' -> 11
'december',  'dec' -> 12
```

#### Day Of Week Field Format
```
*|number[-number][,number[-number]...][/divisor]
```
Each 'number' is in the range [0-7], with 0 and 7 both corresponding to Sunday.  The range of 'divisor' is [2-7].

`*` is interpreted as [0-6].

The following symbolic names can be placed instead of numbers, and are case-insensitive:
```
'sunday',    'sun' -> 0
'monday',    'mon' -> 1
'tuesday',   'tue' -> 2
'wednesday', 'wed' -> 3
'thursday',  'thu' -> 4
'friday',    'fri' -> 5
'saturday'   'sat' -> 6
```

#### Matching
For a scheduled workflow to run at a given time, the time must match the crontab pattern.
A time matches the pattern if all fields of the time match the pattern.
Each field matches the pattern if its numerical value is within any of the inclusive ranges provided in the field, and is also divisible by the divisor.

### Other Decorators

#### TypeORM Decorators

##### `@OrmEntities`
Marks a class as using ORM entity classes.   (Currently this is used for [TypeORM](https://typeorm.io) integration only.)

```typescript
@OrmEntities([OrmEntity1, OrmEntity2])
export class User {}
```

This code will ensure that the TypeORM entity manager and repository knows about the entities in the list.