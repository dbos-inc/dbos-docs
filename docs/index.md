---
sidebar_position: 1
---

# Welcome to DBOS!

With these DBOS offerings, you can easily build scalable, reliable, and secure TypeScript applications:

- **DBOS Transact** - An [open-source TypeScript framework](https://github.com/dbos-inc/dbos-ts) for developing transactional applications with built-in once-and-only-once code execution.

- **DBOS Cloud** - A transactional serverless platform for deploying DBOS Transact applications to the cloud with built-in high performance, scalability, fault tolerance, and database time travel.

You want to build your next database-backed application with DBOS because:

- **It's reliable by default**.  If your workflows are interrupted for any reason, they [will always resume from where they left off](./tutorials/workflow-tutorial#reliability-guarantees).  Reliable message delivery is [built in](./tutorials/workflow-communication-tutorial#reliability-guarantees-1). Idempotency is [built in](./tutorials/idempotency-tutorial).
- **It's simple**.  Write your business logic with serverless functions and either [self-host them](./tutorials/self-hosting.md) or [deploy them to the cloud](./getting-started/quickstart.md#deploying-to-dbos-cloud) in minutes. Store your data in any Postgres&mdash;we'll manage the transactions for you.
- **It makes debugging easy**.  With our [time travel debugger](./cloud-tutorials/timetravel-debugging.md), you can "rewind time" and replay any DBOS Cloud trace locally on your computer, exactly as it originally happened.

To get started in less than five minutes, check out our [quickstart](./getting-started/quickstart)!

### Main Features

Here are some of the core features of DBOS Transact:

| Feature                                                                       | Description
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Transactions](./tutorials/transaction-tutorial)                              | Easily and safely query your application database
| [Workflows](./tutorials/workflow-tutorial)                                    | Reliable workflow orchestration&#8212;resume your program after any failure.
| [HTTP Serving](./tutorials/http-serving-tutorial)                             | Set up endpoints to serve requests from your application.
| [Communicators](./tutorials/http-serving-tutorial)                            | Reliably interact with external services and third-party APIs.
| [Idempotency](./tutorials/idempotency-tutorial)                               | Automatically make any request idempotent, so your requests happen exactly once.
| [Authentication and Authorization](./tutorials/authentication-authorization)  | Secure your HTTP endpoints so only authorized users can access them.
| [Testing and Debugging](./tutorials/testing-tutorial)                         | Easily write unit tests for your applications, compatible with Jest and other popular testing frameworks.
| [Self-Hosting](./tutorials/self-hosting)                                      | Host your applications anywhere, as long as they have a Postgres database to connect to.

Here are some of the core features of DBOS Cloud:

| Feature                                                                       | Description
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Serverless App Deployment](./cloud-tutorials/application-management.md)      | Deploy apps to DBOS Cloud in minutes.
| [Time Travel Debugging](./cloud-tutorials/timetravel-debugging.md)            | Replay any DBOS Cloud trace locally on your computer.
| [Cloud Database Management](./cloud-tutorials/database-management.md)         | Provision cloud Postgres instances for your applications.
| [Built-in Observability](./cloud-tutorials/monitoring-dashboard.md)           | Built-in log capture, request tracing, and dashboards.
