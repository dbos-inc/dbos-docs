---
sidebar_position: 33
title: Google ADK
hide_table_of_contents: false
---

You can use DBOS to add durable execution to an agent built with [Google ADK](https://adk.dev/).
With durable execution, you can build reliable agents that preserve progress across transient API failures, application errors, and restarts, while also handling long-running, asynchronous, and human-in-the-loop workflows with production-grade reliability.

## Installation

To get started, install DBOS and the [durable Google ADK agents integration](https://github.com/dbos-inc/dbos-google-adk).

```
pip install dbos dbos-google-adk
```

You may also need a [Gemini API key](https://aistudio.google.com/app/api-keys) (or any [supported model](/agents/models/)).


## Building Reliable Agents

To wrap your Google ADK agents for durable execution, [install and configure DBOS](../python/integrating-dbos.md) then follow these three guidelines:

1. Add `DBOSPlugin` to your `Runner`'s list of plugins.
2. Annotate the function calling `runner.run_async` or `runner.sync` with `@DBOS.workflow` to run your agent as a durably executed workflow.
3. Annotate your agent's tool call functions and guardrail functions with `@DBOS.step` or `@DBOS.workflow()` to mark them as steps or sub-workflows of your durably executed agentic workflow.

Here is a simple but complete example of wrapping an agent for durable execution.
With < 10 lines of code (highlighted below), you can add DBOS into an existing Google ADK application.

```python {title="dbos_agent.py"}
import asyncio
import logging

# highlight-start
from dbos import DBOS, DBOSConfig
from dbos_google_adk import DBOSPlugin
# highlight-end
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# Decorate tool calls with @DBOS.step() for durable execution
# highlight-next-line
@DBOS.step()
async def get_weather(city: str) -> str:
    """Get the weather for a city."""
    return f"Sunny in {city}"

agent = LlmAgent(name="weather", model="gemini-flash-latest", tools=[get_weather])
runner = Runner(
    app_name="my-agent",
    agent=agent,
    # highlight-next-line
    plugins=[DBOSPlugin()],
    session_service=InMemorySessionService(),
)

# Drive the agent from a DBOS workflow for durable execution
# highlight-next-line
@DBOS.workflow()
async def run_agent(user_id: str, session_id: str, message: str) -> str:
    new_message = types.Content(role="user", parts=[types.Part.from_text(text=message)])
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=new_message
    ):
        if event.is_final_response():
            return event.content.parts[0].text
    return ""


async def main():
    # highlight-start
    # DBOS checkpoints to SQLite by default. Postgres is recommended for production.
    config: DBOSConfig = {"name": "my-agent", "system_database_url": "sqlite:///dbostest.sqlite"}
    DBOS(config=config)
    DBOS.launch()
    # highlight-end

    await runner.session_service.create_session(
        app_name="my-agent", user_id="u", session_id="s"
    )
    print(await run_agent("u", "s", "How is the weather in San Francisco?"))


if __name__ == "__main__":
    asyncio.run(main())
```

**Notes:**

1. Workflows and agents must be defined before [`DBOS.launch()`](../python/reference/dbos-class.md#launch).
2. This example uses SQLite for ease of getting started. Postgres is recommended for production.


## Learn More
For more details on building agents, see the [Google ADK documentation](https://adk.dev/). For information about durable execution and workflow design, see the [DBOS programming guide](../python/programming-guide). Together, these resources cover everything from getting started with simple agents to designing production-ready, fault-tolerant applications.
