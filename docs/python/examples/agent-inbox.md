---
displayed_sidebar: examplesSidebar
sidebar_position: 24
title: AI Agent Inbox
---

This example shows how to use DBOS to add **human-in-the-loop** to your AI agent.

Production AI agents often need to wait for human approval before performing critical tasks.
However, because there are real people involved, approval doesn't always happen instantly, and agents need to be able to reliably wait hours or days for human intervention, then seamlessly resume when it arrives.

This application demonstrates how to build reliable human-in-the-loop with durable workflows.
We'll see how to build agents that can wait hours or days for human input to arrive (surviving process restarts).
We'll also see how to use workflow management tools to monitor active agents and create an "inbox" of workflows that need approval.

<img src={require('@site/static/img/examples/agent-inbox.png').default} alt="Agent Inbox" width="800" className="custom-img"/>

## Durable Agents

First, we'll write the scaffold of a durable and observable agent with human-in-the-loop.
This agent needs human approval for a key step.
To get the approval, it calls [`DBOS.recv`](../tutorials/workflow-communication.md#workflow-messaging-and-notifications).
This **durably waits** for a configurable length of time (potentially hours or days) for a notification to arrive, automatically recovering from the transient failures and process restarts that will inevitably occur during a long wait.

To allow us to create an "inbox" of agents pending approval, the workflow also publishes its status using [`DBOS.set_event`](../tutorials/workflow-communication.md#workflow-events).
We'll see later how this helps us build observability endpoints to list all active, completed, or failed agents.

```python
@DBOS.workflow()
def durable_agent(request: AgentStartRequest):
    # Set an agent status the frontend can query
    agent_status: AgentStatus = AgentStatus(
        agent_id=DBOS.workflow_id,
        name=request.name,
        task=request.task,
        status="working",
        created_at=datetime.now().isoformat(),
        question=f"Should I proceed with task: {request.task}?",
    )
    DBOS.set_event(AGENT_STATUS, agent_status)
    print("Starting agent:", agent_status)

    # Do some work...

    # Upon reaching the step that needs approval, update status
    # to `pending_approval` and await an approval notification. 
    agent_status.status = "pending_approval"
    DBOS.set_event(AGENT_STATUS, agent_status)
    approval: Optional[HumanResponseRequest] = DBOS.recv()

    # If approved, continue execution. Otherwise, raise an exception
    # and terminate the agent.
    if approval is None:
        # If approval times out, treat it as a denial
        agent_status.status = "denied"
        DBOS.set_event(AGENT_STATUS, agent_status)
        print("Agent timed out:", agent_status)
        raise Exception("Agent timed out awaiting approvial")
    elif approval.response == "deny":
        agent_status.status = "denied"
        DBOS.set_event(AGENT_STATUS, agent_status)
        print("Agent denied:", agent_status)
        raise Exception("Agent denied approval")
    else:
        agent_status.status = "working"
        print("Agent approved:", agent_status)
        DBOS.set_event(AGENT_STATUS, agent_status)

    # Do some more work...

    return "Agent successful"
```

## Calling and Notifying the Agent

Here's the endpoint to notify an agent it was approved or denied.
It uses [`DBOS.send`](../tutorials/workflow-communication.md#workflow-messaging-and-notifications) to send a message to an agent awaiting approval, waking it up.

```python
@app.post("/agents/{agent_id}/respond")
def respond_to_agent(agent_id: str, response: HumanResponseRequest):
    # Notify an agent it has been approved or denied
    DBOS.send(agent_id, response)
    return {"ok": True}
```

Here's the endpoint to start a new agent.
It starts the agent as a durable background task using `DBOS.start_workflow`.

```python
@app.post("/agents")
def start_agent(request: AgentStartRequest):
    # Start a durable agent in the background
    DBOS.start_workflow(durable_agent, request)
    return {"ok": True}
```

## Building an Agent Inbox

To build an "agent inbox", we need to be able to see which agents are pending approval.
We can do this with the DBOS workflow management API.
We list all active agents with [`DBOS.list_workflows`](../reference/contexts.md#list_workflows), then retrieve the status of each.
We return only agents that currently have the `pending_approval` status.

```python
@app.get("/agents/waiting", response_model=list[AgentStatus])
async def list_waiting_agents():
    # List all active agents and retrieve their statuses
    agent_workflows = await DBOS.list_workflows_async(
        status="PENDING", name=durable_agent.__qualname__
    )
    statuses: list[AgentStatus] = await asyncio.gather(
        *[DBOS.get_event_async(w.workflow_id, AGENT_STATUS) for w in agent_workflows]
    )
    # Only return active agents that are currently awaiting human approval
    return [status for status in statuses if status.status == "pending_approval"]
```

We also build endpoints to list successful and failed agents:

```python
@app.get("/agents/approved", response_model=list[AgentStatus])
async def list_approved_agents():
    # List all successful agents and retrieve their statuses
    agent_workflows = await DBOS.list_workflows_async(
        status="SUCCESS", name=durable_agent.__qualname__
    )
    statuses = await asyncio.gather(
        *[DBOS.get_event_async(w.workflow_id, AGENT_STATUS) for w in agent_workflows]
    )
    return list(statuses)


@app.get("/agents/denied", response_model=list[AgentStatus])
async def list_denied_agents():
    # List all failed agents and retrieve their statuses
    agent_workflows = await DBOS.list_workflows_async(
        status="ERROR", name=durable_agent.__qualname__
    )
    statuses = await asyncio.gather(
        *[DBOS.get_event_async(w.workflow_id, AGENT_STATUS) for w in agent_workflows]
    )
    return list(statuses)

```

## Try it Yourself!

Clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/agent-inbox
```

Then follow the instructions in the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/agent-inbox) to run the app.
