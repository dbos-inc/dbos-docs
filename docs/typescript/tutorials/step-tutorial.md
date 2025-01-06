---
sidebar_position: 20
title: Steps
description: Learn how to communicate with external APIs and services
---

In this guide, you'll learn how to use _steps_.  Along with [transactions](./transaction-tutorial.md), _steps_ are functions used to build reliable [workflows](./workflow-tutorial.md).  A _step_ is just a function, but when executed to completion, the result of the _step_ will be stored durably in the DBOS system database, so that retried workflows will skip the step and use the stored output.  The stored output can also be used for [time travel](../../reference/tools/time-travel-debugger.md).  Thus, it is important to use _steps_ for all functions that read or update external state that may change between invocations.

One primary use of steps is to communicate with external APIs and services from a DBOS application.  For this reason, steps were often referred to as "communicators" in the past.  We recommend that all communication with external services be done in _step_ functions.

For example, you can use steps to serve a file from [AWS S3](https://aws.amazon.com/s3/), call an external API like [Stripe](https://stripe.com/), or access a non-Postgres data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).
Encapsulating these calls in steps is especially important if you're using [workflows](./workflow-tutorial).  That way, the workflow will complete them only once and record the result durably.

For correct workflow behavior, it is important to use _steps_ for all functions that interact with external state that may change with time.  While accessing external services is an obvious case, other non-deterministic functions include:
* Functions that return, or depend on, the current time
* Functions that produce random random numbers
* Functions that generate UUIDs
* Cryptographic functions that may generate a salt

Steps must be annotated with the [`@DBOS.step`](../../reference/transactapi/dbos-class.md#dbosstep) decorator.  As with other DBOS functions, step inputs and outputs must be serializable to JSON.

Here's a simple example using [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) to retrieve the contents of `https://example.com`:

```javascript
  @DBOS.step()
  static async exampleStep() {
    return await fetch("https://example.com").then(r => r.text());
  }
```

### Configurable Retries

DBOS automatically retries any step function that throws an exception.
It retries step functions a set number of times with exponential backoff, throwing an exception if the maximum number of retries is exceed.
You can configure the retry policy by passing a `StepConfig` to your [`@DBOS.step`](../../reference/transactapi/dbos-class#dbosstep) decorator:

```typescript
export interface StepConfig {
  retriesAllowed?: boolean; // Should failures be retried? (default true)
  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).
  maxAttempts?: number;     // Maximum number of retry attempts (default 3). If errors occur more times than this, throw an exception.
  backoffRate?: number;     // Multiplier by which the retry interval increases after a retry attempt (default 2).
}
```

For example, to set the maximum number of retries to 10:

```javascript
  @DBOS.step({maxAttempts: 10})
  static async exampleStep() {
    return await fetch("https://example.com").then(r => r.text());
  }
```