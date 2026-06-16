---
sidebar_position: 70
title: Logging & Tracing
---

### Logging

For convenience, DBOS provides a logging facility accessed via [`DBOS.logger`](../reference/methods.md#dboslogger).
For example:

```javascript
DBOS.logger.info("Welcome to DBOS!");
```

Entries logged to the DBOS logger are automatically augmented with DBOS context information, such as the current workflow state.

You can [configure](../reference/configuration.md) the log level of this built-in logger:
```javascript
DBOS.setConfig({
  name: 'my-app',
  logLevel: "info",
});
await DBOS.launch();
```

Setting `logLevel` also affects any log messages emitted by the DBOS library.

#### Custom Logger

By default, the DBOS logger writes to the console (or exports its logs over OTLP when `enableOTLP` is set).
To route all of DBOS's internal logging to your own logging system instead, supply a custom logger that implements the `DLogger` interface:

```typescript
import { DLogger, ContextualMetadata, StackTrace } from '@dbos-inc/dbos-sdk';

class MyCustomLogger implements DLogger {
  info(logEntry: unknown, metadata?: ContextualMetadata): void {}
  debug(logEntry: unknown, metadata?: ContextualMetadata): void {}
  warn(logEntry: unknown, metadata?: ContextualMetadata): void {}
  error(inputError: unknown, metadata?: ContextualMetadata & StackTrace): void {}
}
```

Pass your implementation through the `logger` field in DBOS configuration:

```typescript
DBOS.setConfig({
  name: 'my-app',
  logger: myCustomLogger,
});
await DBOS.launch();
```

You can also supply a custom logger to the [DBOS Client](../reference/client.md):

```typescript
const client = await DBOSClient.create({
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  logger: myCustomLogger,
});
```

When a custom logger is set, DBOS directs all its internal logging to it (including `DBOS.logger` calls in your workflows and steps), replacing the built-in console and OTLP log sinks.
Keep the following contract in mind when implementing `DLogger`:

- **Log entries arrive as strings.** DBOS stringifies non-string entries before delegating. `error()` receives the message of an `Error`, with its stack trace in `metadata.stack`.
- **Context metadata is provided via the span.** When called from a workflow or step, `metadata.span?.attributes` carries the operation context (workflow ID, operation name and type, etc.).
- **Level routing is your responsibility.** DBOS does not filter by `logLevel` before delegating; your implementation decides what to do with each level.
- **OTLP log export is disabled.** Logs are not sent over OTLP even if `enableOTLP` is on (tracing is unaffected).
- **The logger's lifecycle is yours.** DBOS never flushes or closes it.
- **Do not log back through `DBOS.logger`** from within your implementation, as this could cause infinite recursion.


### Tracing

DBOS automatically constructs [OpenTelemetry](https://opentelemetry.io/) [spans](https://opentelemetry.io/docs/concepts/signals/traces/#spans) for every workflow and step.
Spans are hierarchical: a step's span is a child of its workflow's span. If the workflow was started from an already-traced operation, such as an instrumented HTTP request, the workflow span is a child of that operation's span and shares its trace. Otherwise, DBOS starts a new trace.

DBOS emits spans on the **global OpenTelemetry tracer**.
This means that if your application already sends telemetry to an observability provider through OpenTelemetry, DBOS spans automatically join your existing traces. You don't need to set up a separate export pipeline just for DBOS.

:::info
OpenTelemetry support in DBOS is optional. To use it, install the DBOS OpenTelemetry dependencies:

```
npm i @dbos-inc/otel@latest
```
:::

#### Connecting DBOS to your observability provider

This is the recommended way to use tracing with DBOS.
If you already send telemetry to an observability provider (Datadog, Langfuse, Honeycomb, Grafana, Logfire, Jaeger, ...) through OpenTelemetry, you can have DBOS workflow and step spans join your existing traces with no extra setup.

There are two steps:

1. Register your provider's OpenTelemetry `TracerProvider` **before** calling `DBOS.launch()`.
2. Set `tracingEnabled: true` in your DBOS configuration.

Install your provider's OpenTelemetry packages alongside `@dbos-inc/otel` (for example, `@opentelemetry/sdk-node` and `@opentelemetry/exporter-trace-otlp-proto` for an OTLP endpoint, or `dd-trace` for Datadog).
Set up your provider, then configure and launch DBOS, using whichever option matches your platform:

<Tabs groupId="provider" className="small-tabs">
<TabItem value="otlp" label="OpenTelemetry (OTLP)">

Most observability platforms—Honeycomb, Grafana, Logfire, a self-hosted [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/), or local [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/)—accept the OpenTelemetry Protocol (OTLP). Point an OTLP exporter at your endpoint:

```typescript
import { DBOS } from '@dbos-inc/dbos-sdk';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

// Set up your provider
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
    // headers: { 'x-api-key': process.env.OTEL_API_KEY }, // if your provider needs auth
  }),
});
sdk.start();

// Configure and launch DBOS
DBOS.setConfig({
  name: 'my-app',
  tracingEnabled: true,           // DBOS creates spans; your provider exports them
  otelAttributeFormat: 'semconv', // emit dbos.* attribute names (recommended)
});
await DBOS.launch();
```

</TabItem>
<TabItem value="datadog" label="Datadog">

[`dd-trace`](https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/nodejs/) exposes an OpenTelemetry-compatible `TracerProvider`. Initialize it and register the provider:

```typescript
import { DBOS } from '@dbos-inc/dbos-sdk';
import tracer from 'dd-trace';

// Set up your provider
tracer.init();
const { TracerProvider } = tracer;
new TracerProvider().register();

// Configure and launch DBOS
DBOS.setConfig({
  name: 'my-app',
  tracingEnabled: true,           // DBOS creates spans; your provider exports them
  otelAttributeFormat: 'semconv', // emit dbos.* attribute names (recommended)
});
await DBOS.launch();
```

`dd-trace` then forwards all spans—including DBOS workflow and step spans—to your Datadog agent.

</TabItem>
<TabItem value="langfuse" label="Langfuse">

[Langfuse](https://langfuse.com/) is an LLM-observability platform that ingests OpenTelemetry. Point an OTLP exporter at its endpoint, authenticated with your project keys:

```typescript
import { DBOS } from '@dbos-inc/dbos-sdk';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

// Set up your provider
const auth = // ...
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'https://cloud.langfuse.com/api/public/otel/v1/traces',
    headers: { Authorization: `Basic ${auth}` },
  }),
});
sdk.start();

// Configure and launch DBOS
DBOS.setConfig({
  name: 'my-app',
  tracingEnabled: true,           // DBOS creates spans; your provider exports them
  otelAttributeFormat: 'semconv', // emit dbos.* attribute names (recommended)
});
await DBOS.launch();
```

Each DBOS workflow becomes a Langfuse trace and each step a nested observation.
To record LLM-specific data—model, token usage, prompts—attach attributes to the current span from inside your steps (see [Adding custom attributes and events](#adding-custom-attributes-and-events) below).
For the current endpoint and credentials, see the [Langfuse OpenTelemetry docs](https://langfuse.com/docs/opentelemetry/get-started).

</TabItem>
</Tabs>

:::tip
Set up your provider before calling `DBOS.launch()`: DBOS adopts whichever global provider exists at launch (importing DBOS or registering workflows beforehand is fine).
:::

#### Adding custom attributes and events

Within a workflow or step, you can access the current span and enrich it. This is useful for attaching domain data such as a user ID, a request size, or LLM token usage.
Access it via [`DBOS.span`](../reference/methods.md#dbosspan), or in the standard OpenTelemetry way with `trace.getSpan(context.active())`:

```typescript
const llmWorkflow = DBOS.registerWorkflow(async (prompt: string) => {
  return await DBOS.runStep(async () => {
    const span = DBOS.span; // equivalently: trace.getSpan(context.active())
    span?.setAttribute('gen_ai.request.model', 'claude-opus-4-8');

    const response = await callModel(prompt);

    span?.setAttribute('gen_ai.usage.input_tokens', response.usage.inputTokens);
    span?.setAttribute('gen_ai.usage.output_tokens', response.usage.outputTokens);
    span?.addEvent('model call complete');
    return response.text;
  }, { name: 'callModel' });
}, { name: 'llmWorkflow' });
```

Your provider exports these attributes on the span alongside DBOS's own, so they appear together in your dashboards.

#### Letting DBOS export traces directly

If you don't already run an observability provider, DBOS can export traces and logs itself to any OpenTelemetry Protocol (OTLP)-compliant receiver.
Set `enableOTLP: true` and [configure](../reference/configuration.md) your export endpoints:

```javascript
DBOS.setConfig({
  name: 'my-app',
  enableOTLP: true,
  otlpTracesEndpoints: ["http://localhost:4318/v1/traces"],
  otlpLogsEndpoints: ["http://localhost:4318/v1/logs"],
});
await DBOS.launch();
```

If `otlpLogsEndpoints` is configured, `enableOTLP` also exports your [`DBOS.logger`](#logging) logs over OTLP.
For example, try using [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/) to visualize the traces of your local application, or export your logs and traces to [Logfire](../../integrations/logfire).

### Metrics

Using [Conductor](../../production/conductor.md), you can also scrape metrics about your applications' workflows, steps, and executors from a Prometheus-compatible endpoint. See [Metrics](../../production/metrics.md) for details.
