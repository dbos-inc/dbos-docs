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
npm install --save @dbos-inc/dbos-datetime
```

Import the functions and/or classes into your TypeScript code:
```typescript
import { DBOSDateTime } from '@dbos-inc/dbos-datetime';
```

Invoke the step:
```typescript
const curDate = await DBOSDateTime.getCurrentDate();
```

---

## `BcryptStep`
The functions in the [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) package are non-deterministic because the salt is generated randomly.  To ensure consistent workflow behavior, bcrypt should therefore be run in a step so that the output can be recorded.

The following steps are provided in the `@dbos-inc/dbos-bcrypt` package, in the `BcryptStep` class.

### `bcryptGenSalt(saltRounds?:number)`
`bcryptGenSalt` produces a random salt.  Optional parameter is the number of rounds.

### `bcryptHash(txt: string, saltRounds?:number)`
`bcryptHash` generates a random salt and uses it to create a hash of `txt`.

## `DBOSDateTime`
For workflows to make consistent decisions based on time, reading the current time should be done via a step so that the value can be recorded and is available for workflow restart or replay.

This step is provided in the `@dbos-inc/dbos-datetime` package, in the `DBOSDateTime` class.

### `getCurrentDate()`

This function returns a `Date` object representing the current clock time.

### `getCurrentTime()`
This function returns a `number` of milliseconds since January 1, 1970, UTC, in the same manner as `new Date().getTime()`.

## `DBOSRandom`
For consistent workflow execution, the results of anything random should be recorded by running the logic in a step.

This step is provided in the `@dbos-inc/dbos-random` package in the `DBOSRandom` class.

### `random()`
`random` is a wrapper for `Math.random()` and similarly produces a `number` in the range from 0 to 1.

## Amazon Web Services (AWS) Integation Libraries

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

The default configuration section of `application.aws_config` is used for any library that has not been specifically configured.

Individual AWS services can override this, for example the SES package uses `aws_ses_configuration` to specify the configuration(s) for use by SES:
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

The application code will then have to specify which configuration to use when initializing the step:
```typescript
    // Initialize once per config used...
    const sesDef = configureInstance(DBOS_SES, 'default'});
    const userSES = configureInstance(DBOS_SES, 'userSES', {awscfgname: 'aws_config_ses_user'});
    const adminSES = configureInstance(DBOS_SES, 'adminSES', {awscfgname: 'aws_config_ses_admin'});
    // Use configured object ...
    const msgid = await userSES.sendTemplatedEmail(
        mailMsg,
    );
```

### Simple Email Service (SES)

DBOS provides a step for sending email using AWS SES.  This library is for sending email, with or without a template.  For details of the functionality, see the documentation accompanying the [@dbos-inc/dbos-email-ses](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/communicator-email-ses) package.

## Simple Storage Service (S3)

DBOS provides steps for working with S3, and transactional workflows for keeping a database table in sync with an S3 bucket.  For details of the functionality, see the documentation accompanying the [@dbos-inc/component-aws-s3](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/component-aws-s3) package.

## Simple Queue Service (SQS)

DBOS provides steps for sending messages via Amazon SQS, and an event receiver for executing workflow functions in response to received SQS messages.  For details of the functionality, see the documentation accompanying the [@dbos-inc/dbos-sqs](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/dbos-sqs) package.

