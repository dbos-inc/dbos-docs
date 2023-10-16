---
sidebar_position: 20
title: Demo Applications
description: Learn how to build larger apps with Operon
---

To show you how to develop larger applications with Operon, we've built three demo applications, each highlighting a different set of Operon's powerful features.

## [E-Commerce](https://github.com/dbos-inc/operon-demo-apps/tree/main/e-commerce)

## [Bank](https://github.com/dbos-inc/operon-demo-apps/tree/main/bank)

## [YKY Social](https://github.com/dbos-inc/operon-demo-apps/tree/main/yky-social)
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
