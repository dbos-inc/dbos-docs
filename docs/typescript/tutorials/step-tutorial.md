---
sidebar_position: 20
title: Steps
description: Learn how to communicate with external APIs and services
---

When using DBOS workflows, we recommend annotating any function that accesses external APIs or services as a _step_.

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

You should make a function a step if you're using it in a DBOS [workflow](./workflow-tutorial.md) and it accesses an external API or service, like serving a file from [AWS S3](https://aws.amazon.com/s3/), calling an external API like [Stripe](https://stripe.com/), or accessing an external data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).

Making a function a step has two benefits:

1. If a [workflow](./workflow-tutorial.md) is interrupted, upon restart it automatically resumes execution from the **last completed step**.
Therefore, making a function a step guarantees that a workflow will never re-execute it once it completes.

2. DBOS provides [configurable automatic retries](#configurable-retries) for steps to more easily handle transient errors.

### Configurable Retries

You can optionally configure a step to automatically retry any exception a set number of times with exponential backoff.
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