---
sidebar_position: 100
title: Admin API Reference
---

The DBOS library exposes an admin API to perform operations on durable workflows.
By default, this API is on port 3001, though this is configurable.

### Health Check

- **Endpoint**: `/dbos-healthz`
- **HTTP Method**: GET
- **Description**: Performs a health check on the application.
- **Response**:
  - **Status Code**: 200 OK if the system is healthy; otherwise, appropriate error codes.

### Workflow Recovery

- **Endpoint**: `/dbos-workflow-recovery`
- **Method**: POST
- **Description**: Recover all pending workflows associated with input executor IDs. Returns the IDs of all workflows queued for recovery.
- **Request Body Format**: JSON list of executors whose pending workflows to recover.
  - **Example**:
    ```json
    ["executor-id-1", "executor-id-2", "..."]
    ```
- **Response**:
  - **Status Code**: 200 OK on successful recovery initiation; otherwise, appropriate error codes.
  - **Body Format**: JSON list of the IDs of workflows queued for recovery.
  - **Example**:
    ```json
    ["workflow-uuid-1", "workflow-uuid-2", "..."]
    ```

### Deactivate

- **Endpoint**: `/deactivate`
- **Method**: GET
- **Description**: Deactivate an executor. A deactivated executor may complete active workflows and recover `PENDING` workflows, but may not start new workflows or dequeue workflows.
- **Response**:
  - **Status Code**: 200 OK if the request succeeeded; otherwise, appropriate error codes.
