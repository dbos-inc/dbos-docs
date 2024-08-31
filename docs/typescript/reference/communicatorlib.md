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
```

Invoke the communicator from a `WorkflowContext`:
```typescript
const curDate = await wfCtx.invoke(CurrentTimeCommunicator).getCurrentDate();
```

When using the DBOS testing runtime, if you are explicitly providing the list of classes to register, it will be necessary to register any library communicator classes also:
```typescript
  testRuntime = await createTestingRuntime(); // No explicit registration, classes referenced by test will be registered
  testRuntime = await createTestingRuntime([Operations, CurrentTimeCommunicator], "dbos-config.yaml"); // Specify everything
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

## Amazon Web Services (AWS) Communicators

### AWS Configuration
Configuration of AWS services typically relies on access keys, which are needed by the application to make service API calls, but also are to be kept secret.

There are multiple strategies used in AWS deployments, including the following:
- Use one access key for the whole application; this generally is the key for an IAM role that is authorized to use all APIs that the application requires
- Use one access key for each service used by the application
- Use multiple access keys for each service, potentially with different permissions for roles within the application

DBOS Transact is designed to make configuration with a single access key straightforward, while allowing more flexible configurations.

First, AWS configuration sections are added to the `application` part of `dbos-config.yaml`:
```yaml
application:
  aws_config:
    aws_region: ${AWS_REGION}
    aws_access_key_id: ${AWS_ACCESS_KEY_ID}
    aws_secret_access_key: ${AWS_SECRET_ACCESS_KEY}
```

The default configuration section of `application.aws_config` is used for any communicator that has not been specifically configured.

Individual AWS services can override this, for example the SES communicator uses `aws_ses_configuration` to specify the configuration(s) for use by SES:
```yaml
application:
  aws_ses_configuration: aws_config_ses
  aws_config_ses:
    aws_region: ${AWS_REGION}
    aws_access_key_id: ${AWS_ACCESS_KEY_ID_SES}
    aws_secret_access_key: ${AWS_SECRET_ACCESS_KEY_SES}
```

In the event that there are multiple access keys for the same service, the application must be involved in determining the number and purpose of the configurations.
```yaml
application:
  aws_config_ses_user:
    aws_region: ${AWS_REGION}
    aws_access_key_id: ${AWS_ACCESS_KEY_ID_SES_U}
    aws_secret_access_key: ${AWS_SECRET_ACCESS_KEY_SES_U}
  aws_config_ses_admin:
    aws_region: ${AWS_REGION}
    aws_access_key_id: ${AWS_ACCESS_KEY_ID_SES_A}
    aws_secret_access_key: ${AWS_SECRET_ACCESS_KEY_SES_A}
```

The application code will then have to specify which configuration to use when initializing the communicator:
```typescript
    // Initialize once per config used...
    const sesDef = configureInstance(SendEmailCommunicator, 'default'});
    const userSES = configureInstance(SendEmailCommunicator, 'userSES', {awscfgname: 'aws_config_ses_user'});
    const adminSES = configureInstance(SendEmailCommunicator, 'adminSES', {awscfgname: 'aws_config_ses_admin'});
    // Use configured object ...
    const msgid = await worflowCtx.invoke(userSES).sendTemplatedEmail(
        mailMsg,
    );
```

### Simple Email Service (SES)

DBOS provides a communicator for sending email using AWS SES.  This library is for sending email, with or without a template.  For details of the functionality, see the documentation accompanying the [@dbos-inc/communicator-email-ses](https://github.com/dbos-inc/dbos-transact/tree/main/packages/communicator-email-ses) package.

## Simple Storage Service (S3)

DBOS provides communicators for working with S3, and workflows for keeping a database table in sync with an S3 bucket.  For details of the functionality, see the documentation accompanying the [@dbos-inc/component-aws-s3](https://github.com/dbos-inc/dbos-transact/tree/main/packages/component-aws-s3) package.


