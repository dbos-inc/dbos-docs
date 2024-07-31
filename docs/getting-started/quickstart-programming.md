---
sidebar_position: 2
title: Programming Guide
---

Before starting this tutorial, we recommend finishing the [quickstart](./quickstart.md). We'll modify the quickstart example to illustrate the core building blocks of [DBOS Transact](https://github.com/dbos-inc/dbos-ts). In the end, we'll create an app that reliably records events across two different systems: the Postgres database and a third-party API. The app will write to both systems consistently, even if we crash it between writes.

## Serving Endpoints

Let's start with a simple HTTP GET handler to greet friends. In your app folder, change the file `src/operations.ts` to contain only the following:

```javascript
import { HandlerContext, GetApi } from '@dbos-inc/dbos-sdk';

export class Greetings {
  @GetApi('/greeting/:friend')
  static async Greeting(ctxt: HandlerContext, friend: string) {
    return `Greetings, ${friend}!`;
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

To see that your application is working, visit this URL in your browser: [http://localhost:3000/greeting/Mike](http://localhost:3000/greeting/Mike).
You should see the message `Greetings, Mike!`.
If you replace Mike with a different name, your application will greet that name instead.

The key to this code is the [`@GetApi`](../api-reference/decorators#getapi) decorator, which tells DBOS to serve the `Greeting` function from HTTP GET requests to the `/greeting` endpoint. To learn more about HTTP serving in DBOS, see [our guide](../tutorials/http-serving-tutorial).

## Creating Database Tables

Let's create a database table to record greetings. In DBOS, we recommend managing database tables using [schema migrations](https://en.wikipedia.org/wiki/Schema_migration). By default, we use [Knex](https://knexjs.org/) to manage migrations, but also support other tools including [TypeORM](https://typeorm.io/) and [Prisma](https://www.prisma.io/). To create a new migration file, run the following command:

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

This command should print `Migration successful!` To learn more about schema migrations in DBOS, check out our guides for [Knex](../tutorials/using-knex.md#schema-management), [TypeORM](../tutorials/using-typeorm.md#schema-management), and [Prisma](../tutorials/using-prisma.md#schema-management).

## Writing to the Database

Now, let's change the app to record every greeting into the `greetings` table. We'll do this with a [transactional function](../tutorials/transaction-tutorial.md). Change your `src/operations.ts` to contain:

```javascript
import { TransactionContext, Transaction, HandlerContext, GetApi } from '@dbos-inc/dbos-sdk';
import { Knex } from 'knex';

interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {
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

Here we define a `GreetingRecord` interface to match a row of data in our `greetings` table. We then use [`@Transaction`](../api-reference/decorators#transaction) to define a [transactional function](../tutorials/transaction-tutorial.md) `InsertGreeting` that adds a `GreetingRecord` to the `greetings` table. Finally, we add a line to the GET API function `Greeting` to invoke `InsertGreeting` with the provided `name` and a welcoming `note`.

Rebuild with `npm run build` and start your application with `npx dbos start`. Make a few visits to the greeting URL in your browser, i.e. http://localhost:3000/greeting/Mike. With every new visit, the app should print this to the console:
```
[info]: Greeting to Mike recorded in the database! 
```

You can then query your Postgres database to see the greeting records. It may look something like this:
```
psql -h localhost -U postgres -d hello -c "select * from greetings"; 
```
Replace `hello` with your application name, if different. Your host, port or username may also vary depending on how you configured Postgres in the Quickstart. 

## Reading from the Database

You can add another GET API function to read all the greetings from the database like so:

```javascript
//export class Greetings {
//...
  @Transaction({readOnly: true})
  @GetApi('/greetings')
  static async allGreetings(ctxt: TransactionContext<Knex>) {
    return await ctxt.client('greetings').select('*') as Greeting[];
  }
//}
```

Here we add a new `@GetApi` function that is also a `@Transaction`. We decorate this transaction as `{readOnly: true}` since it does not modify the database. This enables DBOS Transact to execute the transaction faster, with fewer database round-trips. To learn more about accessing the database in DBOS, see [our guide](../tutorials/transaction-tutorial.md).

:::info
In this quickstart, we run queries using [Knex query builder](https://knexjs.org/guide/query-builder.html) but DBOS Transact also supports [Knex.raw](https://knexjs.org/guide/raw.html), [TypeORM](https://typeorm.io/), and [Prisma](https://www.prisma.io/docs/orm/prisma-client).
:::

## Interacting with External Services

Let's say we want to use a third-party service to send our greeting, or record it in a remote system. For this example, you can use a demo Guestbook Service that runs in DBOS cloud.

### Generate and Record a Guestbook Key
To create a new key, visit https://demo-guestbook.cloud.dbos.dev/key It should output a 36-character sequence like so `12345abc-1234-5678-1234-567890abcdef`. Yours will be different. We will now pass this key to the app as an environment variable.

In your app folder, edit the file `dbos-config.yaml` adding a new `env:` section at the bottom with the variable `GUESTBOOK_KEY` set to your key in single quotes:
```yaml
env:
  GUESTBOOK_KEY: 'your-key-value-here'
```

For example, if your key value is `12345abc-1234-5678-1234-567890abcdef` then you would add:
```yaml
env:
  GUESTBOOK_KEY: '12345abc-1234-5678-1234-567890abcdef'
```

### Sign the Guestbook from the App

In DBOS, we strongly recommend that all calls to third-party APIs are wrapped in [Communicators](../tutorials/communicator-tutorial). We'll now add a communicator to our app to record each greeting in the guestbook service. Change your `src/operations.ts` to contain the following:

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
  @Communicator()
  static async SignGuestbook(ctxt: CommunicatorContext, name: string) {
    const url = 'https://demo-guestbook.cloud.dbos.dev/record_greeting';
    const payload = {
      'key':  process.env.GUESTBOOK_KEY, //set in dbos-config.yaml
      'name': name
    };
    const headers = { 'Content-Type': 'application/json' };
    const response = await axios.post(url, payload, { headers: headers });
    ctxt.logger.info(`Greeting recorded in the guestbook: ${JSON.stringify(response.data)}`);
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

The key elements of this code are:
- We use the [`@Communicator`](../api-reference/decorators#transaction) decorator to define a [communicator function](../tutorials/communicator-tutorial.md) (`SendGreetingEmail`) to access a third-party email service.
- We add a line to `Greeting` invoking `SendGreetingEmail`.

To learn more about communication with external services and APIs in DBOS, see [our guide](../tutorials/communicator-tutorial).

### Composing Reliable Workflows

:::info what you will learn
How to make your applications reliable using DBOS workflows.
:::

Next, we want to make our app **reliable**: guarantee that it inserts exactly one database record per greeting email sent, even if there are transient failures or service interruptions.
DBOS makes this easy with [workflows](../tutorials/workflow-tutorial.md).
To see them in action, add this code to `src/operations.ts`:

```javascript
import {
    TransactionContext, Transaction, GetApi,
    CommunicatorContext, Communicator,
    WorkflowContext, Workflow,
} from "@dbos-inc/dbos-sdk";
import { Knex } from "knex";

export class Greetings {
    @Communicator()
    static async SendGreetingEmail(ctxt: CommunicatorContext, friend: string, content: string) {
        ctxt.logger.info(`Sending email "${content}" to ${friend}...`);
        // Code omitted for simplicity
        ctxt.logger.info("Email sent!");
    }

    @Transaction()
    static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {
        await ctxt.client.raw('INSERT INTO greetings (name, note) VALUES (?, ?)', [friend, note]);
        ctxt.logger.info(`Greeting to ${friend} recorded in the database!`);
    }

    @Workflow()
    @GetApi("/greeting/:friend")
    static async GreetingWorkflow(ctxt: WorkflowContext, friend: string) {
        const noteContent = `Thank you for being awesome, ${friend}!`;
        await ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent);

        for (let i = 0; i < 5; i++) {
            ctxt.logger.info(
                "Press Control + C to interrupt the workflow..."
            );
            await ctxt.sleepms(1000);
        }

        await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);
        return noteContent;
    }
}
```

The key elements of this snippet are:
- We create a [workflow function](../tutorials/workflow-tutorial.md) (`GreetingWorkflow`) using the [`@Workflow`](../api-reference/decorators.md#workflow) decorator. We move the `@GetApi` decorator to this function to serve HTTP requests from it.
- We invoke both `SendGreetingEmail` and `InsertGreeting` from the workflow.
- We introduce a sleep allowing you to interrupt the program midway through the workflow.

To see your workflow in action, build and start your application:

```
npm run build
npx dbos start
```

Then, visit [http://localhost:3000/greeting/Mike](http://localhost:3000/greeting/Mike) in your browser to send a request to your application.
On your terminal, you should see an output like:

```shell
> npx dbos start
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: Kafka endpoints supported:
[info]: Scheduled endpoints:
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
[info]: Sending email "Thank you for being awesome, Mike!" to Mike...
[info]: Email sent!
[info]: Press Control + C to interrupt the workflow...
```
Press Control + C when prompted to interrupt your application.
Then, run `npx dbos start` to restart your application.
You should see an output like:

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

Notice how DBOS automatically resumes your workflow from where it left off.
It doesn't re-send the greeting email, but does record the previously-sent greeting in the database.
This reliability is a core feature of DBOS: workflows always run to completion and each of their operations executes exactly once.
To learn more about workflows, check out our [tutorial](../tutorials/workflow-tutorial.md) and [explainer](../explanations/how-workflows-work.md).

The code for this guide is available on [GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/greeting-emails).

Next, to learn how to build more complex applications, check out our [tutorials](../category/dbos-transact-tutorials).
To walk through a more complex workflow, visit our [checkout workflow tutorial](../tutorials/checkout-tutorial).
