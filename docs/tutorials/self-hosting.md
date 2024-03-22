---
sidebar_position: 25
title: Self-Hosting
description: Learn how to self-host DBOS Transact applications
---

You can run DBOS applications anywhere as long as they have a Postgres database to connect to.
In this guide, we'll describe tools that make it easier to self-host DBOS applications in a production setting.

## Admin API

DBOS applications provide an admin API to more easily manage them.
By default, this API is hosted on port 3001.

### Health Check

- **Endpoint**: `/dbos-healthz`
- **HTTP Method**: GET
- **Description**: Performs a health check on the application.
- **Response**:
  - **Status Code**: 200 OK if the system is healthy; otherwise, appropriate error codes.

### Workflow Recovery

- **Endpoint**: `/dbos-workflow-recovery`
- **Method**: POST
- **Description**: Recovers all pending workflows associated with input executor IDs. Returns the UUIDs of all workflows recovered.
- **Request Body Format**: JSON
  - **Attributes**:
    - `executors`: A list of ID strings representing the executors whose pending workflows to recover.
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

TODO:

## Configuring OTLP Telemetry

TODO: @Max can you help write this?


