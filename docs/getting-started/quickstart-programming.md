---
sidebar_position: 2
title: Programming Quickstart
---

Let's learn how to program in DBOS! In this tutorial, we will modify the example hello application setup during [init](quickstart.md) to reliably send a greetings note to your friends. This simply application will cover all core DBOS concepts - serverless, transaction, communicators and workflows.

First, you will learn to declare HTTP endpoints to serve applications. Then, how to interact with a database and embed third party API calls to your application. Finally, you will compose these steps in reliable workflows.

This tutorial assumes you have followed the SDK [quickstart](quickstart.md), have its database running and `PGPASSWORD` is available in your environment.
For your convenience, you can erase the content of `src/operations.ts` and replace it with this guide's code.

### Serverless applications

:::info what you will learn
Declare an HTTP GET endpoint to serve your application.
:::

In DBOS, you focus on your business logic and leave the rest to us.
Let's declare a simple GET handler to serving `/greeting/:friend`:

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

You can now send a request to your application, for instance, using `cURL`:

```shell
> curl http://localhost:3000/greeting/Mary
Greetings, Mary!
```

The key element of this code is the method decorator [`@GetApi`](../api-reference/decorators#getapi), which automatically registers a GET endpoint and has `Hello()` serve it. As you will see, the DBOS SDK heavily relies on [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) to simplify your programming experience. To load these decorators, DBOS methods must be static class members. In this case, `Greet` is a static member of the `Greetings` class.

To learn more about HTTP endpoints and handlers, see [our guide](../tutorials/http-serving-tutorial).

### Database transactions are baked in!

:::info what you will learn
Interact with the database.
:::

Let's augment the code to insert a new record in the database when we greet a friend.
Using the [`@Transaction`](../api-reference/decorators#transaction) decorator, you can provide your code with a managed database client handling the low level details for you:

```javascript
import { TransactionContext, Transaction, HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'
import { Knex } from 'knex';

export class Greetings {
  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {
    await ctxt.client.raw('INSERT INTO dbos_hello (name, greeting_note_content) VALUES (?, ?)', [friend, content]);
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
- Calling the transaction from the handler using `ctxt.invoke(Greetings).InsertGreeting(friend)`.
- Inserting a row in the database using `ctxt.client.raw()`

:::info
In this quickstart, we write our database operations in raw SQL (using [knex.raw](https://knexjs.org/guide/raw.html)) to make them easy to follow, but we also support [knex's query builder](https://knexjs.org/guide/query-builder.html) and the popular TypeScript ORMs [Prisma](https://www.prisma.io/) and [TypeORM](https://typeorm.io/).
:::

The managed client provided in the transaction context (`ctxt.client`) handles the detail of beginning, committing or rolling back database transactions. Transactions can be configured, e.g., declared read only, through the [`@Transaction`](../api-reference/decorators#transaction) decorator.

### Interacting with third party services

:::info what you will learn
Send a request over the network and checkpoint the response.
:::

Assume we want to trigger the sending of a greeting mail using a third party service which will handle the physical details for us and provide us with a unique identifier for the mail.
With DBOS we can capture the response of such third party calls using a [Communicator](../tutorials/communicator-tutorial). Let's update the code to first trigger the sending of the mail, then record its UUID alongside the note record in the database:

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
  static async SendGreetingMail(ctxt: CommunicatorContext) {
    const res = await axios.get("https://www.uuidgenerator.net/api/guid");
    return res.data;
  }

  @Transaction()
  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string, uuid: string) {
    await ctxt.client.raw("INSERT INTO dbos_hello (name, greeting_note_content, greeting_note_uuid) VALUES (?, ?, ?)", [friend, content, uuid]);
  }

  @GetApi("/greeting/:friend")
  static async Greet(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    const mailUUID = await ctxt.invoke(Greetings).SendGreetingMail();
    await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent, mailUUID);
    return { noteContent, mailUUID };
  }
}
```

The key element of this code is the new `SendGreetingMail` method, invoked by the `ThankYou` handler.
For the sake of simplicity, we use a public API generating UUIDs.

### Composing reliable workflows

:::info what you will learn
Compose operations in DBOS workflows to obtain exactly once guarantees.
:::

We want to ensure the mail is sent only once even when we retry the whole process in spite of a transient failure.
DBOS provide a [Workflow](../tutorials/workflow-tutorial.md) abstraction to help you do exactly that. Workflows let you compose DBOS operations and do the heavy lifting to provide reliabity guarantees. Let us rewrite the code:

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
        const res = await axios.get("https://www.uuidgenerator.net/api/guid");
        return res.data;
    }

    @Transaction()
    static async InsertGreeting(
        ctxt: TransactionContext<Knex>, friend: string, content: string, noteUUID: string,
    ) {
        await ctxt.client.raw(
            "INSERT INTO dbos_hello (name, greeting_note_content, greeting_note_uuid) VALUES (?, ?, ?)",
            [friend, content, noteUUID]
        );
    }

    @Workflow()
    static async SendGreetingNoteWorkflow(ctxt: WorkflowContext, friend: string) {
        const noteContent = `Thank you for being awesome, ${friend}!`;
        const shipNoteUUID = await ctxt.invoke(Greetings).SendGreetingEmail();
        ctxt.logger.info(`Mail sent with UUID: ${shipNoteUUID}`);

        for (let i = 0; i < 5; i++) {
            ctxt.logger.info(
                "Press control + C to interrupt the workflow..."
            );
            await sleep(1000);
        }

        await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent, shipNoteUUID);
        return { message: noteContent, uuid: shipNoteUUID };
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
- We introduced a 5 seconds sleep allowing you to stop the program before the workflow can complete

DBOS persists intermediate workflow state in your database. If we stop the application when prompted and restarts it, DBOS will detect the presence of a pending workflow and resume its execution. It will use the recorded output of `SendGreetingEmail` instead of calling again the third party service and resume the workflow execution.

Here is an example output when we start the program once, call the endpoint, terminate the program, then restart it:

```shell
> npx dbos-sdk start
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
[info]: Mail sent with UUID: 27df0fb3-7897-4f79-b8ea-ae11dcbfa27c
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
^C

> npx dbos-sdk start
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /greeting/:friend
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
[info]: Mail sent with UUID: 27df0fb3-7897-4f79-b8ea-ae11dcbfa27c
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
[info]: Press control + C to interrupt the workflow...
```

The first time the workflow executed, we received a mail ID `27df0fb3-7897-4f79-b8ea-ae11dcbfa27c` from the third party service.
When we resumed the program, DBOS detected the pending workflow and resume it. Note it uses the same unique identifier `27df0fb3-7897-4f79-b8ea-ae11dcbfa27c` to continue executing the workflow. Check the `hello` database to see an entry in the `dbos_hello` table with this `greeting_note_uuid`!


[TODO: tease the next part of the docs]
