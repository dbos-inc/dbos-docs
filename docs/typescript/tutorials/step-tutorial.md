---
sidebar_position: 20
title: Steps
description: Learn how to communicate with external APIs and services
---

When using DBOS workflows, you should annotate any function that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

You can turn **any** TypeScript function into a step by annotating it with the [`@DBOS.step`](../reference/transactapi/dbos-class.md#dbosstep) decorator.
The only requirements are that it must be a static class member function and that its inputs and outputs should be serializable to JSON.
Here's a simple example:

```javascript
class Example {
  @DBOS.step()
  static async exampleStep() {
    return await fetch("https://example.com").then(r => r.text());
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

### Configurable Retries

You can optionally configure a step to automatically retry any exception a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
Retries are configurable through arguments to the [step decorator](../reference/transactapi/dbos-class.md#dbosstep):

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
  @DBOS.step({retriesAllowed=true, maxAttempts: 10})
  static async exampleStep() {
    return await fetch("https://example.com").then(r => r.text());
  }
```

If a step exhausts all `max_attempts` retries, it throws an exception (`DBOSMaxStepRetriesError`) to the calling workflow.
If that exception is not caught, the workflow [terminates](./workflow-tutorial.md#reliability-guarantees).