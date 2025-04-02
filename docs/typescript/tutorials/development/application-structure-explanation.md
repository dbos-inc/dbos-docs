---
sidebar_position: 10
title: Project Structure
description: Learn about the structure of a DBOS project
pagination_next: null
---

When you initialize a DBOS project with `npx @dbos-inc/create` (such as the `dbos-knex` starter here), it typically has the following structure:

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

As most of these files are common to any TypeScript / NodeJS project, the most interesting files are `main.ts` and `dbos-config.yaml`.

`src/main.ts` contains the application's source code.

`dbos-config.yaml` tells DBOS how to run the program.  Application execution begins in `main.ts` because the [_start command_](#projects-with-start-commands) defined in `dbos-config.yaml` is `node dist/main.js`, which tells Node to execute the compiled JavaScript file for `src/main.ts`.
`dbos-config.yaml` also defines the configuration of a DBOS project, including database connection information, migration configuration, and global logging configuration.
All options are documented in our [configuration reference](../../reference/configuration).


### Projects With Start Commands
`dbos-config.yaml` may contain a `start` command.  If so, this command will be used to start the application.
```yaml
runtimeConfig:
  start:
    - node dist/main.js
```

Note that this start command references a `.js` file, which gets created from `main.ts` as part of the `build` command in `package.json`.  The code in `main.ts` will [do setup and launch DBOS](../../reference/transactapi/dbos-class.md#application-lifecycle).


### Projects With Entrypoints
Other templates will be similar, but may have additional files under `src/`:
```
├── src/
│   |── main.ts
│   └── operations.ts
```

In this structure, `src/operations.ts` is an _entrypoint_ file, where DBOS looks for event handlers, such as [scheduled workflows](../scheduled-workflows), [kafka consumers](../requestsandevents/kafka-integration), or, if you are using DBOS's built in Koa server, [request handlers](../requestsandevents/http-serving-tutorial).
At startup, the DBOS runtime automatically loads all classes that are exported or (directly and indirectly) referenced from these files, registering their decorated functions and serving any endpoints.

The entrypoints are listed in the [`runtimeConfig` section of `dbos-config.yaml`](../../reference/configuration#runtime-section):

```yaml
runtimeConfig:
  entrypoints:
    - dist/operations.js
```

Note that, as with the [start command](#projects-with-start-commands), the `entrypoints` are compiled JavaScript files, rather than the original source `.ts` files.  These files are produced by the `build` command in `package.json`.

It is not necessary to add entrypoints for files that are already referenced by the start command or other entrypoint file(s), as these will be loaded and decorated methods will be registered automatically.

### Other Files
As for the rest of the directory:

- `src/main.test.ts` contains example unit tests written with [Jest](https://jestjs.io/). `jest.config.js` contains Jest configuration.
- `knexfile.js` is a configuration file for [Knex](https://knexjs.org), which this app uses as a query builder and migration tool.
- `migrations` is initialized with a Knex database migration.
- `node_modules`, `package.json`, `package-lock.json`, and `tsconfig.json` are needed by all Node/TypeScript projects. `eslint.config.js` is used by the JavaScript/TypeScript linter, [ESLint](https://eslint.org/).
- `start_postgres_docker.js` is a convenience script that initializes a Docker Postgres container.
