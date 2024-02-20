---
sidebar_position: 7
title: Communicator Library
description: API reference for library of DBOS Communicators
---

## Background

In DBOS, communicators represent interfaces to external systems, or wrap nondeterministic functions, and are often reusable.
DBOS comes with a small library of communicators for common purposes.

---

## Usage

To use a communicator from the library, first install it from the appropriate npm package:
```
npm install --save @dbos-inc/communicator-datetime
```

Import the communicator into your TypeScript code:
```typescript
import { CurrentTimeCommunicator } from '@dbos-inc/communicator-datetime';
export { CurrentTimeCommunicator }; // Currently necessary for registration to see the class
```

For DBOS to register the communicator functions, it is currently necessary for the communicator to be exported from your `operations.ts` file (as it would be for any other communicator).
If the code using the communicator is not in `operations.ts`, add a line to export the communicator from `operations.ts` also.
```typescript
export { CurrentTimeCommunicator } from '@dbos-inc/communicator-datetime';
```

Invoke the communicator from a `WorkflowContext`:
```typescript
const curDate = await wfCtx.invoke(CurrentTimeCommunicator).getCurrentDate();
```

When using the DBOS testing runtime, if you are explicitly providing the list of classes to register, it will be necessary to register any library communicator classes also:
```typescript
  testRuntime = await createTestingRuntime([Operations, CurrentTimeCommunicator], "dbos-config.yaml");
```

---

## `BcryptCommunicator`
The functions in the [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) package are non-deterministic because the salt is generated randomly.  To ensure consistent workflow behavior, bcrypt should therefore be run in a communicator so that the output can be recorded.

This communicator is provided in the `@dbos-inc/communicator-bcrypt` package.

### `bcryptGenSalt(saltRounds?:number)`
`bcryptGenSalt` produces a random salt.  Optional parameter is the number of rounds.

### `bcryptHash(txt: string, saltRounds?:number)`
`bcryptHash` generates a random salt and uses it to create a hash of `txt`.

## `CurrentTimeCommunicator`
For workflows to make consistent decisions based on time, reading the current time should be done via a communicator so that the value can be recorded and is available for workflow restart or replay.

This communicator is provided in the `@dbos-inc/communicator-datetime` package.

### `getCurrentDate()`

This function returns a `Date` object representing the current clock time.

### `getCurrentTime()`
This function returns a `number` of milliseconds since January 1, 1970, UTC, in the same manner as `new Date().getTime()`.

## `RandomCommunicator`
For consistent workflow execution, the results of anything random should be recorded by running the logic in a communicator.

This communicator is provided in the `@dbos-inc/communicator-random` package.

### `random()`
`random` is a wrapper for `Math.random()` and similarly produces a `number` in the range from 0 to 1.
