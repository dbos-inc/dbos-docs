---
sidebar_position: 1
title: Operon Project Structure
description: Learn how to structure an Operon application
---

In this guide, you'll learn how to structure an Operon project.
When you initialize an Operon project with `npx operon init`, it has the following structure:

```bash
operon-hello-app/
├── README.md
├── knexfile.ts
├── migrations/
├── node_modules/
├── operon-config.yaml
├── package-lock.json
├── package.json
├── src/
│   └── userFunctions.ts
├── start_postgres_docker.sh
└── tsconfig.json
```

The two most important files in an Operon project are `operon-config.yaml` and `src/userFunctions.ts`.

`operon-config.yaml` defines the configuration of an Operon project, including database connection information, ORM configuration, and global logging configuration.
All options are documented in our [configuration reference](..).

`src/userFunctions.ts` is where Operon looks for your code.
At startup, the Operon runtime automatically loads all classes exported from this file, serving their endpoints and registering their transactions and workflows.
If you're writing a small application, you can write all your code directly in this file.
In a larger application, you can write your code wherever you want, but should use `src/userFunctions.ts` as an index file, exporting code written elsewhere.

As for the rest of the directory:

- `knexfile.ts` is a configuration file for [Knex](https://knexjs.org), which we use as a query builder and migration tool.
- `migrations` is initialized with a Knex database migration used in the [quickstart guide](../getting-started/quickstart).  If you're using Knex for schema management, you can create your own migrations here.
- `node_modules`, `package-lock.json`, `package.json`, and `tsconfig.json` are needed by all Node/Typescript projects.
- `start_postgres_docker.sh` is a convenience script that initializes a Docker-hosted Postgres database for use in the [quickstart](../getting-started/quickstart).  You can modify this script if you want to use Docker-hosted Postgres for local development.
