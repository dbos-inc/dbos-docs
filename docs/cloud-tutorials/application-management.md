---
sidebar_position: 2
title: Cloud Application Management
description: Learn how to manage DBOS Cloud applications
---

In this guide, you'll learn how to manage applications in DBOS Cloud.

### Preliminaries

To deploy an application, you need a database to connect to.
You can use the database you created in the [quickstart](../getting-started/quickstart.md) or [provision](./database-management.md#provisioning-database-instances) a new one.
Additionally, you must define [schema migrations](./database-management.md#database-schema-management) to create your application's tables.

### Registering and Deploying Applications

The first step in deploying an application to DBOS Cloud is registering it.
To register an application, run the following command in your application root directory, where `database-instance-name` is the name of a Postgres database instance you've [provisioned](./database-management.md#provisioning-database-instances):

```
npx dbos-cloud app register -d <database-instance-name>
```

Your application is automatically registered under the name in its `package.json`.
Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).

After you've registered your application, deploy it to run it in the cloud.
Run this command in your application root directory:

```
npx dbos-cloud app deploy
```

When you deploy an application, DBOS Cloud first runs [`npx dbos migrate`](../api-reference/cli.md#npx-dbos-migrate) on your application database to apply all schema migrations you've defined.
It then starts your application.
After your application is deployed, DBOS Cloud hosts it at this URL, which is also printed by the deploy command:

```
https://<username>-<app-name>.cloud.dbos.dev/
```

:::info
If your account belongs to an organization, applications are hosted at `https://<organization-name>-<app-name>.cloud.dbos.dev/`
:::

If you edit your application or schema, run `npx dbos-cloud app deploy` again to apply the latest migrations and upgrade to the latest version.

:::info
You don't have to worry about changing database server connection parameters like `hostname` or `password` in [`dbos-config.yaml`](../api-reference/configuration.md) to deploy an application to the cloud&#8212;DBOS automatically applies the connection information of your cloud database instance.
:::

:::info
Be careful making breaking schema changes such as deleting or renaming a column&#8212;they may break active workflows running on a previous application version.
:::

### Rolling Back Application Databases

To [roll back your application database](./database-management.md#database-schema-management), run `npx dbos-cloud app rollback`.
This command works analagously to `deploy`, but instead of running `npx dbos migrate`, it runs [`npx dbos rollback`](../api-reference/cli.md#npx-dbos-rollback) to execute the rollback commands defined in your [configuration file](../api-reference/configuration.md#database).
It then updates your application code.

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
To roll back your schema, use the [rollback command](#rolling-back-application-databases) instead.

### Deleting Applications

To delete an application, run:

```
npx dbos-cloud app delete <app-name>
```
