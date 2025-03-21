---
sidebar_position: 20
title: Testing and Debugging
description: Learn how to use the testing runtime for unit tests.
---

In this guide, you'll learn how to test your DBOS applications.

DBOS code can be easily tested in any unit-testing framework.
We'll show you how to write unit tests for the `Hello` example class shipped by [`npx @dbos-inc/create`](../../reference/tools/cli.md#npx-dbos-inccreate), using [Jest](https://jestjs.io/).

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
    "test": "npx dbos migrate && jest"
  }
```

### Launching DBOS

Before executing any test code that uses DBOS, DBOS should be launched:
```typescript
  beforeAll(async () => {
    await DBOS.launch();
  });
```

See [`DBOS.launch`](../../reference/transactapi/dbos-class.md#launching-dbos) for launch options.

#### Configuring DBOS Prior To Launch

By default, `DBOS.launch` loads the configuration from `dbos-config.yaml` in the package root and uses this information to set up the runtime.

To load configuration from a different file, or to create a configuration in another way, call [`DBOS.setConfig`](../../reference/transactapi/dbos-class#setting-the-application-configuration) prior to launch:
```typescript
    const [cfg, rtCfg] = parseConfigFile({configfile: 'my-testing-dbos-config.yaml'});
    DBOS.setConfig(cfg, rtCfg);
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

Finally, after your tests, you should clean up DBOS and release its resources:
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

::::info
You are responsible for setting and cleaning up database tables before and after tests.
In our example, we run Knex migrations with `npx dbos migrate` as part of our testing script in `package.json`, but this could have been done within the test instead.
::::

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

### DBOS TestingRuntime
In prior versions of the TypeScript SDK, a `TestingRuntime` was used to set up DBOS.  This approach is obsolete.
- Instead of creating a `TestingRuntime`, just call [`DBOS.setConfig()` and `DBOS.launch()`](../../reference/transactapi/dbos-class#launching-dbos) from your tests.
- Calls to `TestingRuntime` functions can usually be replaced with identical calls to [`DBOS`](../../reference/transactapi/dbos-class) functions.
- In most cases, application functions can be called directly within the tests.  Older app code can be invoked using [`DBOS.invoke`](../../reference/transactapi/dbos-class#calling-workflow-functions) instead of via `TestingRuntime.invoke`.
