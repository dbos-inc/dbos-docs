---
sidebar_position: 20
title: Add DBOS To Your App
---

This guide shows you how to add the open-source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-ts) library to your existing application to **durably execute** it and make it resilient to any failure.

:::info
Also check out the integration guides for popular TypeScript frameworks:
- [Next.js + DBOS](../integrations/adding-dbos-to-next.md)
- [Nest.js + DBOS](../integrations/nestjs.md)
:::

### Using DBOS Transact

#### 1. Install DBOS

`npm install` DBOS into your application. Note that DBOS requires Node.js 20 or later.

```shell
npm install @dbos-inc/dbos-sdk
```

Then, create a `dbos-config.yaml` file in your app's root directory:

```yaml title="dbos-config.yaml"
# yaml-language-server: $schema=https://raw.githubusercontent.com/dbos-inc/dbos-transact-ts/main/dbos-config.schema.json

language: node
telemetry:
  logs:
    logLevel: 'info'
```

Also, enable TypeScript decorators in your `tsconfig.json` file:

```json title="tsconfig.json"
  "compilerOptions": {
    "experimentalDecorators": true,
  }
```


#### 2. Initialize DBOS in Your App

In your app's main entrypoint, add the following code.
This initializes DBOS when your app starts.

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";

await DBOS.launch();
```

#### 3. Start Your Application

Try starting your application:

```
npm start # Or use your own start command
```

When [`await DBOS.launch()`](./reference/transactapi/dbos-class#launching-dbos) is called, it will attempt to connect to a Postgres database.
If your project is already using Postgres, add the connection information for your database to [`dbos-config.yaml`](./reference/configuration#database).
Otherwise, DBOS will automatically guide you through launching a new database and connecting to it.

After you've connected to Postgres, your app should run normally, but log `DBOS launched` on startup.
Congratulations!  You've integrated DBOS into your application.

#### 4. Start Building With DBOS

At this point, you can add any DBOS decorator or method to your application.
For example, you can annotate one of your functions as a [workflow](./tutorials/workflow-tutorial.md) and the functions it calls as [steps](./tutorials/step-tutorial.md).
DBOS durably executes the workflow so if it is ever interrupted, upon restart it automatically resumes from the last completed step.

```typescript
export class Example {

  @DBOS.step()
  static async myStep(n) {
    DBOS.logger.info(`Step ${n} completed!`);
  }

  @DBOS.workflow()
  static async exampleWorkflow() {
    await Example.myStep(1);
    await Example.myStep(2);
  }
}
```

To ensure that DBOS registers all decorated functions, **declare all DBOS-decorated functions before running `await DBOS.launch()`.**

You can add DBOS to your application incrementally&mdash;it won't interfere with code that's already there.
It's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code.

To learn more about programming with DBOS, check out [the programming guide](./programming-guide.md).

### Deploying to DBOS Cloud

Any application you build with DBOS can be serverlessly deployed to DBOS Cloud.
DBOS Cloud can seamlessly autoscale your application to millions of users and provides built-in dashboards for observability and monitoring.

#### 1. Install the DBOS Cloud CLI


Run this command to install the cloud CLI globally.


```shell
npm i -g @dbos-inc/dbos-cloud@latest
```

#### 2. Define a Start Command

Set the `start` command in the `runtimeConfig` section of your [`dbos-config.yaml`](./reference/configuration.md) to your application's launch command.

```yaml title="dbos-config.yaml"
runtimeConfig:
  start:
    - npm start
```
If your application includes an HTTP server, configure it to listen on port 3000.
To test that it works, try launching your application with `npx dbos start`.


#### 3. Deploy to DBOS Cloud

Run this single command to deploy your application to DBOS Cloud!

```shell
dbos-cloud app deploy
```
