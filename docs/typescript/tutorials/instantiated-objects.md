---
sidebar_position: 80
title: Using Typescript Objects
---

You can use class instance methods as workflows and steps.
Any class instance method can be freely used as a step using [`DBOS.runStep`](../reference/workflows-steps.md#dbosrunstep); there are no special requirements.
To use the [`DBOS.step`](../reference/workflows-steps.md#dbosstep) decorator on a class instance method, the class must inherit from `ConfiguredInstance`.
To use a class instance method as a workflow, the class must inherit from `ConfiguredInstance`, and you must either use the [`DBOS.workflow`](../reference/workflows-steps.md#dbosworkflow) decorator or register the method with [`DBOS.registerWorkflow`](../reference/workflows-steps.md#instance-method-workflows), passing the class's prototype (`MyClass.prototype`) as `ctorOrProto`.
For example:

```typescript
class MyClass extends ConfiguredInstance {
  cfg: MyConfig;
  constructor(name: string, config: MyConfig) {
    super(name);
    this.cfg = config;
  }

  override async initialize() : Promise<void> {
    // ... Validate this.cfg; will be called at DBOS.launch()
  }

  @DBOS.workflow()
  async testWorkflow(p: string): Promise<void> {
    // ... Operations that use this.cfg
  }
}

const myClassInstance = new MyClass('instanceA', myConfig);
```

When you create a new instance of such a class, the constructor for the base `ConfiguredInstance` must be called with a `name`.
This `name` must be unique among instances of the same class.
Additionally, all `ConfiguredInstance` classes must be instantiated before DBOS.launch() is called.

The reason for these requirements is to enable workflow recovery.  When you create a new instance of a `ConfiguredInstance` class, DBOS stores it in a global registry indexed by `name`.  When DBOS needs to recover a workflow belonging to that class, it looks up the `name` so it can run the workflow using the right class instance.  While names are used by DBOS Transact internally to find the correct object instance across system restarts, they are also potentially useful for monitoring, tracing, and debugging.

## Using Configured Class Instances
Configured class instances should be created and named when the application starts, before any workflows run.  This ensures that they will all be initialized before any processing begins.

### Writing New Configured Classes
All configured classes:
* Extend from the `ConfiguredInstance` base class
* Provide a constructor, which can take any arguments, but must provide a name to the base `ConfiguredInstance` constructor
* May have an `initialize()` method that will be called after all objects have been created, but before workflow processing commences

### `initialize()` Method
The `initialize()` method will be called during application initialization, after the code modules have been loaded, but before workflow processing commences.  [`DBOS`](../reference/dbos-class.md) is available during initialize.  Any validation of connection information (complete with diagnostic logging and reporting of any problems) should be performed in `initialize()`.

## Notes
Event receiver decorators such as the [Kafka](./externalmessages.md) `@consumer` decorator cannot be applied to instance methods.