---
sidebar_position: 4
title: Bringing Your Own Database
---

In this guide, you'll learn how to bring your own Postgres database instance to DBOS Cloud and deploy your applications to it.

### Linking Your Database to DBOS Cloud

To bring your own Postgres database instance to DBOS Cloud, you must first create a role DBOS Cloud can use to deploy and manage your apps.
This role must be named `dbosadmin` and must have the `LOGIN` and `CREATEDB` privileges:

```sql
CREATE ROLE dbosadmin WITH LOGIN CREATEDB PASSWORD <password>;
```

Next, link your database instance to DBOS Cloud, entering the password for the `dbosadmin` role when prompted.
You must choose a database instance name that is 3 to 16 characters long and contains only lowercase letters, numbers and underscores.

```shell
dbos-cloud db link <database-instance-name> -H <database-hostname> -p <database-port>
```

You can now register and deploy applications with this database instance as normal!  Check out our [applications management](./application-management.md) guide for details.

:::tip
DBOS Cloud is currently hosted in AWS us-east-1.
For maximum performance, we recommend linking a database instance hosted there.
:::
