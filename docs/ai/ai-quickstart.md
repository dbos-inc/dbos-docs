---
sidebar_position: 10
title: AI Quickstart
hide_table_of_contents: false
---

You can integrate DBOS durable workflows with your AI agents (or other AI systems) to make them reliable, observable, and resilient to failures.
Rather than bolting on ad-hoc retry logic, DBOS workflows give you one consistent model for ensuring your agents can recover from any failure from exactly where they left off.

In particular, integrating DBOS to your agents gives you:

- Automatic recovery from transient failures, server restarts, process crashes, etc.
- [Reproducibility](./debugging.md): if your agents exhibit unexpected behavior, you can use saved workflow progress to reproduce it in a development environment to identify and fix the root cause.
- [Support for long-running flows and reliable human-in-the-loop](./hitl.md): you can build agents that run for hours, days, or weeks (potentially waiting for human responses) and seamlessly recover from any interruption.
- [Built in scalability and task distribution](./distributing-agents.md): if your agent or AI system needs to run many tasks in parallel (for example, a data pipeline processing many documents), you can use durable queues to distribute the work across many servers with managed flow control.

## Get Started

You can integrate DBOS into an agent built in regular Python or TypeScript, or use native integrations with popular agentic frameworks like Pydantic AI, LlamaIndex, and the OpenAI Agents SDK.

<LargeTabs groupId="language"  queryString="language">
<LargeTabItem value="python" label="Python">

### 1. Install DBOS
`pip install` DBOS into your application.

```shell
pip install dbos
```

### 2. Configure and Launch DBOS

Add these lines of code to your agent's main function.
They initialize DBOS when your agentic application starts.

```python
import os
from dbos import DBOS, DBOSConfig

config: DBOSConfig = {
    "name": "my-app",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
}
DBOS(config=config)
DBOS.launch()
```

:::info
DBOS uses a database to durably store workflow and step state.
By default, it uses SQLite, which requires no configuration.
For production use, we recommend connecting your DBOS application to a Postgres database.
When you're ready for production, you can connect this initialization code to Postgres by setting the `DBOS_SYSTEM_DATABASE_URL` environment variable to a connection string to your Postgres database.
:::

### 3. Annotate Workflows and Steps

Next, annotate your main agentic loop as a durable workflow and each LLM and tool call it makes as a step.
This causes DBOS to checkpoint the progress of your agent in your database so it can recover from any failure.

For instance, in the [deep research agent example](../python/examples/hacker-news-agent.md), here is the main agentic loop:

```python
@DBOS.workflow()
def agentic_research_workflow(topic: str, max_iterations: int = 3):
    """
    This agent starts with a research topic then:
    1. Searches Hacker News for information on that topic.
    2. Iteratively searches related topics, collecting information.
    3. Makes decisions about when to continue.
    4. Synthesizes findings into a final report.
    """
    ...
```

And here is an example step, an LLM call to evaluate results:

```python
@DBOS.step()
def evaluate_results_step(
    topic: str,
    query: str,
    stories: List[Dict[str, Any]],
    comments: Optional[List[Dict[str, Any]]] = None,
) -> EvaluationResult:
    """LLM evaluates search results and extracts insights."""
    ...
```

To learn more about how to build with DBOS Python, check out the [Python docs](../python/programming-guide.md).

</LargeTabItem>
<LargeTabItem value="typescript" label="TypeScript">

### 1. Install DBOS
`npm install` DBOS into your application.

```shell
npm install @dbos-inc/dbos-sdk@latest
```

### 2. Configure and Launch DBOS

Add these lines of code to your agent's main function.
They initialize DBOS when your agentic application starts.

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";

