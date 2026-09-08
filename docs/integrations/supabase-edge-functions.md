---
sidebar_position: 11
title: Supabase Edge Functions
---

#  Use DBOS On Supabase Edge Functions

You can use DBOS to add durable workflows, background jobs, or AI agents to your Supabase project.
We recommend the following architecture:

1. Enqueue workflows for execution from an [Edge Function](https://supabase.com/docs/guides/functions) using the [DBOS client](../typescript/reference/client.md).
2. Create a DBOS worker in a second Edge Function to serverlessly dequeue and execute your workflows.
3. Configure a [pg_cron](https://supabase.com/docs/guides/cron) job that starts your worker whenever there is new work for it to execute.

Both functions connect to your project's Postgres database, so DBOS checkpoints your workflows next to the rest of your data.
Because an Edge Function is terminated when it exhausts its CPU or wall-clock budget, connect your worker to [Conductor](../production/conductor.md), which detects the disconnect and recovers interrupted workflows onto the next worker that starts.

:::info

You can check out a working example of this integration [on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/supabase-edge-functions).
:::

## 1. Enqueue Workflows From an Edge Function

First, enqueue workflows using the [DBOS client](../typescript/reference/client.md).

```ts title="supabase/functions/enqueue/index.ts"
import { DBOSClient } from "npm:@dbos-inc/dbos-sdk@4.27.6";

// Cached per isolate; Supabase reuses isolates across invocations.
const client = await DBOSClient.create({
  systemDatabaseUrl: Deno.env.get("DBOS_SYSTEM_DATABASE_URL")!,
  applicationName: "supabase-edge-functions",
});

Deno.serve(async (req) => {
  const task = await req.json();
  const handle = await client.enqueue(
    { queueName: "supabase-queue", workflowName: "processTask" },
    task,
  );
  return Response.json({ workflowID: handle.workflowID });
});
```

You can also use the client to list past workflows or retrieve their results.

The `applicationName` you pass to the client must match the name your worker is configured with, as queues are scoped by application name.

## 2. Create a Worker Edge Function

Next, create a DBOS worker in a second Edge Function.
In it, define and register your workflows and steps:

```ts title="supabase/functions/worker/index.ts"
import { DBOS } from "npm:@dbos-inc/dbos-sdk@4.27.6";

async function validate(task: Task) { /* ... */ }
async function transform(task: Task) { /* ... */ }

async function processTaskFn(task: Task) {
  const validated = await DBOS.runStep(() => validate(task), { name: "validate" });
  return await DBOS.runStep(() => transform(validated), { name: "transform" });
}

DBOS.registerWorkflow(processTaskFn, { name: "processTask" });
```

Then configure and launch DBOS, register your queue, and process its workflows as a [background task](https://supabase.com/docs/guides/functions/background-tasks), so the function answers its caller immediately instead of holding the request open until the workflows finish.

```ts title="supabase/functions/worker/index.ts"
async function processWorkflows() {
  DBOS.setConfig({
    name: "supabase-edge-functions",
    systemDatabaseUrl: Deno.env.get("DBOS_SYSTEM_DATABASE_URL")!,
    applicationVersion: "v1",
  });
  await DBOS.launch({ conductorKey: Deno.env.get("DBOS_CONDUCTOR_KEY") });
  try {
    await DBOS.registerQueue("supabase-queue");
    // Run until the queue is empty, then exit. If Supabase terminates the function
    // first, Conductor recovers the in-flight workflows onto the next worker.
    while (true) {
      const workflows = await DBOS.listWorkflows({
        status: ["ENQUEUED", "PENDING"],
        applicationName: "supabase-edge-functions",
        limit: 1,
      });
      if (workflows.length === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } finally {
    await DBOS.shutdown();
  }
}

let processing = false;

Deno.serve(() => {
  // Launch DBOS at most once per Edge Functions isolate
  if (processing) {
    return Response.json({ accepted: false, reason: "already-processing" });
  }
  processing = true;
  // waitUntil keeps the isolate alive until processing is complete
  EdgeRuntime.waitUntil(
    processWorkflows()
      .catch((e) => console.error(e))
      .finally(() => {
        processing = false;
      }),
  );
  return Response.json({ accepted: true });
});
```

## 3. Schedule the Worker With pg_cron

Finally, configure a [pg_cron](https://supabase.com/docs/guides/cron) job to start your worker whenever there is new work for it.
This function periodically checks your database for active (`ENQUEUED` or `PENDING`) workflows.
If there are any, it launches a worker to process them.

```sql title="supabase/sql/02_cron.sql"
select cron.schedule(
  'dbos-worker-tick',
  '* * * * *',
  $$
  -- Start a worker by POSTing to it with your service role key...
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := jsonb_build_object('source', 'cron'),
    timeout_milliseconds := 5000
  )
  -- ...but only when there are workflows waiting to be executed.
  where exists (
    select 1
      from dbos.workflow_status
     where application_name = 'supabase-edge-functions'
       and status in ('ENQUEUED', 'PENDING')
  );
  $$
);
```

You can check out a working example of this integration (with deployment instructions) [on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/supabase-edge-functions).
