---
sidebar_position: 1
---

# Welcome to DBOS!

DBOS is a transactional serverless framework and platform that helps you develop and deploy database-backed applications.
You develop your applications in TypeScript and PostgreSQL with our open-source framework [DBOS Transact](https://github.com/dbos-inc/dbos-ts), then either self-host them or deploy them in minutes to DBOS Cloud.

You want to build your next database-backed application with DBOS because:

- **It's simple**.  Write your business logic with serverless functions and either [self-host them](./tutorials/self-hosting.md) or deploy them to the cloud in minutes.  Store all your data in Postgres&#8212;we'll manage the connections and transactions for you.
- **It's reliable by default**.  If your workflows are interrupted for any reason, they [will always resume from where they left off](./tutorials/workflow-tutorial#reliability-guarantees).  Reliable message delivery is [built in](./tutorials/workflow-communication-tutorial#reliability-guarantees-1). Idempotency is [built in](./tutorials/idempotency-tutorial).
- **It makes debugging easy**.  With our [time travel debugger](./cloud-tutorials/timetravel-debugging.md), you can "rewind time" and replay any DBOS Cloud trace locally on your computer, exactly as it originally happened.

To get started with DBOS today in less than five minutes, check out our [quickstart](./getting-started/quickstart)!

### Main Features

Here are some of the core features of DBOS Transact:

| Feature                                                                       | Description
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Transactions](./tutorials/transaction-tutorial)                              | Easily and safely query your application database
| [Workflows](./tutorials/workflow-tutorial)                                    | Reliable workflow orchestration&#8212;resume your program after any failure.
| [HTTP Serving](./tutorials/http-serving-tutorial)                             | Set up endpoints to serve requests from your application.
| [Idempotency](./tutorials/idempotency-tutorial)                               | Automatically make any request idempotent, so your requests happen exactly once.
| [Authentication and Authorization](./tutorials/authentication-authorization)  | Secure your HTTP endpoints so only authorized users can access them.
| [Testing and Debugging](./tutorials/testing-tutorial)                         | Easily write unit tests for your applications, compatible with Jest and other popular testing frameworks.
| [Self-Hosting](./tutorials/self-hosting)                                      | Host your applications anywhere, as long as they have a Postgres database to connect to.

And DBOS Cloud:

| Feature                                                                       | Description
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Serverless App Deployment](./cloud-tutorials/application-management.md)      | Deploy apps to DBOS Cloud in minutes.
| [Time Travel Debugging](./cloud-tutorials/timetravel-debugging.md)            | Replay any DBOS Cloud trace locally on your computer.
| [Cloud Database Management](./cloud-tutorials/database-management.md)         | Provision cloud Postgres instances for your applications.
| [Built-in Observability](./cloud-tutorials/monitoring-dashboard.md)           | Built-in log capture, request tracing, and dashboards.


### How to Use These Docs

- If you're encountering DBOS for the first time, try our [quickstart](./getting-started/quickstart) and get an application up and running in less than five minutes.
- If you want to learn how to use DBOS Transact's powerful features, check out its [tutorials](./category/dbos-transact-tutorials).
- If you want to learn how to deploy applications to DBOS Cloud, check our our [cloud tutorials](./category/dbos-cloud-tutorials).
- If you want detailed API references for DBOS Transact and DBOS Cloud, check out our [reference material](./category/reference).
- If you want to learn how things work under the hood, check out our [explanation guides](./category/concepts-and-explanations).
- If you want to see more complex applications built with DBOS, check out [our demo apps](./tutorials/demo-apps).
