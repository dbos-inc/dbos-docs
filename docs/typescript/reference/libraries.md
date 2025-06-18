---
sidebar_position: 40
title: Package Library
description: API reference for library of DBOS Optional Packages
---

## Background

In DBOS, steps and event handlers represent interfaces to external systems, or wrap nondeterministic functions, and are often reusable.
DBOS comes with several libraries for common purposes.

---

## Usage

To use a package from the library, first install it with `npm`:
```
npm install --save @dbos-inc/knex-datasource
```

Import the functions and/or classes into your TypeScript code:
```typescript
import { KnexDataSource } from '@dbos-inc/dbos-datetime';
```

Invoke the step:
```typescript
const knexDS = const dataSource = new KnexDataSource('app-db', config);
```

## Amazon Web Services (AWS) Integation Libraries


## Simple Storage Service (S3)

DBOS provides steps for working with S3, and transactional workflows for keeping a database table in sync with an S3 bucket.  For details of the functionality, see the documentation accompanying the [@dbos-inc/component-aws-s3](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/component-aws-s3) package.

## Simple Queue Service (SQS)

DBOS provides steps for sending messages via Amazon SQS, and an event receiver for executing workflow functions in response to received SQS messages.  For details of the functionality, see the documentation accompanying the [@dbos-inc/dbos-sqs](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/dbos-sqs) package.

