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

::::warning

This method will *drop and re-create* a clean Operon system database. You will lose all persisted system information such as workflow status. Therefore, you should not run unit tests on your production database!

::::

Optionally, you can use a different Operon config file for tests, for example to use a separate database from other tests or to configure the log level for debugging.
Please see our [Testing Runtime reference](../api-reference/testing-runtime.md) for details.


### Invoking Functions

A testing runtime object can invoke workflows, transactions, and communicators using the `invoke` method.
For example, we can invoke `helloTransaction` and verify the output is as expected:
```typescript
const res = await testRuntime.invoke(Hello).helloTransaction("operon");
expect(res).toMatch("Hello, operon! You have been greeted");
```
In this code, we invoke the transaction with the input string `"operon"`.

### Testing HTTP Endpoints

The testing runtime provides a `getHandlersCallback()` function, which  returns a callback function for node's native http/http2 server. This allows you to test Operon handlers, for example, with [supertest](https://www.npmjs.com/package/supertest):
```typescript
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

### Further Reading

To learn the full testing runtime interface, please see [our testing runtime references](../api-reference/testing-runtime.md).
You can find the source code for this tutorial in [operations.test.ts](https://github.com/dbos-inc/operon/blob/main/examples/hello/src/operations.test.ts).