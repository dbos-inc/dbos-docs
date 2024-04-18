---
sidebar_position: 5
title: Bringing Your Own Database
description: Learn how to bring your own PostgreSQL database to DBOS Cloud
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In this guide, you'll learn how to bring your own PostgreSQL database instance to DBOS Cloud and deploy your applications to it.

:::info
This feature is currently only available to [DBOS Pro/Custom plan](https://www.dbos.dev/pricing) subscribers.
:::

### Link Your Database to DBOS Cloud

DBOS Cloud works with any Postgres database as long as it is accessible and properly set up.
First, DBOS Cloud uses a `dbosadmin` role to manage your application deployments and schema migrations.
You need to create a `dbosadmin` role in your Postgres instance that has the `LOGIN`, `CREATEDB` and `CREATEROLE` privileges:

```sql
CREATE ROLE dbosadmin WITH LOGIN CREATEDB CREATEROLE PASSWORD <password>;
```

Next, link your Postgres instance to DBOS Cloud.
You must choose a database instance name which is 3 to 16 characters long and contain only lowercase letters, numbers and underscores.
You will need this database instance name when you register applications.
Run this command and enter the password for the `dbosadmin` role when prompted.

```shell
npx dbos-cloud db link <database-instance-name> -H <database-hostname> 
```

You can now register and deploy applications with this database instance as normal!  Check out our [applications management](./application-management.md) guide for details.

:::tip
DBOS Cloud is currently hosted in AWS us-east-1.
For maximum performance, we recommend bringing a database instance hosted there.
:::


### Enable Time Travel

DBOS Cloud uses [Postgres logical replication](https://www.postgresql.org/docs/current/logical-replication.html) to capture database history information used in time travel.
For time travel to work with your Postgres instance, you need to enable logical replication and install [wal2json](https://github.com/eulerto/wal2json).

Postgres instances managed by AWS RDS should already have wal2json installed.
Otherwise, you can follow [wal2json installation guide](https://github.com/eulerto/wal2json/tree/master?tab=readme-ov-file#build-and-install) to enable this on your database.

To enable logical replication, you must configure the PostgreSQL [`wal_level`](https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-LEVEL) to `logical` and increase [`max_replication_slots`](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-REPLICATION-SLOTS) to ensure your database has **at least three** open replication slots per DBOS application you intend to deploy:

<Tabs groupId="rds-or-postgres">
  <TabItem value="rds" label="AWS RDS">
Create or edit your database instance's parameter group to set:
```
rds.logical_replication = 1
max_replication_slots = 10 # Configure as needed (minimum three per DBOS application)
```
  </TabItem>
    <TabItem value="postgres" label="PostgreSQL">
Edit your [`postgresql.conf`](https://www.postgresql.org/docs/current/config-setting.html#CONFIG-SETTING-CONFIGURATION-FILE) and add or modify the following lines:

```
wal_level = logical
max_replication_slots = 10 # Configure as needed (minimum three per DBOS application)
```
    </TabItem>
</Tabs>

You need to restart your database after changing these parameters for the changes to take effect.

For DBOS Cloud to automatically capture changes and enable time travel, you must give the `dbosadmin` permission to manage replication slots and subscriptions:

<Tabs groupId="rds-or-postgres">
  <TabItem value="rds" label="AWS RDS">
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

:::tip
The `pg_created_subscription` role is added in PostgreSQL version 16. If you wish to use an earlier version, you may grant `dbosadmin` a super user role or [contact us](https://www.dbos.dev/contact) for help.
:::

Finally, link your database instance to DBOS Cloud with time travel enabled, entering the password for the `dbosadmin` role when prompted:

```shell
npx dbos-cloud db link <database-instance-name> -H <database-hostname> --enable-timetravel
```

You can now register and deploy applications with this database instance as normal and make full use of time travel!  Check out our [applications management](./application-management.md) and [time travel](./timetravel-debugging.md) guides for details.
