# External Storage

> :::info
> External storage is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature.
> :::

DBOS checkpoints workflow inputs, step outputs, and workflow outputs in your system database, which isn't a good fit for large objects such as files or datasets.
With **external storage**, you keep large objects in a separate store such as [Amazon S3](https://aws.amazon.com/s3/) and checkpoint only a small reference to each one.

## Setting Up External Storage

Install DBOS Transact Enterprise and the AWS SDK:

```shell
npm install @dbos-inc/dbos-enterprise @aws-sdk/client-s3 @aws-sdk/lib-storage
```

Then, set `externalStores` in your DBOS configuration:

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { S3ExternalStore } from "@dbos-inc/dbos-enterprise";
import { S3Client } from "@aws-sdk/client-s3";

DBOS.setConfig({
  name: "dbos-app",
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  conductorKey: process.env.DBOS_CONDUCTOR_KEY,
  externalStores: [new S3ExternalStore(new S3Client({}), "my-bucket", { prefix: "dbos" })],
});
await DBOS.launch();
```

DBOS provides two stores, and you can also [write your own](#custom-stores):

- `new S3ExternalStore(client, bucket, { prefix, storeID })` stores objects in an S3 bucket.
- `new FilesystemExternalStore(root, { storeID })` stores objects as files under a directory, for development and testing.

## Storing and Loading Objects

Call [`DBOS.storeExternalObject`](../reference/methods.md#dbosstoreexternalobject) to upload a value.
It returns an [`ExternalObjectRef`](../reference/methods.md#externalobjectref), a small reference you can return from a step or workflow or pass as a workflow input.
When you need the value, call [`DBOS.loadExternalObject`](../reference/methods.md#dbosloadexternalobject) on the reference from a step:

```typescript
import { DBOS, type ExternalObjectRef } from "@dbos-inc/dbos-sdk";

async function generate(): Promise<ExternalObjectRef<number[]>> {
  const readings = Array.from({ length: 10_000_000 }, (_, i) => i);
  // Uploads to the store. Only this small reference is checkpointed.
  return await DBOS.storeExternalObject(readings);
}

async function summarize(ref: ExternalObjectRef<number[]>): Promise<number> {
  const readings = await DBOS.loadExternalObject(ref);
  return readings.reduce((sum, r) => sum + r, 0) / readings.length;
}

async function pipelineFunction(): Promise<number> {
  const ref = await DBOS.runStep(generate, { name: "generate" });
  return await DBOS.runStep(() => summarize(ref), { name: "summarize" });
}
const pipeline = DBOS.registerWorkflow(pipelineFunction);
```

You can store objects from a step or from workflow code, where DBOS runs the upload as a step.
You can't load objects from workflow code.
Load them in a step and use them there, returning only a small result, because a step's return value is checkpointed.

For the best performance with large objects, store a `Uint8Array` such as a `Buffer`.
It is uploaded as is, without being serialized, and loads as a `Buffer`.

### Naming Objects

By default, each call to `storeExternalObject` creates a new object with a random key.
If you set a `key`, storing under that key again overwrites the object, so a step that retries doesn't leave extra copies behind:

```typescript
const ref = await DBOS.storeExternalObject(report, { key: "reports/final.json" });
```

Keys are scoped to the workflow that owns the object, so two workflows can use the same key.
If you overwrite an object with a different value, references to the old value can no longer be loaded and throw `DBOSExternalObjectIntegrityError`.

### Using Multiple Stores

If you configure several stores, each needs a unique store ID and you must choose one with `storeID` when storing.
Loading uses the store named in the reference:

```typescript
const ref = await DBOS.storeExternalObject(data, { storeID: "s3://archive-bucket" });
```

A store's ID defaults to its location, such as `s3://my-bucket/dbos`.
Don't change the ID of a store while references to it exist.
To be able to move a store's data to a new location, set `storeID` to a name that doesn't depend on the location.

## Storing Objects Outside a Workflow

Outside a workflow, you must name the workflow that owns the object.
The workflow doesn't have to exist yet, so you can use [`DBOSClient`](../reference/client.md#storeexternalobject) to upload a large input and then enqueue a workflow to process it.
The client must be configured with the same stores as your application:

```typescript
import { randomUUID } from "node:crypto";
import { DBOSClient } from "@dbos-inc/dbos-sdk";
import { S3ExternalStore } from "@dbos-inc/dbos-enterprise";
import { S3Client } from "@aws-sdk/client-s3";

const client = await DBOSClient.create({
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL!,
  externalStores: [new S3ExternalStore(new S3Client({}), "my-bucket", { prefix: "dbos" })],
});

const workflowID = randomUUID();
const ref = await client.storeExternalObject(largeInput, { ownerWorkflowID: workflowID });
await client.enqueue({ queueName: "example_queue", workflowName: "processInput", workflowID }, ref);
```

## Object Lifetime

Every object is owned by a workflow: by default, the workflow that stored it.
DBOS doesn't delete an object while its owner exists.
Once the owner has been deleted, either by a [retention policy](../../conductor/retention.md) or with [`DBOS.deleteWorkflow`](../reference/methods.md#dbosdeleteworkflow), the next retention run deletes the object from its store.
Without a retention policy, objects are never deleted.

Only the owner keeps an object alive.
If you fork a workflow and then delete the original, references held by the fork stop working and throw `DBOSExternalObjectMissingError`.

## Custom Stores

To use another storage system, implement the [`ExternalStore`](../reference/methods.md#externalstore) interface and pass an instance in `externalStores`:

```typescript
import type { ExternalStore } from "@dbos-inc/dbos-sdk";

class MyStore implements ExternalStore {
  readonly storeID = "my-store";

  async put(key: string, data: Uint8Array): Promise<void> {
    // ...
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    // Return undefined if no object has this key.
  }

  async delete(keys: string[]): Promise<void> {
    // Ignore keys with no object.
  }
}
```

Each method should retry its own transient failures.
