---
sidebar_position: 1
title: Cloud Database Management
description: Learn how to manage DBOS Cloud database instances
---

In this guide, you'll learn how to manage database instances in DBOS Cloud.

### Preliminaries

Before following any of the steps in this guide, make sure you've created and registered a DBOS Cloud account, which you can do by running:

```
npx dbos-cloud register -u <username>
```

If you did already, simply log in to DBOS Cloud by running:

```
npx dbos-cloud login
```

### Provisioning Database Instances

Before you can deploy an application to DBOS Cloud, you must provision a Postgres database instance for it.
You must choose a database instance name, username and password.
Both the database instance name and username should be between 3 and 30 characters and contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).
Run this command and choose your database password when prompted (it should take ~5 minutes to provision):

```
npx dbos-cloud db provision <database-instance-name> -U <database-username>
```
:::info
Each Postgres database instance is a physical server that can host multiple independent Postgres databases for different applications.
You can define which database your application uses through the `app_db_name` field in its [`dbos-config.yaml`](../api-reference/configuration.md#database).
DBOS Cloud automatically creates your application database and applies your schema migrations when you deploy an application.
In this documentation, we use "database instance" or "database server" to refer to the physical server and "database" to refer to the application database.
:::

:::info
Remember your database administrator password! You need it to connect to our [time travel debugger](#).
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

You configure your schema migrations in the `migrate` field of your [`dbos-config.yaml`](../api-reference/configuration.md).
You must supply a list of commands to run to migrate to your most recent schema version.
For example, if you are using [Knex](https://knexjs.org/guide/migrations.html), you might use:

```yaml
database:
  # Other fields omitted
  migrate: ['npx knex migrate:latest']
```

To run your migrations locally, run `npx dbos-sdk migrate`.

When you [deploy](./application-management.md#registering-and-deploying-applications) an application to DBOS Cloud, it runs `npx dbos-sdk migrate` to apply all schema changes before starting your application.

### Destroying Database Instances

To destroy a database instance, run:

```
npx dbos-cloud db destroy <database-name>
```

:::warning
Take care&#8212;this will irreversibly delete all data in the database instance.
:::
