---
sidebar_position: 40
title: Parallelizing & Scaling Agents
hide_table_of_contents: false
---

AI agents and applications often need to **run many tasks in parallel**.
A single step of an agentic loop might invoke several tools at once based on an LLM response.
A document ingestion pipeline using Retrieval-Augmented Generation (RAG) might index tens of thousands of documents concurrently.
A deep research agent might scrape hundreds of websites at the same time.

DBOS workflows make these parallel patterns durable and scalable through a **durable queue** abstraction.
A workflow can enqueue any number of tasks for concurrent processing, then wait for their results.
Because every task is checkpointed, your agent can recover from any failure mid-flight without re-running work that already succeeded.

## Parallel Tool Calls

When an LLM returns multiple tool calls in a single response, you can execute them in parallel by enqueuing each one as a workflow and waiting for all of them to complete:

```python
tool_queue = Queue("tool_queue")

@DBOS.workflow()
def run_tool_calls(tool_calls):
    handles: List[WorkflowHandle] = []
    # Enqueue each tool call to run in parallel
    for call in tool_calls:
        handle = tool_queue.enqueue(execute_tool, call.name, call.arguments)
        handles.append(handle)
    # Wait for all tool calls to finish and collect their outputs
    return [handle.get_result() for handle in handles]
```

Because each tool call runs as a durable workflow, an agent that crashes partway through a fan-out resumes without re-issuing tools that already completed&mdash;an important property when tools have side effects or call expensive APIs.

## Distributing Work Across Servers

The same pattern scales to data pipelines and other batch workloads.
For example, a document ingestion pipeline can enqueue a workflow to index each document in a batch:

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

Enqueued workflows can be dequeued and executed by any of your application's servers, distributing the work across your fleet.
If your application is resource intensive or uses rate-limited APIs, you can use queues to rate-limit or control the concurrency of your workflows.
For example, you can specify that no more than 10 workflows should run concurrently on a single server:

```python
queue = Queue("indexing_queue", worker_concurrency=10)
```

Because queues are backed by durable workflows, they automatically recover from any failure: if a server restarts or has a network hiccup partway through a multi-hour run of your pipeline on a batch of 10K documents, your pipeline will recover from the last indexed document instead of restarting from the beginning and redoing expensive work.

If you're interested in building distributed AI agents or data pipelines, check out the [document ingestion example](../python/examples/document-detective.md), which shows best practices for building durable distributed applications.

To learn more about how to scale applications with durable queues, check out the [queues tutorial](../python/tutorials/queue-tutorial.md).
