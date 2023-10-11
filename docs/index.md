---
sidebar_position: 1
---

# Introduction

Welcome to the Operon documentation!

### What is Operon?

Operon is a **Typescript framework for the backend**.
Operon enables you to write backend applications that work right by default, providing native support for application database management, reliable workflow execution, OpenTelemetry-compatible tracing, authentication/authorizaton, and much more.

Unlike in other backend frameworks, your application database is a _first-class citizen_ of Operon.
Operon makes writing database operations painless for you, regardless of whether you prefer raw SQL or an ORM.
Under the hood, we also leverage the database to give you _reliable workflows_, so you can write programs that are guaranteed to run to completion despite failures and always resume where they left off when your application is restarted.

Operon is also the **SDK for DBOS's upcoming serverless cloud platform**.
In the near future, you'll be able to deploy any Operon application serverlessly to the cloud with the push of a button, running effortlessly at scale without worrying about managing infrastructure.

To get started with Operon in less than five minutes, check out our [quickstart](./getting-started/quickstart)!

### Main Features

Here are some of Operon's core features:

| Feature                                                                  | Description                                                                                                                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [HTTP Serving](./tutorials/transaction-tutorial)                         | Set up endpoints to serve requests from your application.
| [Transactions](./tutorials/transaction-tutorial)                         | Easily query your application database, with support for raw SQL and popular ORMs.
| [Workflows](./tutorials/workflow-tutorial)                               | Reliable workflow orchestration--make sure your program runs to completion, no matter what happens.
| [Idempotency](./tutorials/idempotency-tutorial)                          | Automatically make any request idempotent, so your requests happen exactly once.
| [Logging and Tracing](./tutorials/idempotency)                           | Automatic OpenTelemetry-compatible tracing of all requests and built-in logging support with configurable exporters.
| [Authentication and Authorization](..)                                   | Secure your HTTP endpoints so only authorized users can access them.
| [Testing and Debugging](./tutorials/testing-tutorial)                    | Easily write unit tests for your functions and endpoints, compatible with Jest and other popular testing frameworks.
| [Cloud Deployment with DBOS](https://dbos.dev)                           | Coming soon!


### How to Use These Docs

- If you're encountering Operon for the first time, start with our [quickstart](./getting-started/quickstart) to learn how to get an application up and running in less than five minutes.
- If you want to learn how to use Operon's powerful features, check out our [tutorials](./category/tutorials).
- If you want a detailed reference for the Operon API, check out our [API reference](./category/api-reference).
- If you want to learn how things work under the hood, check out our [explanation guides](./category/concepts-and-explanations)