---
sidebar_position: 20
title: Steps
---

When using DBOS workflows, you should annotate any function that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

You can turn **any** Python function into a step by annotating it with the [`@DBOS.step`](../reference/decorators.md#step) decorator.
The only requirement is that its inputs and outputs should be serializable ([pickle](https://docs.python.org/3/library/pickle.html)-able).
Here's a simple example:

```python
@DBOS.step()
def example_step():
    return requests.get("https://example.com").text
```

You should make a function a step if you're using it in a DBOS workflow and it performs a [**nondeterministic**](../tutorials/workflow-tutorial.md#determinism) operation.
A nondeterministic operation is one that may return different outputs given the same inputs.
Common nondeterministic operations include:

- Accessing an external API or service, like serving a file from [AWS S3](https://aws.amazon.com/s3/), calling an external API like [Stripe](https://stripe.com/), or accessing an external data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).
- Accessing files on disk.
- Generating a random number.
- Getting the current time.

You **cannot** call, start, or enqueue workflows from within steps.
You also cannot call DBOS methods like `DBOS.send` or `DBOS.set_event` from within steps.
These operations should be performed from workflow functions.
You can call one step from another step, but the called step becomes part of the calling step's execution rather than functioning as a separate step.

### Configurable Retries

You can optionally configure a step to automatically retry any exception a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
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

If a step exhausts all `max_attempts` retries, it throws an exception (`DBOSMaxStepRetriesExceeded`) to the calling workflow.
If that exception is not caught, the workflow [terminates](./workflow-tutorial.md#reliability-guarantees).

### Coroutine Steps

You may also decorate coroutines (functions defined with `async def`, also known as async functions) with `@DBOS.step`.
Coroutine steps can use Python's asynchronous language capabilities such as [await](https://docs.python.org/3/reference/expressions.html#await), [async for](https://docs.python.org/3/reference/compound_stmts.html#async-for) and [async with](https://docs.python.org/3/reference/compound_stmts.html#async-with).
Like syncronous step functions, async steps suppport [configurable automatic retries](#configurable-retries) and require their inputs and outputs to be serializable.  

For example, here is an asynchronous version of the `example_step` function from above, using the [`aiohttp`](https://docs.aiohttp.org/en/stable/) library instead of [`requests`](https://requests.readthedocs.io/en/latest/).

```python
@DBOS.step(retries_allowed=True, max_attempts=10)
async def example_step():
    async with aiohttp.ClientSession() as session:
        async with session.get("https://example.com") as response:
            return await response.text()
```