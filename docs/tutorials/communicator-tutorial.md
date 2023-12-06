---
sidebar_position: 3
title: Communicators
description: Learn how to communicate with external APIs and services
---

In this guide, you'll learn how to communicate with external APIs and services from an Operon application.

We recommend that all communication with external services be done in _communicator_ functions.
For example, you can use communicators to serve a file from [AWS S3](https://aws.amazon.com/s3/), call an external API like [Stripe](https://stripe.com/) or access a non-Postgres data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).
Encapsulating these calls in communicators is especially important if you're using [workflows](./workflow-tutorial) as it lets the workflow know to make their results persistent through interruptions.

Communicators must be annotated with the [`@Communicator`](../api-reference/decorators#communicator) decorator and must have a [`CommunicatorContext`](../api-reference/contexts#communicatorcontext) as their first argument.
Like for other Operon functions, inputs and outputs must be serializable to JSON.
Here's a simple example from the [quickstart](../getting-started/quickstart-programming-2.md) using [Axios](https://axios-http.com/docs/intro) to call the [Postman Echo API](https://learning.postman.com/docs/developer/echo-api/):


```javascript
  @Communicator()
  static async greetPostman(ctxt: CommunicatorContext, greeting: string) {
    await axios.get("https://postman-echo.com/get", {
      params: {
        greeting: greeting
      }
    });
    ctxt.logger.info(`Greeting sent to postman!`);
  }
```

### Retries

By default, Operon automatically retries any communicator function that throws an exception.
It retries communicator functions a set number of times with exponential backoff, throwing an exception if the maximum number of retries is exceed.
Retries are fully configurable through arguments to the [`@Communicator`](../api-reference/decorators#communicator) decorator.
