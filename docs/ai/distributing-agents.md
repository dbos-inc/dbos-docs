---
sidebar_position: 40
title: Distributing & Scaling Agents
hide_table_of_contents: false
---

Often AI applications and agents need to **distribute work** and run many parallel tasks across many servers.
For example, a document ingestion pipeline using Retrieval-Augmented Generation (RAG) to power an agent must be able to index tens of thousands of documents concurrently.
A deep research agent searching the Internet must be able to to concurrently scrape hundreds of websites.

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
If your application is resource intensive or uses rate-limited APIs, you can use queues to rate-limit or control the concurrency of your workflows.
For example, you can specify that no more than 10 workflows should run concurrently on a single server:

```python
queue = Queue("indexing_queue", worker_concurrency=10)
```

Because queues are backed by durable workflows, they can automatically recover from any failure: if a server restarts or has a network hiccup partway through a multi-hour run of your pipeline on a batch of 10K documents, your pipeline will recover from the last indexed document instead of restarting from the beginning and redoing expensive work.

If you're interested in building distributed AI agents or data pipelines, check out the [document ingestion example](../python/examples/document-detective.md), which shows best practices for building durable distributed applications.