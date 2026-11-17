---
sidebar_position: 30
title: Workflow Recovery
---

When the execution of a durable workflow is interrupted (for example, if its executor is restarted, interrupted, or crashes), the workflow must be recovered so it resumes from its last completed step.

Each workflow is tagged with the ID of the executor running it.
To **recover** an executor's workflows, DBOS re-enqueues all of that executor's `PENDING` workflows.
Any executor running a workflow's application version can then dequeue it and resume it from its last completed step.
An application only recovers its own workflows, so applications [sharing a system database](../explanations/sharing-a-system-database.md) never recover each other's workflows.

## Recovery With Conductor

If your application is connected to [DBOS Conductor](../conductor/overview.md), workflow recovery is automatic: when Conductor detects that an executor is unhealthy, it signals another executor to recover its workflows.
See [Distributed Recovery](../conductor/distributed-recovery.md) for details.

## Recovery Without Conductor

When an executor launches, it recovers its own `PENDING` workflows.
On a single server, this means that each time you restart your application, DBOS recovers all workflows that were executing before the restart.

In a distributed setting, give each executor a unique, stable executor ID through DBOS configuration ([Python](../python/reference/configuration.md#application-settings), [TypeScript](../typescript/reference/configuration.md#application-settings)).
An executor that restarts with the same ID recovers its own workflows.
If an executor is gone for good (for example, its host failed or it was scaled down), recover its workflows from any other executor:

<Tabs groupId="language">
<TabItem value="python" label="Python">

```python
handles = DBOS.recover_workflows(["executor-1"])
```

See [`DBOS.recover_workflows`](../python/reference/contexts.md#recover_workflows).

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
const handles = await DBOS.recoverWorkflows(["executor-1"]);
```

See [`DBOS.recoverWorkflows`](../typescript/reference/methods.md#dbosrecoverworkflows).

</TabItem>
</Tabs>

Recovery is safe to repeat: once a live executor dequeues a recovered workflow, the workflow belongs to that executor, so recovering the original executor again does not run it a second time.

Only recover executors you know have stopped.
If an executor is still running when its workflows are recovered, DBOS detects the [concurrent execution](../explanations/concurrent-executions.md) and records each workflow's outcome exactly once, but steps may execute more than once.
