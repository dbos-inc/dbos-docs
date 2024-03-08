---
sidebar_position: 2
title: Cloud Application Management
description: Learn how to manage DBOS Cloud applications
---

In this guide, you'll learn how to manage applications in DBOS Cloud.

### Preliminaries

Before following any of the steps in this guide, make sure you've created and registered a DBOS Cloud account, which you can do by running:

```
npx dbos-cloud register -u <username>
```

If you did already, simply log in to DBOS Cloud by running:

```
npx dbos-cloud login
```

To deploy an application, you need a database to connect to.
You can use the database you created in the [cloud quickstart](../getting-started/quickstart-cloud.md) or [provision](./database-management.md#provisioning-database-instances) a new one.
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

When you deploy an application, DBOS Cloud first runs [`npx dbos-sdk migrate`](../api-reference/cli.md#npx-dbos-sdk-migrate) against your cloud database to apply all schema migrations you've defined.
It then starts your application.
After your application is deployed, DBOS Cloud hosts it at this URL, which is also printed by the deploy command:

```
https://<username>-<app-name>.cloud.dbos.dev/
```

If you edit your application or schema, run `npx dbos-cloud app deploy` again to apply the latest migrations and upgrade to the latest version.

:::tip
You don't have to worry about changing database server connection parameters like `hostname` or `password` in [`dbos-config.yaml`](../api-reference/configuration.md) to deploy an application to the cloud&#8212;DBOS automatically applies the connection information of your cloud database instance.
:::

### Monitoring and Debugging Applications

DBOS provides many tools to monitor and debug applications:

- To get a high-level view of all your applications and their traces and logs, check out [our monitoring dashboard](./monitoring-dashboard).

- To replay DBOS Cloud execution traces locally, check out our [time travel debugger](./timetravel-debugging).

- To retrieve the last `N` seconds of your application's logs, run in your application root directory [`npx dbos-cloud app logs -l <N>`](../api-reference/cloud-cli.md#npx-dbos-cloud-application-logs). Note that new log entries take a few seconds to appear.

- To retrieve the status of a particular application, run [`npx dbos-cloud app status <app-name>`](../api-reference/cloud-cli.md#npx-dbos-cloud-application-status). To retrieve the statuses of all applications, run [`npx dbos-cloud app list`](../api-reference/cloud-cli.md#npx-dbos-cloud-application-list).

### Deleting Applications

To delete an application, run:

```
npx dbos-cloud app delete <app-name>
```
