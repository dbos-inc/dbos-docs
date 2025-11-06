---
hide_table_of_contents: false
hide_title: false
title: Why DBOS?
---

### What is DBOS?

DBOS provides lightweight durable workflows built on top of Postgres.
Essentially, it helps you write long-lived, reliable code that can survive crashes, restarts, and failures without losing state or duplicating work.

In practice, DBOS makes it easier to build reliable systems for use cases like AI agents, payments, data pipelines, or anything that takes minutes, days, or weeks to complete. Rather than bolting on ad-hoc retry logic and database checkpoints, DBOS workflows give you one consistent model for ensuring progress without duplicate execution.

To get started, follow the [quickstart](./quickstart.md) to install the open-source library and connect it to a Postgres database.
Then, annotate workflows and steps in your program to make it durable!
That's all you need to do&mdash;DBOS is entirely contained in the open-source library, there's no additional infrastructure for you to configure or manage.

## How Does DBOS Work?

DBOS workflows make your program **durable** by checkpointing its state in Postgres.
If your program ever fails, when it restarts all your workflows will automatically resume from the last completed step.

For example, let's say you're running an e-commerce platform where an order goes through multiple steps:

<img src={require('@site/static/img/why-dbos/workflow-example.png').default} alt="Durable Workflow" width="750" className="custom-img"/>

This program looks simple, but making it _reliable_ is deceptively difficult.
For example, the program may crash (or its server may be restarted) after validating payment but before shipping an order.
Alternatively, the shipping service may experience an outage, leaving the shipping step impossible to complete.
In either case, the customer has been charged, but their order is never shipped.

DBOS makes these failures easier to recover from.
All you have to do is annotate your program with decorators like `@DBOS.workflow()` and `@DBOS.step()`:


```python
@DBOS.step()
def validate_payment():
    ...

@DBOS.workflow()
def checkout_workflow()
    validate_payment()
    check_inventory()
    ship_order()
    notify_customer()
```

These decorators **durably execute** your program, persisting its state to a Postgres database:

<img src={require('@site/static/img/why-dbos/dbos-pg.png').default} alt="Durable Workflow" width="750" className="custom-img"/>

You can think of this stored state as a checkpoint for your program.
If your program is ever interrupted or crashes, DBOS uses this saved state to recover it from the last completed step.
For example, if your checkout workflow crashes right after validating payment, instead of the order being lost forever, DBOS recovers from a checkpoint and goes on to ship the order.
Thus, DBOS makes your application **resilient to any failure**.


## Use Cases

DBOS helps you write complex distributed programs in remarkably few lines of code. For example:

<Tabs groupId="examples" className="medium-tabs">

<TabItem value="agents" label="AI Agents">
<section className="row list">
<article className="col col--5">

