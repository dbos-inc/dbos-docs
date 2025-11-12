---
sidebar_position: 30
title: Why Durable Workflows for Agents
hide_table_of_contents: false
---

DBOS provides lightweight durable workflows for your AI agents.
Essentially, you install the open-source library and annotate workflows and steps in your agent, either directly or through integrations with agent frameworks like [Pydantic AI](https://ai.pydantic.dev/durable_execution/dbos/) or [CrewAI](https://github.com/dbos-inc/dbos-crewai).
This usally requires changing only a couple lines of code.
Then, when your agent runs, DBOS checkpoints its workflows and steps to a database, creating a durable record of its progress that it can use to automatically recover your agents from any failures.

This durability helps solve many tough problems you encounter when building agents or operating them in production.
Here's how:

### Debugging Unexpected Agent Behavior

One of the most common problems you encounter building and operating agents is failures due to **unexpected agent behavior**.
For example, an agent might:

- Return a malformed structured output, causing a tool call to fail
- Invoke the wrong tool or the right tool with the wrong inputs, causing a failure
- Generate an undesirable or inappropriate text output

These behaviors are especially hard to diagnose in a complex or long-running agent&mdash;if an agent runs for two hours then fails unexpectedly, it's difficult to reproduce the exact set of conditions that caused the failure and test a fix.

Durable workflows help by making it easier to observe the root cause of the failure, deterministically reproduce the failure, and test or apply fixes.
Because workflows checkpoint the outcome of each step of your workflow, you can review these checkpoints to see the cause of the failure and audit every prior step that led to it.
For example, you might see that your agent failed because of a validation error caused by a malformed structured output:

<img src={require('@site/static/img/why-dbos-agents/agent-fail.png').default} alt="Failing Agent" width="750" className="custom-img"/>

Once you've identified the cause of a failure, you can use the **workflow fork** operation to reproduce it.
Fork restarts a workflow from a completed step, using checkpointed information to deterministically reproduce the state of the workflow up to that step.
Once you can reproduce the failure in a development environment, it becomes much easier to fix.
You can add additional logging or telemetry to the misbehaving step to identify the root cause.
Once you have a fix, you can reproduce the failure with the fix in place to test if it works.
For example, you might hypothesize that the malformed output was caused by an error in the prompt, so you fix the prompt, rerun the failed step, and observe that it completes successfully:

<img src={require('@site/static/img/why-dbos-agents/agent-succeed.png').default} alt="Successful Agent" width="750" className="custom-img"/>
