---
sidebar_position: 16
title: Using Libraries
description: Learn how to use DBOS library functions
---

In this guide, you'll learn how to use DBOS library functions.  Examples will be based on [`@dbos-inc/communicator-email-ses`](https://www.npmjs.com/package/@dbos-inc/communicator-email-ses), a DBOS library for sending emails using [AWS Simple Email Service](https://aws.amazon.com/ses/).

### Installing and Importing a Library

First, install the library.
```bash
npm install @dbos-inc/communicator-email-ses
```

Second, import the key classes from the library for use in your source files:
```typescript
import { SendEmailCommunicator } from "@dbos-inc/communicator-email-ses";
```

### Exporting Library Classes
:::tip
Do not forget to export all classes containing handlers, transactions, workflows, and communicators from your main application file, otherwise DBOS Transact functions may not be registered with the runtime.
:::

To export the library from your `index.ts` file, add the following:
```typescript title="index.ts"
export { SendEmailCommunicator };
// or
export { SendEmailCommunicator } from "@dbos-inc/communicator-email-ses";
```

### Calling Simple Functions
Libraries such as `@dbos-inc/communicator-bcrypt` or `@dbos-inc/communicator-datetime` are comprised of functions that can be invoked from their classes.  Using the context (named `ctx` below), the `invoke` method can be used to call the library function:
```typescript
ctx.invoke(BcryptCommunicator).bcryptHash('myString');
```

### Working With Configured Classes
While libraries such as `@dbos-inc/communicator-bcrypt` or `@dbos-inc/communicator-datetime` have simple functions that can be called directly from their classes, more complex DBOS libraries use ["configured instances"](./configured-instances) so that they can be used in multiple scenarios within the same application.  To create and configure an instance:

```typescript
import { configureInstance } from "@dbos-inc/dbos-sdk";
import { SendEmailCommunicator } from "@dbos-inc/communicator-email-ses";

const sesMailer = configureInstance(SendEmailCommunicator, 'marketing', {awscfgname: 'marketing_email_aws_config'});
```

Note that the `configureInstance` call above serves multiple purposes:
* Creates an instance of `SendEmailCommunicator`
* Provides the instance with enough information to find essential configuration information (AWS region, access key, and secret) from the configuration file
* Registers the instance under the name 'marketing'

To invoke a function on the configured instance, use the context (named `ctx` below) provided within a handler or workflow:
```typescript
ctx.invoke(sesMailer).sendEmail(
{
   to: [ctx.getConfig('marketing_mailing_list_address', 'dbos@nowhere.dev')],
   from: ctx.getConfig('marketing_from_address', 'info@dbos.dev'),
   subject: 'New SES Library Version Released',
   bodyText: 'Check mailbox to see if this library is able to send mail about itself.',
   // ...
},
```

### Further Reading
* For general information about DBOS Transact, see [Getting Started](../getting-started/quickstart)
* For a reference on accessing information and functions from workflow and handler contexts, see [Contexts] (../api-reference/contexts)
* For details on the `dbos-config.yaml` file, see the [Configuration Reference] (../api-reference/configuration)
* For information about configuring classes, see [Configured Class Instances](../tutorials/configured-instances)
* For a list of libraries, see the [Library Reference](../api-reference/communicatorlib)
* For demo applications, see [Demo Applications](../tutorials/demo-apps)
