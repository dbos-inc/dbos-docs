---
sidebar_position: 30
title: Pydantic AI
hide_table_of_contents: false
---


#  Use DBOS With Pydantic AI

[Pydantic AI](https://ai.pydantic.dev/) is a Python agent framework for building production-grade applications and workflows powered by Generative AI.

:::info

Also check out the integration guide in [the Pydantic docs](https://ai.pydantic.dev/durable_execution/dbos)!

:::


This guide shows you how to build a durable AI agent with DBOS and Pydantic AI.
By combining the two, you can build reliable agents that preserve progress across transient API failures, application errors, and restarts, while also handling long-running, asynchronous, and human-in-the-loop workflows with production-grade reliability.

## Overview

Pydantic AI has native support for DBOS agents. The diagram below shows the architecture of an agentic application built with DBOS.
DBOS runs fully in-process as a library: functions remain standard Python functions but are checkpointed to a database for durability.

```text
                      Clients
              (HTTP, RPC, Kafka, etc.)
                          |
                          v
  +------------------------------------------------------+
  |               Application Servers                    |
  |                                                      |
  |   +----------------------------------------------+   |
  |   |        Pydantic AI + DBOS Libraries          |   |
  |   |                                              |   |
  |   |  [ Workflows (Agent Run Loop) ]              |   |
  |   |  [ Steps (Tool, MCP, Model) ]                |   |
  |   |  [ Queues ]   [ Cron Jobs ]   [ Messaging ]  |   |
  |   +----------------------------------------------+   |
  |                                                      |
  +------------------------------------------------------+
                          |
                          v
  +------------------------------------------------------+
  |                      Database                        |
  |   (Stores workflow and step state, schedules tasks)  |
  +------------------------------------------------------+
```

Any Pydantic AI agent can be wrapped in a [`DBOSAgent`](https://ai.pydantic.dev/api/durable_exec/#pydantic_ai.durable_exec.dbos.DBOSAgent) to enable durable execution. `DBOSAgent` automatically:,

* Wraps `Agent.run` and `Agent.run_sync` (the agent's main loop) as DBOS workflows.
* Wraps [model requests](https://ai.pydantic.dev/models/overview) and [MCP communication](https://ai.pydantic.dev/mcp/client) as DBOS steps.

Custom tool functions and event stream handlers are **not automatically wrapped** by DBOS.
You can decide how to integrate them:

* Decorate with `@DBOS.step` if the function involves non-determinism or I/O.
* Skip the decorator if durability isn't needed (e.g., debug logging), to avoid the extra DB checkpoint write.
* If the function needs to enqueue tasks or invoke other DBOS workflows, skip the decorator so it runs inside the agent's main workflow (not as a step).

The original agent, model, and MCP server can still be used normally outside the DBOS agent.

## Installation and Requirements

Simply install Pydantic AI with the DBOS optional dependency:

<Tabs groupId="python-package" className="small-tabs">
<TabItem value="pip" label="pip">
```shell
pip install pydantic-ai[dbos]
```
</TabItem>
<TabItem value="uv" label="uv">
```shell
uv add pydantic-ai[dbos]
```
</TabItem>
</Tabs>

Or if you're using the slim package, you can install it with the DBOS optional dependency:

<Tabs groupId="python-package" className="small-tabs">
<TabItem value="pip" label="pip">
```shell
pip install pydantic-ai-slim[dbos]
```
</TabItem>
<TabItem value="uv" label="uv">
```shell
uv add pydantic-ai-slim[dbos]
```
</TabItem>
</Tabs>

## Using DBOS Agent

Here is a simple but complete example of wrapping an agent for durable execution.
With fewer than 10 additional lines (highlighted below), you can add DBOS into an existing Pydantic AI application.

```python {title="dbos_agent.py"}
import asyncio
# highlight-next-line
from dbos import DBOS, DBOSConfig

from pydantic_ai import Agent
# highlight-next-line
from pydantic_ai.durable_exec.dbos import DBOSAgent

# highlight-start
dbos_config: DBOSConfig = {
    'name': 'pydantic_dbos_agent',
    'system_database_url': 'sqlite:///dbostest.sqlite',
}
DBOS(config=dbos_config)
#highlight-end

agent = Agent(
    'gpt-5',
    instructions="You're an expert in geography.",
    name='geography',
)

# highlight-next-line
dbos_agent = DBOSAgent(agent)

async def main():
    # highlight-next-line
    DBOS.launch()
    result = await dbos_agent.run('What is the capital of Mexico?')
    print(result.output)
    #> Mexico City (Ciudad de México, CDMX)

if __name__ == "__main__":
    asyncio.run(main())
```

**Notes:**

1. Workflows and `DBOSAgent` must be defined before [`DBOS.launch()`](../python/reference/dbos-class.md#launch) so that recovery can correctly find all workflows.
2. [`DBOSAgent.run()`](https://ai.pydantic.dev/api/durable_exec/#pydantic_ai.durable_exec.dbos.DBOSAgent.run) works like [`Agent.run()`](https://ai.pydantic.dev/api/agent/#pydantic_ai.agent.AbstractAgent.run), but runs as a DBOS workflow and executes model requests, decorated tool calls, and MCP communication as DBOS steps.
3. This example uses SQLite for simplicity. Postgres is recommended for production.
4. Each agent must have a unique `name`, which DBOS uses to identify its workflows.


For more details on building agents, see the [Pydantic AI documentation](https://ai.pydantic.dev/durable_execution/dbos). For information about durable execution and workflow design, see the [DBOS programming guide](../python/programming-guide). Together, these resources cover everything from getting started with simple agents to designing production-ready, fault-tolerant applications.
