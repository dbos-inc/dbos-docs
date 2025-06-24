---
sidebar_position: 50
title: Logging & Tracing
---

### Logging

For convenience, DBOS provides a pre-configured logger for you to use available at [`DBOS.logger`](../reference/transactapi/dbos-class#accessing-logging) that you can **optionally** use.
For example:

```javascript
DBOS.logger.info("Welcome to DBOS!");
```

You can [configure](../reference/configuration.md) the log level of this built-in logger.
This also configures the log level of the DBOS library:

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  logLevel: "info",
});
await DBOS.launch();
```

### Tracing

DBOS automatically constructs [OpenTelemetry](https://opentelemetry.io/) traces of all workflows and their steps.

DBOS constructs hierarchical [spans](https://opentelemetry.io/docs/concepts/signals/traces/#spans) for workflows and each of their steps.
For example, if an HTTP endpoint calls a workflow that calls a transaction, DBOS constructs a trace encompassing the entire request, with spans for the HTTP endpoint, the workflow, and the transaction.
The transaction span is a child of the workflow span, which is a child of the HTTP endpoint span.
You can access your current span via [`DBOS.span`](../reference/transactapi/dbos-class#accessing-the-tracing-span).

### OpenTelemetry Export

You can export DBOS traces to any OpenTelemetry Protocol (OTLP)-compliant receiver.

You can [configure](../reference/configuration.md) a custom export target.
For example:

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  otlpTracesEndpoints: ["http://localhost:4318/v1/traces"],
});
await DBOS.launch();
```

For example, try using [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/) to visualize the traces of your local application.
