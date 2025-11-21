---
sidebar_position: 50
title: DBOS Client
toc_max_heading_level: 3
---

`DBOSClient` provides a programmatic way to interact with your DBOS application from external code.

## DBOSClient

```java
DBOSClient(String url, String user, String password)
```

Construct the DBOSClient.

**Parameters:**
- **url**: The JDBC URL for your system database.
- **user**: Your Postgres username or role.
- **password**: The password for your Postgres user or role.

## Workflow Interaction Methods

### enqueueWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> enqueueWorkflow(
      EnqueueOptions options, Object[] args)
```

Enqueue a workflow and return a handle to it.

**Parameters:**
- **options**: Configuration for the enqueued workflow, as defined below.
- **args**: An array of the workflow's arguments. These will be serialized and passed into the workflow when it is dequeued.

**Example Syntax:**

This code enqueues workflow `exampleWorkflow` in class `com.example.ExampleImpl` on queue `example-queue` with arguments `argumentOne` and `argumentTwo`.

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword);
var options =
    new DBOSClient.EnqueueOptions(
        "com.example.ExampleImpl", "exampleWorkflow", "example-queue");
var handle = client.enqueueWorkflow(options, new Object[]{"argumentOne", "argumentTwo"});
```

#### EnqueueOptions

`EnqueueOptions` is a with-based configuration record for parameterizing `client.enqueueWorkflow`.


**Constructors:**

```java
public EnqueueOptions(String className, String workflowName, String queueName)
```

Specify the name and class name of the workflow to enqueue and the name of the queue on which it is to be enqueued.

**Methods:**

- **`withWorkflowId(String workflowId)`**: Specify the idempotency ID to assign to the enqueued workflow.
- **`withAppVersion(String appVersion)`**: The version of your application that should process this workflow. 
If left undefined, it will be updated to the current version when the workflow is first dequeued.
Please see [Managing Application Versions](../../production/self-hosting/workflow-recovery#managing-application-versions) for more information.
- **`withTimeout(Duration timeout)`**:  Set a timeout for the enqueued workflow. When the timeout expires, the workflow and all its children are cancelled. The timeout does not begin until the workflow is dequeued and starts execution.
- **`withDeadline(Instant deadline)`**:  Set a deadline for the enqueued workflow. If the workflow is executing when the deadline arrives, the workflow and all its children are cancelled.
- **`withDeduplicationId(String deduplicationId)`**: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise an exception.
- **`withPriority(Integer priority)`**: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in FIFO (first in, first out) order. Priority values can range from `1` to `2,147,483,647`, where a low number indicates a higher priority. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
- **`withInstanceName(String name)`**: The enqueued workflow should run on this particular named class instance.

### send

```java
send(String destinationId, Object message, String topic, String idempotencyKey) 
```

Similar to [`DBOS.send`](./methods.md#send).

### getEvent

```java
Object getEvent(String targetId, String key, Duration timeoutSeconds)
```

Similar to [`DBOS.getEvent`](./methods.md#getevent).

## Workflow Management Methods

### retrieveWorkflow

```java
WorkflowHandle<T, E> retrieveWorkflow(String workflowId)
```

Similar to [`DBOS.retrieveWorkflow`](./methods.md#retrieveworkflow).

### getWorkflowStatus

```java
Optional<WorkflowStatus> getWorkflowStatus(String workflowId)
```

Retrieve the [`WorkflowStatus`](./methods.md#workflowstatus) of a workflow.

### listWorkflows

```java
List<WorkflowStatus> listWorkflows(ListWorkflowsInput input)
```

Similar to [`DBOS.listWorkflows`](./methods.md#listworkflows).

### listWorkflowSteps

```java
List<StepInfo> listWorkflowSteps(String workflowId)
```

Similar to [`DBOS.listWorkflowSteps`](./methods.md#listworkflowsteps).

### cancelWorkflow

```java
void cancelWorkflow(String workflowId)
```

Similar to [`DBOS.cancelWorkflow`](./methods.md#cancelworkflow).

### resumeWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> resumeWorkflow(String workflowId)
```

Similar to [`DBOS.resumeWorkflow`](./methods.md#resumeworkflow).

### forkWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> forkWorkflow(
      String originalWorkflowId, int startStep, ForkOptions options)
```

Similar to [`DBOS.forkWorkflow`](./methods.md#forkworkflow).
