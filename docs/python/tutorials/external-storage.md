---
sidebar_position: 137
title: External Storage
toc_max_heading_level: 3
---

:::info
External storage is a [DBOS Transact Enterprise](../../explanations/transact-enterprise.md) feature.
:::

DBOS checkpoints workflow inputs, step outputs, and workflow outputs in your system database, which isn't a good fit for large objects such as files or datasets.
With **external storage**, you keep large objects in a separate store such as [Amazon S3](https://aws.amazon.com/s3/) and checkpoint only a small reference to each one.

## Setting Up External Storage

Install DBOS Transact Enterprise and `boto3`:

```shell
pip install "dbos[enterprise]" boto3
```

Then, set `external_stores` in your DBOS configuration:

```python
import boto3
from dbos import DBOS, DBOSConfig
from dbos_enterprise import S3ExternalStore

config: DBOSConfig = {
    "name": "dbos-app",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "conductor_key": os.environ.get("DBOS_CONDUCTOR_KEY"),
    "external_stores": [S3ExternalStore(boto3.client("s3"), "my-bucket", prefix="dbos")],
}
DBOS(config=config)
```

DBOS provides two stores, and you can also [write your own](#custom-stores):

- `S3ExternalStore(client, bucket, prefix="", store_id=None)` stores objects in an S3 bucket.
- `FilesystemExternalStore(root, store_id=None)` stores objects as files under a directory, for development and testing.

## Storing and Loading Objects

Call [`DBOS.store_external_object`](../reference/contexts.md#store_external_object) to upload a value.
It returns an [`ExternalObjectRef`](../reference/contexts.md#externalobjectref), a small reference you can return from a step or workflow or pass as a workflow input.
When you need the value, call [`DBOS.load_external_object`](../reference/contexts.md#load_external_object) on the reference from a step:

```python
from dbos import DBOS, ExternalObjectRef

@DBOS.step()
def generate() -> ExternalObjectRef[list[float]]:
    readings = [float(i) for i in range(10_000_000)]
    # Uploads to the store. Only this small reference is checkpointed.
    return DBOS.store_external_object(readings)

@DBOS.step()
def summarize(ref: ExternalObjectRef[list[float]]) -> float:
    readings = DBOS.load_external_object(ref)
    return sum(readings) / len(readings)

@DBOS.workflow()
def pipeline() -> float:
    ref = generate()
    return summarize(ref)
```

You can store objects from a step or from workflow code, where DBOS runs the upload as a step.
You can't load objects from workflow code.
Load them in a step and use them there, returning only a small result, because a step's return value is checkpointed.

For the best performance with large objects, store `bytes`.
A `bytes` value is uploaded and loaded as is, without being serialized.

### Naming Objects

By default, each call to `store_external_object` creates a new object with a random key.
If you set a `key`, storing under that key again overwrites the object, so a step that retries doesn't leave extra copies behind:

```python
ref = DBOS.store_external_object(report, key="reports/final.json")
```

Keys are scoped to the workflow that owns the object, so two workflows can use the same key.
If you overwrite an object with a different value, references to the old value can no longer be loaded and raise `DBOSExternalObjectIntegrityError`.

### Using Multiple Stores

If you configure several stores, each needs a unique store ID and you must choose one with `store_id` when storing.
Loading uses the store named in the reference:

```python
ref = DBOS.store_external_object(data, store_id="s3://archive-bucket")
```

A store's ID defaults to its location, such as `s3://my-bucket/dbos`.
Don't change the ID of a store while references to it exist.
To be able to move a store's data to a new location, set `store_id` to a name that doesn't depend on the location.

## Storing Objects Outside a Workflow

Outside a workflow, you must name the workflow that owns the object.
The workflow doesn't have to exist yet, so you can use [`DBOSClient`](../reference/client.md#store_external_object) to upload a large input and then enqueue a workflow to process it.
The client must be configured with the same stores as your application:

```python
import uuid
from dbos import DBOSClient
from dbos_enterprise import S3ExternalStore

store = S3ExternalStore(boto3.client("s3"), "my-bucket", prefix="dbos")
client = DBOSClient(
    system_database_url=os.environ["DBOS_SYSTEM_DATABASE_URL"],
    external_stores=[store],
)

workflow_id = str(uuid.uuid4())
ref = client.store_external_object(large_input, owner_workflow_id=workflow_id)
client.enqueue(
    {"queue_name": "example_queue", "workflow_name": "process_input", "workflow_id": workflow_id},
    ref,
)
```

## Object Lifetime

Every object is owned by a workflow: by default, the workflow that stored it.
DBOS doesn't delete an object while its owner exists.
Once the owner has been deleted, either by a [retention policy](../../conductor/retention.md) or with [`DBOS.delete_workflow`](../reference/contexts.md#delete_workflow), the next retention run deletes the object from its store.
Without a retention policy, objects are never deleted.

Only the owner keeps an object alive.
If you fork a workflow and then delete the original, references held by the fork stop working and raise `DBOSExternalObjectMissingError`.

## Custom Stores

To use another storage system, implement the [`ExternalStore`](../reference/contexts.md#externalstore) protocol and pass an instance in `external_stores`:

```python
from typing import Sequence

class MyStore:
    @property
    def store_id(self) -> str:
        return "my-store"

    def put(self, key: str, data: bytes) -> None:
        ...

    def get(self, key: str) -> bytes:
        # Raise KeyError if no object has this key.
        ...

    def delete(self, keys: Sequence[str]) -> None:
        # Ignore keys with no object.
        ...
```

Each method should retry its own transient failures.
