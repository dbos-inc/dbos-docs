---
sidebar_position: 10
title: Provenance Database
description: DBOS provenance database reference
---

The provenance database is an append-only versioned replica of your application database maintained by DBOS Cloud, which is the key enabler of [Interactive Time Travel](../cloud-tutorials/interactive-timetravel.md) and [Time Travel Debugging](../cloud-tutorials/timetravel-debugging.md).

The provenance database can be accessed under your application database name with a `_dbos_prov` suffix. For example, if your application database name is `hello`, then your provenance database is `hello_dbos_prov`.

## Application Tables
The provenance database contains the history (within the time travel [data retention period](https://www.dbos.dev/pricing)) of each of your database tables, where you can view all versions of records in that table.

To enable time travel, DBOS Cloud extends each of your tables with four additional columns:
- `begin_xid`: The transaction ID that added the record/row. Each insert or update of the record in your application database creates a new version of the record in the provenance database. You can use this column to check which transaction created or updated this record.
- `end_xid`: The transaction ID that deleted the record/row, or superseded the record with a new version. Each delete or update of the record in your application database does not delete the old record in the provenance database, instead, DBOS updates the `end_xid` field of the latest record (with `end_xid` set to "infinity" `9223372036854775807`) to the transaction that deleted it. You can use this column to check which transaction deleted or updated this record.
- `begin_seq`: The insert/update/delete SQL statement sequence number within the transaction that added this record. This field is used by the Time Travel Debugger to replay transactions.
- `end_seq`: The insert/update/delete SQL statement sequence number within the transaction that deleted this record. This field is used by the Time Travel Debugger to replay transactions.

To make sure that you can access previous data, DBOS provenance tables are append-only, and each provenance table includes all previous columns of this table.
This means if you delete a column from a table, you are still able to view them in the provenance database.
DBOS Cloud periodically garbage collects and compacts provenance tables according to your [data retention period](https://www.dbos.dev/pricing).

For example, for a deployed ["Hello, Database" quickstart](../getting-started/quickstart) application, the `dbos_hello` table looks like this after we send several greetings to Mike:

```sql
hello=> select * from dbos_hello;
 name | greet_count
------+-------------
 Mike |           6
```

Then in the provenance database, the `dbos_hello` table is extended with four additional columns and records all versions of this record:
```sql
hello_dbos_prov=> select * from dbos_hello;
 name | greet_count | begin_xid | begin_seq |       end_xid       | end_seq
------+-------------+-----------+-----------+---------------------+---------
 Mike |           1 |     24818 |         1 |               24824 |       1
 Mike |           2 |     24824 |         1 |               24826 |       1
 Mike |           3 |     24826 |         1 |               24832 |       1
 Mike |           4 |     24832 |         1 |               24834 |       1
 Mike |           5 |     24834 |         1 |               24841 |       1
 Mike |           6 |     24841 |         1 | 9223372036854775807 |       0
```

You can see that transaction `begin_xid=24818` initially set Mike's `greet_count` to 1, and this record was updated by transaction `end_xid=24824` which updated `greet_count` from 1 to 2.
The latest version with `greet_count = 6` was created by transaction `24841`.

## DBOS System Tables
The provenance also stores a replica of the DBOS system tables under the `dbos` schema which record each function/workflow execution.

### `dbos.workflow_status`

This table stores the workflow execution information with the following columns:

- `workflow_uuid`: The unique identifier of the workflow execution.
- `status`: The status of the workflow execution. One of `PENDING`, `SUCCESS`, `ERROR`, or `RETRIES_EXCEEDED`.
- `name`: The function name of the workflow.
- `authenticated_user`: The user who ran the workflow. Empty string if not set.
- `assumed_role`: The role used to run this workflow.  Empty string if authorization is not required.
- `authenticated_roles`: All roles the authenticated user has, if any.
- `request`: The serialized [HTTP Request](./contexts#ctxtrequest) that triggered this workflow, if any.
- `output`: The serialized workflow output, if any.
- `error`: The serialized error thrown by the workflow, if any.
- `created_at`: The timestamp of when this workflow started.
- `updated_at`: The latest timestamp when this workflow status is updated.
- `application_version`: The application version of this workflow code.
- `class_name`: The class name of the workflow function.
- `config_name`: The name of the [configured instance](../tutorials/configured-instances.md) of this workflow, if any.
- `recovery_attempts`: The number of attempts (so far) to recovery this workflow.
- `application_id`: (Internal use) The application ID of this workflow code.
- `executor_id`: (Internal use) Executor ID that ran this workflow.


### `dbos.workflow_inputs`
This table stores the workflow inputs:

- `workflow_uuid`: The unique identifier of the workflow execution.
- `inputs`: The serialized inputs of the workflow execution.

### `dbos.transaction_outputs`
This table stores the outputs of transaction functions:

- `workflow_uuid`: The unique identifier of the workflow execution this function belongs to.
- `function_id`: The monotonically increasing ID of the function (starts from 0) within the workflow, based on the start order.
- `output`: The serialized transaction output, if any.
- `error`: The serialized error thrown by the transaction, if any.
- `txn_id`: The transaction ID of this function, if any. This is empty for read-only transactions.
- `created_at`: The timestamp of when this function starts.
- `txn_snapshot`: (Internal use) The transaction snapshot information for time travel debugging.

### `dbos.operation_outputs`
This table stores the outputs of communicator functions:

- `workflow_uuid`: The unique identifier of the workflow execution this function belongs to.
- `function_id`: The monotonically increasing ID of the function (starts from 0) within the workflow, based on the start order.
- `output`: The serialized transaction output, if any.
- `error`: The serialized error thrown by the transaction, if any.