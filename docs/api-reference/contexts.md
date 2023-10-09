---
sidebar_position: 1
title: Operon Contexts
---

Each instance of Operon workflows, transactions, communicators and HTTP handlers have an associated context. Transactions,

## `OperonContext`

The base context for each operation

```tsx
interface OperonContext {
  request?: IncomingMessage; // Nodejs IncomingMessage
  workflowUUID: string; // Unique identifier for the workflow. Empty string for Handler instances.
  authenticatedUser: string; // Identity of the caller, if provided.

  span: Span; // An OpenTelemetry Trace object.

  getConfig(key: string): any;

  info(message: string): void;
  warn(message: string): void;
  log(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}
```

## `WorkflowContext`
```tsx
interface WorkflowContext extends OperonContext {
  invoke<T extends object>(object: T): WFInvokeFuncs<T>;
  send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string | null): Promise<void>;
  recv<T extends NonNullable<any>>(topic?: string | null, timeoutSeconds?: number): Promise<T | null>
  setEvent<T extends NonNullable<any>>(key: string, value: T): Promise<void>;
  transaction<T extends any[], R>(txn: OperonTransaction<T, R>, ...args: T): Promise<R>; // TODO: Make private
  external<T extends any[], R>(commFn: OperonCommunicator<T, R>, ...args: T): Promise<R>; // TODO: Make private
}
```

## `TransactionContext`

```tsx
interface TransactionContext extends OperonContext {
  pgClient: PoolClient;
  prismaClient: PrismaClient;
  typeormEM: TypeORMEntityManager;
}
```

## `CommunicatorContext`

```tsx
interface CommunicatorContext extends OperonContext {
  readonly retriesAllowed: boolean;
  readonly maxAttempts: number;
}
```

## `HandlerContext`

```tsx
interface HandlerContext extends OperonContext {
  koaContext: Koa.Context;
  send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic: string): Promise<void>;
  getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>;
  retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>;
  invoke<T extends object>(object: T, workflowUUID?: string): HandlerTxFuncs<T> & HandlerWfFuncs<T>;
  workflow<T extends any[], R>(wf: OperonWorkflow<T, R>, params: WorkflowParams, ...args: T): Promise<WorkflowHandle<R>>; // TODO: Make private
  transaction<T extends any[], R>(txn: OperonTransaction<T, R>, params: WorkflowParams, ...args: T): Promise<R>; // TODO: Make private

}
```
