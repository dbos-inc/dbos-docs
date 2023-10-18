---
sidebar_position: 1
---

# Introduction

Welcome to Operon by [DBOS, Inc.](https://dbos.dev)!

### What is Operon?

Operon is a **Typescript framework built on the database** that helps you develop transactional backend applications.
Operon fully embraces the power of your application database, helping you write backend applications that are reliable by default.
It runs your Typescript functions as database transactions, guarantees they run "once and only once" for each request, and orchestrates them into workflows so reliable that if your server restarts, they resume exactly where they left off.

This initial release of Operon is just the first step.
In early 2024, we'll launch a **cloud platform for Operon applications built on a revolutionary new software stack** that runs OS services on top of the DBMS instead of the other way around.
This "upside-down" approach rooted in research from MIT and Stanford is intrinsically simple, resilient, and secure because it leverages the robustness and scalability of modern databases.
It also enables powerful new capabilities, like a "time travel debugger" which will set up and replay any scenario that occurred in production for analysis in the development environment.
Once we release this platform, you'll be able to serverlessly deploy any Operon application to it with the push of a button.

To get started with Operon today in less than five minutes, check out our [quickstart](./getting-started/quickstart)!

### Main Features

Here are some of Operon's core features:

| Feature                                                                       | Description
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [HTTP Serving](./tutorials/transaction-tutorial)                              | Set up endpoints to serve requests from your application.
| [Transactions](./tutorials/transaction-tutorial)                              | Easily and safely query your application database
| [Workflows](./tutorials/workflow-tutorial)                                    | Reliable workflow orchestration&#8212;resume your program after any failure.
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