---
sidebar_position: 30
title: Distributed Recovery
---

If your application is connected to [DBOS Conductor](./overview.md), workflow recovery is automatic.
When Conductor detects that an executor is unhealthy, it automatically signals another executor to recover its workflows.

When an executor disconnects from Conductor, its status is changed to `DISCONNECTED` while Conductor waits for it to reconnect.
If it has not reconnected after a certain period of time, its status is changed to `DEAD` and Conductor signals another executor to recover its workflows.
After recovery is confirmed, Conductor deletes its record of the executor.

By default, the executor timeout is 60 seconds, so Conductor waits 60 seconds after an executor disconnects before recovering its workflows.
You can configure the executor timeout per application from the DBOS Console.

<img src={require('@site/static/img/conductor/grace-period.png').default} alt="Workflow Timeout Configuration" width="800" className="custom-img"/>
