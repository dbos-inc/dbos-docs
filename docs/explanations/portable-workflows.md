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

By default, each DBOS SDK serializes data using its language's default format.
These default formats are chosen for their fidelity to the wide range of data structures and objects available in each language:

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
- JSON objects (maps with strings as keys and JSON values)

**Type conversions:**
Some language built-in and library types are mapped to equivalent JSON constructs.
When these values are decoded, the recipient must restore them to the appropriate language equivalent.

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

You can opt in to portable serialization at the workflow or operation level.
Workflows started with portable serialization return their results or exceptions in portable format.
Workflows started with portable serialization also write their events and streams in portable JSON by default, but this can be overridden for each operation.

### Per-Workflow (Enqueue)

When enqueuing or starting a workflow from a `DBOSClient`, set the serialization format in the enqueue options.
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

You can set the serialization strategy directly on the workflow annotation or decorator so that the workflow uses portable serialization by default when started:

<Tabs groupId="language">
<TabItem value="python" label="Python">

```python
from dbos import DBOS, WorkflowSerializationFormat

@DBOS.workflow(serialization_type=WorkflowSerializationFormat.PORTABLE)
def process_order(order_id: str):
    # All inputs, outputs, events, and streams for this workflow
    # use portable JSON serialization by default
    return f"processed: {order_id}"
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

Using a decorator:

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";

export class Orders {
  @DBOS.workflow({ serializationType: "portable" })
  static async processOrder(orderId: string): Promise<string> {
    // All inputs, outputs, events, and streams for this workflow
    // use portable JSON serialization by default
    return `processed: ${orderId}`;
  }
}
```

Or using `registerWorkflow`:

```typescript
async function processOrder(orderId: string): Promise<string> {
  return `processed: ${orderId}`;
}
const processOrderWorkflow = DBOS.registerWorkflow(processOrder, {
  name: "processOrder",
  serializationType: "portable",
});
```

</TabItem>
<TabItem value="java" label="Java">

```java
import dev.dbos.transact.workflow.SerializationStrategy;
import dev.dbos.transact.workflow.Workflow;

@Workflow(serializationStrategy = SerializationStrategy.PORTABLE)
public String processOrder(String orderId) {
    // All inputs, outputs, events, and streams for this workflow
    // use portable JSON serialization by default
    return "processed: " + orderId;
}
```

</TabItem>
</Tabs>

:::note
The default serialization strategy only affects invocations that are aware of the annotation / decorator.  This makes the default useful for unit testing, but the actual serialization strategy used will depend on how the workflow is enqueued by the client.
:::


### Per-Operation

Setting the serialization format at the workflow level affects the default for `setEvent` and `writeStream`.
However, individual operations can override this&mdash;for example, a workflow running with native serialization may want to publish a specific event in portable format for cross-language consumption, or a portable workflow may need to record an event with the greater flexibility afforded by the native serializer.
Each language's `setEvent` and `writeStream` methods accept a serialization parameter for this purpose.

Note that `send` is not affected by the current workflow's serialization strategy, because messages target a different workflow and the sender does not know what serialization that workflow expects.
You should always set the serialization format explicitly on `send` when communicating cross-language.

:::info
Step outputs always use the native serializer regardless of the workflow's serialization strategy.
Steps are internal to a workflow and are not read by other languages, so the native serializer's greater flexibility is preferred.
:::

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
// Arguments are serialized as: {"positionalArgs": ["order-123"], "namedArgs": {}}
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

## Input Validation and Coercion

When a workflow is started via portable JSON&mdash;whether from another language, a `DBOSClient`, or a direct database insert&mdash;the arguments arrive as plain JSON values.
JSON has a limited type system: numbers are untyped (no distinction between `int`, `long`, `double`, or other language-specific offerings), there is no native date type (dates arrive as strings), and collection types may not match the target language's expectations (e.g., a JSON array becomes a generic `ArrayList` in Java, not a typed list or object array).

Each SDK provides a way to validate and coerce these arguments so that the workflow function receives the types it expects.

Note that while workflow argument validation is possible, return values, messages, and events are not automatically coerced, as the expected types are not known at runtime.  These must be validated and coerced manually.

<Tabs groupId="language">
<TabItem value="java" label="Java">

### Java — Automatic Coercion

Java automatically coerces portable JSON arguments to match the workflow method's parameter types.
No opt-in is required&mdash;this happens transparently for all portable workflows.

Common coercions include:

| JSON Type | Java Method Parameter | Coercion |
|-----------|----------------------|----------|
| Integer (`30000`) | `long` | Integer &rarr; long |
| Double (`1.01`) | `double` | Double &rarr; double |
| String (`"2025-06-15T10:30:00Z"`) | `Instant` | ISO-8601 parsing |
| String (`"2025-06-15T10:30:00+02:00"`) | `OffsetDateTime` | ISO-8601 parsing |
| JSON array | `ArrayList<T>` | Element-wise coercion |
| JSON object | `Map<String, Object>` | LinkedHashMap &rarr; Map |