DBOS.setConfig({
  "name": "my-app",
  "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
});
await DBOS.launch();
```

:::info
DBOS uses a database to durably store workflow and step state.
By default, it uses a Postgres database.
You can start Postgres locally with `npx dbos postgres start`, or set the `DBOS_SYSTEM_DATABASE_URL` environment variable to a connection string to an existing Postgres database.
:::

### 3. Register Workflows and Steps

Next, register your main agentic loop as a durable workflow and run each LLM and tool call as a step.
This causes DBOS to checkpoint the progress of your agent in your database so it can recover from any failure.

For instance, in the [deep research agent example](../typescript/examples/hacker-news-agent.md), here is the main agentic loop, registered as a workflow:

```typescript
async function agenticResearchWorkflowFunction(
  topic: string,
  maxIterations: number,
): Promise<ResearchResult> {
    ...
}
export const agenticResearchWorkflow = DBOS.registerWorkflow(
  agenticResearchWorkflowFunction,
);
```

And here is an example step, an LLM call to evaluate results:

```typescript
const evaluation = await DBOS.runStep(
  () => evaluateResults(topic, query, stories, comments),
  { name: "evaluateResults" },
);
```

To learn more about how to build with DBOS TypeScript, check out the [TypeScript docs](../typescript/programming-guide.md).

</LargeTabItem>
<LargeTabItem value="pydantic" label="Pydantic AI">

### 1. Install Pydantic AI with DBOS

Install Pydantic AI with the DBOS optional dependency.

```shell
pip install pydantic-ai[dbos]
```

### 2. Configure DBOS and Wrap Your Agent

Import and configure DBOS, then wrap your Pydantic AI agent in a `DBOSAgent` for durable execution.
`DBOSAgent` automatically wraps your agent's run loop as a DBOS workflow and model requests and MCP communication as DBOS steps.

```python
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

if __name__ == "__main__":
    asyncio.run(main())
```

Custom tool functions can optionally be decorated with `@DBOS.step` if they involve non-determinism or I/O.

To learn more, check out the [Pydantic AI integration guide](../integrations/pydantic-ai.md) and the [Pydantic AI docs](https://ai.pydantic.dev/durable_execution/dbos).

</LargeTabItem>
<LargeTabItem value="llamaindex" label="LlamaIndex">

### 1. Install LlamaIndex with DBOS

Install the [`llama-agents-dbos`](https://github.com/run-llama/workflows-py/tree/main/packages/llama-agents-dbos) package.

```shell
pip install llama-agents-dbos
```

### 2. Configure DBOS and Use the DBOS Runtime

Import and configure DBOS, then create a `DBOSRuntime` and pass it to your LlamaIndex workflow.
The DBOS runtime automatically persists every workflow transition so your workflow can resume exactly where it left off after any failure.

```python
import asyncio

# highlight-next-line
from dbos import DBOS, DBOSConfig
# highlight-next-line
from llama_agents.dbos import DBOSRuntime
from pydantic import Field
from workflows import Context, Workflow, step
from workflows.events import Event, StartEvent, StopEvent

# highlight-start
config: DBOSConfig = {
    "name": "llamaindex-example",
    "system_database_url": "sqlite:///example.sqlite",
}
DBOS(config=config)
# highlight-end


class MyResult(StopEvent):
    output: str = Field(description="Result")


class MyWorkflow(Workflow):
    @step
    async def start(self, ctx: Context, ev: StartEvent) -> MyResult:
        return MyResult(output="Hello from a durable workflow!")


# highlight-next-line
runtime = DBOSRuntime()
workflow = MyWorkflow(runtime=runtime)


async def main() -> None:
    # highlight-next-line
    await runtime.launch()
    result = await workflow.run(run_id="my-run-1")
    print(result.output)


asyncio.run(main())
```

To learn more, check out the [LlamaIndex integration guide](../integrations/llamaindex.md) and the [LlamaIndex docs](https://developers.llamaindex.ai/python/llamaagents/workflows/dbos/).

</LargeTabItem>
<LargeTabItem value="openai" label="OpenAI Agents SDK">

### 1. Install DBOS and the OpenAI Agents Integration

Install DBOS and the [durable OpenAI agents integration](https://github.com/dbos-inc/dbos-openai-agents).

```shell
pip install dbos dbos-openai-agents
```

### 2. Configure DBOS and Wrap Your Agent

Use `DBOSRunner` as a drop-in replacement for `Runner` and annotate your agent's workflow and tool calls with DBOS decorators.

```python
import asyncio
from agents import Agent, function_tool
# highlight-start
from dbos import DBOS, DBOSConfig
from dbos_openai_agents import DBOSRunner
#highlight-end

@function_tool
# highlight-next-line
@DBOS.step()
async def get_weather(city: str) -> str:
    """Get the weather for a city."""
    return f"Sunny in {city}"

agent = Agent(name="weather", tools=[get_weather])

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

To learn more, check out the [OpenAI Agents SDK integration guide](../integrations/openai-agents.md) and the [OpenAI Agents SDK documentation](https://platform.openai.com/docs/guides/agents-sdk).

</LargeTabItem>
</LargeTabs>