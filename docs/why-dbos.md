---
hide_table_of_contents: false
hide_title: false
title: Why DBOS?
---

### What is DBOS?

DBOS provides lightweight durable workflows built on top of Postgres.
Instead of managing your own workflow orchestrator or task queue system, you can use DBOS to add durable workflows and queues to your program in just a few lines of code.

To get started, follow the [quickstart](./quickstart.md) to install the open-source library and connect it to a Postgres database.
Then, annotate workflows and steps in your program to make it durable!
That's all you need to do&mdash;DBOS is entirely contained in the open-source library, there's no required infrastructure for you to configure or manage.

## When Should I Use DBOS?

You should consider using DBOS if you're **concerned about how your application handles failures**.
For example, you might be building a payments service that must reliably process transactions even if servers crash mid-operation, or building a long-running data pipeline that needs to resume seamlessly from checkpoints rather than restarting entirely when interruptions occur.

Handling failures is costly and complicated, requiring complex state management and recovery logic as well as heavyweight tools like external orchestration services.
DBOS makes it simpler: annotate your code to checkpoint it in Postgres and automatically recover from any failure.
DBOS also provides powerful Postgres-backed primitives that makes it easier to write and operate reliable code, including durable queues, notifications, scheduling, event processing, and programmatic workflow management.

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

DBOS helps you write complex programs in remarkably few lines of code. For example:

<Tabs groupId="examples" className="medium-tabs">

<TabItem value="workflow" label="Reliable Workflows">
<section className="row list">
<article className="col col--4">

Write business logic in normal code, with branches, loops, subtasks, and retries. DBOS makes it resilient to any failure.

[See an example ↗️](./python/examples/widget-store.md)

</article>
<article className="col col--8">

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

<TabItem value="background" label="Background Tasks">
<section className="row list">
<article className="col col--4">

Launch any task to run in the background and guarantee it eventually completes.
Wait for days or weeks, or for a notification, before continuing.

[See an example ↗️](./python/examples/scheduled-reminders.md)

</article>
<article className="col col--8">

```python
@DBOS.workflow()
def schedule_reminder(to_email, days_to_wait):
    DBOS.recv(days_to_seconds(days_to_wait))
    send_reminder_email(to_email, days_to_wait)

@app.post("/email")
def email_endpoint(request):
    DBOS.start_workflow(schedule_reminder, request.email, request.days)
```

</article>
</section>
</TabItem>

<TabItem value="cron" label="Cron Jobs">
<section className="row list">
<article className="col col--4">

Schedule functions to run at specific times.
Host them serverlessly on DBOS Cloud.

[Get started ↗️](./python/examples/cron-starter.md)

</article>
<article className="col col--8">

```python
@DBOS.scheduled("0 * * * *") # Run once an hour
@DBOS.workflow()
def run_hourly(scheduled_time, actual_time):
    results = search_hackernews("serverless")
    for comment, url in results:
        post_to_slack(comment, url)
```

</article>
</section>
</TabItem>

<TabItem value="pipelines" label="Data Pipelines">
<section className="row list">
<article className="col col--4">

Build data pipelines that are reliable and observable by default.
DBOS durable queues guarantee all your tasks complete.

[See an example ↗️](./python/examples/document-detective.md)

</article>
<article className="col col--8">

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


<TabItem value="kafka" label="Kafka">
<section className="row list">
<article className="col col--4">

Consume Kafka messages exactly-once, no need to worry about timeouts or offsets.

[Learn more ↗️](./python/tutorials/kafka-integration.md)

</article>
<article className="col col--8">

```python
@DBOS.kafka_consumer(config,["alerts-topic"])
@DBOS.workflow()
def process_kafka_alerts(msg):
    alerts = msg.value.decode()
    for alert in alerts:
        respond_to_alert(alert)
```

</article>
</section>
</TabItem>

<TabItem value="agents" label="AI Agents">
<section className="row list">
<article className="col col--4">

Enhance your AI agents with reliable asynchronous tasks and human in the loop.
Integrate with popular frameworks like LangChain and LlamaIndex.

[See an example ↗️](./python/examples/customer-service.md)

</article>
<article className="col col--8">

```python
@DBOS.workflow()
def agentic_refund(purchase):
    email_human_for_approval(purchase)
    status = DBOS.recv(timeout_seconds=APPROVAL_TIMEOUT)
    if status == "approve":
        approve_refund(purchase)
    else:
        reject_refund(purchase)
```

</article>
</section>
</TabItem>

</Tabs>
