---
sidebar_position: 32
title: LlamaIndex
hide_table_of_contents: false
---


# LlamaIndex Durable Workflows with DBOS

[LlamaIndex Workflows](https://developers.llamaindex.ai/python/llamaagents/workflows/) is a Python framework for orchestrating AI agents by composing steps and events into structured workflows.
This guide explains how to build durable LlamaIndex agents using the DBOS runtime, enabling fault-tolerant, persistent AI workflows that can safely recover from crashes or restarts.

By integrating DBOS with LlamaIndex Workflows through the `llama-agents-dbos` package, every workflow transition is automatically persisted. This allows long-running AI workflows to resume exactly where they left off, without requiring manual checkpointing or snapshot logic.

This is especially useful for:

- AI agents with long-running tasks
- Multi-step LlamaIndex workflows
- LLM pipelines that must survive failures
- Production AI systems that require reliability

:::info

Also check out the integration guide in [the LlamaIndex docs](https://developers.llamaindex.ai/python/llamaagents/workflows/dbos/)!

:::

## Installation

To get started, install the [`llama-agents-dbos`](https://github.com/run-llama/workflows-py/tree/main/packages/llama-agents-dbos) package.

<Tabs groupId="python-package" className="small-tabs">
<TabItem value="pip" label="pip">
```shell
pip install llama-agents-dbos
```
</TabItem>
<TabItem value="uv" label="uv">
```shell
uv add llama-agents-dbos
```
</TabItem>
</Tabs>

## Quick Start: Standalone Durable Workflow

The example below defines a simple workflow that counts from 0 to 20. DBOS persists each transition so the workflow can safely resume after a crash or restart.


```python
import asyncio

from dbos import DBOS
from llama_agents.dbos import DBOSRuntime
from pydantic import Field
from workflows import Context, Workflow, step
from workflows.events import Event, StartEvent, StopEvent


# 1. Configure DBOS — SQLite by default
DBOS(config={"name": "counter-example", "run_admin_server": False})


# 2. Define events and workflow (nothing DBOS-specific here)
class Tick(Event):
    count: int = Field(description="Current count")


class CounterResult(StopEvent):
    final_count: int = Field(description="Final counter value")


class CounterWorkflow(Workflow):
    @step
    async def start(self, ctx: Context, ev: StartEvent) -> Tick:
        await ctx.store.set("count", 0)
        print("[Start] Initializing counter to 0")
        return Tick(count=0)

    @step
    async def increment(self, ctx: Context, ev: Tick) -> Tick | CounterResult:
        count = ev.count + 1
        await ctx.store.set("count", count)
        print(f"[Tick {count:2d}] count = {count}")

        if count >= 20:
            return CounterResult(final_count=count)

        await asyncio.sleep(0.5)
        return Tick(count=count)


# 3. Create runtime, attach to workflow, and launch
runtime = DBOSRuntime()
workflow = CounterWorkflow(runtime=runtime)


async def main() -> None:
    await runtime.launch()
    result = await workflow.run(run_id="counter-run-1")
    print(f"Result: final_count = {result.final_count}")


asyncio.run(main())
```

If you kill the process mid-run (e.g. Ctrl+C at tick 8), calling `workflow.run(run_id="counter-run-1")` again will resume from tick 8 instead of restarting from zero.

**Notes:**

1. Workflows must be defined before `runtime.launch()`.
2. The `run_id` parameter uniquely identifies a workflow run, which is equivalent to DBOS workflow ID.
3. This example uses SQLite for ease of getting started. For production, configure a Postgres database and pass the connection string to `DBOS`.


## Durable Workflow Server

`DBOSRuntime` integrates with `WorkflowServer` to serve workflows over HTTP with durable execution out of the box. Pass `runtime.create_workflow_store()` as the persistence backend and `runtime.build_server_runtime()` as the execution engine:

```python
import asyncio

from dbos import DBOS
from llama_agents.dbos import DBOSRuntime
from llama_agents.server import WorkflowServer
from pydantic import Field
from workflows import Context, Workflow, step
from workflows.events import Event, StartEvent, StopEvent

DBOS(config={"name": "quickstart", "run_admin_server": False})


class Tick(Event):
    count: int = Field(description="Current count")


class CounterResult(StopEvent):
    final_count: int = Field(description="Final counter value")


class CounterWorkflow(Workflow):
    """Counts to 5, emitting stream events along the way."""

    @step
    async def start(self, ctx: Context, ev: StartEvent) -> Tick:
        return Tick(count=0)

    @step
    async def tick(self, ctx: Context, ev: Tick) -> Tick | CounterResult:
        count = ev.count + 1
        ctx.write_event_to_stream(Tick(count=count))
        print(f"  tick {count}")
        await asyncio.sleep(0.5)
        if count >= 5:
            return CounterResult(final_count=count)
        return Tick(count=count)


async def main() -> None:
    runtime = DBOSRuntime()

    server = WorkflowServer(
        workflow_store=runtime.create_workflow_store(),
        runtime=runtime.build_server_runtime(),
    )
    server.add_workflow("counter", CounterWorkflow(runtime=runtime))

    print("Serving on http://localhost:8000")
    print("Try: curl -X POST http://localhost:8000/workflows/counter/run")
    await server.start()
    try:
        await server.serve(host="0.0.0.0", port=8000)
    finally:
        await server.stop()


asyncio.run(main())
```

The workflow debugger UI at `http://localhost:8000/` works exactly the same as with the default runtime: DBOS is transparent to the server layer.


## Learn More

For more details on building agents and workflows with LlamaIndex, see the [LlamaAgents documentation](https://developers.llamaindex.ai/python/llamaagents/workflows/).

For information about durable execution and workflow design, see the [DBOS programming guide](../python/programming-guide).

Together, these resources cover everything from getting started with simple agents to designing production-ready, fault-tolerant applications.
