---
sidebar_position: 7
title: Third party calls
description: Send requests to a third party API from a workflow
---

Sending calls to third party API can be done through special [Communicator](../api-reference/decorators#operoncommunicator) methods. Communicators must return JSON serializable objects.

Here is a simple example that calls `https://postman-echo.com/get`:

```tsx
  @OperonCommunicator()
  static async postmanEcho(ctxt: CommunicatorContext) {
    ctxt.info("Calling Postman Echo");
    const resp = await axios.get("https://postman-echo.com/get");
    return resp.data;
  }
```

Communicators output are recorded, like transactions', such that they are only executed once during a workflow execution.
An `OperonCommunicator` has a retry logic configurable through a `CommunicatorConfig`.
Specifically, you can enable or disable retries (enabled by default) and configure the number of retries, their interval, and the exponential backoff multiplier.

## Final code
```tsx
import {
  CommunicatorContext,
  OperonCommunicator,
  OperonWorkflow,
  WorkflowContext,
  GetApi,
} from "@dbos-inc/operon";
import axios from "axios";

export class External {
  @OperonCommunicator()
  static async postmanEcho(ctxt: CommunicatorContext) {
    ctxt.info("Calling Postman Echo");
    const resp = await axios.get("https://postman-echo.com/get");
    return resp.data;
  }

  @GetApi("/external")
  @OperonWorkflow()
  static async postmanEchoEndpoint(ctx: WorkflowContext) {
    return await ctx.invoke(External).postmanEcho();
  }
}
```
