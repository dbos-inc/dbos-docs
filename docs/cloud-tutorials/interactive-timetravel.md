---
sidebar_position: 7
title: Interactive Time Travel
description: Learn how to run interactive time-travelled queries on your database
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In this guide, you'll learn how to interactively time travel with DBOS Cloud: how to query your application's database as of any past point in time within the time travel [data retention period](https://www.dbos.dev/pricing) of your current plan.

### Preliminaries

Before following the steps in this guide, make sure you've [deployed an application to DBOS Cloud](application-management) with [time travel enabled](./cloud-cli#dbos-cloud-app-deploy).

In order to time travel, you need to locally install our time travel proxy.
Please follow our [time travel debugging tutorial](./timetravel-debugging) to install the proxy via VSCode or manually.
Then, start your proxy and connect it to your application database instance:

<Tabs groupId="environment">
  <TabItem value="VSCode" label="VSCode">
	  Open VSCode to your application folder. In the DBOS Cloud View, hover over the application you want to debug and select the `Launch Debug Proxy` menu item.
    This automatically launches the time travel proxy and connects it to your application database instance.

![DBOS Time Travel Launch Debug Proxy Screenshot](./assets/ttdbg-launch-proxy.png)

  </TabItem>
  <TabItem value="CLI" label="CLI">
	  Open a terminal window and navigate to the folder where you downloaded the pre-compiled debug proxy binary file (`debug-proxy`).
   ```bash
cd <Your Download Folder>/
chmod +x debug-proxy
./debug-proxy -db <app database name>_dbos_prov -host <app cloud database hostname>  -password <database password> -user <database username>
   ```
  </TabItem>
</Tabs>

:::info
The DBOS time travel proxy securely connects to the [provenance database](../explanations/system-tables.md), an append-only replica of your application database maintained by DBOS Cloud.
It uses the historical information in this database to run time-travelled queries without modifying your application database.
:::

### Running Time-Travelled Queries

In this tutorial, we interactively run time-travelled queries on your application database using [`psql`](https://www.postgresql.org/docs/current/app-psql.html).
First, connect `psql` to your local time travel proxy:

```bash
psql -h localhost -p 2345 -U postgres
```

By default, any queries you run will reflect the current state of your database.
Let's assume you've deployed the ["Hello, Database" quickstart](../getting-started/quickstart) application to DBOS Cloud.
The application's `dbos_hello` table tracks how many times each person has been greeted.
The following query tells you how many times Mike has been greeted:

```sql
postgres=> select greet_count from dbos_hello where name = 'Mike';
 greet_count
-------------
           8
```

Now, let's time travel!
To view your database at a past point in time, you can set the timestamp through the special `DBOS TS <timestamp>;` command.
We support any timestamp string in [RFC 3339 format](https://datatracker.ietf.org/doc/html/rfc3339).
For example, to view your database at 4:00:00 PM PDT (UTC-07:00) on 2024-04-26, and see how many times Mike had been greeted as of then, run:

```sql
postgres=> DBOS TS '2024-04-26T16:00:00-07:00';
postgres=> select greet_count from dbos_hello where name = 'Mike';
 greet_count
-------------
           4
```

You can run any `SELECT` statement on the database to query its state as of the timestamp you chose.
Statements that modify schemas or data (`INSERT`, `UPDATE`, `DROP TABLE`, etc.) will not have any effect.
At any time, you can run `DBOS TS <timestamp>;` again to travel to a different time.
You can also run `DBOS SNAPSHOT RESET;` to return to the present time.
