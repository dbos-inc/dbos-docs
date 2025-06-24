---
sidebar_position: 20
title: Testing
description: Learn how to use DBOS in popular unit testing frameworks.
---

In this guide, you'll learn how to test your DBOS applications.

DBOS code can be easily tested in any unit-testing framework.
We'll show you how to write unit tests for the `Hello` example class shipped by [`npx @dbos-inc/create`](../../reference/tools/cli.md#npx-dbos-inccreate), using [Jest](https://jestjs.io/) or [Vitest](https://vitest.dev/).

## Overview
Testing DBOS code involves the following steps:
- Installing and configuring your test tool
- Creating a test
- Setting up the app and system database before running tests
- Configuring and launching DBOS before running DBOS test code
- Calling DBOS functions
- Shutting down DBOS at the end of the test
- Running the tests, usually from a helper script in `package.json`

## Using `jest`

### Set Up Jest
If you haven't already, install jest.
```shell
npm i --save-dev jest @types/jest ts-jest
```

Set up a typical `jest.config.js`, such as:
```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '((\\.|/)(test|spec))\\.ts?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePaths: ['./'],
};
```

Start a template test file, with a name such as `main.test.ts`:
```typescript
import { DBOS } from '@dbos-inc/dbos-sdk';
import { app, dbos_hello, Hello } from './main';
import request from 'supertest';

describe('operations-test', () => {
    // Your test will go here...
});
```

To make it easy to run your tests, create a `scripts` entry in `package.json`:
```json
  "scripts": {
    "test": "npx knex migrate:latest && jest"
  }
```

### Launching DBOS

Before executing any test code that uses DBOS, DBOS should be configured and launched.  This is often placed in `beforeAll` or `beforeEach`, rather than in each test function.
```typescript
  beforeAll(async () => {
    DBOS.setConfig({
      name: 'my-app',
      databaseUrl: process.env.DBOS_TESTING_DATABASE_URL,
    });
    await DBOS.launch();
  });
```

