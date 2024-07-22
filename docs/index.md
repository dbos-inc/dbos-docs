---
sidebar_position: 1
---

# Welcome to DBOS!

DBOS is a serverless platform that radically simplifies backend application development.

- **Build with DBOS Transact** - An [open-source TypeScript framework](https://github.com/dbos-inc/dbos-ts) for backend applications.

- **Deploy to DBOS Cloud** - A [seriously fast](https://www.dbos.dev/blog/dbos-vs-aws-step-functions-benchmark) serverless hosting platform for TypeScript backends.

Build your next application with DBOS because you want:

- **Blazing-fast, developer-friendly serverless**.  Develop your project locally and run it anywhere. When you're ready, [deploy it for free to DBOS Cloud](./getting-started/quickstart#deploy-your-first-app-to-the-cloud) and experience serverless hosting [25x faster](https://www.dbos.dev/blog/dbos-vs-aws-step-functions-benchmark) and [15x cheaper](https://www.dbos.dev/blog/dbos-vs-lambda-cost) than AWS Lambda.
- **Resilience to any failure**.  If your app is interrupted for any reason, it [automatically resumes from where it left off](./tutorials/workflow-tutorial#reliability-guarantees).  Reliable message delivery is [built in](./tutorials/workflow-communication-tutorial#reliability-guarantees-1). Idempotency is [built in](./tutorials/idempotency-tutorial).
- **Built-in observability**. Automatically emit [OpenTelemetry](https://opentelemetry.io/)-compatible [logs and traces](https://docs.dbos.dev/tutorials/logging) from any application. Query your app's history from the [command line](https://docs.dbos.dev/api-reference/cli#workflow-management-commands) or [with SQL](https://docs.dbos.dev/api-reference/system-tables).
- **Database time travel**. Query your database as of [any past point in time](./cloud-tutorials/interactive-timetravel.md). Use [time travel debugging](./cloud-tutorials/timetravel-debugging.md) to replay production traces locally.
- **A framework built for the tools you love**. Build with TypeScript and **any** PostgreSQL-compatible database. Use raw SQL or your favorite query builder or ORM&mdash;we support [Knex](https://docs.dbos.dev/tutorials/using-knex), [TypeORM](https://docs.dbos.dev/tutorials/using-typeorm), and [Prisma](https://docs.dbos.dev/tutorials/using-prisma) out of the box.

To get started in less than five minutes, check out our [quickstart](./getting-started/quickstart)!

### Main Features

Here are some of the core features of DBOS Transact:

| Feature                                                                       | Description
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Transactions](./tutorials/transaction-tutorial)                              | Easily and safely query your application database using [Knex](./tutorials/using-knex.md), [TypeORM](./tutorials/using-typeorm.md), [Prisma](./tutorials/using-prisma.md), or raw SQL.
| [Reliable Workflows](./tutorials/workflow-tutorial)                           | Execute each step of your application exactly-once and automatically resume after any failure.
| [HTTP Serving](./tutorials/http-serving-tutorial)                             | Set up endpoints to serve requests from your application.
| [Stored Procedures](./tutorials/stored-proc-tutorial.md)                      | Speed up your transactions 2-3x by compiling them to Postgres stored procedures.
| [Communicators](./tutorials/http-serving-tutorial)                            | Reliably interact with external services and third-party APIs.
| [Idempotency](./tutorials/idempotency-tutorial)                               | Automatically make any request idempotent, so your requests happen exactly once.
| [Authentication and Authorization](./tutorials/authentication-authorization)  | Secure your HTTP endpoints so only authorized users can access them.
| [Kafka Integration](./tutorials/kafka-integration)                            | Consume Kafka messages exactly-once with transactions or workflows.
| [Scheduled Workflows](./tutorials/scheduled-workflows.md)                     | Schedule your workflows to run exactly-once per time interval with cron-like syntax.
| [Testing and Debugging](./tutorials/testing-tutorial)                         | Easily write unit tests for your applications, compatible with Jest and other popular testing frameworks.
| [Self-Hosting](./tutorials/self-hosting)                                      | Host your applications anywhere, as long as they have a Postgres database to connect to.

Here are some of the core features of DBOS Cloud:

| Feature                                                                          | Description
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Serverless App Deployment](./cloud-tutorials/application-management.md)         | Deploy apps to DBOS Cloud in minutes.
| [Interactive Time Travel](./cloud-tutorials/interactive-timetravel.md)           | Query your application database as of any past point in time.
| [Time Travel Debugging](./cloud-tutorials/timetravel-debugging.md)               | Replay any DBOS Cloud trace locally on your computer.
| [Cloud Database Management](./cloud-tutorials/database-management.md)            | Provision cloud Postgres instances for your applications.
| [Disaster Recovery](./cloud-tutorials/database-management.md#database-recovery)  | Automatically recover your database and applications to a past point in time.
| [Built-in Observability](./cloud-tutorials/monitoring-dashboard.md)              | Built-in log capture, request tracing, and dashboards.
