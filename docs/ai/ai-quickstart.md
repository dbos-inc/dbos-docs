---
sidebar_position: 10
title: AI Quickstart
hide_table_of_contents: false
---

You can integrate DBOS durable workflows with your AI agent (or other AI system) to make it reliable, observable, and resilient to failures.
Rather than bolting on ad-hoc retry logic, DBOS workflows give you one consistent model for ensuring your agents can recover from any failure from exactly where they left off.

In particular, integrating DBOS to your agent gives you:

- Automatic recovery from transient failures, server restarts, process crashes, etc.
- [Reproducibility](./debugging.md)&mdash;if your agent ever exhibits bad or unexpected behavior, you can use saved workflow progress to consistently reproduce the conditions leading to it in a development environment.
- Support for extremely long-running flows and [reliable human-in-the-loop](./hitl.md)&mdash;you can build agents that run for hours, days, or weeks (potentially waiting for human responses) and seamlessly recover from any interruption.
- Built in scalability and [task distribution](./distributing-agents.md)&mdash;if your agent or AI system needs to run many tasks in parallel (for example, a data pipeline processing many documents), you can use durable queues to distribute the work across many servers with managed flow control.

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

</LargeTabItem>
<LargeTabItem value="typescript" label="TypeScript">


</LargeTabItem>
<LargeTabItem value="pydantic" label="Pydantic AI">


</LargeTabItem>
<LargeTabItem value="llamaindex" label="LlamaIndex">


</LargeTabItem>
<LargeTabItem value="openai" label="OpenAI Agents SDK">


</LargeTabItem>
</LargeTabs>