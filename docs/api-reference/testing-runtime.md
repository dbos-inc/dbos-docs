---
sidebar_position: 6
title: Operon Testing Runtime
description: API documentation for Operon Testing Runtime
---

# Operon Testing Runtime

Operon provides a testing runtime to make it easier to write unit tests for Operon applications.
Before running your tests, [create and configure the runtime](#create-testing-runtime).
In your tests, use [the runtime's methods](#methods) to invoke your application's functions.
After your tests finish, [destroy the runtime](#runtimedestroy) to release resources.

::::tip

If you use TypeORM, you can use the testing runtime to [create](#runtimecreateuserschema) or [drop](#runtimedropuserschema) your schemas.
If you use Knex or Prisma, you are responsible for setting up schemas/tables and cleaning them up.

::::

---

### Create Testing Runtime

#### createTestingRuntime(userClasses, \[configFilePath\])
```typescript
async function createTestingRuntime(userClasses: object[], configFilePath: string = operonConfigFilePath): Promise<OperonTestingRuntime>
```

This method creates a testing runtime and loads user functions from provided `userClasses`.
You can also optionally provide a path to an Operon [configuration file](./configuration.md).
If no path is provided, the runtime loads a configuration file from the default location (`operon-config.yaml` in the package root).

This example creates a runtime that loads functions from the `Hello` class and uses the config file `test-config.yaml`:
```typescript
testRuntime = await createTestingRuntime([Hello], "test-config.yaml");
```

:::warning

This method *drops and re-creates* the Operon system database. You will lose all persisted system information such as workflow status. Don't run unit tests on your production database!

:::

### Methods
- [invoke(targetClass, \[workflowUUID, params\])](#runtimeinvoketargetclass-workflowuuid-params)
- [retrieveWorkflow(workflowUUID)](#runtimeretrieveworkflowworkflowuuid)
- [send(destinationUUID, message, \[topic, idempotencyKey\])](#runtimesenddestinationuuid-message-topic-idempotencykey)
- [getEvent(workflowUUID, key, \[timeoutSeconds\])](#runtimegeteventworkflowuuid-key-timeoutseconds)
- [getHandlersCallback()](#runtimegethandlerscallback)
- [getConfig(key)](#runtimegetconfigkey)
- [queryUserDB(sql, ...params)](#runtimequeryuserdbsql-params)
- [createUserSchema()](#runtimecreateuserschema)
- [dropUserSchema()](#runtimedropuserschema)
- [destroy()](#runtimedestroy)

#### runtime.invoke(targetClass, \[workflowUUID, params\])
```typescript
invoke<T>(targetClass: T, workflowUUID?: string, params?: OperonInvokeParams): InvokeFuncs<T>
```

You can use `invoke()` to invoke workflows, transactions, and communicators.

The syntax for invoking function `foo` in class `Bar` with argument `baz` is:

```typescript
runtime.invoke(Bar).foo(baz)
```

You don't need to supply a context to an invoked function&#8212;the testing runtime does this for you.

When calling transactions or communicators, `invoke()` asynchronously returns the function's output.
When calling workflows, `invoke()` asynchronously returns a [`handle`](./workflow-handles) for the workflow.

You can optionally provide a UUID idempotency key to the invoked function.
For more information, see our [idempotency tutorial](../tutorials/idempotency-tutorial.md).

You can also optionally provide additional parameters for `invoke()` including the [authenticated user and roles](../tutorials/authentication-authorization.md) and an [HTTPRequest](./contexts.md#ctxtrequest). This is especially helpful if you want to test individual functions without running end-to-end HTTP serving. The parameters have the following structure:

```typescript
interface OperonInvokeParams {
  readonly authenticatedUser?: string;    // The user who ran the function.
  readonly authenticatedRoles?: string[]; // Roles the authenticated user has.
  readonly request?: HTTPRequest;         // The originating HTTP request.
}
```

#### runtime.retrieveWorkflow(workflowUUID)

```typescript
retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>;
```

This method returns a [workflow handle](./workflow-handles.md) for the workflow with the input [identity UUID](../tutorials/workflow-tutorial#workflow-identity).
The type `R` is the return type of the target workflow.

#### runtime.send(destinationUUID, message, \[topic, idempotencyKey\])

```typescript
send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>;
```

This method sends a message to a destination workflow identity.
Messages can optionally be associated with a topic and are queued on the receiver per topic.
You can optionally provide an idempotency key to guarantee only a single message is sent even if `send` is called more than once.
For more information, see our [messages API tutorial](../tutorials/workflow-communication-tutorial#messages-api).

#### runtime.getEvent(workflowUUID, key, \[timeoutSeconds\])

```typescript
getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>;
```

This method retrieves a value published by a workflow identity for a given key using the [events API](../tutorials/workflow-communication-tutorial#events-api).
A call to `getEvent` waits for the value to be published, returning `null` if the wait times out.

#### runtime.getHandlersCallback()

```typescript
getHandlersCallback(): (req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse) => Promise<void>; 
```

This method returns a request handler callback for node's native [http/http2 server](https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener).
You can use this callback function to test handlers, for example, with [supertest](https://www.npmjs.com/package/supertest):
```typescript
import request from "supertest";

const res = await request(testRuntime.getHandlersCallback()).get(
  "/greeting/operon"
);
expect(res.statusCode).toBe(200);
expect(res.text).toMatch("Hello, operon! You have been greeted");
```
In this example, we send a `GET` request to our `/greeting/operon` URL and verify the response.

#### runtime.getConfig(key)

```typescript
getConfig(key: string): any;
```

This method retrieves a custom property value specified in [application configuration](./configuration.md#application-configuration).

#### runtime.queryUserDB(sql, ...params)

```typescript
queryUserDB<R>(sql: string, ...params: any[]): Promise<R[]>;
```

This methods executes a [parameterized raw SQL query](https://node-postgres.com/features/queries#parameterized-query) on the user database.
The type `R` is the return type of the database row.

For example, we can query the [`operon_hello`](../getting-started/quickstart-programming-1.md) table in our tests and check the `greet_count` is as expected.
```typescript
const rows = await testRuntime.queryUserDB<operon_hello>("SELECT * FROM operon_hello WHERE name=$1", "operon");
expect(rows[0].greet_count).toBe(1);
```

#### runtime.createUserSchema()

```typescript
createUserSchema(): Promise<void>;
```

:::caution Warning

Only use this method with TypeORM. It throws an error if you use other database clients.

:::

This method creates schemas/tables in the user database based on the provided TypeORM entity classes.

#### runtime.dropUserSchema()

```typescript
dropUserSchema(): Promise<void>;
```

:::caution Warning

Only use this method with TypeORM. It throws an error if you use other database clients.

:::

This method drops schemas/tables that are created by [`runtime.createUserSchema()`](#runtimecreateuserschema).

#### runtime.destroy()

```typescript
destroy(): Promise<void>
```

This method deconstructs the testing runtime and releases client connections to the database.
Please remember to run this method after your tests!
