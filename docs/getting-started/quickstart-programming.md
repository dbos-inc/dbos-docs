---
sidebar_position: 2
title: Programming Quickstart
---

Let's learn how to program in DBOS!
In this tutorial, we will modify the example application from our [quickstart](./quickstart.md) to reliably send a greeting note to your friends.
Along the way, we'll introduce you to core DBOS concepts and show how you can easily build a reliable and transactional application.
First, you'll learn to create HTTP endpoints to serve requests.
Then, you'll learn how to interact with a database and embed third party API calls to your application.
Finally, you'll compose these steps in reliable workflows.

This tutorial assumes you have finished our [quickstart](./quickstart.md).
For convenience, we recommend initializing a new DBOS application and starting a database for it.
Run the following commands, choosing a project name with no spaces or special characters:

```
npx @dbos-inc/dbos-sdk init -n <project-name>
cd <project-name>
export PGPASSWORD=dbos
./start_postgres_docker.sh
truncate -s 0 src/operations.ts
```

### Serving Applications Serverlessly

:::info what you will learn
How to serve your application via HTTP.
:::

In DBOS, you focus on your business logic and leave the rest to us.
Let's add an HTTP GET handler to your application so it can send greetings to your friends.
Add this code to `src/operations.ts`:

```javascript
import { HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'

export class Greetings {
  @GetApi('/greeting/:friend')
  static async Greet(ctxt: HandlerContext, friend: string) {
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

The key to this code is the [`@GetApi`](../api-reference/decorators#getapi) method decorator, which tells DBOS to serve the `Greet` function from HTTP GET requests to the `/greeting` endpoint.
As you will see, the DBOS SDK relies on [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) to simplify your programming experience.
To load these decorators, DBOS methods must be static class members.
In this case, `Greet` is a static member of the `Greetings` class.

To learn more about HTTP serving in DBOS, see [our guide](../tutorials/http-serving-tutorial).

### Database transactions are baked in!

:::info what you will learn
How to interact with the database.
:::

Let's augment the code to insert a new record in the database when we greet a friend.
Using the [`@Transaction`](../api-reference/decorators#transaction) decorator, you can access a managed database client handling the low-level details of connection management for you:

```javascript
import { TransactionContext, Transaction, HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'
import { Knex } from 'knex';

export class Greetings {
  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {
    await ctxt.client.raw('INSERT INTO dbos_hello (greeting_name, greeting_note_content) VALUES (?, ?)', [friend, content]);
  }

  @GetApi('/greeting/:friend')
  static async Greet(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);
    return noteContent;
  }
}
```

The key element of this code are:
- Calling the transaction from the handler using the context: `ctxt.invoke(Greetings).InsertGreeting(friend)`.
- Inserting a row in the database with `ctxt.client.raw()`

:::info
In this quickstart, we write our database operations in raw SQL (using [knex.raw](https://knexjs.org/guide/raw.html)) to make them easy to follow, but we also support [knex's query builder](https://knexjs.org/guide/query-builder.html) and [TypeORM](https://typeorm.io/).
:::

The managed client provided in the transaction context (`ctxt.client`) handles the details of beginning, committing or rolling back database transactions.

### Interacting with third party services

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
import axios from "axios";

export class Greetings {
    @Communicator()
    static async SendGreetingEmail(ctxt: CommunicatorContext) {
        ctxt.logger.info("Sending Email...")
        // Code omitted for simplicity
        ctxt.logger.info("Email sent!")
    }

  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {
    await ctxt.client.raw(
      "INSERT INTO dbos_hello (greeting_name, greeting_note_content) VALUES (?, ?)",
      [friend, content],
    );
  }

  @GetApi("/greeting/:friend")
  static async Greet(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    await ctxt.invoke(Greetings).SendGreetingEmail();
    await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);
    return noteContent;
  }
}
```

The key element of this code is the new `SendGreetingEmail` method, invoked by the `Greet` handler.
For simplicity, we print the email instead of sending it.

### Composing Reliable orkflows

:::info what you will learn
How to compose operations in DBOS workflows to obtain exactly once guarantees.
:::

To avoid spamming our friends, we want to make sure the email is only sent once if we retry it after a transient failure.
DBOS provide a [Workflow](../tutorials/workflow-tutorial.md) abstraction to help you do exactly that.
Workflows let you compose DBOS operations and do the heavy lifting to provide reliabity guarantees.
To see them in action, add this code to `src/operations.ts`:

```javascript
import {
    TransactionContext, Transaction,
    HandlerContext, GetApi,
    CommunicatorContext, Communicator,
    WorkflowContext, Workflow,
} from "@dbos-inc/dbos-sdk";
import { Knex } from "knex";
import axios from "axios";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Greetings {
    @Communicator()
    static async SendGreetingEmail(ctxt: CommunicatorContext) {
        ctxt.logger.info("Sending Email...")
        // Code omitted for simplicity
        ctxt.logger.info("Email sent!")
    }

    @Transaction()
    static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {
        await ctxt.client.raw(
            "INSERT INTO dbos_hello (greeting_name, greeting_note_content) VALUES (?, ?)",
            [friend, content]
        );
    }

    @Workflow()
    static async SendGreetingNoteWorkflow(ctxt: WorkflowContext, friend: string) {
        const noteContent = `Thank you for being awesome, ${friend}!`;
        await ctxt.invoke(Greetings).SendGreetingEmail();

        for (let i = 0; i < 5; i++) {
            ctxt.logger.info(
                "Press control + C to interrupt the workflow..."
            );
            await sleep(1000);
        }

        await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);
        ctxt.logger.info("Workflow done!");
        return noteContent;
    }

    @GetApi("/greeting/:friend")
    static async Greet(ctxt: HandlerContext, friend: string) {
        const workflow_handle = await ctxt.invoke(Greetings).SendGreetingNoteWorkflow(friend);
        return await workflow_handle.getResult();
    }
}
```

The key elements of this snippet are:
- We composed the transaction and communicator in a workflow (`SendGreetingNoteWorkflow`)
- We introduced a sleep allowing you to stop the program before the workflow can complete

When executing a workflow, DBOS persists the output of each step in your database.
That way, if a workflow is interrupted for any reason, DBOS can then restart it from exactly where it left off.
To see this in action, build and start the application by running:

```
npx dbos-sdk build
npx dbos-sdk start
```

Then visit [http://localhost:3000/greeting/Jim](http://localhost:3000/greeting/Jim) in your browser to send a request to the application.
On your terminal, you should see an output like:

```shell
> npx dbos-sdk start
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
[info]: Sending Email...
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
[info]: Workflow done!
```

Notice how DBOS automatically restarted your program and ran it to completion, but didn't re-send the email.
This reliability is a core feature of DBOS: workflows always run to completion and each of their operation executes once and only once.

[TODO: tease the next part of the docs]
