---
sidebar_position: 115
title: DBOS Cloud Checklist
description: Learn the easiest way to make an app that runs locally and in the cloud.
---

To create applications that support local development and can be run in DBOS cloud unchanged, a few guidelines should be followed.

## Starting Your App
DBOS Cloud needs to know how to start your app.  This information is taken from [`dbos-config.yaml`](../reference/configuration.md#configuration-file-fields).
```
runtimeConfig:
  start:
    - node dist/main.js
```

You can use `npx dbos start` locally as part of your development process to ensure that the command works, before submitting to DBOS Cloud.  Or, your `start:` command can refer to a command from `package.json` that is runnable in the development environment.

## Port Numbers
When run in DBOS Cloud, your application must use port 3000 for HTTP traffic, and 3001 for administrative communications with the cloud environment.  This means that, while you may override your ports in development (usually with environment variable) you should not set this override in DBOS Cloud.

```typescript
  const PORT = parseInt(process.env.NODE_PORT || '3000');
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
```

## Environment
The easiest way to configure your application is with environment variables, which may be set differently between the development environment and DBOS Cloud.

For local development, set the environment variables directly, or consider a tool like [dotenv](https://www.npmjs.com/package/dotenv).  You may want to prevent sending `.env` files to the cloud by means of [`.dbosignore`](../../production/dbos-cloud/application-management.md#ignoring-files-with-dbosignore).

For cloud development, the environment variables will come from [secrets](../../production/dbos-cloud/secrets.md).  These may, in turn, be set up with `.env` files.

## Database Setup
There are several databases and scenarios here.

### System Database
DBOS Cloud provides this automatically.  You should not attempt to override the system database in DBOS Cloud.

### Self-Managed Application Databases
DBOS Cloud does not treat these specially; it is up to the application to know the connection information and set up the schema.  Aside from configuring the connection information in the [environment](#environment), you may need to install the tables in the `dbos` data source schema.

### Cloud-Provided Application Database
DBOS Cloud provisions a database that your application can use.  The connection information is accessible via the `DBOS_DATABASE_URL` environment variable.  For your application to work correctly in DBOS Cloud, it should use the `DBOS_DATABASE_URL` for its application database connection, if it is set, otherwise it may do whatever is convenient in local development.

```typescript
const config = {
  client: 'pg',
  connection: process.env.DBOS_DATABASE_URL || {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE || 'shop',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'dbos',
  },
};
const knexds = new KnexDataSource('app-db', config);
```

DBOS Cloud will also run migrations to set up your application's database schema.  This is done by providing [migration](../reference/configuration.md#database-section) commands in your `dbos-config.yaml` file.
```yaml
  migrate:
    - npx knex migrate:latest
```
Note that, similar to application database access, your migrations must connect using the `DBOS_DATABASE_URL` environment variable (if it is set) to work with DBOS Cloud.

## Package Lock
You should save your `package-lock.json` file to version control, and also submit it to DBOS Cloud.  This ensures you know the exact package versions that will be installed.