If coercion fails (for example, a JSON object where a `String` is expected), the workflow is marked as `ERROR` with a descriptive message.

```java
// This workflow expects (String, long), but portable JSON delivers (String, Integer).
// Java coerces the Integer to long automatically.
@Workflow(name = "processOrder")
public String processOrder(String orderId, long quantity) {
    return "order:" + orderId + " qty:" + quantity;
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

### TypeScript — Input Schema (Zod)

TypeScript workflows can specify an `inputSchema` that validates and optionally transforms arguments before the workflow function runs.
The schema must have a `.parse()` method&mdash;making it compatible with [Zod](https://zod.dev/), [AJV](https://ajv.js.org/) wrappers, or any custom validator.

The schema receives the arguments as a tuple (array) and should return the validated/transformed tuple.
It runs on every invocation: direct calls, queue dispatch, and recovery.

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { z } from "zod";

// Validation only — reject bad inputs with a clear Zod error
const validatedWorkflow = DBOS.registerWorkflow(
  async (name: string, count: number) => {
    return `${name}:${count}`;
  },
  {
    name: "validatedWorkflow",
    serialization: "portable",
    inputSchema: z.tuple([z.string(), z.number()]),
  },
);

// Validation + coercion — convert ISO date strings to Date objects
const dateWorkflow = DBOS.registerWorkflow(
  async (due: Date) => {
    return `due:${due.toISOString()}`;
  },
  {
    name: "dateWorkflow",
    serialization: "portable",
    inputSchema: z.tuple([z.coerce.date()]),
  },
);
```

Or using decorators:

```typescript
export class Orders {
  @DBOS.workflow({
    serialization: "portable",
    inputSchema: z.tuple([z.string(), z.coerce.date()]),
  })
  static async processOrder(orderId: string, due: Date): Promise<string> {
    return `${orderId} due ${due.toISOString()}`;
  }
}
```

</TabItem>
<TabItem value="python" label="Python">

### Python — Argument Validator (Pydantic)

Python workflows can specify a `validate_args` parameter on `@DBOS.workflow()`.
The built-in `pydantic_args_validator` sentinel builds a [Pydantic](https://docs.pydantic.dev/) validator from the function's type hints at decoration time.
This validates argument types and coerces compatible values (for example, ISO date strings to `datetime` objects).

```python
from datetime import datetime
from typing import Dict, Any, List
from dbos import DBOS, WorkflowSerializationFormat, pydantic_args_validator

@DBOS.workflow(
    serialization_type=WorkflowSerializationFormat.PORTABLE,
    validate_args=pydantic_args_validator,
)
def process_order(name: str, count: int, tags: List[str]) -> str:
    # Pydantic validates types — "not_a_number" for count raises ValueError
    return f"{name}:{count}:{','.join(tags)}"

@DBOS.workflow(
    serialization_type=WorkflowSerializationFormat.PORTABLE,
    validate_args=pydantic_args_validator,
)
def schedule_task(name: str, due: datetime, tags: List[str]) -> str:
    # Pydantic coerces the ISO string "2025-06-15T10:30:00" to a datetime object
    return f"{name}@{due.isoformat()}#{','.join(tags)}"
```

You can also provide a custom validator function.
It must accept `(positional_args_tuple, keyword_args_dict)` and return a validated `(positional_args_tuple, keyword_args_dict)`:

```python
def my_validator(args, kwargs):
    # Custom validation or coercion logic
    return args, kwargs

@DBOS.workflow(
    serialization_type=WorkflowSerializationFormat.PORTABLE,
    validate_args=my_validator,
)
def my_workflow(x: int) -> str:
    return str(x)
```

</TabItem>
</Tabs>

## Direct Database Access

Because `portable_json` data is stored as plain JSON in the [system tables](./system-tables.md), you can read and write it directly with SQL&mdash;no DBOS SDK required.
The [`serialization` column](./system-tables.md) in each table indicates the format used; rows with `serialization = 'portable_json'` contain standard JSON that any SQL client can query.

For example, to start a workflow by inserting directly into `dbos.workflow_status`:

```sql
INSERT INTO dbos.workflow_status (
    workflow_uuid, status, name, queue_name,
    inputs, serialization, created_at, updated_at
)
VALUES (
    'my-workflow-id',
    'ENQUEUED',
    'process_order',
    'orders',
    '{"positionalArgs":["order-123"],"namedArgs":{}}',
    'portable_json',
    EXTRACT(EPOCH FROM now()) * 1000,
    EXTRACT(EPOCH FROM now()) * 1000
);
```

And to poll for the workflow's result:

```sql
SELECT status, output, error
FROM dbos.workflow_status
WHERE workflow_uuid = 'my-workflow-id';
```

When the workflow completes, `status` will be `SUCCESS` (with `output` populated) or `ERROR` (with `error` populated), and both values will be plain JSON.

This makes it straightforward to integrate DBOS workflows with external systems, dashboards, or languages such as PL/pgSQL that don't have a DBOS SDK.

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
