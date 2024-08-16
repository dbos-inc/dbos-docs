---
sidebar_position: 2
title: Cloud Application Management
description: Learn how to manage DBOS Cloud applications
---

In this guide, you'll learn how to manage applications in DBOS Cloud.

### Preliminaries

You must define [schema migrations](./database-management.md#database-schema-management) to create your application's tables.

### Deploying Applications

You can deploy an app to run it on DBOS Cloud with a single command (run this in your application root directory):

```
npx dbos-cloud app deploy
```

If you haven't provisioned a database instance (server), this command first provisions one for you. It prompts you to pick a database instance name, which is `<username>-db-server` by default.
For more information, see the [database management guide](../cloud-tutorials/database-management.md).

:::tip
To specify a database instance name, you can also pass it in the `-d <database-instance-name>` option.
To enable time travel for your application, specify `--enable-timetravel`.
:::

Then, this command automatically deploys your application to under the name in its `package.json`.
Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).

When you deploy an application, DBOS Cloud first runs [`npx dbos migrate`](../api-reference/cli.md#npx-dbos-migrate) on your application database to apply all schema migrations you've defined.
It then starts your application.
After your application is deployed, DBOS Cloud hosts it at this URL, which is also printed by the deploy command:

```
https://<username>-<app-name>.cloud.dbos.dev/
```

:::info
If your account belongs to an [organization](./account-management.md#organization-management), applications are hosted at `https://<organization-name>-<app-name>.cloud.dbos.dev/`
:::

If you edit your application or schema, run `npx dbos-cloud app deploy` again to apply the latest migrations and upgrade to the latest version.

:::info
You don't have to worry about changing database server connection parameters like `hostname` or `password` in [`dbos-config.yaml`](../api-reference/configuration.md) to deploy an application to the cloud&#8212;DBOS automatically applies the connection information of your cloud database instance.
:::

:::info
Be careful making breaking schema changes such as deleting or renaming a column&#8212;they may break active workflows running on a previous application version.
:::

### Monitoring and Debugging Applications

DBOS provides many tools to monitor and debug applications:

- To get a high-level view of all your applications and their traces and logs, check out [our monitoring dashboard](./monitoring-dashboard).

- To replay DBOS Cloud execution traces locally, check out our [time travel debugger](./timetravel-debugging).

- To retrieve the last `N` seconds of your application's logs, run in your application root directory [`npx dbos-cloud app logs -l <N>`](../api-reference/cloud-cli.md#npx-dbos-cloud-app-logs). Note that new log entries take a few seconds to appear.

- To retrieve the status of a particular application, run [`npx dbos-cloud app status <app-name>`](../api-reference/cloud-cli.md#npx-dbos-cloud-app-status). To retrieve the statuses of all applications, run [`npx dbos-cloud app list`](../api-reference/cloud-cli.md#npx-dbos-cloud-app-list).

### Managing Application Versions

Each time you deploy an application, it creates a new version with a unique ID.
To list all previous versions of your application, run:

```
npx dbos-cloud app versions <app-name>
```

You can redeploy a previous version of your application by passing `--previous-version <version-id>` to the [`app deploy`](../api-reference/cloud-cli.md#npx-dbos-cloud-app-deploy) command.

```
npx dbos-cloud app deploy --previous-version <version-id>
```

However, this will fail if the previous and current versions have different database schemas.
For more information on schema management, see our [schema management guide](./database-management.md#database-schema-management).


### Deleting Applications

To delete an application, run:

```
npx dbos-cloud app delete <app-name>
```
