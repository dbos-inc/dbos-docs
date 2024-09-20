---
sidebar_position: 6
title: DBOS CLI
---

## Commands

### dbos start

Start your DBOS application by executing the `start` command defined in [`dbos-config.yaml`](./configuration.md#runtime).
For example:

```yaml
runtimeConfig:
  start:
    - "fastapi run"
```

DBOS Cloud executes this command to start your app.

### dbos migrate

Run all database schema migration commands defined in [`dbos-config.yaml`](./configuration.md#database).
For example:

```yaml
database:
  migrate:
    - alembic upgrade head
```

DBOS Cloud uses this command during application deployment to migrate your database schema.

### dbos init

Initialize the local directory with a DBOS template application.

**Parameters:**
- `<application-name>`: The name of your application. If not specified, will be prompted for.
- `--template, -t <str>`: Specify a template to use. Currently, we have a single "hello" template, which is used by default.
- `--config, -c`: If this flag is set, only the `dbos-config.yaml` file is added from the template. Useful to add DBOS to an existing project.


