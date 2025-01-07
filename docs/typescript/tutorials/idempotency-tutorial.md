---
sidebar_position: 40
title: Idempotency
description: Learn how to make operations idempotent.
---

You can set an idempotency key for a workflow to guarantee it executes only once, even if called multiple times with that key.
This is especially useful if your operations have side effects like making a payment or sending an email.

An idempotency key can be any string, but we recommend using [UUIDs](https://docs.python.org/3/library/uuid.html).
Idempotency keys are required to be **globally unique** for your application.

Use [`DBOS.withNextWorkflowID`](../reference/transactapi/dbos-class.md#assigning-workflow-ids) to set an idempotency key for a workflow.
This will also set the [workflow ID](./workflow-tutorial.md#workflow-ids) of that operation.
For example:

```javascript
class Example {
    @DBOS.workflow()
    static async exampleWorkflow(var1: str, var2: str) {
        return var1 + var2;
    }
}

async function main() {
    // This sets the ID of the workflow to the supplied key
    await DBOS.withNextWorkflowID("very-unique-id", async () => {
      return await Example.exampleWorkflow("one", "two");
    });
}
```