---
sidebar_position: 60
title: Configuration
---

## Configuring DBOS

To configure DBOS, pass in a configuration with `DBOS.setConfig` before you call `DBOS.launch`.
For example:

```javascript
DBOS.setConfig({
  name: 'my-app',
  applicationVersion: '0.1.0',
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
});
await DBOS.launch();
```

A configuration object has the following fields.
All fields except `name` are optional.

```javascript
export interface DBOSConfig {
  name: string;
  applicationVersion?: string;
  executorID?: string;
  enablePatching?: boolean;

  systemDatabaseUrl?: string;
  systemDatabasePoolSize?: number;
  systemDatabasePollingConcurrency?: number;
  systemDatabaseSchemaName?: string;
  systemDatabasePool?: Pool;
  runMigrations?: boolean;
  observabilityQueryTimeoutMs?: number;
  useListenNotify?: boolean;
  notificationCoalesceMs?: number;

  tracingEnabled?: boolean;
  otelAttributeFormat?: 'legacy' | 'semconv';
  logLevel?: string;
  logger?: DLogger;
  addContextMetadata?: boolean;
  enableOTLP?: boolean;
  otlpLogsEndpoints?: string[];
  otlpTracesEndpoints?: string[];

  listenQueues?: string[];
  maxConcurrentQueueDispatches?: number;

  schedulerPollingIntervalMs?: number;

  serializer?: DBOSSerializer;
}
```

In [DBOS Cloud](../../production/dbos-cloud/deploying-to-cloud.md), DBOS takes your application's name, system database URL, and OTLP endpoints from environment variables supplied by DBOS Cloud (`DBOS_APP_NAME`, `DBOS_SYSTEM_DATABASE_URL`, `DBOS__OTLP_TRACES_ENDPOINT`, and `DBOS__OTLP_LOGS_ENDPOINT`), overriding `name` and `systemDatabaseUrl` and adding to `otlpTracesEndpoints` and `otlpLogsEndpoints`.
The application version and executor ID also come from DBOS Cloud (`DBOS__APPVERSION` and `DBOS__VMID`), so `applicationVersion`, `enablePatching`, and `executorID` are ignored there.

### Application Settings

