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
Workflows and steps are ordinary TypeScript functions annotated with the `@DBOS.workflow()` and `@DBOS.step()` decorators.
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

Start your app with `npm run dev`.
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

## 3. Queues and Parallelism

If you need to run many functions concurrently, use DBOS _queues_.
To try them out, copy this code into `src/main.ts`:

```javascript showLineNumbers title="src/main.ts"
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

const queue = new WorkflowQueue("example_queue");

export class Example {

  @DBOS.workflow()
  static async taskWorkflow(n: number) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Sleep 5 seconds
    DBOS.logger.info(`Task ${n} completed!`)
  }

  @DBOS.workflow()
  static async queueWorkflow() {
    DBOS.logger.info("Enqueueing tasks!")
    const handles = []
    for (let i = 0; i < 10; i++) {
      handles.push(await DBOS.startWorkflow(Example, { queueName: queue.name }).taskWorkflow(i))
    }
    const results = []
    for (const h of handles) {
      results.push(await h.getResult())
    }
    DBOS.logger.info(`Successfully completed ${results.length} tasks`)
  }
}

app.get("/", async (req, res) => {
  await Example.queueWorkflow();
  res.send();
});

async function main() {
  await DBOS.launch({ expressApp: app });
  const PORT = DBOS.runtimeConfig?.port || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

When you enqueue a function with `DBOS.startWorkflow`, DBOS executes it _asynchronously_, running it in the background without waiting for it to finish.
`DBOS.startWorkflow` returns a handle representing the state of the enqueued function.
This example enqueues ten functions, then waits for them all to finish using `.get_result()` to wait for each of their handles.

Start your app with `npm run dev`.
Then, visit this URL: http://localhost:3000.
Wait five seconds and you should see an output like:

```shell
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

DBOS durably executes queued operations. To see this in action, change the definition of `taskWorkflow` to this so each step takes a different amount of time to run:

```javascript
  @DBOS.workflow()
  static async taskWorkflow(n: number) {
    await new Promise(resolve => setTimeout(resolve, n * 1000));
    DBOS.logger.info(`Task ${n} completed!`);
  }
```

Now, start your app with `dbos start`, then visit this URL: http://localhost:8000.
After about five seconds, you should see an output like:

```
🚀 Server is running on http://localhost:3000
2025-02-03 22:59:08 [info]: Enqueueing tasks!
2025-02-03 22:59:08 [info]: Task 0 completed!
2025-02-03 22:59:09 [info]: Task 1 completed!
2025-02-03 22:59:10 [info]: Task 2 completed!
2025-02-03 22:59:11 [info]: Task 3 completed!
2025-02-03 22:59:12 [info]: Task 4 completed!
```

Next, press CTRL+C stop your app. Then, run `npm run dev` to restart it. Wait ten seconds and you should see an output like:


```shell
🚀 Server is running on http://localhost:3000
2025-02-03 23:01:03 [info]: Task 5 completed!
2025-02-03 23:01:04 [info]: Task 6 completed!
2025-02-03 23:01:05 [info]: Task 7 completed!
2025-02-03 23:01:06 [info]: Task 8 completed!
2025-02-03 23:01:07 [info]: Task 9 completed!
2025-02-03 23:01:08 [info]: Successfully completed 10 tasks
```

You can see how DBOS again **recovered your workflow from the last completed task**, restarting steps 5-9 without re-executing steps 0-4 (you may not see exactly this result&mdash;a task may appear twice if you interrupt DBOS between when it logs success and when its status is written to Postgres).
Learn more about DBOS queues [here](./tutorials/queue-tutorial.md).

## 4. Scheduled Workflows

Sometimes, you need to run a workflow **on a schedule**: for example, once per hour or once per week.
In DBOS, you can schedule workflows with the `@DBOS.scheduled()` decorator.
To try it out, add this code to your `src/main.ts`:

```javascript
  @DBOS.scheduled({ crontab: "* * * * * *" })
  @DBOS.workflow()
  static async runEverySecond(scheduledTime: Date, startTime: Date) {
    DBOS.logger.info(`I am a scheduled workflow. It is currently ${scheduledTime}.`)
  }
```

The argument to the `DBOS.scheduled()` decorator is your workflow's schedule, defined in [crontab](https://en.wikipedia.org/wiki/Cron) syntax.
The schedule in the example, `* * * * * *` means "run this workflow every second."
Learn more about scheduled workflows [here](./tutorials/scheduled-workflows.md).

Now, start your app with `npm run dev`.
The workflow should run every second, with output like:

