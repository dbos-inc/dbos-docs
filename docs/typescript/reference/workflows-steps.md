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