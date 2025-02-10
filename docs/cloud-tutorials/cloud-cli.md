---
sidebar_position: 30
title: Cloud CLI Reference
description: DBOS Cloud CLI reference
pagination_next: null
---

## Installation

To globally install the DBOS Cloud CLI, run the following command:

```
npm install -g @dbos-inc/dbos-cloud@latest
```

## User Management Commands

### `dbos-cloud register`

**Description:**
This command creates and registers a new DBOS Cloud account.
It provides a URL to a secure login portal you can use to create an account from your browser.

**Parameters:**
- `-u, --username <string>`: Your DBOS Cloud username. Must be between 3 and 30 characters and contain only lowercase letters, numbers, and underscores (`_`).
- `-s, --secret [string]`: (Optional) An [organization secret](../cloud-tutorials/account-management.md#organization-management) given to you by an organization admin. If supplied, adds your newly registered account to the organization.


:::info
If you register with an email and password, you also need to verify your email through a link we email you.
:::

---

### `dbos-cloud login`

**Description:**
This command logs you in to your DBOS Cloud account.
It provides a URL to a secure login portal you can use to authenticate from your browser.

:::info
When you log in to DBOS Cloud from an application, a token with your login information is stored in the `.dbos/` directory in your application package root.
:::

---

### `dbos-cloud logout`

**Description:**
This command logs you out of your DBOS Cloud account.

---

## Database Instance Management Commands

### `dbos-cloud db provision`

**Description:**
This command provisions a Postgres database instance to which your applications can connect.

**Parameters:**
- `<database-instance-name>`: The name of the database instance to provision. Must be between 3 and 30 characters and contain only lowercase letters, numbers, underscores, and dashes.
- `-U, --username <string>`: Your username for this database instance.  Must be between 3 and 16 characters and contain only lowercase letters, numbers, and underscores.
- `-W, --password [string]`: Your password for this database instance. If not provided, will be prompted on the command line. Passwords must contain 8 or more characters.

---

### `dbos-cloud db list`

**Description:**
This command lists all Postgres database instances provisioned by your account.

**Parameters:**
- `--json`: Emit JSON output

**Output:**
For each provisioned Postgres database instance, emit:
- `PostgresInstanceName`: The name of this database instance.
- `HostName`: The hostname of this database instance.
- `Port`: The connection port for this database instance.
- `Status`: The current status of this database instance (available or unavailable).
- `AdminUsername`: The administrator username for this database instance.

---

### `dbos-cloud db status`

**Description:**
This command retrieves the status of a Postgres database instance

**Parameters:**
- `<database-instance-name>`: The name of the database instance whose status to retrieve.
- `--json`: Emit JSON output

**Output:**
- `PostgresInstanceName`: The name of the database instance.
- `HostName`: The hostname of the database instance.
- `Port`: The connection port for the database instance.
- `Status`: The current status of the database instance (available or unavailable).
- `AdminUsername`: The administrator username for the database instance.

---

### `dbos-cloud db reset-password`

**Description:**
This command resets your password for a Postgres database instance.

**Parameters:**
- `[database-instance-name]`: The name of the database instance to provision.
- `-W, --password [string]`: Your new password for this database instance. If not provided, will be prompted on the command line. Passwords must contain 8 or more characters.

---

### `dbos-cloud db destroy`

**Description:**
This command destroys a previously-provisioned Postgres database instance.

**Parameters:**
- `<database-instance-name>`: The name of the database instance to destroy.

---

### `dbos-cloud db local`

**Description:**
Configure `dbos-config.yaml` to use a DBOS Cloud Postgres server for local development.
This command also sets the `local_suffix` field in `dbos-config.yaml`, so your application will suffix its application database name with `_local` while running locally.
This isolates the database you use for local development from the database used by your app deployed to DBOS Cloud even though both use the same Postgres server.


**Parameters:**
- `[database-instance-name]`: The name of the database instance to which to connect.
- `-W, --password [string]`: Your password for this database instance. If not provided, will be prompted on the command line.

---

### `dbos-cloud db connect`

**Description:**
This command loads your cloud database's connection parameters into your local `dbos-config.yaml`.

**Parameters:**
- `[database-instance-name]`: The name of the database instance to which to connect.
- `-W, --password [string]`: Your password for this database instance. If not provided, will be prompted on the command line.

---

### `dbos-cloud db restore`

**Description:**
This command performs [PostgreSQL point-in-time-recovery](https://www.postgresql.org/docs/current/continuous-archiving.html) to create a new database instance containing the state of your database instance at a previous point in time.
After restoration is complete, we recommend using [`change-database-instance`](#dbos-cloud-app-change-database-instance) to redeploy your applications to the new database instance, then [destroying](#dbos-cloud-db-destroy) the original.

**Parameters:**
- `<database-instance-name>`: The name of the database instance to restore from.
- `-t, --restore-time <string>`: The timestamp to restore from, in [RFC3339 format](https://datatracker.ietf.org/doc/html/rfc3339). Must be within the backup retention period of your database (24 hours for free-tier users).
- `-n, --target-name <string>`: The name of the new database instance to create.
---

### `dbos-cloud db link`

**Description:**
This command links your own Postgres database instance to DBOS Cloud.
Before running this command, please first follow our [tutorial](../cloud-tutorials/byod-management) to set up your Postgres database.

:::info
This feature is currently only available to [DBOS Pro or Enterprise](https://www.dbos.dev/pricing) subscribers.
:::

**Parameters:**
- `<database-instance-name>`: The name of the database instance to link. Must be between 3 and 30 characters and contain only lowercase letters, numbers, underscores, and dashes.
- `-H, --hostname <string>`: The hostname for your Postgres database instance (required).
- `-p, --port [number]`: The connection port for your Postgres database instance (default: `5432`).
- `-W, --password [string]`: The password for the `dbosadmin` role. If not provided, will be prompted on the command line. Passwords must contain 8 or more characters.
- `--enable-timetravel`: Enable time travel for your database instance.

---

### `dbos-cloud db unlink`

**Description:**
This command unlinks a previously linked Postgres database instance.

**Parameters:**
- `<database-instance-name>`: The name of the database instance to unlink.

---

## Application Management Commands

### `dbos-cloud app deploy`

**Description:**
This command must be run from an application root directory.
It executes the migration commands declared in `dbos-config.yaml`, deploys the application to DBOS Cloud (or updates its code if already deployed), and emits the URL at which the application is hosted, which is `https://<username>-<app-name>.cloud.dbos.dev/`.

**Parameters:**
- `[application-name]`: The name of the application to deploy. By default we obtain the application name from `dbos-config.yaml`. This argument overrides the package name.
- `-d, --database <string>`: The name of the Postgres database instance to which this application will connect. This may only be set the first time an application is deployed and cannot be changed afterwards.
- `--enable-timetravel`: Enable experimental time travel for this application. This may only be set the first time an application is deployed and cannot be changed afterwards.
- `--verbose`: Logs debug information about the deployment process, including config file processing and files sent.
- `-p, --previous-version [number]`: The ID of a previous version of this application. If this is supplied, redeploy that version instead of deploying from the application directory. This will fail if the previous and current versions have different database schemas. You can list previous versions and their IDs with the [versions command](#dbos-cloud-app-versions).

---

### `dbos-cloud app update`

**Description:**
Update an application metadata in DBOS Cloud.

**Parameters:**
- `[application-name]`: The name of the application to update.
- `--executors-memory-mib`: The amount of RAM, in MiB, to allocate to the application's executors. This value must be between 512 and 5120. This feature requires a DBOS Pro subscription.

:::info
This command does not trigger a redeployment of the application. To apply changes affecting the application's executors, you must redeploy the application with [`dbos-cloud app deploy`](#dbos-cloud-app-deploy).
:::

---

### `dbos-cloud app delete`

**Parameters:**
- `[application-name]`: The name of the application to delete.
- `--dropdb`: Drop the application's database during deletion.

**Description:**
Delete an application from DBOS Cloud.
If run in an application root directory with no application name provided, delete the local application.

By default, this command does not drop your application's database. You can use the `--dropdb` parameter to drop your application's database (not the Postgres instance) and delete all application data.
To destroy the previously-provisioned Postgres instance, please use [`dbos-cloud db destroy`](#dbos-cloud-db-destroy).

---

### `dbos-cloud app list`

**Description:**
List all applications you have registered with DBOS Cloud.

**Parameters:**
- `--json`: Emit JSON output

**Output:**
For each registered application, emit:
- `Name`: The name of this application
- `ID`: The unique ID DBOS Cloud assigns to this application.
- `PostgresInstanceName`: The Postgres database instance to which this application is connected.
- `ApplicationDatabaseName`: The database on this instance on which this application stores data.
- `Status`: The current status of this application (available or unavailable).
- `Version`: The currently deployed version of this application.
- `AppURL`: The URL at which the application is hosted.
---

### `dbos-cloud app status`

**Parameters:**
- `[application-name]`: The name of the application to retrieve.

**Description:**
Retrieve an application's status.
If run in an application root directory with no application name provided, retrieve the local application's status.


**Parameters:**
- `--json`: Emit JSON output

**Output:**
- `Name`: The name of this application
- `ID`: The unique ID DBOS Cloud assigns to this application.
- `PostgresInstanceName`: The Postgres database instance to which this application is connected.
- `ApplicationDatabaseName`: The database on this instance on which this application stores data.
- `Status`: The current status of this application (available or unavailable).
- `Version`: The currently deployed version of this application.
- `AppURL`: The URL at which the application is hosted.
---

### `dbos-cloud app versions`

**Parameters:**
- `[application-name]`: The name of the application to retrieve.

**Description:**
Retrieve a list of an application's past versions.
A new version is created each time an application is deployed.
If run in an application root directory with no application name provided, retrieve versions of the local application.

**Parameters:**
- `--json`: Emit JSON output

**Output:**
For each previous version of this application, emit:
- `ApplicationName`: The name of this application.
- `Version`: The ID of this version.
- `CreationTime`: The timestamp (in UTC with [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339) format) at which this version was created.
---

### `dbos-cloud app logs`

**Description:**
It retrieves an application's logs.

**Parameters:**
- `[application-name]`: The name of the application.
- `-l, --last <integer>`: How far back to query, in seconds from current time. By default, retrieve all data.
---

### `dbos-cloud app change-database-instance`

**Description:**
This command must be run from an application root directory.
It redeploys the application to a new database instance.
It is meant to be used with [`database restore`](#dbos-cloud-db-restore) during disaster recovery to transfer the application to the restored database instance.

**Parameters:**
- `--verbose`: Logs debug information about the deployment process, including config file processing and files sent.
- `-d, --database <string>` The name of the new database instance for this application.
- `-p, --previous-version [number]`: The ID of a previous version of this application. If this is supplied, redeploy that version instead of deploying from the application directory. During restoration, we recommend deploying to the version active at the timestamp to which you recovered. You can list previous versions and their IDs and timestamps with the [versions command](#dbos-cloud-app-versions).

---

### `dbos-cloud app secrets create`

**Description:**
Create a new secret associated with an application, or update an existing secret.
Secrets are made available to your application as environment variables.
You must redeploy your application for a change in its secrets to take effect.

**Parameters:**
- `[application-name]`: The name of the application for which to create or update secrets.
- `-s, --secretname <string>` The name of the secret to create or update.
- `-v, --value`: The value of the secret.


### `dbos-cloud app secrets import`

**Description:**
Import all environment variables defined in a `.env` file as secrets, updating them if they already exist.
Allowed syntax for the `.env` file is described [here](https://dotenvx.com/docs/env-file), note that interpolation is supported but command substitution and encryption are currently not.
Secrets are made available to your application as environment variables.
You must redeploy your application for a change in its secrets to take effect.

**Parameters:**
- `[application-name]`: The name of the application for which to import secrets.
- `-d, --dotenv <string>` Path to the `.env` file to import.

---

### `dbos-cloud app secrets list`

**Description:**
List all secrets associated with an application (only their names, not their values).

**Parameters:**
- `[application-name]`: The name of the application for which to list secrets.

---

## Organization Management Commands

### `dbos-cloud org list`

**Description:**
List users in your organization

**Parameters:**
- `--json`: Emit JSON output

---

### `dbos-cloud org invite`

**Description:**
Generate an organization secret with which to invite another user into your organization. Organization secrets are single-use and expire after 24 hours.

**Parameters:**
- `--json`: Emit JSON output

---

### `dbos-cloud org join`

**Description:**
Join your account to an organization. This gives you full access to the organization's resources.

**Parameters:**
- `<organization>`: The name of the organization you intend to join.
- `<secret>`: An organization secret given to you by an organization admin.
---

### `dbos-cloud org rename`

**Description:**
Rename your organization. Only the organization admin (the original creator of the organization) can run this command. After running this command, [log out](#dbos-cloud-logout) and [log back in](#dbos-cloud-login) to refresh your local context.

**Parameters:**
- `<oldname>`: The current name of your organization.
- `<newname>`: The new name for your organization.

:::info
Applications belonging to organizations are hosted at the URL `https://<organization-name>-<app-name>.cloud.dbos.dev/`, so renaming your organization changes your application URLs. The old URLs are no longer accessible.
:::

---

### `dbos-cloud org remove`

**Description:**
Remove a user from an organization. Only the organization admin (the original creator of the organization) can run this command.

**Parameters:**
- `<username>`: The user to remove from your organization.
---

## Workflow Management Commands

### `dbos-cloud workflow list`

**Description:**
List workflows run by your application in JSON format ordered by recency (most recently started workflows last).

**Arguments:**
- `[application-name]`: The name of your application
- `-l, --limit <number>`                Limit the results returned (default: "10")
- `-o, --offset <number>`               Skip workflows from the results returned.
- `-u, --workflowUUIDs <uuid...>  `     Retrieve specific UUIDs
- `-U, --user <string>`                 Retrieve workflows run by this user
- `-s, --start-time <string>`           Retrieve workflows starting after this timestamp (ISO 8601 format)
- `-e, --end-time <string>`             Retrieve workflows starting before this timestamp (ISO 8601 format)
- `-S, --status <string>`               Retrieve workflows with this status (`PENDING`, `SUCCESS`, `ERROR`, `RETRIES_EXCEEDED`, `ENQUEUED`, or `CANCELLED`)
- `-v, --application-version <string>`  Retrieve workflows with this application version
- `-n, --name <string>`        Retrieve functions with this name

---

### `dbos-cloud workflow queue list`

**Description:**
Lists all currently enqueued functions in JSON format ordered by recency (most recently enqueued functions last).

**Arguments:**
- `[application-name]`: The name of your application
- `-n, --name <string>`        Retrieve functions with this name
- `-s, --start-time <string>`  Retrieve functions starting after this timestamp (ISO 8601 format)
- `-e, --end-time <string>`    Retrieve functions starting before this timestamp (ISO 8601 format)
- `-S, --status <string>`               Retrieve workflows with this status (`PENDING`, `SUCCESS`, `ERROR`, `RETRIES_EXCEEDED`, `ENQUEUED`, or `CANCELLED`)
- `-l, --limit <number>`       Limit the results returned
- `-o, --offset <number>`      Skip functions from the results returned (for pagination)
- `-q, --queue <string>`       Retrieve functions run on this queue
