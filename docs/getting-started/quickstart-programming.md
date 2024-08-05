---
sidebar_position: 2
title: Programming Guide
---

This tutorial assumes you have finished the [Quickstart](./quickstart.md) and you have a [DBOS Transact](https://github.com/dbos-inc/dbos-ts) app running locally. In this guide we'll modify that example to reliably record events across two different systems: Postgres and a third-party API. This app will write to both systems consistently, even if interrupted and restarted at any point.

## Serving HTTP Requests

Let's start with a simple HTTP GET handler to greet friends. In your app folder, change the file `src/operations.ts` to contain only the following:

```javascript
import { HandlerContext, GetApi } from '@dbos-inc/dbos-sdk';

export class Greetings {
  @GetApi('/') // Serve a quick readme for the app
  static async readme(_ctxt: HandlerContext) {
    const readme = '<html><body><p>' +
      'Welcome! Visit the route /greeting/:name to be greeted!<br>' +
      'For example, visit <a href="/greeting/dbos">/greeting/dbos</a>.<br>' +
      '</p></body></html>';
    return Promise.resolve(readme);
  } 
 
  @GetApi('/greeting/:friend')
  static async Greeting(ctxt: HandlerContext, friend: string) {
    return Promise.resolve(`Greetings, ${friend}!`);
  }
}
```

Rebuild with `npm run build` and start your application with `npx dbos start`. You should see an output similar to:

```shell
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: Kafka endpoints supported:
[info]: Scheduled endpoints:
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
```

To see that your application is working, visit this URL in your browser: [http://localhost:3000/greeting/Mike](http://localhost:3000/greeting/Mike). You should see the message `Greetings, Mike!`. If you replace Mike with a different name, your application will greet that name instead. To learn more about HTTP serving in DBOS, see our [HTTP Serving Tutorial](../tutorials/http-serving-tutorial).

## Creating Database Tables

Let's make a database table to record greetings. In DBOS, we recommend managing database tables using [schema migrations](https://en.wikipedia.org/wiki/Schema_migration). By default, we use [Knex](../tutorials/using-knex.md#schema-management). We also support [TypeORM](../tutorials/using-typeorm.md#schema-management) and [Prisma](../tutorials/using-prisma.md#schema-management). To create a new migration file, run the following command:

```
npx knex migrate:make greetings
```

This will create a new file named `migrations/<timestamp>_greetings.js`.
Open that file and replace the contents with the following:

```javascript
exports.up = function(knex) {
    return knex.schema.createTable('greetings', table => {
        table.text('name');
        table.text('note');
      });
};

exports.down = function(knex) {
    return knex.schema.dropTable('greetings');
};
```
This code instructs the database to create a new table called `greetings` with two text columns: `name` and `note`. Run it like so:
```
npx dbos migrate
```
This command should print `Migration successful!`

## Writing to the Database

Now that we have `greetings` table, let's change our app to write to it. We'll do this with a [transactional function](../tutorials/transaction-tutorial.md). Change your `src/operations.ts` to contain:

```javascript
import { TransactionContext, Transaction, HandlerContext, GetApi } from '@dbos-inc/dbos-sdk';
import { Knex } from 'knex';

interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {
  @GetApi('/') // Serve a quick readme for the app
  static async readme(_ctxt: HandlerContext) {
    const readme = '<html><body><p>' +
      'Welcome! Visit the route /greeting/:name to be greeted!<br>' +
      'For example, visit <a href="/greeting/dbos">/greeting/dbos</a>.<br>' +
      '</p></body></html>';
    return Promise.resolve(readme);
  }

  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, gr: GreetingRecord) {
    await ctxt.client('greetings').insert(gr);
    ctxt.logger.info(`Greeting to ${gr.name} recorded in the database!`);
  }

  @GetApi('/greeting/:friend')
  static async Greeting(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    await ctxt.invoke(Greetings).InsertGreeting(
      { name: friend, note: noteContent }
    );
    return noteContent;
  }
}
```

Here we define a `GreetingRecord` interface to match a row of data in our `greetings` table. We then define a `@Transaction` called `InsertGreeting` that puts a new `GreetingRecord` into `greetings`. Finally, we add a line to the GET API function `Greeting` to invoke `InsertGreeting` with the provided `name` and a welcoming `note`.

Stop your app with CTRL+C. Rebuild with `npm run build` and start with `npx dbos start`. Make a few visits to the greeting URL in your browser, i.e. http://localhost:3000/greeting/Mike. With every new visit, the app should print this to the console:
```
[info]: Greeting to Mike recorded in the database! 
```

## Reading from the Database

You can add another GET API function to read all the greetings from the database like so:

```javascript
//export class Greetings {
//...
  @Transaction({readOnly: true})
  @GetApi('/greetings')
  static async allGreetings(ctxt: TransactionContext<Knex>) {
    return await ctxt.client('greetings').select('*') as GreetingRecord[];
  }
//}
```

Here we use `@GetApi` and `@Transaction` together. This transaction only reads data so we mark it as `{readOnly: true}`. This enables DBOS to execute it faster, with fewer database round-trips.

:::info
In this quickstart, we run queries using the [Knex query builder](https://knexjs.org/guide/query-builder.html). DBOS Transact also supports [TypeORM](https://typeorm.io/), [Prisma](https://www.prisma.io/docs/orm/prisma-client), and raw SQL.
:::

## Interacting with External Services

Now suppose we also want to send our greetings to a remote system. In this example, we'll use a demo DBOS Guestbook app. It lets us generate an API key and use it to record greetings in an online guestbook.

### Create a Guestbook Key
To generate a guestbook API key, visit https://demo-guestbook.cloud.dbos.dev/key. It should output a 36-character sequence like `12345abc-1234-5678-1234-567890abcdef` (yours will be different).

You can pass this key to your app as a config variable. In your app folder, edit the file `dbos-config.yaml`. Add a new `env:` section at the bottom with the variable `GUESTBOOK_KEY` set to your key in quotes:
```yaml
env:
  GUESTBOOK_KEY: 'your-key-value-here'
```

For example, if your key is `12345abc-1234-5678-1234-567890abcdef` then you should add:
```yaml
env:
  GUESTBOOK_KEY: '12345abc-1234-5678-1234-567890abcdef'
```
::::tip
In production, we recommend storing the key in an environment variable instead of plaintext. To do this, change the configuration to `GUESTBOOK_KEY: ${ENV_GUESTBOOK_KEY}` and set `ENV_GUESTBOOK_KEY` in your environment prior to starting or deploying the app. See the [Configuration Guide](../api-reference/configuration#environment-variables) for more details.
::::

### Sign the Guestbook from the App

In DBOS, we strongly recommend wrapping all calls to third-party APIs in [Communicators](../tutorials/communicator-tutorial). Let's add a communicator to our app to POST each greeting to the Guestbook using the `GUESTBOOK_KEY` config. Change your `src/operations.ts` to contain the following:

```javascript
import {
  TransactionContext, Transaction, HandlerContext, GetApi,
  CommunicatorContext, Communicator
} from "@dbos-inc/dbos-sdk";
import { Knex } from "knex";
import axios from 'axios';

interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {
  //Omitted for brevity: @GetApi('/') //app readme
  //Omitted for brevity: @GetApi('/greetings') //read greetings from database
  
  @Communicator()
  static async SignGuestbook(ctxt: CommunicatorContext, name: string) {
    const url = 'https://demo-guestbook.cloud.dbos.dev/record_greeting';
    const payload = {
      'key':  process.env.GUESTBOOK_KEY, //set in dbos-config.yaml
      'name': name
    };
    const headers = { 'Content-Type': 'application/json' };
    const response = await axios.post(url, payload, { headers: headers });
    ctxt.logger.info(`Signed the Guestbook: ${JSON.stringify(response.data)}`);
  }

  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, gr: GreetingRecord) {
    await ctxt.client('greetings').insert(gr);
    ctxt.logger.info(`Greeting to ${gr.name} recorded in the database!`);
  }

  @GetApi('/greeting/:friend')
  static async Greeting(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    await ctxt.invoke(Greetings).SignGuestbook(friend);
    await ctxt.invoke(Greetings).InsertGreeting(
      { name: friend, note: noteContent }
    );
    return noteContent;
  }
}
```

Note the new `@Communicator` function called `SignGuestbook` that uses `axios` to send the request. If it does not receive a successful response, it will automatically retry up to 3 times with exponential backoff. This is configurable [here](https://docs.dbos.dev/tutorials/communicator-tutorial#configurable-retries). Stop your app with CTRL+C, rebuild with `npm run build` and start your application with `npx dbos start`. Make a few visits to the greeting URL in your browser, i.e. http://localhost:3000/greeting/Mike. With every new visit, the app should now print first that it's recorded the greeting in the guestbook, then that it's recorded the greeting in the database.

```
[info]: Signed the Guestbook: {"ip_address":"...","greeted_name":"Mike","greeted_ts":"..."} 
[info]: Greeting to Mike recorded in the database! 
```

You can visit the URL `https://demo-guestbook.cloud.dbos.dev/greetings/your-key-value` to see all the Guestbook greetings made with your key. Old greetings and keys are removed after a few days.

## Composing Reliable Workflows

Next, we want to make our app **reliable**: guarantee that it inserts exactly one database record per guestbook signature, even if stopped and restarted. DBOS makes this easy with [workflows](../tutorials/workflow-tutorial.md). To see them in action, change your `src/operations.ts` like so:

```javascript
import {
    TransactionContext, Transaction, CommunicatorContext, Communicator,
    WorkflowContext, Workflow, GetApi, HandlerContext
} from "@dbos-inc/dbos-sdk";
import { Knex } from "knex";
import axios from 'axios';

interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {
  //Omitted for brevity: @GetApi('/') //app readme
  //Omitted for brevity: @GetApi('/greetings') //read greetings from database
  
  @Communicator()
  static async SignGuestbook(ctxt: CommunicatorContext, name: string) {
    const url = 'https://demo-guestbook.cloud.dbos.dev/record_greeting';
    const payload = {
      'key':  process.env.GUESTBOOK_KEY, //set in dbos-config.yaml
      'name': name
    };
    const headers = { 'Content-Type': 'application/json' };
    const response = await axios.post(url, payload, { headers: headers });
    ctxt.logger.info(`Signed the Guestbook: ${JSON.stringify(response.data)}`);
  }

  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, gr: GreetingRecord) {
    await ctxt.client('greetings').insert(gr);
    ctxt.logger.info(`Greeting to ${gr.name} recorded in the database!`);
  }

  @Workflow()
  static async GreetingWorkflow(ctxt: WorkflowContext, friend: string, noteContent: string) {
      await ctxt.invoke(Greetings).SignGuestbook(friend);
      for (let i = 0; i < 5; i++) {
          ctxt.logger.info("Press Control + C to stop the app...");
          await ctxt.sleepms(1000);
      }
      await ctxt.invoke(Greetings).InsertGreeting(
        { name: friend, note: noteContent }
      );
  }

  @GetApi('/greeting/:friend')
  static async Greeting(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    await ctxt.startWorkflow(Greetings).GreetingWorkflow(friend, noteContent);
    return Promise.resolve(noteContent);
  }
}
```

Here we create a `@Workflow` function called `GreetingWorkflow` that invokes `SignGuestbook` and then `InsertGreeting`. We introduce a sleep between them allowing you to interrupt the program midway through the workflow. We then change `Greeting` to start this workflow. Stop your app with CTRL+C, rebuild with `npm run build` and start your application with `npx dbos start`. 

The next step is time-sensitive; you may want to read it over before running. First, visit [http://localhost:3000/greeting/Mike](http://localhost:3000/greeting/Mike) in your browser to send a request to your application. In your terminal, you should see an output like:

```shell
> npx dbos start
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: Kafka endpoints supported:
[info]: Scheduled endpoints:
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
[info]: Signed the Guestbook: {"ip_address":"...","greeted_name":"Mike","greeted_ts":"..."} 
[info]: Press Control + C to interrupt the workflow...
[info]: Press Control + C to interrupt the workflow...
```
Press Control + C when prompted to interrupt your app. Then, run `npx dbos start` to restart the app. You should see an output like:

```shell
> npx dbos start
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: Kafka endpoints supported:
[info]: Scheduled endpoints:
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
[info]: Press Control + C to interrupt the workflow...
[info]: Press Control + C to interrupt the workflow...
[info]: Press Control + C to interrupt the workflow...
[info]: Press Control + C to interrupt the workflow...
[info]: Press Control + C to interrupt the workflow...
[info]: Greeting to Mike recorded in the database!
```

If this were not a DBOS `@Workflow` you would expect the app to restart with a "clean slate." There would be one record in the guestbook without matching records in Postgres. But this workflow automatically resumes where it left off and finishes recording the greeting in the database. This reliability is a core feature of DBOS: workflows always continue execution from the last completed step and run completion. To learn more about workflows, check out our [tutorial](../tutorials/workflow-tutorial.md) and [explainer](../explanations/how-workflows-work.md).

Also, note that we start the workflow asynchronously using `startWorkflow`. This returns the response to the caller as soon as the workflow starts, without waiting for the workflow to return. DBOS guarantees that the workflow continues to process to completion. This behavior is preferred when the caller expects a fast response, such as with a [payment webhook](https://www.dbos.dev/blog/open-source-typescript-stripe-processing). To make it synchronous, you can switch `startWorkflow` with `invokeWorkflow`.

The code for this guide is available on [GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/greeting-guestbook).

Next, to learn how to build more complex applications, check out our [tutorials](../category/dbos-transact-tutorials).
To walk through a more complex workflow, visit our [checkout workflow tutorial](../tutorials/checkout-tutorial).