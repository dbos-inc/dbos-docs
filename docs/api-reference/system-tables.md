---
sidebar_position: 10
title: DBOS System Tables
description: DBOS system tables reference
---

DBOS Transact and Cloud maintain several system tables to track application execution history and data changes.

## System Tables
DBOS Transact records application execution history in several system tables.
Most of these tables are in the system database, whose name is your application database name suffixed with `_dbos_sys`.
For example, if your application database is named `hello`, your system database is named `hello_dbos_sys`.
One exception is the `dbos.transaction_outputs` table which is stored in your application database.

### `dbos.workflow_status`

This table stores workflow execution information. It has the following columns:

- `workflow_uuid`: The unique identifier of the workflow execution.
- `status`: The status of the workflow execution. One of `PENDING`, `SUCCESS`, `ERROR`, `RETRIES_EXCEEDED`, or `CANCELLED`.
- `name`: The function name of the workflow.
- `authenticated_user`: The user who ran the workflow. Empty string if not set.
- `assumed_role`: The role used to run this workflow.  Empty string if authorization is not required.
- `authenticated_roles`: All roles the authenticated user has, if any.
- `request`: The serialized [HTTP Request](./contexts#ctxtrequest) that triggered this workflow, if any.
- `output`: The serialized workflow output, if any.
- `error`: The serialized error thrown by the workflow, if any.
- `created_at`: The timestamp of when this workflow started.
- `updated_at`: The latest timestamp when this workflow status was updated.
- `application_version`: The application version of this workflow code.
- `class_name`: The class name of the workflow function.
- `config_name`: The name of the [configured instance](../tutorials/configured-instances.md) of this workflow, if any.
- `recovery_attempts`: The number of attempts (so far) to recovery this workflow.
- `application_id`: (Internal use) The ID of the application that ran this workflow.
- `executor_id`: (Internal use) The ID of the executor that ran this workflow.


### `dbos.workflow_inputs`
This table stores workflow input information:

- `workflow_uuid`: The unique identifier of the workflow execution.
- `inputs`: The serialized inputs of the workflow execution.

### `dbos.transaction_outputs`
This table stores the outputs of transaction functions:

- `workflow_uuid`: The unique identifier of the workflow execution this function belongs to.
- `function_id`: The monotonically increasing ID of the function (starts from 0) within the workflow, based on the start order.
- `output`: The serialized transaction output, if any.
- `error`: The serialized error thrown by the transaction, if any.
- `txn_id`: The transaction ID of this function, if any. This is empty for read-only transactions.
- `created_at`: The timestamp of when this function started.
- `txn_snapshot`: The [Postgres snapshot](https://www.postgresql.org/docs/current/functions-info.html#FUNCTIONS-INFO-SNAPSHOT) of this transaction.

### `dbos.operation_outputs`
This table stores the outputs of communicator functions:

- `workflow_uuid`: The unique identifier of the workflow execution this function belongs to.
- `function_id`: The monotonically increasing ID of the function (starts from 0) within the workflow, based on the start order.
- `output`: The serialized transaction output, if any.
- `error`: The serialized error thrown by the transaction, if any.


## Provenance Tables

:::tip
The provenance database is only available for applications configured to enable time travel. To enable time travel for your application, please specify `--enable-timetravel` [during deploy](./cloud-cli#npx-dbos-cloud-app-deploy).
:::

DBOS Cloud maintains a provenance database for your application, which is an append-only versioned replica of your application database.
It is the key enabler of [Interactive Time Travel](../cloud-tutorials/interactive-timetravel.md) and [Time Travel Debugging](../cloud-tutorials/timetravel-debugging.md).
The provenance database name is your application database suffixed with `_dbos_prov`.
For example, if your application database is named `hello`, then your provenance database is named `hello_dbos_prov`.
The provenance database contains the history (within the time travel [data retention period](https://www.dbos.dev/pricing)) of each of your database tables.
It also stores a copy of the DBOS system tables (under the `dbos` schema), which record each function/workflow execution.

To enable time travel, the provenance database extends each application database table with four additional columns:
- `begin_xid`: The transaction ID (`txn_id` in the [`dbos.transaction_outputs`](#dbostransaction_outputs) table) that added the record/row. Each insert or update of the record in your application database creates a new version of the record in the provenance database. You can use this column to check which transaction created or updated this record.
- `end_xid`: The transaction ID (`txn_id` in the [`dbos.transaction_outputs`](#dbostransaction_outputs) table) that deleted the record/row, or superseded the record with a new version. Each delete or update of the record in your application database does not delete the old record in the provenance database, instead, DBOS updates the `end_xid` field of the latest record (with `end_xid` set to "infinity" `9223372036854775807`) to the transaction that deleted it. You can use this column to check which transaction deleted or updated this record.
- `begin_seq`: The insert/update/delete SQL statement sequence number within the transaction that added this record. The sequence number starts from 0 and increments by 1 for each insert/update/delete SQL statement. This field is used by the Time Travel Debugger to replay transactions.
You can use this column to check which SQL statement in your function created or updated this record.
- `end_seq`: The insert/update/delete SQL statement sequence number within the transaction that deleted this record. The sequence number starts from 0 and increments by 1 for each insert/update/delete SQL statement. This field is used by the Time Travel Debugger to replay transactions.
You can use this column to check which SQL statement in your function deleted or updated this record.

To make sure that you can access previous data, DBOS provenance tables are append-only, retaining all versions of old rows. Also, columns dropped from the application table are not dropped from the provenance table, so you are still able to view old values even if you drop a column from the source database.
DBOS Cloud periodically garbage collects and compacts provenance tables according to your [data retention period](https://www.dbos.dev/pricing).

## Example

As an example, we deployed a ["Hello, Database" quickstart](../getting-started/quickstart) application to DBOS Cloud.
Its `dbos_hello` table looks like this after we send several greetings to Mike:

```
hello=> select * from dbos_hello;
 name | greet_count
------+-------------
 Mike |           6
```

In the provenance database, the `dbos_hello` table is extended with four additional columns and records all versions of this record:
```
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

You can see that transaction `24818` initially set Mike's `greet_count` to 1 (`begin_xid=24818`), and this record was updated by transaction `24824` which updated `greet_count` from 1 (`end_xid=24824`) to 2 (`begin_xid=24824`).
The latest version with `greet_count = 6` was created by transaction `24841`.

The [`dbos.transaction_outputs`](#dbostransaction_outputs) table records the detailed execution of these transactions:
```
hello_dbos_prov=> select txn_id, workflow_uuid, function_id, output, created_at from dbos.transaction_outputs;
 txn_id |            workflow_uuid             | function_id |                     output                      |  created_at
--------+--------------------------------------+-------------+-------------------------------------------------+---------------
 24818  | 4a905c62-dcd3-407b-bcbe-62db39f3c426 |           0 | "Hello, Mike! You have been greeted 1 times.\n" | 1719529676452
 24824  | 636a2d09-0f0d-4239-a0c5-0e112946046e |           0 | "Hello, Mike! You have been greeted 2 times.\n" | 1719529677975
 24826  | ed7f37e2-ea8e-4c68-a6ab-9cb6625eb2ae |           0 | "Hello, Mike! You have been greeted 3 times.\n" | 1719529678388
 24832  | 53989c94-a661-4d64-8798-f5fd0ee69bfb |           0 | "Hello, Mike! You have been greeted 4 times.\n" | 1719529678862
 24834  | ff2df434-fe40-4256-ab05-47bf7b289c99 |           0 | "Hello, Mike! You have been greeted 5 times.\n" | 1719529679381
 24841  | f9bc12ca-d707-4e8e-b751-31e40e1e98fd |           0 | "Hello, Mike! You have been greeted 6 times.\n" | 1719529679860
```

The [`dbos.workflow_status`](#dbosworkflow_status) table records the detailed request info of each invocation. For example, we can query which IP address invoked each workflow:
```
hello_dbos_prov=> select workflow_uuid,
hello_dbos_prov->        SPLIT_PART(request::json->'headers'->>'x-forwarded-for', ',', 1) as src_ip
hello_dbos_prov-> from dbos.workflow_status;
            workflow_uuid             |     src_ip
--------------------------------------+----------------
 4a905c62-dcd3-407b-bcbe-62db39f3c426 | 208.74.183.158
 636a2d09-0f0d-4239-a0c5-0e112946046e | 208.74.183.158
 ed7f37e2-ea8e-4c68-a6ab-9cb6625eb2ae | 208.74.183.158
 53989c94-a661-4d64-8798-f5fd0ee69bfb | 208.74.183.158
 ff2df434-fe40-4256-ab05-47bf7b289c99 | 208.74.183.158
 f9bc12ca-d707-4e8e-b751-31e40e1e98fd | 208.74.183.158
```