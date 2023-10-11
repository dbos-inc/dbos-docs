---
sidebar_position: 9
title: Testing
description: Learn how to use the testing runtime for unit tests.
---

In this guide, you'll learn how to test your Operon applications.

Operon provides a [testing runtime](..) that allows you to test your applications without starting an HTTP server.
The testing runtime provides useful methods for you to invoke decorated Operon functions, communicate with workflows, test HTTP endpoints, and query the user database.
This is especially helpful if you want to thoroughly test your applications with unit tests and debug individual functions within complex workflows.

We'll show you how to write unit tests for the `Hello` class we introduced in [Programming Quickstart: Part 1](../getting-started/quickstart-programming-1.md). We use [Jest](https://jestjs.io/) as an example, however, Operon testing runtime works with any testing framework.

### Creating Testing Runtime

First, let's create an `OperonTestingRuntime` object:
```javascript
testRuntime = await createTestingRuntime([Hello]);
```
You simply pass in a list of classes you want to test. For example, we pass in `[Hello]` here.

### Invoking Functions

A testing runtime object can invoke workflows, transactions, and communicators using the `invoke` method.
For example, we can invoke `helloTransaction` and verify the output is as expected:
```javascript
const res = await testRuntime.invoke(Hello).helloTransaction("operon");
expect(res).toMatch("Hello, operon! You have been greeted");
```
In this code, we invoke the transaction with the input string `"operon"`.

### Testing HTTP Endpoints

The testing runtime provides a `getHandlersCallback()` function, which  returns a callback function for node's native http/http2 server. This allows you to test Operon handlers, for example, with [supertest](https://www.npmjs.com/package/supertest):
```javascript
const res = await request(testRuntime.getHandlersCallback()).get(
  "/greeting/operon"
);
expect(res.statusCode).toBe(200);
expect(res.text).toMatch("Hello, operon! You have been greeted");
```
In this code, we send a `GET` request to our `/greeting/operon` URL and verify the response.

### Cleaning Up

Finally, after your tests, you can clean up the testing runtime and release its resources:
```javascript
await testRuntime.destroy();
```

### Further Reading

To learn the full testing runtime interface, please see [our testing runtime references](..).
You can find the source code for this tutorial in [operations.test.ts](..).