---
sidebar_position: 6
title: Workflow events
description: Learn how to send events from workflows and receive them from handlers
---

A common use case for workflows is to notify their callers after some event of interest happened.
Using a [WorkflowContext](../api-reference/contexts#workflowcontext), you can program events with `setEvent` and check on them from a handler with `getEvent`.

Consider a workflow that runs in two steps and wants to notify its caller about their completion:

```tsx
@OperonWorkflow()
static async stepsWorkflow(ctxt: WorkflowContext) {
  // Do some work...
  await ctxt.setEvent("step1", "completed");
  // Do some more work...
  return ctxt.setEvent("step2", "completed");
}
```

The workflow calls `setEvent` with a unique event key and an associated message of generic type.

The caller, in this example an HTTP handler, can call `getEvent` with the workflow UUID and an event key to declare an action.


```tsx
  @GetApi("/events")
  static async eventListener(ctx: HandlerContext) {
    let completed = false;
    const wfUUID = (await ctx.invoke(Events).stepsWorkflow()).getWorkflowUUID();

    ctx.getEvent(wfUUID, "step1").then((event) => {
      ctx.log(`step1 status: ${event}`);
    });

    ctx.getEvent(wfUUID, "step2").then((event) => {
      ctx.log(`step2 status: ${event}`);
      completed = true;
    });

    while (!completed) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
```

## Final code

```tsx
import {
  OperonWorkflow,
  WorkflowContext,
  GetApi,
  HandlerContext,
} from "@dbos-inc/operon";

export class Events {
  @OperonWorkflow()
  static async stepsWorkflow(ctxt: WorkflowContext) {
    // Do some work...
    await ctxt.setEvent("step1", "completed");
    // Do some more work...
    return ctxt.setEvent("step2", "completed");
  }

  @GetApi("/events")
  static async eventListener(ctx: HandlerContext) {
    let completed = false;
    const wfUUID = (await ctx.invoke(Events).stepsWorkflow()).getWorkflowUUID();

    ctx.getEvent(wfUUID, "step1").then((event) => {
      ctx.log(`step1 status: ${event}`);
    });

    ctx.getEvent(wfUUID, "step2").then((event) => {
      ctx.log(`step2 status: ${event}`);
      completed = true;
    });

    while (!completed) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}
```
