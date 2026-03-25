---
sidebar_position: 55
title: Next.js
---

# DBOS + Next.js

:::info
To learn how to run DBOS with Next.js on Vercel, see the [Vercel integration guide](./vercel.md).

:::

This guide shows you how to add DBOS durable workflows to a [Next.js](https://nextjs.org/) application.

Running DBOS directly inside the Next.js process is difficult because modules containing DBOS workflows and queues may be evaluated multiple times in different contexts.
Instead, we recommend a two-process architecture:

1. A **Next.js app** that enqueues workflows using the [DBOS client](../typescript/reference/client.md) from [server actions](https://nextjs.org/docs/app/getting-started/updating-data).
2. A **DBOS worker** that dequeues and executes workflows.

Both processes connect to the same Postgres database.

You can see a full working example on [GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/dbos-nextjs-starter).

## Installation

```shell
npm install @dbos-inc/dbos-sdk @dbos-inc/otel
```

## 1. Create a Worker

Create a standalone script that registers your workflows and launches DBOS.
When started, it will automatically dequeue and execute workflows.

```ts title="worker/index.ts"
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const taskQueue = new WorkflowQueue("task_queue");

async function greetingWorkflowFn(name: string) {
  return await DBOS.runStep(
    async () => `Hello, ${name}!`,
    { name: "generateGreeting" }
  );
}

DBOS.registerWorkflow(greetingWorkflowFn);

async function main() {
  DBOS.setConfig({
    name: "my-nextjs-app",
    systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
    runAdminServer: false,
  });
  await DBOS.launch();
  console.log("Worker listening for workflows...");
}

main().catch(console.error);
```

## 2. Enqueue Workflows from Server Actions

In your Next.js app, use the [DBOS client](../typescript/reference/client.md) to enqueue workflows and check their status.
The client connects directly to the DBOS system database without needing a full DBOS launch.

```ts title="app/actions.ts"
"use server";

import { DBOSClient } from "@dbos-inc/dbos-sdk";

async function getClient() {
  return DBOSClient.create({
    systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL!,
  });
}

export async function launchWorkflow(name: string) {
  const client = await getClient();
  try {
    const handle = await client.enqueue(
      {
        workflowName: "greetingWorkflowFn",
        queueName: "task_queue",
      },
      name
    );
    return { workflowID: handle.workflowID };
  } finally {
    await client.destroy();
  }
}

export async function getWorkflowStatus(workflowID: string) {
  const client = await getClient();
  try {
    const handle = client.retrieveWorkflow<string>(workflowID);
    const status = await handle.getStatus();
    let result: string | null = null;
    if (status?.status === "SUCCESS") {
      result = await handle.getResult();
    }
    return { status: status?.status ?? "UNKNOWN", result };
  } finally {
    await client.destroy();
  }
}
```

Then call these server actions from your page:

```tsx title="app/page.tsx"
"use client";

import { useState } from "react";
import { launchWorkflow, getWorkflowStatus } from "./actions";

export default function Home() {
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    const { workflowID } = await launchWorkflow("World");
    // Poll until the workflow completes
    const interval = setInterval(async () => {
      const data = await getWorkflowStatus(workflowID);
      if (data.status === "SUCCESS") {
        setResult(data.result);
        clearInterval(interval);
      }
    }, 500);
  }

  return (
    <div>
      <button onClick={handleClick}>Launch Workflow</button>
      {result && <p>{result}</p>}
    </div>
  );
}
```

