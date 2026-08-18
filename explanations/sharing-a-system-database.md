---
sidebar_position: 12
title: Sharing a System Database
---

Multiple DBOS applications, potentially in different languages, can share a single system database.
Each application is identified by its configured name and owns everything it creates: workflows, steps, queues, schedules, and application versions.
Applications sharing a system database are isolated from one another by default, but can freely interoperate by naming each other.
For example, one application can enqueue another's workflows and wait for their results.

## Application Names and Ownership

Every application is identified by the `name` in its configuration, so each application sharing a system database must have a distinct name.
Ownership determines which application runs what:

- A workflow is dequeued, run, and recovered only by the application that owns it.
- A queue is polled only by the application that registered it, even if another application enqueues workflows on it.
- A schedule is fired only by the application that created it, and its workflows are owned by that application.
- Application versions are tracked per application, so one application's deployments do not affect which version its peers consider latest.

Queue, schedule, and version names remain globally unique across all applications sharing a system database; registering a name that a different application already owns raises an error.
Workflow IDs are also unique across the entire system database, so ID-addressed operations (retrieving a workflow's handle, status, or result by ID, and sending messages or reading events and streams) work across applications regardless of ownership.
Observability queries (`list_workflows`, `list_queues`, `list_schedules`) are scoped to the calling application by default.

## Calling Another Application's Workflows

To run another application's workflow, enqueue it by name, naming the application that implements it.
The enqueued workflow is owned by the target application, which dequeues and runs it on its latest application version.
Because workflow IDs are global, you can then wait for the result from the returned handle.

<Tabs groupId="language">
<TabItem value="python" label="Python">

```python
from dbos import DBOS, EnqueueOptions

options: EnqueueOptions = {
    "workflow_name": "process_order",
    "queue_name": "orders",
    # The name of the application that implements process_order
    "application_name": "order-service",
}
handle = DBOS.enqueue_workflow_with_options(options, "order-123")
result = handle.get_result()
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
const handle = await DBOS.enqueueWorkflowWithOptions({
  workflowName: "process_order",
  queueName: "orders",
  // The name of the application that implements process_order
  applicationName: "order-service",
}, "order-123");
const result = await handle.getResult();
```

</TabItem>
</Tabs>

If the applications are written in different languages, also set the serialization type to portable so the target application can read the arguments.
See [Cross-Language Interaction](./portable-workflows.md) for details.

You can do the same from a [DBOS Client](../python/reference/client.md), which additionally supports registering queues, creating schedules, and debouncing workflows on behalf of a named application.
Always set the client's application name if multiple applications share a system database.

## Unowned Rows

Workflows, queues, schedules, and versions created before upgrading to a DBOS version supporting application names, or created by a client with no application name, are owned by no application.
Every application treats unowned rows as its own: any application may dequeue an unowned workflow (claiming ownership of it when it does), and every application fires unowned schedules and polls unowned queues.

:::warning

To ensure no rows are unowned, always pass an application name to your clients when interacting with a system database shared by multiple applications
:::

Before adding a second application to a system database, explicitly transfer ownership of any unowned rows to the first application:

```shell
dbos rename-application --to my-app --adopt-unclaimed-rows
```

## Renaming an Application

Because ownership is recorded under the application's name, renaming an application requires transferring ownership of its rows.
To rename an application, first stop it, then run `dbos rename-application` ([Python](../python/reference/cli.md#dbos-rename-application), [TypeScript](../typescript/reference/cli.md#npx-dbos-rename-application)), then restart it under its new name:

```shell
dbos rename-application --from old-name --to new-name
```
