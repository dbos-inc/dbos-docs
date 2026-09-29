---
sidebar_position: 13
title: Concurrent Executions
description: How DBOS detects concurrent executions of the same workflow and converges every observer on a single recorded outcome
---

DBOS guarantees that every workflow runs to completion: if an executor crashes or becomes unreachable, another executor recovers its `PENDING` workflows and re-executes them from their last completed step.

The component responsible for recovery, e.g., [DBOS Conductor](../conductor/overview.md), detects unhealthy executors and triggers recovery of its workflows. Sometimes, for example during the rollout of a new application image, that observation can be wrong, and a "zombie" executor could still be running your workflow.

This means the same workflow instance could be running on two executors. (DBOS detects and prevents concurrent executions of the same workflow on the same executor.)

DBOS is designed so that step and workflow invariants are preserved during these situations: steps get at-least-once guarantees and workflow outcomes are persisted exactly-once.

## Workflow Ownership

DBOS detects concurrent executions by tracking which execution **owns** each workflow.
When an execution starts running a workflow (because the workflow was started, dequeued, recovered, or resumed), it generates a unique ownership token, records it in the workflow's row in the [`workflow_status`](./system-tables.md#dbosworkflow_status) table, and keeps it in memory.
Control-plane operations, such as cancelling, resuming, rewinding, or recovering a workflow, clear the recorded token.

Every time an execution writes a checkpoint for the workflow, it first checks, in the same database transaction, that the recorded token still matches its own.
If the token no longer matches, the execution has lost ownership: another execution has taken over the workflow, or it was cancelled.
The checkpoint is not written, and the execution stops running the workflow and **parks**, _i.e._, it waits for the workflow's recorded outcome to become visible in the database, then delivers that recorded outcome through its own handle.
For example, if a "zombie" executor keeps running a workflow after it has been recovered elsewhere, its next checkpoint fails the ownership check, so it stops, and its handle returns the result recorded by the execution that owns the workflow.
Similarly, when you cancel a running workflow, its execution stops at its next checkpoint.

When an execution loses ownership, DBOS throws an exception inside the workflow (`DBOSWorkflowConflictIDError` in Python, `DBOSWorkflowConflictError` in TypeScript, `DBOSWorkflowExecutionConflictException` in Java) or returns an error ([`ErrConflictingWorkflowID`](../golang/reference/workflows-steps.md#errors) in Go).
Do not catch and ignore that error: no subsequent work in the workflow will be made durable.

Separately, if a single execution records a result for a step and then tries to record a different result for the same step, DBOS throws a step nondeterminism error (`DBOSStepNondeterminismError` in Python and TypeScript).
This indicates that the workflow is not deterministic (see determinism requirements in [Python](../python/tutorials/workflow-tutorial.md#determinism) and [TypeScript](../typescript/tutorials/workflow-tutorial.md#determinism)).
