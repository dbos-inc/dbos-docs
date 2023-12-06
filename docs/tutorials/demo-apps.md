---
sidebar_position: 21
title: Demo Applications
description: Learn how to build larger apps with Operon
---

To show you how to develop larger applications with Operon, we've built three demo applications, each highlighting a different set of Operon's powerful features.

## [E-Commerce](https://github.com/dbos-inc/dbos-demo-apps/tree/main/e-commerce)

The E-Commerce demo is a toy web shop and payment processing system. Users can purchase expensive writing utensils 

The E-Commerce demo demonstrates:
* Using Operon workflows, transactions, and communicators to build reliable programs
* Using [Knex.js](https://knexjs.org/) for database interaction, schema management and seed data
* Building interactive workflows via [events and messages](./workflow-communication-tutorial.md)
* Implementing a webhook that connects to an existing workflow
* Integration with a [Next.js](https://nextjs.org/) front end

For more technical details, please see the [Under the Covers](https://github.com/dbos-inc/dbos-demo-apps/blob/main/e-commerce/README.md#under-the-covers) section of the E-Commerce README.

## [Bank](https://github.com/dbos-inc/dbos-demo-apps/tree/main/bank)

The Bank demo is a toy banking app. Users can deposit or withdraw "cash" or transfer money between accounts potentially in different banks.

The Bank demo demonstrates:
* Reliable orchestration of complex workflows involving multiple database transactions and communicators
* Using [Prisma](https://www.prisma.io/) for database interaction and schema management
* Setting an [idempotency key](./idempotency-tutorial.md) in HTTP header for exactly-once cross-bank transactions
* JWT-based authentication through integration with an external [Keycloak](https://www.keycloak.org/) service
* [Declarative security](./authentication-authorization.md) through Operon
* Unit tests with the [Operon testing runtime](./testing-tutorial.md)
* Integration with an [Angular](https://angular.io/) frontend


## [YKY Social](https://github.com/dbos-inc/dbos-demo-apps/tree/main/yky-social)
YKY Social is a toy social network app, which allows users to register, create profiles, follow friends, and post messages to each other.

YKY Social currently demonstrates:
* Data management with [TypeORM](https://typeorm.io) and Postgres
* Operon transactions, workflows, and communicators for correct execution
* HTTP handling
* Integration with a [Next.js](https://nextjs.org/) front end
* Declarative security (using an application-managed database table)
* Use of a database table and AWS S3 to securely manage images

YKY Social has no direct dependencies on OS APIs, and is ready to run in a cloud-native environment with a minimal attack surface:
* Serverless operation
* No use of filesystem - "everything is a table"

Future versions of YKY will highlight:
* Data partitioning for scalability
* Cross-partition workflows
