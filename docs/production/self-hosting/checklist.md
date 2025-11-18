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



## Scalability

## Availability

## Upgrading the DBOS Library


## Configuring Self-Hosted Conductor