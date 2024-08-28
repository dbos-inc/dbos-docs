---
sidebar_position: 4
title: Idempotency
description: Learn how to make operations idempotent.
---

You can set an idempotency key for any DBOS function to guarantee it executes only once, even if called multiple times with that key.
This is especially useful if your operations have side effects like making a payment or sending an email.

A DBOS idempotency key can be any string, but we recommend using [UUIDs](https://docs.python.org/3/library/uuid.html).
Idempotency keys are required to be **globally unique** for your application.

Use [`SetWorkflowUUID`](../reference-python/contexts.md#setworkflowuuid) to set an idempotency key for a DBOS operation ([workflow](./workflow-tutorial.md), [transaction](./transaction-tutorial.md), or [communicator](./communicator-tutorial.md)).
This will also set the [workflow ID](./workflow-tutorial.md#workflow-ids) of that operation.
For example:


```python
@dbos.workflow()
def example_workflow():
    DBOS.logger.info(f"I am a workflow with ID {DBOS.workflow_id}")

# The workflow will run with the supplied ID
with SetWorkflowUUID("very-unique-id"):
    example_workflow()
```

If you're serving HTTP requests with [FastAPI](https://fastapi.tiangolo.com/), you can make any request idempotent by setting its `dbos-idempotency-key` header field.
DBOS will automatically parse that header and assign the idempotency key to the first DBOS function called from the request.
