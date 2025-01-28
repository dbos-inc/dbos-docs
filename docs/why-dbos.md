---
hide_table_of_contents: false
hide_title: false
title: Why DBOS?
---

<p style={{ fontSize: '20px', color: 'var(--ifm-color-primary-darkest)' }}>DBOS is an open-source library for building **reliable** and **fault-tolerant** applications.</p>

Let's look at a common situation where reliability is critical.
Imagine you're running an e-commerce platform where an order goes through multiple steps:

<img src={require('@site/static/img/why-dbos/workflow-example.png').default} alt="Durable Workflow" width="750" className="custom-img"/>

This program looks simple, but making it _reliable_ is deceptively difficult.
Here are some potential problems:

- Your program crashes after step 1, "Validate Payment". The customer has been charged, but their order is never shipped.
- You get to step 2, "Check Inventory", and you're out of stock. You need to wait 24 hours for the new inventory before you can ship your order. You need that step to sleep for a day.

DBOS makes those problems easier to solve because you can add decorators like `DBOS.workflow()` and `DBOS.step()` to your program:


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

### DBOS Is Lightweight

All you need to use DBOS is install the open-source DBOS Transact library ([Python](https://github.com/dbos-inc/dbos-transact-py), [TypeScript](https://github.com/dbos-inc/dbos-transact-ts)).

You can run these commands to quickly try out a DBOS demo yourself:


<Tabs groupId="language">
<TabItem value="python" label="Python">

```shell
pip install dbos
dbos init
dbos start
```
</TabItem>
<TabItem value="typescript" label="TypeScript">

```shell
npx @dbos-inc/create -t dbos-node-starter
cd dbos-node-starter
npm run build
npm run start
```
</TabItem>
</Tabs>


To add DBOS to your application, simply annotate _workflows_ and _steps_ in your program like this:
<Tabs groupId="language">
<TabItem value="python" label="Python">

```python
@DBOS.step()
def step_one():
    ...

@DBOS.step()
def step_two():
    ...

@DBOS.workflow()
def workflow()
    step_one()
    step_two()
```
</TabItem>
<TabItem value="typescript" label="TypeScript">

```javascript
class Example {
  @DBOS.step()
  static async step_one() {
    ...
  }

  @DBOS.step()
  static async step_two() {
    ...
  }

  @DBOS.workflow()
  static async workflow() {
    await Example.step_one()
    await Example.step_two()
  }
}
```
</TabItem>
</Tabs>

If your program is ever interrupted or crashed, all your workflows automatically resume from the last completed step.

### Use Cases

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

[See an example ↗️](./python/examples/reliable-ai-agent.md)

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

### DBOS Cloud

Any program you build with DBOS you can deploy for free to DBOS Cloud.
You can deploy any program with a single command&mdash;no configuration required.
Your program runs the same in the cloud as it does locally, but operating it is much simpler thanks to:

- **No servers to manage**: We serverlessly deploy your applications for you.
- **Autoscaling**: Your application automatically scales with load, potentially to millions of users.
- **Pay only for the CPU time you actually use**: Pay only when you're using your app, and nothing at all for idle time.
- **Built-in observability**: View your logs and traces and manage your application from the [cloud console](https://console.dbos.dev).

:::note
Thanks to Paul Copplestone from Supabase, whose [blog post on DBOS](https://supabase.com/blog/durable-workflows-in-postgres-dbos) inspired this page.
:::