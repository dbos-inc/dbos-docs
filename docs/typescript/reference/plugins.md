---
sidebar_position: 200
title: DBOS Plugin Architecture
---

# DBOS Plugin Architecture

DBOS Transact for TypeScript currently provides two explicit extension mechanisms:
* [Datasources](#datasources) integrate database clients, ORMs, or other resouces with DBOS transaction lifecycle management.
* [External Event Receivers](#event-receivers) generally integrate event receivers (pollers, inbound sockets, timers, etc.) with the DBOS lifecycle, and initate workflows upon received events.

## Datasources

### Datasource Examples
The best examples are found in the DBOS [github repository](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages).  Datasource package names end with `-datasource`, such as [`knex-datasource`](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/knex-datasource)

## Event Receivers

### Event Receiver Examples
The best examples are found in the DBOS [github repository](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages).  Event receiver names end with `-receive` or `-serve`, such as [`kafkajs-receive`](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/kafkajs-receive) and [`koa-serve`](https://github.com/dbos-inc/dbos-transact-ts/tree/main/packages/koa-serve)
