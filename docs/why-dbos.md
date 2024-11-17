---
---

# Why DBOS?

DBOS helps you build **reliable applications**.
Right now, many common programs are much harder to write than they should be.
For example, imagine if you want to:

- Run a workflow with several business-critical steps (for example, booking a hotel reservation), guaranteeing that each step executes once and only once.
- Build a webhook handler that can process notifications in the background and handle duplicates without ever dropping a notification.
- Schedule an event to run 24 hours from now (or once every 24 hours until a task is complete).
- Email a form to someone, then pause your workflow until they're done filling out the form.

Each of these examples is hard to write reliably because you have to deal with **failures**.
At any point in time, any step in your program might fail, or crash, or be interrupted, or your server may be restarted.
If that happens and you're not careful, your program might break:

- A workflow might fail partway through, leaving steps incomplete.
- A webhook might fail while asynchronously processing a notification, dropping it forever.
- Your server might restart while waiting the 24 hours, so your scheduled event never runs.
- Your program might be interrupted before the user fills out their form, so you never handle it.

Writing programs that correctly handle failures is **hard**.
Experienced developers tell us that if the want their programs to be correct, 70-90% of their code must be for failure handling and recovery.
For every line of business logic you write, you have to write 3-10 lines of failure handling.
That's a lot.
DBOS makes it easier, letting you write code that reliably works by default:

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

Enhance your AI workflows with DBOS.
Build reliable AI agents with automatic retries and no limit on how long tools can run for.
Integrate with frameworks like LlamaIndex and LangChain.
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