---
sidebar_position: 2
title: Configuration
description: DBOS configuration reference
---

You can configure a DBOS runtime with a configuration file.
By default, DBOS looks for a file named `dbos-config.yaml` at the project's root.
You can provide the path to a custom configuration file using the [CLI](./cli).

The configuration file must be valid [YAML](https://yaml.org/) conforming to the schema described below.

::::info
You can use environment variables for configuration values through the syntax `key: ${VALUE}`.
We strongly recommend using an environment variable for the database password field, as demonstrated below.
::::

---

### Database

The database section is used to set up the connection to the database.
DBOS currently only supports Postgres-compatible databases.
Every field is required unless otherwise specified.

- **hostname**: Database server hostname. For local deployment only, not used in DBOS Cloud.
- **port**: Database server port. For local deployment only, not used in DBOS Cloud.
- **username**: Username with which to connect to the database server. For local deployment only, not used in DBOS Cloud.
- **password**: Password with which to connect to the database server.  We recommend using an environment variable for this field, instead of plain text. For local deployment only, not used in DBOS Cloud.
- **app_db_name**: Name of the application database.
- **app_db_client** (optional): Client to use for connecting to the application database. Must be either `knex` or `typeorm`.  Defaults to `knex`.  The client specified here is the one used in [`TransactionContext`](../api-reference/contexts#transactioncontextt).
- **ssl_ca** (optional): If using SSL/TLS to securely connect to a database, path to an SSL root certificate file.  Equivalent to the [`sslrootcert`](https://www.postgresql.org/docs/current/libpq-ssl.html) connection parameter in `psql`.
- **connectionTimeoutMillis** (optional): Database connection timeout in milliseconds. Defaults to `3000`.
- **migrate** (optional): A list of commands to run to apply your application's schema to the database. We recommend using a migration tool like those built into [Knex](https://knexjs.org/guide/migrations.html) and [TypeORM](https://typeorm.io/migrations).
- **rollback** (optional) A list of commands to run to roll back the last batch of schema migrations.

**Example**:

```yaml
database:
  hostname: 'localhost'
  port: 5432
  username: 'postgres'
  password: ${PGPASSWORD}
  app_db_name: 'hello'
  app_db_client: 'knex'
  migrate: ['npx knex migrate:latest']
  rollback: ['npx knex migrate:rollback']
```

---

### Runtime

This section is used to specify DBOS runtime parameters.

- **port** (optional): The port from which to serve your functions. Defaults to `3000`. Using [`npx @dbos-inc/dbos-sdk start -p <port>`](./cli#npx-dbos-sdk-start) overrides this config parameter.
- **entrypoint** (optional): The compiled Javascript file where DBOS looks for your application's code. At startup, the DBOS runtime automatically loads all classes exported from this file, serving their endpoints and registering their decorated functions.  Defaults to `dist/operations.js`. Using [`npx @dbos-inc/dbos-sdk start -e <entrypoint-file>`](./cli#npx-dbos-sdk-start) overrides this config parameter.

**Example**:

```yaml
runtimeConfig:
  port: 6000 # Optional, defaults to 3000
  entrypoint: 'dist/operations.js' # (default)
```
---

### Application

Applications can optionally use the application configuration to define custom properties as key-value pairs.
These properties can be retrieved from any [context](./contexts) via the [`getConfig`](../api-reference/contexts#ctxtgetconfigkey-defaultvalue) method.

**Example**:
```yaml
application:
  PAYMENTS_SERVICE: 'http://stripe.com/payment'
```

---

### Telemetry

You can use the configuration file to tune the behavior of DBOS logging facility.
Note all options in this section are optional and will, if not specified, use the default values indicated in the example below.

#### Logs
- **logLevel**: Filters, by severity, what logs should be printed. Defaults to `'info'`. Using [`npx @dbos-inc/dbos-sdk start -l <logLevel>`](./cli#npx-dbos-sdk-start) overrides this config parameter.
- **addContextMetadata**: Enables the addition of contextual information, such as workflow identity UUID, to each log entry. Defaults to `true`.
- **silent**: Silences the logger. Defaults to `false`.

**Example**:

```yaml
telemetry:
  logs:
    logLevel: 'info' # info (default) | debug | warn | emerg | alert | crit | error
    addContextMetadata: true # true (default) | false
    silent: false # false (default) | true
```

--- 

### Configuration Schema File

There is a schema file available for the DBOS configuration file schema [in our GitHub repo](https://raw.githubusercontent.com/dbos-inc/dbos-ts/main/dbos-config.schema.json).
This schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.
For example, the Visual Studio Code [RedHat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) provides tooltips, statement completion and real-time validation for editing DBOS config files. 
This extension provides [multiple ways](https://github.com/redhat-developer/vscode-yaml#associating-schemas) to associate a YAML file with its schema.
The easiest is to simply add a comment with a link to the schema at the top of the config file:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/dbos-inc/dbos-ts/main/dbos-config.schema.json
```
