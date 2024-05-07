---
sidebar_position: 6
title: Bring Your Own Database
description: Learn how to bring your own PostgreSQL database to DBOS Cloud
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In this guide, you'll learn how to bring your own PostgreSQL database instance to DBOS Cloud and deploy your applications to it.

:::info
This feature is currently only available to [DBOS Pro or Enterprise](https://www.dbos.dev/pricing) subscribers.
:::

### Linking Your Database to DBOS Cloud

To bring your own PostgreSQL database instance to DBOS Cloud, you must first create a role DBOS Cloud can use to deploy and manage your apps.
This role must be named `dbosadmin` and must have the `LOGIN`, `CREATEDB` and `CREATEROLE` privileges:

```sql
CREATE ROLE dbosadmin WITH LOGIN CREATEDB CREATEROLE PASSWORD <password>;
```

Next, link your database instance to DBOS Cloud, entering the password for the `dbosadmin` role when prompted.
You must choose a database instance name that is 3 to 16 characters long and contains only lowercase letters, numbers and underscores.

```shell
npx dbos-cloud db link <database-instance-name> -H <database-hostname> -p <database-port>
```

You can now register and deploy applications with this database instance as normal!  Check out our [applications management](./application-management.md) guide for details.

:::tip
DBOS Cloud is currently hosted in AWS us-east-1.
For maximum performance, we recommend linking a database instance hosted there.
:::


### Enabling Time Travel

DBOS Cloud uses [Postgres logical replication](https://www.postgresql.org/docs/current/logical-replication.html) to capture database history information used in time travel.
To enable logical replication, you must configure the PostgreSQL [`wal_level`](https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-LEVEL) to `logical` and increase [`max_replication_slots`](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-REPLICATION-SLOTS) to ensure your database has **at least three** open replication slots per DBOS application you intend to deploy:

<Tabs groupId="rds-or-postgres">
  <TabItem value="rds" label="AWS RDS PostgreSQL">
Create or edit your database instance's parameter group to set:
```
rds.logical_replication = 1
max_replication_slots = 30 # At least three open replication slots per DBOS application
```
  </TabItem>
    <TabItem value="postgres" label="PostgreSQL">
Edit your [`postgresql.conf`](https://www.postgresql.org/docs/current/config-setting.html#CONFIG-SETTING-CONFIGURATION-FILE) and add or modify the following lines:

```
wal_level = logical
max_replication_slots = 30 # At least three open replication slots per DBOS application
```
Additionally, you must install the [wal2json](https://github.com/eulerto/wal2json) PostgreSQL extension. Follow [this installation guide](https://github.com/eulerto/wal2json/tree/master?tab=readme-ov-file#build-and-install) to enable it for your database.
    </TabItem>
</Tabs>

You need to restart your database after changing these parameters for the changes to take effect.

Additionally, you must grant the `dbosadmin` role permissions to manage replication slots and subscriptions:

<Tabs groupId="rds-or-postgres">
  <TabItem value="rds" label="AWS RDS PostgreSQL">
```sql
CREATE ROLE dbosadmin WITH LOGIN CREATEDB CREATEROLE PASSWORD <password>;
GRANT rds_replication to dbosadmin;
GRANT pg_create_subscription TO dbosadmin;
```
  </TabItem>
    <TabItem value="postgres" label="PostgreSQL">
```sql
CREATE ROLE dbosadmin WITH LOGIN CREATEDB CREATEROLE REPLICATION PASSWORD <password>;
GRANT pg_create_subscription TO dbosadmin;
```
    </TabItem>
</Tabs>

:::info
The `pg_create_subscription` role is added in PostgreSQL version 16. For earlier PostgreSQL versions, you may grant `dbosadmin` a superuser role or [contact us](https://www.dbos.dev/contact) for help.
:::

Finally, link your database instance to DBOS Cloud with time travel enabled, entering the password for the `dbosadmin` role when prompted:

```shell
npx dbos-cloud db link <database-instance-name> -H <database-hostname> -p <database-port> --enable-timetravel
```

You can now register and deploy applications with this database instance as normal and make full use of time travel!  Check out our [applications management](./application-management.md) and [time travel](./timetravel-debugging.md) guides for details.
