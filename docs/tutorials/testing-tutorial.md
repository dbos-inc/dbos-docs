---
sidebar_position: 8
title: Testing and Debugging
description: Learn how to use the testing runtime for unit tests.
---

In this guide, you'll learn how to test your DBOS applications.

DBOS provides a [testing runtime](../api-reference/testing-runtime.md) to make it easier to write unit tests for DBOS applications.
Using the runtime, you can invoke and test your application's functions individually.

We'll show you how to write unit tests for the `Hello` example class shipped by [`npx @dbos-inc/dbos-sdk init`](../api-reference/cli.md#npx-dbos-sdk-init).
We use [Jest](https://jestjs.io/) in this example, but the testing runtime works with any testing framework.

### Creating Testing Runtime

First, let's create a `TestingRuntime` object:
```typescript
testRuntime = await createTestingRuntime([Hello]);
```
This function takes in a list of classes you want to test. Here, we want to test the methods of the `Hello` class.

You can also optionally provide a path to a [configuration file](../api-reference/configuration.md).
If no path is provided, the runtime loads a configuration file from the default location (`dbos-config.yaml` in the package root).

### Testing Functions

A testing runtime object can invoke workflows, transactions, and communicators using the `invoke` method.
The syntax for invoking function `foo(ctxt, args)` in class `Bar` is `testRuntime.invoke(Bar).foo(args)`.
You don't need to supply the context to an invoked function&#8212;the testing runtime does this for you.
For example:
```typescript
const res = await testRuntime.invoke(Hello).helloTransaction("dbos");
expect(res).toMatch("Hello, dbos! You have been greeted");
```
In this code, we invoke `helloTransaction` with the input string `"dbos"`, and verify its output is as expected.

### Testing HTTP Endpoints

The testing runtime provides a `getHandlersCallback()` function, which  returns a callback function for node's native `http/http2` server. This allows you to test HTTP handlers, for example, with [supertest](https://www.npmjs.com/package/supertest):
```typescript
import request from "supertest";

const res = await request(testRuntime.getHandlersCallback()).get(
  "/greeting/dbos"
);
expect(res.statusCode).toBe(200);
expect(res.text).toMatch("Hello, dbos! You have been greeted");
```
In this code, we send a `GET` request to our `/greeting/dbos` URL and verify its response.

### Cleaning Up

Finally, after your tests, you can clean up the testing runtime and release its resources:
```typescript
await testRuntime.destroy();
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

To learn the full testing runtime interface, please see [our testing runtime references](../api-reference/testing-runtime.md).
You can find the source code for this tutorial in [operations.test.ts](https://github.com/dbos-inc/dbos-ts/blob/main/examples/hello/src/operations.test.ts).
