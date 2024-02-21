---
sidebar_position: 2
title: Programming Quickstart
---

Let's learn how to program in DBOS! In this tutorial, we will write a simple application featuring all DBOS concepts -- serverless, transaction, communicators and workflows. This application will reliably send a thank you note to your friends.

First, you will learn to declare HTTP endpoints to serve applications. Then, you will learn how to interact with a database and embed third party API calls to your application. Finally, you will learn how to compose these steps in reliable workflows.

This tutorial assumes you have a local database running and `PGPASSWORD` is available in your environment.

[FIXME] detail steps to prepare the ground (db, wipe src/operation.ts, etc).

### Serverless applications

:::info what you will learn
Declare an HTTP GET endpoint to serve your application.
:::

In DBOS, you focus on your business logic and leave the rest to us.
Let's declare a simple GET handler that will serve requests at `/thanks/:friend`:

```javascript
import { HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'

export class Thanks {
  @GetApi('/thanks/:friend')
  static async ThankYou(ctxt: HandlerContext, friend: string) {
    return `Thank you, ${friend}!`;
  }
}
```

In one terminal, start your application with `npx dbos-sdk start`. You should see an output similar to:

```shell
[info]: Workflow executor initialized
[info]: HTTP endpoints supported:
[info]:     GET   :  /thanks/:friend
[info]: DBOS Server is running at http://localhost:3000
[info]: DBOS Admin Server is running at http://localhost:3001
```

You can now send a request to your application, for instance, using `cURL`:

```shell
> curl http://localhost:3000/thanks/Mary
Thank you, Mary!
```

