---
sidebar_position: 10
title: Learn DBOS TypeScript
pagination_next: typescript/tutorials/workflow-tutorial
pagination_prev: quickstart
---

This guide shows you how to use DBOS to build TypeScript apps that are **resilient to any failure**.

## 1. Setting Up Your App

To get started, initialize a DBOS template and install dependencies:

```shell
npx @dbos-inc/create@latest -t dbos-node-starter
cd dbos-node-starter
```

DBOS requires a Postgres database.
If you already have Postgres, you can set the `DBOS_SYSTEM_DATABASE_URL` environment variable to your connection string (later we'll pass that value into DBOS).
Otherwise, you can start Postgres in a Docker container with this command:

```shell
npx dbos postgres start
```

## 2. Workflows and Steps

DBOS helps you add reliability to TypeScript programs.  The key feature of DBOS is **workflow functions** comprised of **steps**&mdash;DBOS automatically provides durability by saving the state of your workflows and steps to its system database.  If your program crashes or is interrupted, DBOS uses this saved state to recover each of your workflows from its last completed step.  Thus, DBOS makes your application **resilient to any failure**.

Let's create a simple DBOS program that runs a workflow of two steps.  Replace all the code in `src/main.ts` with the following:

```javascript showLineNumbers title="src/main.ts"
import { DBOS } from "@dbos-inc/dbos-sdk";

async function stepOne() {
  DBOS.logger.info("Step one completed!");
}

async function stepTwo() {
  DBOS.logger.info("Step two completed!");
}

async function exampleFunction() {
  await DBOS.runStep(() => stepOne(), {name: "stepOne"});
  await DBOS.runStep(() => stepTwo(), {name: "stepTwo"});
}
const exampleWorkflow = DBOS.registerWorkflow(exampleFunction);

async function main() {
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  });
  await DBOS.launch();
  await exampleWorkflow();
  await DBOS.shutdown();
}

main().catch(console.log);
```

Now, build and run this code with:

```shell
npm run build
npm run start
```
Your program should print output like:

```
2025-04-16 17:05:01 [info]: DBOS launched!
2025-04-16 17:05:01 [info]: Step one completed!
2025-04-16 17:05:01 [info]: Step two completed!
```

To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint using Express.js.
Replace the contents of `src/main.ts` with:

```javascript showLineNumbers title="src/main.ts"
import { DBOS } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

async function stepOne() {
  DBOS.logger.info("Step one completed!");
}

async function stepTwo() {
  DBOS.logger.info("Step two completed!");
}

async function exampleFunction() {
  await DBOS.runStep(() => stepOne(), {name: "stepOne"});
  for (let i = 0; i < 5; i++) {
    console.log("Press Control + C to stop the app...");
    await DBOS.sleep(1000);
  }
  await DBOS.runStep(() => stepTwo(), {name: "stepTwo"});
}
const exampleWorkflow = DBOS.registerWorkflow(exampleFunction);

app.get("/", async (req, res) => {
  await exampleWorkflow();
  res.send();
});

async function main() {
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  });
  await DBOS.launch();
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

Now, install Express.js, then rebuild and restart your app with:

```shell
npm install express
npm run build
npm run start
```

Then, visit this URL: http://localhost:3000.

In your terminal, you should see an output like:

```
🚀 Server is running on http://localhost:3000
2025-02-03 22:42:54 [info]: Step one completed!
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
```

Now, press CTRL+C stop your app. Then, run `npm run start` to restart it. You should see an output like:

```
🚀 Server is running on http://localhost:3000
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
2025-02-03 22:43:15 [info]: Step two completed!
```

You can see how DBOS **recovers your workflow from the last completed step**, executing step two without re-executing step one.
Learn more about workflows, steps, and their guarantees [here](./tutorials/workflow-tutorial.md).

## 3. Queues and Parallelism

If you need to run many functions concurrently, use DBOS _queues_.
To try them out, copy this code into `src/main.ts`:

```javascript showLineNumbers title="src/main.ts"
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

const queue = new WorkflowQueue("example_queue");

async function taskFunction(n: number) {
  await DBOS.sleep(5000);
  DBOS.logger.info(`Task ${n} completed!`)
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction);

async function queueFunction() {
  DBOS.logger.info("Enqueueing tasks!")
  const handles = []
  for (let i = 0; i < 10; i++) {
    handles.push(await DBOS.startWorkflow(taskWorkflow, { queueName: queue.name })(i))
  }
  const results = []
  for (const h of handles) {
    results.push(await h.getResult())
  }
  DBOS.logger.info(`Successfully completed ${results.length} tasks`)
}
const queueWorkflow = DBOS.registerWorkflow(queueFunction)

app.get("/", async (req, res) => {
  await queueWorkflow();
  res.send();
});

async function main() {
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  });
  await DBOS.launch();
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

When you enqueue a function with `DBOS.startWorkflow`, DBOS executes it _asynchronously_, running it in the background without waiting for it to finish.
`DBOS.startWorkflow` returns a handle representing the state of the enqueued function.
This example enqueues ten functions, then waits for them all to finish using `.get_result()` to wait for each of their handles.

Now, rebuild and restart your app with:

```shell
npm run build
npm run start
```

Then, visit this URL: http://localhost:3000.
Wait five seconds and you should see an output like:

```
🚀 Server is running on http://localhost:3000
2025-02-03 22:58:12 [info]: Enqueueing tasks!
2025-02-03 22:58:18 [info]: Task 0 completed!
2025-02-03 22:58:18 [info]: Task 1 completed!
2025-02-03 22:58:18 [info]: Task 2 completed!
2025-02-03 22:58:18 [info]: Task 3 completed!
2025-02-03 22:58:18 [info]: Task 4 completed!
2025-02-03 22:58:18 [info]: Task 5 completed!
2025-02-03 22:58:18 [info]: Task 6 completed!
2025-02-03 22:58:18 [info]: Task 7 completed!
2025-02-03 22:58:18 [info]: Task 8 completed!
2025-02-03 22:58:18 [info]: Task 9 completed!
2025-02-03 22:58:19 [info]: Successfully completed 10 tasks
```

You can see how all ten steps run concurrently&mdash;even though each takes five seconds, they all finish at the same time.
Learn more about DBOS queues [here](./tutorials/queue-tutorial.md).

Congratulations!  You've finished the DBOS TypeScript guide.
You can find the code from this guide in the [DBOS Toolbox](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/dbos-node-toolbox) template app.

Next, to learn how to build more complex applications, check out the TypeScript tutorials and [example apps](../examples/index.md).