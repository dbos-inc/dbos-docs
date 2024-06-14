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
We recommend using a Typescript-based migration tool like [Knex](https://knexjs.org/guide/migrations.html), [TypeORM](https://typeorm.io/migrations), or [Prisma](https://www.prisma.io/docs/orm/prisma-migrate).

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

:::info
Be careful making breaking schema changes such as deleting or renaming a column&#8212;they may break active workflows running on a previous application version.
:::

Sometimes, it may be necessary to manually run migration commands such as `npx dbos rollback` on a cloud database, for example to recover from a schema migration failure.
To make this easier, you can load your cloud database connection information into your local [`dbos-config.yaml`](../api-reference/configuration.md) configuration file by running:

```
npx dbos-cloud db connect <database-name>
```

You can then locally run any migration command such as [`npx dbos rollback`](../api-reference/cli.md#npx-dbos-rollback) or [`npx knex migrate:down`](https://knexjs.org/guide/migrations.html#migration-cli) and it will execute on your cloud database.

:::warning
While it is occasionally necessary, be careful when manually running migration commands on a production database.
:::

### Database Recovery

:::info
Database recovery is not available for [linked databases](./byod-management.md)
:::

DBOS Cloud can use [PostgreSQL point-in-time-recovery](https://www.postgresql.org/docs/current/continuous-archiving.html) to restore your database to a previous state, for example to recover from data corruption or loss.
First, run the [`database restore`](../api-reference/cloud-cli.md#npx-dbos-cloud-db-restore) to create a new database instance containing the state of your database instance at a previous point in time:

```
npx dbos-cloud db restore <database-name> -t <timestamp> -n <new-db-instance-name>
```

The timestamp must be in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339) format and must be within the backup retention period of your database (24 hours for free-tier users).

After the database is restored, you can redeploy your applications to it with [`app change-database-instance`](../api-reference/cloud-cli.md#npx-dbos-cloud-app-change-database-instance).
For each application connected to the original database instance, run:

```
npx dbos-cloud app change-database-instance --database <new-db-instance-name>
```

If you wish to restore your application to a previous version (such as the version that was running at the recovery timestamp), you can do this with the `--previous-version` parameter:

```
npx dbos-cloud app change-database-instance --database <new-db-instance-name> --previous-version <version-id>
```

For more information on application version management, see [here](./application-management.md#managing-application-versions).

Finally, destroy the original database instance:

```
npx dbos-cloud db destroy <original-database-instance-name>
```

### Destroying Database Instances

To destroy a database instance, run:

```
npx dbos-cloud db destroy <database-name>
```

:::warning
Take care&#8212;this will irreversibly delete all data in the database instance.
:::
