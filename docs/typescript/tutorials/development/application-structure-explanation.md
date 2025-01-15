---
sidebar_position: 10
title: Project Structure
description: Learn about the structure of a DBOS project
pagination_next: null
---

Here is the structure of the DBOS Knex starter app, initialized with `npx @dbos-inc/create -t dbos-knex`:

```bash
dbos-knex/
├── README.md
├── dbos-config.yaml
├── eslint.config.js
├── jest.config.js
├── knexfile.js
├── migrations/
├── node_modules/
├── package.json
├── package-lock.json
├── src/
│   |── main.ts
│   └── main.test.ts
├── start_postgres_docker.js
└── tsconfig.json
```

The two most important files in this DBOS project are `dbos-config.yaml` and `src/main.ts`.

`dbos-config.yaml` defines the configuration of a DBOS project, including database connection information, migration configuration, and global logging configuration.
All options are documented in the [configuration reference](../../reference/configuration).

`src/main.ts` contains the application's source code.
The application knows to launch from this code because of a _start command_ defined in `dbos-config.yaml`.
For this application, the start command is `node dist/main.js`, which tells Node to execute the compiled JavaScript file for this source code.

As for the rest of the directory:

- `src/main.test.ts` contains example unit tests written with [Jest](https://jestjs.io/). `jest.config.js` contains Jest configuration.
- `knexfile.js` is a configuration file for [Knex](https://knexjs.org), which this app uses as a query builder and migration tool.
- `migrations` is initialized with a Knex database migration.
- `node_modules`, `package.json`, `package-lock.json`, and `tsconfig.json` are needed by all Node/TypeScript projects. `eslint.config.js` is used by the JavaScript/TypeScript linter, [ESLint](https://eslint.org/).
- `start_postgres_docker.js` is a convenience script that initializes a Docker Postgres container.
