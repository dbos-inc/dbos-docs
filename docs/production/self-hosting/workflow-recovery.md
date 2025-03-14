---
sidebar_position: 50
title: Workflow Recovery
---

When an executor running DBOS durable workflows fails, crashes, or is interrupted, another executor must recover its workflows and resume their execution.
This guide describes how to manage workflow recovery in a production environment.

## Managing Recovery

### Recovery With Conductor

If your application is connected to [DBOS Conductor](./conductor.md), workflow recovery is automatic.
When Conductor detects that an executor is unhealthy, it automatically signals another executor to recover its workflows.

### Recovery On A Single Server

If hosting an application on a single server without Conductor, each time you restart your application's process, it recovers all workflows that were executing before the restart (all `PENDING` workflows).

### Recovery in a Distributed Setting

When self-hosting in a distributed setting without Conductor, it is important to manage workflow recovery so that when an executor crashes, restarts, or is shut down, its workflows are recovered.
You should assign each executor running a DBOS application an executor ID by setting the `DBOS__VMID` environment variable.
Each workflow is tagged with the ID of the executor that started it.
When an application with an executor ID restarts, it only recovers pending workflows assigned to that executor ID.
You can also instruct your executor to recover workflows assigned to other executor IDs through the [workflow recovery endpoint of the admin API](./admin-api.md#workflow-recovery).

## Managing Application versions

When self-hosting, it is important to be careful when upgrading your application's code.
When DBOS is launched, it computes an "application version" from a checksum of the code in your application's workflows (you can override this version through the `DBOS__APPVERSION` environment variable).
Each workflow is tagged with the version of the application that started it.
To prevent code compatibility issues, DBOS does not attempt to recover workflows tagged with a different application version.

To safely recover workflows started on an older version of your code, you should start a process running that code version.
If self-hosting using Conductor, that process will automatically recover all pending workflows of that code version.
If self-hosting without Conductor, you should use the [workflow recovery endpoint of the admin API](./admin-api.md#workflow-recovery) to instruct that process to recover workflows belonging to executors that ran old code versions.