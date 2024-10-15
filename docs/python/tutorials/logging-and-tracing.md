---
sidebar_position: 7
title: Logging & Tracing
description: Overview of logging and tracing in DBOS
---

### Logging

When using DBOS, we recommend you do all logging via Python's [built-in logger](https://docs.python.org/3/library/logging.html).
This allows DBOS Cloud to collect and display your logs.

For convenience, DBOS provides a pre-configured logger for you to use available at [`DBOS.logger`](../reference/contexts.md#logger).
For example:

```python
DBOS.logger.info("Welcome to DBOS!")
```

You can configure the log level of this built-in logger in your [`dbos-config.yaml`](../reference/configuration.md) file

```yaml
telemetry:
  logs:
    logLevel: 'INFO'
```

### Tracing 

DBOS automatically constructs [OpenTelemetry](https://opentelemetry.io/) traces of all workflows and their steps.
If you are using FastAPI or Flask, it also automatically traces each HTTP request.

DBOS constructs hierarchical [spans](https://opentelemetry.io/docs/concepts/signals/traces/#spans) for workflows and each of their steps.
For example, if a FastAPI HTTP endpoint calls a workflow that calls a transaction, DBOS constructs a trace encompassing the entire request, with spans for the HTTP endpoint, the workflow, and the transaction.
The transaction span is a child of the workflow span, which is a child of the HTTP endpoint span.
You can access your current span via [`DBOS.span`](../reference/contexts.md#span)

### OpenTelemetry Export

You can export DBOS logs and traces to any OpenTelemetry Protocol (OTLP)-compliant receiver.
In DBOS Cloud, this is done automatically, and you can view your logs and traces in your [cloud console](https://console.dbos.dev/login-redirect) and [monitoring dashboard](../../cloud-tutorials/monitoring-dashboard.md).

Locally, you can configure exporters in your [`dbos-config.yaml`](../reference/configuration.md):

```yaml
telemetry:
    OTLPExporter:
        logsEndpoint: http://localhost:4318/v1/logs
        tracesEndpoint: http://localhost:4318/v1/traces
```

For example, try using [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/) to visualize the traces of your local application.