Use durable workflows to build fault-tolerant and observable AI agents:
- Pinpoint the root cause of failures from the [workflow dashboard](./python/tutorials/workflow-management.md).
- Simplify evals by using [fork](./python/tutorials/workflow-management.md#forking-workflows) to restart an agent from a specific step or tool call.
- Seamlessly add [human-in-the-loop](./python/examples/agent-inbox.md) to your agent.
- Natively integrate with popular frameworks like [Pydantic AI](https://ai.pydantic.dev/durable_execution/dbos/).

[See an example ↗️](./python/examples/hacker-news-agent.md)

</article>
<article className="col col--7">

```python
@DBOS.workflow()
def agentic_research_workflow(topic, max_iterations):
  research_results = []
  for i in range(max_iterations):
    research_result = research_query(topic)
    research_results.append(research_result)
    if not should_continue(research_results):
      break
    topic = generate_next_topic(topic, research_results)
  return synthesize_research_report(research_results)

@DBOS.step()
def research_query(topic):
  ...
```

</article>
</section>
</TabItem>

<TabItem value="pipelines" label="Data Pipelines">
<section className="row list">
<article className="col col--5">

Use durable workflows and queues to build fault-tolerant and observable data pipelines:

- Use [queues](./python/tutorials/queue-tutorial.md) to orchestrate tens of thousands of concurrent tasks.
- If a failure occurs during a multi-hour pipeline, workflows help you recover from the last completed step instead of restarting from the beginning.
- Queue flow control helps you manage the resource consumption of your pipelines by controlling how many tasks can run concurrently or how often tasks can start.

[See an example ↗️](./python/examples/document-detective.md)

</article>
<article className="col col--7">

```python
queue = Queue("indexing_queue")

@DBOS.workflow()
def indexing_workflow(urls):
    handles = []
    for url in urls:
        handles.append(queue.enqueue(index_step, url))
    return [h.get_result() for h in handles]
```

</article>
</section>
</TabItem>

<TabItem value="background" label="Background Tasks">
<section className="row list">
<article className="col col--5">

Launch durable background tasks using workflows and queues.

- Workflows guarantee background tasks eventually complete, despite restarts and failures.
- Durable sleep and notifications let your tasks wait for days or weeks, or for a notification, before continuing.
- Durably run background tasks directly on your API servers, or use the DBOS client to enqueue tasks from anywhere for execution on dedicated workers.

[See an example ↗️](./python/examples/scheduled-reminders.md)

</article>
<article className="col col--7">

```python
@DBOS.workflow()
def schedule_reminder(to_email, days_to_wait):
    DBOS.recv(days_to_seconds(days_to_wait))
    send_reminder_email(to_email, days_to_wait)

@app.post("/email")
def email_endpoint(request):
    DBOS.start_workflow(
        schedule_reminder, 
        request.email, 
        request.days
)
```

</article>
</section>
</TabItem>

<TabItem value="workflow" label="Business Workflows">
<section className="row list">
<article className="col col--5">

Add workflows to your business logic to make it resilient to any failure.

- Write business logic in normal code, with branches, loop, subtasks, and retries.
- Workflows guarantee your critical business processes eventually complete, despite crashes, restarts, and failures.

[See an example ↗️](./python/examples/widget-store.md)

</article>
<article className="col col--7">

```python
@DBOS.step()
def validate_payment():
    ...

@DBOS.workflow()
def checkout_workflow()
    validate_payment()
    check_inventory()
    ship_order()
    notify_customer()
```

</article>
</section>
</TabItem>
</Tabs>

## DBOS vs. Other Systems

### DBOS vs. Temporal

Both DBOS and Temporal provide durable execution, but DBOS is implemented in a lightweight Postgres-backed library whereas Temporal is implemented in an externally orchestrated server.

You can add DBOS to your program by installing the open-source library, connecting it to Postgres, and annotating workflows and steps.
By contrast, to add Temporal to your program, you must rearchitect your program to move your workflows and steps (activities) to a Temporal worker, configure a Temporal server to orchestrate those workflows, and access your workflows only through a Temporal client.
[This page](./explanations/comparing-temporal.md) makes the comparison in more detail.

### DBOS vs. Airflow

DBOS and Airflow both provide workflow abstractions.
Airflow is targeted at data science use cases, providing many out-of-the-box connectors but requiring workflows be written as explicit DAGs and externally orchestrating them from an Airflow cluster.
Airflow is designed for batch operations and does not provide good performance for streaming or real-time use cases.
DBOS is general-purpose, but is often used for data pipelines, allowing developers to write workflows as code and requiring no infrastructure except Postgres.

### DBOS vs. Celery/BullMQ

DBOS provides a similar queue abstraction to dedicated queueing systems like Celery or BullMQ: you can declare queues, submit tasks to them, and control their flow with concurrency limits, rate limits, timeouts, prioritization, etc.
However, DBOS queues are **durable and Postgres-backed** and integrate with durable workflows.
For example, in DBOS you can write a durable workflow that enqueues a thousand tasks and waits for their results.
DBOS checkpoints the workflow and each of its tasks in Postgres, guaranteeing that even if failures or interruptions occur, the tasks will complete and the workflow will collect their results.
By contrast, Celery/BullMQ are Redis-backed and don't provide workflows, so they provide fewer guarantees but better performance.