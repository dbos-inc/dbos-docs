---
sidebar_position: 27
title: Workflow Retention Policies
---

If you are using [Conductor](./conductor.md), you can configure workflow history retention policies for your application from the Retention Policy page of the DBOS Console.
These settings let you configure how long workflow history is retained in your application's [system database](../explanations/system-tables.md).
This is useful for managing the database disk usage of workflow history.
Retention is **opt-in**: by default, no policy is set and Conductor never deletes workflow history or cancels workflows.
Nothing runs for an application until you set at least one of the thresholds below.
If multiple applications [share a system database](../explanations/sharing-a-system-database.md), each application's retention policies and global timeout apply only to workflow history it owns.

<img src={require('@site/static/img/retention/retention-conductor.png').default} alt="Retention Page" width="1000" className="custom-img" />

### Time Threshold

If a time threshold is set, workflow history is only retained for X hours.
History of completed workflows that started more than X hours ago is automatically deleted.
Time-based retention is disabled by default.

### Rows Threshold

If the rows threshold is set, history is only retained for the last X completed workflows.
History of additional completed workflows is automatically deleted.
Rows-based retention is disabled by default.
Applications created before retention became opt-in keep the rows threshold they already had (formerly 1,000,000 rows by default); clear it from the Retention Policy page to disable it.
You can set both a rows threshold and a time threshold.

### Global Timeout

If a global timeout is set, any workflow that has not completed X hours after it was created (started or enqueued) is automatically cancelled.
By default, the global timeout is disabled.