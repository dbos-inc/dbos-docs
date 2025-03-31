---
sidebar_position: 40
title: Parameter Decorators
description: API reference for DBOS Parameter decorators.
---

## Parameter Decorators

Parameter decorators are affixed to a function parameter, just before its name.  Parameter decorators apply to the treatment of the parameter, and may affect how values are validated or logged.  Examples of parameter-level decorators:
-   [`@ArgName`](#argname)
-   [`@ArgDate`](#argdate)
-   [`@SkipLogging`](#skiplogging)
-   [`@LogMask`](#logmask)

### Input Validation Decorators

A combination of function and parameter decorators automatically provides rudimentary argument validation.

While the typescript compiler does some compile-time checks, it is possible (and likely) for programmers to pass user input directly through their code through the `any` type or a series of poorly-validated casts.  The DBOS function argument validation logic is able to check arguments exist and are of the right data types (or are close enough to be coerced through reasonable means).

Note that this validation is basic, and is not a substitute for the kind of input validation that conforms to your business logic.  For example, a policy that user passwords should be 8 characters, and contain at least an uppercase, lowercase, and numeric character should be implemented in the web UI (for immediate feedback) and double-checked in your backend code (for security), whereas the DBOS decorators will simply ensure that a password string was provided prior to function entry.

These decorators also serve a second purpose, which is to make the type information available to DBOS.  Uses of this include creating a per-function schema for tracing logs, or automatically producing a description of the function for integration purposes.

In simple cases (such as `string` or `number` arguments), the programmer need not do any decorating to get the functionality.  However, where the data types have some options, such as maximum length, precision, etc., there are decorators to control the behavior.

#### `@ArgRequired`
Ensures that the decorated function argument has a suitable value.  This is generally a default behavior, but see [`@DefaultArgRequired`](#defaultargrequired) and [`@DefaultArgOptional`](#defaultargoptional).
```typescript
@DBOS.getApi("/string")
static async checkStringG(@ArgRequired v: string) {
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
@DBOS.getApi("/string")
static async checkStringG(@ArgOptional v?: string) {
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
@DBOS.getApi("/string")
static async checkStringG(@ArgName('call_me_maybe') internal_name: string) {
  ...
}
```

#### `@ArgDate`
Ensures that a Date argument has a suitable value.  This decorator currently accepts no configuration, but may be altered in the future to indicate whether it is a timestamp or plain date.

```typescript
@DBOS.getApi("/date")
static async checkDateG(@ArgDate() v: Date) {
  ...
}
```

#### `@ArgVarchar`
Ensures that a string argument has a suitable length.  This decorator requires a length parameter.

```typescript
@BOS.getApi("/string")
static async checkStringG(@ArgVarchar(10) v: string) {
  ...
}
```

### Logging and Tracing Decorators

#### `@SkipLogging`

Prevents a function argument from being recorded in traces. This could be used if the argument is an opaque object, context, connection, service, or of sensitive nature. See also [`@LogMask`](#logmask).

```typescript
export class Operations
{
  @DBOS.transaction()
  static async doOperation(@SkipLogging notToBeRecorded: unknown) {
    ...
  }
}
```

#### `@LogMask`
Prevents an argument from being recorded in traces in plain text. This could be used if the argument is sensitive in nature, but may be useful for debugging or tracing. See also [`@SkipLogging`](#skiplogging).

```typescript
export class Operations
{
  @DBOS.transaction()
  static async doOperation(@LogMask(LogMasks.HASH) toBeHashed: string) {
    ...
  }
}
```

Values of `LogMasks`:
- `NONE`: No masking.
- `HASH`: When logging the value, substitute its (not cryptographically secure) hash.
- `SKIP`: Do not include the parameter in the log.  See [`@SkipLogging`](#skiplogging).

### HTTP Parameters

#### `@ArgSource`
Indicates where a function argument is to be sourced, when it could come from more than one place.

In the example below, `@ArgSource` is used to indicate that the `name` argument comes from the URL query string, rather than the posted message body.

```typescript
@DBOS.postApi("/workflow")
@DBOS.workflow()
static async testWorkflow(@ArgSource(ArgSources.QUERY) name: string) {
  const res = await TestEndpoints.testTranscation(name);
  return res;
}
```

The `@ArgSource` decorator takes one of the following values of `ArgSources`:
- `DEFAULT`: The default value. For GET requests, this means searching for query parameters; for POST requests, searching the request body.
- `BODY`: Indicates to search the parameter in the request body.
- `QUERY`: Indicates to search the parameter in the URL query string.
- `URL`: Indicates to search the parameter in the endpoint path (requires a path placeholder).

Arguments sourced from an HTTP request generally get the name given in the code for the function.  However, if the name in the HTTP query string or body is different, [`@ArgName`](#argname) may be used.
