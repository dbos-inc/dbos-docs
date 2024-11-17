---
---

# Why DBOS?

DBOS helps you write code that is **reliable** and **fault-tolerant** by default.
DBOS **durably executes** your programs, so that if they fail, upon restart they automatically resume from where they left off.
This makes all sorts of programs much easier to write:


<Tabs groupId="examples">

<TabItem value="workflow" label="Reliable Workflows">
<section className="row list">
<article className="col col--6">

Write your business logic in normal code, with branches, loops, subtasks, and retries. DBOS makes it resilient to any failure.

</article>
<article className="col col--6">

```python
@DBOS.workflow()
def checkout_workflow(items):
   order = create_order()
   reserve_inventory(order, items)
   payment_status = process_payment(order, items)
   if payment_status == 'paid':
       fulfill_order(order)
   else:
       undo_reserve_inventory(order, items)
       cancel_order(order)
```

</article>
</section>
</TabItem>

<TabItem value="background" label="Background Tasks">
<section className="row list">
<article className="col col--6">

Launch any task to run in the background and guarantee it eventually completes.
Wait for hours, days, or weeks, or for a notification, before continuing&mdash;it just works.
</article>
<article className="col col--6">

```python
@DBOS.workflow()
def schedule_reminder(to_email: str, days_to_wait: int):
    DBOS.sleep(days_to_seconds(days_to_wait))
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
<article className="col col--6">

Schedule functions to run at specific times.
Host them completely serverlessly.

</article>
<article className="col col--6">

```python
@DBOS.scheduled("0 * * * *") # Run once an hour
@DBOS.workflow()
def run_hourly(scheduled_time: datetime, actual_time: datetime):
   results = search_hackernews("serverless")
   for comment, url in results:
      post_to_slack(comment, url)
```

</article>
</section>
</TabItem>

<TabItem value="pipelines" label="Data Pipelines">
<section className="row list">
<article className="col col--6">

Build data pipelines that are reliable and observable by default.
DBOS durable queues guarantee all your tasks complete.
</article>
<article className="col col--6">

```python
queue = Queue("indexing_queue")

@DBOS.workflow()
def indexing_workflow(urls: List[HttpUrl]):
  handles: List[WorkflowHandle] = []
  for url in urls:
     handle = queue.enqueue(index_document, url)
     handles.append(handle)
indexed_pages = 0
for handle in handles:
     indexed_pages += handle.get_result()
logger.info(f"Indexed {len(urls)} documents totaling {indexed_pages} pages")
```

</article>
</section>
</TabItem>


<TabItem value="kafka" label="Kafka Event Processing">
<section className="row list">
<article className="col col--6">

Consume Kafka messages exactly-once, no need to worry about timeouts or offsets.

</article>
<article className="col col--6">

```python
@DBOS.step(retries_allowed=True, max_attempts=2)
def process_refund(item, reason):
    return f"Processed refund for item {item}, because {reason}"

@DBOS.step(retries_allowed=True, max_attempts=3)
def apply_discount(amount):
    return f"Applied discount of {amount}%"

refunds_agent = Agent(
    name="Refunds Agent",
    instructions="Help the user with a refund. If the reason is that it was too expensive, offer the user a refund code.",
    functions=[process_refund, apply_discount],
)
```

</article>
</section>
</TabItem>

<TabItem value="webhooks" label="Webhooks and Notifications">
<section className="row list">
<article className="col col--6">

Effortlessly mix synchronous webhook code with asynchronous event processing. Reliably wait weeks or months for events, then use idempotency and durable execution to process them exactly once.
</article>
<article className="col col--6">

```python
@slackapp.message()
def handle_message(request: BoltRequest) -> None:
  event_id = request.body["event_id"]
  with SetWorkflowID(event_id):
    DBOS.start_workflow(message_workflow,     request.body["event"])
```

</article>
</section>
</TabItem>

</Tabs>

## How it Works

All you need to do to use DBOS is install the open-source DBOS Transact library ([Python](https://github.com/dbos-inc/dbos-transact-py), [TypeScript](https://github.com/dbos-inc/dbos-transact-ts)).
To use the library, annotate _workflows_ and _steps_ in your program like this:

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

If your program is ever interrupted or crashed, all your workflows automatically resume from the last completed step.

Under the hood, DBOS works by storing your program's execution state (which workflows are currently executing and which steps they've completed) in a Postgres database.
So all DBOS needs to work is a Postgres database to connect to&mdash;there's no need for a separate "workflow server."

DBOS provides many powerful features you can use to build reliable programs, including:

- **Durable queues**: Run many durable workflows in parallel, with controlled concurrency.
- **Durable sleeps and notifications**: Workflows can wait for days or weeks, or for a notification, and will always resume on schedule.
- **Scheduled workflows**: Start a workflow exactly-once per time interval.
- **Exactly-once event processing**: Start a durable workflow exactly-once per incoming event, for example from Kafka.
- **Idempotency**: Use built-in idempotency keys to start a workflow only once, no matter how many times it is called with that key.

## Serverless Hosting

Any program you build with DBOS you can deploy for free to DBOS Cloud.
You can deploy any program with a single command&mdash;no configuration required.
Your program runs the same in the cloud as it does locally, but with operating it is much simpler thanks to:

- **No servers to manage**: We serverlessly deploy your applications for you.
- **Autoscaling**: Your application automatically scales with load, potentially to millions of users.
- **Pay only for the CPU time you actually use**: Pay only when you're using your app, and nothing at all for idle time.
- **Built in observability**: View your logs and traces and manage your application from the [cloud console](https://console.dbos.dev).

## Get Started

What are you waiting for?  Check out our [quickstart](./quickstart.md) to get started!