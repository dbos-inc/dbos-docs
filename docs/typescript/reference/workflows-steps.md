---
sidebar_position: 20
title: Workflows & Steps
---

## Workflows

### DBOS.workflow

```typescript
DBOS.workflow(
    config: WorkflowConfig = {}
)
```

```typescript
export interface WorkflowConfig {
  maxRecoveryAttempts?: number;
}
```

A decorator that marks a function as a DBOS durable workflow.

**Example:**
```typescript
export class Example {
  @DBOS.workflow()
  static async exampleWorkflow() {
    await Example.stepOne();
    await Example.stepTwo();
  }
}

// The workflow function can be called normally
await Example.exampleWorkflow();
```

**Parameters:**
- **max_recovery_attempts**: The maximum number of times the workflow may be attempted.
This acts as a [dead letter queue](https://en.wikipedia.org/wiki/Dead_letter_queue) so that a buggy workflow that crashes its application (for example, by running it out of memory) does not do so infinitely.
If a workflow exceeds this limit, its status is set to `RETRIES_EXCEEDED` and it is no longer automatically recovered.

### DBOS.registerWorkflow

```typescript
DBOS.registerWorkflow<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Promise<Return>,
  name: string,
  options: {
    classOrInst?: object;
    className?: string;
    config?: WorkflowConfig;
  } = {},
): (this: This, ...args: Args) => Promise<Return> 
```

Wrap a function in a DBOS workflow.
Returns the wrapped function.

**Example:**

```typescript
async function example() {
  await stepOne();
  await stepTwo();
}

const exampleWorkflow = DBOS.registerWorkflow(example, "exampleWorkflow")
// The wrapped workflow function can be called normally
await exampleWorkflow();
```

**Parameters:**
- **func**: The function to be wrapped in a workflow.
- **name**: A name to give the workflow.
- **classOrInst**: If the function is a class instance method, the instance. If it is a static class method, the class.
- **className**: ???
- **config**: Configuration for the workflow, documented above.

### DBOS.scheduled

```typescript
DBOS.scheduled(
  schedulerConfig: SchedulerConfig
);
```

```typescript
class SchedulerConfig {
  crontab: string;
  mode?: SchedulerMode = SchedulerMode.ExactlyOncePerIntervalWhenActive;
  queueName?: string;
}
```

A decorator directing DBOS to run a workflow on a schedule specified using [crontab](https://en.wikipedia.org/wiki/Cron) syntax.
See [here](https://docs.gitlab.com/ee/topics/cron/) for a guide to cron syntax and [here](https://crontab.guru/) for a crontab editor.

The annotated function must take in two parameters: The time that the run was scheduled (as a `Date`) and the time that the run was actually started (also a `Date`).
For example:

```typescript
import { DBOS } from '@dbos-inc/dbos-sdk';

class ScheduledExample{
  @DBOS.workflow()
  @DBOS.scheduled({crontab: '*/30 * * * * *'})
  static async scheduledFunc(schedTime: Date, startTime: Date) {
    DBOS.logger.info(`I am a workflow scheduled to run every 30 seconds`);
  }
}
```

**Parameters:**
- **crontab**: The schedule in [crontab](https://en.wikipedia.org/wiki/Cron) syntax.
The DBOS variant contains 5 or 6 items, separated by spaces:

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
- **mode**:  Whether or not to retroactively start workflows that were scheduled during times when the app was not running. Set to `SchedulerMode.ExactlyOncePerInterval` to enable this behavior.
- **queueName**: If set, workflows will be enqueued on the named queue, rather than being started immediately.


## Steps

### DBOS.step

```typescript
DBOS.step(
    config: StepConfig = {}
)
```

```typescript
export interface StepConfig {
  name?: name;
  retriesAllowed?: boolean;
  intervalSeconds?: number;
  maxAttempts?: number;
  backoffRate?: number;
}
```

A decorator that marks a function as a step in a durable workflow.

**Example:**
```typescript
export class Example {
  @DBOS.step()
  static async stepOne() {
    DBOS.logger.info("Step one completed!");
  }

  @DBOS.step()
  static async stepTwo() {
    DBOS.logger.info("Step two completed!");
  }

  // Call steps from workflows
  @DBOS.workflow()
  static async exampleWorkflow() {
    await Toolbox.stepOne();
    await Toolbox.stepTwo();
  }
}
```

**Parameters:**
- **name**: A name to give the step. If not provided, use the function name.
- **retriesAllowed**: Whether to retry the step if it throws an exception.
- **intervalSeconds**: How long to wait before the initial retry.
- **maxAttempts**: How many times to retry a step that is throwing exceptions.
- **backoffRate**: How much to multiplicatively increase `intervalSeconds` between retries.

### DBOS.registerStep

```typescript
DBOS.registerStep<This, Args extends unknown[], Return>(
  func: (this: This, ...args: Args) => Promise<Return>,
  config: StepConfig = {},
): (this: This, ...args: Args) => Promise<Return>
```

Wrap a function in a step to safely call it from a durable workflow.
Returns the wrapped function.

**Example:**

```typescript
async function stepOne() {
  DBOS.logger.info("Step one completed!");
}
const regStepOne = DBOS.registerStep(stepOne);

async function stepTwo() {
  DBOS.logger.info("Step two completed!");
}
const regStepTwo = DBOS.registerStep(stepTwo);

// Call steps from workflows
async function exampleWorkflow() {
  await regStepOne();
  await regStepTwo();
}
```

**Parameters:**
- **func**: The function to be wrapped in a step.
- **config**: The step config, documented above.

### DBOS.runStep

```typescript
DBOS.runStep<Return>(
    func: () => Promise<Return>, 
    config: StepConfig = {},
): Promise<Return> {
```

Run a function as a step in a workflow.
Can only be called from a durable workflow.
Returns the output of the step.

**Example:**

```typescript
async function stepOne() {
  DBOS.logger.info("Step one completed!");
}

async function stepTwo() {
  DBOS.logger.info("Step two completed!");
}

// Use DBOS.runStep to run any function as a step
async function exampleWorkflow() {
  await DBOS.runStep(() => stepOne(), {name: "stepOne"});
  await DBOS.runStep(() => stepTwo(), {name: "stepTwo"});
}
```

**Parameters:**
- **func**: The function to run as a step.
- **config**: The step config, documented above.


## Configured Instances

```typescript
abstract class ConfiguredInstance {
  constructor(name: string)  
}
```

You can register or decorate class instance methods as DBOS workflows or steps.
To do this, their class must inherit from `ConfiguredInstance`, which takes an instance name and registers the instance.

When you create a new instance of the class, the constructor for the base `ConfiguredInstance` must be called with a `name`.
This `name` should be unique among instances of the same class.
Additionally, all `ConfiguredInstance` classes must be instantiated before `DBOS.launch()` is called.

For example:
```typescript
class MyClass extends ConfiguredInstance {
  cfg: MyConfig;
  constructor(name: string, config: MyConfig) {
    super(name);
    this.cfg = cfg;
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

The reason for these requirements is to enable workflow recovery.  When you create a new instance of, DBOS stores it in a global registry indexed by `name`.  When DBOS needs to recover a workflow belonging to that class, it looks up the `name` so it can run the workflow using the right class instance.  While names are used by DBOS Transact internally to find the correct object instance across system restarts, they are also potentially useful for monitoring, tracing, and debugging.
