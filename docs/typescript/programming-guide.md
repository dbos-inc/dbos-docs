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
If you already have Postgres, you can set the `DBOS_DATABASE_URL` environment variable to your connection string.
Otherwise, you can start Postgres in a Docker container with this command:

```shell
npx dbos postgres start
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
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch();
  await Example.exampleWorkflow();
  await DBOS.shutdown();
}

main().catch(console.log)
```

DBOS helps you write reliable TypeScript programs as **workflows** of **steps**.
You create workflows and steps by adding special annotations (`@DBOS.workflow()` and `@DBOS.step()`) to your TypeScript functions.

The key benefit of DBOS is **durability**&mdash;it automatically saves the state of your workflows and steps to a database.
If your program crashes or is interrupted, DBOS uses this saved state to recover each of your workflows from its last completed step.
Thus, DBOS makes your application **resilient to any failure**.

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
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch({ expressApp: app });
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

Now, rebuild and restart your app with:

```shell
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

  @DBOS.step()
  static async taskStep(n: number) {
    await DBOS.sleep(5000);
    DBOS.logger.info(`Task ${n} completed!`)
  }

  @DBOS.workflow()
  static async queueWorkflow() {
    DBOS.logger.info("Enqueueing tasks!")
    const handles = []
    for (let i = 0; i < 10; i++) {
      handles.push(await DBOS.startWorkflow(Example, { queueName: queue.name }).taskStep(i))
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
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch({ expressApp: app });
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

Now, rebuild and restart your app with:

```shell
npm run build
npm run start
```

The workflow should run every second, with output like:

```
2025-02-03 23:10:58 [info]: I am a scheduled workflow. It is currently Mon Feb 03 2025 15:10:58 GMT-0800 (Pacific Standard Time).
2025-02-03 23:10:59 [info]: I am a scheduled workflow. It is currently Mon Feb 03 2025 15:10:59 GMT-0800 (Pacific Standard Time).
2025-02-03 23:11:00 [info]: I am a scheduled workflow. It is currently Mon Feb 03 2025 15:11:00 GMT-0800 (Pacific Standard Time).
```

## 5. Database Operations and Transactions

Often, applications need to manage database tables in Postgres.
We'll show you how to do that from scratch using [Knex.js](https://knexjs.org/).
First, we'll define a schema migration to create a new table.
Then, we'll operate on the table using a DBOS workflow.
DBOS also supports other popular ORMs such as [Drizzle](https://orm.drizzle.team/), [Prisma](https://www.prisma.io/), and [TypeORM](https://typeorm.io/).

First, create a file named `knexfile.js` and add the following code to it:

```javascript showLineNumbers title="knexfile.js"
const config = {
  client: 'pg',
  connection: process.env.DBOS_DATABASE_URL || 'postgresql://postgres:dbos@localhost:5432/dbos_node_starter',
  migrations: {
    directory: './migrations'
  }
};

export default config;
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

Now run your new migration:

```shell
npx knex migrate:latest
```

You should see output like:

```shell
Batch 1 run: 1 migrations
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
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch({ expressApp: app });
  const PORT = 3000;
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

Now, rebuild and restart your app with:

```shell
npm run build
npm run start
```

Then, visit this URL: http://localhost:3000.

You should see an output like:

```
🚀 Server is running on http://localhost:3000
2025-02-03 23:32:31 [info]: Row count: 1
```

Every time you visit http://localhost:3000, your workflow should insert another row, and the printed row count should go up by one.

Congratulations!  You've finished the DBOS TypeScript guide.
You can find the code from this guide in the [DBOS Toolbox](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/dbos-node-toolbox) template app.

Here's what everything looks like put together:

<details>
<summary>Putting it all together</summary>

```javascript showLineNumbers title="src/main.ts"
import { DBOS, SchedulerMode, WorkflowQueue } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

const queue = new WorkflowQueue("example_queue");

export class Toolbox {

  //////////////////////////////////
  //// Workflows and steps
  //////////////////////////////////

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
    await Toolbox.stepOne();
    await Toolbox.stepTwo();
  }

  //////////////////////////////////
  //// Queues
  //////////////////////////////////

  @DBOS.step()
  static async taskStep(n: number) {
    await DBOS.sleep(5000);
    DBOS.logger.info(`Task ${n} completed!`)
  }

  @DBOS.workflow()
  static async queueWorkflow() {
    DBOS.logger.info("Enqueueing tasks!")
    const handles = []
    for (let i = 0; i < 10; i++) {
      handles.push(await DBOS.startWorkflow(Toolbox, { queueName: queue.name }).taskStep(i))
    }
    const results = []
    for (const h of handles) {
      results.push(await h.getResult())
    }
    DBOS.logger.info(`Successfully completed ${results.length} tasks`)
  }

  //////////////////////////////////
  //// Scheduled workflows
  //////////////////////////////////

  @DBOS.scheduled({ crontab: "* * * * *", mode: SchedulerMode.ExactlyOncePerIntervalWhenActive })
  @DBOS.workflow()
  static async runEveryMinute(scheduledTime: Date, startTime: Date) {
    DBOS.logger.info(`I am a scheduled workflow. It is currently ${scheduledTime}.`)
  }

  //////////////////////////////////
  //// Transactions
  //////////////////////////////////

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

/////////////////////////////////////
//// Express.js HTTP endpoints
/////////////////////////////////////

app.get("/workflow", async (req, res) => {
  await Toolbox.exampleWorkflow();
  res.send();
});

app.get("/queue", async (req, res) => {
  await Toolbox.queueWorkflow();
  res.send();
});

app.get("/transaction", async (req, res) => {
  await Toolbox.transactionWorkflow();
  res.send();
});

/////////////////////////////////////
//// Starting Express.js and DBOS
/////////////////////////////////////

async function main() {
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch({ expressApp: app });
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

</details>

Next, to learn how to build more complex applications, check out the TypeScript tutorials and [example apps](../examples/index.md).