---
sidebar_position: 95
title: Workflow Retention Policies
---

You can configure workflow history retention policies for your application from the Retention Policy page of the DBOS Console.
These settings let you configure how long workflow history is retained in your application's [system database](../../explanations/system-tables.md).
This is useful for managing the database disk usage of workflow history.

Retention policies only delete the history of completed workflows (workflows with status `SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`); workflows that are still running, enqueued, or delayed are never deleted.
Deleting a workflow's history also deletes its steps, inputs, outputs, messages, events, and streams.

<img src={require('@site/static/img/retention/retention.png').default} alt="Retention Page" width="1000" className="custom-img" />

### Time Threshold

If a time threshold is set, workflow history is only retained for X hours after a workflow completes.
History of workflows that completed more than X hours ago is automatically deleted.
Time-based retention is disabled by default.

### Rows Threshold

If the rows threshold is set, history is only retained for the X most recently completed workflows.
History of older completed workflows is automatically deleted.
By default, the rows threshold is set to 1M rows.
You can set both a rows threshold and a time threshold.

### Global Timeout

If a global timeout is set, any workflow that has not completed X hours after it was created (started or enqueued) is automatically cancelled.
By default, the global timeout is disabled.