---
sidebar_position: 1
title: Self-Hosting DBOS Apps
---

Because DBOS is implemented in lightweight TypeScript and Python libraries, you can run your DBOS application anywhere as long as it has a Postgres server to connect to.
This guide provides information on operating a self-hosted DBOS application.

## Self-Hosting On A Single Server

Self-hosting a DBOS application on a single server is simple: each time you restart your application's process, it recovers all workflows that were executing before the restart (all `PENDING` workflows).

However, it is important to be careful when upgrading your application's code.
When DBOS is launched, it computes an "application version" from a checksum of the code in your application's workflows (you can override this version through the `DBOS__APPVERSION` environment variable).
Each workflow is tagged with the version of the application that started it.
When a DBOS application starts, it does not recover workflows tagged with a different application version.
Thus, to safely recover workflows started on an older version of your code, you should start a process running that code version.

## Self-Hosting on Multiple Servers

When self-hosting in a distributed setting, it is important to manage workflow recovery so that when an executor crashes, restarts, or is shut down, its workflows are recovered.
You should assign each executor running a DBOS application an executor ID by setting the `DBOS__VMID` environment variable.
Each workflow is tagged with the ID of the executor that started it.
When an application with an executor ID restarts, it only recovers pending workflows assigned to that executor ID.
You can also instruct your executor to recover workflows assigned to other executor IDs through the [workflow recovery endpoint of the admin API](#workflow-recovery).

It is also important to be careful when upgrading your application's code.
When DBOS is launched, it computes an "application version" from a checksum of the code in your application's workflows (you can override this version through the `DBOS__APPVERSION` environment variable).
Each workflow is tagged with the version of the application that started it.
When a DBOS application starts, it does not recover workflows tagged with a different application version.
To safely recover workflows started on an older version of your code, you should start a process running that code version and use the [workflow recovery endpoint of the admin API](#workflow-recovery) to instruct it to recover workflows belonging to executors that ran old versions of DBOS.

## Admin API Reference

DBOS applications expose an admin API on port 3001.
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
- **Description**: Recover all pending workflows associated with input [executor IDs](#managing-workflow-recovery). Returns the IDs of all workflows queued for recovery.
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
