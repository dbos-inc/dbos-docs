---
sidebar_position: 20
title: Steps
description: Learn how to communicate with external APIs and services
---

When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

You can use `DBOS.runStep` to call a function as a step.  For a function to be used as a step, it should have a return value that can be serialized as JSON, and should not have non-durable side effects.

Here's a simple example:

```javascript
async function generateRandomNumber() {
  return Math.random();
}

async function workflowFunction() {
  const randomNumber = await DBOS.runStep(() => generateRandomNumber(), {name: "generateRandomNumber"});
}
const workflow = DBOS.registerWorkflow(workflowFunction)
```

Alternatively, you can register a function as a step using `DBOS.registerStep`:

```javascript
async function generateRandomNumber() {
  return Math.random();
}
const randomStep = DBOS.registerStep(generateRandomNumber);

async function workflowFunction() {
  const randomNumber = await randomStep();
}
const workflow = DBOS.registerWorkflow(workflowFunction)
```

Or use the `@DBOS.step()` decorator:

```typescript
export class Example {
  @DBOS.step()
  static async generateRandomNumber() {
    return Math.random();
  }

  @DBOS.workflow()
  static async exampleWorkflow() {
    await Example.generateRandomNumber();
  }
}
```


You should make a function a step if you're using it in a DBOS workflow and it performs a [**nondeterministic**](../tutorials/workflow-tutorial.md#determinism) operation.
A nondeterministic operation is one that may return different outputs given the same inputs.
Common nondeterministic operations include:

- Accessing an external API or service, like serving a file from [AWS S3](https://aws.amazon.com/s3/), calling an external API like [Stripe](https://stripe.com/), or accessing an external data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).
- Accessing files on disk.
- Generating a random number.
- Getting the current time.

You **cannot** call, start, or enqueue workflows from within steps.
You also cannot call DBOS methods like `DBOS.send` or `DBOS.setEvent` from within steps.
These operations should be performed from workflow functions.
You can call one step from another step, but the called step becomes part of the calling step's execution rather than functioning as a separate step.

### Configurable Retries

You can optionally configure a step to automatically retry any exception a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
Retries are configurable through the `StepConfig`, which can be passed to `runStep`, `registerStep`, or the step decorator.

```typescript
export interface StepConfig {
  retriesAllowed?: boolean; // Should failures be retried? (default false)
  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).
  maxAttempts?: number;     // Maximum number of retry attempts (default 3). If errors occur more times than this, throw an exception.
  backoffRate?: number;     // Multiplier by which the retry interval increases after a retry attempt (default 2).
}
```

For example, let's configure this step to retry exceptions (such as if `example.com` is temporarily down) up to 10 times:

```javascript
async function fetchFunction() {
    return await fetch("https://example.com").then(r => r.text());
}

async function workflowFunction() {
    const randomNumber = await DBOS.runStep(() => fetchFunction(), {
        name: "fetchFunction",
        retriesAllowed: true,
        maxAttempts: 10
    });
}
```

Or if registering the step:

```javascript
async function fetchFunction() {
    return await fetch("https://example.com").then(r => r.text());
}
const fetchStep = DBOS.registerStep(fetchFunction, {
    retriesAllowed: true,
    maxAttempts: 10
});
```

Or if using decorators:

```javascript
@DBOS.step({retriesAllowed: true, maxAttempts: 10})
static async exampleStep() {
  return await fetch("https://example.com").then(r => r.text());
}
```

If a step exhausts all `max_attempts` retries, it throws an exception (`DBOSMaxStepRetriesError`) to the calling workflow.
If that exception is not caught, the workflow [terminates](./workflow-tutorial.md#reliability-guarantees).
