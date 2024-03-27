---
sidebar_position: 1
title: DBOS Cloud CLI
description: DBOS Cloud CLI reference
---

The DBOS Cloud CLI helps you serverlessly run your applications on DBOS Cloud.

## Installation

To install the latest Cloud CLI version for your application, run the following command in your package root:

```
npm install @dbos-inc/dbos-cloud@latest
```

## User Management Commands

### `npx dbos-cloud register`

**Description:**
This command creates and registers a new DBOS Cloud account.
It provides a URL to a secure login portal you can use to create an account from your browser.

**Parameters:**
- `-u, --username <string>`: Your DBOS Cloud username. Must be between 3 and 30 characters and contain only lowercase letters, numbers, and underscores (`_`).

:::info
If you register with an email and password, you also need to verify your email through a link we email you.
:::

---

### `npx dbos-cloud login`

**Description:**
This command logs you in to your DBOS Cloud account.
It provides a URL to a secure login portal you can use to authenticate from your browser.

:::info
When you log in to DBOS Cloud from an application, a token with your login information is stored in the `.dbos/` directory in your application package root.
:::

---

### `npx dbos-cloud logout`

**Description:**
This command logs you out of your DBOS Cloud account.

---

## Database Instance Management Commands

### `npx dbos-cloud db provision`

**Description:**
This command provisions a Postgres database instance to which your applications can connect.

**Parameters:**
- `<database-instance-name>`: The name of the database instance to provision. Must be between 3 and 30 characters and contain only lowercase letters, numbers, underscores, and dashes.
- `-U, --username <string>`: Your username for this database instance.  Must be between 3 and 16 characters and contain only lowercase letters, numbers, and underscores.
- `-W, --password [string]`: Your password for this database instance. If not provided, will be prompted on the command line. Passwords must contain 8 or more characters.

---

### `npx dbos-cloud db list`

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

### `npx dbos-cloud db status`

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

### `npx dbos-cloud db reset-password`

**Description:**
This command resets your password for a Postgres database instance.

**Parameters:**
- `<database-instance-name>`: The name of the database instance to provision.
- `-W, --password [string]`: Your new password for this database instance. If not provided, will be prompted on the command line. Passwords must contain 8 or more characters.

---

### `npx dbos-cloud db destroy`

**Description:**
This command destroys a previously-provisioned Postgres database instance.

**Parameters:**
- `<database-instance-name>`: The name of the database instance whose status to retrieve.

---

## Application Management Commands

### `npx dbos-cloud app register`

**Description:**
This command must be run from an application root directory.
It registers that application with DBOS Cloud.

**Parameters:**
- `-d, --database <string>`: The name of the Postgres database instance to which this application will connect.

---

### `npx dbos-cloud app deploy`

**Description:**
This command must be run from an application root directory.
It executes the [migration commands declared in dbos-config.yaml](./configuration#database), deploys the application to DBOS Cloud (or updates its code if already deployed), and emits the URL at which the application is hosted, which is `https://<username>-<app-name>.cloud.dbos.dev/`.

---

### `npx dbos-cloud app rollback`

**Description:**
This command must be run from an application root directory.
It executes the [rollback commands declared in dbos-config.yaml](./configuration#database), updates the deployed application's code, and emits the URL at which the application is hosted, which is `https://<username>-<app-name>.cloud.dbos.dev/`.

---

### `npx dbos-cloud app delete`

**Parameters:**
- `[application-name]`: The name of the application to delete.

**Description:**
Delete an application from DBOS Cloud.
If run in an application root directory with no application name provided, delete the local application.

---

### `npx dbos-cloud app list`

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

### `npx dbos-cloud app status`

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

### `npx dbos-cloud app logs`

**Description:**
This command must be run from an application root directory.
It retrieves that application's logs.

**Parameters:**
- `-l, --last <integer>`: How far back to query, in seconds from current time. By default, retrieve all data.
