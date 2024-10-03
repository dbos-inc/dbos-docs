---
sidebar_position: 5
title: Testing Runtime
description: API documentation for the DBOS testing runtime
---

# DBOS Testing Runtime

DBOS provides a testing runtime to facilitate writing unit tests for applications.
Before running your tests, [create and configure the runtime](#create-testing-runtime).
In your tests, use [the runtime's methods](#methods) to invoke your application's functions.
After your tests finish, [destroy the runtime](#runtimedestroy) to release resources.

::::tip
When writing tests, you are responsible for setting up and cleaning up your database schema, for example through migrations.
::::

---

## Create Testing Runtime

### createTestingRuntime(\[userClasses\], \[configFilePath\], \[dropSysDB\])
```typescript
async function createTestingRuntime(
  userClasses: object[] | undefined = undefined,
  configFilePath: string = dbosConfigFilePath,
  dropSysDB: boolean = true
): Promise<TestingRuntime>
```

Creates a testing runtime and loads user functions from provided `userClasses`.  By default, all classes and dependencies from the test file are loaded and registered.
Accepts an optional path to a [configuration file](./configuration.md), uses the default path (`dbos-config.yaml` in the package root) otherwise.
This method also provides an option to keep system database data across test runs.

The defaults are generally sufficient as long as classes are at least indirectly referenced from the test file:
```typescript
testRuntime = await createTestingRuntime();
```

However, to explicitly create a runtime loading functions from the `Hello` class and using `test-config.yaml`:
```typescript
testRuntime = await createTestingRuntime([Hello], "test-config.yaml");
```

:::warning

This method by default *drops and re-creates* the DBOS system database. You will lose all persisted system information such as workflow status. Don't run unit tests on your production database!
Also, make sure you close any open connections to the system database, otherwise, tests may time out because the `DROP DATABASE` command would fail.

:::

If you want to keep your system database across runs, you can specify `dropSysDB = false`. For example, to load all classes and dependencies, use the default configuration file, and keep the system database:
```typescript
testRuntime = await createTestingRuntime(undefined, "dbos-config.yaml", false);
```

## Methods
- [invoke(target, \[workflowUUID, params\])](#runtimeinvoketarget-workflowuuid-params)
- [invokeWorkflow(target, \[workflowUUID, params\])](#runtimeinvokeworkflowtarget-workflowuuid-params)
- [startWorkflow(target, \[workflowUUID, params\])](#runtimeinvokeworkflowtarget-workflowuuid-params)
- [retrieveWorkflow(workflowUUID)](#runtimeretrieveworkflowworkflowuuid)
- [send(destinationUUID, message, \[topic, idempotencyKey\])](#runtimesenddestinationuuid-message-topic-idempotencykey)
- [getEvent(workflowUUID, key, \[timeoutSeconds\])](#runtimegeteventworkflowuuid-key-timeoutseconds)
- [getHandlersCallback()](#runtimegethandlerscallback)
- [getConfig(key, defaultValue)](#runtimegetconfigkey-defaultvalue)
- [queryUserDB(sql, ...params)](#runtimequeryuserdbsql-params)
- [destroy()](#runtimedestroy)

### runtime.invoke(target, \[workflowUUID, params\])
```typescript
invoke<T>(target: T, workflowUUID?: string, params?: WorkflowInvokeParams): InvokeFuncs<T>
```

Invoke a transaction or step.
To invoke workflows, use [`invokeWorkflow`](#runtimeinvokeworkflowtarget-workflowuuid-params) or [`startWorkflow`](#runtimestartworkflowtarget-workflowuuid-params) instead.
The syntax for invoking function `fn` in class `Cls` with argument `arg` is:

```typescript
const output = await runtime.invoke(Cls).fn(arg);
```

You don't supply a context to an invoked function&#8212;the testing runtime does this for you.

You can also optionally provide additional parameters for `invoke()` including the [authenticated user and roles](../tutorials/authentication-authorization.md) and an [HTTPRequest](./contexts.md#ctxtrequest). This is especially helpful if you want to test individual functions without running end-to-end HTTP serving. The parameters have the following structure:

```typescript
interface WorkflowInvokeParams {
  readonly authenticatedUser?: string;    // The user who ran the function.
  readonly authenticatedRoles?: string[]; // Roles the authenticated user has.
  readonly request?: HTTPRequest;         // The originating HTTP request.
}
```

#### runtime.invokeWorkflow(target, \[workflowUUID, params\])

```typescript
invokeWorkflow<T>(target: T, workflowUUID?: string, params?: WorkflowInvokeParams): InvokeFuncs<T>
```

Invoke a workflow and wait for it to complete, returning its result.
The syntax for invoking workflow `wf` in class `Cls` with argument `arg` is:

```typescript
const output = await runtime.invokeWorkflow(Cls).wf(arg);
```

You don't supply a context to an invoked workflow&#8212;the testing runtime does this for you.

As with [invoke](#runtimeinvoketarget-workflowuuid-params), you can optionally provide a workflow idempotency key or workflow invocation parameters.

#### runtime.startWorkflow(target, \[workflowUUID, params\])

```typescript
startWorkflow<T>(target: T, workflowID?: string, params?: WorkflowInvokeParams, queue?: WorkflowQueue): InvokeFuncs<T>
```

Start a workflow and return a [handle](./workflow-handles.md) to it but do not wait for it to complete.
The syntax for starting workflow `wf` in class `Cls` with argument `arg` is:

```typescript
const workflowHandle = await runtime.startWorkflow(Cls).wf(arg);
```

You don't supply a context to start a workflow&#8212;the testing runtime does this for you.

As with [invoke](#runtimeinvoketarget-workflowuuid-params), you can optionally provide a workflow idempotency key or workflow invocation parameters.

If the `queue` argument is provided, the workflow may not start immediately.  Start of execution will be determined by the [queue](../reference/workflow-queues.md#class-workflowqueue) and its contents.


### runtime.retrieveWorkflow(workflowUUID)

```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>;
```

Returns a [workflow handle](./workflow-handles.md) for workflow [_workflowUUID_](../tutorials/workflow-tutorial#workflow-identity).
`R` is the return type of the target workflow.

### runtime.send(destinationUUID, message, \[topic, idempotencyKey\])

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>;
```

Sends _message_ to _destinationUUID_.
Messages can optionally be associated with a topic.
You can provide an optional idempotency key to guarantee only a single message is sent even if `send` is called more than once.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

### runtime.getEvent(workflowUUID, key, \[timeoutSeconds\])

```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>;
```

Retrieves a value published by a _workflowUUID_ with identifier _key_ using the [events API](../tutorials/workflow-communication-tutorial#events-api).
A call to `getEvent` waits for the value to be published and returns `null` in case of time out.

### runtime.getHandlersCallback()

```typescript
getHandlersCallback(): (req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse) => Promise<void>;
```

Returns a request handler callback for node's native [http/http2 server](https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener).
You can use this callback function to test handlers, for example, using [supertest](https://www.npmjs.com/package/supertest) to send a `GET` request to `/greeting/dbos` URL and verify the response:
```typescript
import request from "supertest";

const res = await request(testRuntime.getHandlersCallback()).get(
  "/greeting/dbos"
);
expect(res.statusCode).toBe(200);
expect(res.text).toMatch("Hello, dbos! You have been greeted");
```

### runtime.getConfig(key, defaultValue)

```typescript
getConfig<T>(key: string): T | undefined;
getConfig<T>(key: string, defaultValue: T): T;
```

Retrieves a property specified in the application section of the [configuration](./configuration.md#application).

### runtime.queryUserDB(sql, ...params)

```typescript
queryUserDB<R>(sql: string, ...params: any[]): Promise<R[]>;
```

Executes a [parameterized raw SQL query](https://node-postgres.com/features/queries#parameterized-query) on the user database.
The type `R` is the return type of the database row.

For example, to query the `dbos_hello` table created during [`quickstart`](../../quickstart.md) and check `greet_count`, using [Jest](https://jestjs.io/):
```typescript
const rows = await testRuntime.queryUserDB<dbos_hello>("SELECT * FROM dbos_hello WHERE name=$1", "dbos");
expect(rows[0].greet_count).toBe(1);
```

### runtime.destroy()

```typescript
destroy(): Promise<void>
```

Deconstructs the testing runtime and releases client connections to the database.
Please remember to run this method after your tests!
