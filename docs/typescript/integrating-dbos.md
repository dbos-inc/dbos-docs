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

Then, enable TypeScript decorators in your `tsconfig.json` file:

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

DBOS.setConfig({
  "name": "dbos-starter",
  "databaseUrl": process.env.DBOS_DATABASE_URL
})
await DBOS.launch();
```

#### 3. Start Your Application

Try starting your application.
When `DBOS.launch()` is called, it will attempt to connect to a Postgres database.
If your project already uses Postgres, set the `DBOS_DATABASE_URL` environment variable to a connection string to your Postgres database.
Otherwise, DBOS will automatically guide you through launching a new Postgres database (using Docker if available, else DBOS Cloud) and connecting to it.

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
