---
sidebar_position: 30
title: Project Structure
description: Learn about the structure of a DBOS project
---

When you initialize a DBOS project with `npx @dbos-inc/create`, it has the following structure:

```bash
dbos-hello-app/
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
│   |── operations.ts
│   └── operations.test.ts
├── start_postgres_docker.js
└── tsconfig.json
```

The two most important files in a DBOS project are `dbos-config.yaml` and `src/operations.ts`.

`dbos-config.yaml` defines the configuration of a DBOS project, including database connection information, migration configuration, and global logging configuration.
All options are documented in our [configuration reference](../reference/configuration).

`src/operations.ts` is the _entrypoint_, where DBOS looks for your code.
At startup, the DBOS runtime automatically loads all classes that are exported or (directly and indirectly) referenced from this file, serving their endpoints and registering their decorated functions.
More precisely, DBOS assumes your compiled code is exported from `dist/operations.js`, the default location to which `src/operations.ts` is compiled.
If you're writing a small application, you can write all your code directly in this file.
In a larger application, you can write your code wherever you want, but should use `src/operations.ts` as an index file, exporting code written elsewhere:
```typescript
// Placed in operations.ts:
export { OperationClass1, OperationClass2 } from './FileA';
export { OperationClass3 } from './operations/FileB';
```
It is not necessary to export classes that are already referenced by the entrypoint file(s), as these will be loaded and decorated methods will be registered.
You can also define multiple entrypoint files using the `runtimeConfig` section of the [configuration](../reference/configuration#runtime).

As for the rest of the directory:

- `src/operations.test.ts` contains example unit tests written with [Jest](https://jestjs.io/) and our [testing runtime](../tutorials/testing-tutorial.md). `jest.config.js` contains Jest configuration.
- `knexfile.js` is a configuration file for [Knex](https://knexjs.org), which we use as a query builder and migration tool.
- `migrations` is initialized with a Knex database migration used in the [quickstart guide](../../getting-started/quickstart).  You can replace this with your own migration files.
- `node_modules`, `package.json`, `package-lock.json`, and `tsconfig.json` are needed by all Node/Typescript projects. `eslint.config.js` is used by the JavaScript/TypeScript linter, [ESLint](https://eslint.org/).
- `start_postgres_docker.js` is a convenience script that initializes a Docker Postgres container for use in the [quickstart](../../getting-started/quickstart). You can modify this script if you want to use Docker-hosted Postgres for local development.
