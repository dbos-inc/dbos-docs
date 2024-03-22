---
sidebar_position: 25
title: Self-Hosting
description: Learn how to self-host DBOS Transact applications
---

You can run DBOS applications anywhere as long as they have a Postgres database to connect to.
This guide describes tools that make it easy to self-host DBOS applications in production.

## Admin API

DBOS Transact exposes an admin, by default on port 3001.
The admin port is not configurable and is always +1 of the main DBOS Transact port (3000 by default).

### Health Check

- **Endpoint**: `/dbos-healthz`
- **HTTP Method**: GET
- **Description**: Performs a health check on the application.
- **Response**:
  - **Status Code**: 200 OK if the system is healthy; otherwise, appropriate error codes.

### Workflow Recovery

This endpoint allows you to schedule the recovery of pending workflows after their origin execution environment terminated.
Of course, pending workflows will resume where they left off!

- **Endpoint**: `/dbos-workflow-recovery`
- **Method**: POST
- **Description**: Recovers all pending workflows associated with input executor IDs (e.g., a virtual machine ID). Returns the UUIDs of all workflows recovered.
- **Request Body Format**: JSON
  - **Attributes**:
    - `executors`: A list of ID strings representing the executors (e.g., virtual machines) whose pending workflows to recover.
  - **Example**:
    ```json
    {
      "executors": ["executor-id-1", "executor-id-2", "..."]
    }
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

At the core if DBOS Transact is state management for workflows, to provide [reliability guarantees](./workflow-tutorial#reliability-guarantees).
When the execution environment hosting a DBOS Transact application is terminated (for any reason), a new instance can take over pending workflows and resume their execution exactly where they left off. A common scenario for workflow recovery are maintainance windows where you need to drain all your nodes. You can restart execution environments and instruct them to resume pending workflows.

## Configuring OTLP Telemetry

DBOS Transact operations emit [OpenTelemetry](https://opentelemetry.io/) traces. When a [handler](./http-serving-tutorial) receives a request, it attempts to load a [trace context](https://opentelemetry.io/docs/concepts/context-propagation/). If none is found, the handler will create a new trace.

Traces are periodically exported from a DBOS Transact application using the [OpenTelemetry Protocol](https://opentelemetry.io/docs/specs/otlp/) (OTLP)
You can configure an exporter in the telemetry section of the [configuration file](../api-reference/configuration). For example:
```yaml
telemetry:
    OTLPExporter:
        logsEndpoint: http://localhost:4318/v1/logs
        tracesEndpoint: http://localhost:4318/v1/traces
```

You can export traces, out of the box, to any OTLP compliant receiver. Try it out with [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/)!

DBOS Transact uses the [opentelemetry-js](https://github.com/open-telemetry/opentelemetry-js/) package to implement tracing.
You can access trace objects using DBOS Transact [contexts](../api-reference/contexts). For example, to add a custom event to a workflow span:
```javascript
  @Transaction()
  static async txn(ctxt: TransactionContext) {
    ...
    ctxt.span.addEvent("An important event")
    ...
  }
}
```
