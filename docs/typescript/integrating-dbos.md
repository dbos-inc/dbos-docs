---
sidebar_position: 20
title: Add DBOS To Your App
---

This guide shows you how to add the open-source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-ts) library to your existing application to **durably execute** it and make it resilient to any failure.

:::info
Also check out the integration guides for popular TypeScript frameworks:
- [Nest.js + DBOS](../integrations/nestjs.md)
:::

:::warning
The DBOS library and DBOS workflows cannot be bundled with JavaScript or TypeScript bundlers.
Additional support for bundling will be added in an upcoming release.
:::

### Using DBOS Transact

#### 1. Install DBOS

`npm install` DBOS into your application. Note that DBOS requires Node.js 20 or later.

```shell
npm install @dbos-inc/dbos-sdk@latest
```

Then, enable TypeScript decorators in your `tsconfig.json` file:

```json title="tsconfig.json"
  "compilerOptions": {
    "experimentalDecorators": true,
  }
```

DBOS requires a Postgres database.
If you already have Postgres, you can set the `DBOS_DATABASE_URL` environment variable to your connection string (later we'll pass that value into DBOS).
Otherwise, you can start Postgres in a Docker container with this command:

```shell
npx dbos postgres start
```


#### 2. Initialize DBOS in Your App

In your app's main entrypoint, add the following code.
This initializes DBOS when your app starts.

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";

DBOS.setConfig({
  "name": "my-app",
  "databaseUrl": process.env.DBOS_DATABASE_URL
});
await DBOS.launch();
```

#### 3. Start Your Application

Try starting your application.
If everything is set up correctly, your app should run normally, but log `DBOS launched!` on startup.
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
