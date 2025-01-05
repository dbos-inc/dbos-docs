---
sidebar_position: 60
title: Using Libraries
description: Learn how to use DBOS library functions
---

In this guide, you'll learn how to use DBOS library functions.  Examples will be based on [`@dbos-inc/dbos-email-ses`](https://www.npmjs.com/package/@dbos-inc/dbos-email-ses), a DBOS library for sending emails using [AWS Simple Email Service](https://aws.amazon.com/ses/).

### Installing and Importing a Library

First, install the library.
```bash
npm install @dbos-inc/dbos-email-ses
```

Second, import the key classes from the library for use in your source files:
```typescript
import { DBOS_SES } from "@dbos-inc/dbos-email-ses";
```

### Calling Simple Functions
Libraries such as `@dbos-inc/dbos-bcrypt` or `@dbos-inc/dbos-datetime` are comprised of functions that can be invoked from their classes.  Such functions may be called directly:
```typescript
BcryptStep.bcryptHash('myString');
```

### Working With Configured Classes
While libraries such as `@dbos-inc/dbos-bcrypt` or `@dbos-inc/dbos-datetime` have simple functions that can be called directly from their classes, more complex DBOS libraries use ["configured instances"](../programmingmodel/configured-instances) so that they can be used in multiple scenarios within the same application.  To create and configure an instance:

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { DBOS_SES } from "@dbos-inc/dbos-email-ses";

const sesMailer = DBOS.configureInstance(DBOS_SES, 'marketing', {awscfgname: 'marketing_email_aws_config'});
```

Note that the `configureInstance` call above serves multiple purposes:
* Creates an instance of `DBOS_SES`
* Provides the instance with enough information to find essential configuration information (AWS region, access key, and secret) from the configuration file
* Registers the instance under the name 'marketing'

Methods can then be called on the object instance:
```typescript
sesMailer.sendEmail(
{
   to: [DBOS.getConfig('marketing_mailing_list_address', 'dbos@nowhere.dev')],
   from: DBOS.getConfig('marketing_from_address', 'info@dbos.dev'),
   subject: 'New SES Library Version Released',
   bodyText: 'Check mailbox to see if this library is able to send mail about itself.',
   // ...
},
```
