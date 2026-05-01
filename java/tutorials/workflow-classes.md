---
sidebar_position: 80
title: Workflows on Class Instances
description: Register multiple instances of a workflow class to share logic with per-instance configuration.
---

DBOS supports registering multiple instances of the same workflow implementation class under different names.
This is useful when the same workflow logic should run against different configurations — for example, different API endpoints, tenant-specific credentials, or database connections — without duplicating code.

## The Problem

Suppose you have a workflow that processes data from a remote service:

```java
interface DataProcessor {
    void process(String jobId);
}

class DataProcessorImpl implements DataProcessor {
    private final String serviceUrl;

    public DataProcessorImpl(String serviceUrl) {
        this.serviceUrl = serviceUrl;
    }

    @Workflow
    public void process(String jobId) {
        dbos.runStep(() -> fetchAndStore(serviceUrl, jobId), "fetch-" + jobId);
    }
}
```

If you need to run this workflow against two different service URLs, you need two instances — but both share the same `@Workflow` method. DBOS must know which instance to use when recovering an interrupted workflow.

## Registering Named Instances

Give each instance a unique name using the three-argument `registerProxy` overload:

```java
DBOS dbos = new DBOS(config);

DataProcessor processorA = dbos.registerProxy(
    DataProcessor.class,
    new DataProcessorImpl("https://service-a.example.com"),
    "service-a"
);

DataProcessor processorB = dbos.registerProxy(
    DataProcessor.class,
    new DataProcessorImpl("https://service-b.example.com"),
    "service-b"
);

dbos.launch();

// Each proxy routes workflows to its own instance
processorA.process("job-1");
processorB.process("job-2");
```

The instance name is stored alongside the workflow record in the database.
When DBOS recovers an interrupted workflow, it uses the stored name to find the correct instance and resume execution on it.

:::warning
All named instances must be registered before `dbos.launch()`.
If DBOS tries to recover a workflow for an instance that hasn't been registered, recovery will fail.
:::

## Enqueueing to a Named Instance

When enqueueing a workflow via `DBOSClient` from external code, use `withInstanceName` on `EnqueueOptions` to target a specific instance:

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword);
var options = new DBOSClient.EnqueueOptions("process", "com.example.DataProcessorImpl", "my-queue")
    .withInstanceName("service-a");
client.enqueueWorkflow(options, new Object[]{"job-3"});
```

## Using `@WorkflowClassName` for Stable Names

If your class name might change across refactors, annotate the implementation class with [`@WorkflowClassName`](../reference/workflows-steps.md#workflowclassname) to give it a stable portable name:

```java
@WorkflowClassName("data-processor")
class DataProcessorImpl implements DataProcessor { ... }
```

Then reference that stable name in `WorkflowSchedule`, `EnqueueOptions`, or any other place that takes a class name string.

## Filtering by Instance Name

Use `withInstanceName` on `ListWorkflowsInput` to list workflows that ran on a specific instance:

```java
var workflows = dbos.listWorkflows(
    new ListWorkflowsInput().withInstanceName("service-a")
);
```
