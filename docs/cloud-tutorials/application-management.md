---
sidebar_position: 2
title: Cloud Application Management
description: Learn how to manage DBOS Cloud applications
---

In this guide, you'll learn how to manage applications in DBOS Cloud.


### Deploying Applications

To deploy your application to DBOS Cloud, run this command in its root directory:

```shell
dbos-cloud app deploy
```

Your application is deployed using the name in its `package.json`.
Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`). Application names are unique within an [organization](account-management#organization-management).

When you deploy an application for the first time, the command prompts you to choose which [database instance](../cloud-tutorials/database-management.md) to connect your app to, or to provision one if you have none. Multiple applications can use the same database instance (server) but must use separate databases within that server (the `app_db_name` field in `dbos-config.yaml`).

:::tip
* You can specify a particular database instance through the `-d <database-instance-name>`.
* During the first deployment, you can enable time travel for your application with `--enable-timetravel`. You can delete and re-deploy an existing application to enable time travel.
:::

When you deploy an application, the DBOS Cloud CLI will create an archive of your application folder and upload it to DBOS Cloud. This archive can be up to 500MB in size.

During deploy, DBOS Cloud first runs `dbos migrate` on your application database to apply all schema migrations you've defined.
It then builds and starts your application.

:::info
DBOS Cloud will prune all development dependencies to reduce your application size. Make sure to explicitly install runtime dependencies.
:::

After your application is deployed, DBOS Cloud hosts it at this URL, which is also printed by the deploy command:

```shell
https://<username>-<app-name>.cloud.dbos.dev/
```

:::info
If your account belongs to an [organization](./account-management.md#organization-management), applications are hosted at `https://<organization-name>-<app-name>.cloud.dbos.dev/`
:::

If you edit your application or schema, run `dbos-cloud app deploy` again to apply the latest migrations and upgrade to the latest version.

:::info
* You don't have to worry about changing database server connection parameters like `hostname` or `password` in `dbos-config.yaml` to deploy an application to the cloud&#8212;DBOS automatically applies the connection information of your cloud database instance.
* You cannot change the application database (`app_db_name`) of a deployed application. You must delete and re-deploy the application.
* While database instances can be shared across applications, application databases (`app_db_name`) cannot.
:::

### Monitoring and Debugging Applications

DBOS provides many tools to monitor and debug applications:

- To get a high-level view of all your applications and their traces and logs, check out [our monitoring dashboard](./monitoring-dashboard).

- To replay DBOS Cloud execution traces locally, check out our [time travel debugger](./timetravel-debugging).

- To retrieve the last `N` seconds of your application's logs, run in your application root directory [`dbos-cloud app logs -l <N>`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-logs). Note that new log entries take a few seconds to appear.

- To retrieve the status of a particular application, run [`dbos-cloud app status <app-name>`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-status). To retrieve the statuses of all applications, run [`dbos-cloud app list`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-list).

Applications run in [Firecracker microVMs](https://firecracker-microvm.github.io/) with 1vCPU and 512MB of RAM. Note that files on disk are ephemeral and not persisted between deployments.

### Managing Application Versions

Each time you deploy an application, it creates a new version with a unique ID.
To list all previous versions of your application, run:

```
dbos-cloud app versions <app-name>
```

You can redeploy a previous version of your application by passing `--previous-version <version-id>` to the [`app deploy`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-deploy) command.

```shell
dbos-cloud app deploy --previous-version <version-id>
```

However, this will fail if the previous and current versions have different database schemas.

Also, note DBOS Cloud will keep running Transact workflows from previous versions until they complete. This means you need to be mindful of non-backward-compatible database schema migrations, as they could break running workflows.

For more information on schema management, see our [schema management guide](./database-management.md#database-schema-management).


### Deleting Applications

To delete an application, run:

```shell
dbos-cloud app delete <app-name>
```

You can also delete the application database with the `--dropdb` argument:

```shell
dbos-cloud app delete <app-name> --dropdb
```


:::warning
This is a destructive operation and cannot be undone.
:::
