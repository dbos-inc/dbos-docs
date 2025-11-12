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

### Adding Human-in-the-Loop

Many agents need a **human in the loop** for decisions that are too important to fully trust an LLM.
However, it's not easy to design an agent that waits for human feedback.
The key issue is **time**: a human might take hours or days to respond to an agent request, so the agent must be able to reliably wait for a long time (during which the server might be restarted, software might be upgraded, etc.).

Durable workflows help because they provide tools like **durable notifications**.
For example, you can add a line of code to your agent that tells it to wait hours or days for a notification:

```python
approval: Optional[HumanResponseRequest] = DBOS.recv(timeout_seconds=TIMEOUT)
```

Both the deadline and the notification are stored in your database, so anything can happen while your agent is waiting (its server can restart, its code can be upgraded, etc.) and it will recover and keep waiting until the notification arrives or the deadline is reached.

If you're interested in building human-in-the-loop agents, check out the [agent inbox](../python/examples/agent-inbox.md) example, which shows how to use durable notifications to add human-in-the-loop to agents and how to use workflow introspection to monitor and display which agents are waiting for which human inputs.

### Distributing Work

Often AI applications and agents need to **distribute work** and run many parallel tasks across many servers.
For example, a document ingestion pipeline using Retrieval-Augmented Generation (RAG) to power an agent must be able to index thousands of documents concurrently.
A deep research agent searching the Internet must be able to to concurrently scrape dozens of websites.

Workflows help by providing a **durable queue** abstraction to reliably distribute work.
A workflow can enqueue any number of tasks for concurrent processing.
For example, a document ingestion pipeline can enqueue workflows to process each document in a batch:

```python
queue = Queue("indexing_queue")

@DBOS.workflow()
def index_documents(urls):
    handles: List[WorkflowHandle] = []
    # Enqueue each document for indexing
    for url in urls:
        handle = queue.enqueue(index_document, url)
        handles.append(handle)
    # Wait for all documents to finish indexing, count the total number of indexed pages
    outputs = []
    for handle in handles:
        outputs.append(handle.get_result())
    return outputs
```

The enqueued workflows can be dequeued and executed by any of your application's servers.
If your application is resource intensive or uses rate-limited APIs, you can use queues to rate-limit or limit the concurrency of your workflows.
For example, you can specify that no more than 10 workflows should run concurrently on a single server:

```python
queue = Queue("indexing_queue", worker_concurrency=10)
```

Because queues are backed by durable workflows, they can automatically recover from any failure: if a server restarts partway through a multi-hour run of your pipeline on a batch of 10K documents, your pipeline will recover from the last indexed document instead of restarting from the beginning.

If you're interested in building distributed AI agents or data pipelines, check out our [document ingestion example](../python/examples/document-detective.md), which shows best practices for building durable distributed applications.