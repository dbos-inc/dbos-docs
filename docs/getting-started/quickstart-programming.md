---
sidebar_position: 2
title: Programming Quickstart
---

Let's learn how to build applications with [DBOS Transact](https://github.com/dbos-inc/dbos-ts).
In this tutorial, we'll modify the example application from our [quickstart](./quickstart.md) to reliably send greetings to your friends.

Before starting this tutorial, we recommend finishing the [quickstart](./quickstart.md).
You can use the application from the quickstart to complete this tutorial.

### Serving Your Applications

:::info what you will learn
How to serve your application via HTTP.
:::

Let's add an HTTP GET handler to your application so it can send greetings to your friends.
Add this code to `src/operations.ts`:

```javascript
import { HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'

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

The key to this code is the [`@GetApi`](../api-reference/decorators#getapi) decorator, which tells DBOS to serve the `Greeting` function from HTTP GET requests to the `/greeting` endpoint.
As you will see, DBOS relies on [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) to simplify your programming experience.
To load these decorators, DBOS methods must be static class members.
In this case, `Greeting` is a static member of the `Greetings` class.

To learn more about HTTP serving in DBOS, see [our guide](../tutorials/http-serving-tutorial).

### Connecting to the Database

:::info what you will learn
How to interact with the database.
:::

Let's augment the code to insert a new record in the database when we greet a friend.
We'll do this with a [transactional function](../tutorials/transaction-tutorial.md).
Copy this code into `src/operations.ts`:

```javascript
import { TransactionContext, Transaction, HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'
import { Knex } from 'knex';

export class Greetings {
  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {
    await ctxt.client.raw('INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)', [friend, content]);
    ctxt.logger.info(`Greeting to ${friend} recorded in the database!`);
  }

  @GetApi('/greeting/:friend')
  static async Greeting(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);
    return noteContent;
  }
}
```

The key elements of this code are:
- We use the [`@Transaction`](../api-reference/decorators#transaction) decorator to define a [transactional function](../tutorials/transaction-tutorial.md) (`InsertGreeting`) that accesses the database from a managed client.
- Inside `InsertGreeting`, we insert a row in the database with `ctxt.client.raw()`.
- We add a line to `Greeting` invoking `InsertGreeting`.

To learn more about accessing the database in DBOS, see [our guide](../tutorials/transaction-tutorial.md).

:::info
In this quickstart, we write our database operations in raw SQL (using [knex.raw](https://knexjs.org/guide/raw.html)), but DBOS Transact also supports [knex's query builder](https://knexjs.org/guide/query-builder.html), [TypeORM](https://typeorm.io/), and [Prisma](https://www.prisma.io/docs/orm/prisma-client).
:::

### Interacting with External Services

:::info what you will learn
How to safely send requests to third-party APIs.
:::

Let's say we want to use a third-party client to send our greeting via e-mail.
In DBOS, we strongly recommend wrapping calls to third-party APIs in [Communicators](../tutorials/communicator-tutorial).
We'll see in the next section how communicators make your code more reliable.
For now, add this code to `src/operations.ts`:

```javascript
import {
  TransactionContext, Transaction,
  HandlerContext, GetApi,
  CommunicatorContext, Communicator,
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
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {
    await ctxt.client.raw('INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)', [friend, content]);
    ctxt.logger.info(`Greeting to ${friend} recorded in the database!`);
  }

  @GetApi("/greeting/:friend")
  static async Greeting(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    await ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent);
    await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);
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
    static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {
        await ctxt.client.raw('INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)', [friend, content]);
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
