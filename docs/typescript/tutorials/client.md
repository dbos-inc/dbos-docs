---
sidebar_position: 48
title: DBOS Client
---

DBOS Client provides a programmatic way to interact with your DBOS application from external code.
Activities such as enque

For more details, please see the [DBOS Client reference](../reference/client.md).

### Getting Started

In your external node application, add a reference to the `@dbos-inc/dbos-sdk` package.

```shell
npm install @dbos-inc/dbos-sdk
```

:::tip
`@dbos-inc/dbos-sdk` is the same package that used by DBOS applications.
Where DBOS applications use the [static `DBOS` class](../reference/transactapi/dbos-class.md),
external applications use the [`DBOSClient` class](../reference/client.md) instead.
:::

### Creating a DBOS Client

You construct a `DBOSClient` with the static `create` function. 
The `databaseUrl` parameter is a [standard PostgreSQL connection URI](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS)
for the DBOS application database.
DBOS Client also needs to connect to the [system database](../../explanations/system-tables.md) of your DBOS application.
The system database is stored on the same database server as the application database and typically has the same name as your application database, but suffixed with `_dbos_sys`. 
If you are using a non-standard system database name in your DBOS application, you must also provide the name to `DBOSClient.create`.

```ts
import { DBOSClient } from "@dbos-inc/dbos-sdk";

const client = await DBOSClient.create(databaseUrl);
```

### DBOS Client Methods

Once you have created a `DBOSClient` instance, there are several methods you can call on it.
These methods mirror operations that can be called from non-workflow code in a DBOS application.
For example, `recv` and `setEvent` can only be called inside of workflows, so `DBOSClient` doesn't provide those methods.

* ['enqueue'](../reference/client.md#enqueue)
* ['retrieveWorkflow'](../reference/client.md#retrieveworkflow)
* ['send'](../reference/client.md#send)
* ['getEvent'](../reference/client.md#getevent)
