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