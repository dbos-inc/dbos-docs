---
sidebar_position: 3
title: Communicators
description: Learn how to communicate with external APIs and services
---

In this guide, you'll learn how to communicate with external APIs and services from a DBOS application.

We recommend that all communication with external services be done in _communicator_ functions.
For example, you can use communicators to serve a file from [AWS S3](https://aws.amazon.com/s3/), call an external API like [Stripe](https://stripe.com/), or access a non-Postgres data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).
Encapsulating these calls in communicators is especially important if you're using [workflows](./workflow-tutorial) so the workflow knows to execute them only once.

Communicators must be annotated with the [`@Communicator`](../api-reference/decorators#communicator) decorator and must have a [`CommunicatorContext`](../api-reference/contexts#communicatorcontext) as their first argument.
As with other DBOS functions, communicator inputs and outputs must be serializable to JSON.
Here's a simple example using [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) to retrieve the contents of `https://example.com`:


```javascript
  @Communicator()
  static async exampleCommunicator(ctxt: CommunicatorContext) {
    return await fetch("https://example.com").then(r => r.text());
  }
```

### Configurable Retries

DBOS automatically retries any communicator function that throws an exception.
It retries communicator functions a set number of times with exponential backoff, throwing an exception if the maximum number of retries is exceed.
You can configure the retry policy by passing a `CommunicatorConfig` to your [`@Communicator`](../api-reference/decorators.md#communicator) decorator:

```typescript
export interface CommunicatorConfig {
  retriesAllowed?: boolean; // Should failures be retried? (default true)
  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).
  maxAttempts?: number;     // Maximum number of retry attempts (default 3). If errors occur more times than this, throw an exception.
  backoffRate?: number;     // Multiplier by which the retry interval increases after a retry attempt (default 2).
}
```

For example, to set the maximum number of retries to 10:

```javascript
  @Communicator({maxAttempts: 10})
  static async exampleCommunicator(ctxt: CommunicatorContext) {
    return await fetch("https://example.com").then(r => r.text());
  }
```