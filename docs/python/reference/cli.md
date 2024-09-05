---
sidebar_position: 5
title: DBOS CLI
---

## Commands

### dbos start

Start your DBOS application by executing the start command defined in [`dbos-config.yaml`](./configuration.md#runtime).
DBOS Cloud uses this command as an entrypoint to start your app.

### dbos migrate

Run all database schema migration commands defined in [`dbos-config.yaml`](./configuration.md#database).
DBOS Cloud uses this command during application deployment to migrate your database schema.

### dbos init

Initialize the local directory with a DBOS template application.

**Parameters:**
- `<application-name>`: The name of your application. If not specified, will be prompted for.
- `--template, -t <str>`: Specify a template to use. Currently, we support only the basic "hello" template, which is used by default.
- `--config, -c`: If this flag is passed in, only the `dbos-config.yaml` file is added from the template. Useful to add DBOS to an existing project.


