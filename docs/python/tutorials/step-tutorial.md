---
sidebar_position: 20
title: Steps
---

When using DBOS workflows, you should annotate any function that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

You can turn **any** Python function into a step by annotating it with the [`@DBOS.step`](../reference/decorators.md#step) decorator.
The only requirement is that its outputs should be serializable.
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
If that exception is not caught, the workflow [terminates](./workflow-tutorial.md).

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

### Running Steps In-Line With `run_step`

If a function is not decorated with `@DBOS.step` and you would prefer not to wrap it, you can call the code as a step using [`DBOS.run_step`](../reference/contexts.md#run_step) (or `DBOS.run_step_async`).

For example, if your code said:
```python
res = send_email(user, msg)
```

It could be quickly changed to a checkpointed step:

```python
res = DBOS.run_step(None, send_email, user, msg)
```

Or:
```python
res = DBOS.run_step({"name": "send_email_to_user"}, lambda: send_email(user, msg))
```


### Transactions

Transactions are an **optional** type of [step](./step-tutorial.md) that are optimized for database accesses.
They execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction).

To make a Python function a transaction, annotate it with the [`@DBOS.transaction`](../reference/decorators.md#transaction) decorator.
Then, access the database using the [`DBOS.sql_session`](../reference/contexts.md#sql_session) client, which is a [SQLAlchemy](https://www.sqlalchemy.org/) client that executes your database operations in the same transaction as DBOS's checkpointing.
Here are some examples:

<Tabs groupId="database-clients">
<TabItem value="sqlalchemy" label="SQLAlchemy">

```python
greetings = Table(
    "greetings", 
    MetaData(), 
    Column("name", String), 
    Column("note", String)
)

@DBOS.transaction()
def example_insert(name: str, note: str) -> None:
    # Insert a new greeting into the database
    DBOS.sql_session.execute(greetings.insert().values(name=name, note=note))

@DBOS.transaction()
def example_select(name: str) -> Optional[str]:
    # Select the first greeting to a particular name
    row = DBOS.sql_session.execute(
        select(greetings.c.note).where(greetings.c.name == name)
    ).first()
    return row[0] if row else None
```

</TabItem>
<TabItem value="raw" label="Raw SQL">

```python
@DBOS.transaction()
def example_insert(name: str, note: str) -> None:
    # Insert a new greeting into the database
    sql = text("INSERT INTO greetings (name, note) VALUES (:name, :note)")
    DBOS.sql_session.execute(sql, {"name": name, "note": note})


@DBOS.transaction()
def example_select(name: str) -> Optional[str]:
    # Select the first greeting to a particular name
    sql = text("SELECT note FROM greetings WHERE name = :name LIMIT 1")
    row = DBOS.sql_session.execute(sql, {"name": name}).first()
    return row[0] if row else None
```

</TabItem>
</Tabs>

Transactions should run in the database in which your application stores data.
You can specify the database in which transactions run by setting an `application_database_url` when you configure DBOS.
The application database (the database in which transactions run) does not need to be the same database (or even on the same server) as your system database.
For example:

```python
config: DBOSConfig = {
    "name": "dbos-example",
    "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
    "application_database_url": os.environ["APP_DATABASE_URL"],
}
DBOS(config=config)
```
:::warning

At this time, DBOS does not support coroutine transactions. 
Decorating an `async def` function with `@DBOS.transaction` will raise an error at runtime.

:::
