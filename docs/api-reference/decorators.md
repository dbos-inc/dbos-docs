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

TODO: Here is where we describe the nature of decorators/annotations and the general appeal and use

### Decorator Implementations

TODO: Here is the sob story about Stage 2 vs 3

### Typescript Compiler Flags

TODO: Here is the emit metadata and experimental decorators compilers flags

## Decorator Locations

TODO: Here we describe class / method / parameter decorators

### Class Decorators

### Method Decorators

### Parameter Decorators

## Decorators Reference

### Operon Decorators

#### `@OperonWorkflow`

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

The precise transaction semantics of these levels may vary with the capabilities of the Operon user database.  For example, see [isolation levels in Postgres](https://www.postgresql.org/docs/current/transaction-iso.html).

#### `@OperonCommunicator`

### HTTP API Registration Decorators
#### `@GetApi`
#### `@PostApi`
#### `@ArgSource`
#### `@Authentication`
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
