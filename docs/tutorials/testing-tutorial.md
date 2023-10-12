---
sidebar_position: 9
title: Testing and Debugging
description: Learn how to use the testing runtime for unit tests.
---

In this guide, you'll learn how to test your Operon applications.

Operon provides a [testing runtime](../api-reference/testing-runtime.md) that allows you to test your applications without starting an HTTP server.
The testing runtime provides useful methods for you to invoke decorated Operon functions, communicate with workflows, test HTTP endpoints, and query the user database.
This is especially helpful if you want to thoroughly test your applications with unit tests and debug individual functions within complex workflows.

We'll show you how to write unit tests for the `Hello` class we introduced in [Programming Quickstart: Part 1](../getting-started/quickstart-programming-1.md). We use [Jest](https://jestjs.io/) as an example, however, Operon testing runtime works with any testing framework.

### Creating Testing Runtime

First, let's create an `OperonTestingRuntime` object:
```typescript
testRuntime = await createTestingRuntime([Hello]);
```
You simply pass in a list of classes you want to test. For example, we pass in `[Hello]` here.

Optionally, you can specify an Operon config file for tests.
Please see our [Testing Runtime reference](../api-reference/testing-runtime.md) for details.


### Testing Functions

A testing runtime object can invoke workflows, transactions, and communicators using the `invoke` method.
The syntax for invoking function `foo(ctxt, args)` in class `Bar` is `testRuntime.invoke(Bar).foo(args)`.
You don't need to supply the context to an invoked function&#8212;the testing runtime does this for you.
For example:
```typescript
const res = await testRuntime.invoke(Hello).helloTransaction("operon");
expect(res).toMatch("Hello, operon! You have been greeted");
```
In this code, we invoke the transaction with the input string `"operon"`, and verify the output is as expected.

### Testing HTTP Endpoints

The testing runtime provides a `getHandlersCallback()` function, which  returns a callback function for node's native http/http2 server. This allows you to test Operon handlers, for example, with [supertest](https://www.npmjs.com/package/supertest):
```typescript
import request from "supertest";
 
const res = await request(testRuntime.getHandlersCallback()).get(
  "/greeting/operon"
);
expect(res.statusCode).toBe(200);
expect(res.text).toMatch("Hello, operon! You have been greeted");
```
In this code, we send a `GET` request to our `/greeting/operon` URL and verify the response.

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

Note that you are responsible to setup tables and clean them up before and after tests.
In our example, you can change the test script to run `npx knex migrate:up && jest && npx knex migrate:down`, which creates an `operon_hello` table, runs the tests, and drops the table after tests.

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
You can find the source code for this tutorial in [operations.test.ts](https://github.com/dbos-inc/operon/blob/main/examples/hello/src/operations.test.ts).