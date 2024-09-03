---
sidebar_position: 3
title: Communicators
description: Learn how to communicate with external APIs and services
---

When using DBOS workflows, we recommend marking functions that communicate with external APIs and services as _communicators_.

You can easily turn **any** Python function into a communicator by annotating it with the [`@DBOS.communicator`](../reference/decorators.md#communicator) decorator.
Here's a simple example:

```python
@DBOS.communicator()
def example_communicator():
    return requests.get("https://example.com").text
```

You should mark a function as a communicator if you're using it in a DBOS [workflow](./workflow-tutorial.md) and it accesses an external API or service, like serving a file from [AWS S3](https://aws.amazon.com/s3/), calling an external API like [Stripe](https://stripe.com/), or accessing an external data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).

Marking functions as communicators has two benefits:

1. It lets [workflows](./workflow-tutorial.md) know this function interacts with an external API, so the workflow can guarantee those calls happen exactly-once.

2. DBOS provides [configurable automatic retries](#configurable-retries) for communicators to more easily handle transient errors.


### Configurable Retries

You can optionally configure a communicator to automatically retry any exception a set number of times with exponential backoff.
Retries are configurable through arguments to the [communicator decorator](../reference/decorators.md#communicator):

```python
DBOS.communicator(
    retries_allowed: bool = False,
    interval_seconds: float = 1.0,
    max_attempts: int = 3,
    backoff_rate: float = 2.0
)
```

For example, we can configure our simple communicator to retry exceptions (such as if `example.com` is temporarily down) up to 10 times:

```python
@DBOS.communicator(retries_allowed=True, max_attempts=10)
def example_communicator():
    return requests.get("https://example.com").text
```