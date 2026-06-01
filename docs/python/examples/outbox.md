---
sidebar_position: 28
title: Transactional Outbox
---

A **transactional outbox** is a common pattern that solves an important problem: how to reliably update a database record and send a message to another system.
This is trickier than it sounds because the operations usually need to be **atomic**: they either both happen or neither do, even if there are failures (such as process crashes or network glitches) while performing them.
Otherwise, the database might go out of sync with other systems, which could cause serious data integrity issues.

A transactional outbox is typically implemented by adding a new "outbox" table to our database.
When we need to perform an atomic update, we run a single database transaction that both:

- Updates the database record
- Writes the message we want to send to the "outbox" table.

A separate background process then polls the outbox table and sends the messages there to the other system.

Performing the database record update and writing the message to the "outbox" table in one transaction guarantees atomicity: either both records are updated or neither are, and once the message is written to the outbox, it will asynchronously be consumed and sent by the background process even if failures occur later.

### Performing Multiple Operations Atomically With DBOS

In DBOS, we can use **durable workflows** instead of an explicit outbox table to atomically perform multiple operations, such as updating a database record and sending a message to another system.
To do this, we simply perform each operation as a separate step in a durable workflow.
For example:

```python
@ds.transaction()
def insert_order(customer: str, item: str, quantity: int) -> int:
    """Insert an order and return its ID.

    In the classic outbox pattern you would also INSERT an outbox row here.
    With DBOS the workflow itself provides that guarantee, so no outbox table
    is needed.
    """
    result = ds.sql_session().execute(
        orders.insert().values(customer=customer, item=item, quantity=quantity)
    )
    order_id: int = result.inserted_primary_key[0]
    DBOS.logger.info(f"Inserted order {order_id}: {quantity}x {item} for {customer}")
    return order_id

@DBOS.step()
def send_order_notification(order_id: int, customer: str, item: str) -> None:
    """Simulate sending an order confirmation (e.g. email, Kafka, webhook).

    In the classic pattern a background poller would read the outbox and call
    this.  With DBOS the workflow calls it directly and guarantees it will
    be retried until it succeeds.
    """
    DBOS.logger.info(
        f"Sending notification for order {order_id}: {item} for {customer}"
    )
    time.sleep(3)  # simulate network latency
    DBOS.logger.info(f"Notification sent for order {order_id}: {item} for {customer}")

@DBOS.workflow()
def place_order_workflow(customer: str, item: str, quantity: int) -> int:
    """Place an order and send a notification, atomically.

    If this process crashes after insert_order but before
    send_order_notification, DBOS will automatically recover and complete
    the notification on restart.
    """
    order_id = insert_order(customer, item, quantity)
    send_order_notification(order_id, customer, item)
```

This works because **durable workflows are atomic**.
If a failure occurs after writing to the database but before sending the message to the external system, the workflow will recover from its last completed step (writing to the database) and retry the next step (sending the message) until the message is successfully sent.
This is the same guarantee a conventional transactional outbox provides: assuming the message is eventually delivered after enough retries, either both operations occur or neither do.

One noteworthy detail is that we perform the initial database write in a [transactional step](../tutorials/transaction-tutorial.md), which performs the workflow checkpoint in the same database transaction as the step logic.
This way, the database write is guaranteed to execute exactly-once no matter what failures occur during workflow execution.
Other operations may execute at-least-once, and so should be idempotent (the same is true in a conventional transactional outbox pattern, where messages are sent from the outbox with at-least-once semantics).

### Transactionally Enqueuing a Workflow

The durable workflow above replaces the outbox entirely.
If you instead want a pattern that more closely mirrors a conventional outbox, where you write a database record and durably schedule some follow-up work in the same transaction, you can **transactionally enqueue a workflow**.

Inside the transaction that inserts the order, we call the [`dbos.enqueue_workflow` Postgres function](../../explanations/system-tables.md) to enqueue a notification workflow.
Because the enqueue happens in the same transaction as the order insert, the order row and the enqueued workflow commit (or roll back) together: the notification workflow is durably enqueued if and only if the order is created.
This is exactly the guarantee a conventional outbox provides, except the "outbox" is DBOS's own queue table instead of one you build and poll yourself.

```python
@ds.transaction()
def insert_order(customer: str, item: str, quantity: int) -> int:
    """Insert an order and transactionally enqueue its notification workflow."""
    session = ds.sql_session()
    result = session.execute(
        orders.insert().values(customer=customer, item=item, quantity=quantity)
    )
    order_id: int = result.inserted_primary_key[0]

    # Enqueue the notification workflow as part of this transaction.
    session.execute(
        sa.text("""
            SELECT dbos.enqueue_workflow(
                workflow_name => :workflow_name,
                queue_name => :queue_name,
                positional_args => ARRAY[
                    CAST(:arg_order_id AS json),
                    CAST(:arg_customer AS json),
                    CAST(:arg_item AS json)
                ]
            )
            """),
        {
            "workflow_name": "send_notification_workflow",
            "queue_name": NOTIFICATION_QUEUE,
            "arg_order_id": json.dumps(order_id),
            "arg_customer": json.dumps(customer),
            "arg_item": json.dumps(item),
        },
    )

    DBOS.logger.info(f"Inserted order {order_id}: {quantity}x {item} for {customer}")
    return order_id
```

The enqueued workflow acts as the "consumer" of the outbox.
DBOS guarantees it runs exactly once for every committed order, recovering automatically if the process crashes partway through:

```python
@DBOS.workflow()
def send_notification_workflow(order_id: int, customer: str, item: str) -> None:
    """Send a notification for an order, then mark it sent."""
    send_order_notification(order_id, customer, item)
    update_notification_status(order_id, "SENT")
```

### Try it Yourself

Full source code for both patterns, demoing how they can recover from any failure, is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/transactional-outbox).
The single-workflow pattern is in `atomic_workflow.py` and the transactional enqueue pattern is in `transactional_enqueue.py`.

To run it, clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/transactional-outbox
```

Then follow the instructions in the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/transactional-outbox) to run the app.
