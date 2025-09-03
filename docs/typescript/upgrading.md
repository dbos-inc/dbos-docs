---
sidebar_position: 200
title: Upgrading to TSv3
---

With the release of DBOS Transact TypeScript version 3 (DBOS TSv3), some APIs that were marked as deprecated in v2 have been removed.
Additionally, there are APIs that have been deprecated in v3 that will be removed in a future version of DBOS TS. 
This document explains how to update your existing DBOS TS app to recommended v3 APIs.

## Clean Up `dbos-config.yaml`
`dbos-config.yaml` is no longer required and no longer supports the `application:`, `env:`, and some other sections.  Application configuration should use other approaches, such as direct use of environment variables that are set using tools such as `dotenv` or DBOS Cloud [secrets](../production/dbos-cloud/secrets.md).

`dbos-config.yaml`, if in use, should only be used to provide the information needed by DBOS Cloud, the debugger, and other tools that start your app.  If `dbos-config.yaml` is not used, be sure to set important configuration information in a call to [`DBOS.setConfig`](./reference/dbos-class.md#dbossetconfig), prior to [`DBOS.launch`](./reference/dbos-class.md#dboslaunch).

### Use Start Commands And `DBOS.launch`
Previous versions of DBOS TS offered a "runtime", which loaded specified code files and then started a runtime for you.  This "entrypoints"-based runtime configuration is no longer available.  If your `dbos-config.yaml` does not have a `start:` or currently uses `entrypoints:` or `port:`, it should be changed to use `start:`.

For example:
```yaml
runtimeConfig:
  port: 8086
```

Would become:
```yaml
runtimeConfig:
  start:
    - "node dist/main.js"
```

It may be necessary to create a suitable main file containing setup and a call to `DBOS.launch`:
```typescript
// Note that port is no longer set in the runtime,
//   and should come from the environment and default to 3000
const PORT = parseInt(process.env.NODE_PORT ?? '3000');

async function main() {
  DBOS.setConfig({
    "name": "alert-center", // Setting app name is required
  });

  await DBOS.launch();
  DBOS.logRegisteredEndpoints();

  const app = new Koa();
  const appRouter = new Router();
  dkoa.registerWithApp(app, appRouter);

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().then(()=>{}).catch(console.error);
```

Similarly, within unit tests the `TestingRuntime` approach is no longer available, and a combination of `DBOS.setConfig` and `DBOS.launch` should be used instead.

For additional information, see:
- [Configuration](./reference/configuration.md)
- Configuring for [DBOS Cloud](../production/dbos-cloud/deploying-to-cloud.md)

For examples that use `start` commands, see:
- [Template Apps](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/create/templates)
- [Demo Apps](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript)

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
Here are some of the more common v1 decorators that have been removed and their v2 and v3 equivalents.

| v1 Decorator (Removed) | v2 Decorator (Supported) | v3 (Recommended) |
|------------------------|--------------------------|------------------|
| `@Workflow`  | [`@DBOS.workflow`](./reference/workflows-steps.md#dbosworkflow) | [`@DBOS.workflow`](./reference/workflows-steps.md#dbosworkflow) |
| `@Step`      | [`@DBOS.step`](./reference/workflows-steps.md#dbosstep) | [`@DBOS.step`](./reference/workflows-steps.md#dbosstep), [`DBOS.runStep`](./reference/workflows-steps.md#dbosrunstep) |
| `@Communicator`  | [`@DBOS.step`](./reference/workflows-steps.md#dbosstep) | [`@DBOS.step`](./reference/workflows-steps.md#dbosstep) |
| `@Transaction`     | `@DBOS.transaction` | [Data Sources](#datasources) (see section below) |
| `@GetApi` | `@DBOS.getApi` | [`koa-serve` external package ](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/koa-serve#serve-dbos-functions-over-http-with-koa) (see HTTP section below) |
| `@PostApi` | `@DBOS.postApi` | [`koa-serve` external package ](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/koa-serve#serve-dbos-functions-over-http-with-koa) (see HTTP section below) |

:::tip
In addition to the context-free DBOS v2 APIs, DBOS TS v3 also introduces decorator-free APIs such as 
[`DBOS.registerWorkflow`](./reference/workflows-steps.md#dbosregisterworkflow) 
and [`DBOS.runStep`](./reference/workflows-steps.md#dbosrunstep). 
Use of the decoratorless API is not required, but supports a broad range of programming styles and allows DBOS to be used in JavaScript code.
:::

## Accessing Context

In v1, DBOS methods had a subclass of `DBOSContext` (`StepContext`, `TransactionContext`, `WorkflowContext`, etc.) as their first parameter.  Capabilities that were originally accessed via these context parameters are now accessed via `DBOS` class static functions and properties.
For example, methods like `setEvent` and `recv` were accessed via the explicit `WorkflowContext` parameter in v1, but are now static methods on the `DBOS` class. 

In DBOS TS v2, the explicit context parameter types and the decorators associated with DBOS application methods that 
used them were marked as deprecated. In DBOS TS v3, those types and decorators have been removed.

Here are some of the common v1 context methods and properties that have been removed and their v2 replacement.

| v1 Context API | v2/v3 API |
|----------------|-----------|
| `DBOSContext.workflowUUID` | [`DBOS.workflowID`](./reference/methods#dbosworkflowid) |
| `DBOSContext.logger` | [`DBOS.logger`](./reference/methods#dboslogger) |
| `WorkflowContext.invoke` / `HandlerContext.invoke` | call method directly |
| `WorkflowContext.startWorkflow` / `HandlerContext.startWorkflow` | [`DBOS.startWorkflow`](./reference/methods#dbosstartworkflow) |
| `WorkflowContext.send` / `HandlerContext.send` | [`DBOS.send`](./reference/methods#dbossend) |
| `WorkflowContext.recv` | [`DBOS.recv`](./reference/methods#dbosrecv) |
| `WorkflowContext.getEvent` / `HandlerContext.getEvent` | [`DBOS.getEvent`](./reference/methods#dbosgetevent) |
| `WorkflowContext.setEvent` | [`DBOS.setEvent`](./reference/methods#dbossetevent) |
| `WorkflowContext.sleepms` | [`DBOS.sleep`](./reference/methods#dbossleep) |
| `TransactionContext.client` | `DBOS.sqlClient` (Deprecated. see [Data Sources](#datasources) section below) |

## Datasources

DBOS TS v1 and v2 provide built-in support for a single Postgres database for application data, and offer a choice of built-in access libraries.  This database can be used as the application sees fit.  For example, the [Fault-tolerant Checkout example application](./examples/checkout-tutorial.md) stores both products and orders in this application database, and accesses it with Knex.
DBOS transactions, decorated with `@Transaction` (v1) or `@DBOS.transaction` (v2), are steps that update the application database and durably record execution history.

While DBOS TS v3 continues to support a single v2-style application database, it introduces support [Datasource](./tutorials/transaction-tutorial.md) extension packages.  Datasources have two primary benefits over the built-in app database support.

First, while the core DBOS package only supports a single application database, DBOS TS v3 support multiple datasources.  Each datasource is independent, so you could not only connect to different application databases, each could use one or more clients that would be appropriate for that database.

Second, since they are external to core DBOS library, datasources can support additional database drivers, query builders, and object-relational mappers without a release of the main library.  The core DBOS package only supports five different clients: [node-postgres](https://node-postgres.com/), [Knex.js](https://knexjs.org/),
[Drizzle](https://orm.drizzle.team/), [Prisma](https://www.prisma.io/) and [TypeORM](https://typeorm.io/), and adding support for some other package like [Postgres.js](https://github.com/porsager/postgres) was not feasible.  However, adding an [external Postgres.js datasource](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/postgres-datasource) was straightforward, and since it's an external package, it could even be implemented by an independent person or organization without involvement from DBOS, Inc.

Upgrading to datasources is generally as simple as configuring and constructing a datasource object, and then switching the `@DBOS.transaction` decorators to use that object instead, and using the `.client` property of the datasource object instead of `DBOS.sqlClient` et al.

For example:
```typescript
  @DBOS.transaction()
  static async cleanAlerts() {
    await DBOS.knexClient<AlertEmployee>('alert_employee').where({alert_status: AlertStatus.RESOLVED}).delete();
  }
```

Becomes:
```typescript
  @knexds.transaction()
  static async cleanAlerts() {
    await knexds.client<AlertEmployee>('alert_employee').where({alert_status: AlertStatus.RESOLVED}).delete();
  }
```

Datasources also require [installation of a transaction checkpoint table](./tutorials/transaction-tutorial.md#installing-the-dbos-schema).

For more information on datasources, please see the [tutorial](./tutorials/transaction-tutorial.md) and 
[reference documentation](./reference/datasource.md).

## HTTP Package

DBOS TS v3 is a library that is intended to support usage by any JavaScript application desiring lightweight durable execution.  However, previous versions of DBOS TS included a simple, decorator-based (`@DBOS.getApi`, `@DBOS.postApi`, etc.) framework for registering HTTP endpoints and middleware.  While DBOS TS v3 still includes this [Koa](https://koajs.com/)-based HTTP server, its use is entirely optional and it is not launched by default.  Going forward, these HTTP capabilities are moving to an external package, [`@dbos-inc/koa-serve`](https://www.npmjs.com/package/@dbos-inc/koa-serve/v/3.0.56-preview), which is available for use in v3.
A future version of DBOS TS (likely v4) will remove the built-in capabilities in favor of this external package.
If you are using the included HTTP server, you are encouraged, but not required, to move to the external package.

First, install the new external package:

```shell
npm install @dbos-inc/koa-serve
```

Then, in your code, create a `DBOSKoa` instance.
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

For further information about the `koa-serve` package, please see the [package's documentation](https://www.npmjs.com/package/@dbos-inc/koa-serve/v/3.0.56-preview).

## Remove Deprecated Step Packages

DBOS TS v2 offered several additional step packages for common scenarios like bcrypt hashing, random number generation, 
and retrieving the current time.  These have all been deprecated in v3 as the functionality has much simpler equivalents.

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

## Other Packages
For DBOS v3, several other external packages were completely rewritten, generally simplifying their configuration and improving ease of use.  The general guidance for upgrading to v3 is:
- Configure and create objects using the underlying library (KafkaJS, AWS SQS, AWS SES, etc.)
- For sending requests (Kafka messages, SQS requests, S3 commands, emails, etc.) use [`runStep`](./reference/workflows-steps.md#dbosrunstep) or register a step wrapper.
- For running DBOS workflows in response to inbound events or messages, use the new v3 package.

| v1/v2 Package (Discontinued) | v3 (Recommended) |
|------------------------------|------------------|
| [`@dbos-inc/dbos-kafkjs`](https://www.npmjs.com/package/@dbos-inc/dbos-kafkajs) | [`@dbos-inc/kafkajs-receive`](https://www.npmjs.com/package/@dbos-inc/kafkajs-receive) |
| [`@dbos-inc/dbos-confluent-kafka`](https://www.npmjs.com/package/@dbos-inc/dbos-confluent-kafka) | [`@dbos-inc/confluent-kafka-receive`](https://www.npmjs.com/package/@dbos-inc/confluent-kafka-receive) |
| [`@dbos-inc/dbos-sqs`](https://www.npmjs.com/package/@dbos-inc/dbos-sqs) | [`@dbos-inc/sqs-receive`](https://www.npmjs.com/package/@dbos-inc/sqs-receive) |
| [`@dbos-inc/component-aws-s3`](https://www.npmjs.com/package/@dbos-inc/component-aws-s3) | [`@dbos-inc/aws-s3-workflows`](https://www.npmjs.com/package/@dbos-inc/aws-s3-workflows) |
| [`@dbos-inc/dbos-email-ses`](https://www.npmjs.com/package/@dbos-inc/dbos-email-ses) | unnecessary |

The documentation for these packages currently resides in their package README files.

### Kafka Consumer Packages
The packages for working with Kafka were replaced with simpler ones.  While the previous packages provided step wrappers for Kafka producers, you should now just produce messages in your own steps.

DBOS does provide two packages for connecting workflows to Kafka consumers:
- [`@dbos-inc/kafkajs-receive`](https://www.npmjs.com/package/@dbos-inc/kafkajs-receive)
- [`@dbos-inc/confluent-kafka-receive`](https://www.npmjs.com/package/@dbos-inc/confluent-kafka-receive)

Except for the underlying Kafka client library, these packages are similar, and use a `consume` decorator to connect `DBOS.workflow` methods to message topics:
```typescript
  @DBOS.workflow()
  @kafkaReceiver.consumer(respondTopic)
  static async inboundAlertWorkflow(_topic: string, _partition: number, message: KafkaMessage) { ... }
```

For a detailed example of using DBOS and Kafka together to publish and consume messages, see [Kafka Alert Queue](./examples/kafka-alert-queue.md).

### AWS SQS Receiver Package
Similar to the Kafka package changes, the SQS package was changed to include only a message receiver.  This is simpler to work with, as it allows much more flexibility in configuration of the SQS client.  After a client is constructed, SQS message receivers can be added to workflows using decorators:

```typescript
// Create a receiver (can configure now, or later...)
const sqsReceiver = new SQSReceiver();

// Optionally, configure the receiver at the class level
@sqsReceiver.configure({client: .../*SQS client or function to retrieve client goes here*/})
class SQSEventProcessor {
  @sqsReceiver.messageConsumer({ queueUrl: process.env['SQS_QUEUE_URL'] })
  @DBOS.workflow()
  static async recvMessage(msg: Message) {
    // Workflow code goes here...
  }
}
```

### AWS S3 Workflow Package
The package for working with AWS S3 was replaced with a much simpler one.  While the previous package attempted to configure and instantiate the S3 client and provided step wrappers for some S3 commands, the new package only provides the workflows for keeping the contents of an S3 bucket in sync with a list kept in a database table.  This allows much more flexibility in configuring S3, while demonstrating how DBOS workflows can be used to synchronize multiple external systems.

### AWS SES (Simple Email Service)
With the simplified v3 [step](./reference/workflows-steps.md#dbosrunstep) syntax and requirements, it was no longer deemed helpful to provide a step library for interacting with AWS SES.  Configuring SES and sending mail is much more flexible when done directly with the library, as demonstrated in the [example code](./examples/task-scheduler.md#sending-email-with-amazon-ses).