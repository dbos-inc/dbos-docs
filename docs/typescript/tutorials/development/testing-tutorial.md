---
sidebar_position: 20
title: Testing and Debugging
description: Learn how to use the testing runtime for unit tests.
---

In this guide, you'll learn how to test your DBOS applications.

DBOS code can be easily tested in any unit-testing framework.
We'll show you how to write unit tests for the `Hello` example class shipped by [`npx @dbos-inc/create`](../../reference/tools/cli.md#npx-dbos-inccreate), using [Jest](https://jestjs.io/).

### Launching DBOS

Before executing any test code that uses DBOS, DBOS should be launched:
```typescript
    await DBOS.launch();
    // Optional, only do this if you are testing built-in DBOS HTTP handlers
    await DBOS.setUpHandlerCallback();
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

Once DBOS is launched, a test can invoke workflows, transactions, and steps directly.

For example:
```typescript
const res = await Hello.helloTransaction("dbos");
expect(res).toMatch("Hello, dbos! You have been greeted");
```
In this code, we invoke `Hello.helloTransaction` with the input string `"dbos"`, and verify its output is as expected.

### Testing HTTP Endpoints

If you are using DBOS's built-in HTTP handling capabilities, these can be tested using a framework such as [supertest](https://www.npmjs.com/package/supertest).  (If you are using another method to handle HTTP, such as Express.js, follow the usual methods for testing with that server.)

DBOS provides `DBOS.getHTTPHandlersCallback()`, which returns a callback function for node's native `http/http2` server.  This allows you to test HTTP handlers using common tools for node.js.

First, add setup code to ensure that DBOS is launched, and that HTTP endpoints are also set up:
```typescript
    await DBOS.launch();
    await DBOS.setUpHandlerCallback();
```

Import the testing package:
```typescript
import request from "supertest";
```

Use the handler callback during the course of unit-testing.  In this code, we send a `GET` request to our `/greeting/dbos` URL and verify its response:
```typescript
const res = await request(DBOS.getHTTPHandlersCallback()).get(
  "/greeting/dbos"
);
expect(res.statusCode).toBe(200);
expect(res.text).toMatch("Hello, dbos! You have been greeted");
```

### Cleaning Up

Finally, after your tests, you should clean up DBOS and release its resources:
```typescript
await DBOS.shutdown();
```

### Run Tests
Now let's run the tests!
```shell
npm run test
```

::::info

You are responsible for setting and cleaning up database tables before and after tests.
In our example, we run Knex migrations as part of our testing script.

::::

You should see the test results similar to the following:
```bash
 PASS  src/operations.test.ts
  operations-test
    ✓ test-transaction (21 ms)
    ✓ test-endpoint (17 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.247 s, estimated 2 s
```

### Further Reading

You can find the source code for this tutorial in [operations.test.ts](https://github.com/dbos-inc/dbos-transact-ts/blob/main/packages/create/templates/hello-v2/src/operations.test.ts).
