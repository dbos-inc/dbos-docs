---
sidebar_position: 15
title: Vercel
---

You can use DBOS to add durable background workflows, background jobs, or AI agents to your Next.js app hosted on Vercel.
Here's how.

:::info

You can check out a working example of this integration [on GitHub](https://github.com/dbos-inc/dbos-vercel-integration).
:::


## 1. Create a Worker in a Vercel Functions

When using DBOS with Vercel, we recommend serverlessly executing workflows in [Vercel Functions](https://vercel.com/docs/functions).
First, define and register your workflows, steps, and queues:

```ts title="app/api/dbos/route.ts"
// Define a workflow and steps
async function stepOne() {
  // Sleep 3 seconds
  await new Promise((resolve) => setTimeout(resolve, 3000));
  DBOS.logger.info('Step one completed!');
}

async function stepTwo() {
  // Sleep 3 seconds
  await new Promise((resolve) => setTimeout(resolve, 3000));
  DBOS.logger.info('Step two completed!');
}

async function exampleFunction() {
  await DBOS.runStep(() => stepOne(), { name: 'stepOne' });
  await DBOS.runStep(() => stepTwo(), { name: 'stepTwo' });
}

// Register your workflows and queues with DBOS
DBOS.registerWorkflow(exampleFunction, {
  name: 'exampleWorkflow',
});
new WorkflowQueue('exampleQueue');
```

Then, configure and launch DBOS on worker startup.
When started, the workflow will poll your queues, waiting until all enqueued workflows complete or a timeout is reached.
If some workflows are still executing when the worker times out, don't worry&mdash;DBOS will automatically recover them when the worker next starts.

```ts title="app/api/dbos/route.ts"
// Configure and launch DBOS. It will automatically dequeue and execute workflows.
DBOS.setConfig({
  name: 'dbos-vercel-integration',
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  runAdminServer: false,
});
await DBOS.launch();

// After the worker Vercel function is launched,
// it waits for either all enqueued workflows
// to complete or for a timeout to be reached
async function waitForQueuedWorkflowsToComplete(timeoutMs: number): Promise<void> {
  const startTime = Date.now();
  const intervalMs = 1000;
  while (true) {
    if (Date.now() - startTime >= timeoutMs) {
      throw new Error(`Timeout reached after ${timeoutMs}ms - queued workflows still exist`);
    }
    const queuedWorkflows = await DBOS.listQueuedWorkflows({});
    if (queuedWorkflows.length === 0) {
      console.log('All queued workflows completed');
      return;
    }
    console.log(`${queuedWorkflows.length} workflows still queued, waiting...`);
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }
}

export async function GET(request: Request) {
  waitUntil(waitForQueuedWorkflowsToComplete(300000));
  return new Response(`Starting DBOS worker! Request URL: ${request.url}`);
}
```

## 2. Schedule the Worker with Cron

Next, configure a [Vercel cron job](https://vercel.com/docs/cron-jobs) to periodically launch your worker to poll for new workflows to execute.
Vercel will automatically scale the worker function to handle your workflows.

For example, you might configure your worker to poll for new workflows once a minute:

```json title="vercel.json"
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/dbos",
      "schedule": "* * * * *"
    }
  ]
}
```

## 3. Enqueue Workflows From Server Actions

Now that your worker is ready, you can enqueue workflows directly from your Next.js app using a [DBOS client](../typescript/reference/client.md) from your [server actions](https://nextjs.org/docs/app/getting-started/updating-data).

For example, here's a server action that enqueues a workflow to execute in the background on your worker:

```ts title="app/actions.ts"
'use server';

import { DBOSClient } from '@dbos-inc/dbos-sdk';

export async function enqueueWorkflow() {
    console.log('Enqueueing DBOS workflow');
    const client = await DBOSClient.create({ systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL });
    await client.enqueue({
        workflowName: 'exampleWorkflow',
        queueName: 'exampleQueue',
    });
    await client.destroy();
}
```

You can also create server actions to view your workflows or retrive their results.
For example, here's a server action that lists all workflows from newest to oldest:

```ts title="app/actions.ts"
'use server';

import { DBOSClient } from '@dbos-inc/dbos-sdk';

export async function listWorkflows() {
    console.log('Listing DBOS workflows');
    const client = await DBOSClient.create({ systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL });
    const workflows = await client.listWorkflows({
      workflowName: 'exampleWorkflow',
      sortDesc: true,
    });
    await client.destroy();
    return workflows;
}
```