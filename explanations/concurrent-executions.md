# Concurrent Executions

> How DBOS detects concurrent executions of the same workflow and converges every observer on a single recorded outcome

DBOS guarantees that every workflow runs to completion: if an executor crashes or becomes unreachable, another executor recovers its `PENDING` workflows and re-executes them from their last completed step.

The component responsible for recovery, e.g., [DBOS Conductor](../production/conductor.md), detects unhealthy executors and triggers recovery of its workflows. Sometimes, for example during the rollout of a new application image, that observation can be wrong, and a "zombie" executor could still be running your workflow.

This means the same workflow instance could be running on two executors. (DBOS detects and prevents concurrent executions of the same workflow on the same executor.)

DBOS is designed so that step and workflow invariants are preserved during these situations: steps get at-least-once guarantees and workflow outcomes are persisted exactly-once.

A concurrent execution is detected at two points: when an execution checkpoints a completed step, and when it records the workflow's terminal outcome.
In both cases, DBOS detects whether a conflicting checkpoint already exists for the step/workflow, and if so, **parks** the execution, _i.e._, it waits for the workflow's recorded outcome to become visible in the database, then delivers that recorded outcome through its own handle.

When DBOS detects a concurrent execution at the step boundary, it throws an exception (`DBOSWorkflowConflictIDError` in Python, `DBOSWorkflowConflictError` in TypeScript, `DBOSWorkflowExecutionConflictException` in Java) or returns an error ([`ErrConflictingWorkflowID`](../golang/reference/workflows-steps.md#errors) in Go). Do not ignore that error: no subsequent work in the workflow will be made durable.

Further, in the case of checkpointing the outcome of a workflow, if DBOS finds that the workflow status is not `PENDING`, DBOS decides that the current execution doesn't own the outcome anymore, and parks.
