---
sidebar_position: 8
title: Best practices
description: DBOS Cloud Tips
---

A list of tips for using DBOS Cloud effectively.

## Managing applications
* Only one request at a time can manipulate an application and you will get an `application is busy` error if you attempt multiple concurrent modifications. If you get this error, wait for a minute and retry.
* Application names are unique within an [organization](#users-and-organizations).
* Your application is allocated 1GB of disk space, 1CPU and 512MB of RAM.

### Deployment
* An application must be registered before being deployed. DBOS Cloud CLI handles registration automatically when you deploy an application for the first time.
* Interrupting a deployment request - for example, pressing control + C - will *not* cancel the deploy action in DBOS Cloud.
* DBOS Cloud builds your application and will prune all development dependencies. Make sure to explicitly install any runtime dependency you need with `npm install`.
* DBOS Cloud manages an internal version number for your application. You can download specific versions achives using the DBOS Cloud CLI. [TOLINK WHEN MERGED]

### Runtime
* Files on disk are ephemeral. Nothing on the filesystem is persisted between deployments.
* To accomodate long running workflows, DBOS Cloud will keep around VMs running old versions of a workflow when you deploy a new version of the application. This also means you need to be mindful of non-backward compatible database schema changes, as they could break workflows running an older version of the code.

### Deletion
* Deleting an app is an asynchronous process and there is a small delay between a deletion request completing and the application being fully deleted. This means you could hit an "application is busy" error when re-deploying an application you just deleted.
* An application will be deleted once all PENDING workflows -- across all versions -- are completed.
* All application archives -- including previous versions -- will be deleted from DBOS Cloud's artifact store.
* Applications are assigned a [dedicated database role during deployment](#database-roles). Deleting an application will delete this role.
* You can elect to drop the application database alongside deleting an application. This will also delete all the [database roles DBOS Cloud manages on behalf of the application](#database-roles).

### Time travel
Time travel can be enabled when deploying an application for the first time. Existing applications will need to be deleted and re-deployed to enable time travel.
See more information in the [time travel](#time-travel) section.

### Swapping database instance
While an application cannot change database once registered, you can change the database instance (server) hosting the application database. When doing so, you can also decide to redeploy a previous version of the application. This is how DBOS Cloud support [point in time recovery](database-management#database-recovery) today.

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

