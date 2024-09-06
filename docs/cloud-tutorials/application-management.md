---
sidebar_position: 1
title: Application Management
description: Learn how to manage DBOS Cloud applications
pagination_prev: null
---

In this guide, you'll learn how to manage applications in DBOS Cloud.


### Deploying Applications

To deploy your application to DBOS Cloud, run this command in its root directory:

```shell
dbos-cloud app deploy
```

Your application is deployed using the name in its `dbos-config.yaml`.
Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`). Application names are unique within an [organization](account-management#organization-management).

The first time you deploy an application, you are prompted to choose to which [database instance](../cloud-tutorials/database-management.md) to connect your app, or to provision one if you have none.
Multiple applications can connect to the same database instance (server) but must use separate databases within that server (the `app_db_name` field in `dbos-config.yaml`).

Each time you deploy an application, the following steps execute:

- An archive of your application folder is created and uploaded to DBOS Cloud. This archive can be up to 500 MB in size.
- Your application's dependencies are installed.
In Python, dependencies are loaded from `requirements.txt`.
In TypeScript, they are loaded from `package-lock.json`, or from `package.json` if this is not present.
You must provide one of these files to successfully deploy.
- All database migrations specified in your `dbos-config.yaml` are run on your cloud database.
- Your application is deployed to a number of [Firecracker microVMs](https://firecracker-microvm.github.io/) with 1vCPU and 512MB of RAM.
These microVMs expect your application to serve requests from port 8000 (Python&mdash;the default port for FastAPI and Gunicorn) or 3000 (TypeScript&mdash;the default port for DBOS Transact and Koa).

After your application is deployed, the URL of your deployed application is printed.
This URL is of the form `https://<username>-<app-name>.cloud.dbos.dev/`.
If your account is part of an [organization](./account-management.md#organization-management), organization name is used instead of username.

If you edit your application, run `dbos-cloud app deploy` again to apply the latest migrations and upgrade to the latest version.

:::tip
* During your first deploy, you can programatically specify a particular database instance through the `-d <database-instance-name>`.
* During the first deploy, you can enable time travel for your application with `--enable-timetravel`. You can delete and re-deploy an existing application to enable time travel.
* You don't have to worry about changing database server connection parameters like `hostname` or `password` in `dbos-config.yaml` to deploy an application to the cloud&#8212;DBOS automatically applies the connection information of your cloud database instance.
* You cannot change the application database (`app_db_name`) of a deployed application. You must delete and re-deploy the application.
:::


### Monitoring and Debugging Applications

DBOS provides many tools to monitor and debug applications:

- To get a high-level view of all your applications and their traces and logs, check out [our monitoring dashboard](./monitoring-dashboard).

- To replay DBOS Cloud execution traces locally, check out our [time travel debugger](./timetravel-debugging).

- To retrieve the last `N` seconds of your application's logs, run in your application root directory [`dbos-cloud app logs -l <N>`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-logs). Note that new log entries take a few seconds to appear.

- To retrieve the status of a particular application, run [`dbos-cloud app status <app-name>`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-status). To retrieve the statuses of all applications, run [`dbos-cloud app list`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-list).

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

This will fail if the previous and current versions have different database schemas.

### Deleting Applications

To delete an application, run:

```shell
dbos-cloud app delete <app-name>
```

You can also delete the application database (`app_db_name`) with the `--dropdb` argument:

```shell
dbos-cloud app delete <app-name> --dropdb
```


:::warning
This is a destructive operation and cannot be undone.
:::
