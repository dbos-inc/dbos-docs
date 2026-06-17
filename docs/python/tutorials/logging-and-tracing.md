---
sidebar_position: 80
title: Logging & Tracing
---

### Logging

For convenience, DBOS provides a pre-configured logger for you to use available at [`DBOS.logger`](../reference/contexts.md#logger).
For example:

```python
DBOS.logger.info("Welcome to DBOS!")
```

You can [configure](../reference/configuration.md) the log level of this built-in logger through the DBOS constructor.
This also configures the log level of the DBOS library.

```python
config: DBOSConfig = {
  "name": "my-app",
  "log_level": "INFO",
}
DBOS(config=config)
```

### Tracing

DBOS automatically constructs [OpenTelemetry](https://opentelemetry.io/) [spans](https://opentelemetry.io/docs/concepts/signals/traces/#spans) for every workflow and step.
Spans are hierarchical: a step's span is a child of its workflow's span. If the workflow was started from an already-traced operation, such as an instrumented HTTP request, the workflow span is a child of that operation's span and shares its trace. Otherwise, DBOS starts a new trace.

DBOS emits spans on the **global OpenTelemetry tracer**.
This means that if your application already sends telemetry to an observability provider through OpenTelemetry, DBOS spans automatically join your existing traces. You don't need to set up a separate export pipeline just for DBOS.

:::info
OpenTelemetry support in DBOS is optional. To use it, install the DBOS OpenTelemetry dependencies:

```
pip install dbos[otel]
```

You must also enable tracing through the `enable_otlp` flag (this is what tells DBOS to create spans):

```python
config: DBOSConfig = {
  "name": "my-app",
  "enable_otlp": True,            # DBOS creates spans; your provider exports them
  "otel_attribute_format": "semconv",  # emit dbos.* attribute names (recommended)
}
DBOS(config=config)
```
:::

#### Connecting DBOS to your observability provider

This is the recommended way to use tracing with DBOS.
If you already send telemetry to an observability provider (Datadog, Langfuse, Honeycomb, Grafana, Logfire, Jaeger, ...) through OpenTelemetry, you can have DBOS workflow and step spans join your existing traces with no extra setup.

There are two steps:

1. Register your provider's OpenTelemetry `TracerProvider` (with `trace.set_tracer_provider(...)`) **before** launching DBOS.
2. Set `enable_otlp: True` in DBOS configuration. This will cause DBOS to emit spans onto your provider.

Set up your provider, then configure and launch DBOS, using whichever option matches your platform:

<Tabs groupId="provider" className="small-tabs">
<TabItem value="otlp" label="OpenTelemetry (OTLP)">

Most observability platforms, such as Honeycomb, Grafana, Logfire, a self-hosted [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/), or local [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/), accept the OpenTelemetry Protocol (OTLP). Point an OTLP exporter at your endpoint:

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from dbos import DBOS, DBOSConfig

# Set up your provider
provider = TracerProvider()
provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces"))
)
trace.set_tracer_provider(provider)

# Configure and launch DBOS
config: DBOSConfig = {
    "name": "my-app",
    "enable_otlp": True,            # DBOS creates spans; your provider exports them
    "otel_attribute_format": "semconv",  # emit dbos.* attribute names (recommended)
}
DBOS(config=config)
DBOS.launch()
```

</TabItem>
<TabItem value="datadog" label="Datadog">

[`ddtrace`](https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/python/) exposes an OpenTelemetry-compatible `TracerProvider`. Register it, and run your app under `ddtrace-run` (or `import ddtrace.auto` first) so `ddtrace` initializes:

```python
from ddtrace.opentelemetry import TracerProvider
from opentelemetry import trace
from dbos import DBOS, DBOSConfig

# Set up your provider
trace.set_tracer_provider(TracerProvider())

# Configure and launch DBOS
config: DBOSConfig = {
    "name": "my-app",
    "enable_otlp": True,            # DBOS creates spans; your provider exports them
    "otel_attribute_format": "semconv",  # emit dbos.* attribute names (recommended)
}
DBOS(config=config)
DBOS.launch()
```

`ddtrace` then forwards all spans—including DBOS workflow and step spans—to your Datadog agent.

</TabItem>
<TabItem value="langfuse" label="Langfuse">

[Langfuse](https://langfuse.com/) is an LLM-observability platform that ingests OpenTelemetry. Point an OTLP exporter at its endpoint, authenticated with your project keys:

```python
import base64, os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from dbos import DBOS, DBOSConfig

# Set up your provider
auth = base64.b64encode(
    f"{os.environ['LANGFUSE_PUBLIC_KEY']}:{os.environ['LANGFUSE_SECRET_KEY']}".encode()
).decode()
provider = TracerProvider()
provider.add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(
            # Use https://us.cloud.langfuse.com/... for the US region, or your self-hosted host
            endpoint="https://cloud.langfuse.com/api/public/otel/v1/traces",
            headers={"Authorization": f"Basic {auth}"},
        )
    )
)
trace.set_tracer_provider(provider)

