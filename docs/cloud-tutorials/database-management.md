---
sidebar_position: 3
title: Database Management
description: Learn how to manage DBOS Cloud database instances
---

### Provisioning Database Instances

Before you can deploy an application to DBOS Cloud, you must provision a Postgres database instance (server) for it.
You must choose a database instance name, username and password.

:::info
* Both the database instance name and username must be 3 to 16 characters long and contain only lowercase letters, numbers and underscores.
* The username must start with a letter.
* The usernames `dbosadmin`, `dbos`, `postgres` and `admin` are reserved and cannot be used.
* The database password must contain between 8 and 128 characters, and cannot contain the characters `/`, `"`, `@`, `'`, or whitespaces.
:::

Run this command and choose your database password when prompted:

```shell
dbos-cloud db provision <database-instance-name> -U <database-username>
```

:::info
A Postgres database instance (server) can host many independent databases used by different applications.
Each application is deployed to an isolated database by default; you can configure this through the `app_db_name` field in `dbos-config.yaml`.
:::

:::info
If you forget your database password, you can always [reset it](../cloud-tutorials/cloud-cli.md#dbos-cloud-db-reset-password).
:::

To see a list of all provisioned instances and their statuses, run:

```shell
dbos-cloud db list
```

To retrieve the status of a particular instance, run:

```shell
dbos-cloud db status <database-instance-name>
```

### Database Schema Management

Every time you deploy an application to DBOS Cloud, it runs all migrations defined in your `dbos-config.yaml`.
This is the same as running `dbos migrate` locally.

Sometimes, it may be necessary to manually perform schema changes on a cloud database, for example to recover from a schema migration failure.
To make this easier, you can load your cloud database connection information into your local `dbos-config.yaml` configuration file by running:

```shell
dbos-cloud db connect <database-name>
```

You can then locally run any migration command (for example, a down-migration command in your schema migration tool) and it will execute on your cloud database.

:::warning
While it is occasionally necessary, be careful when manually changing the schema on a production database.
:::

:::warning
Be careful making breaking schema changes such as deleting or renaming a column&#8212;they may break active workflows running on a previous application version.
:::

### Database Recovery

:::info
Database recovery is not available for [linked databases](./byod-management.md)
:::

DBOS Cloud can use [PostgreSQL point-in-time-recovery](https://www.postgresql.org/docs/current/continuous-archiving.html) to restore your database to a previous state, for example to recover from data corruption or loss.
First, run the [`database restore`](../cloud-tutorials/cloud-cli.md#dbos-cloud-db-restore) to create a new database instance containing the state of your database instance at a previous point in time:

```shell
dbos-cloud db restore <database-name> -t <timestamp> -n <new-db-instance-name>
```

The timestamp must be in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339) format and must be within the backup retention period of your database (24 hours for free-tier users).

After the database is restored, you can redeploy your applications to it with [`app change-database-instance`](../cloud-tutorials/cloud-cli.md#dbos-cloud-app-change-database-instance).
For each application connected to the original database instance, run:

```shell
dbos-cloud app change-database-instance --database <new-db-instance-name>
```

If you wish to restore your application to a previous version (such as the version that was running at the recovery timestamp), you can do this with the `--previous-version` parameter:

```shell
dbos-cloud app change-database-instance --database <new-db-instance-name> --previous-version <version-id>
```

For more information on application version management, see [here](./application-management.md#managing-application-versions).

Finally, destroy the original database instance:

```shell
dbos-cloud db destroy <original-database-instance-name>
```

### Destroying Database Instances

To destroy a database instance, run:

```shell
dbos-cloud db destroy <database-name>
```

:::warning
Take care&#8212;this will irreversibly delete all data in the database instance.
:::
