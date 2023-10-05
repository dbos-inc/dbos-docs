---
sidebar_position: 6
title: Workflows communication
description: Two workflows play ping pong
---

Workflows can communicate with each other. Specifically, using [WorkflowContext](../api-reference/contexts#workflowcontext), you can send a generic message to a destination workflow using its UUID.

```tsx
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string | null): Promise<void>;
```

Likewise, from a [WorkflowContext](../api-reference/contexts#workflowcontext), you can receive a message:

```tsx
recv<T extends NonNullable<any>>(topic?: string | null, timeoutSeconds?: number): Promise<T | null>
```

Note that send and receive can be filtered by topics.

Let's build an Operon application that, upon receiving a network request, starts two workflows exchanging message with each other.

First, we will write the HTTP handler:

```tsx
  @GetApi("/pingpong")
  static async pingPongEndpoint(ctx: HandlerContext) {
    const pongHandle = await ctx.invoke(PingPong).pong();
    const pongUUID = pongHandle.getWorkflowUUID();

    const pinghandle = await ctx.invoke(PingPong).ping(pongUUID);
    const pingUUID = pinghandle.getWorkflowUUID();

    await new Promise((r) => setTimeout(r, 50));

    await ctx.send(pongUUID, "stop", "stopTopic");
    return await ctx.send(pingUUID, "stop", "stopTopic");
  }
```

The handler first invokes a workflow named `pong` and uses its handler to retrieve its UUID.
It then invokes a second workflow named `ping`, passing it `pong`'s UUID as parameter.
It then goes on to sleep for 50ms, then sends a `stop` message to `ping` and `pong` on a topic named `stopTopic`.

Let's look at `ping`:

```tsx
  @OperonWorkflow()
  static async ping(wfCtxt: WorkflowContext, pongUUID: string) {
    let running: boolean = true;
    wfCtxt.recv("stopTopic").then((m) => {
      if (m) {
        wfCtxt.info("[PING] received stop notification");
        running = false;
      }
    });

    const message: Message = {
      senderUUID: wfCtxt.workflowUUID,
      message: "ping",
    };
    await wfCtxt.send(pongUUID, message);
    while (running) {
      const m = (await wfCtxt.recv<string>()) as Message;
      if (m) {
        wfCtxt.info(`[PING] received ${m.message}`);
        await wfCtxt.send(pongUUID, message);
      }
    }
  }
```

First, the workflow starts listening on the `stopTopic`.
Once this promise is resolved, it will flip a boolean flag named `running` to know when to exit.
Then, it sets a message with its UUID and sends the first message to `pong`. `Message` is user-defined, in this case:

```tsx
interface MessengingProtocol {
  senderUUID: string;
  message: string;
}
type Message = MessengingProtocol | null;
```

The main loop of the workflow waits for a response from `pong`, logs it, then sends back a ping message.

Note the following with respect to sending and receiving workflow messages:
- `send` and receive are asynchronous. You can chose to block on them, or register a callback through `.then`.
- `recv` can return a `null` value. This is because the message value itself could be `null`.
- You can specify the type to use for deserializing the message. In this example, `Message`.
- Topics are optional. You can use them for specific purposes as demonstrated in this example.

`pong` is similar, with the exception it uses the UUID received in the message to determine who to send a pong:
```tsx
  @OperonWorkflow()
  static async pong(wfCtxt: WorkflowContext) {
    let running: boolean = true;
    wfCtxt.recv("stopTopic").then((m) => {
      if (m) {
        wfCtxt.info("[PONG] received stop notification");
        running = false;
      }
    });

    while (running) {
      const m = await wfCtxt.recv<Message>();
      if (m) {
        wfCtxt.info(`[PONG] received ${m.message}`);
        m.message = "pong";
        await wfCtxt.send(m.senderUUID, m);
      }
    }
  }
```

## Final code

```tsx
import {
  HandlerContext,
  GetApi,
  OperonWorkflow,
  WorkflowContext,
} from "@dbos-inc/operon";

interface MessengingProtocol {
  senderUUID: string;
  message: string;
}
type Message = MessengingProtocol | null;

export class PingPong {
  @OperonWorkflow()
  static async pong(wfCtxt: WorkflowContext) {
    let running: boolean = true;
    wfCtxt.recv("stopTopic").then((m) => {
      if (m) {
        wfCtxt.info("[PONG] received stop notification");
        running = false;
      }
    });

    while (running) {
      const m = await wfCtxt.recv<Message>();
      if (m) {
        wfCtxt.info(`[PONG] received ${m.message}`);
        m.message = "pong";
        await wfCtxt.send(m.senderUUID, m);
      }
    }
  }

  @OperonWorkflow()
  static async ping(wfCtxt: WorkflowContext, pongUUID: string) {
    let running: boolean = true;
    wfCtxt.recv("stopTopic").then((m) => {
      if (m) {
        wfCtxt.info("[PING] received stop notification");
        running = false;
      }
    });

    const message: Message = {
      senderUUID: wfCtxt.workflowUUID,
      message: "ping",
    };
    await wfCtxt.send(pongUUID, message);
    while (running) {
      const m = await wfCtxt.recv<Message>();
      if (m) {
        wfCtxt.info(`[PING] received ${m.message}`);
        await wfCtxt.send(pongUUID, message);
      }
    }
  }

  @GetApi("/pingpong")
  static async pingPongEndpoint(ctx: HandlerContext) {
    const pongHandle = await ctx.invoke(PingPong).pong();
    const pongUUID = pongHandle.getWorkflowUUID();

    const pinghandle = await ctx.invoke(PingPong).ping(pongUUID);
    const pingUUID = pinghandle.getWorkflowUUID();

    await new Promise((r) => setTimeout(r, 50));

    await ctx.send(pingUUID, "stop", "stopTopic");
    return await ctx.send(pongUUID, "stop", "stopTopic");
  }
}
```
