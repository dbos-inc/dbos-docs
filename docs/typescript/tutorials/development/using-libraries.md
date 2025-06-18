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

### Working With Instantiated Objects
Some DBOS libraries use ["instantiated objects"](../instantiated-objects) so that they can be used in multiple scenarios within the same application.  To create and configure an instance:

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { DBOS_S3 } from "@dbos-inc/component-aws-s3";

const photoBucket = new DBOS_S3('marketing', ...);
```

Methods can then be called on the object instance:
```typescript
photoBucket.writeFileViaURL(...),
```
