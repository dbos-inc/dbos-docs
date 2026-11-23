---
sidebar_position: 138
title: Workflow Archiving
toc_max_heading_level: 3
---

:::info
Workflow archiving is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature, available in Python and TypeScript.
:::

Workflow archiving lets you export a permanent copy of your workflow history to an archival format and data store, in particular [Parquet](https://parquet.apache.org/) files in object storage such as [S3](https://aws.amazon.com/s3/).
Archived workflows are queryable, can be viewed through the [DBOS Console](https://console.dbos.dev), and can be re-imported back into your system database.

## Setting Up Workflow Archiving

Install DBOS Transact Enterprise with its archive extra, which adds [pyarrow](https://arrow.apache.org/docs/python/) and [DuckDB](https://duckdb.org/):

```shell
pip install "dbos[enterprise]" "dbos-enterprise[archive]"
```

Then, set `workflow_archive` in your DBOS configuration to a [`ParquetArchive`](#parquetarchive):

```python
from dbos import DBOS, DBOSConfig
from dbos_enterprise.archive import ParquetArchive

config: DBOSConfig = {
    "name": "dbos-app",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "conductor_key": os.environ.get("DBOS_CONDUCTOR_KEY"),
    "workflow_archive": ParquetArchive("s3://my-bucket/dbos-archive"),
}
DBOS(config=config)
```

You must configure the archive in every process of your application.
If some processes should mark their workflows for archiving but not write or read the archive themselves, construct their `ParquetArchive` with `active_archiver=False`.
At least one process of the application must be an active archiver.

### Storage Locations

You configure `ParquetArchive` with a URI, which defines where your archive lives:

- **Amazon S3**: `s3://bucket/prefix`. The archiver writes with pyarrow's default S3 credentials, and reads use DuckDB's credential chain. To use other credentials, pass a `filesystem` such as `pyarrow.fs.S3FileSystem(region="us-west-2")` for writes and a `duckdb_secret` for reads.
- **Google Cloud Storage**: `gs://bucket/prefix`. The archiver writes with your application default credentials. Reads need an [HMAC key](https://cloud.google.com/storage/docs/authentication/hmackeys) for a service account: `duckdb_secret={"KEY_ID": ..., "SECRET": ...}`.
- **Azure Blob Storage**: `abfs://container@account.dfs.core.windows.net/prefix`. Writes use `pyarrow.fs.AzureFileSystem` for the account in the URI, or the `filesystem` you pass. Reads use DuckDB's credential chain for that account, or the `duckdb_secret` you pass.
- **Local directory**: a path such as `/var/lib/dbos-archive`, for development and testing.

## How Archiving Works

When a workflow reaches a terminal status (`SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`), DBOS marks it for archiving.
A background archiver copies marked workflows to the archive, including their inputs and outputs, steps, events, messages, and streams, then clears their marks.
One process of each application archives at a time, and the others take over if it stops.

The archiver collects completed workflows and writes them out every 10 minutes, every 100,000 workflows, or when a file reaches 128 MB, whichever comes first.
You can change these limits with `max_flush_interval`, `max_flush_workflows`, and `target_file_bytes`.
If a process crashes before writing, its workflows stay marked and are archived again later, so a workflow is never lost but may occasionally be archived twice; reads ignore the duplicate.

Each archived copy of a workflow is a **snapshot**, identified by the workflow's ID and its `completed_at` time.
If you [resume](./workflow-management.md) a workflow that was already archived, its next completion is archived as a new snapshot.

### Archiving and Retention

With archiving configured, a [retention policy](../../conductor/retention.md) deletes only workflows that have been archived, so no workflow history is lost.
A workflow waiting to be archived is kept until the archiver has copied it.

:::warning
Retention keeps unarchived workflows only when it runs in a process configured with your archive.
Configure the archive in every process of your application.
If other applications [share your system database](../../explanations/sharing-a-system-database.md), retention they run can delete your workflows before they are archived unless those other applications are configured with an archive too.
:::


## Reading Archived Workflows

You can query your application's archived workflows from the [DBOS Console](https://console.dbos.dev).
Conductor sends these queries to your application's active archivers.

From code, construct a `ParquetArchive` with the same URI in any process and read from it.
List archived workflows with [`list_workflows`](#list_workflows), which takes the same filters as [`DBOS.list_workflows`](../reference/contexts.md#list_workflows), then read a snapshot's details by its workflow ID and `completed_at`:

```python
archive = ParquetArchive("s3://my-bucket/dbos-archive")

failed = archive.list_workflows(
    status="ERROR",
    completed_after="2026-11-01T00:00:00Z",
    application_name="dbos-app",
    limit=20,
)
for workflow in failed:
    steps = archive.list_workflow_steps(workflow.workflow_id, workflow.completed_at)
    events = archive.get_events(workflow.workflow_id, workflow.completed_at)
```

Archived workflows are listed newest first, a page at a time, so `limit` is required.
Listing reads as few files as it can, but some filters, such as a lookup by workflow ID, may have to read many: give them a narrow `completed_after` and `completed_before`.
A listing that runs longer than its timeout, 30 seconds by default, raises `ArchiveQueryTimeoutError`.

## Importing an Archived Workflow

To bring an archived workflow back into the system database, call [`DBOS.import_archived_workflow`](#dbosimport_archived_workflow) with its workflow ID and `completed_at`:

```python
handle = DBOS.import_archived_workflow(workflow.workflow_id, workflow.completed_at)
```

## Deploying Workflow Archiving

### DuckDB Extensions

Reads use DuckDB, which needs extensions for object storage: `httpfs` and `aws` for S3, `httpfs` for GCS, and `azure` for Azure.
By default, DuckDB downloads them on first use.
If your application can't download them at runtime, install them when you build its image:

```shell
python -m dbos_enterprise.archive.install_extensions --uri s3://my-bucket/dbos-archive
```

Then turn downloads off with `allow_extension_download`:

```python
ParquetArchive("s3://my-bucket/dbos-archive", allow_extension_download=False)
```

Pass `--dir` to install them somewhere other than DuckDB's default directory, and set `extension_directory` to the same directory.
Local archives need no extensions.

## Archive Layout

The archive's layout is a stable format, so other tools can query it directly.
New versions of DBOS only add columns, never renaming, retyping, or removing them.

An archive holds a `_layout.json` file and one folder per dataset:

```
<archive root>/
  _layout.json
  workflows/completed_date=2026-11-23/part-1795392000123-1795392599877-3fa2c0de.parquet
  steps/completed_date=2026-11-23/part-1795392000123-1795392599877-3fa2c0de.parquet
  events/...
  events_history/...
  notifications/...
  streams/...
```

- **`_layout.json`** records the archive's format version, currently `{"format_version": 1}`. The version changes only if a change can't be made by adding columns. The archiver refuses to write to an archive whose version is newer than it supports.
- **Partitions**: each dataset is partitioned by `completed_date`, the UTC day of the workflow's completion, as a Hive-style `completed_date=YYYY-MM-DD` folder.
- **File names**: `part-<first>-<last>-<tag>.parquet`, where `<first>` and `<last>` are the earliest and latest `completed_at` in the file, as 13-digit epoch milliseconds, and `<tag>` is 8 hexadecimal characters. Every dataset's file from one write has the same name, so a workflow's steps, events, messages, and streams are in the files with the same name as its workflow file.

Times are stored as `TIMESTAMP` columns with microsecond precision in UTC.
Inputs, outputs, errors, and other values are stored as text, encoded with the serializer named in their row's `serialization` column.
To read them from other tools or languages, use [portable serialization](../reference/contexts.md#serialization-strategy).

### Datasets

Each workflow snapshot is one row of `workflows`, keyed by `workflow_uuid` and `completed_at`.
Rows of the other datasets belong to a snapshot through `workflow_uuid` and `snapshot_completed_at`.

| Dataset | Columns |
| --- | --- |
| `workflows` | `workflow_uuid`, `completed_at`, `status`, `name`, `class_name`, `config_name`, `authenticated_user`, `assumed_role`, `authenticated_roles` (JSON list), `inputs`, `output`, `error`, `serialization`, `executor_id`, `created_at`, `updated_at`, `application_version`, `application_id`, `application_name`, `recovery_attempts`, `queue_name`, `queue_partition_key`, `priority`, `deduplication_id`, `workflow_timeout_ms`, `workflow_deadline_epoch_ms`, `started_at_epoch_ms`, `delay_until_epoch_ms`, `forked_from`, `was_forked_from`, `parent_workflow_id`, `rate_limited`, `attributes` (JSON object), `schedule_name`, `debounce_deadline_epoch_ms`, `is_debounced`, `archived_at`, `archive_format_version` |
| `steps` | `workflow_uuid`, `snapshot_completed_at`, `function_id`, `function_name`, `output`, `error`, `serialization`, `child_workflow_id`, `started_at_epoch_ms`, `completed_at_epoch_ms`, `application_name` |
| `events` | `workflow_uuid`, `snapshot_completed_at`, `key`, `value`, `serialization` |
| `events_history` | `workflow_uuid`, `snapshot_completed_at`, `key`, `function_id`, `value`, `serialization` |
| `notifications` | `workflow_uuid`, `snapshot_completed_at`, `created_at_epoch_ms`, `message_uuid`, `topic`, `message`, `serialization`, `consumed`, `consumed_by_function_id` |
| `streams` | `workflow_uuid`, `snapshot_completed_at`, `key`, `offset`, `value`, `serialization`, `function_id` |

The columns mirror the [system tables](../../explanations/system-tables.md) they are copied from.
`archived_at` is when the snapshot was archived, and `archive_format_version` is the format version it was written with.

### Querying the Archive

Query one dataset at a time, with a glob that ends in `*.parquet` so it skips uploads in progress.
Because a snapshot may occasionally be archived twice, keep one row per snapshot: the one in the file with the greatest name.
To get each workflow's latest snapshot, keep its row with the greatest `completed_at`.
For example, with DuckDB:

```sql
SELECT * EXCLUDE (rank)
FROM (
  SELECT *, row_number() OVER (
    PARTITION BY workflow_uuid ORDER BY completed_at DESC, filename DESC
  ) AS rank
  FROM read_parquet(
    's3://my-bucket/dbos-archive/workflows/*/*.parquet',
    hive_partitioning = true,
    filename = true
  )
)
WHERE rank = 1;
```

Filter on `completed_date` to read only the partitions you need.

## Limitations

- Workflow archiving isn't supported on a [sharded system database](./sharding.md) or on CockroachDB.
- Archived workflows are listed newest first only, and can't be filtered by workflow ID prefix.
- DBOS doesn't delete or change archived files. Rows in the system database changed after a workflow is archived, such as its attributes, aren't archived again unless the workflow completes again.

## Reference

### ParquetArchive

```python
ParquetArchive(
    uri: str,
    *,
    filesystem: Optional[pyarrow.fs.FileSystem] = None,
    duckdb_secret: Optional[Mapping[str, Any]] = None,
    duckdb_config: Optional[Mapping[str, Any]] = None,
    archive_id: Optional[str] = None,
    target_file_bytes: int = 128 * 1024 * 1024,
    max_flush_interval: datetime.timedelta = datetime.timedelta(minutes=10),
    max_flush_workflows: int = 100_000,
    serializer: Optional[Serializer] = None,
    allow_extension_download: Optional[bool] = None,
    extension_directory: Optional[str] = None,
    query_timeout_sec: Optional[float] = None,
    active_archiver: bool = True,
)
```

A workflow archive in Parquet files.
Pass one as [`workflow_archive`](../reference/configuration.md#dbos-transact-enterprise-settings) to archive workflows as they complete, or construct one anywhere to read an archive.
Import it from `dbos_enterprise.archive`.

**Parameters:**
- `uri`: Where the archive lives: `s3://bucket/prefix`, `gs://bucket/prefix`, `abfs://container@account.dfs.core.windows.net/prefix`, or a local path.
- `filesystem`: The pyarrow filesystem the archiver writes through, such as `pyarrow.fs.S3FileSystem(region="us-west-2")`. Defaults to pyarrow's own filesystem for the URI, with its default credentials.
- `duckdb_secret`: The parameters of the [DuckDB secret](https://duckdb.org/docs/stable/configuration/secrets_manager) reads use, such as `{"PROVIDER": "credential_chain", "REGION": "us-west-2"}`. `TYPE` and `SCOPE` come from the URI. Defaults to the credential chain for S3, and for Azure when the URI names an account. GCS needs an HMAC key: `{"KEY_ID": ..., "SECRET": ...}`.
- `duckdb_config`: DuckDB configuration for reads, applied over `{"threads": 16, "memory_limit": "512MB"}`.
- `archive_id`: A stable name for this archive. Defaults to the URI.
- `target_file_bytes`: The size at which the archiver closes a file and starts the next. Defaults to 128 MiB.
- `max_flush_interval`: The longest the archiver holds completed workflows before writing them out. Defaults to 10 minutes.
- `max_flush_workflows`: The most completed workflows the archiver holds before writing them out. Defaults to 100,000.
- `serializer`: The serializer reads decode inputs, outputs, and step results with. Defaults to your application's.
- `allow_extension_download`: Whether reads may download the [DuckDB extensions](#duckdb-extensions) they need. Defaults to true, unless the `DBOS_ARCHIVE_EXTENSION_DOWNLOAD` environment variable is `0`, `false`, or `no`.
- `extension_directory`: Where DuckDB installs and loads extensions. Defaults to the `DBOS_ARCHIVE_EXTENSION_DIRECTORY` environment variable, else DuckDB's default.
- `query_timeout_sec`: The longest a listing may run, in seconds. Zero or less removes the limit. Defaults to your application's [`observability_query_timeout_sec`](../reference/configuration.md), else 30 seconds.
- `active_archiver`: Whether this process writes and reads the archive. When `False`, the process still marks its completed workflows for archiving, and its retention keeps them until they are archived, but it doesn't write or read the archive and needs no storage credentials. Defaults to `True`.

### list_workflows

```python
archive.list_workflows(
    *,
    limit: int,
    offset: Optional[int] = None,
    workflow_ids: Optional[List[str]] = None,
    status: Optional[str | List[str]] = None,
    name: Optional[str | List[str]] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    completed_after: Optional[str] = None,
    completed_before: Optional[str] = None,
    dequeued_after: Optional[str] = None,
    dequeued_before: Optional[str] = None,
    app_version: Optional[str | List[str]] = None,
    forked_from: Optional[str | List[str]] = None,
    parent_workflow_id: Optional[str | List[str]] = None,
    user: Optional[str | List[str]] = None,
    queue_name: Optional[str | List[str]] = None,
    executor_id: Optional[str | List[str]] = None,
    schedule_name: Optional[str | List[str]] = None,
    application_name: Optional[str | List[str]] = None,
    queues_only: bool = False,
    was_forked_from: Optional[bool] = None,
    is_fork: Optional[bool] = None,
    has_parent: Optional[bool] = None,
    attributes: Optional[Dict[str, Any]] = None,
    load_input: bool = True,
    load_output: bool = True,
) -> List[WorkflowStatus]
```

List a page of archived workflows, newest created first.
Filters work as in [`DBOS.list_workflows`](../reference/contexts.md#list_workflows), except:

- `limit` is required.
- Each snapshot is filtered on its own, and of a workflow's matching snapshots only the latest is returned.
- `application_name` defaults to every application whose workflows are in the archive, plus unclaimed ones.
- `attributes` match by DuckDB's [`json_contains`](https://duckdb.org/docs/stable/data/json/json_functions).
- `sort_desc=False` and `workflow_id_prefix` aren't supported.

Give lookups by ID or parent, and other rare filters, a narrow `completed_after` and `completed_before`, or the listing may read every file in the archive.

**Raises:**
- `ArchiveQueryTimeoutError`: If the listing runs longer than `query_timeout_sec`.
- `ValueError`: If the listing isn't supported, such as `sort_desc=False`.

### get_workflow_status

```python
archive.get_workflow_status(
    workflow_id: str,
    completed_at: int,
    *,
    load_input: bool = True,
    load_output: bool = True,
) -> Optional[WorkflowStatus]
```

Return the archived snapshot of a workflow that completed at `completed_at` (epoch milliseconds, as in `WorkflowStatus.completed_at`), or `None` if the archive has no such snapshot.

### list_workflow_steps

```python
archive.list_workflow_steps(
    workflow_id: str,
    completed_at: int,
    *,
    load_output: bool = True,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> List[StepInfo]
```

Return the steps of an archived snapshot, by function ID, as [`DBOS.list_workflow_steps`](../reference/contexts.md#list_workflow_steps) returns them.

### get_events

```python
archive.get_events(workflow_id: str, completed_at: int) -> Dict[str, Any]
```

Return the [events](./workflow-communication.md#workflow-events) an archived snapshot had set, by key.

### get_notifications

```python
archive.get_notifications(workflow_id: str, completed_at: int) -> List[NotificationInfo]
```

Return the messages an archived snapshot had been sent, oldest first.
Each is a dictionary with `topic`, `message`, `created_at_epoch_ms`, and `consumed`.

### read_stream

```python
archive.read_stream(workflow_id: str, completed_at: int, key: str) -> Generator[Any, Any, None]
```

Yield the values an archived snapshot had written to the [stream](./workflow-communication.md#workflow-streaming) `key`, in order.

### DBOS.import_archived_workflow

```python
DBOS.import_archived_workflow(workflow_id: str, completed_at: int) -> WorkflowHandle[Any]
```

Copy an archived snapshot back into the system database and return a handle to it.
The imported workflow's `completed_at` is the time of the import.
From workflow code, the import runs as a step.
`DBOS.import_archived_workflow_async` is its coroutine version.

**Raises:**
- `DBOSWorkflowArchiveNotConfiguredError`: If no `workflow_archive` is configured.
- `DBOSNonExistentWorkflowError`: If the archive has no such snapshot.
- `DBOSWorkflowIDInUseError`: If the system database already has a workflow with this ID.

### DBOSClient.import_archived_workflow

```python
client.import_archived_workflow(workflow_id: str, completed_at: int) -> WorkflowHandle[Any]
```

Like [`DBOS.import_archived_workflow`](#dbosimport_archived_workflow), from a [`DBOSClient`](../reference/client.md) created with `workflow_archive` set to your application's archive.
`client.import_archived_workflow_async` is its asynchronous version.

### Errors

Import these from `dbos_enterprise.archive`, except `DBOSWorkflowArchiveNotConfiguredError`, which is in `dbos`.

- `ArchiveQueryTimeoutError`: A listing ran longer than its timeout. Narrow it with `completed_after` and `completed_before`. A subclass of `DBOSQueryTimeoutError`.
- `ArchiveInactiveError`: A read of an archive constructed with `active_archiver=False`.
- `ArchiveExtensionMissingError`: A DuckDB extension the archive needs isn't installed, and downloading extensions is turned off.
- `DBOSWorkflowArchiveNotConfiguredError`: An import with no `workflow_archive` configured.
