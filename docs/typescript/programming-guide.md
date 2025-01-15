---
sidebar_position: 1
title: Learn DBOS TypeScript
pagination_next: typescript/tutorials/workflow-tutorial
pagination_prev: quickstart
---

import LocalPostgres from '/docs/partials/_local_postgres.mdx';


This tutorial shows you how to use DBOS durable execution to make your TypeScript app **resilient to any failure.**
First, without using DBOS, we'll build an app that records greetings to two different systems: Postgres and an online guestbook.
Then, we'll add DBOS durable execution to the app in **just four lines of code**.
Thanks to durable execution, the app will always write to both systems consistently, even if it is interrupted or restarted at any point.

## 1. Setting Up Your App

First, initialize a DBOS template app and install dependencies:

```shell
npx @dbos-inc/create -t dbos-knex -n greeting-guestbook-ts
cd greeting-guestbook-ts
npm install
```

Then, let's build a simple app that greets our friends.
Every time the app receives a greeting, it performs two steps:

1. Sign an online guestbook with the greeting.
2. Record the greeting in the database.

We deliberately **won't** use DBOS yet so we can show you how easy it is to add later.

Copy the following code into `src/main.ts`, replacing its existing contents:

```javascript showLineNumbers title="src/main.ts"
import express, { Request, Response } from 'express';
import knex from 'knex';
const knexConfig = require('../knexfile');

export class Guestbook {

  // Sign the guestbook using an HTTP POST request
  static async signGuestbook(name: string): Promise<void> {
    await fetch("https://demo-guestbook.cloud.dbos.dev/record_greeting", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });
    console.log(`>>> STEP 1: Signed the guestbook for ${name}`);
  }

  // Create a database connection using Knex.js
  static db = knex(knexConfig);

  // Record the greeting in the database using Knex.js
  static async insertGreeting(name: string): Promise<void> {
    await Guestbook.db('dbos_greetings').insert({ greeting_name: name });
    console.log(`>>> STEP 2: Greeting to ${name} recorded in the database!`);
  }

  static async greetingEndpoint(name: string): Promise<string> {
    await Guestbook.signGuestbook(name);
    await Guestbook.insertGreeting(name);
    return `Thank you for being awesome, ${name}!`;
  }
}

// Create an HTTP server using Express.js
export const app = express();
app.use(express.json());

app.get('/greeting/:name', async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;
  res.send(await Guestbook.greetingEndpoint(name));
});

async function main() {
  const PORT = 3000;
  const ENV = process.env.NODE_ENV || 'development';

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🌟 Environment: ${ENV}`);
  });
}

main().catch(console.log);
```

Now, run these commands to set up your database and start your app:

```shell
npx dbos migrate
npm run build
npm run start
```

To see that it's is working, visit this URL: http://localhost:3000/greeting/Mike
<BrowserWindow url="http://localhost:3000/greeting/Mike">
"Thank you for being awesome, Mike!"
</BrowserWindow>

Each time you visit, your app should log first that it has recorded your greeting in the guestbook, then that it has recorded your greeting in the database.

```
>>> STEP 1: Signed the guestbook for Mike
>>> STEP 2: Greeting to Mike recorded in the database!
```

Now, this app has a problem: if it is interrupted after signing the guestbook, but before recording the greeting in the database, then **the greeting, though sent, will never be recorded**.
This is bad in many real-world situations, for example if a program fails to record making or receiving a payment.
To fix this problem, we'll use DBOS durable execution.

## 2. Durable Execution with Workflows

Next, we want to **durably execute** our application: guarantee that it inserts exactly one database record per guestbook signature, even if interrupted or restarted.
DBOS makes this easy with [workflows](./tutorials/workflow-tutorial.md).
We can add durable execution to our app with **just four lines of code** and an import statement.
Copy the following code into your `src/main.ts`, replacing its existing contents:

```javascript showLineNumbers title="src/main.ts"
//highlight-next-line
import { DBOS } from '@dbos-inc/dbos-sdk';
import express, { Request, Response } from 'express';
import knex from 'knex';
const knexConfig = require('../knexfile');

export class Guestbook {

