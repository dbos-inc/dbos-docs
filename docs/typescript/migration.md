---
sidebar_position: 25
title: Migration Guide
---

With the release of DBOS TypeScript version 3 (aka DBOS TS v3), some APIs that were marked as deprecated in v2 have been removed.
Additionally, there are new APIs in v3 that have been deprecated and will be removed in a future version of DBOS TS. 
This document explains how to update your existing DBOS TS app to recommended v3 APIs.

## Update Context-based Methods

In DBOS TS v1, DBOS application methods had an explicit context parameter.
For example, the `paymentWorkflow` from the v1 Widget Store demo app was declared like this:

```ts
@Workflow()
static async paymentWorkflow(ctxt: WorkflowContext): Promise<void>
```

Having an explicit context parameter made it impossible to invoke these DBOS application methods directly.
DBOS TS v1 required an invocation helper method to call these methods.

```ts
await ctxt.invoke(ShopUtilities).subtractInventory();
```

In DBOS TS v2, a new set of decorators were introduced that did not use explicit context parameters.
Here is the same declaration from the DBOS TS v2 Widget Store demo app:

```ts
@DBOS.workflow()
static async paymentWorkflow(): Promise<void>;
```

Since they no longer have an explicit context parameter, v2 DBOS application methods can be invoked normally.
For example, the method call that previously needed the `WorkflowContext.invoke` helper can now be called directly.

```ts
await ShopUtilities.subtractInventory();
```

To migrate a DBOS TS v1 app, you need to remove the explicit context parameters from your DBOS application methods 
and replace the original decorators with the new DBOS class static decorators. 
Here are some of the more common v1 decorators that have been removed and their v2 equivalents.