The key element of this code is the method decorator [`@GetApi`](../api-reference/decorators#getapi), which automatically registers a GET endpoint and has `ThankYou()` serve it. As you will see, the DBOS SDK heavily relies on [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) to simplify your programming experience. To load these decorators, DBOS methods must be static class members. In this case, `ThankYou` is a static member of the `Thanks` class.

To learn more about HTTP endpoints and handlers, see [our guide](../tutorials/http-serving-tutorial).

### Database transactions are baked in!

:::info what you will learn
Interact with the database.
:::

Let's augment the code to insert a new record in the database when we thank a friend.
Using the [`@Transaction`](../api-reference/decorators#transaction) decorator, you can provide your code with a managed database client which will handle the low level details for you:

```javascript
import { TransactionContext, Transaction, HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'
import { Knex } from 'knex';

export class Thanks {
  @Transaction()
  static async InsertThankYou(ctxt: TransactionContext<Knex>, friend: string, content: string) {
    await ctxt.client.raw('INSERT INTO thanks (name, content) VALUES (?, ?)', [friend, content]);
  }

  @GetApi('/thanks/:friend')
  static async ThankYou(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    await ctxt.invoke(Thanks).InsertThankYou(friend, noteContent);
    return noteContent;
  }
}
```

The key element of this code are:
- Calling the transaction from the handler using `ctxt.invoke(Thanks).InsertThankYou(friend)`.
- Inserting a row in the database using `ctxt.client.raw()`

:::info
In this quickstart, we write our database operations in raw SQL (using [knex.raw](https://knexjs.org/guide/raw.html)) to make them easy to follow, but we also support [knex's query builder](https://knexjs.org/guide/query-builder.html) and the popular TypeScript ORMs [Prisma](https://www.prisma.io/) and [TypeORM](https://typeorm.io/).
:::

The managed client provided in the transaction context (`ctxt.client`) handles the detail of beginning a database transaction, commits it if it succeeds and rolls it back otherwise. Transactions can be configured, e.g., declared read only, through the [`@Transaction`](../api-reference/decorators#transaction) decorator.

### Interacting with third party services

:::info what you will learn
Send a request over the network and checkpoint the response.
:::

Assume we want to trigger the sending of the note through mail using a third party service that will handle the physical details for us and provide us with a unique identifier for the mail.
With DBOS we can capture the response of such third party calls using a [Communicator](../tutorials/communicator-tutorial). Let's update the code to first trigger the sending of the mail, then record its UUID alongside the note record in the database:

```javascript
import {
  TransactionContext, Transaction,
  HandlerContext, GetApi,
  CommunicatorContext, Communicator,
} from "@dbos-inc/dbos-sdk";
import { Knex } from "knex";
import axios from "axios";

export class Thanks {
  @Communicator()
  static async SendThankYouMail(ctxt: CommunicatorContext) {
    const res = await axios.get("https://www.uuidgenerator.net/api/guid");
    return res.data;
  }

  @Transaction()
  static async InsertThankYou(ctxt: TransactionContext<Knex>, friend: string, content: string, mailUUID: string) {
    await ctxt.client.raw("INSERT INTO thanks (name, content, uuid) VALUES (?, ?, ?)", [friend, content, mailUUID]);
  }

  @GetApi("/thanks/:friend")
  static async ThankYou(ctxt: HandlerContext, friend: string) {
    const noteContent = `Thank you for being awesome, ${friend}!`;
    const mailUUID = await ctxt.invoke(Thanks).SendThankYouMail();
    await ctxt.invoke(Thanks).InsertThankYou(friend, noteContent, mailUUID);
    return { noteContent, mailUUID };
  }
}
```

The key element of this code is the new `SendThankYouMail` method, invoked by the `ThankYou` handler.
For the sake of simplicity, we use a public API generating UUIDs.

### Composing reliable workflows

:::info what you will learn
Compose operations in DBOS workflows and retry a workflow with exactly once guarantees.
:::

Now that we can trigger the shipping of a mail for our notes and record the action in the database, we want to ensure the mail is sent only once, even when we have to retry in case of a transient failure.

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

export class Thanks {
  @Communicator()
  static async SendThankYouEmail(ctxt: CommunicatorContext) {
      const res = await axios.get("https://www.uuidgenerator.net/api/guid");
      return res.data;
  }

  @Transaction()
  static async InsertThankYou(ctxt: TransactionContext<Knex>, friend: string, content: string, noteUUID: string) {
      await ctxt.client.raw("INSERT INTO thanks (name, content, uuid) VALUES (?)", [friend, content, noteUUID]);
  }

  @Workflow()
  static async SendThankYouNoteWorkflow(ctxt: WorkflowContext, friend: string) {
      const noteContent = `Thank you for being awesome, ${friend}!`;
      const shipNoteUUID = await ctxt.invoke(Thanks).SendThankYouEmail();
      const now = new Date();
      const isNoon = now.getHours() === 12 && now.getMinutes() === 0;
      if (isNoon) {
        throw new Error("Sorry, lunch time!");
      }
      await ctxt.invoke(Thanks).InsertThankYou(friend, noteContent, shipNoteUUID);
      return { message: noteContent, uuid: shipNoteUUID };
  }

  @GetApi("/thanks/:friend/:uuid")
  static async ThankYou(ctxt: HandlerContext, friend: string, uuid: string = '') {
      let handle;
      if (uuid === '') {
          handle = await ctxt.invoke(Thanks).SendThankYouNoteWorkflow(friend);
      } else {
          handle = await ctxt.invoke(Thanks).SendThankYouNoteWorkflow(friend, uuid);
      }
      const workflowUUID = handle.getWorkflowUUID();
      try {
        return await handle.getResult();
      } catch(e);
        return { workflowUUID, error: e.message };
      }
  }
}
```

The key elements of this code are:
- We composed the transaction and communicator in a workflow
- We introduced a failure if the workflow runs at noon
- We introduced the concept of [workflow handles](../api-reference/workflow-handles.md)
- We showcased how to retry a workflow using its unique identifier


Our new `ThankYou` handler now invokes the `SendThankYouNoteWorkflow` and retrieves a workflow handle.
The workflow handle allows us to retrieve a unique identifier for the workflow (`getWorkflowUUID()`), which we can use to retry a workflow when calling `ctxt.invoke`. It also allows us to query the result of a workflow using `getResult()`.

In this case, we force the workflow to fail if the current time is noon and retry the workflow if its UUID is given.

DBOS will detect `SendThankYouEmail` has already been sent and reuse its output instead of sending the request again!

