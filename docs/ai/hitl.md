---
sidebar_position: 20
title: Reliable Human-in-the-Loop
hide_table_of_contents: false
---

Many agents need a **human in the loop** for decisions that are too important to fully trust an LLM.
However, it's not easy to design an agent that waits for human feedback.
The key issue is **time**: a human might take hours or days to respond to an agent, so the agent must be able to reliably wait for a long time (during which the server might be restarted, software might be upgraded, etc.).

Durable workflows help because they provide tools like **durable notifications**.
For example, you can add a line of code to your agent that tells it to wait hours or days for a notification:

```python
approval: Optional[HumanResponseRequest] = DBOS.recv(timeout_seconds=TIMEOUT)
```

Because the workflow's progress is checkpointed and both the deadline and notification are stored in your database, this can safely wait for a long time.
Anything can happen while your agent is waiting (its server can restart, its code can be upgraded, etc.) and it will recover and keep waiting until the notification arrives or the deadline is reached.

If you're interested in building human-in-the-loop agents, check out the [agent inbox](../python/examples/agent-inbox.md) example, which shows how to use durable notifications to add human-in-the-loop to agents and how to use workflow introspection to monitor and display which agents are waiting for which human inputs.