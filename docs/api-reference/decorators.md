---
sidebar_position: 2
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
        -   [`@ArgName`](#argdate)
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
#### `@SkipLogging`
#### `@LogMask`

### Other Decorators

#### TypeORM Decorators
##### `@OrmEntities`
