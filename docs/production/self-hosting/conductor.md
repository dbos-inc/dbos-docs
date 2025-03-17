---
sidebar_position: 10
title: DBOS Conductor
---

The simplest way to operate DBOS durable workflows in production is to connect your application to DBOS Conductor.
Conductor is a managed service for operating DBOS applications.
It provides:

- [**Distributed workflow recovery**](./workflow-recovery.md): Conductor automatically detects when the execution of a durable workflow is interrupted (for example, if its executor is restarted, interrupted, or crashes) and recovers the workflow to another healthy executor.
- [**Workflow and queue observability**](./workflow-management.md): Conductor provides dashboards of all active and past workflows and all queued tasks, including their status, inputs, outputs, and steps.
- [**Workflow and queue management**](./workflow-management.md): From the Conductor dashboard, cancel, resume, or restart any workflow execution and manage the tasks in your distributed queues.


## Connecting To Conductor

:::tip
Conductor runs totally out-of-band, so if your connection is interrupted your applications will continue operating normally.
:::

To connect your application to Conductor, first register your application on the [DBOS console](https://console.dbos.dev).
The name you register must match the name you give your application in its configuration.

Next, generate an API key.
By default, API keys do not expire, though they may be revoked at any time:

Finally, supply that API key to your DBOS application to connect it to Conductor:
<LargeTabs groupId="language" queryString="language">
<LargeTabItem value="python" label="Python">

```python
conductor_key=os.environ.get("DBOS_CONDUCTOR_KEY", None)

DBOS(conductor_key=conductor_key)
```
</LargeTabItem>
<LargeTabItem value="typescript" label="TypeScript">
</LargeTabItem>
</LargeTabs>

## Managing Conductor Applications

You can view all applications registered with Conductor on the DBOS Console:

On your application's page, you can see all executors (processes) running that application that are currently connected to Conductor:

An application is available to Conductor if there is at least one process running that application currently connected to Conductor.
Conductor has no access to your application's database or private data&mdash;it implements features like [workflow management](./workflow-management.md) by communicating with connected executors.
Thus, those features can only be used while your application is available.