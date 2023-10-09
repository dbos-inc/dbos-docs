---
sidebar_position: 7
title: External Communication
description: Learn how to communicate with external APIs and services
---

In this guide, you'll learn how to communicate with external APIs and services from an Operon application.

We recommend that all communication with external services be done in _communicator_ functions.
For example, you can  use communicators to serve a file from [AWS S3](https://aws.amazon.com/s3/), call an external API like [Stripe](https://stripe.com/) or access a non-Postgres data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).

Communicators must be annotated with the [`@OperonCommunicator`](../api-reference/decorators#operoncommunicator) decorator and must have a [`CommunicatorContext`](..) as their first argument.  Here's a simple example using [Axios](https://axios-http.com/docs/intro) to call the [Postman Echo API](https://learning.postman.com/docs/developer/echo-api/):


```javascript
  @OperonCommunicator()
  static async postmanEcho(_ctxt: CommunicatorContext) {
    const resp = await axios.get("https://postman-echo.com/get");
    return resp.data;
  }
```

### Retries

By default, Operon automatically retries any communicator function that throws an exception.
It retries communicator functions a set number of times with exponential backoff, throwing an [`OperonError`](..) if the maximum number of retries is exceed.
Retries are fully configurable through arguments to the [`@OperonCommunicator`](../api-reference/decorators#operoncommunicator) decorator.
