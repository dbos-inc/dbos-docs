---
sidebar_position: 45
title: Event Receivers
description: API reference for custom event receivers and context.
---

## Extensibility
DBOS Transact allows libraries, such as those designed to receive external events, to initiate DBOS functions.

### Decorators
Such libraries may choose to implement method decorators.  If the method decorator is registering a function with DBOS Transact, it should call `DBOS.registerAndWrapContextFreeFunction` for functions that do not accept a context as the first parameter.

```typescript
DBOS.registerAndWrapContextFreeFunction<This, Args extends unknown[], Return>(
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(this: This, ...args: Args) => Promise<Return>>,
)
```

`DBOS.registerAndWrapContextFreeFunction` registers the function named `propertyKey` on the `target` class, creates a wrapper function, and updates the `descriptor` to use the wrapper function.

### Calling DBOS Functions From Event Dispatchers
DBOS functions that are decorated as `DBOS.workflow`, `DBOS.transaction`, or `DBOS.step`, can be run directly from event receiver dispatch loops.
For more complex circumstances, such as invoking functions with a context argument, `DBOS.executor` provides access to the [`DBOSExecutorContext` interface](#dbosexecutorcontext).

#### Setting Authenticated User And Roles
When calling DBOS functions, it may be desired to set context variables, such as the authenticated user, and the current tracing span.  The following functions can be used for these purposes:
```typescript
// Set the authenticated user, and roles allowed by the authentication system for the scope of the callback() function
DBOS.withAuthedContext<R>(authedUser: string, authedRoles: string[], callback: () => Promise<R>): Promise<R>

// Set the tracing span for the scope of the callback() function
DBOS.withTracedContext<R>(callerName: string, span: Span, request: HTTPRequest, callback: () => Promise<R>): Promise<R>

// Set the caller name for the scope of the callback() function
DBOS.withNamedContext<R>(callerName: string, callback: () => Promise<R>): Promise<R>
```

#### Example
In the following example, the `TestSecurity.testWorkflow` function is executed for authenticated user "joe", with role "user". 
````typescript
  const hijoe = await DBOS.withAuthedContext('joe', ['user'], async() => {
    return await TestSecurity.testWorkflow('joe');
  });
````

## `DBOSExecutorContext`
The `DBOSExecutorContext` is used by event receivers to get their configuration information and invoke workflows, transactions, or communicators in response to received events.

```typescript
export interface DBOSExecutorContext
{
  readonly logger: Logger;
  readonly tracer: Tracer;

  getRegistrationsFor(eri: DBOSEventReceiver) : DBOSEventReceiverRegistration[];

  workflow<T extends unknown[], R>(wf: WorkflowFunction<T, R>, params: WorkflowParams, ...args: T): Promise<WorkflowHandle<R>>;
  transaction<T extends unknown[], R>(txnFn: TransactionFunction<T, R>, params: WorkflowParams, ...args: T): Promise<R>;
  external<T extends unknown[], R>(stepFn: StepFunction<T, R>, params: WorkflowParams, ...args: T): Promise<R>;

  send<T>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>;
  getEvent<T>(workflowID: string, key: string, timeoutSeconds: number): Promise<T | null>;
  retrieveWorkflow<R>(workflowID: string): WorkflowHandle<R>;

  getEventDispatchState(svc: string, wfn: string, key: string): Promise<DBOSEventReceiverState | undefined>;
  upsertEventDispatchState(state: DBOSEventReceiverState): Promise<DBOSEventReceiverState>;

  queryUserDB(sql: string, params?: unknown[]): Promise<unknown[]>;

  userDBListen(channels: string[], callback: DBNotificationCallback): Promise<DBNotificationListener>;
}
```

### Properties and Methods

#### `DBOSExecutorContext.logger`

```typescript
readonly logger: Logger
```

A reference to DBOS's global logger.  Event receivers may log information related to event dispatch to this logger.
Please see our [logging tutorial](../../tutorials/logging.md) for more information.

#### `DBOSExecutorContext.tracer`

```typescript
readonly tracer: Tracer;
```

A reference to DBOS's tracer.  Event receivers may initiate or propagate tracing information via `tracer`.
Please see our [logging tutorial](../../tutorials/logging.md) for more information.


#### `DBOSExecutorContext.getConfig`
```typescript
getConfig<T>(key: string, defaultValue: T | undefined) : T | undefined
```

`getConfig` retrieves configuration information (from .yaml config file / environment).  If `key` is not present in the configuration, `defaultValue` is returned.

#### `DBOSExecutorContext.getRegistrationsFor`
```typescript
export interface DBOSEventReceiverRegistration {
  methodConfig: unknown,
  classConfig: unknown,
  methodReg: MethodRegistrationBase
}

getRegistrationsFor(eri: DBOSEventReceiver) : DBOSEventReceiverRegistration[];
```

`getRegistrationsFor` provides a list of all method registrations associated with the specified `DBOSEventReceiver`.  Each method registration includes configuration and dispatch information:
* `classConfig`: Any configuration information collected by class-level decorators
* `methodConfig`: Any configuration information collected by method-level decorators
* `methodReg`: Reference to the method to be called for each event

#### `DBOSExecutorContext.workflow`
```typescript
workflow<T extends unknown[], R>(
  wf: WorkflowFunction<T, R>, params: WorkflowParams, ...args: T
) : Promise<WorkflowHandle<R>>;
```

Invokes the provided `wf` workflow function, with inputs specified by `args`.  The `WorkflowParams` control how the workflow is started:
* `WorkflowParams.workflowUUID`: Set the workflow [idempotency key](../../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency), for OAOO.
* `WorkflowParams.queueName`: Indicate that the workflow is to be run in a [queue](./workflow-queues.md#class-workflowqueue), with the provided name.  The queue with the provided `queueName` must have been created and registered prior to executing `workflow`, as the queue provides necessary concurrency and rate-limiting information.

The return value of `workflow` is a [`WorkflowHandle`](./workflow-handles.md) for the running or queued workflow.

#### `DBOSExecutorContext.transaction`
```typescript
transaction<T extends unknown[], R>(
  txnFn: TransactionFunction<T, R>, params: WorkflowParams, ...args: T
) : Promise<R>;
```

Invokes a single-operation workflow consisting of the provided `txnFn` function, with inputs specified by `args`.  For additional information, see [`DBOSExecutorContext.workflow`](#dbosexecutorcontextworkflow).

#### `DBOSExecutorContext.external`
```typescript
external<T extends unknown[], R>(
  stepFn: StepFunction<T, R>, params: WorkflowParams, ...args: T
) : Promise<R>;
```

Invokes a single-operation workflow consisting of the provided `stepFn` function, with inputs specified by `args`.  For additional information on `WorkflowParams`, see [`DBOSExecutorContext.workflow`](#dbosexecutorcontextworkflow).

#### `DBOSExecutorContext.send`
```typescript
send<T extends NonNullable<any>>(destinationID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>
```

Sends a message to the workflow identified by `destinationID`.
Messages can optionally be associated with a topic.
You can provide an optional idempotency key to guarantee only a single message is sent even if `send` is called more than once.
For more information, see the [messages API tutorial](../../tutorials/workflow-tutorial.md#workflow-messaging-and-notifications).

#### `DBOSExecutorContext.getEvent`
```typescript
getEvent<T extends NonNullable<any>>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

Retrieves an event published by `workflowID` for a given key using the [events API](../../tutorials/workflow-tutorial.md#workflow-events).
Awaiting on the promise returned by `getEvent()` waits for the workflow to set the key, returning `null` if the wait times out.

#### `DBOSExecutorContext.retrieveWorkflow`
```typescript
retrieveWorkflow<R>(workflowID: string): WorkflowHandle<R>
```

Returns a [workflow handle](./workflow-handles.md) to the workflow with [identity](../../tutorials/workflow-tutorial#workflow-ids-and-idempotency) `workflowID`.
`R` is the return type of the target workflow.

#### `DBOSExecutorContext.upsertEventDispatchState`
```typescript
upsertEventDispatchState(state: DBOSEventReceiverState): Promise<DBOSEventReceiverState>;

export interface DBOSEventReceiverState
{
  service: string;
  workflowFnName: string;
  key: string;
  value?: string;
  updateTime?: number;
  updateSeq?: bigint;
}
```

An event receiver may keep state in the system database.  This state may be helpful for backfilling events that came in while the event receiver was not running.  This state uses a key/value store design, where the event receiver may use `upsertEventDispatchState` to insert/update the value associated with a key, and retrieve the value associated with a key.  This implementation also supports the notion of an update time or update sequence; updates made with lower sequence numbers or times are discared if the existing entry is marked with a later sequence / time.

The key consists of:
* `service`: `service` should be unique to the event receiver keeping state, to separate from other table users
* `workflowFnName`: `workflowFnName` workflow function name should be the fully qualified / unique function name dispatched, to keep state separate by event function
* `key`: The `key` field allows multiple records per service / workflow function

The value stored for each `service`/`workflowFnName`/`key` combination includes:
* `value`: `value` is a string value.  JSON can be used to encode more complex values.
* `updateTime`: The time `value` was set.  Upserts of records with an earlier `updateTime` will have no effect on the stored state.
* `updateSeq`: An integer number indicating when the value was set.  Upserts of records with a smaller `updateSeq` will have no effect on the stored state.

`upsertEventDispatchState` inserts a value associated with a key.  If a value is already associated with the specified key, the stored value will be updated, unless `updateTime` or `updateSeq` is provided, and is less that what is already stored in the system database.

The function return value indicates the contents of the system database for the specified key.  This is useful to detect if a more recent record is alreadys stored in the database.

#### `DBOSExecutorContext.getEventDispatchState`
```typescript
getEventDispatchState(service: string, workflowFnName: string, key: string)
  : Promise<DBOSEventReceiverState | undefined>;
```

Retrieve the value set for an event receiver's key, as stored by [`upsertEventDispatchState`](#dbosexecutorcontextupserteventdispatchstate) above.  If no value has been associated with the combination of `service`/`workflowFnName`/`key` above, then `undefined` is returned.

#### `DBOSExecutorContext.queryUserDB`
```typescript
queryUserDB(sql: string, params?: unknown[]): Promise<unknown[]>;
```

Executes the provided `sql` template against the default user application database, using `params`.

#### `DBOSExecutorContext.userDBListen`
```typescript
interface DBNotification {
    channel: string;
    payload?: string;
}

type DBNotificationCallback = (n: DBNotification) => void;

interface DBNotificationListener {
  close(): Promise<void>;
}

userDBListen(channels: string[], callback: DBNotificationCallback): Promise<DBNotificationListener>;
```

`userDBListen` listens for notifications within the default user application database:
* `channels` is a list of notification channels of interest
* `callback` will be executed for each notification received
The return value of `userDBListen` is a `DBNotificationListener` which should be used to `close` the listener and stop the listening operation cleanly.

`callback` is the function that will be called when notifications arrive; it is provided with a `DBNotification` containing the `channel` and optional `payload` of the received notification. 
