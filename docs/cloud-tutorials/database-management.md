---
sidebar_position: 1
title: Cloud Database Management
description: Learn how to manage DBOS Cloud database instances
---

In this guide, you'll learn how to manage database instances in DBOS Cloud.

### Preliminaries

Before following any of the steps in this guide, make sure you've created and registered a DBOS Cloud account.
Then, in your application root directory, log in to DBOS Cloud by running:

```
npx dbos-cloud login
```

### Provisioning Database Instances

Before you can deploy an application to DBOS Cloud, you must provision a Postgres database instance for it.
You should choose a database name and an administrator username and password for your database instance.
Both the database instance name and the administrator username must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).
To provision a database instance, run (this takes ~5-7 minutes):

```
npx dbos-cloud database provision <database-name> -a <admin-username> -W <admin-password>
```

:::tip
Each Postgres database instance is a physical server that can host multiple independent Postgres databases for different applications.
You can define which Postgres database your application connects to through the `app_db_name` field in its [`dbos-config.yaml`](../api-reference/configuration.md#database).

However, don't worry about setting the other database connection parameters like `hostname` or `password` for cloud deployment&#8212;DBOS automatically takes care of that for you, applying the connection information of your cloud database when you deploy an application.
:::

:::tip
Remember your database administrator password! You need it to connect to our [time travel debugger](#).
:::

To see a list of all provisioned instances, run:

```
npx dbos-cloud database list
```

To retrieve the status of a particular instance, run:

```
npx dbos-cloud database status <database-name>
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
npx dbos-cloud database destroy <database-name>
```

Take care&#8212;this irreversibly delete all data on the instance.