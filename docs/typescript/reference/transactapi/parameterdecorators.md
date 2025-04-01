---
sidebar_position: 40
title: Parameter Decorators
description: API reference for DBOS Parameter decorators.
---

## Parameter Decorators

Parameter decorators are affixed to a function parameter, just before its name.  Parameter decorators apply to the treatment of the parameter, and may affect how values are validated or logged.  Examples of parameter-level decorators:
-   [`@ArgName`](#argname)
-   [`@SkipLogging`](#skiplogging)
-   [`@LogMask`](#logmask)

#### `@ArgOptional`
Allows the argument to have an undefined value.  See also [`@DefaultArgOptional`](#defaultargoptional).

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
Sets as the default policy that each argument of each registered function in the decorated class may have undefined value.  See also [`@ArgOptional`](#argoptional).
```typescript
@DefaultArgOptional
export class User {}
```

### Logging and Tracing Decorators

#### `@ArgName`
Assigns a name to the decorated parameter.  The name of an argument is, by default, taken from the code, but if there is a reason for a disparity (perhaps the function was refactored but the external name used in tracing or HTTP requests is to be kept consistent), the name can be overriden with this parameter decorator.

```typescript
@DBOS.getApi("/string")
static async checkStringG(@ArgName('call_me_maybe') internal_name: string) {
  ...
}
```

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
