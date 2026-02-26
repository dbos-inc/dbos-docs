---
displayed_sidebar: examplesSidebar
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

Performing the database record update and writing the message to the "outbox" table in one transaction guarantees atomicity: either both records are updated and neither are, and once the message is written to the outbox, it will asynchronously be consumed and sent by the background process even if failures occur later.

### Performing Multiple Operations Atomically With DBOS

In DBOS, we can use **durable workflows** instead of an explicit outbox table to atomically perform multiple operations, such as updating a database record and sending a message to another system.
To do this, we simply perform each operation as a separate step in a durable workflow.
For example:

```python
@DBOS.transaction()
def insert_order(customer: str, item: str, quantity: int) -> int:
    """Insert an order and return its ID.

    In the classic outbox pattern you would also INSERT an outbox row here.
    With DBOS the workflow itself provides that guarantee, so no outbox table
    is needed.
    """
    result = DBOS.sql_session.execute(
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
This is the same guarantee a conventional transactional outbox provides: assuming the message is eventually delievered after enough retries, either both operations occur or neither do.

One noteworthy detail is that we perform the initial database write in a [transactional step](../tutorials/step-tutorial.md#transactions), which performs the workflow checkpoint in the same database transaction as the step logic.
This way, the database write is guaranteed to execute exactly-once no matter what failures occur during workflow execution.
Other operations may execute at-least-once, and so should be idempotent (the same is true in a conventional transactional outbox pattern, where messages are sent from the outbox with at-least-once semantics).

Full source code for this example, demoing how this pattern can recover from any failure, is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/transactional-outbox).

### Try it Yourself!

Clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/transactional-outbox
```

Then follow the instructions in the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/transactional-outbox) to run the app.
