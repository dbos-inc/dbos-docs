---
sidebar_position: 4
title: Interactive Time Travel Queries
description: Learn how to run interactive time travel queries on your database
---

In this guide, you'll learn how to query your DBOS Cloud database interactively and view your application database state at any past point in time within the time travel [data retention period](https://www.dbos.dev/pricing) of your current plan.

### Preliminaries

You need to run our time travel debug proxy locally to transform database queries to view past state.
Please follow our [time travel debugging tutorial](./timetravel-debugging) to install the proxy via VSCode or manually.
You must make sure the proxy is running through either VSCode or your terminal and is connected to your application database.

In this tutorial, we use [psql](https://www.postgresql.org/docs/current/app-psql.html), a terminal program that allows you to query your database interactively.
Connect to your local debug proxy through `psql`:

```bash
psql -h localhost -p 2345 -U postgres
```

You are now connected to your application database through our debug proxy! Note that you don't need any additional authentication between `psql` and the local debug proxy.

### Running Time Travel Queries

By default, any queries you run in `psql` through the debug proxy will show you the latest state of your database.
As a running example, we deployed a [DBOS Widget Store](https://github.com/dbos-inc/dbos-demo-apps/tree/main/widget-store) app to DBOS Cloud, which contains a `product` table that shows the inventory of products and an `orders` table to show placed orders.
If you run the following query, you'll get the latest state of the product table:

```sql
postgres=> select product_id, product, inventory from products;
 product_id |        product         | inventory
------------+------------------------+-----------
          1 | Premium Quality Widget |         2
```

If you run the next query, you'll get how many orders are placed so far:

```sql
postgres=> select count(*) from orders;
 count
-------
    10
```

To view your database at a past point in time, you can set the timestamp through a special `DBOS TS <timestamp>` command. We support any timestamp string in [RFC 3339 format](https://datatracker.ietf.org/doc/html/rfc3339).

```sql
postgres=> DBOS TS '2024-04-24T10:00:00-07:00';
```

Now, run the same queries again, you'll see the results as if they ran at 10 AM PDT, 2024/04/24.

For example, we can see there were 7 items left back then:
```sql
postgres=> select product_id, product, inventory from products;
 product_id |        product         | inventory
------------+------------------------+-----------
          1 | Premium Quality Widget |         7
```

We can also see that only 5 orders were placed:
```sql
postgres=> select count(*) from orders;
 count
-------
    5
```

You can run any number of queries to view other tables in the database, and they will all return results as if they ran at 10 AM PDT, 2024/04/24.

:::warning
You should only run any read queries against past database state, but not database queries that write to the database such as insert/delete/update SQL statements; otherwise, the query results may be incorrect.
:::

Once you finish inspecting your database at a certain timestamp, you can run `DBOS TS <timestamp>` command again to reset the view of your database to another point in time.

Under the hood, the `DBOS TS <timestamp>` command communicates with the debug proxy to run subsequent queries from your `psql` session at a certain point in time.
Therefore, time travel queries from multiple `psql` sessions are completely separated and read-only, and running time travel queries doesn't actually restore/change your database.