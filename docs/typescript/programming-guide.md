---
sidebar_position: 1
title: Learn DBOS TypeScript
pagination_next: typescript/tutorials/workflow-tutorial
pagination_prev: quickstart
---

This guide shows you how to use DBOS to build TypeScript apps that are **resilient to any failure**.

## 1. Setting Up Your App

To get started, initialize a DBOS template and install dependencies:

```shell
npx @dbos-inc/create -t dbos-node-starter -n dbos-starter
cd dbos-starter
npm install
```

## 2. Workflows and Steps

Now, let's create the simplest interesting DBOS program.
Add this code to `src/main.ts`:

```javascript showLineNumbers title="src/main.ts"
import { DBOS } from "@dbos-inc/dbos-sdk";

export class Example {

  @DBOS.step()
  static async stepOne() {
    DBOS.logger.info("Step one completed!");
  }

  @DBOS.step()
  static async stepTwo() {
    DBOS.logger.info("Step two completed!");
  }

  @DBOS.workflow()
  static async exampleWorkflow() {
    await Example.stepOne();
    await Example.stepTwo();
  }
}

async function main() {
  await DBOS.launch();
  await Example.exampleWorkflow();
  await DBOS.shutdown();
}

main().catch(console.log)
```

In DBOS, you write programs as **workflows** of **steps**.
Workflows and steps are ordinary Python functions annotated with the `@DBOS.workflow()` and `@DBOS.step()` decorators.
DBOS **durably executes** workflows, persisting their state to a database so if they are interrupted or crash, they automatically recover from the last completed step.

Now, build and run this code with:

```shell
npm run build
npm run start
```

It should print output like:

```shell
2025-02-03 22:36:40 [info]: Workflow executor initialized
2025-02-03 22:36:40 [info]: DBOS Admin Server is running at http://localhost:3001
2025-02-03 22:36:40 [info]: Step one completed!
2025-02-03 22:36:40 [info]: Step two completed!
```

To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint using Express.js.
Copy this code into `src/main.ts`:

```javascript showLineNumbers title="src/main.ts"
import { DBOS } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

export class Example {

  @DBOS.step()
  static async stepOne() {
    DBOS.logger.info("Step one completed!");
  }

  @DBOS.step()
  static async stepTwo() {
    DBOS.logger.info("Step two completed!");
  }

  @DBOS.workflow()
  static async exampleWorkflow() {
    await Example.stepOne();
    for (let i = 0; i < 5; i++) {
      console.log("Press Control + C to stop the app...");
      await DBOS.sleep(1000);
    }
    await Example.stepTwo();
  }
}

app.get("/", async (req, res) => {
  await Example.exampleWorkflow();
  res.send();
});

async function main() {
  await DBOS.launch({ expressApp: app });
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

Build your app with `npm run build` and start it with `npm run start`.
Then, visit this URL: http://localhost:3000.

In your terminal, you should see an output like:

```shell
🚀 Server is running on http://localhost:3000
2025-02-03 22:42:54 [info]: Step one completed!
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
```

Now, press CTRL+C stop your app. Then, run `npm run start` to restart it. You should see an output like:

```shell
🚀 Server is running on http://localhost:3000
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
2025-02-03 22:43:15 [info]: Step two completed!
```

You can see how DBOS **recovers your workflow from the last completed step**, executing step 1 without re-executing step 2.
Learn more about workflows, steps, and their guarantees [here](./tutorials/workflow-tutorial.md).