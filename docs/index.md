---
sidebar_position: 1
---

# Introduction

Welcome to Operon by [DBOS, Inc.](https://dbos.dev)!

### What is Operon?

Operon is a **Typescript framework built on the database** that helps you develop transactional backend applications.
Operon fully embraces the power of your application database, helping you write backend applications that are **reliable by default**.
It runs your Typescript functions as database transactions, guarantees they run **once and only once** for each request, and orchestrates them into workflows so reliable that if your server restarts, they **resume exactly where they left off.**

You should build your next backend application with Operon because:

- **It's simple**.  Write your business logic using only functions.  Do all your state management in Postgres&#8212;we'll manage the connections and transactions for you.
- **It's reliable by default.**.  Even if you have to reboot your server, your workflows [will always resume from where they left off](./tutorials/workflow-tutorial#reliability-guarantees).  Reliable message delivery is [built in](./tutorials/workflow-communication-tutorial#reliability-guarantees-1). Idempotency is [built in](./tutorials/idempotency-tutorial).
- **It's made for DBOS**.  Starting early next year, you can deploy any Operon application to DBOS's new cloud platform built on our revolutionary, scalable, and secure [cloud-native operating system](https://dbos.dev).

To get started with Operon today in less than five minutes, check out our [quickstart](./getting-started/quickstart)!

### Main Features

Here are some of Operon's core features:

| Feature                                                                       | Description
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Transactions](./tutorials/transaction-tutorial)                              | Easily and safely query your application database
| [Workflows](./tutorials/workflow-tutorial)                                    | Reliable workflow orchestration&#8212;resume your program after any failure.
| [HTTP Serving](./tutorials/http-serving-tutorial)                              | Set up endpoints to serve requests from your application.
| [Idempotency](./tutorials/idempotency-tutorial)                               | Automatically make any request idempotent, so your requests happen exactly once.
| [Logging and Tracing](./tutorials/logging)                                    | Automatic OpenTelemetry-compatible tracing of all requests and built-in structured logging support with configurable exporters.
| [Authentication and Authorization](./tutorials/authentication-authorization)  | Secure your HTTP endpoints so only authorized users can access them.
| [Testing and Debugging](./tutorials/testing-tutorial)                         | Easily write unit tests for your functions and endpoints, compatible with Jest and other popular testing frameworks.
| [Cloud Deployment with DBOS](https://dbos.dev)                                | Coming in early 2024!


### How to Use These Docs

- If you're encountering Operon for the first time, try our [quickstart](./getting-started/quickstart) and get an application up and running in less than five minutes.
- If you want to learn how to use Operon's powerful features, check out our [tutorials](./category/tutorials).
- If you want a detailed reference for the Operon API, check out our [API reference](./category/reference).
- If you want to learn how things work under the hood, check out our [explanation guides](./category/concepts-and-explanations).
- If you want to see more complex applications built with Operon, check out [our demo apps](./tutorials/demo-apps).
