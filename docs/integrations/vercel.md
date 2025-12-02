---
sidebar_position: 15
title: Vercel
---

#  Use DBOS On Vercel

You can use DBOS to add durable background workflows, background jobs, or AI agents to your Next.js app hosted on Vercel.
We recommend the following architecture:

1. In your Next.js app, enqueue workflows for execution using the [DBOS Client library](../typescript/reference/client.md).
2. Create a DBOS worker in a [Vercel Function](https://vercel.com/docs/functions) to serverlessly dequeue and execute your workflows.
3. Configure a [Vercel cron job](https://vercel.com/docs/cron-jobs) to periodically poll your worker for new workflows to execute.


:::info

You can check out a working example of this integration [on GitHub](https://github.com/dbos-inc/dbos-vercel-integration).
:::


## 1. Enqueue Workflows From Server Actions

First, enqueue workflows from your Next.js app using the [DBOS client library](../typescript/reference/client.md) in your [server actions](https://nextjs.org/docs/app/getting-started/updating-data).

For example, here's a server action that enqueues a workflow to execute in the background:

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

You can also use the client to list past workflows or retrieve their results.

## 2. Create a Worker in a Vercel Functions

Next, create a DBOS worker in a [Vercel Function](https://vercel.com/docs/functions) to serverlessly dequeue and execute your workflows.
In the Vercel Function, define and register your workflows, steps, and queues:

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
When started, the worker will poll your queues, waiting until all enqueued workflows complete or a timeout is reached.
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

## 3. Schedule the Worker with Cron

Finally, configure a [Vercel cron job](https://vercel.com/docs/cron-jobs) to periodically poll your worker for new workflows to execute.
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
