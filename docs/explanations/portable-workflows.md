---
sidebar_position: 15
title: Cross-Language Interaction
description: DBOS applications and clients in different languages can interoperate using portable JSON serialization
---

DBOS supports multiple languages&mdash;Python, TypeScript, Go, and Java&mdash;each with its own SDK.
When applications in different languages share the same [system database](./system-tables.md), they can exchange data through workflows, messages, events, and streams.
However, each language has a native serialization format that the other languages can't read.
The **portable JSON** serialization format solves this by providing a common data representation that all SDKs can read and write, and can even be read and written from the database without any DBOS code at all.

## Default Serialization Is Language-Specific

By default, each DBOS SDK serializes data using its language's default format.  These default formats are chosen for their fidelity to the wide range of data structures and objects available in each language:

| Language   | Default Format  | Format Name     |
|------------|-----------------|-----------------|
| Python     | pickle          | `py_pickle`     |
| TypeScript | SuperJSON       | `js_superjson`  |
| Java       | Jackson         | `java_jackson`  |

As the set of data structures and classes varies from language to language, data written in one language's default format cannot be read by the other languages.
For example, a Python workflow that writes an event using pickle produces a binary blob that TypeScript and Java can't deserialize.

## Portable JSON Format

The `portable_json` format is straightforward use of JSON that all SDKs can read and write.
While a smaller subset of language constructs can be serialized, any DBOS application in any language can read or write it.

**Supported types:**
- JSON primitives: `null`, booleans, numbers, and strings
- JSON arrays (ordered lists of JSON values)
- JSON objects (Maps with strings as keys and JSON values)

**Type conversions:**
Some language built-in and library types are mapped to equivalent JSON constructs.  When these values are decoded, the recipient must restore them to the appropriate language equivalent.

- Date/time values are converted to [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339) UTC strings (e.g., `"2025-06-15T14:30:00.000Z"`)

| Language   | Type                   | Portable Representation |
|------------|------------------------|-------------------------|
| Python     | `datetime`             | RFC 3339 UTC string     |
| Python     | `date`                 | ISO 8601 string         |
| Python     | `Decimal`              | Numeric string          |
| Python     | `set`, `tuple`         | JSON array              |
| Java       | `Instant`              | RFC 3339 UTC string     |
| Java       | `BigDecimal`           | Numeric string          |
| TypeScript | `Date`                 | RFC 3339 UTC string     |
| TypeScript | `BigInt`               | Numeric string          |

## Using Portable Serialization

You can opt in to portable serialization at the workflow or operation level.  Workflows started with portable serialization will return their results or execeptions in portable format.  Workflows started with portable serialization will also write their events and streams in portable JSON by default, but this can be overridden for each operation.

### Per-Workflow (Enqueue)

When enqueuing or starting a workflow that will be processed by another language, set the serialization format in the enqueue options.
This ensures the workflow's arguments are serialized in portable format that can be read by the target language.

<Tabs groupId="language">
<TabItem value="python" label="Python">

```python
from dbos import DBOSClient, WorkflowSerializationFormat

client = DBOSClient(db_url)
handle = client.enqueue(
    {
        "workflow_name": "process_order",
        "queue_name": "orders",
        "serialization_type": WorkflowSerializationFormat.PORTABLE,
    },
    "order-123",  # positional arg
    priority="high",  # keyword arg
)
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { DBOSClient } from "@dbos-inc/dbos-sdk";

const client = new DBOSClient(dbUrl);
const handle = await client.enqueue(
    {
        workflowName: "process_order",
        queueName: "orders",
        serializationType: "portable",
    },
    "order-123",
);
```

</TabItem>
<TabItem value="java" label="Java">

```java
import dev.dbos.transact.client.DBOSClient;
import dev.dbos.transact.client.EnqueueOptions;
import dev.dbos.transact.workflow.SerializationStrategy;

DBOSClient client = new DBOSClient(dbUrl, dbUser, dbPassword);
var options = new EnqueueOptions("OrderProcessor", "processOrder", "orders")
    .withSerialization(SerializationStrategy.PORTABLE);
var handle = client.enqueue(options, "order-123");
```

</TabItem>
</Tabs>

### Per-Workflow (via Annotation or Decorator)

In Java, you can set the serialization strategy directly on the `@Workflow` annotation so that the workflow uses portable serialization by default when started:

```java
import dev.dbos.transact.workflow.SerializationStrategy;
import dev.dbos.transact.workflow.Workflow;

@Workflow(serializationStrategy = SerializationStrategy.PORTABLE)
public String processOrder(String orderId) {
    // All inputs, outputs, events, and messages for this workflow
    // use portable JSON serialization by default
    return "processed: " + orderId;
}
```

### Per-Operation

The most common approach is to set the serialization format at the workflow level, which affects the default serialization format for `setEvent`, and `writeStream`.  However, within a typical workflow it may be desired to record events in a portable format, or workflows running with portable serialization may need to record events with the greater flexibility afforded by the native serializer, so each language's `setEvent`, and `writeStream` methods accept a serialization parameter.

Note that, as the serialization format for `send` would be tailored to the receiving workflow, its default is not affected by the current workflow's serialization strategy.

<Tabs groupId="language">
<TabItem value="python" label="Python">

