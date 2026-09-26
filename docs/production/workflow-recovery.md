---
sidebar_position: 30
title: Workflow Recovery
---

When the execution of a durable workflow is interrupted (for example, if its executor is restarted, interrupted, or crashes), another executor must recover the workflow and resume its execution.
To prevent duplicate work, it is important to detect interruptions promptly and to recover each workflow only once.
This guide describes how to manage workflow recovery in a production environment.

## Managing Recovery

### Recovery On A Single Server

If hosting an application on a single server without Conductor, each time you restart your application's process, DBOS recovers all workflows that were executing before the restart (all `PENDING` workflows).

### Recovery in a Distributed Setting

When self-hosting in a distributed setting without Conductor, it is important to manage workflow recovery so that when an executor crashes, restarts, or is shut down, its workflows are recovered.
You should assign each executor running a DBOS application an executor ID through DBOS configuration.
Each workflow is tagged with the ID of the executor that started it.
When an application with an executor ID restarts, it only recovers pending workflows assigned to that executor ID and owned by that application, so applications [sharing a system database](../explanations/sharing-a-system-database.md) never recover each other's workflows.

### Recovery With Conductor

If your application is connected to [DBOS Conductor](../conductor/overview.md), workflow recovery is automatic: when Conductor detects that an executor is unhealthy, it signals another executor to recover its workflows.
See [Distributed Recovery](../conductor/distributed-recovery.md) for details.
