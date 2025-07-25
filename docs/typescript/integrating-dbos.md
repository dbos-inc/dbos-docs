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

**Optionally**, if you want to use TypeScript decorators, enable them in your `tsconfig.json` file:

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


#### 2. Launch DBOS in Your App

In your app's main entrypoint, add a call to `DBOS.launch()`.  This initializes DBOS when your app starts.

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";

DBOS.setConfig({
  "name": "my-app", // If not set, will be taken from package.json
  // Other options
});

await DBOS.launch();
```

`launch` should be called after the app is created, but before it begins processing requests.  Prior to launch, [`setConfig`](./reference/dbos-class.md#dbossetconfig) can optionally be used to provide configuration information for the system database location.

#### 3. Start Your Application

Try starting your application.
If everything is set up correctly, your app should run normally, but log `DBOS launched!` on startup.
Congratulations!  You've integrated DBOS into your application.

#### 4. Start Building With DBOS

At this point, you can apply DBOS durability to your functions.
For example, you can register one of your functions as a [workflow](./tutorials/workflow-tutorial.md) and call other functions as [steps](./tutorials/step-tutorial.md).
DBOS durably executes the workflow so if it is ever interrupted, upon restart it automatically resumes from the last completed step.

```typescript
class DBOSSteps
{
  @DBOS.step()
  static async stepOne() {
    DBOS.logger.info("Step one completed!");
  }

  @DBOS.workflow()
  static async staticWorkflow() {
    DBOSSteps.stepOne();
  }
}

async function stepTwo() {
  DBOS.logger.info("Step two completed!");
}

async function workflowFunction() {
  await DBOSSteps.stepOne();
  await DBOS.runStep(stepTwo, {name: "stepTwo"});
}

const workflow = DBOS.registerWorkflow(workflowFunction, "workflow")

await workflow();
await DBOSSteps.staticWorkflow();
```

**You must register all workflows before calling `DBOS.launch()`**
As workflow recovery will commence after `DBOS.launch()`, it is essential that all workflows, queues, and other resources be registered before this point.

You can add DBOS to your application incrementally&mdash;it won't interfere with code that's already there.
It's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code.

To learn more about programming with DBOS, check out [the programming guide](./programming-guide.md).
