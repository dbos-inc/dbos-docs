---
sidebar_position: 1
title: Application Management
description: Learn how to manage DBOS Cloud applications
pagination_prev: null
---

### Deploying Applications

To deploy your application to DBOS Cloud or update an existing application, run this command in its root directory:

```shell
dbos-cloud app deploy
```

Each time you deploy an application, the following steps execute:

1. **Upload**: An archive of your application folder is created and uploaded to DBOS Cloud. This archive can be up to 500 MB in size.
2. **Configuration**: Your application's dependencies [are installed](#dependency-management).
3. **Migration**: If you specify database migrations in your `dbos-config.yaml`, these are run on your cloud database.
4. **Deployment**: Your application is deployed to a number of [Firecracker microVMs](https://firecracker-microvm.github.io/).
By default, these have 1 vCPU and 512MB of RAM.
The amount of memory allocated to each microVM is [configurable](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-update).

:::tip
* Applications should serve requests from port 8000 (Python&mdash;the default port for FastAPI and Gunicorn) or 3000 (TypeScript&mdash;the default port for Express and Koa).
* Multiple applications can connect to the same Postgres database server&mdash;they are deployed to isolated databases on that server.
* You don't have to worry about setting database server connection parameters like `hostname` or `password` to deploy an application to the cloud&#8212;DBOS automatically applies the connection information of your cloud database server.
* You cannot change the database of a deployed application. You must delete and re-deploy the application.
:::

#### Dependency Management

<Tabs groupId="database-clients">
<TabItem value="python" label="Python">

For Python applications, DBOS Cloud installs all dependencies from your `requirements.txt` file.
The maximum size of your application after all dependencies are installed is 2 GB.

</TabItem>
<TabItem value="typescript" label="TypeScript">

For TypeScript applications, DBOS Cloud installs all dependencies from your `package-lock.json` file (or from `package.json` if no lockfile is provided).
The maximum size of your application after all dependencies are installed is 2 GB.

After all dependencies are installed, your application is compiled using `npm run build`.

</TabItem>
</Tabs>

#### Customizing MicroVM Setup

DBOS Pro subscribers can provide a _setup script_ that runs before their application is configured.
This script can customize the runtime environment for your application, for example installing system packages and libraries.

A setup script must be specified in your `dbos-config.yaml` like so:

```yaml title="dbos-config.yaml"
runtimeConfig:
    # Script DBOS Cloud runs to customize your application runtime.
    # Requires a DBOS Pro subscription.
    setup:
        - "./build.sh"
    # Command DBOS Cloud executes to start your application.
    start: <your-start-command>
```

A setup script may install system packages or libraries or otherwise customize the microVM image. For example:

```python title="build.sh"
#!/bin/bash

# Install the traceroute package for use in your application
apt install traceroute
```

### Monitoring and Debugging Applications

Here are some useful tools to monitor and debug applications:

- The [cloud console](https://console.dbos.dev) provides a web UI for viewing your applications and their traces and logs.

- To retrieve the last `N` seconds of your application's logs, run [`dbos-cloud app logs -l <N>`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-logs). Note that new log entries take a few seconds to appear.

- To retrieve the status of a particular application, run [`dbos-cloud app status <app-name>`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-status). To list all applications, run [`dbos-cloud app list`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-list).

### Managing Application Versions

Each time you deploy an application, it creates a new version with a unique ID.
You can view all previous versions of your application from the [cloud console](https://console.dbos.dev) or list them by running:

```
dbos-cloud app versions <app-name>
```

You can redeploy a previous version of your application by passing `--previous-version <version-id>` to the [`app deploy`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-deploy) command.

```shell
dbos-cloud app deploy --previous-version <version-id>
```

This will fail if the previous and current versions use different database schemas.

### Updating Applications

To update your application metadata, run:

```shell
dbos-cloud app update <app-name>
```

See the [DBOS Cloud CLI reference](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-update) for a list of properties you can update. Note that updating an application metadata does not trigger a redeploy of the code, which you can do with the [`app deploy`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-deploy) command.

### Deleting Applications

To delete an application, run:

```shell
dbos-cloud app delete <app-name>
```

You can also drop the application database with the `--dropdb` argument.
As each application has its own isolated database, this does not affect your other applications.

```shell
dbos-cloud app delete <app-name> --dropdb
```


:::warning
This is a destructive operation and cannot be undone.
:::
