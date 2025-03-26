---
sidebar_position: 10
title: DBOS Conductor
---

:::info

Conductor is currently in developer preview.
For access, please contact the team ([Discord](https://discord.gg/fMwQjeW5zg), [email](mailto:contact@dbos.dev)).

:::

The simplest way to operate DBOS durable workflows in production is to connect your application to DBOS Conductor.
Conductor is a managed service that helps you operate DBOS applications.
It provides:

- [**Distributed workflow recovery**](./workflow-recovery.md): In a distributed environment with many executors running durable workflows, Conductor automatically detects when the execution of a durable workflow is interrupted (for example, if its executor is restarted, interrupted, or crashes) and recovers the workflow to another healthy executor.
- [**Workflow and queue observability**](./workflow-management.md): Conductor provides dashboards of all active and past workflows and all queued tasks, including their status, inputs, outputs, and steps.
- [**Workflow and queue management**](./workflow-management.md): From the Conductor dashboard, cancel, resume, or restart any workflow execution and manage the tasks in your distributed queues.


## Connecting To Conductor

:::tip
Conductor is not part of your application's critical path.
If your connection to Conductor is interrupted, your applications will continue operating normally.
Recovery, observability, and workflow management will automatically resume once connectivity is restored.
:::

To connect your application to Conductor, first register your application on the [DBOS console](https://console.dbos.dev).
**The name you register must match the name you give your application in its configuration.**

<img src={require('@site/static/img/conductor/register-app.png').default} alt="Workflow List" width="800" className="custom-img"/>

Next, generate an API key.
By default, API keys do not expire, though they may be revoked at any time from the [key settings page](https://staging.console.dbos.dev/settings/apikey):

<img src={require('@site/static/img/conductor/conductor-key.png').default} alt="Workflow List" width="800" className="custom-img"/>

Finally, supply that API key to your DBOS application to connect it to Conductor.
This initiates a websocket connection with Conductor:
<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
conductor_key=os.environ.get("DBOS_CONDUCTOR_KEY", None)
DBOS(conductor_key=conductor_key)
```
</TabItem>
<TabItem value="typescript" label="TypeScript">

```javascript
const conductorKey = process.env.DBOS_CONDUCTOR_KEY
await DBOS.launch({conductorKey})
```
</TabItem>
</Tabs>

## Managing Conductor Applications

You can view all applications registered with Conductor on the DBOS Console:

<img src={require('@site/static/img/conductor/list-apps.png').default} alt="Workflow List" width="800" className="custom-img"/>

On your application's page, you can see all executors (processes) running that application that are currently connected to Conductor.
Executors are identified by a unique ID that they generate and print on startup.
When you restart an executor, it generates a new ID.

<img src={require('@site/static/img/conductor/app-page.png').default} alt="Workflow List" width="800" className="custom-img"/>

Conductor uses a WebSocket-based protocol to exchange workflow metadata and commands with your application.  An application is shown as _available_ in Conductor when at least one of its processes is connected.  Conductor has no access to your application's database or other private data.  As a result, workflow-related features are only available while your application is connected to Conductor over this metadata-only connection.
