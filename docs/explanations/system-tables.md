---
sidebar_position: 10
title: DBOS System Tables
description: DBOS system tables reference
---

## System Tables
DBOS records application execution history in several system tables.
These tables are located in your system database, whose location you configure when you launch your application.

### dbos.workflow_status

This table stores workflow execution information.
Each row represents a different workflow execution.

**Columns:**
- **workflow_uuid**: The unique identifier of the workflow execution.
- **status**: The status of the workflow execution. One of `PENDING`, `SUCCESS`, `ERROR`, `MAX_RECOVERY_ATTEMPTS_EXCEEDED`, `ENQUEUED`, or `CANCELLED`.
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
- **parent_workflow_id**: The ID of the parent workflow, if this workflow was started as a child of another workflow.
- **owner_xid**: Internal transaction ID used to prevent duplicate workflow starts.
- **application_id**: Internal field used only in DBOS Cloud.

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

### dbos.notifications
This table stores workflow messages/notifications.
Each entry represents a different message.

**Columns:**
- **destination_uuid**: The ID of the workflow to which the message is sent.
- **topic**: The topic to which the message is sent.
- **message**: The serialized contents of the message.
- **created_at_epoch_ms**: The epoch timestamp when this message was created.
- **message_uuid**: The unique ID of the message.

### dbos.workflow_events
This table stores workflow events.
Each entry represents a different event.

**Columns:**
- **workflow_uuid**: The ID of the workflow that published this event.
- **key**: The serialized key of the event.
- **value**: The serialized value of the event.

### dbos.workflow_events_history
This table stores historic changes to workflow events over time.
Each entry represents a distinct value of a workflow event during the workflow lifetime.

**Columns:**
- **workflow_uuid**: The ID of the workflow that published this event.
- **function_id**: The monotonically increasing ID of the step that set this value.
- **key**: The serialized key of the event.
- **value**: The serialized value of the event.

### dbos.streams
This table stores workflow streams.
Each entry represents a different message in a stream.

**Columns:**
- **workflow_uuid**: The ID of the workflow that wrote this stream message.
- **key**: The serialized key of the stream.
- **value**: The serialized value of the message.
- **offset**: The offset of the message in the stream (the first message written has offset 0, the second offset 1, and so on).
- **function_id**: The monotonically increasing step ID responsible for emitting this stream.

### dbos.versions
This table stores registered application versions.
Each time DBOS launches, it records the current application version.
The latest version is determined by the highest timestamp.

**Columns:**
- **version_id**: A unique ID for this version.
- **version_name**: The unique name of this version.
- **version_timestamp**: The epoch timestamp (in milliseconds) of this version.

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
