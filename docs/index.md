---
sidebar_position: 1
---

# Welcome to the Docs!

DBOS Transact is an open source framework for developing database-backed applications in Typescript and PostgreSQL.
You can host the applications yourself or deploy them in minutes to DBOS Cloud.

You want to build your next database-backed application with DBOS Transact because:

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

- Check out our [quickstart](./getting-started/quickstart) to get an application up and running in less than five minutes.
- Check out our [tutorials](./category/dbos-transact-tutorials) for detailed guides on building applications with DBOS Transact.
- Check out our [cloud tutorials](./category/dbos-cloud-tutorials) to learn how to serverlessly deploy applications to DBOS Cloud.
- Check out our [reference material](./category/reference) for detailed DBOS Transact and DBOS Cloud API references.
- Check out our [concepts and explanations](./category/concepts-and-explanations) to learn how things work under the hood.
- Check out our [demo apps](./tutorials/demo-apps) to see more complex applications built with DBOS.