# Configure and launch DBOS
config: DBOSConfig = {
    "name": "my-app",
    "enable_otlp": True,            # DBOS creates spans; your provider exports them
    "otel_attribute_format": "semconv",  # emit dbos.* attribute names (recommended)
}
DBOS(config=config)
DBOS.launch()
```

Each DBOS workflow becomes a Langfuse trace and each step a nested observation.
To record LLM-specific data—model, token usage, prompts—attach attributes to the current span from inside your steps (see [Adding custom attributes and events](#adding-custom-attributes-and-events) below).
For the current endpoint and credentials, see the [Langfuse OpenTelemetry docs](https://langfuse.com/docs/opentelemetry/get-started).

</TabItem>
</Tabs>

:::tip
Set up your provider before launching DBOS: DBOS emits spans onto whichever global provider exists.
If you enable OTLP without registering a provider for a signal (traces or logs), DBOS logs a one-time warning such as `OTLP is enabled but logger provider not set, skipping log exporter setup` and does nothing for that signal. This is harmless; set a global `LoggerProvider` too if you also want to export logs.
:::

#### Adding custom attributes and events

Within a workflow or step, you can access the current span and enrich it. This is useful for attaching domain data such as a user ID, a request size, or LLM token usage.
Access it via [`DBOS.span`](../reference/contexts.md#span):

```python
@DBOS.step()
def call_model(prompt: str) -> str:
    span = DBOS.span  # the current OpenTelemetry span
    if span is not None:
        span.set_attribute("gen_ai.request.model", "claude-opus-4-8")

    response = invoke_model(prompt)

    if span is not None:
        span.set_attribute("gen_ai.usage.input_tokens", response.usage.input_tokens)
        span.set_attribute("gen_ai.usage.output_tokens", response.usage.output_tokens)
        span.add_event("model call complete")
    return response.text

@DBOS.workflow()
def llm_workflow(prompt: str) -> str:
    return call_model(prompt)
```

Your provider exports these attributes on the span alongside DBOS's own, so they appear together in your dashboards.

#### Letting DBOS export traces directly

If you don't already run an observability provider, DBOS can export traces and logs itself to any OpenTelemetry Protocol (OTLP)-compliant receiver.
Set `enable_otlp: True` and [configure](../reference/configuration.md) your export endpoints:

```python
config: DBOSConfig = {
    "name": "my-app",
    "enable_otlp": True,
    "otlp_traces_endpoints": ["http://localhost:4318/v1/traces"],
    "otlp_logs_endpoints": ["http://localhost:4318/v1/logs"],
}
DBOS(config=config)
```

If `otlp_logs_endpoints` is configured, DBOS also exports your [`DBOS.logger`](#logging) logs over OTLP.
For example, try using [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/) to visualize the traces of your local application, or export your logs and traces to [Logfire](../../integrations/logfire).

### Metrics

Using [Conductor](../../production/conductor.md), you can also scrape metrics about your applications' workflows, steps, and executors from a Prometheus-compatible endpoint. See [Metrics](../../production/metrics.md) for details.
