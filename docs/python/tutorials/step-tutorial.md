---
sidebar_position: 2
title: Steps
---

When using DBOS workflows, we recommend annotating any function that performs complex operations or accesses external APIs or services as a _step_.

You can turn **any** Python function into a step by annotating it with the [`@DBOS.step`](../reference/decorators.md#step) decorator.
The only requirement is that its inputs and outputs should be serializable ([pickle](https://docs.python.org/3/library/pickle.html)-able).
Here's a simple example:

```python
@DBOS.step()
def example_step():
    return requests.get("https://example.com").text
```

You should make a function a step if you're using it in a DBOS [workflow](./workflow-tutorial.md) and it accesses an external API or service, like serving a file from [AWS S3](https://aws.amazon.com/s3/), calling an external API like [Stripe](https://stripe.com/), or accessing an external data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).

Making a function a step has two benefits:

1. If a [workflow](./workflow-tutorial.md) is interrupted, upon restart it automatically resumes execution from the **last completed step**.
Therefore, making a function a step guarantees that a workflow will never re-execute it once it completes.

2. DBOS provides [configurable automatic retries](#configurable-retries) for steps to more easily handle transient errors.


### Configurable Retries

You can optionally configure a step to automatically retry any exception a set number of times with exponential backoff.
Retries are configurable through arguments to the [step decorator](../reference/decorators.md#step):

```python
DBOS.step(
    retries_allowed: bool = False,
    interval_seconds: float = 1.0,
    max_attempts: int = 3,
    backoff_rate: float = 2.0
)
```

For example, we configure this step to retry exceptions (such as if `example.com` is temporarily down) up to 10 times:

```python
@DBOS.step(retries_allowed=True, max_attempts=10)
def example_step():
    return requests.get("https://example.com").text
```


### Coroutine Steps

You may also decorate coroutines (functions defined with `async def`, also known as async functions) with `@DBOS.step`.
Coroutine steps can use Python's asynchronous language capabilities such as [await](https://docs.python.org/3/reference/expressions.html#await), [async for](https://docs.python.org/3/reference/compound_stmts.html#async-for) and [async with](https://docs.python.org/3/reference/compound_stmts.html#async-with).
Like syncronous step functions, async steps suppport [configurable automatic retries](#configurable-retries) and require its inputs and outputs to be serializable.  

For example, here is an asyncronous version of the `example_step` function from above, using the [`aiohttp`](https://docs.aiohttp.org/en/stable/) library instead of [`requests`](https://requests.readthedocs.io/en/latest/).

```python
@DBOS.step(retries_allowed=True, max_attempts=10)
async def example_step():
    async with aiohttp.ClientSession() as session:
        async with session.get("https://example.com") as response:
            return await response.text()
```