```python
from dbos import DBOS, WorkflowSerializationFormat

# Send a message readable by any language
DBOS.send(
    destination_id="workflow-123",
    message={"status": "complete", "count": 42},
    topic="updates",
    serialization_type=WorkflowSerializationFormat.PORTABLE,
)

# Set an event readable by any language
DBOS.set_event(
    "progress",
    {"percent": 75},
    serialization_type=WorkflowSerializationFormat.PORTABLE,
)

# Write to a stream readable by any language
DBOS.write_stream(
    "results",
    {"item": "processed"},
    serialization_type=WorkflowSerializationFormat.PORTABLE,
)
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";

// Send a message readable by any language
await DBOS.send(
  "workflow-123",
  { status: "complete", count: 42 },
  "updates",
  undefined, // idempotencyKey
  { serializationType: "portable" }
);

// Set an event readable by any language
await DBOS.setEvent(
  "progress",
  { percent: 75 },
  { serializationType: "portable" }
);

// Write to a stream readable by any language
await DBOS.writeStream(
  "results",
  { item: "processed" },
  { serializationType: "portable" }
);
```

</TabItem>
<TabItem value="java" label="Java">

```java
import dev.dbos.transact.DBOS;
import dev.dbos.transact.workflow.SerializationStrategy;

// Send a message readable by any language
DBOS.send(
    "workflow-123",
    Map.of("status", "complete", "count", 42),
    "updates",
    null, // idempotencyKey
    SerializationStrategy.PORTABLE
);

// Set an event readable by any language
DBOS.setEvent(
    "progress",
    Map.of("percent", 75),
    SerializationStrategy.PORTABLE
);
```

</TabItem>
</Tabs>

## Portable Workflow Arguments

When a workflow is enqueued with portable serialization, its arguments are structured as a JSON object with two fields:

```json
{
  "positionalArgs": ["order-123", 42],
  "namedArgs": {"priority": "high"}
}
```

- **`positionalArgs`**: An array of the workflow's positional arguments.
- **`namedArgs`**: An object of the workflow's keyword/named arguments.

This structure allows any language to pass arguments to any other language's workflows.
For example, a Java `DBOSClient` can enqueue a Python workflow that expects both positional and keyword arguments:

```java
// Java: enqueue a Python workflow
DBOSClient client = new DBOSClient(dbUrl, dbUser, dbPassword);
var options = new EnqueueOptions("", "process_order", "orders")
    .withSerialization(SerializationStrategy.PORTABLE);
// Arguments are serialized as: {"positionalArgs": ["order-123"], "namedArgs": {"priority": "high"}}
var handle = client.enqueue(options, "order-123");
```

The Python workflow receives the arguments normally:

```python
@DBOS.workflow()
def process_order(order_id: str):
    # order_id = "order-123", received from the Java client
    ...
```

If the target language (Java, TypeScript) does not support named arguments, then `namedArgs` should not be provided when invoking workflows written in that language.

## Portable Errors

When a workflow using portable serialization fails, its error is serialized in a standard JSON structure that all languages can inspect:

```json
{
  "name": "ValueError",
  "message": "Order not found",
  "code": 404,
  "data": {"orderId": "order-123"}
}
```

| Field     | Type                 | Description                            |
|-----------|----------------------|----------------------------------------|
| `name`    | string               | The error type/class name              |
| `message` | string               | Human-readable error message           |
| `code`    | number, string, null | Optional application-specific error code |
| `data`    | any JSON value, null | Optional structured error details      |

### Raising Portable Errors

You can explicitly raise a portable error from a workflow:

<Tabs groupId="language">
<TabItem value="python" label="Python">

```python
from dbos import PortableWorkflowError

raise PortableWorkflowError(
    message="Order not found",
    name="NotFoundError",
    code=404,
    data={"orderId": "order-123"},
)
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
import { PortableWorkflowError } from "@dbos-inc/dbos-sdk";

throw new PortableWorkflowError(
  "Order not found",
  "NotFoundError",
  404,
  { orderId: "order-123" },
);
```

</TabItem>
<TabItem value="java" label="Java">

```java
import dev.dbos.transact.json.PortableWorkflowException;

throw new PortableWorkflowException(
    "Order not found",
    "NotFoundError",
    404,
    Map.of("orderId", "order-123")
);
```

</TabItem>
</Tabs>

### Reading Portable Errors

When a workflow that used portable serialization fails, other languages receive the error as a `PortableWorkflowError` (Python/TS) or `PortableWorkflowException` (Java) with the `name`, `message`, `code`, and `data` fields populated.

If a workflow fails with a non-portable exception while using portable serialization, DBOS automatically converts it to the portable error format on a best-effort basis, extracting the error type name, message, and any common error code attributes.

## Further Reading

- **Serialization strategy reference:**
  - [Python Serialization Strategy](../python/reference/contexts.md#serialization-strategy)
  - [TypeScript Serialization Strategy](../typescript/reference/methods.md#serialization-strategy)
  - [Java Serialization Strategy](../java/reference/methods.md#serialization-strategy)
- **Custom serialization configuration:**
  - [Python Custom Serialization](../python/reference/contexts.md#custom-serialization)
  - [TypeScript Custom Serialization](../typescript/reference/configuration.md#custom-serialization)
  - [Java Custom Serialization](../java/reference/lifecycle.md#custom-serialization)
- **System tables:** The [`serialization` column](./system-tables.md) in system tables records which format was used for each piece of serialized data.
