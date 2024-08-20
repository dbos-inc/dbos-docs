---
sidebar_position: 8
title: Best practices
description: DBOS Cloud Tips
---

### Registering a new user
* New users need to be signed up with DBOS Cloud (through auth0) before registering a Cloud account.
* New users will be assigned their eponymous organization by default. See [organizations](account-management#organization-management) for more information about organizations.

### Refresh tokens
The preferred way to programmatically authenticate with DBOS Cloud is to use refresh tokens. Note they:
* Expire after a year or a month of inactivity.
* Can be revoked using the [DBOS Cloud CLI](account-management#authenticating-programatically).

## Time travel
* Time travel will result in the creation of a [new database](../api-reference/system-tables#provenance-tables) called `<app_db_name>_dbos_prov` in the database server.

