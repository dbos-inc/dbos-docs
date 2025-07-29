---
sidebar_position: 10
title: Deploying to DBOS Cloud
hide_table_of_contents: true
---
import InstallNode from '/docs/partials/_install_node.mdx';


Any application built with DBOS can be deployed to DBOS Cloud.
DBOS Cloud is a serverless platform for durably executed applications.
It provides:

- [**Application hosting and autoscaling**](./application-management.md): Managed hosting of your application in the cloud, automatically scaling to millions of users. Applications are charged only for the CPU time they actually consume.
- [**Managed workflow recovery**](./application-management.md): If a cloud executor is interrupted, crashed, or restarted, each of its workflows is automatically recovered by another executor.
- [**Workflow and queue management**](./workflow-management.md): Dashboards of all active and past workflows and all queued tasks, including their status, inputs, outputs, and steps. Cancel, resume, or restart any workflow execution and manage the tasks in your distributed queues.

## Deploying Your App to DBOS Cloud

<LargeTabs groupId="language" queryString="language">
<LargeTabItem value="python" label="Python">

#### 1. Install the DBOS Cloud CLI
<section className="row list">
<article className="col col--6">

The Cloud CLI requires Node.js 20 or later.
</article>

<article className="col col--6">

<details>
<summary>Instructions to install Node.js</summary>

<InstallNode />

</details>
</article>

<article className="col col--6">
Run this command to install it.
</article>

<article className="col col--6">
```shell
npm i -g @dbos-inc/dbos-cloud@latest
```
</article>
</section>

#### 2. Create a requirements.txt File
<section className="row list">
<article className="col col--6">
Create a `requirements.txt` file listing your application's dependencies.
</article>

<article className="col col--6">

```shell
pip freeze > requirements.txt
```

</article>
</section>

#### 3. Define a Start Command
<section className="row list">
<article className="col col--6">
Set the `start` command in the `runtimeConfig` section of your [`dbos-config.yaml`](../../python/reference/configuration.md) to your application's launch command.

If your application includes an HTTP server, configure it to listen on port 8000.

To test that it works, try launching your application with `dbos start`.
</article>

<article className="col col--6">

```yaml
runtimeConfig:
  start:
    - "fastapi run"
```

</article>
</section>

#### 4. Deploy to DBOS Cloud
<section className="row list">
<article className="col col--6">
Run this single command to deploy your application to DBOS Cloud!
</article>

<article className="col col--6">

```shell
dbos-cloud app deploy
```

</article>
</section>

</LargeTabItem>
<LargeTabItem value="typescript" label="TypeScript">


#### 1. Install the DBOS Cloud CLI
<section className="row list">

<article className="col col--6">
Run this command to install the Cloud CLI globally.
</article>

<article className="col col--6">
```shell
npm i -g @dbos-inc/dbos-cloud@latest
```
</article>
</section>

#### 2. Define a Start Command
<section className="row list">
<article className="col col--6">

Set the `start` command in the `runtimeConfig` section of your [`dbos-config.yaml`](../../typescript/reference/configuration.md) to your application's launch command.

If your application includes an HTTP server, configure it to listen on port 3000.

To test that it works, try launching your application with `npxdbos start`.
</article>

<article className="col col--6">

```yaml
runtimeConfig:
  start:
    - "npm start"
```

</article>
</section>

#### 3. Deploy to DBOS Cloud
<section className="row list">
<article className="col col--6">
Run this single command to deploy your application to DBOS Cloud!
</article>

<article className="col col--6">

```shell
dbos-cloud app deploy
```

</article>
</section>

</LargeTabItem>
</LargeTabs>

## DBOS Cloud How-Tos

### HTTP Serving & Port Numbers

DBOS Cloud provides your application with an HTTPS URL and routes traffic to it.
It expects applications to listen for HTTP requests on port 3000 (TypeScript) or port 8000 (Python).

### Environment Management

We recommend you configure your application with environment variables.
You can use [DBOS Cloud secrets](./secrets.md) to pass environment variables to your cloud application.
You can even [import secrets](./secrets.md#importing-secrets) into DBOS Cloud from a `.env` file.

### Database Setup

#### System Database

DBOS Cloud automatically constructs a system database for your application.
You can access it at `DBOS_SYSTEM_DATABASE_URL`.
You should not attempt to override or modify this URL.

#### Cloud-Provided Application Databases

You may connect an application database to your application through DBOS Cloud.
If you do, connection information is provided via the `DBOS_DATABASE_URL` environment variable.
For your application to work correctly in DBOS Cloud, it should use the `DBOS_DATABASE_URL` for its application database connection string.

You may optionally direct DBOS Cloud to run migrations to set up your application's database schema by specifying migration commands in your `dbos-config.yaml` file:

```yaml
migrate:
  - npx knex migrate:latest
```

DBOS Cloud will provide a database URL to your migrations through the `DBOS_DATABASE_URL` environment variable.