```shell
2025-02-03 23:10:58 [info]: I am a scheduled workflow. It is currently Mon Feb 03 2025 15:10:58 GMT-0800 (Pacific Standard Time).
2025-02-03 23:10:59 [info]: I am a scheduled workflow. It is currently Mon Feb 03 2025 15:10:59 GMT-0800 (Pacific Standard Time).
2025-02-03 23:11:00 [info]: I am a scheduled workflow. It is currently Mon Feb 03 2025 15:11:00 GMT-0800 (Pacific Standard Time).
```

## 5. Database Operations and Transactions

Often, applications need to manage database tables in Postgres.
We'll show you how to do that from scratch using [Knex.js](./tutorials/orms/using-knex.md) to first define a schema migration to create a new table then to operate on the table from a DBOS workflow.
DBOS also supports other popular ORMs such as [Drizzle](./tutorials/orms/using-drizzle.md), [Prisma](./tutorials/orms/using-prisma.md), and [TypeORM](./tutorials/orms/using-typeorm.md).

First, create a file named `knexfile.js` and add the following code to it.
This configures Knex and instructs it to read its database connection parameters from DBOS.

```javascript showLineNumbers title="knexfile.js"
const { parseConfigFile } = require('@dbos-inc/dbos-sdk');

const [dbosConfig, ] = parseConfigFile();

const config = {
  client: 'pg',
  connection: {
    host: dbosConfig.poolConfig.host,
    port: dbosConfig.poolConfig.port,
    user: dbosConfig.poolConfig.user,
    password: dbosConfig.poolConfig.password,
    database: dbosConfig.poolConfig.database,
    ssl: dbosConfig.poolConfig.ssl,
  },
  migrations: {
    directory: './migrations'
  }
};

module.exports = config;

```

Next, let's create a schema migration that will create a table in your database.
Create a new migration file with:

```shell
npx knex migrate:make example_table
```

This creates a file named `migrations/XXXXX_example_table.js`.
Add the following code to that file to define your new table:

```javascript showLineNumbers title="migrations/XXXXX_example_table.js"
exports.up = function(knex) {
    return knex.schema.createTable('example_table', function(table) {
      table.increments('count').primary();
      table.string('name').notNullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('example_table');
  };
```
Then, edit your `dbos-config.yaml` to add a migration command:

```yaml
database:
  migrate:
    - npx knex migrate:latest
```

Finally, run your new migration with:

```shell
npx dbos migrate
```

You should see output like:

```shell
2025-02-03 23:30:52 [info]: Executing migration command: npx knex migrate:latest
Batch 1 run: 1 migrations
2025-02-03 23:30:53 [info]: Creating DBOS tables and system database.
2025-02-03 23:30:53 [info]: Migration successful!
```

You just created your new table in your Postgres database!

Now, let's write a DBOS workflow that operates on that table. Copy the following code into `src/main.ts`:

```javascript showLineNumbers title="src/main.ts"
import { DBOS, } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

export class Toolbox {
  @DBOS.transaction()
  static async insertRow() {
    await DBOS.knexClient.raw('INSERT INTO example_table (name) VALUES (?)', ['dbos']);
  }

  @DBOS.transaction({ readOnly: true })
  static async countRows() {
    const result = await DBOS.knexClient.raw('SELECT COUNT(*) as count FROM example_table');
    const count = result.rows[0].count;
    DBOS.logger.info(`Row count: ${count}`);
  }

  @DBOS.workflow()
  static async transactionWorkflow() {
    await Toolbox.insertRow()
    await Toolbox.countRows()
  }
}

app.get("/", async (req, res) => {
  await Toolbox.transactionWorkflow();
  res.send();
});

async function main() {
  await DBOS.launch({ expressApp: app });
  const PORT = DBOS.runtimeConfig?.port || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);

```

This workflow first inserts a new row into your table, then prints the total number of rows in into your table.
The database operations are done in DBOS _transactions_. These are a special kind of step optimized for database accesses.
They execute as a single database transaction and give you access to a pre-configured database client (`DBOS.knexClient`).
Learn more about transactions [here](./tutorials/transaction-tutorial.md).

Now, start your app with `dbos start`, then visit this URL: http://localhost:3000.

You should see an output like:

```shell
🚀 Server is running on http://localhost:3000
2025-02-03 23:32:31 [info]: Row count: 1
```

Every time you visit http://localhost:3000, your workflow should insert another row, and the printed row count should go up by one.

Congratulations!  You've finished the DBOS TypeScript guide.
You can find the code from this guide in the [DBOS Toolbox](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/dbos-node-toolbox) template app.

Here's what everything looks like put together: