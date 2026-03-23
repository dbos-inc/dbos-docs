---
sidebar_position: 10
title: DBOS System Database
description: DBOS system database reference
---

DBOS records application execution history in several system tables.
These tables are located in your system database, whose location you configure when you launch your application.
A PostgreSQL system database also includes PL/pgSQL functions that you can call from stored procedures or triggers. 

## System Database Functions

:::info[Reminder]
PL/pgSQL functions can only be called from code running in the same database.
:::

### dbos.enqueue_workflow

```sql
CREATE FUNCTION dbos.enqueue_workflow(
    workflow_name TEXT,
    queue_name TEXT,
    positional_args JSON[] DEFAULT ARRAY[]::JSON[],
    named_args JSON DEFAULT '{}'::JSON,
    class_name TEXT DEFAULT NULL,
    config_name TEXT DEFAULT NULL,
    workflow_id TEXT DEFAULT NULL,
    app_version TEXT DEFAULT NULL,
    timeout_ms BIGINT DEFAULT NULL,
    deadline_epoch_ms BIGINT DEFAULT NULL,
    deduplication_id TEXT DEFAULT NULL,
    priority INTEGER DEFAULT NULL,
    queue_partition_key TEXT DEFAULT NULL
) RETURNS TEXT
```

PL/pgSQL function for enqueuing a workflow on a [durable queue](../architecture.md#durable-queues).

**Parameters:**
- `workflow_name`: The name of workflow to enqueue.
- `queue_name`: The durable queue on witch to enqueue this workflow.
- `positional_args`: An array of positional parameters for the enqueued workflow. Must use [Portable JSON Format](portable-workflows.md#portable-json-format). Defaults to an empty array
- `named_args`: The named paramters (for languages that support them, like Python). Must use [Portable JSON Format](portable-workflows.md#portable-json-format) and be a JSON object. Defaults to an empty object (`{}`).
- `class_name`: The class name of workflow to enqueue. Defaults to null.
- `config_name`: The config name of workflow to enqueue. For languages that support it, this is usually exposed as workflow class instance name. Defaults to null.
- `workflow_id`: Specify the idempotency ID to assign to the enqueued workflow. If left undefined, a random UUID is generated.
- `app_version`: The version of your application that should process this workflow. If left undefined, it will be updated to the current version when the workflow is first dequeued.
- `timeout_ms`: Set a timeout for the enqueued workflow. When the timeout expires, the workflow and all its children are cancelled. The timeout does not begin until the workflow is dequeued and starts execution. 
- `deadline_epoch_ms`: Set a deadline for the enqueued workflow. If the workflow is executing when the deadline arrives, the workflow and all its children are cancelled.
- `deduplication_id`: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status ENQUEUED or PENDING), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise an exception.
- `priority`: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in FIFO (first in, first out) order. Priority values can range from 1 to 2,147,483,647, where a low number indicates a higher priority. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
- `queue_partition_key`: Set a queue partition key for the workflow. Use if and only if the queue is partitioned (created with withPartitionedEnabled). In partitioned queues, all flow control (including concurrency and rate limits) is applied to individual partitions instead of the queue as a whole.

### dbos.send_message

```sql
CREATE FUNCTION dbos.send_message(
    destination_id TEXT,
    message JSON,
    topic TEXT DEFAULT NULL,
    idempotency_key TEXT DEFAULT NULL
) RETURNS VOID
```

PL/pgSQL for sending a message to a workflow, similar to `DBOS.send`.
Messages can optionally be associated with a topic.

**Parameters:**
- `destination_id`: The workflow to which to send the message.
- `message`: The message to send. Must use [Portable JSON Format](portable-workflows.md#portable-json-format).
- `topic`: A topic with which to associate the message. Messages are enqueued per-topic on the receiver.
- `idempotency_key`: If an idempotency key is set, the message will only be sent once no matter how many times `DBOS.send` is called with this key.

## System Database Tables

### dbos.workflow_status

This table stores workflow execution information.
Each row represents a different workflow execution.

**Columns:**
- **workflow_uuid**: The unique identifier of the workflow execution.
- **status**: The status of the workflow execution. One of `PENDING`, `SUCCESS`, `ERROR`, `MAX_RECOVERY_ATTEMPTS_EXCEEDED`, `ENQUEUED`, `DELAYED`, or `CANCELLED`.
- **name**: The name (in Python, fully qualified name) of the workflow function.
- **authenticated_user**: The user who ran the workflow. Empty string if not set.
- **assumed_role**: The role used to run this workflow.  Empty string if authorization is not required.
- **authenticated_roles**: All roles the authenticated user has, if any.
- **request**: The serialized HTTP Request that triggered this workflow, if any.
- **inputs**: The serialized inputs of the workflow execution.
- **output**: The serialized workflow output, if any.
- **error**: The serialized error thrown by the workflow, if any.
- **created_at**: The epoch timestamp of when this workflow was created (enqueued or started).
- **updated_at**: The latest epoch timestamp when this workflow status was updated.
- **application_version**: The application version of this workflow code.
- **class_name**: The class name of the workflow function.
- **config_name**: The name of the configured instance of this workflow, if any.
- **recovery_attempts**: The number of attempts (so far) to recovery this workflow.
- **queue_name**: If this workflow is or was enqueued, the name of the queue.
- **executor_id**: The ID of the executor that ran this workflow.
- **workflow_timeout_ms**: The timeout of the workflow, if specified.
- **workflow_deadline_epoch_ms**: The deadline at which the workflow times out, if the workflow has a timeout. Derived when the workflow starts by adding the timeout to the workflow start time (which may be different than the creation time for enqueued workflows).
- **started_at_epoch_ms**: If this workflow was enqueued, the time at which it was dequeued and began execution.
- **deduplication_id**: The deduplication key for this workflow, if any.
- **priority**: The priority of this workflow on its queue, if enqueued. Defaults to 0 if not specified. Lower priorities execute first.
- **queue_partition_key**: The key associated with the workflow, if on a partitioned queue.
- **forked_from**: The ID of the workflow that this was forked from, if applicable.
- **was_forked_from**: Whether this workflow has ever been forked from by another workflow.
- **parent_workflow_id**: The ID of the parent workflow, if this workflow was started as a child of another workflow.
- **owner_xid**: Internal transaction ID used to prevent duplicate workflow starts.
- **application_id**: Internal field used only in DBOS Cloud.
- **serialization**: The name of the serialization format used for this workflow's inputs, output, and error (e.g. `java_jackson`, `py_pickle`, `portable_json`). Null if the default serializer was used.

### dbos.operation_outputs
This table stores the outputs of workflow steps.
Each row represents a different workflow step execution.
Executions of DBOS methods like `DBOS.sleep` and `DBOS.send` are also recorded here as steps, as is enqueueing or starting a child workflow.

**Columns:**
- **workflow_uuid**: The unique identifier of the workflow execution this function belongs to.
- **function_id**: The monotonically increasing ID of the step (starts from 0) within the workflow, based on the order in which steps execute.
- **function_name**: The name of the step.
- **output**: The serialized step output, if any.
- **error**: The serialized error thrown by the step, if any.
- **child_workflow_id**: If the step starts a new child workflow, its ID.
- **started_at_epoch_ms**: The epoch timestamp of when this step started execution.
- **completed_at_epoch_ms**: The epoch timestamp of when this step completed.
- **serialization**: The name of the serialization format used for this step's output and error. Null if the workflow's default serializer was used.

### dbos.notifications
This table stores workflow messages/notifications.
Each entry represents a different message.

**Columns:**
- **destination_uuid**: The ID of the workflow to which the message is sent.
- **topic**: The topic to which the message is sent.
- **message**: The serialized contents of the message.
- **created_at_epoch_ms**: The epoch timestamp when this message was created.
- **message_uuid**: The unique ID of the message.
- **serialization**: The name of the serialization format used for the message. Null if the default serializer was used.

### dbos.workflow_events
This table stores workflow events.
Each entry represents a different event.

**Columns:**
- **workflow_uuid**: The ID of the workflow that published this event.
- **key**: The serialized key of the event.
- **value**: The serialized value of the event.
- **serialization**: The name of the serialization format used for the event value. Null if the default serializer was used.

### dbos.workflow_events_history
This table stores historic changes to workflow events over time.
Each entry represents a distinct value of a workflow event during the workflow lifetime.

**Columns:**
- **workflow_uuid**: The ID of the workflow that published this event.
- **function_id**: The monotonically increasing ID of the step that set this value.
- **key**: The serialized key of the event.
- **value**: The serialized value of the event.
- **serialization**: The name of the serialization format used for the event value. Null if the default serializer was used.

### dbos.streams
This table stores workflow streams.
Each entry represents a different message in a stream.

**Columns:**
- **workflow_uuid**: The ID of the workflow that wrote this stream message.
- **key**: The serialized key of the stream.
- **value**: The serialized value of the message.
- **offset**: The offset of the message in the stream (the first message written has offset 0, the second offset 1, and so on).
- **function_id**: The monotonically increasing step ID responsible for emitting this stream.
- **serialization**: The name of the serialization format used for the stream value. Null if the default serializer was used.

### dbos.application_versions
This table stores registered application versions.
Each time DBOS launches, it records the current application version.
The latest version is determined by the highest timestamp.

**Columns:**
- **version_id**: A unique ID for this version.
- **version_name**: The unique name of this version.
- **version_timestamp**: The epoch timestamp (in milliseconds) of this version. Used to determine the latest version.
- **created_at**: The epoch timestamp (in milliseconds) when this version was first registered.

### dbos.workflow_schedules
This table stores scheduled workflow definitions.
Each entry represents a different scheduled workflow.

**Columns:**
- **schedule_id**: The unique identifier of the schedule.
- **schedule_name**: The human-readable name of the schedule. Must be unique.
- **workflow_name**: The name of the workflow function to execute on schedule.
- **workflow_class_name**: The class name of the workflow function, if it is a class method.
- **schedule**: The cron expression or schedule definition.
- **status**: The status of the schedule. One of `ACTIVE` or `PAUSED`. Defaults to `ACTIVE`.
- **context**: The serialized schedule context.
- **last_fired_at**: The timestamp of when the schedule last fired.
- **automatic_backfill**: Whether the schedule should automatically backfill missed executions on startup.
- **cron_timezone**: The IANA timezone name in which the cron expression is evaluated.
