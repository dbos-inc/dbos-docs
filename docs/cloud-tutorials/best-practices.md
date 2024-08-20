---
sidebar_position: 8
title: Best practices
description: DBOS Cloud Tips
---

## Application databases

:::tip
Application databases are databases within a Postgres database instance (server).
:::

* Application databases cannot be shared across applications.
* An application cannot change its database once deployed. You can delete the application and re-deploy with a new database name.

### Database roles
* DBOS Cloud will create the following roles for each application:
    * `dbosadmin` - a privileged role used to execute your schema migration steps during application deployment.
    * `dbos_role` - a role you can provide when provisioning the database instance. Defaults to `dbos_role`. This role has:
        * a CREATE grant on the application database.
        * `pg_read_all_data` and `pg_write_all_data` grants.
        * an ALL PRIVILEGES grant on all schemas and [base tables](https://www.postgresql.org/docs/current/infoschema-tables.html#INFOSCHEMA-TABLES) in the database instance, expect for the schemas `pg_catalog`, `information_schema`, `dbos` or `pg_toast` schemas.
        * ownership on all base tables in the database instance.
    * `dbosproxyrole` - a read-only role used during [DBOS Time Travel Debugging](timetravel-debugging).

* You can reset the password of the `dbos_role` you provided when provisioning the database instance.
* You can configure your local `dbos-config.yaml` to point to your database instance using the [DBOS Cloud CLI](database-management). This will use your `dbos_role`.

### Schema migrations
* You can instruct DBOS Cloud to run [migration commands](../api-reference/configuration#database) during application deploy. These are handled by `dbosadmin`. You can use them to install extensions, create tables, etc.
* For more complex operations, you can use the DBOS Cloud CLI to connect to your database and run migrations manually.

### System databases
* DBOS Transact relies on a _system database_ to store metadata about the application. This database name is `<app_db_name>_dbos_sys` and cannot be configured when running on DBOS Cloud.

## Database instances

### Provisioning instances
* Provisioning instances is an asynchronous process. You can check the status of the instance with `npx dbos-cloud db status <database-instance-name>`.

### Linked databases (BYODB)
* DBOS Cloud will not configure `dbos_role` for linked database.
* DBOS Cloud will not provide a default SSL certificate for linked database [FIXME: what is the expected flow here?].

## Users and organizations

* After logging in with DBOS Cloud, a `.dbos` folder is created. It hosts your current session information, including your credentials.

### Registering a new user
* New users need to be signed up with DBOS Cloud (through auth0) before registering a Cloud account.
* New users will be assigned their eponymous organization by default. See [organizations](account-management#organization-management) for more information about organizations.

### Refresh tokens
The preferred way to programmatically authenticate with DBOS Cloud is to use refresh tokens. Note they:
* Expire after a year or a month of inactivity.
* Can be revoked using the [DBOS Cloud CLI](account-management#authenticating-programatically).

## Time travel
* Time travel will result in the creation of a [new database](../api-reference/system-tables#provenance-tables) called `<app_db_name>_dbos_prov` in the database server.

