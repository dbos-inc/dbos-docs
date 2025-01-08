---
sidebar_position: 50
title: Logging & Tracing
---

### Logging

When building a DBOS app, we recommend using the built-in DBOS logger.
This allows DBOS Cloud to collect and display your logs.
You can access the logger through [`DBOS.logger`](../reference/transactapi/dbos-class#accessing-logging).

```javascript
DBOS.logger.info("Welcome to DBOS!");
```

The logger provides four logging levels: `info()`, `debug()`, `warn()` and `error()`.
Each accepts and logs any output that can be serialized to JSON.
`error()` additionally logs a stack trace.

In your [`dbos-config.yaml`](../reference/configuration.md), you can configure the log level and whether to add metadata such as the workflow ID to logs:

```yaml
telemetry:
  logs:
    logLevel: 'info' # info (default) | debug | warn | error
    addContextMetadata: 'true' # true (default) | false
```

You can also configure the logging level from the command line:

```shell
npx dbos start --loglevel debug
```

### Tracing

DBOS automatically constructs [OpenTelemetry](https://opentelemetry.io/) traces of all workflows and their steps.

DBOS constructs hierarchical [spans](https://opentelemetry.io/docs/concepts/signals/traces/#spans) for workflows and each of their steps.
For example, if an HTTP endpoint calls a workflow that calls a transaction, DBOS constructs a trace encompassing the entire request, with spans for the HTTP endpoint, the workflow, and the transaction.
The transaction span is a child of the workflow span, which is a child of the HTTP endpoint span.
You can access your current span via [`DBOS.span`](../reference/transactapi/dbos-class#accessing-the-tracing-span).

### OpenTelemetry Export

You can export DBOS logs and traces to any OpenTelemetry Protocol (OTLP)-compliant receiver.
In DBOS Cloud, this is done automatically, and you can view your logs and traces in the [cloud console](https://console.dbos.dev/login-redirect).

Locally, you can configure exporters in your [`dbos-config.yaml`](../reference/configuration.md):

```yaml
telemetry:
    OTLPExporter:
        logsEndpoint: http://localhost:4318/v1/logs
        tracesEndpoint: http://localhost:4318/v1/traces
```

For example, try using [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/) to visualize the traces of your local application.