| v1 Decorator | V2 Decorator |
|--------------|--------------|
| `@Worfklow`  | [`@DBOS.workflow`](./reference/workflows-steps.md#dbosworkflow) |
| `@Step`      | [`@DBOS.step`](./reference/workflows-steps.md#dbosstep) |
| `@Communicator`  | [`@DBOS.step`](./reference/workflows-steps.md#dbosstep) |
| `@Transaction`     | `@DBOS.transaction` (see [Data Sources](#data-sources) section below) |
| `@GetApi` | `@DBOS.getApi` (see HTTP section below) |
| `@PostApi` | `@DBOS.postApi` (see HTTP section below) |

:::tip
In addition to the context-free DBOS v2 APIs, DBOS TS v3 also introduces decorator-free APIs such as 
[`DBOS.registerWorkflow`](./reference/workflows-steps.md#dbosregisterworkflow) 
and [`DBOS.runStep`](./reference/workflows-steps.md#dbosrunstep). 
These are not required, but are available to DBOS TS v3 apps.
:::

## Context based capabilities

Capabilities that were originally accessed via the context parameter are now accessed via `DBOS` class statics.
For example, where in v1 methods like `setEvent` and `recv` were accessed via the explicit context parameter,
now they are static methods on the `DBOS` class. 
See [WorkflowEvents](./tutorials/workflow-tutorial.md#workflow-events) 
and [Workflow Messaging](./tutorials/workflow-tutorial.md@workflow-messaging-and-notifications) for more information.

In DBOS TS v2, the explicit context parameter types and the decorators associated with DBOS application methods that 
used them were marked as deprecated. In DBOS TS v3, those types and decorators have been removed.

Here are some of the common v1 context methods and properties that have been removed and their v2 replacement.


| v1 Context API | V2 API |
|----------------|--------|
| `ctx.workflowUUID` | [`DBOS.workflowID`](./reference/methods#dbosworkflowid) |
| `ctx.logger` | [`DBOS.logger`](./reference/methods#dboslogger) |
| `wf_ctx.invoke` | call method directly |
| `wf_ctx.startWorkflow` | [`DBOS.startWorkflow`](./reference/methods#dbosstartworkflow) |
| `wf_ctx.send` | [`DBOS.send`](./reference/methods#dbossend) |
| `wf_ctx.recv` | [`DBOS.recv`](./reference/methods#dbosrecv) |
| `wf_ctx.getEvent` | [`DBOS.getEvent`](./reference/methods#dbosgetevent) |
| `wf_ctx.setEvent` | [`DBOS.setEvent`](./reference/methods#dbossetevent) |
| `wf_ctx.sleepms` | [`DBOS.sleep`](./reference/methods#dbossleep) |
| `tx_ctx.client` | see [Data Sources](#data-sources) section below |

## HTTP Package

While DBOS TS v3 can still includes a [Koa](https://koajs.com/) based HTTP server, these capabilities are moving to an external package.
A future version of DBOS TS will remove these capabilities in favor of the external package. 
If you're using the included HTTP server, you are encouraged but not required to move to the external package.

First, install the new external package

```shell
npm install @dbos-inc/koa-serve
```

Then, in your code create a `DBOSKoa` instance.
Replace all DBOS HTTP decorators (such as @DBOS.getApi) with decorators from the `DBOSKoa` instance.
Anyplace you were accessing the Koa web context via `DBOS.koaContext` must change to using `DBOSKoa.koaContext`.

```ts
const dhttp = new DBOSKoa();

export class HTTPEndpoints {
  @dhttp.getApi('/')
  static async homepage() {
    const { userid } = DBOSKoa.koaContext.request.query;
    // use query string user id param in response
  }
}
```

For further information about the `DBOSKoa` package, please see the official documentation

## Data Sources

DBOS stores application execution history in a Postgres database.
This is called the system database.
In addition, in DBOS TS v1 and v2 there is built-in support for an application specific Postgres database.
This database can be used as the application sees fit.
For example, the Widget Store demo app stores both products and orders in this application specific database.
DBOS transactions are custom step types that update the app database and durably records execution history in a database transaction.

While DBOS TS v3 continues to support app databases, it introduces a number of external packages for application database integration called
[Datasources](./tutorials/transaction-tutorial.md).
Datasources have two primary benefits over the built-in app database support.

First, since they are external to core DBOS package, they can support arbitrary database drivers, query builders and object-relational mappers.
The core DBOS package only supports five different clients: [node-postgres](https://node-postgres.com/), [Knex.js](https://knexjs.org/),
[Drizzle](https://orm.drizzle.team/), [Prisma](https://www.prisma.io/) and [TypeORM](https://typeorm.io/). 
Adding support for some other package like [Postgres.js](https://github.com/porsager/postgres) is not feasible.
But adding an [external Postgres.js datasource](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/postgres-datasource) is straightforward.
Since it's an external package, it could even be implemented by a separate person or organization without involvement from DBOS, Inc.

Second, while the core DBOS package only supports a single application database, DBOS TS v3 support multiple datasources.
Each datasource is independent, so you could not only connect to different application databases, each could use whatever
datasource package would be appropriate for that database.

For more information on datasources, please see the [tutorial](./tutorials/transaction-tutorial.md) and 
[reference documentation](./reference/datasource.md).

## Remove Deprecated Step Packages

DBOS TS v2 shipped with several additional step packages for common scenarios like bcrypt hashing, random number generation 
and retrieving the current time. These have all been deprecated in v3.

### @dbos-inc/dbos-datetime Package

DBOS TS v3 introduces `DBOS.now()` method, which is just a checkpointed version of `Date.now()`. 
Once you have the checkpointed timestamp, you can deterministically create a date object from that value.

```ts 
// DBOS.now() is checkpointed, so will always return the same timestamp
const now = DBOS.now();
// creating a date object from a timestamp is deterministic, 
// so it does not need to be checkpointed
const dateObj = new Date(now)
```

### @dbos-inc/dbos-random Package

The `dbos-random` package provided a checkpointed version of [`Math.random`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random).
You can build your own checkpointed random number generator with [`DBOS.runStep`](./reference/workflows-steps.md#dbosrunstep).

```ts
// Generate a checkpointed random value inside of a workflow function
const value = await DBOS.runStep(() => Promise.resolve(Math.random()), { name: "random" });
```

If you want to use the random function multiple times, you can use [`DBOS.registerStep`](./reference/workflows-steps.md#dbosregisterstep)
to create a checkpointed step function.

```ts
// create a checkpointed random number generator function
const random = DBOS.registerStep(() => Promise.resolve(Math.random()), { name: "math.random" });
```

### @dbos-inc/dbos-bcrypt Package
The `dbos-bcrypt` package provided checkpointed versions of the `genSalt` and `hash` functions from
the [`bcrypt.js` package](https://github.com/dcodeIO/bcrypt.js). 
As detailed above for dbos-random, you can build your own checkpointed bcrypt methods with 
[`DBOS.runStep`](./reference/workflows-steps.md#dbosrunstep) or [`DBOS.registerStep`](./reference/workflows-steps.md#dbosregisterstep).

```ts
// generate checkpointed salt value inside of a workflow function
const salt = await DBOS.runStep(async (saltRounds: number = 10) => await bcryptjs.genSalt(saltRounds), { name: "bcrypt.genSalt" });

// generate a checkpointed bcrypt.hash function
const hashFunc = DBOS.registerStep((txt: string, saltRounds: number = 10) => bcryptjs.hash(txt, saltRounds), { name: "bcrypt.hash" });
```

:::info
`bcrypt.compare` is deterministic, so it can be called directly in a workflow or step function 
without needing to wrap it with `DBOS.runStep` or `DBOS.registerStep` .
:::





