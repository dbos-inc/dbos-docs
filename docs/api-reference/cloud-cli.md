---
sidebar_position: 1
title: Cloud CLI
description: DBOS Cloud CLI reference
---

The DBOS Cloud CLI helps you serverlessly run your applications on DBOS Cloud

## User Management Commands

### `npx dbos-cloud register`

**Description:**  
This command creates and registers a new DBOS Cloud account.
It provides a URL to a secure login portal you can use to create an account from your browser.

**Parameters:**  
- `-u, --username <string>`: Your DBOS Cloud username.

:::tip

If you register with an email and password, you'll also need to verify your email through a link we automatically send.

:::

---

### `npx dbos-cloud login`

**Description:**  
This command logs you in to your DBOS Cloud account.
It provides a URL to a secure login portal you can use to authenticate from your browser.

---

### `npx dbos-cloud logout`

**Description:**  
This command logs you out of your DBOS Cloud account.

---

## Database Instance Management Commands

### `npx dbos-cloud database provision <database-instance-name>`

**Description:**  
This command provisions a Postgres database instance to which your applications can connect.

**Parameters:**  
- `<database-instance-name>`: The name of the database instance to provision.
- `-a, --admin <string>`: The administrator username for this database instance.
- `-W, --password <string>`: The administrator password for this database instance.

---

### `npx dbos-cloud database list`

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

### `npx dbos-cloud database status <database-instance-name>`

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

### `npx dbos-cloud database destroy <database-instance-name>`

**Description:**  
This command destroys a previously-provisioned Postgres database instance.

**Parameters:**  
- `<database-instance-name>`: The name of the database instance whose status to retrieve.

---

## Application Management Commands

### `npx dbos-cloud application register`

**Description:**  
This command must be run from an application root directory.
It registers that application with DBOS Cloud.

**Parameters:**  
- `-d, --database <string>`: The name of the Postgres database instance to which this application will connect.

---

### `npx dbos-cloud application deploy`

**Description:**  
This command must be run from an application root directory.
It deploys the application to DBOS Cloud and emits the URL at which the application is hosted, which is `https://cloud.dbos.dev/apps/<username>/<application-name>`.

---

### `npx dbos-cloud application delete`

**Description:**  
This command must be run from an application root directory.
It deletes the application from DBOS Cloud.

---

### `npx dbos-cloud application list`

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

### `npx dbos-cloud application status`

**Description:**  
This command must be run from an application root directory.
It retrieves that application's status.

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

### `npx dbos-cloud application logs`

**Description:**  
This command must be run from an application root directory.
It retrieves that application's logs.

**Parameters:**  
- `-l, --last <integer>`: How far back to query, in seconds from current time. By default, retrieve all data.