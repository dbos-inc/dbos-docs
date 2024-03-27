---
sidebar_position: 30
title: Demo Applications
description: Learn how to build larger apps with DBOS
---

To show you how to develop larger applications with DBOS, we've built two demo applications, each highlighting a different set of DBOS's powerful features.

## [E-Commerce](https://github.com/dbos-inc/dbos-demo-apps/tree/main/e-commerce)

The E-Commerce demo is a toy web shop and payment processing system. Users can purchase expensive writing utensils 

The E-Commerce demo demonstrates:
* Using DBOS workflows, transactions, and communicators to build reliable programs
* Using [Knex.js](https://knexjs.org/) for database interaction, schema management and seed data
* Building interactive workflows via [events and messages](./workflow-communication-tutorial.md)
* Implementing a webhook that connects to an existing workflow
* Integration with a [Next.js](https://nextjs.org/) front end

For more technical details, please see the [Under the Covers](https://github.com/dbos-inc/dbos-demo-apps/blob/main/e-commerce/README.md#under-the-covers) section of the E-Commerce README.

## [YKY Social](https://github.com/dbos-inc/dbos-demo-apps/tree/main/yky-social)
YKY Social is a toy social network app, which allows users to register, create profiles, follow friends, and post messages to each other.

YKY Social currently demonstrates:
* Data management with [TypeORM](https://typeorm.io) and Postgres
* DBOS transactions, workflows, and communicators for correct execution
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
