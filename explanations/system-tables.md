---
sidebar_position: 10
title: DBOS System Tables
description: DBOS system tables reference
---

## System Tables
DBOS Transact records application execution history in several system tables.
Most of these tables are in the system database, whose name is your application name suffixed with `_dbos_sys`.
For example, if your application is named `dbos_app_starter`, your system database is named `dbos_app_starter_dbos_sys`.
One exception is the `dbos.transaction_outputs` table which is stored in your application database.

### dbos.workflow_status

This table stores workflow execution information.
Each row represents a different workflow execution.

**Columns:**
- `workflow_uuid`: The unique identifier of the workflow execution.
- `status`: The status of the workflow execution. One of `PENDING`, `SUCCESS`, `ERROR`, `RETRIES_EXCEEDED`, or `CANCELLED`.
- `name`: The name (in Python, fully qualified name) of the workflow function.
- `authenticated_user`: The user who ran the workflow. Empty string if not set.
- `assumed_role`: The role used to run this workflow.  Empty string if authorization is not required.
- `authenticated_roles`: All roles the authenticated user has, if any.
- `request`: The serialized HTTP Request that triggered this workflow, if any.
- `inputs`: The serialized inputs of the workflow execution.
- `output`: The serialized workflow output, if any.
- `error`: The serialized error thrown by the workflow, if any.
- `created_at`: The epoch timestamp of when this workflow was created (enqueued or started).
- `updated_at`: The latest epoch timestamp when this workflow status was updated.
- `application_version`: The application version of this workflow code.
- `class_name`: The class name of the workflow function.
- `config_name`: The name of the configured instance of this workflow, if any.
- `recovery_attempts`: The number of attempts (so far) to recovery this workflow.
- `queue_name`: If this workflow is or was enqueued, the name of the queue.
- `executor_id`: The ID of the executor that ran this workflow.
- `workflow_timeout_ms`: The timeout of the workflow, if specified.
- `workflow_deadline_epoch_ms`: The deadline at which the workflow times out, if the workflow has a timeout. Derived when the workflow starts by adding the timeout to the workflow start time (which may be different than the creation time for enqueued workflows).
- `started_at_epoch_ms`: If this workflow was enqueued, the time at which it was dequeued and began excution.
- `deduplication_id`: The deduplication key for this workflow, if any.
- `priority`: The priority of this workflow on its queue, if enqueued. Defaults to 0 if not specified. Lower priorities execute first.

### dbos.operation_outputs
This table stores the outputs of workflow steps.
Each row represents a different workflow step execution.
Executions of DBOS methods like `DBOS.sleep` and `DBOS.send` are also recorded here as steps, as is enqueueing or starting a child workflow.

**Columns:**
- `workflow_uuid`: The unique identifier of the workflow execution this function belongs to.
- `function_id`: The monotonically increasing ID of the step (starts from 0) within the workflow, based on the order in which steps execute.
- `function_name`: The name of the step.
- `output`: The serialized transaction output, if any.
- `error`: The serialized error thrown by the transaction, if any.
- `child_workflow_id`: If the step starts a new child workflow, its ID.

### dbos.notifications
This table stores workflow messages/notifications.
Each entry represents a different message.

**Columns:**
- `destination_uuid`: The ID of the workflow to which the message is sent.
- `topic`: The topic to which the message is sent.
- `message`: The serialized contents of the message.
- `created_at_epoch_ms`: The epoch timestamp when this message was created.
- `message_uuid`: The unique ID of the message.

### dbos.workflow_events
This table stores workflow events.
Each entry represents a different event.

**Columns:**
- `workflow_uuid`: The ID of the workflow that published this event.
- `key`: The serialized key of the event.
- `value`: The serialized value of the event.

### dbos.transaction_outputs
This table stores the outputs of transaction functions.
Each row represents a different transaction function execution.

**Columns:**
- `workflow_uuid`: The unique identifier of the workflow execution this function belongs to.
- `function_id`: The monotonically increasing ID of the function (starts from 0) within the workflow, based on the start order.
- `output`: The serialized transaction output, if any.
- `error`: The serialized error thrown by the transaction, if any.
- `txn_id`: The transaction ID of this function, if any. This is empty for read-only transactions.
- `created_at`: The timestamp of when this function started.
- `txn_snapshot`: The [Postgres snapshot](https://www.postgresql.org/docs/current/functions-info.html#FUNCTIONS-INFO-SNAPSHOT) of this transaction.