---
sidebar_position: 40
title: Self-Hosting
description: Learn how to self-host DBOS Transact applications
---

You can run DBOS Transact applications anywhere with [`npx dbos start`](../../reference/tools/cli.md#npx-dbos-start) as long as they have a Postgres database to connect to.
This guide describes tools you can use in your hosting environment to make the most of DBOS Transact.

## Admin API

DBOS applications expose an admin API, fixed at one above the main DBOS application port (the main port defaults to port 3000, so the admin API defaults to port 3001).
It provides the following endpoints:

### Health Check

- **Endpoint**: `/dbos-healthz`
- **HTTP Method**: GET
- **Description**: Performs a health check on the application.
- **Response**:
  - **Status Code**: 200 OK if the system is healthy; otherwise, appropriate error codes.

### Workflow Recovery


- **Endpoint**: `/dbos-workflow-recovery`
- **Method**: POST
- **Description**: Recovers all pending workflows associated with input [executor IDs](#managing-workflow-recovery). Following our [reliability guarantees](../programmingmodel/workflow-tutorial.md#reliability-guarantees), all workflows will resume from where they left off. Returns the UUIDs of all workflows recovered.
- **Request Body Format**: JSON list of executors whose pending workflows to recover.
  - **Example**:
    ```json
    ["executor-id-1", "executor-id-2", "..."]
    ```
- **Response**:
  - **Status Code**: 200 OK on successful recovery initiation; otherwise, appropriate error codes.
  - **Body Format**: JSON list of UUIDs representing the workflows that were successfully queued for recovery.
  - **Example**:
    ```json
    ["workflow-uuid-1", "workflow-uuid-2", "..."]
    ```

### Performance Metrics

- **Endpoint**: `/dbos-perf`
- **HTTP Method**: GET
- **Description**: Provides a snapshot of the application's event loop utilization since the last request to `/dbos-perf`. Implemented using the [Node.js performance API](https://nodejs.org/api/perf_hooks.html#performanceeventlooputilizationutilization1-utilization2).
- **Response**:
  - **Status Code**: 200 OK if metrics are successfully fetched; otherwise, appropriate error codes.
  - **Body Format**: JSON
    - **Fields**:
      - `active`: Time in milliseconds the event loop has been active since the last call to `/dbos-perf`.
      - `idle`: Time in milliseconds the event loop has been idle since the last call to `/dbos-perf`.
      - `utilization`: The percentage of time the event loop is active.
  - **Example**:
    ```json
    {
      "active": "200",
      "idle": "800",
      "utilization": "0.2"
    }
    ```

## Managing Workflow Recovery

By default, when a DBOS application starts up, it recovers all pending workflows, resuming them from where they left off following our [reliability guarantees](../programmingmodel/workflow-tutorial.md#reliability-guarantees).
This behavior works well when you're only running a single instance of an application, as it guarantees that every time the server is restarted, it resumes all workflows from where they left off.
However, it is less ideal for a distributed setting where you're running many instances of an application on different servers.

To manage recovery in a distributed setting, you can assign each instance of an application an executor ID by setting the `DBOS__VMID` environment variable.
This causes the application instance to associate every workflow it executes with that executor ID.
When an application instance with an executor ID restarts, it only recovers pending workflows assigned to that executor ID.
You can also instruct it to recover workflows assigned to other executor IDs through the [admin API](#managing-workflow-recovery).

## Configuring OTLP Telemetry

DBOS operations emit [OpenTelemetry](https://opentelemetry.io/) traces. When a [handler](../requestsandevents/http-serving-tutorial) receives a request, it attempts to load a [trace context](https://opentelemetry.io/docs/concepts/context-propagation/). If none is found, the handler will create a new trace. Handlers will inject a trace context to responses.

Traces are periodically exported from a DBOS application using the [OpenTelemetry Protocol](https://opentelemetry.io/docs/specs/otlp/) (OTLP)
You can configure an exporter in the telemetry section of the [configuration file](../../reference/configuration). For example:
```yaml
telemetry:
    OTLPExporter:
        logsEndpoint: http://localhost:4318/v1/logs
        tracesEndpoint: http://localhost:4318/v1/traces
```

You can export traces, out of the box, to any OTLP compliant receiver. Try it out with [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/)!

DBOS uses the [opentelemetry-js](https://github.com/open-telemetry/opentelemetry-js/) package to implement tracing.
You can access trace objects using DBOS [contexts](../../reference/transactapi/oldapi/contexts). For example, to add a custom event to a workflow span:
```javascript
  @Transaction()
  static async txn(ctxt: TransactionContext) {
    ...
    ctxt.span.addEvent("An important event")
    ...
  }
```
