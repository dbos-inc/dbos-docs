---
sidebar_position: 5
title: Bringing Your Own Database
description: Learn how to bring your own PostgreSQL database to DBOS Cloud
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In this guide, you'll learn how to bring your own PostgreSQL database instance to DBOS Cloud and deploy applications to it.

:::info
This feature is only available to paying DBOS Cloud subscribers.
:::

### Bringing Your Own Database

To bring your own database instance to DBOS Cloud, you must create in it a role from which DBOS Cloud can access it.
This role must be named `dbosadmin` and must have the `LOGIN`, `CREATEDB` and `CREATEROLE` privileges:

```sql
CREATE ROLE dbosadmin WITH LOGIN CREATEDB CREATEROLE PASSWORD <password>;
```
Next, link your database instance to DBOS Cloud, entering the password for the `dbosadmin` role when prompted:

```shell
npx dbos-cloud db link <database-name> -H <database-hostname> 
```

You can now register and deploy applications with this database instance as normal!  Check out our [applications management](./application-management.md) guide for details.

:::info
DBOS Cloud is hosted in AWS in us-east-1.
For maximum performance, we recommend bringing a database instance hosted there.
:::


### Enabling Time Travel

DBOS Cloud uses [Postgres logical replication](https://www.postgresql.org/docs/current/logical-replication.html) to capture database history information used in time travel.
To enable time travel for a linked database instance, you must give the `dbosadmin` permission to manage replication slots and subscriptions:

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

You must additionally configure the PostgreSQL [`wal_level`](https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-LEVEL) to `logical` and increase [`max_replication_slots`](https://www.postgresql.org/docs/current/runtime-config-replication.html#GUC-MAX-REPLICATION-SLOTS) to ensure your database has at least three open replication slots per DBOS application you intend to deploy:

<Tabs groupId="rds-or-postgres">
  <TabItem value="rds" label="AWS RDS">
Create or edit your database instance's parameter group to set `wal_level` to `logical` and `max_replication_slots` to an appropriately large number.
  </TabItem>
    <TabItem value="postgres" label="PostgreSQL">
Edit your [`postgresql.conf`](https://www.postgresql.org/docs/current/config-setting.html#CONFIG-SETTING-CONFIGURATION-FILE) and add or modify the following lines:

```
wal_level = logical
max_replication_slots = 100 # Configure as needed (minimum three per DBOS application)
```
    </TabItem>
</Tabs>

You must restart your database after changing these parameters for the changes to take effect.

Then, link your database instance to DBOS Cloud enabling time travel, entering the password for the `dbosadmin` role when prompted:

```shell
npx dbos-cloud db link <database-name> -H <database-hostname> --enable-timetravel
```

You can now register and deploy applications with this database instance as normal and make full use of time travel!  Check out our [applications management](./application-management.md) and [time travel](./timetravel-debugging.md) guides for details.
