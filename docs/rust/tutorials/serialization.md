---
sidebar_position: 70
title: Serialization
---

DBOS records workflow inputs and results, step results, events, messages and stream values in the system database.
Each of these types implements `serde`'s `Serialize` and `Deserialize`, and DBOS encodes it with one of three encodings:

- **`rust_serde`** (the default): JSON written by `serde_json`, readable by DBOS for Rust.
- **`portable_json`**: a JSON format every DBOS SDK reads, for workflows that cross languages.
- **A custom serializer** of your own, such as one that encrypts or compresses payloads.

Every row records the encoding it was written in, so a reader always knows how to read it, and you can change encodings without making older rows unreadable.

## Portable workflows

A workflow that another language starts, or whose result another language reads, needs its input, output and error in `portable_json`.
Register it with [`SerializationFormat::Portable`](https://docs.rs/dbos/latest/dbos/enum.SerializationFormat.html):

```rust
fn register_portable(dbos: &DBOS) -> dbos::Result<()> {
    // Other languages can start this workflow and read its result.
    let greet = dbos.register_workflow_with(
        "greet",
        WorkflowOptions {
            serialization: SerializationFormat::Portable,
            ..WorkflowOptions::default()
        },
        |name: String| async move { Ok::<_, dbos::Error>(format!("hello, {name}")) },
    )?;
    Ok(())
}
```

A portable workflow's steps are still recorded in the default encoding, because only DBOS for Rust replays them.
A single enqueue, send, event or stream write can also ask for `Portable` through the `serialization` field of its options.
See [Portable Workflows](../../explanations/portable-workflows.md) for how the format works across languages.

## Custom serializers

To encode payloads your own way, implement [`CustomSerializer`](https://docs.rs/dbos/latest/dbos/trait.CustomSerializer.html) and set it as the [`serializer`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.serializer) in your configuration:

```rust
/// Wraps JSON in an envelope; a real serializer might compress or encrypt it.
#[derive(Debug)]
struct EnvelopeJson;

impl CustomSerializer for EnvelopeJson {
    fn name(&self) -> &str {
        // Recorded on every row this serializer writes.
        "envelope_json"
    }

    fn serialize(
        &self,
        value: Payload<'_>,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        Ok(format!("v1:{}", serde_json::to_string(&value)?))
    }

    fn deserialize(
        &self,
        text: &str,
        into: PayloadSlot<'_>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let json = text.strip_prefix("v1:").ok_or("not an envelope")?;
        let mut deserializer = serde_json::Deserializer::from_str(json);
        into.fill(&mut deserializer)?;
        Ok(deserializer.end()?)
    }
}

fn configure() -> Config {
    let mut config = Config::from_env("dbos-starter");
    config.serializer = Serializer::custom(EnvelopeJson);
    config
}
```

A custom serializer encodes everything your application writes in its default encoding; payloads asked to be `Portable` are still written as `portable_json`.
Keep in mind:

- **The format must be self-describing**, able to read a value without knowing its type in advance (what `serde` calls `deserialize_any`), because some of what DBOS records is a `serde_json::Value`. JSON is; bincode isn't.
- **Its output can't contain a NUL character**, which Postgres can't store in a text column.
- **Keep it configured while its rows exist.** Rows record the serializer's name, and only a process configured with a serializer of that name can read them. Rows in the built-in encodings stay readable whatever is configured.
- **Don't change its name**, which makes every row written under the old name unreadable. The name can't be `rust_serde` or `portable_json`.