- **name**: Your application's name.
Multiple applications (potentially in different languages) may [share a system database](../../explanations/sharing-a-system-database.md), in which case each must have a distinct name: the name identifies which application owns each workflow, queue, schedule, and application version, and applications only run their own workflows.
If you rename an application, transfer ownership of its data with [`npx dbos rename-application`](./cli.md#npx-dbos-rename-application).
- **applicationVersion**: The code version for this application and its workflows. Workflow versioning is documented [here](../tutorials/upgrading-workflows.md#versioning).
- **executorID**: A unique process ID used to identify the application instance in distributed environments. If using DBOS Conductor or Cloud, this is set automatically.
- **enablePatching**: Enable the [patching](../tutorials/upgrading-workflows.md#patching) strategy for safely upgrading workflow code. Required to use [`DBOS.patch`](./workflows-steps.md#patch) and [`DBOS.deprecatePatch`](./workflows-steps.md#deprecatepatch).

### Database Connection Settings

- **systemDatabaseUrl**: A connection string to a Postgres database in which [DBOS can store internal state](../../explanations/system-tables.md). The supported format is:
```
postgresql://[username]:[password]@[hostname]:[port]/[database name]
```

The default is:

```
postgresql://postgres:dbos@localhost:5432/[application name]_dbos_sys
```
If the Postgres database referenced by this connection string does not exist, DBOS will attempt to create it.
- **systemDatabasePoolSize**: The size of the connection pool used for the [DBOS system database](../../explanations/system-tables). Defaults to 10.
- **systemDatabasePollingConcurrency**: The maximum number of database-backed polling reads from wait operations (such as [`getResult`](./methods.md#handlegetresult), [`waitAll`](./methods.md#dboswaitall), [`waitFirst`](./methods.md#dboswaitfirst), [`recv`](./methods.md#dbosrecv), and [`getEvent`](./methods.md#dbosgetevent)) that may run concurrently against the system database pool. This prevents high-fan-out polling from checking out every connection in the pool and starving control-plane operations (such as enqueue/dequeue, status writes, recovery, and cancellation). Defaults to half the `systemDatabasePoolSize` (minimum 1). Set to a non-positive value to disable the limit.
- **systemDatabaseSchemaName**: Postgres schema name for DBOS system tables. Defaults to `dbos`.
- **systemDatabasePool**: A custom `node-postgres` connection pool to use to connect to your system database. If provided, DBOS will not create a connection pool but use this instead. The pool remains yours: its configuration is your responsibility (we recommend attaching an `error` handler to it so connection failures are handled), and `DBOS.shutdown` does not close it.
- **runMigrations**: Whether to create and migrate the system database on launch. Defaults to true.
Set to false for a process that must not alter the schema, such as one whose database role cannot run DDL, or a deployment that migrates out of band with [`npx dbos schema`](./cli.md#npx-dbos-schema).
Launch then verifies the schema instead of changing it: a system database that is missing, or behind the version this build of DBOS requires, fails launch with a `DBOSInitializationError`.
A system database ahead of the required version is accepted, so a process with migrations disabled can run alongside newer peers.
- **observabilityQueryTimeoutMs**: The statement timeout, in milliseconds, applied to observability queries (such as [listing workflows](./methods.md#dboslistworkflows), [queued workflows](./methods.md#dboslistqueuedworkflows), and [workflow steps](./methods.md#dboslistworkflowsteps)), so a slow query on a large system database does not hold resources indefinitely. A query that exceeds the timeout throws a `DBOSQueryTimeoutError`. Defaults to 30000 (30 seconds). Set to zero or a negative value to disable the timeout.
- **useListenNotify**: Whether to use Postgres `LISTEN/NOTIFY` to promptly wake operations waiting on messages, events, or streams (such as [`recv`](./methods.md#dbosrecv), [`getEvent`](./methods.md#dbosgetevent), and [`readStream`](./methods.md#dbosreadstream)). Defaults to true. Set to false if your database does not support `LISTEN/NOTIFY` (for example, [CockroachDB](../../integrations/cockroachdb.md)); DBOS then polls the database instead, which can increase the latency of these operations.
- **notificationCoalesceMs**: When `useListenNotify` is enabled, the interval, in milliseconds, over which DBOS batches the notifications for events and stream values this process writes before sending them. This bounds the extra latency before waiting readers are woken. Defaults to 10. Must be at least 1.

### Logging and Tracing Settings

- **tracingEnabled**: Enable DBOS trace generation. Use this with an external OTLP `TracerProvider`. Traces will be collected and exported by your existing provider. [Tutorial here](../tutorials/logging.md).
- **otelAttributeFormat**: Naming convention for DBOS-emitted span attributes. Defaults to `'legacy'`, which emits the original camelCase names (`operationUUID`, `executorID`, …) for backward compatibility. Set to `'semconv'` to emit OTel-style names under the `dbos.*` namespace (`dbos.operation.workflow_id`, `dbos.executor.id`, …), which follow the [OTel attribute naming spec](https://opentelemetry.io/docs/specs/semconv/general/attribute-naming/) and avoid colliding with attributes set by other instrumentation. The flag is process-wide; user-supplied attributes are passed through verbatim either way.
- **logLevel**: Configure the [DBOS logger](../tutorials/logging.md) severity. Defaults to `info`.
- **logger**: A [custom logger](../tutorials/logging.md#custom-logger) implementing the `DLogger` interface, to which DBOS directs all its internal logging, replacing the built-in console and OTLP log sinks. When set, `logLevel` does not filter calls to it (level routing is the logger's job), logs are not exported over OTLP even if `enableOTLP` is on (traces are unaffected), and DBOS never flushes or closes it (the caller owns its lifecycle).
- **addContextMetadata**: Whether to append the current operation's context (such as its workflow ID and operation name) to log messages emitted from workflows and steps. Defaults to false. Only affects the built-in console output, and only when `enableOTLP` is on.
- **enableOTLP**: Enable the built-in DBOS OpenTelemetry `TracerProvider`. Defaults to False (True in DBOS Cloud). Do not set if using an external OTLP `TracerProvider`.
- **otlpTracesEndpoints**: If using the built-in DBOS OpenTelemetry `TracerProvider`, a list of receivers to which to send traces.
- **otlpLogsEndpoints**: If using the built-in DBOS OpenTelemetry `TracerProvider`, a list of receivers to which to send logs.

### Queue Settings

- **listenQueues**: The names of the queues this process should listen to (dequeue and execute workflows from). Names that do not match any queue at launch are deferred — a queue registered later under that name will be picked up automatically.
- **maxConcurrentQueueDispatches**: The maximum number of queues this process may dequeue from concurrently. Defaults to 3. Must be a positive integer; set to 1 to dequeue from one queue at a time.
  A process dequeues from each of its queues in turn. Because dequeuing from a large queue (especially a [partitioned queue](../tutorials/queue-tutorial.md#partitioning-queues) with many active partitions) can take a while, allowing several queues to be dequeued from concurrently prevents a busy queue from delaying work on smaller ones. A single queue is never dequeued from twice concurrently in the same process.
  This setting does not affect [workflow concurrency](../tutorials/queue-tutorial.md#managing-concurrency), [rate limits](../tutorials/queue-tutorial.md#rate-limiting), or `systemDatabasePollingConcurrency`.

### Scheduler Settings

- **schedulerPollingIntervalMs**: How frequently (in milliseconds) the scheduler polls the database for schedule changes. Defaults to 30000 (30 seconds).

### Serialization Settings

- **serializer**: A custom serializer for the system database. See the [custom serialization section](#custom-serialization) for details.

## Custom Serialization

DBOS must serialize data such as workflow inputs and outputs and step outputs to store it in the system database.
By default, data is serialized with [SuperJSON](https://github.com/flightcontrolhq/superjson), a JSON-based format that preserves types such as `Date`, but you can optionally supply a custom serializer through DBOS configuration.
A custom serializer must match this interface:

```typescript
interface DBOSSerializer {
  stringify: (obj: unknown) => string | Promise<string>;
  parse: (text: string | null | undefined) => unknown | Promise<unknown>;
  name: () => string; // `name` is stored with the resulting string to ensure the correct deserializer is used.
}
```

Both `stringify` and `parse` may be synchronous or asynchronous.

For example, here is how to configure DBOS to use a Base64-encoded JSON serializer:

```javascript
import { DBOS, DBOSSerializer } from "@dbos-inc/dbos-sdk";

const base64Serializer: DBOSSerializer = {
  parse: (text) => {
    // Parsers must always return null when receiving null or undefined
    if (text === null || text === undefined) return null;
    return JSON.parse(Buffer.from(text, 'base64').toString());
  },
  stringify: (obj) => {
    // JSON.stringify doesn't handle undefined, so convert it to null instead
    if (obj === undefined) obj = null;
    return Buffer.from(JSON.stringify(obj)).toString('base64');
  },
  name: () => "simple_json",
};

const config = // ...
config.serializer = base64Serializer;
DBOS.setConfig(config);
await DBOS.launch();
```

## DBOS Configuration File

Some tools in the DBOS ecosystem, including [DBOS Cloud](../../production/dbos-cloud/deploying-to-cloud.md) and the [DBOS CLI](./cli.md), are configured by a `dbos-config.yaml` file.
Your application itself does not read this file; configure it with [`DBOS.setConfig`](#configuring-dbos).

Here is an example configuration file with default parameters:

```shell
name: my-app
language: node
system_database_url: ${DBOS_SYSTEM_DATABASE_URL}
runtimeConfig:
  start:
    - node dist/main.js
```

### Configuration File Fields

::::info
You can use environment variables for configuration values through the syntax `field: ${VALUE}`.
::::

Each `dbos-config.yaml` file has the following fields and sections:

- **name**: Your application's name.  Should match the `name` supplied to `DBOS.setConfig()`: DBOS Cloud uses it as the name of your deployed application, and the DBOS [CLI](cli.md) uses it to compute the default system database URL.
- **language**: The application language.  Must be set to `node` for TypeScript applications.
- **system_database_url**: The connection string to your DBOS system database.
This connection string is used by the DBOS [CLI](cli.md).
It has the same format as the `systemDatabaseUrl` you pass to `DBOS.setConfig()`.
- **runtimeConfig**:
  - **start**: (required only in DBOS Cloud) The command(s) with which to start your app. Called from [`npx dbos start`](./cli.md#npx-dbos-start), which is used to start your app in DBOS Cloud.
  - **setup**: (optional) Setup commands to run before your application is built in DBOS Cloud. Used only in DBOS Cloud. Documentation [here](../../production/dbos-cloud/application-management.md#customizing-microvm-setup).

### Configuration Schema File

There is a schema file available for the DBOS configuration file schema [in GitHub](https://github.com/dbos-inc/dbos-transact-ts/blob/main/dbos-config.schema.json).
This schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.
For example, the Visual Studio Code [RedHat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) provides tooltips, statement completion and real-time validation for editing DBOS config files.
This extension provides [multiple ways](https://github.com/redhat-developer/vscode-yaml#associating-schemas) to associate a YAML file with its schema.
The easiest is to simply add a comment with a link to the schema at the top of the config file:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/dbos-inc/dbos-transact-ts/main/dbos-config.schema.json
```
