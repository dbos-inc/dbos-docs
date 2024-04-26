---
sidebar_position: 4
title: Interactive Time Travel Queries
description: Learn how to run interactive time travel queries on your database
---

In this guide, you'll learn how to query your DBOS Cloud database interactively and view your application database state at any past point in time within the time travel [data retention period](https://www.dbos.dev/pricing) of your current plan.

### Preliminaries

Before following the steps in this guide, make sure you've [deployed an application to DBOS Cloud](application-management).

You need to run our time travel debug proxy locally to transform database queries to view past state.
Please follow our [time travel debugging tutorial](./timetravel-debugging) to install the proxy via VSCode or manually.
You must make sure the proxy is running through either VSCode or your terminal and is connected to your application database.
**TODO: need better instructions on how to start the proxy**

In this tutorial, we use [psql](https://www.postgresql.org/docs/current/app-psql.html), a terminal program that allows you to query your database interactively.
Connect to your local debug proxy through `psql`:

```bash
psql -h localhost -p 2345 -U postgres
```

You are now connected to your application database through our debug proxy! Note that you don't need any additional authentication between `psql` and the local debug proxy.

### Running Time Travel Queries

By default, any queries you run in `psql` through the debug proxy will show you the latest state of your database.
As a running example, let's deploy a ["Hello, Database"](../getting-started/quickstart) app to DBOS Cloud, which contains a `dbos_hello` table that shows how many time a person is greeted.
You can access the greeting endpoint `<YOUR-APP-URL>/greeting/dbos` to generate some data in your database.
If you run the following query, you'll get the latest state of the `dbos_hello` table, where a person named "dbos" gets greeted 8 times.

```sql
postgres=> select greet_count from dbos_hello where name = 'dbos';
 greet_count
-------------
           8
```


To view your database at a past point in time, you can set the timestamp through a special `DBOS TS <timestamp>` command. We support any timestamp string in [RFC 3339 format](https://datatracker.ietf.org/doc/html/rfc3339).

```sql
postgres=> DBOS TS '2024-04-26T16:00:00-07:00';
```

Now, run the same query again, you'll see the results as if it ran at 4 PM PDT 2024/04/26.
We can see the person named "dbos" got 4 greetings back then:
```sql
postgres=> select greet_count from dbos_hello where name = 'dbos';
 greet_count
-------------
           4
```

You can run any number of queries to view other rows or tables in the database, and they will all return results as if they ran at the same past point in time.

:::warning
You should only run any read queries against past database state, but not database queries that write to the database such as insert/delete/update SQL statements; otherwise, the query results may be incorrect.
:::

Once you finish inspecting your database at a certain timestamp, you can run `DBOS TS <timestamp>` command again to reset the view of your database to another point in time.

Under the hood, the `DBOS TS <timestamp>` command communicates with the debug proxy to run subsequent queries from your `psql` session at a certain point in time.
Therefore, time travel queries from multiple `psql` sessions are completely separated and read-only, and running time travel queries doesn't actually restore/change your database.