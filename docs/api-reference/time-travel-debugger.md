---
sidebar_position: 9
title: Time Travel Debugger
description: DBOS Time Travel Debugger VS Code extension reference
---

The DBOS Time Travel Debugger VS Code extension enables you to debug your production application deployed on DBOS Cloud.

## Installation

For VS Code setup instructions, please see Microsoft's [official documentation](https://code.visualstudio.com/docs/setup/setup-overview).

The DBOS Time Travel Debugger Extension can be installed via the
[VS Code Marketplace website](https://marketplace.visualstudio.com/items?itemName=dbos-inc.dbos-ttdbg)
or by searching the 
[VS Code Extension Marketplace](https://code.visualstudio.com/docs/editor/extension-marketplace)
for "DBOS".

## Commands

These commands can be invoked via the [VS Code Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).

### DBOS: Log into DBOS Cloud

The time travel debugger needs information about the application and its database from DBOS cloud. 
While this information can be provided via configuration settings described below, the extension can retrieve this information via the
[DBOS Cloud CLI](../api-reference/cloud-cli). This command runs [`npx dbos-cloud login`](../api-reference/cloud-cli#npx-dbos-cloud-login)
on your behalf from inside VS Code.

Typically, the time travel debugger will automatically prompt you to login to DBOS cloud if you're not logged in or your credentials have expired.
However, this command can also be executed explicitly.

### DBOS: Delete Stored Application Database Passwords

The time travel debugger needs your DBOS database name and password in order to access your database history.
The first time a DBOS application is time travel debugged, the developer is asked for the database password.
The provided database password is saved in VS Code's secrets storage so the developer doesn't have to enter it every time they time travel debug.
This command deletes any stored DBOS database passwords associated with the current workspace.

:::note
The database password is different from the DBOS Cloud login credentials. 
Please see [Cloud Database Management](../cloud-tutorials/database-management) for more information.
:::

### DBOS: Shutdown Debug Proxy

The time travel debugger relies on Debug Proxy utility to project the state of the database as it existed when a selected workflow started.
The extension automatically launches the Debug Proxy the first time a DBOS application is time travel debugged. 
The debug proxy process is automatically shut down when VS Code shuts down, but this command can be used to shut down the debug proxy process manually.

## Configuration

Some behavior of the extension can be controlled via [VS Code Settings](https://code.visualstudio.com/docs/getstarted/settings).

### dbos-ttdbg.debug_proxy_port

The Debug Proxy listens on port 2345 by default. This port can be changed via the `dbos-ttdbg.debug_proxy_port` configuration setting.

### DBOS Cloud Database Connection

Typically, the time travel debugger retrieves database connection information via [DBOS Cloud CLI](./cloud-cli). 
However, the developer can specify this information directly via 
[VS Code settings](https://code.visualstudio.com/docs/getstarted/settings), bypassing the need to use DBOS Cloud CLI.

:::note
For security reasons, the database password cannot be specified via VS Code settings.
:::

* [dbos-ttdbg.prov_db_host](https://www.postgresql.org/docs/16/libpq-connect.html#LIBPQ-CONNECT-HOST)
* [dbos-ttdbg.prov_db_port](https://www.postgresql.org/docs/16/libpq-connect.html#LIBPQ-CONNECT-PORT)
* [dbos-ttdbg.prov_db_database](https://www.postgresql.org/docs/16/libpq-connect.html#LIBPQ-CONNECT-DBNAME)
* [dbos-ttdbg.prov_db_user](https://www.postgresql.org/docs/16/libpq-connect.html#LIBPQ-CONNECT-USER)