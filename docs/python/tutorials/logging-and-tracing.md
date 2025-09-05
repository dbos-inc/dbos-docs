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
  "name": "my-app"
  "log_level": "INFO"
}
DBOS(config=config)
```


### Tracing 

DBOS automatically constructs [OpenTelemetry](https://opentelemetry.io/) traces of all workflows and their steps.
If you are using FastAPI or Flask, it also automatically traces each HTTP request.

DBOS constructs hierarchical [spans](https://opentelemetry.io/docs/concepts/signals/traces/#spans) for workflows and each of their steps.
For example, if a FastAPI HTTP endpoint calls a workflow that calls a transaction, DBOS constructs a trace encompassing the entire request, with spans for the HTTP endpoint, the workflow, and the transaction.
The transaction span is a child of the workflow span, which is a child of the HTTP endpoint span.
You can access your current span via [`DBOS.span`](../reference/contexts.md#span).


### OpenTelemetry Export

You can export DBOS traces and logs to any OpenTelemetry Protocol (OTLP)-compliant receiver.

You can [configure](../reference/configuration.md) exporters through the DBOS constructor.
For example:

```python
config: DBOSConfig = {
  "name": "my-app"
  "otlp_traces_endpoints": ["http://localhost:4318/v1/traces"]
  "otlp_logs_endpoints": ["http://localhost:4318/v1/traces"]
}
DBOS(config=config)
```


For example, try using [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/) to visualize the traces of your local application.