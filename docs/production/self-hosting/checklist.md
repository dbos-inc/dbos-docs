---
sidebar_position: 16
title: Production Checklist
toc_max_heading_level: 3
---

This page describes best practices you should follow when operating a DBOS application in production.

## Managing Postgres

DBOS is entirely built on Postgres.
Here are some recommendations for configuring a Postgres database to best work with DBOS.

**Use any Postgres** - DBOS is compatible with any Postgres database, including standard self-hosted Postgres, RDS, Aurora, Google Cloud SQL, Azure PostgreSQL, Supabase, Neon, Planetscale, TimescaleDB, etc.

**If using a connection pooler, use it session mode** - Connect your DBOS applications to your Postgres database either directly or using a connection pooler in session mode. Do not use a connection pooler in transaction mode as some Postgres features that DBOS uses (e.g., LISTEN/NOTIFY) are not compatible with it. [This page](https://www.pgbouncer.org/features.html) documents the differences.

**Configure a retention policy** - You should configure a [retention policy](./retention.md) for the workflows in your DBOS application to limit the total amount of storage DBOS uses.


**Manage the DBOS schema** - DBOS creates tables for its internal state in its [system database](../../explanations/system-tables.md).
By default, a DBOS application automatically creates these on startup.
However, in production environments, a DBOS application may not run with sufficient privilege to create databases or tables.
In that case, the [`dbos migrate`](../../python/reference/cli.md#dbos-migrate) command in Python, the [`dbos migrate`](../../golang/reference/cli.md) in Go, or the [`dbos schema`](../../typescript/reference/cli.md#npx-dbos-schema) command in TypeScript can be run with a privileged user to create all DBOS database tables or migrate them to the latest version.
Then, a DBOS application can run without privilege (requiring only access to the system database).

## Scalability

You can easily scale a DBOS application by adding more servers to it, so the scalability of DBOS is fundamentally determined by the database it is connected to.
We recommend taking these steps in Postgres to guarantee the scalability of your application.

**Monitor Connection Usage** - You can check the maximum number of connections your Postgres database can accept by running `SHOW max_connections;`.
Typically, a Postgres database can support 100 connections per gigabyte of memory.
You should make sure you have enough connections to support all your DBOS application servers.
You can configure the maximum number of connections a DBOS application can make through the `sys_db_pool_size`/`systemDatabasePoolSize` configuration parameter.
We do not recommend setting this to less than 5.

**Monitor Database Usage** - A DBOS workflow requires two database writes (one at the beginning to checkpoint its input, one at the end to checkpoint its outcome) plus one additional write per step (to checkpoint the step's outcome).
Depending on size, a Postgres database can perform between 1K-10K writes per second.
Thus, an application can perform between 1K-10K workflows or steps per second, depending on database size.
If your expected load exceeds 1K workflows or steps per second, you should perform load tests to verify your Postgres database can handle the load.
If it exceeds 10K workflows or steps per second, we recommend sharding workflows across multiple Postgres servers.

## Availability

To maximize availability of your DBOS application, we recommend using a highly available Postgres database.
Most cloud Postgres providers provide multi-AZ replication with automatic failover, so your database can seamlessly fail over to a backup if anything goes wrong.
Note that there is nothing DBOS-specific about this&mdash;we recommend following industry best practices for maximizing Postgres availability.

If your Postgres database does become unavailable, all DBOS applications connected to it will pause workflow execution until they reconnect.
When your database becomes available again, they will seamlessly resume.

It is worth noting that DBOS Conductor is entirely out-of-band and off your application's workflow execution path.
Thus, its availability does not affect the availability of your applications.
If your connection to Conductor is interrupted, your applications will continue operating normally.
All Conductor features (recovery, observability, workflow management) will automatically resume once connectivity is restored.

## Upgrading the DBOS Library

We recommend regularly upgrading the DBOS library to its latest version to take advantage of new features.
All implementations of the DBOS library follow strict semantic versioning.
Minor version upgrades do not introduce breaking changes.
Major version upgrades may introduce breaking changes, but these are always documented in the release notes.
New library versions are always announced on GitHub ([Python](https://github.com/dbos-inc/dbos-transact-py/releases), [TypeScript](https://github.com/dbos-inc/dbos-transact-ts/releases), [Go](https://github.com/dbos-inc/dbos-transact-golang/releases), [Java](https://github.com/dbos-inc/dbos-transact-java/releases)) and on the [community Discord](https://discord.com/invite/jsmC6pXGgX).

## Securing Self-Hosted Conductor

If you are [self-hosting Conductor](./hosting-conductor.md), we recommend taking these additional steps to ensure the security of your deployment.
If you are using DBOS-managed Conductor, don't worry&mdash;this is done for you.

**Connect using TLS** - You should deploy your self-hosted Conductor and DBOS Console behind a reverse proxy (e.g., Nginx) for web traffic ingress and TLS termination.
Otherwise, your traffic to Conductor may be unencrypted and vulnerable to snooping by third parties.

**Set up authentication** - Set up authentication and authorization for all API calls to self-hosted Conductor by following [this guide](./hosting-conductor.md#security).
Otherwise, your Conductor service could be accessed by unwanted entities.