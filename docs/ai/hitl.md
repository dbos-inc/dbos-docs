---
sidebar_position: 20
title: Reliable Human-in-the-Loop
hide_table_of_contents: false
---

Many agents need a **human in the loop** for decisions that are too important to fully trust an LLM.
However, it's not easy to design an agent that waits for human feedback.
The key issue is **time**: a human might take hours or days to respond to an agent, so the agent must be able to reliably wait for a long time (during which the server might be restarted, software might be upgraded, etc.).

Durable workflows help because they provide tools like **durable messaging** and **workflow events** that let agents durably communicate with the outside world.

## Waiting for Human Input

You can use [`DBOS.recv`](../python/tutorials/workflow-communication.md#recv) inside a workflow to durably wait for a message.
For example, you can add a line of code to your agent that tells it to wait hours or days for a notification:

```python
approval: Optional[HumanResponseRequest] = DBOS.recv(timeout_seconds=TIMEOUT)
```

Because the workflow's progress is checkpointed and both the deadline and notification are stored in your database, this can safely wait for a long time.
Anything can happen while your agent is waiting (its server can restart, its code can be upgraded, etc.) and it will recover and keep waiting until the notification arrives or the deadline is reached.

To send that notification (for example, from an HTTP endpoint), use [`DBOS.send`](../python/tutorials/workflow-communication.md#send):

```python
@app.post("/agents/{agent_id}/respond")
def respond_to_agent(agent_id: str, response: HumanResponseRequest):
    DBOS.send(agent_id, response)
    return {"ok": True}
```

All messages are persisted to the database, so if `send` completes successfully, the destination workflow is guaranteed to receive it.

## Publishing Agent Status

Agents can publish their current status using [`DBOS.set_event`](../python/tutorials/workflow-communication.md#workflow-events), and external code can read it with [`DBOS.get_event`](../python/tutorials/workflow-communication.md#get_event).
This is useful for letting a frontend know what an agent is doing, whether it's working, waiting for approval, or finished:

```python
@DBOS.workflow()
def durable_agent(request: AgentStartRequest):
    agent_status = AgentStatus(status="working", ...)
    DBOS.set_event(AGENT_STATUS, agent_status)

    # Do some work, then request approval
    agent_status.status = "pending_approval"
    DBOS.set_event(AGENT_STATUS, agent_status)
    approval = DBOS.recv(timeout_seconds=TIMEOUT)

    if approval is not None and approval.response == "approve":
        agent_status.status = "working"
        DBOS.set_event(AGENT_STATUS, agent_status)
        # Continue execution...
    else:
        agent_status.status = "denied"
        DBOS.set_event(AGENT_STATUS, agent_status)
        raise Exception("Agent denied or timed out")
```

You can then use the [workflow introspection API](../python/reference/contexts.md#list_workflows) and [`DBOS.get_event`](../python/tutorials/workflow-communication.md#get_event) to monitor and display your agents, for example to build an "inbox" of all agents currently waiting for human input:

```python
@app.get("/agents/waiting")
async def list_waiting_agents():
    agent_workflows = await DBOS.list_workflows_async(
        status="PENDING", name=durable_agent.__qualname__
    )
    statuses = await asyncio.gather(
        *[DBOS.get_event_async(w.workflow_id, AGENT_STATUS) for w in agent_workflows]
    )
    return [s for s in statuses if s.status == "pending_approval"]
```

For a complete working example, check out the [agent inbox application](../python/examples/agent-inbox.md).

To learn more about `send`/`recv`, `set_event`/`get_event`, and streaming, see the [workflow communication docs](../python/tutorials/workflow-communication.md).