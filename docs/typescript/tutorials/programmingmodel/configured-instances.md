---
sidebar_position: 70
title: Configuring Class Instances
description: Learn how to make workflows, transactions, and steps reusable and configurable
---

In this guide, you'll learn how to make your DBOS functions configurable using instances.

## Concepts
Basic DBOS transactions, steps, and workflows are just functions - they accept input parameters, apply those parameters to the database, or use them to place calls to external services.

However, it is sometimes desirable to have configuration information available to DBOS functions.  Using function parameters for items such as access URLs, API keys, port numbers, and so on is a bad idea, so these are generally stored as configuration data in `dbos-config.yaml` or otherwise accessed from context.

If a function needs more than one configuration, such global settings are not adequate.  For example, an email-sending function may send email with one set of addresses and credentials for promotional materials to prospects, or another set of credentials for replies to support inquiries from existing customers.

### Instances
Configured class instances are the DBOS Transact mechanism for creating multiple configurations for the same code.  Rather than having `static` class member functions, configured instances have non-static member functions that can access configuration information through `this`.

### Names
Configured instances have names, which are simple strings identifying the configuration.  These names are used by DBOS Transact internally, but are also potentially useful for monitoring, tracing, and debugging.

## Using Configured Class Instances
Configured class instances should be created and named when the application starts, before any workflows can run.  This ensures that they weill all be initialized before any processing begins.

### Creating
To create and register a class instance, the `configureInstance` function is used:
```typescript
import { configureInstance } from "@dbos-inc/dbos-sdk";
const myObj = configureInstance(MyClass, 'myname', args);
```

The arguments to `configureInstance` are:
* The class to be instantiated and configured
* The name for the configured instance (which must be unique within the set of instances of the same class)
* Any additional arguments to pass to the class constructor

```typescript
configureInstance(cls: Constructor, name: string, ...args: unknown[]) : R
```

Note that while this will create and register the object instance, initialization via the object's `initialize()` method will not occur until later, after database connections have been established.

### Invoking
Methods of configured instances can be invoked from contexts (and the testing runtime) in a manner syntactically similar to static class methods:

```typescript
ctx.invoke(MyClass).myStaticFunction(args); // Use on a static function
ctx.invoke(myObj).myMemberFunction(args); // Use on a configured object instance
```

## Writing New Configured Classes

### Declaring
All configured classes must:
* Extend from the `ConfiguredInstance` base class
* Provide a constructor, which can take any arguments, but must provide a name to the base `ConfiguredInstance` constructor
* Have an `initialize(ctx: InitContext)` that will be called after all objects have been created, but before request handling commences
* Have `@Transaction`, `@Step`, and/or `@Workflow` methods to be called on the instances

```typescript
class MyConfiguredClass extends ConfiguredInstance {
  cfg: MyConfig;
  constructor(name: string, config: MyConfig) {
    super(name);
    this.cfg = cfg;
  }

  initialize(_ctx: InitContext) : Promise<void> {
    // Validate this.cfg
    return Promise.resolve();
  }

  @Transaction()
  testTransaction(_txnCtxt: TestTransactionContext) {
    // Operations that use this.cfg
    return Promise.resolve();
  }

  @Step()
  testStep(_ctxt: StepContext) {
    // Operations that use this.cfg
    return Promise.resolve();
  }

  @Workflow()
  async testWorkflow(ctxt: WorkflowContext, p: string): Promise<void> {
    // Operations that use this.cfg
    return Promise.resolve();
  }
}
```

### `initialize()` Method
The `initialize(ctx: InitContext)` method will be called during application initialization, after the code modules have been loaded, but before request and workflow processing commences.  The `InitContext` argument provides configuration file, logging, and database access services, so any validation of connection information (complete with diagnostic logging and reporting of any problems) should be performed in `initialize()`.

## Notes
As `@GetApi`, `@PutApi`, and similar handler registration decorators specify the URL directly, it does not make sense to use these on configured class instances, as there is no way to tell which instance is to handle the request.

The name of a workflow, and the name of the configuration in use, is kept in the DBOS system database so that interrupted workflows can be resumed.  It is therefore important to keep names consistent across application deployments, unless there is no chance that a pending workflow will need to be recovered.
