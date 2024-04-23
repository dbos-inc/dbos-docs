---
sidebar_position: 1
title: Cloud Database Management
description: Learn how to manage DBOS Cloud database instances
---

In this guide, you'll learn how to manage database instances in DBOS Cloud.

### Provisioning Database Instances

Before you can deploy an application to DBOS Cloud, you must provision a Postgres database instance for it.
You must choose a database instance name, username and password.
Both the database instance name and username must be 3 to 16 characters long and contain only lowercase letters, numbers and underscores.
The database password must contain 8 or more characters.
Run this command and choose your database password when prompted:

```
npx dbos-cloud db provision <database-instance-name> -U <database-username>
```
:::info
A Postgres database instance can host multiple independent databases for different applications.
You can configure which database your application uses through the `app_db_name` field in its [`dbos-config.yaml`](../api-reference/configuration.md#database).
:::

:::info
If you forget your database password, you can always [reset it](../api-reference/cloud-cli.md#npx-dbos-cloud-db-reset-password).
:::

To see a list of all provisioned instances, run:

```
npx dbos-cloud db list
```

To retrieve the status of a particular instance, run:

```
npx dbos-cloud db status <database-instance-name>
```

### Database Schema Management

To manage your applications' database schemas, you must define schema migrations.
DBOS Cloud is compatible with any schema management tool as long as all its dependencies and assets are stored in your application directory.
We recommend using a Typescript-based migration tool like [Knex](https://knexjs.org/guide/migrations.html) or [TypeORM](https://typeorm.io/migrations).

You configure your schema migrations in the `migrate` and `rollback` fields of your [`dbos-config.yaml`](../api-reference/configuration.md).
You must supply a list of commands to run to migrate to your most recent schema version.
For example, if you are using [Knex](https://knexjs.org/guide/migrations.html), you might use:

```yaml
database:
  # Other fields omitted
  migrate: ['npx knex migrate:latest']
  rollback: ['npx knex migrate:down']
```

To run your migrations locally, run `npx dbos migrate` or `npx dbos rollback`.

When you [deploy](./application-management.md#registering-and-deploying-applications) an application to DBOS Cloud it runs `npx dbos migrate` to apply all schema changes before starting your application or updating its code.
When you [roll back](./application-management.md#rolling-back-application-databases) an application on DBOS Cloud, it runs `npx dbos rollback` to roll back schema changes before updating your application's code.

:::info
Be careful making breaking schema changes such as deleting or renaming a column&#8212;they may break active workflows running on a previous application version.
:::

### Destroying Database Instances

To destroy a database instance, run:

```
npx dbos-cloud db destroy <database-name>
```

:::warning
Take care&#8212;this will irreversibly delete all data in the database instance.
:::
