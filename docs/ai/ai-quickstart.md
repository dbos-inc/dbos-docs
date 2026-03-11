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