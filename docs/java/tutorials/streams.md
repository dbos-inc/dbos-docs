---
sidebar_position: 75
title: Streams
description: Stream values from a running workflow to external consumers.
---

Streams let a workflow emit values incrementally as it runs, while one or more external consumers read them in order.
Unlike [events](./workflow-communication.md#events), which store a single latest value per key, a stream is an ordered sequence of values that accumulates over the lifetime of the workflow.

Typical use cases:
- Streaming progress updates or log lines to a UI
- Producing a sequence of results consumed by another process
- Long-running data pipelines where results should be visible before the workflow completes

## Writing a Stream

Call `dbos.writeStream(key, value)` from inside a workflow or a step to append a value to the stream.
Call `dbos.closeStream(key)` from inside the workflow (not a step) when no more values will be written.

```java
interface ReportWorkflow {
    void generate(String reportId);
}

class ReportWorkflowImpl implements ReportWorkflow {
    private static final String STREAM_KEY = "progress";
    private final DBOS dbos;

    public ReportWorkflowImpl(DBOS dbos) { this.dbos = dbos; }

    @Workflow
    public void generate(String reportId) {
        dbos.writeStream(STREAM_KEY, "Starting report " + reportId);

        dbos.runStep(() -> processSection("section-1"), "section-1");
        dbos.writeStream(STREAM_KEY, "Section 1 complete");

        dbos.runStep(() -> processSection("section-2"), "section-2");
        dbos.writeStream(STREAM_KEY, "Section 2 complete");

        dbos.writeStream(STREAM_KEY, "Done");
        dbos.closeStream(STREAM_KEY);   // signal to consumers that the stream is finished
    }
}
```

:::info
`closeStream` must be called from within the workflow body, not from inside a step. If the workflow terminates without calling `closeStream`, consumers will stop automatically when the workflow is no longer active.
:::

## Reading a Stream

Call `dbos.readStream(workflowId, key)` — or `client.readStream(workflowId, key)` from external code — to get a blocking `Iterator<Object>` over the stream's values.

The iterator polls for new values while the workflow is active (`PENDING` or `ENQUEUED`) and stops naturally once all values have been read and the stream is closed (or the workflow terminates).

```java
// Start the workflow
WorkflowHandle<Void, ?> handle = dbos.startWorkflow(
    () -> reportProxy.generate("q4-2025"),
    new StartWorkflowOptions());

// Read the stream from the same process
Iterator<Object> stream = dbos.readStream(handle.workflowId(), "progress");
while (stream.hasNext()) {
    System.out.println(stream.next()); // blocks until the next value is available
}
```

From an external process using `DBOSClient`:

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword);
Iterator<Object> stream = client.readStream(workflowId, "progress");
while (stream.hasNext()) {
    System.out.println(stream.next());
}
```

## Cross-Language Streams

If the consumer is a TypeScript or Python application, use `SerializationStrategy.PORTABLE` when writing so values are stored as portable JSON:

```java
dbos.writeStream(STREAM_KEY, "Section 1 complete", SerializationStrategy.PORTABLE);
```

See [Serialization Strategy](../reference/methods.md#serialization-strategy) for details.

## API Reference

| Method | Where callable | Description |
|--------|----------------|-------------|
| [`dbos.writeStream(key, value)`](../reference/methods.md#writestream) | Workflow or step | Append a value to the stream |
| [`dbos.writeStream(key, value, serialization)`](../reference/methods.md#writestream) | Workflow or step | Append with explicit serialization |
| [`dbos.closeStream(key)`](../reference/methods.md#closestream) | Workflow only | Signal end of stream |
| [`dbos.readStream(workflowId, key)`](../reference/methods.md#readstream) | Anywhere | Read stream as a blocking iterator |
| [`client.readStream(workflowId, key)`](../reference/client.md#readstream) | External code | Same, from a `DBOSClient` |
