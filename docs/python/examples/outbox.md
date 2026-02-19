---
displayed_sidebar: examplesSidebar
sidebar_position: 28
title: Transactional Outbox
---

A **transactional outbox** is a common pattern that solves an important problem: how to both update a database record and send a message to another system.
This is trickier than it sounds because we want the operations to be **atomic**: either both happen or neither do, even if there are failures (such as process crashes or network glitches) while performing them.
Otherwise, we risk the database and the other system getting out of sync, which could cause serious data integrity issues.

The way a transactional outbox is typically implemented is by adding a new "outbox" table to our database.
When we need to perform an atomic update, we run a single database transaction that both:

- Updates the database record
- Writes the message we want to send to the "outbox" table.

A separate background process then polls the outbox table and sends the messages there to the other system.

By performing the database record update and writing the message to the "outbox" table in one transaction, this guarantees atomicity: either both records are updated and neither are, and once the message is written to the outbox, it will asynchronously be consumed and sent by the background process even if failures occur later.

### Implementing the Outbox Pattern in DBOS

In DBOS, we can use **durable workflows** instead of an explicit outbox table to atomically perform multiple operations, such as updating a database record and sending a message to another system.
To do this, we simply perform each operation as a separate step in a durable workflow.
For example:

```python

```

This works because **durable workflows are atomic**.
If a failure occurs after writing to the database but before sending the message to the external system, the workflow will recover from its last completed step (writing to the database) and retry the next step (sending the message) until the message is successfully sent.
This is the same guarantee a conventional transactional outbox provides: assuming the message is eventually delievered after enough retries, either both operations occur or neither do.

Full source code for this example, demoing how this pattern can recover from failure, is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/transactional-outbox)

### Try it Yourself!

Clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/transactional-outbox
```

Then follow the instructions in the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/agent-inbox) to run the app.
