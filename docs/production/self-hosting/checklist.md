---
sidebar_position: 16
title: Production Checklist
toc_max_heading_level: 3
---

This page describes best practices you should follow when operating a DBOS application in production.

## Managing Postgres

DBOS is entirely built on Postgres.
Here are some recommendations for configuring a Postgres database to best work with DBOS.

**Use Any Postgres** - DBOS is compatible with any Postgres database, including standard self-hosted Postgres, RDS, Aurora, Google Cloud SQL, Azure PostgreSQL, Supabase, Neon, Planetscale, TimescaleDB.

**If using a connection pooler, use it session mode** - Connect your DBOS applications to your Postgres database either directly or using a connection pooler in session mode. Do not use a connection pooler in transaction mode as some Postgres features that DBOS uses (e.g., LISTEN/NOTIFY) are not compatible with it. [This page](https://www.pgbouncer.org/features.html) documents the differences.

**Configure a retention policy** - You should configure a [retention policy](./retention.md) for the workflows in your DBOS application to limit the total amount of storage DBOS uses.

**Monitor Connection Usage** - You can check the maximum number of connections your Postgres database can accept by running `SHOW max_connections;`.
Typically, a Postgres database can support 100 connections per gigabyte of memory.
You should make sure you have enough connections to support all your DBOS application servers.
You can configure the maximum number of connections a DBOS application can make through the `sys_db_pool_size`/`systemDatabasePoolSize` configuration parameter.

**Monitor Database Usage** - A DBOS workflow requires two database writes (one at the beginning to checkpoint its input, one at the end to checkpoint its outcome) plus one additional write per step (to checkpoint the step's outcome).
Depending on size, a Postgres database can perform between 1K-10K writes per second.
Thus, an application can perform between 1K-10K workflows or steps per second, depending on database size.
If your expected load exceeds 1K steps per second, you should perform load tests to verify your Postgres database can handle the load.
If it exceeds 10K steps per second, we recommend sharding workflows across multiple Postgres servers.

## Availability

To maximize availability of your DBOS application, we recommend using a highly available Postgres database.
Most cloud Postgres providers provide multi-AZ replication with hot standbys, so your database can seamlessly and automatically fail over to a backup if anything goes wrong.
Note that there is nothing DBOS-specific about this&mdash;we recommend following industry best practices for maximizing Postgres availability.

If your Postgres database does become unavailable, all DBOS applications connected to it will pause workflow execution until they reconnect.
When your database becomes available again, they will seamlessly resume.

It is worth noting that DBOS Conductor is entirely out-of-band and off your application's workflow execution path.
Thus, its availability does not affect the availability of your applications.
If your connection to Conductor is interrupted, your applications will continue operating normally.
All Conductor features (recovery, observability, workflow management) will automatically resume once connectivity is restored.

## Upgrading the DBOS Library


## Configuring Self-Hosted Conductor