# Workflow Archiving

> :::info
> Workflow archiving is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature, available in Python and TypeScript.
> :::

Workflow archiving lets you export a permanent copy of your workflow history to an archival format and data store, in particular [Parquet](https://parquet.apache.org/) files in object storage such as [S3](https://aws.amazon.com/s3/).
Archived workflows are queryable, can be viewed through the [DBOS Console](https://console.dbos.dev), and can be re-imported back into your system database.

## Setting Up Workflow Archiving

Install DBOS Transact Enterprise, [DuckDB](https://duckdb.org/), and [hyparquet-writer](https://github.com/hyparam/hyparquet-writer).
For an archive in S3 or Google Cloud Storage, also install the AWS SDK:

```shell
npm install @dbos-inc/dbos-enterprise @duckdb/node-api hyparquet-writer
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

Then, set `workflowArchive` in your DBOS configuration to a [`ParquetArchive`](#parquetarchive):

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { ParquetArchive } from "@dbos-inc/dbos-enterprise";

DBOS.setConfig({
  name: "dbos-app",
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  conductorKey: process.env.DBOS_CONDUCTOR_KEY,
  workflowArchive: new ParquetArchive("s3://my-bucket/dbos-archive"),
});
await DBOS.launch();
```

You must configure the archive in every process of your application.
If some processes should mark their workflows for archiving but not write or read the archive themselves, construct their `ParquetArchive` with `activeArchiver: false`.
These processes don't need DuckDB, hyparquet-writer, or the AWS SDK installed.
At least one process of the application must be an active archiver.

### Storage Locations

You configure `ParquetArchive` with a URI, which defines where your archive lives:

- **Amazon S3**: `s3://bucket/prefix`. The archiver writes with the AWS SDK's default credential chain, in the bucket's own region, and reads use DuckDB's credential chain. To use other credentials, pass an `s3Client` for writes and a `duckdbSecret` for reads.
- **Google Cloud Storage**: `gs://bucket/prefix`, through its S3-compatible API. Writes and reads use an [HMAC key](https://cloud.google.com/storage/docs/authentication/hmackeys) for a service account: `duckdbSecret: { KEY_ID: ..., SECRET: ... }`. To write with other credentials, pass an `s3Client`.
- **Local directory**: a path such as `/var/lib/dbos-archive`, for development and testing.

Azure Blob Storage isn't supported in TypeScript yet.

## How Archiving Works

When a workflow reaches a terminal status (`SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`), DBOS marks it for archiving.
A background archiver copies marked workflows to the archive, including their inputs and outputs, steps, events, messages, and streams, then clears their marks.
One process of each application archives at a time, and the others take over if it stops.

The archiver collects completed workflows and writes them out every 10 minutes, every 100,000 workflows, or when a file reaches 128 MB, whichever comes first.
You can change these limits with `maxFlushIntervalMs`, `maxFlushWorkflows`, and `targetFileBytes`.
If a process crashes before writing, its workflows stay marked and are archived again later, so a workflow is never lost but may occasionally be archived twice; reads ignore the duplicate.

Each archived copy of a workflow is a **snapshot**, identified by the workflow's ID and its `completedAt` time.
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
List archived workflows with [`listWorkflows`](#listworkflows), which takes the same filters as [`DBOS.listWorkflows`](../reference/methods.md#dboslistworkflows), then read a snapshot's details by its workflow ID and `completedAt`:

```typescript
const archive = new ParquetArchive("s3://my-bucket/dbos-archive");

const failed = await archive.listWorkflows({
  status: "ERROR",
  completedAfter: "2026-11-01T00:00:00Z",
  applicationName: "dbos-app",
  limit: 20,
});
for (const workflow of failed) {
  const steps = await archive.listWorkflowSteps(workflow.workflowID, workflow.completedAt!);
  const events = await archive.getEvents(workflow.workflowID, workflow.completedAt!);
}
```

Archived workflows are listed newest first, a page at a time, so `limit` is required.
Listing reads as few files as it can, but some filters, such as a lookup by workflow ID, may have to read many: give them a narrow `completedAfter` and `completedBefore`.
A listing that runs longer than its timeout, 30 seconds by default, throws `ArchiveQueryTimeoutError`.

## Importing an Archived Workflow

To bring an archived workflow back into the system database, call [`DBOS.importArchivedWorkflow`](#dbosimportarchivedworkflow) with its workflow ID and `completedAt`:

```typescript
const handle = await DBOS.importArchivedWorkflow(workflow.workflowID, workflow.completedAt!);
```

## Deploying Workflow Archiving

### Node.js Versions

Workflow archiving requires Node.js 20.19 or later, or 22.12 or later on Node.js 22.
On Node.js 22.15 and later, archive files are compressed with zstd; on earlier versions, with snappy.
Both are read by every Parquet reader.

### DuckDB Extensions

Reads use DuckDB, which needs extensions for object storage: `httpfs` and `aws` for S3, and `httpfs` for GCS.
By default, DuckDB downloads them on first use.
If your application can't download them at runtime, install them when you build its image:

```shell
npx dbos-archive-install-extensions --uri s3://my-bucket/dbos-archive
```

Then turn downloads off with `allowExtensionDownload`:

```typescript
new ParquetArchive("s3://my-bucket/dbos-archive", { allowExtensionDownload: false });
```

Pass `--dir` to install them somewhere other than DuckDB's default directory, and set `extensionDirectory` to the same directory.
Local archives need no extensions.

### Concurrent Reads

Each archive read holds one of Node.js's [libuv thread pool](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop#what-code-runs-on-the-worker-pool) threads while it runs, and the pool has four threads by default.
If your application serves several archive reads at once, for example from the DBOS Console, raise the pool size when starting it so reads don't delay file system and DNS work:

```shell
UV_THREADPOOL_SIZE=16 node dist/main.js
```

### Bundlers

If you bundle your application, mark `@duckdb/node-api` as external, because its native bindings can't be bundled.
For example, with webpack:

```javascript
module.exports = {
  // ...
  externals: { "@duckdb/node-api": "commonjs @duckdb/node-api" },
};
```

## Archive Layout

The archive's layout is a stable format, shared by every language, so other tools can query it directly and Python and TypeScript applications can read each other's archives.
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
- **File names**: `part-<first>-<last>-<tag>.parquet`, where `<first>` and `<last>` are the earliest and latest `completedAt` in the file, as 13-digit epoch milliseconds, and `<tag>` is 8 hexadecimal characters. Every dataset's file from one write has the same name, so a workflow's steps, events, messages, and streams are in the files with the same name as its workflow file.

Times are stored as `TIMESTAMP` columns with microsecond precision in UTC.
Inputs, outputs, errors, and other values are stored as text, encoded with the serializer named in their row's `serialization` column.
To read them from other tools or languages, use [portable serialization](../reference/methods.md#serialization-strategy).

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

## Reference

### ParquetArchive

```typescript
new ParquetArchive(uri: string, options?: ParquetArchiveOptions)
```

```typescript
interface ParquetArchiveOptions {
  s3Client?: S3Client;
  duckdbSecret?: Record<string, string | number | boolean>;
  duckdbConfig?: Record<string, string | number | boolean>;
  archiveID?: string;
  targetFileBytes?: number;
  maxFlushIntervalMs?: number;
  maxFlushWorkflows?: number;
  serializer?: DBOSSerializer;
  allowExtensionDownload?: boolean;
  extensionDirectory?: string;
  queryTimeoutMs?: number;
  activeArchiver?: boolean;
}
```

A workflow archive in Parquet files.
Pass one as [`workflowArchive`](../reference/configuration.md#dbos-transact-enterprise-settings) to archive workflows as they complete, or construct one anywhere to read an archive.
Import it from `@dbos-inc/dbos-enterprise`.
An active archive loads DuckDB, hyparquet-writer, and, for S3 and GCS, the AWS SDK when it's constructed, and throws if one isn't installed.

**Parameters:**
- **uri**: Where the archive lives: `s3://bucket/prefix`, `gs://bucket/prefix`, or a local path.
- **options**:
  - **s3Client**: The S3 client the archiver writes an S3 or GCS archive through, such as `new S3Client({ region: "us-west-2" })`. Defaults to the default credential chain in the bucket's region for S3, and for GCS to its S3-compatible API with the HMAC key in `duckdbSecret`.
  - **duckdbSecret**: The parameters of the [DuckDB secret](https://duckdb.org/docs/stable/configuration/secrets_manager) reads use, such as `{ PROVIDER: "credential_chain", REGION: "us-west-2" }`. `TYPE` and `SCOPE` come from the URI. Defaults to the credential chain for S3. GCS needs an HMAC key: `{ KEY_ID, SECRET }`.
  - **duckdbConfig**: DuckDB configuration for reads, applied over `{ threads: 16, memory_limit: "512MB" }`.
  - **archiveID**: A stable name for this archive. Defaults to the URI.
  - **targetFileBytes**: The size, in bytes, at which the archiver closes a file and starts the next. Defaults to 128 MiB.
  - **maxFlushIntervalMs**: The longest the archiver holds completed workflows before writing them out, in milliseconds. Defaults to 10 minutes.
  - **maxFlushWorkflows**: The most completed workflows the archiver holds before writing them out. Defaults to 100,000.
  - **serializer**: The serializer reads decode inputs, outputs, and step results with. Defaults to your application's.
  - **allowExtensionDownload**: Whether reads may download the [DuckDB extensions](#duckdb-extensions) they need. Defaults to true, unless the `DBOS_ARCHIVE_EXTENSION_DOWNLOAD` environment variable is `0`, `false`, or `no`.
  - **extensionDirectory**: Where DuckDB installs and loads extensions. Defaults to the `DBOS_ARCHIVE_EXTENSION_DIRECTORY` environment variable, else DuckDB's default.
  - **queryTimeoutMs**: The longest a listing may run, in milliseconds. Zero or less removes the limit. Defaults to your application's [`observabilityQueryTimeoutMs`](../reference/configuration.md), else 30 seconds.
  - **activeArchiver**: Whether this process writes and reads the archive. When `false`, the process still marks its completed workflows for archiving, and its retention keeps them until they are archived, but it doesn't write or read the archive and needs no storage credentials or optional packages. Defaults to `true`.

### listWorkflows

```typescript
archive.listWorkflows(input: ArchiveListWorkflowsInput): Promise<WorkflowStatus[]>
```

List a page of archived workflows, newest created first.
`ArchiveListWorkflowsInput` takes the filters of [`DBOS.listWorkflows`](../reference/methods.md#dboslistworkflows), and they work the same way, except:

- `limit` is required.
- Each snapshot is filtered on its own, and of a workflow's matching snapshots only the latest is returned.
- `applicationName` defaults to every application whose workflows are in the archive, plus unclaimed ones.
- `attributes` match by DuckDB's [`json_contains`](https://duckdb.org/docs/stable/data/json/json_functions).
- `sortDesc: false` isn't supported.

Give lookups by ID or parent, and other rare filters, a narrow `completedAfter` and `completedBefore`, or the listing may read every file in the archive.

**Throws:**
- `ArchiveQueryTimeoutError`: If the listing runs longer than `queryTimeoutMs`.
- `UnsupportedArchiveQueryError`: If the listing isn't supported, such as `sortDesc: false`.

### getWorkflowStatus

```typescript
archive.getWorkflowStatus(
  workflowID: string,
  completedAt: number,
  options?: { loadInput?: boolean; loadOutput?: boolean }
): Promise<WorkflowStatus | null>
```

Return the archived snapshot of a workflow that completed at `completedAt` (epoch milliseconds, as in `WorkflowStatus.completedAt`), or `null` if the archive has no such snapshot.
`loadInput` and `loadOutput` default to `true`.

### listWorkflowSteps

```typescript
archive.listWorkflowSteps(
  workflowID: string,
  completedAt: number,
  options?: { loadOutput?: boolean; limit?: number; offset?: number }
): Promise<StepInfo[]>
```

Return the steps of an archived snapshot, by function ID, as [`DBOS.listWorkflowSteps`](../reference/methods.md#dboslistworkflowsteps) returns them.

### getEvents

```typescript
archive.getEvents(workflowID: string, completedAt: number): Promise<Record<string, unknown>>
```

Return the [events](./workflow-communication.md#workflow-events) an archived snapshot had set, by key.

### getNotifications

```typescript
archive.getNotifications(workflowID: string, completedAt: number): Promise<ArchivedNotification[]>
```

```typescript
interface ArchivedNotification {
  topic: string | null;
  message: unknown;
  createdAtEpochMs: number;
  consumed: boolean;
}
```

Return the messages an archived snapshot had been sent, oldest first.

### readStream

```typescript
archive.readStream<T>(workflowID: string, completedAt: number, key: string): AsyncGenerator<T, void, unknown>
```

Yield the values an archived snapshot had written to the [stream](./workflow-communication.md#workflow-streaming) `key`, in order.

### DBOS.importArchivedWorkflow

```typescript
DBOS.importArchivedWorkflow<T = unknown>(
  workflowID: string,
  completedAt: number
): Promise<WorkflowHandle<Awaited<T>>>
```

Copy an archived snapshot back into the system database and return a handle to it.
The imported workflow's `completedAt` is the time of the import.
From workflow code, the import runs as a step.

**Throws:**
- `DBOSWorkflowArchiveNotConfiguredError`: If no `workflowArchive` is configured.
- `DBOSNonExistentWorkflowError`: If the archive has no such snapshot.
- `DBOSWorkflowIDInUseError`: If the system database already has a workflow with this ID.

### DBOSClient.importArchivedWorkflow

```typescript
client.importArchivedWorkflow<T = unknown>(
  workflowID: string,
  completedAt: number
): Promise<WorkflowHandle<Awaited<T>>>
```

Like [`DBOS.importArchivedWorkflow`](#dbosimportarchivedworkflow), from a [`DBOSClient`](../reference/client.md) created with `workflowArchive` set to your application's archive.

### Errors

Import these from `@dbos-inc/dbos-enterprise`, except `DBOSWorkflowArchiveNotConfiguredError`, which is in `@dbos-inc/dbos-sdk`'s `Error` namespace.

- `ArchiveQueryTimeoutError`: A listing ran longer than its timeout. Narrow it with `completedAfter` and `completedBefore`. A subclass of `DBOSQueryTimeoutError`.
- `UnsupportedArchiveQueryError`: A read the archive doesn't support, such as an oldest-first listing.
- `ArchiveInactiveError`: A read of an archive constructed with `activeArchiver: false`. A subclass of `UnsupportedArchiveQueryError`.
- `ArchiveExtensionMissingError`: A DuckDB extension the archive needs isn't installed, and downloading extensions is turned off.
- `DBOSWorkflowArchiveNotConfiguredError`: An import with no `workflowArchive` configured.
