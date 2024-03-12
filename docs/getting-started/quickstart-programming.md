---
sidebar_position: 3
title: Programming Quickstart
---

Let's learn how to program in DBOS!
In this tutorial, we will modify the example application from our [quickstart](./quickstart.md) to reliably send a greeting note to your friends.
Along the way, we'll introduce you to core DBOS concepts and show how you can easily build a transactional and reliable application.
First, you'll learn to create HTTP endpoints to serve requests.
Then, you'll learn how to interact with a database and make third-party API calls from your application.
Finally, you'll compose these steps in reliable workflows.

This tutorial assumes you've finished our [quickstart](./quickstart.md).
For convenience, we recommend initializing a new DBOS application and starting a database for it:

```
npx -y @dbos-inc/dbos-sdk@latest init -n <app-name>
cd <app-name>
export PGPASSWORD=dbos
./start_postgres_docker.sh
npx dbos-sdk migrate
truncate -s 0 src/operations.ts
```

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

Rebuild with `npm run build` and start your application with `npx dbos-sdk start`. You should see an output similar to:

```shell
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
```

To see that your application is working, visit this URL in your browser: [http://localhost:3000/greeting/Mike](http://localhost:3000/greeting/Mike).
You should see the message `Greetings, Mike!`.
If you replace Mike with a different name, your application will greet that name instead.

The key to this code is the [`@GetApi`](../api-reference/decorators#getapi) decorator, which tells DBOS to serve the `Greeting` function from HTTP GET requests to the `/greeting` endpoint.
As you will see, the DBOS SDK relies on [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) to simplify your programming experience.
To load these decorators, DBOS methods must be static class members.
In this case, `Greeting` is a static member of the `Greetings` class.

To learn more about HTTP serving in DBOS, see [our guide](../tutorials/http-serving-tutorial).

### Connecting to the Database

:::info what you will learn
How to interact with the database.
:::

Let's augment the code to insert a new record in the database when we greet a friend.
Using the [`@Transaction`](../api-reference/decorators#transaction) decorator, you can access a managed database client that automatically creates a database connection for you.
To try it out, copy this code into `src/operations.ts`:

```javascript
import { TransactionContext, Transaction, HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'
import { Knex } from 'knex';

export class Greetings {
  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {
    await ctxt.client.raw('INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)', [friend, content]);
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
- We use the [`@Transaction`](../api-reference/decorators#transaction) decorator to define a [transactional function](../tutorials/transaction-tutorial.md) (`InsertGreeting`) that can access the database.
- Inside `InsertGreeting`, we insert a row in the database with `ctxt.client.raw()`.
- We invoke `InsertGreeting` from `Greeting` using its context: `ctxt.invoke(Greetings).InsertGreeting(friend, noteContent)`.

To learn more about accessing the database in DBOS, see [our guide](../tutorials/transaction-tutorial.md).

:::info
In this quickstart, we write our database operations in raw SQL (using [knex.raw](https://knexjs.org/guide/raw.html)), but we also support [knex's query builder](https://knexjs.org/guide/query-builder.html) and [TypeORM](https://typeorm.io/).
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
    await ctxt.client.raw(
      "INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)",
      [friend, content],
    );
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
- We invoke `SendGreetingEmail` from `Greeting` using its context: `ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent)`.

To learn more about communication with external services and APIs in DBOS, see [our guide](../tutorials/communicator-tutorial).

### Composing Reliable Workflows

:::info what you will learn
How to make your applications reliable using DBOS workflows.
:::

To avoid spamming our friends, we want to make sure that if we retry a request after a transient failure or service interruption, the email is sent exactly once.
DBOS makes this easy with [workflows](../tutorials/workflow-tutorial.md).
To see them in action, add this code to `src/operations.ts`:

```javascript
import {
    TransactionContext, Transaction,
    HandlerContext, GetApi,
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
        await ctxt.client.raw(
            "INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)",
            [friend, content]
        );
    }

    @Workflow()
    @GetApi("/greeting/:friend")
    static async GreetingWorkflow(ctxt: WorkflowContext, friend: string) {
        const noteContent = `Thank you for being awesome, ${friend}!`;
        await ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent);

        for (let i = 0; i < 5; i++) {
            ctxt.logger.info(
                "Press control + C to interrupt the workflow..."
            );
            await ctxt.sleep(1);
        }

        await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);
        ctxt.logger.info(`Greeting sent to ${friend}!`);
        return noteContent;
    }
}
```

The key elements of this snippet are:
- We create a [workflow function](../tutorials/workflow-tutorial.md) (`GreetingWorkflow`) using the [`@Workflow`](../api-reference/decorators.md#workflow) decorator. We move the `@GetApi` decorator to this function to serve HTTP requests from it.
- We invoke both `SendGreetingEmail` and `InsertGreeting` from this workflow.
- We introduce a sleep allowing you to interrupt the program midway through the workflow.

When executing a workflow, DBOS persists the output of each step in your database.
That way, if a workflow is interrupted, DBOS can restart it from where it left off.
To see this in action, build and start the application by running:

```
npm run build
npx dbos-sdk start
```

Then, visit [http://localhost:3000/greeting/Mike](http://localhost:3000/greeting/Mike) in your browser to send a request to the application.
On your terminal, you should see an output like:

```shell
> npx dbos-sdk start
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
[info]: Sending email "Thank you for being awesome, Mike!" to Mike...
[info]: Email sent!
[info]: Press control + C to interrupt the workflow...
```
Press control + c when prompted to interrupt the workflow.
Then, run `npx dbos-sdk start` to restart DBOS Cloud.
You should see an output like:

```
> npx dbos-sdk start
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
[info]: Greeting sent to Mike!
```

Notice how DBOS automatically restarted your program and ran it to completion, but didn't re-send the email.
This reliability is a core feature of DBOS: workflows always run to completion and each of their operations executes once and only once.

The code for this guide is available on [GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/greeting-emails).

Next, to learn how to build more complex workflows, check out our [advanced programming guide](./quickstart-shop.md).