See [`DBOS.launch`](../../reference/transactapi/dbos-class.md#launching-dbos) for launch options.

#### Setting Up App Databases Prior To Launch
You are responsible for setting and cleaning up database tables before and after tests.

In our example, we run Knex migrations with `npx knex migrate:latest` as part of our testing script in `package.json`, but this could have been done within the test instead.  For example, if you are using TypeORM, the schema can be set up from within the test itself using `DBOS.createUserSchema`:
```typescript
  beforeEach(async () => {
    DBOS.setConfig({
      name: 'my-app',
      databaseUrl: process.env.DBOS_TESTING_DATABASE_URL,
    });
    await DBOS.launch();
    await DBOS.dropUserSchema();
    await DBOS.createUserSchema();
  });
```

#### Resetting The System Database
If your tests reuse workflow IDs, it is necessary to clean out the DBOS system database to ensure a consistent starting point for testing.  Dropping the system database with `DBOS.dropSystemDB` must be done after DBOS is configured (so the database connection parameters are known), but prior to launch (so that the system database is not yet in use):

```typescript
    DBOS.setConfig({
      name: 'my-app',
      databaseUrl: process.env.DBOS_TESTING_DATABASE_URL,
    });
    await DBOS.dropSystemDB();
    await DBOS.launch();
```

### Testing Functions

Once DBOS is launched, a test can invoke workflows, transactions, and steps directly.  Functions on the [`DBOS` class](../../reference/transactapi/dbos-class) can be used to interact with workflows and check database status during the course of the test.

For example:
```typescript
  test('test-transaction', async () => {
    const res = await Hello.helloTransaction('dbos');
    expect(res).toMatch('Hello, dbos! You have been greeted');

    // Check the greet count.
    const rows = (await DBOS.queryUserDB('SELECT * FROM dbos_hello WHERE name=$1', ['dbos'])) as dbos_hello[];
    expect(rows[0].greet_count).toBe(1);
  });
```

In this code, we invoke `Hello.helloTransaction` with the input string `"dbos"`, and verify its output is as expected.

### Testing HTTP Endpoints

If you are testing HTTP handling capabilities, these can be tested using a framework such as [supertest](https://www.npmjs.com/package/supertest).

Import the testing package:
```typescript
import request from "supertest";
```

Launch your app's HTTP server, or launch DBOS with your app server:
```typescript
  beforeAll(async () => {
    DBOS.setConfig({
      name: 'my-app',
      databaseUrl: process.env.DBOS_TESTING_DATABASE_URL,
    });
    await DBOS.launch({ expressApp: app });
  });
```

Use the handler callback during the course of unit-testing.  In this code, we send a `GET` request to our `/greeting/dbos` URL and verify its response:
```typescript
  test('test-endpoint', async () => {
    const res = await request(app).get('/greeting/dbos');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch('Hello, dbos! You have been greeted');
  });
```

### Cleaning Up

Finally, after your tests, you should clean up DBOS and release its resources.  Generally, this is done in `afterAll` (or `afterEach`):
```typescript
  afterAll(async () => {
    await DBOS.shutdown();
  });
```

### Run Tests
Now let's run the tests!
```shell
npm run test
```

You should see the test results similar to the following:
```bash
 PASS  src/main.test.ts
  operations-test
    ✓ test-transaction (21 ms)
    ✓ test-endpoint (17 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.247 s, estimated 2 s
```

### Further Reading
You can find the source code for this tutorial in [operations.test.ts](https://github.com/dbos-inc/dbos-transact-ts/blob/main/packages/create/templates/dbos-knex/src/main.test.ts).

## Using `vitest`

Using `vitest` is similar to using `jest`.

First, create a `vitest.config.ts` file for your project if it doesn't already have one:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // Use "node" for backend tests
    include: ["test/**/*.test.ts"], // Adjust this to match your test file locations
  },
});
```

Then, write test code.  Basic test code in `vitest` is identical to code for `jest`:
```typescript
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { DBOS, parseConfigFile } from "@dbos-inc/dbos-sdk";
import { MyWorkflow } from "../dbos/operations";

describe("dbos functions", () => {
  beforeEach(async () => {
    DBOS.setConfig({
      name: 'my-app',
      databaseUrl: process.env.DBOS_TESTING_DATABASE_URL,
    });
    await DBOS.launch();
  });

  afterEach(async () => {
    await DBOS.shutdown();
  });

  it("runs-dbos-code", async () => {
    await MyWorkflow.backgroundTask(4);
    expect(1).toBe(1);
  });
});
```

For convenience, add a `test` (or similar) script to your `package.json` file:
```json
"scripts": {
    "test": "pnpm vitest run"
}
```

:::tip
Note the use of the `run` command.  Without it, `vitest` may enter a continuous testing mode where it watches file changes and re-executes tests.  As the DBOS executor does not support "hot reload" of workflow code, this mode will not work consistently.
:::

Finally, call your `test` script:
```shell
npm run test
```


Output similar to the following should be produced:
```bash
 ✓ test/dbos.test.ts (1 test) 758ms
   ✓ dbos functions > runs-dbos-code 757ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  11:08:00
   Duration  2.39s (transform 41ms, setup 0ms, collect 1.40s, tests 758ms, environment 0ms, prepare 75ms)
```

## DBOS TestingRuntime
In prior versions of the TypeScript SDK, a `TestingRuntime` was used to set up DBOS.  This approach is obsolete.
- Instead of creating a `TestingRuntime`, just call [`DBOS.setConfig()` and `DBOS.launch()`](../../reference/transactapi/dbos-class#launching-dbos) from your tests.
- Calls to `TestingRuntime` functions can usually be replaced with identical calls to [`DBOS`](../../reference/transactapi/dbos-class) functions.
- In most cases, application functions can be called directly within the tests.  Older app code can be invoked using [`DBOS.invoke`](../../reference/transactapi/dbos-class#calling-workflow-functions) instead of via `TestingRuntime.invoke`.
