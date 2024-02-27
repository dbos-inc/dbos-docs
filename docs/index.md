---
sidebar_position: 1
---

# Introduction

Welcome to DBOS!

### What is DBOS?

DBOS is a transactional serverless platform that helps you develop and deploy database-backed applications.
You develop your applications in Typescript and PostgreSQL with our [open-source SDK](https://github.com/dbos-inc/dbos-ts) then deploy them with a push of a button to DBOS Cloud.

You want to build your next database-backed application with DBOS because:

- **It's simple**.  Write your business logic using serverless functions and deploy them to the cloud with the push of a button.  Store all your data in Postgres&#8212;we'll manage the connections and transactions for you.
- **It's reliable by default**.  If your workflows are interrupted for any reason, they [will always resume from where they left off](./tutorials/workflow-tutorial#reliability-guarantees).  Reliable message delivery is [built in](./tutorials/workflow-communication-tutorial#reliability-guarantees-1). Idempotency is [built in](./tutorials/idempotency-tutorial).
- **It makes debugging a joy**.  With our [time travel debugger](./cloud-tutorials/timetravel-debugging.md), you can "rewind time" and replay any DBOS Cloud trace locally on your computer, exactly as it originally happened. Whatever the issue is, we'll help you reproduce it.

To get started with DBOS today in less than five minutes, check out our [quickstart](./getting-started/quickstart)!

### Main Features

Here are some of the core features of the DBOS Typescript SDK:

| Feature                                                                       | Description
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Transactions](./tutorials/transaction-tutorial)                              | Easily and safely query your application database
| [Workflows](./tutorials/workflow-tutorial)                                    | Reliable workflow orchestration&#8212;resume your program after any failure.
| [HTTP Serving](./tutorials/http-serving-tutorial)                             | Set up endpoints to serve requests from your application.
| [Idempotency](./tutorials/idempotency-tutorial)                               | Automatically make any request idempotent, so your requests happen exactly once.
| [Authentication and Authorization](./tutorials/authentication-authorization)  | Secure your HTTP endpoints so only authorized users can access them.
| [Testing and Debugging](./tutorials/testing-tutorial)                         | Easily write unit tests for your applications, compatible with Jest and other popular testing frameworks.

And DBOS Cloud:

| Feature                                                                       | Description
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Serverless App Deployment](./cloud-tutorials/application-management.md)      | Deploy apps to DBOS Cloud with the push of a button
| [Time Travel Debugging](./cloud-tutorials/timetravel-debugging.md)            | Replay any DBOS Cloud trace locally on your computer.
| [Cloud Database Management](./cloud-tutorials/database-management.md)         | Provision cloud Postgres instances for your applications.
| [Built-in Observability](./cloud-tutorials/monitoring-dashboard.md)           | Built-in log capture, request tracing, and dashboards.


### How to Use These Docs

- If you're encountering DBOS for the first time, try our [quickstart](./getting-started/quickstart) and get an application up and running in less than five minutes.
- If you want to learn how to use DBOS's powerful features, check out our [SDK tutorials](./category/dbos-sdk-tutorials).
- If you want to learn how to deploy applications to DBOS Cloud, check our our [cloud tutorials](./category/dbos-cloud-tutorials).
- If you want a detailed reference for the DBOS SDK and DBOS Cloud APIs, check out our [API reference](./category/reference).
- If you want to learn how things work under the hood, check out our [explanation guides](./category/concepts-and-explanations).
- If you want to see more complex applications built with DBOS, check out [our demo apps](./tutorials/demo-apps).
