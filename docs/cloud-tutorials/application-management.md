---
sidebar_position: 2
title: Application Management
description: Learn how to manage DBOS Cloud applications
---

In this guide, you'll learn how to manage applications in DBOS Cloud.

### Preliminaries

Before following any of the steps in this guide, make sure you've created and registered a DBOS Cloud account.
Then, in your application root directory, log in to DBOS Cloud by running:

```
npx dbos-cloud login
```

To deploy an application, you need a database to connect it to.
You can use the database you created in the [cloud quickstart](../getting-started/quickstart-cloud.md) or [provision](.) a new one.
Additionally, you must define [schema migrations](.) to create your application's tables.

### Registering and Deploying Applications

The first step in deploying an application to DBOS Cloud is registering it.
To register an application, run the following command in your application root directory, where `database-name` is the name of a Postgres database instance you've [provisioned](.).:

```
npx dbos-cloud application register -d <database-name>
```

Your application is automatically registered under the name in its `package.json`.

After you've registered your application, deploy it to run it in the cloud!
Run this command in your application root directory:

```
npx dbos-cloud application deploy
```

When you deploy an application, DBOS Cloud first runs [`npx dbos-sdk migrate`](../api-reference/cli.md#npx-dbos-sdk-migrate) against your cloud database to apply all schema migrations you've defined.
It then starts your application.

If you edit your application or schema, simply run `npx dbos-cloud application deploy` again to apply the latest migration and re-deploy the latest version!

:::tip
You don't have to edit your `dbos-config.yaml` to deploy an application to the cloud&#8212;DBOS automatically takes care of that for you, applying the connection information of your cloud database.
:::

### Monitoring and Debugging Applications

DBOS provides many tools to monitor and debug applications:

- To get a high-level view of all your applications and their traces and logs, check out [our dashboard](.).

- To replay any past trace locally and figure out exactly what happened, check out our [time travel debugger](.).

- To retrieve the last `N` seconds of your application's logs, run in your application root directory [`npx dbos-cloud application logs -l <N>`](../api-reference/cloud-cli.md#npx-dbos-cloud-application-logs). Note that new log entries take a few seconds to appear.

- To retrieve the status of a particular application, run in its root directory [`npx dbos-cloud application status`](../api-reference/cloud-cli.md#npx-dbos-cloud-application-status). To retrieve the statuses of all applications, run [`npx dbos-cloud application list`](../api-reference/cloud-cli.md#npx-dbos-cloud-application-list).

### Deleting Applications

If you want to delete an application, run in its root directory:

```
npx dbos-cloud application delete
```