  // Sign the guestbook using an HTTP POST request
  //highlight-next-line
  @DBOS.step()
  static async signGuestbook(name: string): Promise<void> {
    await fetch("https://demo-guestbook.cloud.dbos.dev/record_greeting", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });
    console.log(`>>> STEP 1: Signed the guestbook for ${name}`);
  }

  // Create a database connection using Knex.js
  static db = knex(knexConfig);

  // Record the greeting in the database using Knex.js
  //highlight-next-line
  @DBOS.step()
  static async insertGreeting(name: string): Promise<void> {
    await Guestbook.db('dbos_greetings').insert({ greeting_name: name });
    console.log(`>>> STEP 2: Greeting to ${name} recorded in the database!`);
  }

//highlight-next-line
  @DBOS.workflow()
  static async greetingEndpoint(name: string): Promise<string> {
    await Guestbook.signGuestbook(name);
    for (let i = 0; i < 5; i++) {
      console.log("Press Control + C to stop the app...");
      await DBOS.sleep(1000);
  }
    await Guestbook.insertGreeting(name);
    return `Thank you for being awesome, ${name}!`;
  }
}

// Create an HTTP server using Express.js
export const app = express();
app.use(express.json());

app.get('/greeting/:name', async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;
  res.send(await Guestbook.greetingEndpoint(name));
});

async function main() {
//highlight-next-line
  await DBOS.launch({expressApp: app});

  const PORT = 3000;
  const ENV = process.env.NODE_ENV || 'development';

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🌟 Environment: ${ENV}`);
  });
}

main().catch(console.log);
```

Only the **four highlighted lines of code** are needed to enable durable execution.

- First, we annotate `sign_guestbook` and `insert_greeting` as _workflow steps_ on lines 9 and 25.
- Then, we annotate `greeting_endpoint` as a [_durable workflow_](./tutorials/workflow-tutorial.md) on line 31.
- Finally, we launch DBOS on line 53.

Because `greeting_endpoint` is now a durably executed workflow, if it's ever interrupted, it automatically resumes from the last completed step.
To help demonstrate this, we also add a sleep so you can interrupt your app midway through the workflow.

To see the power of durable execution, rebuild your app with `npm run build` and restart your app with `npm run start`.
Then, visit this URL: http://localhost:3000/greeting/Mike.
In your terminal, you should see an output like:

```shell
🚀 Server is running on http://localhost:3000
🌟 Environment: development
>>> STEP 1: Signed the guestbook for Mike
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
```
Now, press CTRL+C stop your app. Then, run `dbos start` to restart it. You should see an output like:

```shell
🚀 Server is running on http://localhost:3000
🌟 Environment: development
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
>>> STEP 2: Greeting to Mike recorded in the database!
```

Without durable execution&mdash;if you remove the four highlighted lines&mdash;your app would restart with a "clean slate" and completely forget about your interrupted workflow.
By contrast, DBOS **automatically resumes your workflow from where it left off** and correctly completes it by recording the greeting to the database without re-signing the guestbook.
This is an incredibly powerful guarantee that helps you build complex, reliable applications without worrying about error handling or interruptions.

## 3. Optimizing Database Operations

For workflow steps that access the database, like `insert_greeting` in the example, DBOS provides powerful optimizations.
To see this in action, replace the `insert_greeting` function in `src/main.ts` with the following:

```javascript showLineNumbers
  @DBOS.transaction()
  static async insertGreeting(name: string): Promise<void> {
    await DBOS.knexClient('dbos_greetings').insert({ greeting_name: name });
    console.log(`>>> STEP 2: Greeting to ${name} recorded in the database!`);
  }
```

[`@DBOS.transaction()`](./tutorials/transaction-tutorial.md) is a special annotation for workflow steps that access the database.
It executes your function in a single database transaction.
We recommend using transactions because:

1. They give you access to a pre-configured database client, which is more convenient than connecting to the database yourself. DBOS integrates with most popular TypeScript ORMs, including Knex, Prisma, TypeORM, and Drizzle, and also supports raw SQL.
2. Under the hood, transactions are highly optimized because DBOS can update its record of your program's execution _inside_ your transaction. For more info, see our ["how workflows work"](../explanations/how-workflows-work.md) explainer.

Now, rebuild your app with with `npm run build`, restart with `npm run start`, and visit its URL again: http://localhost:3000/greeting/Mike.
The app should durably execute your workflow the same as before!

The code for this guide is available [on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/greeting-guestbook).

Next, to learn how to build more complex applications, check out our TypeScript tutorials and [example apps](../examples/index.md).
