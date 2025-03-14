---
sidebar_position: 85
title: Using Instantiated Objects
description: Learn how to make workflows, transactions, and steps reusable and configurable by instantiating objects
---

You can add DBOS workflow, step, and transaction decorators to your TypeScript class instance methods.
To add DBOS decorators to your instance methods, their class must inherit from `ConfiguredInstance`, which will take an instance name and register the instance.

For example:
```typescript
class MyClass extends ConfiguredInstance {
  cfg: MyConfig;
  constructor(name: string, config: MyConfig) {
    super(name);
    this.cfg = cfg;
  }

  async initialize(_ctx: InitContext) : Promise<void> {
    // ... Validate this.cfg
  }

  @DBOS.transaction()
  async testTransaction() {
    // ... Operations that use this.cfg
  }

  @DBOS.step()
  async testStep() {
    // ... Operations that use this.cfg
  }

  @DBOS.workflow()
  async testWorkflow(p: string): Promise<void> {
    // ... Operations that use this.cfg
  }
}

const myClassInstance = new MyClass('instanceA');
```

When you create a new instance of a DBOS-decorated class, the constructor for the base `ConfiguredInstance` must be called with a `name`. This `name` should be unique among instances of the same class.   Additionally, all `ConfiguredInstance` classes must be instantiated before DBOS.launch() is called.

The reason for these requirements is to enable workflow recovery.  When you create a new instance of, DBOS stores it in a global registry indexed by `name`.  When DBOS needs to recover a workflow belonging to that class, it looks up the `name` so it can run the workflow using the right class instance.  While names are used by DBOS Transact internally to find the correct object instance across system restarts, they are also potentially useful for monitoring, tracing, and debugging.

## Using Configured Class Instances
Configured class instances should be created and named when the application starts, before any workflows run.  This ensures that they will all be initialized before any processing begins.

### Writing New Configured Classes
All configured classes must:
* Extend from the `ConfiguredInstance` base class
* Provide a constructor, which can take any arguments, but must provide a name to the base `ConfiguredInstance` constructor
* Have an `initialize(ctx: InitContext)` that will be called after all objects have been created, but before request handling commences
* Have `@DBOS.transaction`, `@DBOS.step`, and/or `@DBOS.workflow` methods to be called on the instances

### `initialize()` Method
The `initialize(ctx: InitContext)` method will be called during application initialization, after the code modules have been loaded, but before request and workflow processing commences.  The `InitContext` argument provides configuration file, logging, and database access services, so any validation of connection information (complete with diagnostic logging and reporting of any problems) should be performed in `initialize()`.

## Notes
As `@DBOS.scheduled`, `@KafkaConsume`, `@DBOS.getApi`, `@DBOS.putApi`, and similar handler registration decorators cannot be applied to instance methods.
