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
  static registerWorkflow<This, Args extends unknown[], Return>(
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
  static registerStep<This, Args extends unknown[], Return>(
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
runStep<Return>(
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