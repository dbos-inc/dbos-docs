---
sidebar_position: 31
title: OpenAI Agents SDK
hide_table_of_contents: false
---

You can use DBOS to add durable execution to an agent built with the [OpenAI Agents SDK](https://platform.openai.com/docs/guides/agents-sdk).
With durable execution, you can build reliable agents that preserve progress across transient API failures, application errors, and restarts, while also handling long-running, asynchronous, and human-in-the-loop workflows with production-grade reliability.

## Installation

To get started, install the [DBOS OpenAI agents integration](https://github.com/dbos-inc/dbos-openai-agents).

```
pip install dbos-openai-agents
```

## Building Reliable Agents

To wrap your OpenAI agents for durable execution, [configure DBOS](../python/integrating-dbos.md) then follow these three guidelines:

1. Use `DBOSRunner.run` and `DBOSRunner.run_sync` as drop-in replacements for [`Runner.run`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.Runner.run) and [`Runner.run_sync`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.Runner.run_sync).
2. Annotate the function calling `DBOSRunner.run` or `DBOSRunner.run_sync` with `@DBOS.workflow` to run your agent as a durably executed workflow.
3. Annotate your agent's tool call functions and guardrail functions with `@DBOS.step` or `@DBOS.workflow()` to mark them as steps or sub-workflows of your durably executed agentic workflow.

Here is a simple but complete example of wrapping an agent for durable execution.
With just 10 lines of code (highlighted below), you can add DBOS into an existing OpenAI Agents application.

```python {title="dbos_agent.py"}
import asyncio
from agents import Agent, function_tool
# highlight-start
from dbos import DBOS, DBOSConfig
from dbos_openai_agents import DBOSRunner
#highlight-end

# Decorate tool calls and guardrails with @DBOS.step() for durable execution
@function_tool
# highlight-next-line
@DBOS.step()
async def get_weather(city: str) -> str:
    """Get the weather for a city."""
    return f"Sunny in {city}"

agent = Agent(name="weather", tools=[get_weather])

# Use DBOSRunner to call your agent from a workflow
# highlight-start
@DBOS.workflow()
async def run_agent(user_input: str) -> str:
    result = await DBOSRunner.run(agent, user_input)
    return str(result.final_output)
# highlight-end


async def main():
    # highlight-start
    config: DBOSConfig = {
        "name": "my-agent",
        "system_database_url": 'sqlite:///my_agent.sqlite',
    }
    DBOS(config=config)
    DBOS.launch()
    # highlight-end
    output = await run_agent("How is the weather in San Francisco")
    print(output)


if __name__ == "__main__":
    asyncio.run(main())
```

**Notes:**

1. Workflows and agents must be defined before [`DBOS.launch()`](../python/reference/dbos-class.md#launch).
2. This example uses SQLite for ease of getting started. Postgres is recommended for production.
3. Each agent must have a unique `name`, which DBOS uses to identify its workflows.


For more details on building agents, see the [OpenAI Agents SDK documentation](https://platform.openai.com/docs/guides/agents-sdk). For information about durable execution and workflow design, see the [DBOS programming guide](../python/programming-guide). Together, these resources cover everything from getting started with simple agents to designing production-ready, fault-tolerant applications.
